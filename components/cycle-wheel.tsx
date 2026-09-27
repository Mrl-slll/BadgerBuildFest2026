/* Hallmark · pre-emit critique: P5 H5 E5 S5 R5 V5 */
"use client";

import Link from "next/link";
import { useId, useRef, useState, useEffect } from "react";
import { cycleHistory, daysBetween, pretty } from "../lib/health";

const phases = [
  {
    name: "Period",
    shortName: "Period",
    start: 0,
    end: 5,
    days: "Days 1–5",
    color: "#245d59",
    description: "Menstruation & cycle start",
  },
  {
    name: "Follicular phase",
    shortName: "Follicular",
    start: 5,
    end: 13,
    days: "Days 6–13",
    color: "#66a3bf",
    description: "Follicle development until ovulation",
  },
  {
    name: "Ovulation",
    shortName: "Ovulation",
    start: 13,
    end: 14,
    days: "Day 14",
    color: "#ad7841",
    description: "Estimated fertile window (unconfirmed)",
  },
  {
    name: "Luteal phase",
    shortName: "Luteal",
    start: 14,
    end: 28,
    days: "Days 15–28",
    color: "#3368a0",
    description: "Post-ovulation until next cycle start",
  },
];

export function CycleWheel({ cycles, today }: { cycles: ReturnType<typeof cycleHistory>; today: string }) {
  const labelId = useId().replace(/:/g, "");
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredPhase, setHoveredPhase] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 80);
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return () => clearTimeout(timer);
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.05 }
    );
    observer.observe(el);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  const latest = cycles.at(-1);
  const day = latest ? daysBetween(latest.start, today) + 1 : null;
  // Extend the circle for long cycles; never wrap today back to day 1.
  const total = Math.max(28, (day ?? 1) + 1);

  const point = (index: number, radius: number) => {
    const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
    return {
      x: Number((220 + radius * Math.cos(angle)).toFixed(3)),
      y: Number((220 + radius * Math.sin(angle)).toFixed(3)),
    };
  };

  const arc = (start: number, end: number) => {
    // Seamless connection: zero gap between sections with tiny overlap to prevent hairline seams
    const a = point(start, 174);
    const b = point(end + (end < total ? 0.04 : 0), 174);
    return `M ${a.x} ${a.y} A 174 174 0 ${end - start > total / 2 ? 1 : 0} 1 ${b.x} ${b.y}`;
  };

  const maskId = `wheel-reveal-mask-${labelId}`;
  const hoveredPhaseObj = phases.find((p) => p.name === hoveredPhase) || null;

  return (
    <section
      ref={sectionRef}
      className="cycle-history-surface cycle-history-compact"
      aria-labelledby="cycle-history-title"
    >
      <div className="cycle-wheel-header">
        <div>
          <div className="cycle-wheel-title-row">
            <h2 id="cycle-history-title">Cycle history</h2>
            {day ? <span className="cycle-status-pill">Day {day}</span> : null}
          </div>
          <p>
            {latest
              ? `Current cycle started ${pretty(latest.start)} · Estimated 28-day reference`
              : "Track your cycle phases, period history, and typical intervals."}
          </p>
        </div>
      </div>

      <div className="cycle-wheel-layout">
        <div className="cycle-wheel-visual">
          <svg
            className="cycle-wheel"
            viewBox="0 0 440 440"
            role="img"
            aria-label={`${
              day
                ? `Current cycle day ${day}, started ${pretty(latest!.start)}.`
                : "No period start recorded."
            } Phase bands illustrate a 28-day cycle; ovulation is not confirmed.`}
          >
            <defs>
              <mask id={maskId}>
                <rect x="0" y="0" width="440" height="440" fill="black" />
                <circle
                  cx="220"
                  cy="220"
                  r="174"
                  fill="none"
                  stroke="white"
                  strokeWidth="60"
                  strokeDasharray={1094}
                  strokeDashoffset={isVisible ? 0 : 1094}
                  strokeLinecap="butt"
                  transform="rotate(-90 220 220)"
                  className="cycle-wheel-mask-circle"
                />
              </mask>
            </defs>

            {/* Base neutral guide track */}
            <circle cx="220" cy="220" r="174" fill="none" stroke="var(--line)" strokeWidth="34" />

            {/* Circularly animated colored arcs with interactive hover */}
            <g mask={`url(#${maskId})`}>
              {phases.map((phase) => {
                const isHovered = hoveredPhase === phase.name;
                const isAnyHovered = hoveredPhase !== null;
                return (
                  <path
                    key={phase.name}
                    d={arc(phase.start, phase.end)}
                    fill="none"
                    stroke={phase.color}
                    strokeWidth={34}
                    strokeLinecap="butt"
                    className="cycle-wheel-arc"
                    tabIndex={0}
                    role="button"
                    aria-label={`${phase.name}: ${phase.days}. ${phase.description}`}
                    onMouseEnter={() => setHoveredPhase(phase.name)}
                    onMouseLeave={() => setHoveredPhase(null)}
                    onFocus={() => setHoveredPhase(phase.name)}
                    onBlur={() => setHoveredPhase(null)}
                    style={{
                      cursor: "pointer",
                      opacity: isAnyHovered ? (isHovered ? 1 : 0.35) : 1,
                      transition: "opacity 0.22s ease",
                    }}
                  />
                );
              })}
            </g>

            {/* Active Hover Overlay Arc */}
            {hoveredPhaseObj && (
              <path
                d={arc(hoveredPhaseObj.start, hoveredPhaseObj.end)}
                fill="none"
                stroke={hoveredPhaseObj.color}
                strokeWidth={44}
                strokeLinecap="butt"
                className="cycle-wheel-arc-active"
                style={{
                  pointerEvents: "none",
                  filter: `drop-shadow(0 2px 10px ${hoveredPhaseObj.color}95)`,
                  transition: "stroke-width 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              />
            )}

            {/* Interactive Center Content */}
            <g className="cycle-wheel-center-group" style={{ pointerEvents: "none" }}>
              {hoveredPhaseObj ? (
                <g className="cycle-wheel-center-hover">
                  <circle cx="220" cy="180" r="5" fill={hoveredPhaseObj.color} />
                  <text
                    x="220"
                    y="212"
                    textAnchor="middle"
                    className="wheel-center-phase-name"
                    fill="var(--foreground)"
                  >
                    {hoveredPhaseObj.name}
                  </text>
                  <text
                    x="220"
                    y="238"
                    textAnchor="middle"
                    className="wheel-center-phase-days"
                    fill={hoveredPhaseObj.color}
                  >
                    {hoveredPhaseObj.days}
                  </text>
                  <text
                    x="220"
                    y="262"
                    textAnchor="middle"
                    className="wheel-center-phase-sub"
                    fill="var(--muted)"
                  >
                    {hoveredPhaseObj.description}
                  </text>
                </g>
              ) : (
                <g className="cycle-wheel-center-default">
                  <text
                    x="220"
                    y="186"
                    textAnchor="middle"
                    className="wheel-center-caption"
                    fill="var(--muted)"
                  >
                    {day ? "CURRENT CYCLE" : "CYCLE MODEL"}
                  </text>
                  <text
                    x="220"
                    y="226"
                    textAnchor="middle"
                    className="wheel-center-day"
                    fill="var(--foreground)"
                  >
                    {day ? `Day ${day}` : "28 Days"}
                  </text>
                  <text
                    x="220"
                    y="254"
                    textAnchor="middle"
                    className="wheel-center-sub"
                    fill="var(--muted)"
                  >
                    {day && latest ? `Started ${pretty(latest.start)}` : "Estimated 28-day reference"}
                  </text>
                </g>
              )}
            </g>
          </svg>
        </div>

        {/* Side Legend */}
        <aside className="cycle-wheel-legend" aria-label="Cycle phases legend">
          <div className="cycle-legend-header">
            <span className="cycle-legend-title">Phase colors</span>
            <span className="cycle-legend-model">28-day model</span>
          </div>
          <ul className="cycle-legend-items">
            {phases.map((phase) => {
              const isHovered = hoveredPhase === phase.name;
              const isDimmed = hoveredPhase !== null && !isHovered;
              return (
                <li
                  key={phase.name}
                  className={`cycle-legend-row ${isHovered ? "is-hovered" : ""} ${isDimmed ? "is-dimmed" : ""}`}
                  tabIndex={0}
                  role="button"
                  aria-label={`${phase.name}, ${phase.days}`}
                  onMouseEnter={() => setHoveredPhase(phase.name)}
                  onMouseLeave={() => setHoveredPhase(null)}
                  onFocus={() => setHoveredPhase(phase.name)}
                  onBlur={() => setHoveredPhase(null)}
                  style={{ cursor: "pointer" }}
                >
                  <span
                    className="cycle-legend-swatch"
                    style={{ backgroundColor: phase.color }}
                    aria-hidden="true"
                  />
                  <div className="cycle-legend-body">
                    <div className="cycle-legend-topline">
                      <strong className="cycle-legend-name">{phase.name}</strong>
                      <span className="cycle-legend-days">{phase.days}</span>
                    </div>
                    <p className="cycle-legend-desc">{phase.description}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </aside>
      </div>

      <div className="cycle-wheel-footer">
        <Link className="button button-primary cycle-add-period-btn" href="/track#cycle-bleeding">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Add period</span>
        </Link>

        {cycles.length > 1 && (
          <details className="cycle-previous">
            <summary>Earlier cycles ({cycles.length - 1})</summary>
            <div className="cycle-previous-list">
              {[...cycles]
                .reverse()
                .slice(1)
                .map((cycle) => (
                  <p key={cycle.start}>
                    Started {pretty(cycle.start)} · {cycle.length} days between starts
                    {cycle.end ? ` · ended ${pretty(cycle.end)}` : " · no end date recorded"}
                  </p>
                ))}
            </div>
          </details>
        )}
      </div>
    </section>
  );
}
