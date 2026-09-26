import { addDays, dateKey, type HealthData } from './health';

/** Identity-free projection. Notes, appointments, and identifiers are excluded. */
export type HealthContext = {
  start: string; end: string; demo: boolean; loggedDays: number;
  symptoms: { name: string; days: number }[];
  periodStarts: string[];
  medications: { name: string; startedAt: string; endedAt?: string }[];
  labs: { name: string; value: string; unit: string; date: string; low: string; high: string }[];
};
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid history');
  return value as Record<string, unknown>;
}
function string(value: unknown): string {
  if (typeof value !== 'string' || value.length > 500) throw new Error('Invalid health field');
  return value;
}
function date(value: unknown): string {
  const result = string(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(result) || !Number.isFinite(Date.parse(result)) || new Date(result).toISOString().slice(0, 10) !== result) throw new Error('Invalid date');
  return result;
}
function rows(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value) || value.length > 5000) throw new Error('Invalid records');
  return value.map(record);
}
/** Consent precedes record access. Client identity scopes data; it is not authentication. */
export function assembleHealthContext(input?: HealthData | unknown, end = dateKey()): HealthContext | undefined {
  if (input === undefined || input === null) return undefined;
  const data = record(input);
  if (data.personalize !== true) return undefined;
  const userId = string(record(data.user).id);
  if (!userId) throw new Error('Missing record owner');
  const start = addDays(date(end), -89);
  const own = (value: unknown) => rows(value).filter(row => row.userId === userId);
  const inRange = (value: unknown) => { const day = date(value); return day >= start && day <= end; };
  const logs = own(data.logs).filter(row => inRange(row.date));
  const symptoms = new Map<string, Set<string>>();
  for (const log of logs) {
    if (!Array.isArray(log.symptoms) || log.symptoms.length > 100) throw new Error('Invalid symptoms');
    for (const symptom of log.symptoms) {
      const name = string(symptom);
      const days = symptoms.get(name) ?? new Set<string>();
      days.add(date(log.date));
      symptoms.set(name, days);
    }
  }
  return {
    start, end, demo: data.demo === true,
    loggedDays: new Set(logs.map(log => date(log.date))).size,
    symptoms: [...symptoms].map(([name, days]) => ({ name, days: days.size })).sort((a, b) => b.days - a.days || a.name.localeCompare(b.name)),
    periodStarts: [...new Set(logs.filter(log => log.periodStart === true).map(log => date(log.date)))].sort(),
    medications: own(data.medications).filter(row => date(row.startedAt) <= end && (!row.endedAt || date(row.endedAt) >= start)).map(row => ({ name: string(row.name), startedAt: date(row.startedAt), ...(row.endedAt ? { endedAt: date(row.endedAt) } : {}) })),
    labs: own(data.labs).filter(row => inRange(row.date)).map(row => ({ name: string(row.name), value: string(row.value), unit: string(row.unit), date: date(row.date), low: string(row.low), high: string(row.high) })),
  };
}
