import test from "node:test";
import assert from "node:assert/strict";

import {
  convertWeight,
  formatWeight,
  weightStats,
  dateKey,
  addDays,
} from "../lib/health.ts";
import { validateDaily } from "../lib/tracking-validation.ts";

import { summarize } from "../lib/insights.ts";
import { assembleHealthContext } from "../lib/health-context.ts";
import { describeContext, extractContextTags } from "../lib/ai.ts";

test("validateLog: accepts valid weight entries in lbs and kg", () => {
  const today = dateKey();

  const validLbsLog = {
    id: today,
    userId: "test-user",
    date: today,
    symptoms: [],
    doses: {},
    sideEffects: {},
    weight: 148.5,
    weightUnit: "lbs",
    weightNote: "Morning weigh-in",
  };
  assert.equal(validateDaily(validLbsLog), "");

  const validKgLog = {
    id: today,
    userId: "test-user",
    date: today,
    symptoms: [],
    doses: {},
    sideEffects: {},
    weight: 67.2,
    weightUnit: "kg",
  };
  assert.equal(validateDaily(validKgLog), "");
});

test("validateLog: rejects invalid weight values and units", () => {
  const today = dateKey();
  const baseLog = {
    id: today,
    userId: "test-user",
    date: today,
    symptoms: [],
    doses: {},
    sideEffects: {},
  };

  // Negative weight
  assert.match(
    validateDaily({ ...baseLog, weight: -5, weightUnit: "lbs" }),
    /Enter a valid weight between 1 and 1000/
  );

  // Zero weight
  assert.match(
    validateDaily({ ...baseLog, weight: 0, weightUnit: "lbs" }),
    /Enter a valid weight between 1 and 1000/
  );

  // Excessive weight
  assert.match(
    validateDaily({ ...baseLog, weight: 1500, weightUnit: "lbs" }),
    /Enter a valid weight between 1 and 1000/
  );

  // NaN weight
  assert.match(
    validateDaily({ ...baseLog, weight: Number.NaN, weightUnit: "lbs" }),
    /Enter a valid weight between 1 and 1000/
  );

  // Invalid unit
  assert.match(
    validateDaily({ ...baseLog, weight: 150, weightUnit: "stone" }),
    /Choose either lbs or kg for weight unit/
  );

  // Overly long note
  assert.match(
    validateDaily({ ...baseLog, weight: 150, weightUnit: "lbs", weightNote: "a".repeat(2005) }),
    /Keep each note to 2,000 characters or fewer/
  );
});

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

test("summarize: produces weight summary and descriptive insights", () => {
  const start = "2026-01-01";
  const end = "2026-01-30";
  const data = {
    version: 1,
    user: { id: "u1", name: "Test" },
    logs: [
      {
        id: "2026-01-02",
        userId: "u1",
        date: "2026-01-02",
        symptoms: ["Bloating"],
        doses: {},
        sideEffects: {},
        weight: 154.0,
        weightUnit: "lbs",
      },
      {
        id: "2026-01-15",
        userId: "u1",
        date: "2026-01-15",
        symptoms: ["Fatigue"],
        doses: {},
        sideEffects: {},
        weight: 152.0,
        weightUnit: "lbs",
      },
    ],
    medications: [],
    labs: [],
    questions: [],
    appointments: [],
    personalize: true,
  };

  const report = summarize(data, start, end);
  assert.equal(report.weight.count, 2);
  assert.equal(report.weight.min, 152.0);
  assert.equal(report.weight.max, 154.0);
  assert.equal(report.weight.average, 153.0);
  assert.equal(report.weight.netChange, -2.0);

  // Observation includes weight
  const hasWeightInsight = report.insights.some((text) =>
    text.includes("Weight was logged across 2 entries in this range")
  );
  assert.equal(hasWeightInsight, true);
});

test("assembleHealthContext and AI helpers: surface weight context and tags", () => {
  const today = dateKey();
  const data = {
    version: 1,
    user: { id: "u1", name: "Maya" },
    logs: [
      {
        id: today,
        userId: "u1",
        date: today,
        symptoms: ["Fatigue"],
        doses: {},
        sideEffects: {},
        weight: 148.5,
        weightUnit: "lbs",
        weightNote: "Fasting",
      },
    ],
    medications: [],
    labs: [],
    questions: [],
    appointments: [],
    personalize: true,
  };

  const context = assembleHealthContext(data, today);
  assert.ok(context);
  assert.equal(context.weightSummary?.count, 1);
  assert.equal(context.weightSummary?.latest?.value, 148.5);

  const recent = context.recentLogs?.[0];
  assert.equal(recent?.weight, 148.5);
  assert.equal(recent?.weightUnit, "lbs");
  assert.equal(recent?.weightNote, "Fasting");

  // Context description
  const description = describeContext(context);
  assert.match(description, /Weight: 1 entry \(latest 148.5 lbs/);
  assert.match(description, /Weight: 148.5 lbs \(Fasting\)/);

  // Context tags
  const tags = extractContextTags(context, "How does my weight look?");
  assert.ok(tags.some((t) => t.includes("Weight: 148.5 lbs")));
});
