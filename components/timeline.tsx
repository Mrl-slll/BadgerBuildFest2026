'use client';

import { useState } from 'react';
import { addDays, dateKey, pretty, scoped } from '../lib/health';
import type { HealthData } from '../lib/health';

const layers = ['Bleeding', 'Acne', 'Pain', 'Energy', 'Sleep', 'Medications'] as const;
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
  return <section className="history-panel" aria-labelledby="timeline-title">
    <div className="section-heading"><div><h2 id="timeline-title">Your health, over time</h2><p>See how your recorded experiences overlap.</p></div>{!providedStart&&<select aria-label="Timeline date range" value={days} onChange={e=>setDays(Number(e.target.value))}><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option><option value={180}>Last 180 days</option></select>}</div>
    <div className="layer-controls" aria-label="Visible timeline layers">{layers.map(l=><button key={l} aria-pressed={visible.includes(l)} onClick={()=>setVisible(v=>v.includes(l)?v.filter(x=>x!==l):[...v,l])}>{visible.includes(l)?'−':'+'} {l}</button>)}</div>
    <div className="timeline-scroll" role="region" aria-label="Health timeline, scroll horizontally for earlier days" tabIndex={0}><div className="timeline-grid" style={{minWidth:Math.max(660,dates.length*12)}}>
      <div className="timeline-axis"><span>Recorded history</span><div>{[0,.25,.5,.75,1].map(n=><span key={n}>{pretty(dates[Math.round(n*(dates.length-1))])}</span>)}</div></div>
      {layers.filter(l=>visible.includes(l)).map(layer=><div className="timeline-row" key={layer}><div className="row-label">{layer}<small>{layer==='Sleep'?'0–24 hours':layer==='Energy'?'1–5':layer==='Pain'?'0–10':'Recorded days'}</small></div><div className="day-grid" style={{gridTemplateColumns:`repeat(${dates.length}, minmax(0,1fr))`}}>{dates.map(date=>{const v=value(date,layer);return <button key={date} className={`day ${layer.toLowerCase()} ${v.event?'event':''}`} tabIndex={date===activeDate?0:-1} aria-label={`${pretty(date)}, ${layer}: ${v.text}`} title={`${pretty(date)}: ${v.text}`} onClick={()=>setSelected(date)} onKeyDown={e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();const next=addDays(date,e.key==='ArrowRight'?1:-1);if(next>=start&&next<=end){setSelected(next);const sibling=e.key==='ArrowRight'?e.currentTarget.nextElementSibling:e.currentTarget.previousElementSibling;(sibling as HTMLButtonElement)?.focus();}}}}><span style={{height:`${v.height}%`}}/>{v.event&&<b aria-hidden="true">◆</b>}</button>})}</div></div>)}
    </div></div>
    <p className="chart-note">Bars show recorded values; ◆ marks a medication start or end. Blank space is not proof of symptom absence. Use arrow keys within a row, or choose a date below.</p>
    {!compact&&<div className="day-detail"><label>Explore a day<input type="date" min={start} max={end} value={activeDate} onChange={e=>{if(e.target.value>=start&&e.target.value<=end)setSelected(e.target.value);}}/></label><p aria-live="polite"><strong>{pretty(activeDate)}</strong> — {layers.filter(l=>visible.includes(l)).map(l=>`${l}: ${value(activeDate,l).text}`).join(' · ')}</p></div>}
  </section>;
}
