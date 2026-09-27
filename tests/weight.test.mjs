import test from "node:test";
import assert from "node:assert/strict";

import {
  convertWeight,
  formatWeight,
  weightStats,
  dateKey,
  addDays,
} from "../lib/health.ts";

test("convertWeight and formatWeight: accurate conversion between lbs and kg", () => {
  // Identity
  assert.equal(convertWeight(150, "lbs", "lbs"), 150);
  assert.equal(convertWeight(68, "kg", "kg"), 68);

  // 150 lbs to kg: 150 / 2.20462262 = 68.0388... -> 68.0
  assert.equal(convertWeight(150, "lbs", "kg"), 68.0);

  // 68.0 kg to lbs: 68 * 2.20462262 = 149.914... -> 149.9
  assert.equal(convertWeight(68, "kg", "lbs"), 149.9);

  // formatWeight
  assert.equal(formatWeight(145.4, "lbs"), "145.4 lbs");
  assert.equal(formatWeight(65.8, "kg"), "65.8 kg");
  assert.equal(formatWeight(undefined), "Not recorded");
  assert.equal(formatWeight(null), "Not recorded");
});

test("weightStats: computes metrics and handles mixed units", () => {
  const empty = weightStats([]);
  assert.equal(empty.count, 0);
  assert.equal(empty.latest, null);
  assert.equal(empty.average, null);

  const logs = [
    {
      id: "2026-01-01",
      userId: "u1",
      date: "2026-01-01",
      symptoms: [],
      doses: {},
      sideEffects: {},
      weight: 155.0,
      weightUnit: "lbs",
      weightNote: "baseline",
    },
    {
      id: "2026-01-05",
      userId: "u1",
      date: "2026-01-05",
      symptoms: [],
      doses: {},
      sideEffects: {},
      weight: 153.0,
      weightUnit: "lbs",
    },
    {
      id: "2026-01-10",
      userId: "u1",
      date: "2026-01-10",
      symptoms: [],
      doses: {},
      sideEffects: {},
      weight: 150.0,
      weightUnit: "lbs",
      weightNote: "feeling lighter",
    },
  ];

  const stats = weightStats(logs, "lbs");
  assert.equal(stats.count, 3);
  assert.equal(stats.earliest?.value, 155.0);
  assert.equal(stats.latest?.value, 150.0);
  assert.equal(stats.min, 150.0);
  assert.equal(stats.max, 155.0);
  assert.equal(stats.range, 5.0);
  assert.equal(stats.average, 152.7);
  assert.equal(stats.netChange, -5.0);

  // Target unit kg
  const statsKg = weightStats(logs, "kg");
  assert.equal(statsKg.count, 3);
  assert.equal(statsKg.latest?.unit, "kg");
  assert.equal(statsKg.latest?.value, convertWeight(150.0, "lbs", "kg"));
});

test("weightStats: handles single entry and ignores logs without weight", () => {
  const logs = [
    {
      id: "2026-01-01",
      userId: "u1",
      date: "2026-01-01",
      symptoms: ["Fatigue"],
      doses: {},
      sideEffects: {},
    },
    {
      id: "2026-01-02",
      userId: "u1",
      date: "2026-01-02",
      symptoms: [],
      doses: {},
      sideEffects: {},
      weight: 148.0,
      weightUnit: "lbs",
      weightNote: "morning",
    },
    {
      id: "2026-01-03",
      userId: "u1",
      date: "2026-01-03",
      symptoms: ["Acne"],
      doses: {},
      sideEffects: {},
    },
  ];

  const stats = weightStats(logs, "lbs");
  assert.equal(stats.count, 1);
  assert.equal(stats.earliest?.value, 148.0);
  assert.equal(stats.latest?.value, 148.0);
  assert.equal(stats.min, 148.0);
  assert.equal(stats.max, 148.0);
  assert.equal(stats.range, 0);
  assert.equal(stats.average, 148.0);
  assert.equal(stats.netChange, 0);
});

test("weightStats: seamlessly handles mixed units in log history", () => {
  const logs = [
    {
      id: "2026-01-01",
      userId: "u1",
      date: "2026-01-01",
      symptoms: [],
      doses: {},
      sideEffects: {},
      weight: 154.3, // ~70 kg
      weightUnit: "lbs",
    },
    {
      id: "2026-01-10",
      userId: "u1",
      date: "2026-01-10",
      symptoms: [],
      doses: {},
      sideEffects: {},
      weight: 70.0, // in kg
      weightUnit: "kg",
    },
  ];

  const statsLbs = weightStats(logs, "lbs");
  assert.equal(statsLbs.count, 2);
  assert.equal(statsLbs.earliest?.value, 154.3);
  assert.equal(statsLbs.latest?.value, 154.3);
  assert.equal(statsLbs.netChange, 0);

  const statsKg = weightStats(logs, "kg");
  assert.equal(statsKg.count, 2);
  assert.equal(statsKg.earliest?.value, 70.0);
  assert.equal(statsKg.latest?.value, 70.0);
  assert.equal(statsKg.netChange, 0);
});
