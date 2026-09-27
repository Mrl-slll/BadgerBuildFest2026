import { addDays, convertWeight, daysBetween, linkedMedicationSymptoms, scoped, weightStats } from './health';
import type { HealthData, Log, WeightSummary } from './health';

export function summarize(data: HealthData, start: string, end: string) {
  const own = scoped(data);
  // A daily record is the unit of observation. Prefer the last version of a day.
  const all = [...new Map(own.logs.filter(l => l.date <= end).map(l => [l.date, l])).values()].sort((a,b) => a.date.localeCompare(b.date));
  const logs = all.filter(l => l.date >= start);
  const starts = all.filter(l => l.periodStart);
  const cycles = starts.map((l,i) => ({ start: l.date, next: starts[i+1]?.date, length: starts[i+1] ? daysBetween(l.date, starts[i+1].date) : null })).filter(c => (c.next ?? end) >= start);
  const counts = new Map<string, number>();
  logs.forEach(l => new Set(l.symptoms).forEach(s => counts.set(s, (counts.get(s) ?? 0)+1)));
  const frequency = [...counts].sort((a,b) => b[1]-a[1] || a[0].localeCompare(b[0]));
  const midpoint = addDays(start, Math.ceil((daysBetween(start,end)+1)/2));
  const earlier = logs.filter(l => l.date < midpoint);
  const recent = logs.filter(l => l.date >= midpoint);
  const symptomTrends = frequency.map(([name]) => ({
    name,
    earlier: earlier.filter(l => l.symptoms.includes(name)).length,
    recent: recent.filter(l => l.symptoms.includes(name)).length,
  }));
  const average = (rows: Log[], key: 'sleepMinutes'|'energy') => {
    const values = rows.flatMap(l => l[key] === undefined ? [] : [l[key]!]);
    return { count: values.length, value: values.length ? values.reduce((a,b)=>a+b,0)/values.length : null };
  };
  const averageWeight = (rows: Log[], targetUnit: 'lbs' | 'kg' = 'lbs') => {
    const values = rows.flatMap(l => (l.weight !== undefined && Number.isFinite(l.weight) && l.weight > 0) ? [convertWeight(l.weight, l.weightUnit || 'lbs', targetUnit)] : []);
    return { count: values.length, value: values.length ? Math.round((values.reduce((a,b)=>a+b,0)/values.length) * 10) / 10 : null };
  };
  const weeks = [];
  for (let day=start; day<=end; day=addDays(day,7)) {
    const last = addDays(day,6) < end ? addDays(day,6) : end;
    const rows = logs.filter(l => l.date>=day && l.date<=last);
    weeks.push({
      start: day,
      end: last,
      sleep: average(rows,'sleepMinutes'),
      energy: average(rows,'energy'),
      weight: averageWeight(rows, 'lbs'),
    });
  }
  const paired = logs.filter(l => l.energy !== undefined);
  const co = paired.filter(l => l.symptoms.includes('Acne') && l.energy! <= 2).length;
  const medications = own.medications.filter(m => m.startedAt <= end && (!m.endedAt || m.endedAt >= start));
  const medicationSymptoms = new Map(medications.map(m => [m.id, linkedMedicationSymptoms(logs, m.id)]));
  const events = medications.flatMap(m => [
    ...(m.startedAt >= start ? [{ date:m.startedAt, text:`${m.name} started · ${m.dosage} ${m.unit} · ${m.frequency}` }] : []),
    ...(m.endedAt && m.endedAt <= end ? [{date:m.endedAt,text:`${m.name} ended`}] : []),
  ]).sort((a,b)=>a.date.localeCompare(b.date));

  const weightSummary: WeightSummary = weightStats(logs, 'lbs');

  const insightsList: string[] = [];
  if (logs.length) {
    if (frequency.length) {
      insightsList.push(`${frequency[0][0]} was selected on ${frequency[0][1]} of ${logs.length} logged days.`);
    } else {
      insightsList.push(`No symptoms were selected in ${logs.length} daily entries. This does not confirm symptom absence.`);
    }
    if (paired.length) {
      insightsList.push(`Acne and low energy (1–2 of 5) were recorded together on ${co} of ${paired.length} days with an energy entry.`);
    } else {
      insightsList.push('No energy entries in this period; a sleep and energy comparison is not available.');
    }
    if (weightSummary.count >= 2) {
      insightsList.push(`Weight was logged across ${weightSummary.count} entries in this range (average ${weightSummary.average} lbs; range ${weightSummary.min}–${weightSummary.max} lbs).`);
    } else if (weightSummary.count === 1) {
      insightsList.push(`Weight was logged on 1 day in this range (${weightSummary.latest?.value} lbs on ${weightSummary.latest?.date}).`);
    }
    insightsList.push('These observations describe recorded entries only. Missing days and changes in logging can affect the picture; overlap does not establish cause.');
  } else {
    insightsList.push('No entries in this period. Choose a longer time range to explore earlier records.');
  }

  return {
    logs,
    cycles,
    frequency,
    symptomTrends,
    midpoint,
    earlierDays: earlier.length,
    recentDays: recent.length,
    weeks,
    medications,
    medicationSymptoms,
    events,
    insights: insightsList,
    sleep: average(logs,'sleepMinutes'),
    energy: average(logs,'energy'),
    weight: weightSummary,
    totalDays: daysBetween(start,end)+1,
  };
}
