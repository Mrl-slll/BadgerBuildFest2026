export const symptomGroups = [
  {
    label: 'Commonly tracked',
    symptoms: ['Fatigue', 'Pelvic pain', 'Cravings', 'Bloating', 'Headache', 'Acne'],
  },
  {
    label: 'Skin & hair',
    symptoms: ['Oily skin', 'Dry skin', 'Hair loss', 'Increased facial/body hair', 'Rash or itching'],
  },
  {
    label: 'Mood & thinking',
    symptoms: ['Mood changes', 'Anxiety or stress', 'Irritability', 'Low mood', 'Brain fog', 'Difficulty concentrating'],
  },
  {
    label: 'Sleep & temperature',
    symptoms: ['Sleep problems', 'Night sweats', 'Hot flashes'],
  },
  {
    label: 'Digestive',
    symptoms: ['Nausea', 'Vomiting', 'Constipation', 'Diarrhea', 'Stomach pain', 'Heartburn'],
  },
  {
    label: 'Pain & body',
    symptoms: ['Migraine', 'Back pain', 'Joint pain', 'Muscle aches', 'Breast tenderness', 'Dizziness', 'Swelling'],
  },
] as const;
export const symptoms: string[] = symptomGroups.flatMap((group) => [...group.symptoms]);
export const quickSymptoms = symptomGroups[0].symptoms;
export type Log = { id: string; userId: string; date: string; symptoms: string[]; bleeding?: string; periodStart?: boolean; periodEnd?: boolean; pain?: number; painScores?: Record<string, number>; painNote?: string; mood?: number; energy?: number; sleepMinutes?: number; sleepQuality?: string; movement?: string; meals?: string; notes?: string; doses: Record<string, string>; sideEffects: Record<string, string>; medicationSymptoms?: Record<string, string[]> };
export type Medication = { id: string; userId: string; name: string; dosage: string; unit: string; frequency: string; startedAt: string; endedAt?: string; active: boolean; notes: string };
export type Lab = { id: string; userId: string; name: string; value: string; unit: string; date: string; low: string; high: string; source: string; notes: string };
export type HealthData = { version: 1; user: { id: string; name: string }; logs: Log[]; medications: Medication[]; labs: Lab[]; questions: string[]; appointments: { date: string; title: string }[]; personalize: boolean };
export function dateKey(date = new Date()): string { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; }
export function addDays(date: string, n: number) { const d = new Date(date+'T12:00:00'); d.setDate(d.getDate()+n); return dateKey(d); }
export function daysBetween(a: string, b: string) { return Math.round((Date.parse(b+'T12:00:00Z')-Date.parse(a+'T12:00:00Z'))/86400000); }
export function pretty(date: string) { return new Date(date+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'}); }
export function scoped(data: HealthData): HealthData { const own = <T extends {userId: string}>(rows:T[])=>rows.filter(r=>r.userId===data.user.id); return {...data, logs:own(data.logs),medications:own(data.medications),labs:own(data.labs)}; }
export function rangeLogs(data: HealthData, start: string, end: string) { return scoped(data).logs.filter(l=>l.date>=start && l.date<=end).sort((a,b)=>a.date.localeCompare(b.date)); }
export function cycleHistory(logs: Log[]) { const starts = logs.filter(l=>l.periodStart).sort((a,b)=>a.date.localeCompare(b.date)); return starts.map((l,i)=>({start:l.date, end:logs.filter(x=>x.periodEnd && x.date>=l.date && (!starts[i+1] || x.date<starts[i+1].date)).sort((a,b)=>a.date.localeCompare(b.date))[0]?.date, length:starts[i+1]?daysBetween(l.date,starts[i+1].date):null})); }
export function frequencies(logs: Log[]) { const counts: Record<string,number>={}; logs.forEach(l=>new Set(l.symptoms).forEach(s=>counts[s]=(counts[s]||0)+1)); return Object.entries(counts).sort((a,b)=>b[1]-a[1]); }
export function sleepAverage(logs:Log[]) { const values=logs.flatMap(l=>l.sleepMinutes===undefined?[]:[l.sleepMinutes]); return values.length?Math.round(values.reduce((a,b)=>a+b,0)/values.length):null; }
export function duration(minutes: number|null) { return minutes===null?'Not recorded':`${Math.floor(minutes/60)}h ${minutes%60}m`; }
export function medicationWindow(data: HealthData, med:Medication) { const logs=scoped(data).logs; const count=(start:string,end:string)=>logs.filter(l=>l.date>=start && l.date<=end); const before=count(addDays(med.startedAt,-14),addDays(med.startedAt,-1)); const after=count(med.startedAt,addDays(med.startedAt,13)); return {before,after,sideEffectDays:after.filter(l=>l.sideEffects[med.id]?.trim()).length}; }
export function linkedMedicationSymptoms(logs: Log[], medicationId: string) { const counts = new Map<string, number>(); logs.forEach((log) => new Set(log.medicationSymptoms?.[medicationId] ?? []).forEach((symptom) => counts.set(symptom, (counts.get(symptom) ?? 0) + 1))); return [...counts].sort((a,b)=>b[1]-a[1] || a[0].localeCompare(b[0])); }
export function observations(data: HealthData, start:string, end:string) { const logs=rangeLogs(data,start,end); if(logs.length<3)return [{category:'Your history',text:'A few more entries will help us describe patterns. Start with how you feel today.'}]; const co=logs.filter(l=>l.symptoms.includes('Acne') && l.energy!==undefined && l.energy<=2).length; const cycles=cycleHistory(scoped(data).logs).filter(c=>c.start>=start && c.start<=end).flatMap(c=>c.length===null?[]:[c.length]); const result=[{category:'Sleep & energy',text:`Your average recorded sleep was ${duration(sleepAverage(logs))} across ${logs.filter(l=>l.sleepMinutes!==undefined).length} entries.`},{category:'Symptoms',text:`Acne and low energy were recorded together on ${co} of ${logs.length} logged days.`},{category:'Cycle',text:cycles.length?`Your completed recorded cycles in this range were ${cycles.join(', ')} days.`:'There are not enough period starts in this range to calculate a completed cycle.'}]; scoped(data).medications.filter(m=>m.startedAt>=start && m.startedAt<=end).forEach(m=>{const w=medicationWindow(data,m);result.push({category:'Medications',text:`In the first 14 days after ${m.name} was added, side effects were recorded on ${w.sideEffectDays} of ${w.after.length} logged days. This does not establish cause.`});}); return result; }
export { validateDaily as validateLog } from './tracking-validation';
export function emptyData(userId='local-user'):HealthData { return {version:1,user:{id:userId,name:''},logs:[],medications:[],labs:[],questions:[],appointments:[],personalize:false}; }
