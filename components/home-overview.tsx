"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import {
  addDays,
  cycleHistory,
  daysBetween,
  pretty,
  scoped,
  type HealthData,
} from "../lib/health";
import { EmptyState, Icon, SectionHeading } from "./ui";
import {
  healthStorageKey,
  parseStoredHealthData,
} from "../lib/health-storage";

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
    try {
      return parseStoredHealthData(localStorage.getItem(healthStorageKey)).data;
    } catch {
      return null;
    }
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
  const recentCycles = [...cycles].reverse().slice(0, 4);
  const latestCycle = recentCycles[0];
  const visibleCycleDays = recentCycles.map((cycle) =>
    cycle.length ?? daysBetween(cycle.start, today) + 1,
  );
  const cycleScale = Math.max(45, ...visibleCycleDays);
  const dates = Array.from({ length: 14 }, (_, i) => addDays(today, i - 13));
  const recent = logs.slice(0, 4);
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
      {personalData ? (
        <>
          <section
            className="cycle-history-surface"
            aria-labelledby="cycle-history-title"
          >
            <div className="cycle-history-intro">
              <div>
                <h2 id="cycle-history-title">Cycle history</h2>
                <p>
                  A view of the period starts and ends you recorded. No dates
                  are predicted.
                </p>
              </div>
              <div className="cycle-now" aria-label="Latest recorded cycle">
                <span>Latest recorded cycle</span>
                <strong>
                  {latestCycle
                    ? `Day ${daysBetween(latestCycle.start, today) + 1}`
                    : "Not started"}
                </strong>
                <small>
                  {latestCycle
                    ? `Started ${pretty(latestCycle.start)}`
                    : "No period start recorded"}
                </small>
              </div>
            </div>

            {recentCycles.length ? (
              <>
                <div className="cycle-ledger">
                  {recentCycles.map((cycle) => {
                    const days =
                      cycle.length ?? daysBetween(cycle.start, today) + 1;
                    const periodDays = cycle.end
                      ? daysBetween(cycle.start, cycle.end) + 1
                      : 1;
                    const isCurrent = cycle.length === null;

                    return (
                      <article
                        className={`cycle-ledger-row${isCurrent ? " is-current" : ""}`}
                        key={cycle.start}
                      >
                        <div className="cycle-date">
                          <time dateTime={cycle.start}>
                            {pretty(cycle.start)}
                          </time>
                          <span>
                            {cycle.end
                              ? `Period ended ${pretty(cycle.end)}`
                              : "No period end recorded"}
                          </span>
                        </div>
                        <div
                          className="cycle-track"
                          role="img"
                          aria-label={`${isCurrent ? "Current cycle" : "Recorded cycle"} starting ${pretty(cycle.start)}: ${isCurrent ? `day ${days}` : `${days} days between starts`}${cycle.end ? `; period end recorded ${pretty(cycle.end)}` : "; no period end recorded"}`}
                        >
                          <span
                            className="cycle-span"
                            style={{ width: `${(days / cycleScale) * 100}%` }}
                          >
                            <span
                              className="period-span"
                              style={{
                                width: `${Math.min(100, (periodDays / days) * 100)}%`,
                              }}
                            />
                          </span>
                        </div>
                        <strong>{isCurrent ? `Day ${days}` : `${days} days`}</strong>
                      </article>
                    );
                  })}
                </div>
                <div className="cycle-legend" aria-label="Cycle history key">
                  <span>
                    <i className="legend-period" aria-hidden="true" /> Recorded
                    period
                  </span>
                  <span>
                    <i className="legend-cycle" aria-hidden="true" /> Time
                    between starts
                  </span>
                  <span>
                    <i className="legend-current" aria-hidden="true" /> Current,
                    unfinished cycle
                  </span>
                </div>
                <p className="cycle-caption">
                  Cycle length is counted between recorded period starts. A
                  missing end date or unfinished cycle means the record is
                  incomplete—not that bleeding continued.
                </p>
              </>
            ) : (
              <div className="cycle-empty">
                <p>
                  Period starts recorded in Track will build a cycle history
                  here.
                </p>
              </div>
            )}
          </section>

          <section
            className="recent-context recent-context-condensed"
            aria-label="Recent health context"
          >
            <div>
              <span className="context-label">Most recent entry</span>
              <h2>{logs[0] ? pretty(logs[0].date) : "No entries yet"}</h2>
              <p>
                {logs[0]?.symptoms.length
                  ? logs[0].symptoms.join(", ")
                  : "No symptoms selected in this entry."}
              </p>
              <a className="text-link" href="#recent-entries">
                Read recent entries <Icon name="arrow" />
              </a>
            </div>
            <div className="check-in-note">
              <Icon name="leaf" />
              <h3>There’s room for the everyday.</h3>
              <p>
                Sleep, symptoms, or simply how you felt. The details you choose
                to record belong in your story.
              </p>
            </div>
          </section>
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
          <section id="recent-entries" className="entries-section" aria-labelledby="recent-entries-title">
            <SectionHeading
              title="Recent entries"
              description="The details, in your own time."
            />
            {recent.length ? (
              <ol className="entry-list">
                {recent.map((log) => (
                  <li key={log.id}>
                    <time dateTime={log.date}>{pretty(log.date)}</time>
                    <div>
                      <h3>
                        {log.symptoms.length
                          ? log.symptoms.join(", ")
                          : "Daily check-in"}
                      </h3>
                      <p>
                        {log.sleepMinutes !== undefined
                          ? `Sleep: ${Math.floor(log.sleepMinutes / 60)}h ${log.sleepMinutes % 60}m`
                          : "Sleep not recorded"}
                        {log.energy !== undefined
                          ? ` · Energy: ${log.energy}/5`
                          : ""}
                      </p>
                      <details>
                        <summary>Entry details</summary>
                        <p>{log.notes || "No additional note recorded."}</p>
                        <p>
                          Bleeding: {log.bleeding ?? "not recorded"}. Movement:{" "}
                          {log.movement ?? "not recorded"}.
                        </p>
                      </details>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="cycle-empty">No entries recorded yet.</p>
            )}
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
