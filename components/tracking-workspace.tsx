"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import { DailyLogForm, Medications, Labs, Cycles } from "./tracking";
import { dateKey, emptyData, HealthData, pretty } from "../lib/health";
import {
  healthStorageKey,
  parseStoredHealthData,
} from "../lib/health-storage";

const sections = [
  "Daily log",
  "Cycles",
  "Medications",
  "Lab results",
  "Previous logs",
] as const;
type Section = (typeof sections)[number];
const subscribe = () => () => {};
export function TrackingWorkspace() {
  const ready = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  return ready ? (
    <LoadedTrackingWorkspace />
  ) : (
    <div className="tracking">
      <p role="status">Loading your journal…</p>
    </div>
  );
}
function readStorage(): { data: HealthData | null; error: string } {
  try {
    const stored = parseStoredHealthData(
      localStorage.getItem(healthStorageKey),
    );
    if (stored.invalid) throw new Error();
    return { data: stored.data ?? emptyData("local-user"), error: "" };
  } catch {
    return {
      data: null,
      error:
        "Your saved records could not be loaded. They have not been overwritten. Check that browser storage is available, then reload.",
    };
  }
}
function LoadedTrackingWorkspace() {
  const [initial] = useState(readStorage);
  const [data, setData] = useState(initial.data);
  const error = initial.error;
  const [section, setSection] = useState<Section>("Daily log");
  const [date, setDate] = useState(dateKey());
  const [dirty, setDirty] = useState(false);
  const [pending, setPending] = useState<{
    section: Section;
    date: string;
  } | null>(null);
  useEffect(() => {
    const prevent = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", prevent);
    return () => window.removeEventListener("beforeunload", prevent);
  }, [dirty]);
  function navigate(next: Section, nextDate = dateKey()) {
    if (next === section) return;
    if (dirty) {
      setPending({ section: next, date: nextDate });
      return;
    }
    setSection(next);
    setDate(nextDate);
  }
  function save(next: HealthData) {
    try {
      localStorage.setItem(healthStorageKey, JSON.stringify(next));
      setData(next);
      setDirty(false);
      return true;
    } catch {
      return false;
    }
  }
  return (
    <div className="tracking">
      <a className="skip-link" href="#tracking-content">
        Skip to tracking form
      </a>
      <header className="track-header">
        <div>
          <p className="track-brand">Your health journal</p>
          <h1>Make room for how you feel.</h1>
          <p>A few details today. A clearer record over time.</p>
        </div>
        <span className="privacy-note">
          Stored in this browser only
          <br />
          No account or cloud backup
        </span>
      </header>
      <nav className="track-nav" aria-label="Tracking sections">
        {sections.map((s) => (
          <button
            key={s}
            aria-current={section === s ? "page" : undefined}
            onClick={() => navigate(s)}
          >
            {s}
          </button>
        ))}
      </nav>
      {pending && (
        <div className="unsaved" role="alert">
          <p>
            You have unsaved changes. Keep editing or discard them to switch
            views.
          </p>
          <div className="actions">
            <button onClick={() => setPending(null)}>Keep editing</button>
            <button
              onClick={() => {
                setDirty(false);
                setSection(pending.section);
                setDate(pending.date);
                setPending(null);
              }}
            >
              Discard changes
            </button>
          </div>
        </div>
      )}
      {error ? (
        <p role="alert">{error}</p>
      ) : !data ? (
        <p role="status">Loading your journal…</p>
      ) : (
        <section
          id="tracking-content"
          tabIndex={-1}
          className="track-content"
          key={`${section}-${date}`}
          onChangeCapture={() => setDirty(true)}
        >
          {section === "Daily log" && (
            <DailyLogForm
              data={data}
              save={save}
              date={date}
              onDirty={setDirty}
            />
          )}
          {section === "Cycles" && (
            <Cycles
              data={data}
              save={save}
              onEdit={(d) => navigate("Daily log", d)}
            />
          )}
          {section === "Medications" && (
            <Medications data={data} save={save} onDirty={setDirty} />
          )}
          {section === "Lab results" && (
            <Labs data={data} save={save} onDirty={setDirty} />
          )}
          {section === "Previous logs" && (
            <>
              <h2>Previous logs</h2>
              <p>Open an entry to update any detail.</p>
              {[...data.logs]
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((l) => (
                  <article className="record" key={l.id}>
                    <div>
                      <h3>
                        {pretty(l.date)}, {l.date.slice(0, 4)}
                      </h3>
                      <p>{l.symptoms.join(", ") || "No symptoms recorded"}</p>
                      <small>
                        {[
                          l.bleeding && `Bleeding: ${l.bleeding}`,
                          l.periodStart && "Period started",
                          l.periodEnd && "Period ended",
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </small>
                    </div>
                    <button
                      aria-label={`Edit entry for ${l.date}`}
                      onClick={() => navigate("Daily log", l.date)}
                    >
                      Edit entry
                    </button>
                  </article>
                ))}
              {!data.logs.length && (
                <p className="empty-state">
                  Your saved check-ins will appear here. Start with today, or
                  choose an earlier date in Daily log.
                </p>
              )}
            </>
          )}
        </section>
      )}
      <footer className="track-footer">
        Your records stay on this device. Clearing browser data removes them.
        Anyone using this browser profile may be able to view them.
      </footer>
    </div>
  );
}
