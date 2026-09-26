"use client";

import Link from "next/link";
import { useState } from "react";
import {
  addDays,
  daysBetween,
  pretty,
  scoped,
  type HealthData,
} from "../lib/health";
import { EmptyState, Icon, SectionHeading } from "./ui";

type Props = { data: HealthData; today: string };
export function HomeOverview({ data: source, today }: Props) {
  const [showSample, setShowSample] = useState(true);
  const data = scoped(source);
  const logs = [...data.logs]
    .filter((log) => log.date <= today)
    .sort((a, b) => b.date.localeCompare(a.date));
  const lastStart = logs.find((log) => log.periodStart);
  const dates = Array.from({ length: 14 }, (_, i) => addDays(today, i - 13));
  const recent = logs.slice(0, 4);
  return (
    <>
      <div className="page-intro">
        <div>
          <p className="date-label">Your personal health journal</p>
          <h1>
            A little more context.
            <br />A clearer picture of you.
          </h1>
          <p>Bring the small details together, one day at a time.</p>
        </div>
        <Link className="button button-primary" href="/track">
          <Icon name="track" />
          Go to Track
          <Icon name="arrow" />
        </Link>
      </div>
      <div className="sample-notice">
        <div>
          <strong>
            {showSample
              ? "You’re exploring a sample history"
              : "Your journal starts here"}
          </strong>
          <p>
            {showSample
              ? "These entries are fictional. No personal health data is loaded or saved on this page."
              : "This preview does not collect or save health information."}
          </p>
        </div>
        <button
          className="button button-quiet"
          onClick={() => setShowSample(!showSample)}
        >
          {showSample ? "Hide sample" : "View sample"}
        </button>
      </div>
      {showSample ? (
        <>
          <section
            className="recent-context"
            aria-label="Recent health context"
          >
            <div className="cycle-context">
              <span className="context-label">Current cycle · sample</span>
              <h2>
                {lastStart ? (
                  <>Day {daysBetween(lastStart.date, today) + 1}</>
                ) : (
                  "Not recorded"
                )}
              </h2>
              <p>
                {lastStart ? (
                  <>
                    Period start recorded {pretty(lastStart.date)}.<br />
                    Counted from that entry, not a prediction.
                  </>
                ) : (
                  "No period start has been recorded."
                )}
              </p>
            </div>
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
              description={`${pretty(dates[0])} – ${pretty(today)} · Sample recorded history`}
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
          <div className="home-bottom">
            <section id="recent-entries" className="entries-section">
              <SectionHeading
                title="Recent entries"
                description="The details, in your own time."
              />
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
            </section>
            <aside className="care-note">
              <span className="context-label">A moment to reflect</span>
              <h2>What would you like to remember?</h2>
              <p>
                A change in your routine. A question for your next appointment.
                Something that felt different.
              </p>
              <p>You don’t need to have an explanation to make a note of it.</p>
              <div className="care-note-footer">
                Small details can help tell a fuller story.
              </div>
            </aside>
          </div>
        </>
      ) : (
        <section className="history-surface">
          <EmptyState title="A history that grows with you">
            There are no personal entries in this preview. Explore the sample to
            see how daily details can come together, or visit Track to check its
            availability.
          </EmptyState>
          <div className="empty-actions">
            <button
              className="button button-primary"
              onClick={() => setShowSample(true)}
            >
              Explore sample history
            </button>
          </div>
        </section>
      )}
    </>
  );
}
