import type { Lab, Log, Medication } from "./health";
import { dateKey, symptoms } from "./health";

export function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00Z`);
  return (
    Number.isFinite(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}
const pastDate = (value: string) => validDate(value) && value <= dateKey();
const finite = (value: string) =>
  value.trim() !== "" && Number.isFinite(Number(value));
export function validateDaily(log: Log) {
  if (!pastDate(log.date)) return "Choose a valid date on or before today.";
  for (const [key, min, max] of [
    ["pain", 0, 10],
    ["energy", 1, 5],
    ["mood", 1, 5],
    ["sleepMinutes", 0, 1440],
  ] as const) {
    const value = log[key];
    if (
      value !== undefined &&
      (!Number.isInteger(value) || value < min || value > max)
    )
      return `${key === "sleepMinutes" ? "Sleep in minutes" : key[0].toUpperCase() + key.slice(1)} must be a whole number between ${min} and ${max}.`;
  }
  if (log.symptoms.some((s) => !symptoms.includes(s)))
    return "Choose symptoms from the available options.";
  if (Object.values(log.medicationSymptoms ?? {}).some((values) =>
    !Array.isArray(values) || values.some(
      (symptom) =>
        !symptoms.includes(symptom) || !log.symptoms.includes(symptom),
    )))
    return "Choose medication-related symptoms from the available options.";
  if (
    log.bleeding &&
    !["None", "Spotting", "Light", "Medium", "Heavy"].includes(log.bleeding)
  )
    return "Choose a bleeding level from the available options.";
  if (
    Object.values(log.doses).some((v) => !["", "Taken", "Missed"].includes(v))
  )
    return "Choose Taken, Missed, or Not recorded for each dose.";
  if (
    [
      log.notes,
      log.meals,
      log.painNote,
      ...Object.values(log.sideEffects),
    ].some((v) => v && v.length > 2000)
  )
    return "Keep each note to 2,000 characters or fewer.";
  return "";
}
export function validateMedication(m: Medication) {
  if (![m.name, m.dosage, m.unit, m.frequency].every((v) => v.trim()))
    return "Enter a medication name, dosage, unit, and frequency.";
  if (!finite(m.dosage) || Number(m.dosage) <= 0)
    return "Dosage must be a number greater than zero.";
  if (!pastDate(m.startedAt))
    return "Choose a valid medication start date on or before today.";
  if (m.endedAt && (!pastDate(m.endedAt) || m.endedAt < m.startedAt))
    return "End date must be between the start date and today.";
  if (!m.active && !m.endedAt)
    return "Enter an end date for an inactive medication.";
  if (m.active && m.endedAt)
    return "Clear the end date or mark the medication inactive.";
  return "";
}
export function validateLab(l: Lab) {
  if (!l.name.trim() || !l.unit.trim()) return "Enter a test name and unit.";
  if (!finite(l.value)) return "Enter a numeric lab value.";
  if (!pastDate(l.date)) return "Choose a valid test date on or before today.";
  if ([l.low, l.high].some((v) => v !== "" && !finite(v)))
    return "Reference values must be numbers.";
  if (l.low !== "" && l.high !== "" && Number(l.low) > Number(l.high))
    return "The lower reference value must not exceed the upper value.";
  return "";
}
