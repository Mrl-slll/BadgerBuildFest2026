/* Hallmark · pre-emit critique: P4 H4 E4 S5 R4 V4 */
import Link from "next/link";
import { useId } from "react";
import { cycleHistory, daysBetween, pretty } from "../lib/health";

const phases = [
  { name: "Period", start: 0, end: 5, color: "#245d59", detail: "Days 1–5 in this example" },
  { name: "Follicular phase", start: 5, end: 13, color: "#66a3bf", detail: "Begins on day 1 and continues until ovulation" },
  { name: "Ovulation", start: 13, end: 14, color: "#ad7841", detail: "Day 14 in this example · not confirmed" },
  { name: "Luteal phase", start: 14, end: 28, color: "#3368a0", detail: "After ovulation, until the next period" },
];

export function CycleWheel({ cycles, today }: { cycles: ReturnType<typeof cycleHistory>; today: string }) {
  const labelId = useId().replace(/:/g, "");
  const latest = cycles.at(-1);
  const day = latest ? daysBetween(latest.start, today) + 1 : null;
  // Extend the circle for long cycles; never wrap today back to day 1.
  const total = Math.max(28, (day ?? 1) + 1);
  const point = (index: number, radius: number) => {
    const angle = index / total * 2 * Math.PI - Math.PI / 2;
    return {
      x: Number((220 + radius * Math.cos(angle)).toFixed(3)),
      y: Number((220 + radius * Math.sin(angle)).toFixed(3)),
    };
  };
  const arc = (start: number, end: number) => {
    const gap = Math.min(0.08, (end - start) / 4);
    const a = point(start + gap, 174), b = point(end - gap, 174);
    return `M ${a.x} ${a.y} A 174 174 0 ${end - start > total / 2 ? 1 : 0} 1 ${b.x} ${b.y}`;
  };
  // Markers occupy the clear lane between the labels and the ring's inner edge.
  const current = point((day ?? 1) - 1, 150);
  const ovulation = point(13, 150);
  return (
    <section className="cycle-history-surface cycle-history-compact" aria-labelledby="cycle-history-title">
      <div className="cycle-wheel-header">
        <div><h2 id="cycle-history-title">Cycle history</h2><p>Your cycle at a glance.</p></div>
        <Link className="button button-primary" href="/track#cycle-bleeding">Add period</Link>
      </div>
      <div className="cycle-wheel-layout">
        <svg className="cycle-wheel" viewBox="0 0 440 450" role="img" aria-label={`${day ? `Current cycle day ${day}, started ${pretty(latest!.start)}.` : "No period start recorded."} Phase bands illustrate a 28-day cycle; ovulation is not confirmed.`}>
          <circle cx="220" cy="220" r="174" fill="none" stroke="var(--line)" strokeWidth="22" />
          {phases.map((phase) => <path key={phase.name} d={arc(phase.start, phase.end)} fill="none" stroke={phase.color} strokeWidth="22" strokeLinecap="butt" />)}
          <circle cx="220" cy="70" r="7" fill="#245d59" />
          <text x="220" y="104" textAnchor="middle" className="wheel-marker-label">
            <tspan x="220">Day 1</tspan>
            <tspan x="220" dy="16">Cycle start</tspan>
          </text>
          <circle cx={ovulation.x} cy={ovulation.y} r="9" fill="var(--surface)" stroke="#ad7841" strokeWidth="3" />
          
          {day !== null && <><circle cx={current.x} cy={current.y} r="8" fill="#245d59" stroke="var(--surface)" strokeWidth="2" /><text x={current.x} y={current.y + 3} textAnchor="middle" fill="white" fontSize="8">{day}</text></>}
          {total <= 35 && phases.map((phase, index) => {
            const middle = (phase.start + phase.end) / 2;
            const reverse = middle > total / 4 && middle < total * 3 / 4;
            const start = point(middle - 3.2, 119);
            const end = point(middle + 3.2, 119);
            const from = reverse ? end : start;
            const to = reverse ? start : end;
            const id = `${labelId}-phase-${index}`;
            return <g key={phase.name}>
              <defs><path id={id} d={`M ${from.x} ${from.y} A 119 119 0 0 ${reverse ? 0 : 1} ${to.x} ${to.y}`} /></defs>
              <text className="wheel-phase-label" textAnchor="middle">
                <textPath href={`#${id}`} startOffset="50%">{phase.name.replace(" phase", "")}</textPath>
              </text>
            </g>;
          })}
          <text x="220" y="196" textAnchor="middle" className="wheel-center-label">{day ? "Today" : "Your cycle"}</text>
          <text x="220" y="240" textAnchor="middle" className="wheel-center-day">{day ? `Day ${day}` : "Start here"}</text>
          <text x="220" y="269" textAnchor="middle" className="wheel-center-label">{latest ? `Started ${pretty(latest.start)}` : "Add your first period"}</text>
        </svg>
      </div>
      {total > 35 && <p className="cycle-compact-note">Period · Follicular · Ovulation · Luteal</p>}
      <p className="cycle-compact-note">Phases show a 28-day example. Ovulation is not confirmed.{total > 28 ? " Grey marks extra days; current phase unknown." : ""}</p>
      {cycles.length > 1 && <details className="cycle-previous"><summary>Earlier cycles</summary>{[...cycles].reverse().slice(1).map((cycle) => <p key={cycle.start}>Started {pretty(cycle.start)} · {cycle.length} days between starts{cycle.end ? ` · period ended ${pretty(cycle.end)}` : " · no end date recorded"}</p>)}</details>}
    </section>
  );
}
