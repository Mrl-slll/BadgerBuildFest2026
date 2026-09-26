import { test } from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('./') && !specifier.endsWith('.ts') && !specifier.endsWith('.js') && !specifier.endsWith('.mjs')) {
      return next(`${specifier}.ts`, context);
    }
    return next(specifier, context);
  }
});
const { summarize } = await import('../lib/insights.ts');
const { emptyData, seedData } = await import('../lib/health.ts');
const log=(date,fields={})=>({id:date,userId:'demo-user',date,symptoms:[],doses:{},sideEffects:{},...fields});

test('empty history has no fabricated averages or cycles',()=>{
 const r=summarize(emptyData(),'2026-09-01','2026-09-30');
 assert.equal(r.totalDays,30); assert.equal(r.sleep.value,null); assert.deepEqual(r.cycles,[]); assert.match(r.insights[0],/No entries/);
});
test('deduplicates days, scopes records, and excludes future records',()=>{
 const data=emptyData(); data.logs=[log('2026-09-01',{symptoms:['Acne']}),log('2026-09-01',{symptoms:['Fatigue','Fatigue']}),log('2026-09-02',{userId:'someone-else',energy:5}),log('2026-10-01',{energy:5})];
 data.medications=[{id:'x',userId:'someone-else',startedAt:'2026-09-01'}];
 const r=summarize(data,'2026-09-01','2026-09-30');
 assert.equal(r.logs.length,1); assert.deepEqual(r.frequency,[['Fatigue',1]]); assert.equal(r.medications.length,0);
});
test('missing observations are excluded from averages; zero sleep is retained',()=>{
 const data=emptyData();data.logs=[log('2026-09-01',{sleepMinutes:0,energy:2}),log('2026-09-02',{sleepMinutes:480}),log('2026-09-03')];
 const r=summarize(data,'2026-09-01','2026-09-03');assert.deepEqual(r.sleep,{count:2,value:240});assert.deepEqual(r.energy,{count:1,value:2});assert.equal(r.weeks[0].sleep.count,2);
});
test('cycle includes earlier start but never uses a future start to complete a cycle',()=>{
 const data=emptyData();data.logs=[log('2026-08-01',{periodStart:true}),log('2026-09-10',{periodStart:true}),log('2026-10-20',{periodStart:true})];
 const r=summarize(data,'2026-09-01','2026-09-30');assert.deepEqual(r.cycles.map(c=>c.length),[40,null]);
});
test('medication starts and ends are inclusive and chronological',()=>{
 const data=emptyData();data.medications=[{id:'x',userId:'demo-user',name:'Example',dosage:'1',unit:'mg',frequency:'daily',startedAt:'2026-09-01',endedAt:'2026-09-30'}];
 const r=summarize(data,'2026-09-01','2026-09-30');assert.equal(r.events.length,2);assert.equal(r.events[1].date,'2026-09-30');
});
test('sample cycle intervals reflect actual starts and partial weeks are bounded',()=>{
 const r=summarize(seedData('2026-09-26'),'2026-06-19','2026-09-26');assert.deepEqual(r.cycles.map(c=>c.length),[38,44,null]);assert.equal(r.weeks.at(-1).end,'2026-09-26');
});
test('symptom trends retain separate coverage denominators',()=>{
 const data=emptyData();data.logs=[log('2026-09-01',{symptoms:['Acne']}),log('2026-09-03',{symptoms:[]}),log('2026-09-04',{symptoms:['Acne']})];
 const r=summarize(data,'2026-09-01','2026-09-04');assert.equal(r.earlierDays,1);assert.equal(r.recentDays,2);assert.deepEqual(r.symptomTrends,[{name:'Acne',earlier:1,recent:1}]);
});
