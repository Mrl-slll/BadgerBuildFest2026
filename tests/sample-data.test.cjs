/* eslint-disable @typescript-eslint/no-require-imports -- Node test runner loads CommonJS test. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

test('Sample health data is valid and covers 2 years of clinical records', () => {
  const raw = readFileSync(join(__dirname, '../public/sample-health-data.json'), 'utf8');
  const data = JSON.parse(raw);

  assert.equal(data.version, 1);
  assert.equal(data.user.id, 'local-user');
  assert.equal(data.personalize, true);

  // Check 2 years of daily logs (731 days)
  assert.ok(data.logs.length >= 730, `Should have at least 730 daily logs, got ${data.logs.length}`);
  const firstDate = data.logs[0].date;
  const lastDate = data.logs[data.logs.length - 1].date;
  assert.equal(firstDate, '2024-09-27', 'Logs start two years ago');
  assert.equal(lastDate, '2026-09-26', 'Logs end on current date');

  // Check cycles
  const periodStarts = data.logs.filter((l) => l.periodStart);
  assert.ok(periodStarts.length >= 18, `Should have at least 18 cycle starts across 2 years, got ${periodStarts.length}`);

  // Check medications
  assert.ok(data.medications.length >= 4, `Should have at least 4 medications, got ${data.medications.length}`);
  const medNames = data.medications.map((m) => m.name.toLowerCase());
  assert.ok(medNames.some((n) => n.includes('metformin')), 'Should include Metformin');
  assert.ok(medNames.some((n) => n.includes('inositol')), 'Should include Inositol');
  assert.ok(medNames.some((n) => n.includes('spironolactone')), 'Should include Spironolactone');
  assert.ok(medNames.some((n) => n.includes('vitamin d')), 'Should include Vitamin D');

  // Check labs
  assert.ok(data.labs.length >= 20, `Should have comprehensive lab panels, got ${data.labs.length}`);
  const labNames = data.labs.map((l) => l.name.toLowerCase());
  assert.ok(labNames.some((n) => n.includes('testosterone')), 'Should include Testosterone');
  assert.ok(labNames.some((n) => n.includes('insulin')), 'Should include Fasting Insulin');
  assert.ok(labNames.some((n) => n.includes('hemoglobin a1c')), 'Should include HbA1c');
});
