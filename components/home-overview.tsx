"use client";

import Link from "next/link";
import { CycleWheel } from "./cycle-wheel";
import { useState, useSyncExternalStore } from "react";
import {
  addDays,
  cycleHistory,
  pretty,
  scoped,
  type HealthData,
} from "../lib/health";
import { EmptyState, Icon, SectionHeading } from "./ui";
import { getInitialOrStoredHealthData } from "../lib/health-storage";

type Props = { data: HealthData; today: string };
const subscribe = () => () => {};

export function HomeOverview(props: Props) {
  const ready = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  return ready ? (
    <LoadedHomeOverview {...props} />
  ) : (
    <HomeOverviewContent {...props} personalData={null} />
  );
}

function LoadedHomeOverview(props: Props) {
  const [personalData] = useState(() => {
    return getInitialOrStoredHealthData();
  });

  return <HomeOverviewContent {...props} personalData={personalData} />;
}

function HomeOverviewContent({
  data: emptyStateData,
  personalData,
  today,
}: Props & { personalData: HealthData | null }) {
  const data = scoped(personalData ?? emptyStateData);
  const logs = [...data.logs]
    .filter((log) => log.date <= today)
    .sort((a, b) => b.date.localeCompare(a.date));
  const cycles = cycleHistory(logs);
  const dates = Array.from({ length: 14 }, (_, i) => addDays(today, i - 13));
  return (
    <>
      <section className="page-hero" aria-labelledby="home-hero-title">
        <div className="hero-content">
          <p className="hero-badge">Your personal health journal</p>
          <h1 id="home-hero-title">
            A little more context.
            <br />A clearer picture of you.
          </h1>
          <p className="hero-subtitle">
            Bring the small details together, one day at a time, to understand your patterns and cycles.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/track">
              <Icon name="track" />
              <span>Go to Track</span>
              <Icon name="arrow" />
            </Link>
            <Link className="button button-quiet" href="/insights">
              <Icon name="insights" />
              <span>View Insights</span>
            </Link>
          </div>
        </div>
      </section>
      <div className="home-summary-row">
        <CycleWheel cycles={cycles} today={today} />
        <section className="recent-context home-recent-entries" aria-labelledby="recent-entries-title" id="recent-entries">
          <h2 id="recent-entries-title">Most recent entries</h2>
          {logs.length ? (
            <div className="recent-entry-list">
              {logs.slice(0, 3).map((log) => (
                <article className="recent-entry" key={log.id}>
                  <h3><time dateTime={log.date}>{pretty(log.date)}</time></h3>
                  <p>{log.symptoms.length ? log.symptoms.join(", ") : "No symptoms selected in this entry."}</p>
                  {log.bleeding && <p className="recent-entry-detail">Bleeding: {log.bleeding}</p>}
                  {log.notes && <p className="recent-entry-note">{log.notes}</p>}
                </article>
              ))}
            </div>
          ) : <p className="recent-entry-empty">Your saved check-ins will appear here. Start with what feels useful today.</p>}
          <Link className="text-link" href="/track">
            {logs.length ? "Open your daily log" : "Add your first entry"} <Icon name="arrow" />
          </Link>
        </section>
      </div>
      {personalData ? (
        <>
          <section className="history-surface" aria-labelledby="history-title">
            <SectionHeading
              title="The last two weeks"
              description={`${pretty(dates[0])} – ${pretty(today)} · Your recorded history`}
            >
              <span className="history-key">
                <span />
                Recorded
              </span>
            </SectionHeading>
            <h3 id="history-title" className="sr-only">
              Symptom and bleeding history
            </h3>
            <div
              className="history-scroll"
              role="region"
              aria-label="Two-week history, scroll horizontally for all dates"
              tabIndex={0}
            >
              <table className="history-table">
                <thead>
                  <tr>
                    <th scope="col">Recorded detail</th>
                    {dates.map((date) => (
                      <th key={date} scope="col">
                        <span>
                          {new Date(date + "T12:00:00").toLocaleDateString(
                            "en-US",
                            { weekday: "narrow" },
                          )}
                        </span>
                        <time dateTime={date}>{Number(date.slice(-2))}</time>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {["Bleeding", "Acne", "Fatigue", "Bloating"].map((layer) => (
                    <tr key={layer}>
                      <th scope="row">{layer}</th>
                      {dates.map((date) => {
                        const log = logs.find((entry) => entry.date === date);
                        const recorded =
                          layer === "Bleeding"
                            ? Boolean(log?.bleeding && log.bleeding !== "None")
                            : Boolean(log?.symptoms.includes(layer));
                        return (
                          <td key={date}>
                            <span
                              className={`history-mark${recorded ? " is-recorded" : ""}`}
                              aria-label={`${pretty(date)}: ${recorded ? "recorded" : log ? "not selected" : "no entry"}`}
                            >
                              {recorded ? "●" : "–"}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="history-caption">
              A dot marks a recorded detail. A dash means no entry or not
              selected; it does not confirm the absence of a symptom.
            </p>
          </section>
        </>
      ) : (
        <section className="history-surface">
          <EmptyState title="Begin with today">
            Record what feels useful—symptoms, your cycle, sleep, medications,
            or a note. Your history will take shape one entry at a time.
          </EmptyState>
          <div className="empty-actions">
            <Link
              className="button button-primary"
              href="/track"
            >
              Create your first entry
              <Icon name="arrow" />
            </Link>
          </div>
        </section>
      )}
    </>
  );
}
