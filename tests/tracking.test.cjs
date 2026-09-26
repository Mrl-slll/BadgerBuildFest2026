/* CommonJS matches the isolated TypeScript test compilation below. */
/* eslint-disable @typescript-eslint/no-require-imports */
const { test, after } = require("node:test");
const assert = require("node:assert/strict");
const { mkdtempSync, rmSync } = require("node:fs");
const { tmpdir } = require("node:os");
const { join } = require("node:path");
const { execFileSync } = require("node:child_process");
const output = mkdtempSync(join(tmpdir(), "pcos-tracking-test-"));
execFileSync(process.execPath, [
  "node_modules/typescript/bin/tsc",
  "lib/health.ts",
  "lib/tracking-validation.ts",
  "lib/health-storage.ts",
  "--module",
  "commonjs",
  "--target",
  "es2020",
  "--skipLibCheck",
  "--outDir",
  output,
]);
const { validateDaily, validateMedication, validateLab, validDate } = require(
  join(output, "tracking-validation.js"),
);
const { cycleHistory, dateKey, addDays } = require(join(output, "health.js"));
const { parseStoredHealthData } = require(join(output, "health-storage.js"));
after(() => rmSync(output, { recursive: true, force: true }));
const log = {
  id: "entry",
  userId: "local-user",
  date: "2024-02-29",
  symptoms: [],
  doses: {},
  sideEffects: {},
};
const med = {
  id: "med",
  userId: "local-user",
  name: "Example medication",
  dosage: "500",
  unit: "mg",
  frequency: "Once daily",
  startedAt: "2024-01-01",
  active: true,
  notes: "",
};
const lab = {
  id: "lab",
  userId: "local-user",
  name: "Example test",
  value: "0",
  unit: "mg/dL",
  date: "2024-01-01",
  low: "0",
  high: "10",
  source: "",
  notes: "",
};
test("rejects impossible and future dates; accepts leap day", () => {
  assert.equal(validDate("2024-02-29"), true);
  for (const date of [
    "2023-02-29",
    "2024-02-30",
    "2024-13-01",
    "garbage",
    addDays(dateKey(), 1),
  ])
    assert.ok(validateDaily({ ...log, date }));
});
test("optional fields are not treated as zero; same-day period start/end is supported", () => {
  assert.equal(validateDaily(log), "");
  assert.equal(
    validateDaily({
      ...log,
      pain: 0,
      sleepMinutes: 0,
      periodStart: true,
      periodEnd: true,
    }),
    "",
  );
});
test("rejects nonfinite, fractional and out-of-range measurements", () => {
  for (const fields of [
    { pain: NaN },
    { pain: Infinity },
    { pain: 11 },
    { pain: 0.5 },
    { energy: 0 },
    { mood: 6 },
    { sleepMinutes: 1441 },
    { sleepMinutes: -1 },
  ])
    assert.ok(validateDaily({ ...log, ...fields }));
  assert.equal(
    validateDaily({ ...log, sleepMinutes: 1440, energy: 5, mood: 1, pain: 10 }),
    "",
  );
});
test("validates symptoms, doses and side-effect length", () => {
  assert.ok(validateDaily({ ...log, symptoms: ["invalid"] }));
  assert.ok(
    validateDaily({
      ...log,
      medicationSymptoms: { med: ["invalid"] },
    }),
  );
  assert.ok(validateDaily({ ...log, doses: { med: "Maybe" } }));
  assert.ok(validateDaily({ ...log, sideEffects: { med: "x".repeat(2001) } }));
  assert.equal(
    validateDaily({
      ...log,
      symptoms: ["Nausea"],
      doses: { med: "Missed" },
      sideEffects: { med: "Nausea" },
      medicationSymptoms: { med: ["Nausea"] },
    }),
    "",
  );
});
test("medication validation rejects blank, invalid dosage and conflicting treatment dates", () => {
  assert.equal(validateMedication(med), "");
  for (const fields of [
    { name: "  " },
    { dosage: "NaN" },
    { dosage: "0" },
    { endedAt: "2023-12-31" },
    { active: false },
    { endedAt: "2024-01-02" },
  ])
    assert.ok(validateMedication({ ...med, ...fields }));
  assert.equal(
    validateMedication({ ...med, active: false, endedAt: "2024-01-02" }),
    "",
  );
});
test("labs support zero and partial ranges while rejecting inverted and nonnumeric ranges", () => {
  assert.equal(validateLab(lab), "");
  assert.equal(validateLab({ ...lab, high: "" }), "");
  for (const fields of [
    { value: "" },
    { value: "Infinity" },
    { unit: " " },
    { low: "x" },
    { low: "11" },
  ])
    assert.ok(validateLab({ ...lab, ...fields }));
});
test("cycle lengths use calendar days and ends stay within their cycle", () => {
  const rows = [
    { ...log, date: "2024-03-10", periodEnd: true },
    { ...log, date: "2024-03-01", periodStart: true },
    { ...log, date: "2024-04-01", periodStart: true },
  ];
  assert.deepEqual(cycleHistory(rows), [
    { start: "2024-03-01", end: "2024-03-10", length: 31 },
    { start: "2024-04-01", end: undefined, length: null },
  ]);
});
test("stored journal data is validated and scoped before Home uses it", () => {
  const stored = {
    version: 1,
    user: { id: "local-user", name: "" },
    logs: [
      { ...log, date: "2024-03-01", periodStart: true },
      { ...log, id: "foreign", userId: "another-user" },
    ],
    medications: [],
    labs: [],
    questions: [],
    appointments: [],
    personalize: false,
  };
  const result = parseStoredHealthData(JSON.stringify(stored));
  assert.equal(result.invalid, false);
  assert.deepEqual(result.data.logs.map((entry) => entry.date), ["2024-03-01"]);
  assert.equal(parseStoredHealthData("not json").invalid, true);
});
