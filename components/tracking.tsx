"use client";
import { useEffect, useState, useMemo } from "react";
import { validateMedication, validateLab, validateDaily as validateLog } from "../lib/tracking-validation";
import { SymptomInsights } from "./symptom-insights";
import { MedicationInsights } from "./medication-insights";
import {
  HealthData,
  Log,
  Medication,
  Lab,
  dateKey,
  symptomGroups,
  pretty,
  cycleHistory,
  addDays,
  convertWeight,
  formatWeight,
  weightStats,
} from "../lib/health";
type Props = {
  data: HealthData;
  save: (data: HealthData) => boolean;
  onDirty?: (dirty: boolean) => void;
};
export function DailyLogForm({
  data,
  save,
  onDirty,
  date: initial = dateKey(),
}: Props & { date?: string }) {
  const [date, setDate] = useState(initial);
  const existing = (d: string) =>
    data.logs.find((l) => l.date === d) || {
      id: d,
      userId: data.user.id,
      date: d,
      symptoms: [],
      doses: {},
      sideEffects: {},
    };
  const [log, setLog] = useState<Log>(() => existing(initial));
  const [status, setStatus] = useState("");
  const [nextDate, setNextDate] = useState<string | null>(null);
  const [changed, setChanged] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  useEffect(() => {
    if (window.location.hash === "#cycle-bleeding") {
      const section = document.getElementById("cycle-bleeding");
      section?.scrollIntoView({ block: "start" });
      section?.focus({ preventScroll: true });
    }
  }, []);
  const field = <K extends keyof Log>(key: K, value: Log[K]) => {
    setLog({ ...log, [key]: value });
    setStatus("");
    onDirty?.(true);
    setChanged(true);
  };
  const toggleSymptom = (symptom: string) => {
    const removing = log.symptoms.includes(symptom);
    const medicationSymptoms = removing
      ? Object.fromEntries(
          Object.entries(log.medicationSymptoms ?? {}).map(
            ([medicationId, linked]) => [
              medicationId,
              linked.filter((item) => item !== symptom),
            ],
          ),
        )
      : log.medicationSymptoms;
    setLog({
      ...log,
      symptoms: removing
        ? log.symptoms.filter((item) => item !== symptom)
        : [...log.symptoms, symptom],
      medicationSymptoms,
      painScores: removing
        ? Object.fromEntries(Object.entries(log.painScores ?? {}).filter(([key]) => key !== symptom))
        : log.painScores,
    });
    setStatus("");
    onDirty?.(true);
    setChanged(true);
  };
  const linkMedicationSymptom = (medicationId: string, symptom: string) => {
    if (!symptom) return;
    const linked = log.medicationSymptoms?.[medicationId] ?? [];
    if (linked.includes(symptom)) return;
    field("medicationSymptoms", {
      ...log.medicationSymptoms,
      [medicationId]: [...linked, symptom],
    });
  };
  const unlinkMedicationSymptom = (medicationId: string, symptom: string) =>
    field("medicationSymptoms", {
      ...log.medicationSymptoms,
      [medicationId]: (log.medicationSymptoms?.[medicationId] ?? []).filter(
        (item) => item !== symptom,
      ),
    });
  return (
    <form
      autoComplete="off"
      onSubmit={(e) => {
        e.preventDefault();
        const error = validateLog(log);
        if (error) {
          setStatus(error);
          return;
        }
        if (
          save({
            ...data,
            logs: [...data.logs.filter((l) => l.date !== log.date), log],
          })
        ) {
          setChanged(false);
          onDirty?.(false);
          setStatus("Your entry is saved. You can edit it anytime.");
        } else
          setStatus(
            "Could not save. Your entry is still here. Please try again.",
          );
      }}
    >
      <div className="section-head">
        <div>
          <h2>A little check-in</h2>
          <p>Only record what feels useful. Every field is optional.</p>
        </div>
        <label>
          Date
          <input
            name="date"
            type="date"
            required
            max={dateKey()}
            value={date}
            onChange={(e) => {
              if (changed) {
                setNextDate(e.target.value);
                return;
              }
              setDate(e.target.value);
              setLog(existing(e.target.value));
              setStatus("");
              onDirty?.(false);
            }}
          />
        </label>
      </div>
      {nextDate !== null && (
        <div className="unsaved" role="alert">
          <p>Changing the date will discard this unsaved entry.</p>
          <div className="actions">
            <button type="button" onClick={() => setNextDate(null)}>
              Keep editing
            </button>
            <button
              type="button"
              onClick={() => {
                setDate(nextDate);
                setLog(existing(nextDate));
                setNextDate(null);
                setChanged(false);
                onDirty?.(false);
                setStatus("");
              }}
            >
              Discard and change date
            </button>
          </div>
        </div>
      )}
      <fieldset>
        <legend>How are you feeling?</legend>
        <p className="field-hint">Choose any that feel relevant today.</p>
        <div className="form-grid symptom-categories">
          {symptomGroups.filter((group) => group.label !== "Pain & body").map((group) => (
            <div key={group.label}>
              <label>
                {group.label}
                <select name={group.label} value="" onChange={(e) => { if (e.target.value) toggleSymptom(e.target.value); }}>
                  <option value="">Choose a symptom…</option>
                  {group.symptoms.map((symptom) => (
                    <option key={symptom} value={symptom} disabled={log.symptoms.includes(symptom)}>
                      {symptom}{log.symptoms.includes(symptom) ? " — selected" : ""}
                    </option>
                  ))}
                </select>
              </label>
              {group.symptoms.some((symptom) => log.symptoms.includes(symptom)) && (
                <div className="selected-symptoms" aria-label={`Selected ${group.label.toLowerCase()} symptoms`}>
                  {group.symptoms.filter((symptom) => log.symptoms.includes(symptom)).map((symptom) => (
                    <button type="button" key={symptom} onClick={() => toggleSymptom(symptom)} aria-label={`Remove ${symptom}`}>
                      {symptom} <span aria-hidden="true">×</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend>Pain</legend>
        <p className="field-hint" id="pain-scale-help">
          Rate each selected symptom separately, from 0 to 10.
        </p>
        <div className="form-grid symptom-categories">
          {symptomGroups.filter((group) => group.label === "Pain & body").map((group) => (
            <div key={group.label}>
              <label>
                {group.label}
                <select name={group.label} value="" onChange={(e) => { if (e.target.value) toggleSymptom(e.target.value); }}>
                  <option value="">Choose a symptom…</option>
                  {group.symptoms.map((symptom) => (
                    <option key={symptom} value={symptom} disabled={log.symptoms.includes(symptom)}>
                      {symptom}{log.symptoms.includes(symptom) ? " — selected" : ""}
                    </option>
                  ))}
                </select>
              </label>
              {group.symptoms.some((symptom) => log.symptoms.includes(symptom)) && (
                <div className="selected-symptoms" aria-label={`Selected ${group.label.toLowerCase()} symptoms`}>
                  {group.symptoms.filter((symptom) => log.symptoms.includes(symptom)).map((symptom) => (
                    <button type="button" key={symptom} onClick={() => toggleSymptom(symptom)} aria-label={`Remove ${symptom}`}>
                      {symptom} <span aria-hidden="true">×</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          <label>
            Pain location or note
            <input name="painNote" maxLength={2000} value={log.painNote || ""} onChange={(e) => field("painNote", e.target.value)} />
          </label>
        </div>
        {symptomGroups.filter((group) => group.label === "Pain & body").flatMap((group) => group.symptoms)
          .filter((symptom) => log.symptoms.includes(symptom)).map((symptom) => (
            <div className="pain-symptom-rating" key={symptom}>
              <h3>{symptom}</h3>
              <div className="chips pain-scale" role="group" aria-label={`${symptom} impact, 0 to 10`} aria-describedby="pain-scale-help">
                {Array.from({ length: 11 }, (_, n) => (
                  <div className="pain-scale-option" key={n}>
                  <button type="button"
                    aria-label={`${symptom}: ${n}${n === 0 ? " — No Impact" : n === 5 ? " — Moderate Impact" : n === 10 ? " — Incapacitating" : ""}`}
                    aria-pressed={log.painScores?.[symptom] === n}
                    onClick={() => {
                      const scores = { ...log.painScores };
                      if (scores[symptom] === n) delete scores[symptom];
                      else scores[symptom] = n;
                      field("painScores", scores);
                    }}>
                    {n}
                  </button>
                  {(n === 0 || n === 5 || n === 10) && (
                    <span className="pain-scale-caption" aria-hidden="true">
                      {n === 0 ? "No Impact" : n === 5 ? "Moderate Impact" : "Incapacitating"}
                    </span>
                  )}
                  </div>
                ))}
              </div>
              <p className="field-hint" role="status">
                {log.painScores?.[symptom] === undefined ? "Not recorded" : `Selected: ${log.painScores[symptom]}/10. Select again to clear.`}
              </p>
            </div>
          ))}
        {!symptomGroups.some((group) => group.label === "Pain & body" && group.symptoms.some((symptom) => log.symptoms.includes(symptom))) && (
          <p className="field-hint">Choose a pain symptom above to record its impact.</p>
        )}
        {log.pain !== undefined && (
          <p className="field-hint">Previously recorded overall pain: {log.pain}/10.</p>
        )}
      </fieldset>
      {log.symptoms.length > 0 && (
        <div className="centered-suggestions-trigger">
          <button
            type="button"
            className="get-suggestions-button"
            onClick={() => setShowSuggestions(!showSuggestions)}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
            </svg>
            <span>{showSuggestions ? "Hide" : "Get"} Personalized Suggestions</span>
          </button>
        </div>
      )}
      {showSuggestions && log.symptoms.length > 0 && (
        <SymptomInsights symptoms={log.symptoms} />
      )}
      <fieldset id="cycle-bleeding" tabIndex={-1}>
        <legend>Cycle & bleeding</legend>
        <div className="chips">
          {["None", "Spotting", "Light", "Medium", "Heavy"].map((s) => (
            <button
              type="button"
              key={s}
              aria-pressed={log.bleeding === s}
              onClick={() =>
                field("bleeding", log.bleeding === s ? undefined : s)
              }
            >
              {s}
            </button>
          ))}
        </div>
        <div className="inline-fields">
          <label className="check-label">
            <input
              type="checkbox"
              checked={!!log.periodStart}
              onChange={(e) => field("periodStart", e.target.checked)}
            />
            Period started
          </label>
          <label className="check-label">
            <input
              type="checkbox"
              checked={!!log.periodEnd}
              onChange={(e) => field("periodEnd", e.target.checked)}
            />
            Period ended
          </label>
        </div>
      </fieldset>
      <details>
        <summary>
          More about your day <span>Energy, mood, sleep & weight</span>
        </summary>
        <div className="form-grid">
          {(["energy", "mood"] as const).map((key) => (
            <label key={key}>
              {key === "energy" ? "Energy" : "Mood"}
              <select
                value={log[key] ?? ""}
                onChange={(e) =>
                  field(
                    key,
                    e.target.value === "" ? undefined : Number(e.target.value),
                  )
                }
              >
                <option value="">Not recorded</option>
                {Array.from({ length: 5 }, (_, i) => i + 1).map((n) => (
                  <option value={n} key={n}>
                    {n}{n === 1 ? " — very low" : n === 5 ? " — very high" : ""}
                  </option>
                ))}
              </select>
            </label>
          ))}
          <label>
            Sleep hours
            <input
              type="number"
              min="0"
              max="24"
              step="1"
              value={
                log.sleepMinutes === undefined
                  ? ""
                  : Math.floor(log.sleepMinutes / 60)
              }
              onChange={(e) =>
                field(
                  "sleepMinutes",
                  e.target.value === ""
                    ? (log.sleepMinutes || 0) % 60 || undefined
                    : Number(e.target.value) * 60 +
                        ((log.sleepMinutes || 0) % 60),
                )
              }
            />
          </label>
          <label>
            Sleep minutes
            <input
              type="number"
              min="0"
              max="59"
              value={
                log.sleepMinutes === undefined ? "" : log.sleepMinutes % 60
              }
              onChange={(e) =>
                field(
                  "sleepMinutes",
                  e.target.value === ""
                    ? Math.floor((log.sleepMinutes || 0) / 60) * 60 || undefined
                    : Math.floor((log.sleepMinutes || 0) / 60) * 60 +
                        Number(e.target.value),
                )
              }
            />
          </label>
          <label>
            Sleep quality
            <select
              value={log.sleepQuality || ""}
              onChange={(e) => field("sleepQuality", e.target.value)}
            >
              <option value="">Not recorded</option>
              {["Restless", "Okay", "Restful"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>

          <div className="weight-tracking-field">
            <div className="weight-label-row">
              <label htmlFor="daily-weight-input" style={{ marginBottom: 0 }}>Weight</label>
              <div className="unit-toggle-chips" role="group" aria-label="Weight unit">
                <button
                  type="button"
                  className={`chip-unit ${(!log.weightUnit || log.weightUnit === "lbs") ? "active" : ""}`}
                  onClick={() => {
                    if (log.weightUnit === "kg" && log.weight !== undefined) {
                      field("weight", convertWeight(log.weight, "kg", "lbs"));
                    }
                    field("weightUnit", "lbs");
                  }}
                >
                  lbs
                </button>
                <button
                  type="button"
                  className={`chip-unit ${log.weightUnit === "kg" ? "active" : ""}`}
                  onClick={() => {
                    if ((!log.weightUnit || log.weightUnit === "lbs") && log.weight !== undefined) {
                      field("weight", convertWeight(log.weight, "lbs", "kg"));
                    }
                    field("weightUnit", "kg");
                  }}
                >
                  kg
                </button>
              </div>
            </div>
            <div className="weight-input-container">
              <input
                id="daily-weight-input"
                name="weight"
                type="number"
                min="20"
                max="1000"
                step="0.1"
                placeholder={log.weightUnit === "kg" ? "e.g. 67.5" : "e.g. 148.5"}
                value={log.weight ?? ""}
                onChange={(e) =>
                  field(
                    "weight",
                    e.target.value === "" ? undefined : Number(e.target.value)
                  )
                }
              />
              {log.weight !== undefined && (
                <button
                  type="button"
                  className="weight-clear-button"
                  onClick={() => {
                    field("weight", undefined);
                    field("weightNote", undefined);
                  }}
                  title="Clear weight for today"
                  aria-label="Clear weight entry"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <label>
            Weight context or note (optional)
            <input
              name="weightNote"
              type="text"
              maxLength={200}
              placeholder="e.g. Morning, before breakfast"
              value={log.weightNote || ""}
              onChange={(e) => field("weightNote", e.target.value)}
            />
          </label>
        </div>
      </details>
      <fieldset>
        <legend>Medications</legend>
        {data.medications
          .filter(
            (m) =>
              (m.startedAt <= date && (!m.endedAt || m.endedAt >= date)) ||
              !!log.doses[m.id] ||
              !!log.sideEffects[m.id],
          )
          .map((m) => (
            <div className="med-log" key={m.id}>
              <div>
                <strong>{m.name}</strong>
                <small>
                  {m.dosage} {m.unit} · {m.frequency}
                </small>
              </div>
              <label>
                Dose
                <select
                  value={log.doses[m.id] || ""}
                  onChange={(e) =>
                    field("doses", { ...log.doses, [m.id]: e.target.value })
                  }
                >
                  <option value="">Not recorded</option>
                  <option>Taken</option>
                  <option>Missed</option>
                </select>
              </label>
              <div className="med-observations">
                <label>
                  Symptoms noticed after taking it
                  <select
                    name={`medicationSymptom-${m.id}`}
                    value=""
                    disabled={!log.symptoms.length}
                    aria-describedby={`medication-symptom-help-${m.id}`}
                    onChange={(event) => {
                      linkMedicationSymptom(m.id, event.target.value);
                      event.target.value = "";
                    }}
                  >
                    <option value="">
                      {log.symptoms.length
                        ? "Link one of today's symptoms…"
                        : "Select a symptom above first"}
                    </option>
                    {log.symptoms.map((symptom) => (
                      <option
                        key={symptom}
                        value={symptom}
                        disabled={(log.medicationSymptoms?.[m.id] ?? []).includes(
                          symptom,
                        )}
                      >
                        {symptom}
                        {(log.medicationSymptoms?.[m.id] ?? []).includes(symptom)
                          ? " — linked"
                          : ""}
                      </option>
                    ))}
                  </select>
                </label>
                {(log.medicationSymptoms?.[m.id] ?? []).length > 0 && (
                  <div
                    className="medication-symptom-links"
                    aria-label={`Symptoms linked to ${m.name}`}
                  >
                    {(log.medicationSymptoms?.[m.id] ?? []).map((symptom) => (
                      <button
                        type="button"
                        key={symptom}
                        onClick={() => unlinkMedicationSymptom(m.id, symptom)}
                        aria-label={`Remove ${symptom} from ${m.name}`}
                      >
                        {symptom} <span aria-hidden="true">×</span>
                      </button>
                    ))}
                  </div>
                )}
                <small id={`medication-symptom-help-${m.id}`}>
                  This records a possible connection you noticed. Timing alone
                  does not show that a medication caused a symptom.
                </small>
                <label>
                  Other side-effect note
                  <input
                    name={`sideEffect-${m.id}`}
                    maxLength={2000}
                    placeholder="For example, began about an hour later…"
                    value={log.sideEffects[m.id] || ""}
                    onChange={(e) =>
                      field("sideEffects", {
                        ...log.sideEffects,
                        [m.id]: e.target.value,
                      })
                    }
                  />
                </label>
              </div>
            </div>
          ))}
        {!data.medications.some(
          (m) =>
            (m.startedAt <= date && (!m.endedAt || m.endedAt >= date)) ||
            !!log.doses[m.id] ||
            !!log.sideEffects[m.id],
        ) && (
          <p>
            No medications for this date. Add a medication in the Medications
            tab to log doses here.
          </p>
        )}
        {data.medications.length > 0 && (
          <MedicationInsights
            medicationName={data.medications.map(m => m.name).join(", ")}
            notes=""
            sideEffects=""
          />
        )}
      </fieldset>
      <label>
        Meals
        <textarea
          maxLength={2000}
          rows={2}
          placeholder="Anything you’d like to remember?"
          value={log.meals || ""}
          onChange={(e) => field("meals", e.target.value)}
        />
      </label>
      <label>
        Notes
        <textarea
          maxLength={2000}
          rows={3}
          placeholder="A little context for your future self…"
          value={log.notes || ""}
          onChange={(e) => field("notes", e.target.value)}
        />
      </label>
      <div className="save-bar">
        <button className="primary" type="submit">
          {data.logs.some((l) => l.date === date)
            ? "Save changes"
            : "Save entry"}
        </button>
        <span role="status">{status}</span>
      </div>
    </form>
  );
}
export function Medications({ data, save, onDirty }: Props) {
  const [edit, setEdit] = useState<Medication | null>(null);
  const [status, setStatus] = useState("");
  return (
    <>
      <div className="section-head">
        <h2>Your medications</h2>
        <button
          disabled={!!edit}
          className="primary"
          onClick={() => {
            setStatus("");
            setEdit({
              id: crypto.randomUUID(),
              userId: data.user.id,
              name: "",
              dosage: "",
              unit: "mg",
              frequency: "Once daily",
              startedAt: dateKey(),
              active: true,
              notes: "",
            });
          }}
        >
          Add medication
        </button>
      </div>
      {edit && (
        <form
          autoComplete="off"
          onChange={() => onDirty?.(true)}
          className="panel"
          onSubmit={(e) => {
            e.preventDefault();
            const error = validateMedication(edit);
            if (error) {
              setStatus(error);
              return;
            }
            if (
              save({
                ...data,
                medications: [
                  ...data.medications.filter((m) => m.id !== edit.id),
                  edit,
                ],
              })
            ) {
              setEdit(null);
              setStatus("Medication saved.");
              onDirty?.(false);
            } else
              setStatus(
                "Could not save. Your changes are still here. Please try again.",
              );
          }}
        >
          <div className="form-grid">
            {(
              [
                "name",
                "dosage",
                "unit",
                "frequency",
                "startedAt",
                "endedAt",
                "notes",
              ] as const
            ).map((k) => (
              <label key={k}>
                {
                  {
                    name: "Medication name",
                    dosage: "Dosage",
                    unit: "Unit",
                    frequency: "Frequency",
                    startedAt: "Start date",
                    endedAt: "End date (optional)",
                    notes: "Personal notes",
                  }[k]
                }
                <input
                  name={k}
                  required={[
                    "name",
                    "dosage",
                    "unit",
                    "frequency",
                    "startedAt",
                  ].includes(k)}
                  maxLength={2000}
                  max={k.endsWith("At") ? dateKey() : undefined}
                  type={
                    k.endsWith("At")
                      ? "date"
                      : k === "dosage"
                        ? "number"
                        : "text"
                  }
                  min={k === "dosage" ? "0.000001" : undefined}
                  step={k === "dosage" ? "any" : undefined}
                  value={edit[k] || ""}
                  onChange={(e) => setEdit({ ...edit, [k]: e.target.value })}
                />
              </label>
            ))}
          </div>
          <label className="check-label">
            <input
              type="checkbox"
              checked={edit.active}
              onChange={(e) => setEdit({ ...edit, active: e.target.checked })}
            />
            Currently active
          </label>
          <div className="actions">
            <button className="primary">Save medication</button>
            <button
              type="button"
              onClick={() => {
                setEdit(null);
                onDirty?.(false);
                setStatus("");
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
      <p role="status">{status}</p>
      {data.medications.map((m) => (
        <article className="record" key={m.id}>
          <div>
            <h3>
              {m.name}{" "}
              <span className="badge">{m.active ? "Active" : "Inactive"}</span>
            </h3>
            <p>
              {m.dosage} {m.unit} · {m.frequency}
            </p>
            <small>
              Started {pretty(m.startedAt)}
              {m.endedAt ? ` · Ended ${pretty(m.endedAt)}` : ""}
            </small>
            <p>{m.notes}</p>
          </div>
          <button
            disabled={!!edit}
            aria-label={`Edit ${m.name}`}
            onClick={() => {
              setStatus("");
              setEdit({ ...m });
            }}
          >
            Edit
          </button>
        </article>
      ))}
      {!data.medications.length && (
        <p>
          No medications recorded. Add one to keep doses and side effects
          together.
        </p>
      )}
    </>
  );
}
export function Labs({ data, save, onDirty }: Props) {
  const [edit, setEdit] = useState<Lab | null>(null);
  const [status, setStatus] = useState("");
  const fields = [
    ["name", "Test name"],
    ["value", "Value"],
    ["unit", "Unit"],
    ["date", "Test date"],
    ["low", "Reference low (optional)"],
    ["high", "Reference high (optional)"],
    ["source", "Laboratory (optional)"],
    ["notes", "Notes (optional)"],
  ] as const;
  return (
    <>
      <div className="section-head">
        <div>
          <h2>Lab results</h2>
          <p>Keep the values and units from your laboratory report.</p>
        </div>
        <button
          disabled={!!edit}
          className="primary"
          onClick={() => {
            setStatus("");
            setEdit({
              id: crypto.randomUUID(),
              userId: data.user.id,
              name: "",
              value: "",
              unit: "",
              date: dateKey(),
              low: "",
              high: "",
              source: "",
              notes: "",
            });
          }}
        >
          Add result
        </button>
      </div>
      {edit && (
        <form
          autoComplete="off"
          onChange={() => onDirty?.(true)}
          className="panel"
          onSubmit={(e) => {
            e.preventDefault();
            const error = validateLab(edit);
            if (error) {
              setStatus(error);
              return;
            }
            if (
              save({
                ...data,
                labs: [...data.labs.filter((l) => l.id !== edit.id), edit],
              })
            ) {
              setEdit(null);
              onDirty?.(false);
              setStatus("Lab result saved.");
            } else
              setStatus(
                "Could not save. Your result is still here. Please try again.",
              );
          }}
        >
          <div className="form-grid">
            {fields.map(([k, label]) => (
              <label key={k}>
                {label}
                <input
                  name={k}
                  maxLength={2000}
                  required={["name", "value", "unit", "date"].includes(k)}
                  type={
                    k === "date"
                      ? "date"
                      : ["low", "high", "value"].includes(k)
                        ? "number"
                        : "text"
                  }
                  step="any"
                  max={k === "date" ? dateKey() : undefined}
                  value={edit[k]}
                  onChange={(e) => {
                    setEdit({ ...edit, [k]: e.target.value });
                    setStatus("");
                  }}
                />
              </label>
            ))}
          </div>
          <div className="actions">
            <button className="primary">Save result</button>
            <button
              type="button"
              onClick={() => {
                setEdit(null);
                setStatus("");
                onDirty?.(false);
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
      <p role="status">{status}</p>
      {[...data.labs]
        .sort((a, b) => b.date.localeCompare(a.date))
        .map((l) => (
          <article className="record" key={l.id}>
            <div>
              <small>
                {pretty(l.date)}, {l.date.slice(0, 4)} ·{" "}
                {l.source || "Manually entered"}
              </small>
              <h3>{l.name}</h3>
              <strong>
                {l.value} {l.unit}
              </strong>
              <small>
                {l.low !== "" || l.high !== ""
                  ? `Lab reference: ${l.low !== "" ? l.low : "not provided"} – ${l.high !== "" ? l.high : "not provided"} ${l.unit}`
                  : "Reference range not provided"}
              </small>
              <p>{l.notes}</p>
            </div>
            <button
              disabled={!!edit}
              aria-label={`Edit ${l.name} result from ${l.date}`}
              onClick={() => {
                setEdit({ ...l });
                setStatus("");
              }}
            >
              Edit result
            </button>
          </article>
        ))}
      {!data.labs.length && (
        <p className="empty-state">
          No lab results yet. Add a result from your laboratory report.
        </p>
      )}
      <p className="muted">
        Reference ranges vary by laboratory and clinical context. Your clinician
        can help interpret results.
      </p>
    </>
  );
}
export function Cycles({
  data,
  onEdit,
}: Props & { onEdit?: (date: string) => void }) {
  const cycles = cycleHistory(data.logs);
  return (
    <>
      <div className="section-head">
        <h2>Your cycle history</h2>
        {onEdit && (
          <button className="primary" onClick={() => onEdit(dateKey())}>
            Record bleeding
          </button>
        )}
      </div>
      <p>Based on the period starts and ends you recorded.</p>
      {[...cycles].reverse().map((c) => (
        <div className="record" key={c.start}>
          <div>
            <h3>{pretty(c.start)}</h3>
            <p>
              {c.end
                ? `Period ended ${pretty(c.end)}`
                : "No period end recorded"}
            </p>
          </div>
          <strong>
            {c.length
              ? `${c.length} days between starts`
              : "No next start recorded"}
          </strong>
          {onEdit && (
            <button
              onClick={() => onEdit(c.start)}
              aria-label={`Edit cycle starting ${c.start}`}
            >
              Edit start
            </button>
          )}
          {onEdit && c.end && (
            <button onClick={() => onEdit(c.end!)}>Edit end</button>
          )}
        </div>
      ))}
      {!cycles.length && (
        <p>
          Record a period start in your daily check-in to begin your cycle
          history.
        </p>
      )}
    </>
  );
}

export function WeightManager({
  data,
  save,
  onDirty,
  onEditDate,
}: Props & { onEditDate?: (date: string) => void }) {
  const [targetUnit, setTargetUnit] = useState<"lbs" | "kg">("lbs");
  const [selectedRangeDays, setSelectedRangeDays] = useState<number>(90);
  const [searchQuery, setSearchQuery] = useState("");
  const [editDate, setEditDate] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formDate, setFormDate] = useState(dateKey());
  const [formWeight, setFormWeight] = useState("");
  const [formUnit, setFormUnit] = useState<"lbs" | "kg">("lbs");
  const [formNote, setFormNote] = useState("");
  const [status, setStatus] = useState("");

  const stats = weightStats(data.logs, targetUnit);

  // Filter logs for weight trend
  const allWeightLogs = useMemo(() => {
    return data.logs
      .filter((l) => l.weight !== undefined && Number.isFinite(l.weight) && l.weight > 0)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [data.logs]);

  const filteredLogs = useMemo(() => {
    let list = allWeightLogs;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((l) => {
        const val = convertWeight(l.weight!, l.weightUnit || "lbs", targetUnit);
        return (
          l.date.includes(q) ||
          pretty(l.date).toLowerCase().includes(q) ||
          String(val).includes(q) ||
          Boolean(l.weightNote && l.weightNote.toLowerCase().includes(q))
        );
      });
    }
    return list;
  }, [allWeightLogs, searchQuery, targetUnit]);

  // Chart data: chronological within selected range
  const chartData = useMemo(() => {
    const rangeStart = addDays(dateKey(), 1 - selectedRangeDays);
    const inRange = data.logs
      .filter(
        (l) =>
          l.date >= rangeStart &&
          l.date <= dateKey() &&
          l.weight !== undefined &&
          Number.isFinite(l.weight) &&
          l.weight > 0
      )
      .sort((a, b) => a.date.localeCompare(b.date));

    if (!inRange.length) return null;

    const points = inRange.map((l) => ({
      date: l.date,
      value: convertWeight(l.weight!, l.weightUnit || "lbs", targetUnit),
      note: l.weightNote,
      periodStart: Boolean(l.periodStart),
      bleeding: Boolean(l.bleeding && l.bleeding !== "None"),
    }));

    const vals = points.map((p) => p.value);
    const minVal = Math.min(...vals);
    const maxVal = Math.max(...vals);
    const padding = Math.max(1, (maxVal - minVal) * 0.15);
    const yMin = Math.floor(minVal - padding);
    const yMax = Math.ceil(maxVal + padding);

    return { points, minVal, maxVal, yMin, yMax };
  }, [data.logs, selectedRangeDays, targetUnit]);

  function handleSaveEntry(e: React.FormEvent) {
    e.preventDefault();
    const parsedWeight = parseFloat(formWeight);
    if (!Number.isFinite(parsedWeight) || parsedWeight <= 0 || parsedWeight > 1000) {
      setStatus("Enter a valid weight between 1 and 1000.");
      return;
    }

    const existingLog = data.logs.find((l) => l.date === formDate);
    const updatedLog: Log = existingLog
      ? {
          ...existingLog,
          weight: parsedWeight,
          weightUnit: formUnit,
          weightNote: formNote.trim() || undefined,
        }
      : {
          id: formDate,
          userId: data.user.id,
          date: formDate,
          symptoms: [],
          doses: {},
          sideEffects: {},
          weight: parsedWeight,
          weightUnit: formUnit,
          weightNote: formNote.trim() || undefined,
        };

    const nextLogs = [
      ...data.logs.filter((l) => l.date !== formDate),
      updatedLog,
    ];

    if (save({ ...data, logs: nextLogs })) {
      setStatus(`Weight entry saved for ${pretty(formDate)}.`);
      setIsFormOpen(false);
      setFormWeight("");
      setFormNote("");
      setEditDate(null);
      onDirty?.(false);
    } else {
      setStatus("Could not save. Please try again.");
    }
  }

  function handleStartEdit(log: Log) {
    setFormDate(log.date);
    setFormWeight(String(log.weight ?? ""));
    setFormUnit(log.weightUnit || "lbs");
    setFormNote(log.weightNote || "");
    setEditDate(log.date);
    setIsFormOpen(true);
    setStatus("");
  }

  function handleDeleteEntry(date: string) {
    if (
      !window.confirm(
        `Are you sure you want to remove the weight entry for ${pretty(date)}?`
      )
    ) {
      return;
    }
    const log = data.logs.find((l) => l.date === date);
    if (!log) return;

    const updatedLog: Log = {
      ...log,
      weight: undefined,
      weightUnit: undefined,
      weightNote: undefined,
    };

    const nextLogs = [
      ...data.logs.filter((l) => l.date !== date),
      updatedLog,
    ];

    save({ ...data, logs: nextLogs });
    setStatus(`Weight entry for ${pretty(date)} was removed.`);
  }

  return (
    <div className="weight-manager">
      <div className="section-head">
        <div>
          <h2>Weight & body patterns</h2>
          <p>
            Track weight on your terms. Observe longitudinal rhythms and normal cycle-linked fluid shifts without judgment.
          </p>
        </div>
        <div className="weight-header-controls">
          <div className="unit-toggle-chips" role="group" aria-label="Preferred display unit">
            <button
              type="button"
              className={`chip-unit ${targetUnit === "lbs" ? "active" : ""}`}
              onClick={() => setTargetUnit("lbs")}
            >
              lbs
            </button>
            <button
              type="button"
              className={`chip-unit ${targetUnit === "kg" ? "active" : ""}`}
              onClick={() => setTargetUnit("kg")}
            >
              kg
            </button>
          </div>
          <button
            type="button"
            className="primary"
            onClick={() => {
              if (isFormOpen && !editDate) {
                setIsFormOpen(false);
              } else {
                setFormDate(dateKey());
                setFormWeight("");
                setFormNote("");
                setFormUnit(targetUnit);
                setEditDate(null);
                setIsFormOpen(true);
                setStatus("");
              }
            }}
          >
            {isFormOpen && !editDate ? "Close form" : "Log weight"}
          </button>
        </div>
      </div>

      {/* Summary Statistics Cards */}
      <div className="weight-stats-grid">
        <div className="weight-stat-card">
          <span className="stat-label">Latest recorded</span>
          <strong className="stat-value">
            {stats.latest ? `${stats.latest.value} ${targetUnit}` : "—"}
          </strong>
          <small className="stat-sub">
            {stats.latest ? `${pretty(stats.latest.date)} · ${stats.latest.date.slice(0, 4)}` : "No entries yet"}
          </small>
        </div>

        <div className="weight-stat-card">
          <span className="stat-label">Recorded entries</span>
          <strong className="stat-value">{stats.count}</strong>
          <small className="stat-sub">
            {stats.count === 1 ? "1 check-in" : `${stats.count} logged check-ins`}
          </small>
        </div>

        <div className="weight-stat-card">
          <span className="stat-label">Recorded range</span>
          <strong className="stat-value">
            {stats.min !== null && stats.max !== null
              ? `${stats.min} – ${stats.max} ${targetUnit}`
              : "—"}
          </strong>
          <small className="stat-sub">
            {stats.range !== null ? `Fluctuation: ±${(stats.range / 2).toFixed(1)} ${targetUnit}` : "Requires 2+ entries"}
          </small>
        </div>

        <div className="weight-stat-card">
          <span className="stat-label">Average weight</span>
          <strong className="stat-value">
            {stats.average !== null ? `${stats.average} ${targetUnit}` : "—"}
          </strong>
          <small className="stat-sub">
            {stats.netChange !== null
              ? `Net span change: ${stats.netChange > 0 ? "+" : ""}${stats.netChange} ${targetUnit}`
              : "Overall average"}
          </small>
        </div>
      </div>

      {/* Quick Add / Edit Form */}
      {isFormOpen && (
        <form className="panel weight-form-panel" onSubmit={handleSaveEntry}>
          <div className="panel-title-row">
            <h3>{editDate ? `Edit weight for ${pretty(formDate)}` : "Log a weight check-in"}</h3>
            <button
              type="button"
              className="button button-quiet"
              style={{ padding: "4px 8px", fontSize: "12px" }}
              onClick={() => {
                setIsFormOpen(false);
                setEditDate(null);
              }}
            >
              Cancel
            </button>
          </div>
          <div className="form-grid">
            <label>
              Date
              <input
                type="date"
                required
                max={dateKey()}
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
              />
            </label>
            <div className="weight-log-field">
              <div className="weight-label-row">
                <label htmlFor="weight-entry-input" style={{ marginBottom: 0 }}>Weight</label>
                <div className="unit-toggle-chips" role="group" aria-label="Input unit">
                  <button
                    type="button"
                    className={`chip-unit ${formUnit === "lbs" ? "active" : ""}`}
                    onClick={() => setFormUnit("lbs")}
                  >
                    lbs
                  </button>
                  <button
                    type="button"
                    className={`chip-unit ${formUnit === "kg" ? "active" : ""}`}
                    onClick={() => setFormUnit("kg")}
                  >
                    kg
                  </button>
                </div>
              </div>
              <input
                id="weight-entry-input"
                type="number"
                min="20"
                max="1000"
                step="0.1"
                required
                placeholder={formUnit === "kg" ? "e.g. 67.5" : "e.g. 148.5"}
                value={formWeight}
                onChange={(e) => setFormWeight(e.target.value)}
              />
            </div>
            <label style={{ gridColumn: "1 / -1" }}>
              Context or note (optional)
              <input
                type="text"
                maxLength={200}
                placeholder="e.g. Morning, before breakfast, fasting"
                value={formNote}
                onChange={(e) => setFormNote(e.target.value)}
              />
            </label>
          </div>
          <div className="actions">
            <button type="submit" className="primary">
              {editDate ? "Update entry" : "Save weight entry"}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsFormOpen(false);
                setEditDate(null);
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {status && <p role="status" className="weight-status-msg">{status}</p>}

      {/* Visual Weight Trend Chart */}
      <section className="weight-chart-section card-surface" aria-labelledby="weight-chart-title">
        <div className="weight-chart-header">
          <div>
            <h3 id="weight-chart-title">Weight over time</h3>
            <p>
              Longitudinal tracking. Dot markers with amber rings indicate period starts (Cycle Day 1).
            </p>
          </div>
          <div className="range-pills" role="group" aria-label="Chart time window">
            {[
              [30, "30 days"],
              [90, "90 days"],
              [180, "180 days"],
              [365, "1 year"],
              [730, "2 years"],
            ].map(([days, label]) => (
              <button
                key={days}
                type="button"
                className={`range-pill ${selectedRangeDays === days ? "active" : ""}`}
                onClick={() => setSelectedRangeDays(Number(days))}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {chartData && chartData.points.length > 0 ? (
          <div className="weight-chart-wrapper">
            <svg
              className="weight-svg-chart"
              viewBox="0 0 800 240"
              preserveAspectRatio="none"
              role="img"
              aria-label={`Weight trend chart over ${selectedRangeDays} days`}
            >
              <defs>
                <linearGradient id="weightLineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--teal)" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="var(--teal)" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const y = 20 + ratio * 180;
                const val = Math.round(chartData.yMax - ratio * (chartData.yMax - chartData.yMin));
                return (
                  <g key={ratio} className="chart-grid-line">
                    <line x1="45" y1={y} x2="785" y2={y} stroke="currentColor" strokeDasharray="3 3" opacity="0.15" />
                    <text x="38" y={y + 4} textAnchor="end" fontSize="11" fill="var(--muted)">
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* Area Fill */}
              {chartData.points.length > 1 && (
                <polygon
                  points={`
                    45,200
                    ${chartData.points
                      .map((pt, i) => {
                        const x = 45 + (i / (chartData.points.length - 1)) * 740;
                        const y = 200 - ((pt.value - chartData.yMin) / (chartData.yMax - chartData.yMin)) * 180;
                        return `${x},${y}`;
                      })
                      .join(" ")}
                    785,200
                  `}
                  fill="url(#weightLineGrad)"
                />
              )}

              {/* Trend Polyline */}
              {chartData.points.length > 1 && (
                <polyline
                  points={chartData.points
                    .map((pt, i) => {
                      const x = 45 + (i / (chartData.points.length - 1)) * 740;
                      const y = 200 - ((pt.value - chartData.yMin) / (chartData.yMax - chartData.yMin)) * 180;
                      return `${x},${y}`;
                    })
                    .join(" ")}
                  fill="none"
                  stroke="var(--teal)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Points */}
              {chartData.points.map((pt, i) => {
                const x = chartData.points.length === 1 ? 400 : 45 + (i / (chartData.points.length - 1)) * 740;
                const y = 200 - ((pt.value - chartData.yMin) / (chartData.yMax - chartData.yMin)) * 180;
                return (
                  <g key={pt.date + i} className="chart-point-group">
                    {pt.periodStart && (
                      <circle cx={x} cy={y} r="8" fill="none" stroke="#b45309" strokeWidth="2" strokeDasharray="2 2" />
                    )}
                    <circle
                      cx={x}
                      cy={y}
                      r={pt.periodStart ? 5 : 4}
                      fill={pt.periodStart ? "#b45309" : "var(--teal)"}
                      stroke="#fffdf8"
                      strokeWidth="1.5"
                    >
                      <title>{`${pretty(pt.date)}: ${pt.value} ${targetUnit}${pt.periodStart ? " (Cycle Day 1)" : ""}${pt.note ? ` · ${pt.note}` : ""}`}</title>
                    </circle>
                  </g>
                );
              })}
            </svg>

            {/* X-axis dates */}
            <div className="weight-chart-xaxis">
              <span>{pretty(chartData.points[0].date)}</span>
              {chartData.points.length > 2 && (
                <span>{pretty(chartData.points[Math.floor(chartData.points.length / 2)].date)}</span>
              )}
              <span>{pretty(chartData.points[chartData.points.length - 1].date)}</span>
            </div>

            <div className="weight-chart-legend">
              <span className="legend-item">
                <span className="legend-dot weight-dot" />
                Weight entry ({targetUnit})
              </span>
              <span className="legend-item">
                <span className="legend-dot period-dot" />
                Period start (Cycle Day 1)
              </span>
            </div>
          </div>
        ) : (
          <p className="empty-chart-note">
            No weight entries recorded in the last {selectedRangeDays} days. Log an entry to see your pattern.
          </p>
        )}
      </section>

      {/* History Management Table */}
      <section className="weight-history-section" aria-labelledby="weight-history-title">
        <div className="section-head">
          <div>
            <h3 id="weight-history-title">Weight history</h3>
            <p>View, update, or remove recorded check-ins.</p>
          </div>
          <div className="weight-search-box">
            <input
              type="text"
              placeholder="Search by date or note (e.g. 'fasting', 'Sep')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search weight history"
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-action"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {filteredLogs.length ? (
          <div className="weight-entries-list">
            {filteredLogs.map((l) => {
              const convertedVal = convertWeight(l.weight!, l.weightUnit || "lbs", targetUnit);
              const isDifferentUnit = l.weightUnit && l.weightUnit !== targetUnit;

              return (
                <article className="record weight-entry-card" key={l.date}>
                  <div className="entry-main-col">
                    <div className="entry-header-line">
                      <time dateTime={l.date} className="entry-date-text">
                        {pretty(l.date)}, {l.date.slice(0, 4)}
                      </time>
                      {l.periodStart && (
                        <span className="badge" style={{ background: "#fef3c7", color: "#92400e" }}>
                          Cycle Day 1
                        </span>
                      )}
                      {l.bleeding && l.bleeding !== "None" && (
                        <span className="badge">Flow: {l.bleeding}</span>
                      )}
                    </div>
                    <div className="entry-weight-val">
                      <strong>
                        {convertedVal} {targetUnit}
                      </strong>
                      {isDifferentUnit && (
                        <small className="muted" style={{ marginLeft: "8px" }}>
                          (logged as {l.weight} {l.weightUnit})
                        </small>
                      )}
                    </div>
                    {l.weightNote && <p className="entry-note-text">&ldquo;{l.weightNote}&rdquo;</p>}
                  </div>

                  <div className="entry-actions-col">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(l)}
                      aria-label={`Edit weight entry for ${pretty(l.date)}`}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="button-danger-quiet"
                      onClick={() => handleDeleteEntry(l.date)}
                      aria-label={`Delete weight entry for ${pretty(l.date)}`}
                    >
                      Remove
                    </button>
                    {onEditDate && (
                      <button
                        type="button"
                        className="button-quiet"
                        onClick={() => onEditDate(l.date)}
                        aria-label={`Open full check-in for ${pretty(l.date)}`}
                        title="Open full daily check-in"
                      >
                        Full log
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="empty-state">
            {searchQuery
              ? "No weight entries match your search."
              : "No weight check-ins recorded yet. Click 'Log weight' above to begin."}
          </p>
        )}
      </section>
    </div>
  );
}
