'use client';

import { useState } from 'react';
import { addDays, dateKey, pretty, scoped } from '../lib/health';
import type { HealthData } from '../lib/health';

const layers = ['Bleeding', 'Acne', 'Pain', 'Energy', 'Sleep', 'Medications'] as const;
const layerMeta: Record<typeof layers[number], { scale: string; short: string }> = {
  Bleeding: { scale: 'Recorded', short: 'Bleeding' },
  Acne: { scale: 'Selected', short: 'Acne' },
  Pain: { scale: '0–10', short: 'Pain' },
  Energy: { scale: '1–5', short: 'Energy' },
  Sleep: { scale: 'Hours', short: 'Sleep' },
  Medications: { scale: 'Active period', short: 'Medication' },
};
export default function HealthTimeline({data, compact=false, start:providedStart, end=dateKey()}: {data:HealthData; compact?:boolean; start?:string; end?:string}) {
  const [days,setDays] = useState(30);
  const [visible,setVisible] = useState<string[]>([...layers]);
  const [selected,setSelected] = useState(end);
  const start = providedStart ?? addDays(end,1-days);
  const own = scoped(data);
  const logs = new Map(own.logs.map(l=>[l.date,l]));
  const dates:string[]=[];
  for(let d=start;d<=end;d=addDays(d,1)) dates.push(d);
  const activeDate = selected>=start && selected<=end ? selected : end;
  const tickEvery = dates.length > 120 ? 28 : dates.length > 60 ? 14 : 7;
  const visibleLayers = layers.filter(layer=>visible.includes(layer));
  function value(date:string, layer:typeof layers[number]) {
    const log=logs.get(date);
    if(layer==='Medications') {
      const meds=own.medications.filter(m=>m.startedAt<=date&&(!m.endedAt||m.endedAt>=date));
      return { height:meds.length?35:0, text:meds.map(m=>`${m.name}${m.startedAt===date?' started':''}${m.endedAt===date?' ended':''}; dose: ${log?.doses[m.id]||'not recorded'}`).join('; ')||'No medication period recorded', event:meds.some(m=>m.startedAt===date||m.endedAt===date) };
    }
    if(!log) return {height:0,text:'Not recorded'};
    if(layer==='Bleeding') return {height:log.bleeding&&log.bleeding!=='None'?65:0,text:log.bleeding??'Not recorded'};
    if(layer==='Acne') return {height:log.symptoms.includes('Acne')?60:0,text:log.symptoms.includes('Acne')?'Selected':'Not selected in entry'};
    const n=layer==='Pain'?log.pain:layer==='Energy'?log.energy:log.sleepMinutes;
    const max=layer==='Pain'?10:layer==='Energy'?5:1440;
    return {height:n===undefined?0:Math.max(3,n/max*100),text:n===undefined?'Not recorded':layer==='Sleep'?`${(n/60).toFixed(1)} hours`:`${n} / ${max}`};
  }
  function recordedCount(layer: typeof layers[number]) {
    return dates.filter(date=>value(date,layer).height>0).length;
  }
  return <section className="history-panel" aria-labelledby="timeline-title">
    <div className="timeline-heading"><div><h2 id="timeline-title">Your health, over time</h2><p>Read down a date to see what happened together.</p></div>{!providedStart&&<select name="timeline-range" aria-label="Timeline date range" value={days} onChange={e=>setDays(Number(e.target.value))}><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option><option value={180}>Last 180 days</option></select>}</div>
    <div className="layer-controls" aria-label="Visible timeline layers">{layers.map(layer=>{const isVisible=visible.includes(layer);const count=recordedCount(layer);return <button key={layer} aria-pressed={isVisible} onClick={()=>setVisible(current=>current.includes(layer)?current.filter(item=>item!==layer):[...current,layer])}><span className={`layer-swatch ${layer.toLowerCase()}`} aria-hidden="true"/><span>{layer}</span><small>{count} {count===1?'day':'days'}</small></button>})}</div>
    <div className="timeline-shell">
      <div className="timeline-scroll" role="region" aria-label="Health timeline, scroll horizontally for earlier days" tabIndex={0}><div className="timeline-grid" style={{minWidth:Math.max(720,dates.length*20+132)}}>
        <div className="timeline-axis"><span className="axis-corner">{dates.length} days</span><div className="axis-days" style={{gridTemplateColumns:`repeat(${dates.length}, minmax(0,1fr))`}}>{dates.map((date,index)=>{const isLast=index===dates.length-1;const show=index===0||isLast||(index%tickEvery===0&&dates.length-1-index>=Math.ceil(tickEvery*.6));return <span key={date} className={date.slice(-2)==='01'?'month-start':''}>{show&&<time dateTime={date}>{pretty(date)}</time>}</span>})}</div></div>
        {visibleLayers.length ? visibleLayers.map(layer=><div className={`timeline-row ${layer.toLowerCase()}`} key={layer}><div className="row-label"><span>{layerMeta[layer].short}</span><small>{layerMeta[layer].scale}</small></div><div className="day-grid" style={{gridTemplateColumns:`repeat(${dates.length}, minmax(0,1fr))`}}>{dates.map(date=>{const v=value(date,layer);const isSelected=date===activeDate;const isMonthStart=date.slice(-2)==='01';return <button key={date} className={`day ${v.height>0?'has-value':''} ${v.event?'event':''} ${isSelected?'is-selected':''} ${isMonthStart?'month-start':''}`} tabIndex={isSelected?0:-1} aria-current={isSelected?'date':undefined} aria-label={`${pretty(date)}, ${layer}: ${v.text}`} title={`${pretty(date)}: ${v.text}`} onClick={()=>setSelected(date)} onKeyDown={e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();const next=addDays(date,e.key==='ArrowRight'?1:-1);if(next>=start&&next<=end){setSelected(next);const sibling=e.key==='ArrowRight'?e.currentTarget.nextElementSibling:e.currentTarget.previousElementSibling;(sibling as HTMLButtonElement)?.focus();}}}}><span style={{height:`${v.height}%`}}/>{v.event&&<b aria-hidden="true">◆</b>}</button>})}</div></div>) : <div className="timeline-empty">Choose a layer above to rebuild the view.</div>}
      </div></div>
      <div className="timeline-legend" aria-hidden="true"><span><i/>Recorded value</span><span><b>◆</b>Medication change</span><span><em/>Selected day</span></div>
    </div>
    <p className="chart-note">Blank space means no value was recorded—not that a symptom was absent. Select a date or use the arrow keys within any row.</p>
    {!compact&&<div className="day-detail"><label>Explore a day<input name="timeline-date" autoComplete="off" type="date" min={start} max={end} value={activeDate} onChange={e=>{if(e.target.value>=start&&e.target.value<=end)setSelected(e.target.value);}}/></label><div className="day-summary" aria-live="polite"><strong>{pretty(activeDate)}</strong><ul>{visibleLayers.map(layer=><li key={layer}><span>{layer}</span>{value(activeDate,layer).text}</li>)}</ul></div></div>}
  </section>;
}
