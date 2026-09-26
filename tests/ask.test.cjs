/* eslint-disable @typescript-eslint/no-require-imports -- Node test runner loads temporary CommonJS compilation. */
const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { execFileSync } = require('node:child_process');

const output = mkdtempSync(join(tmpdir(), 'pcos-ask-'));
execFileSync(join(process.cwd(), 'node_modules/.bin/tsc'), ['lib/ai.ts', '--outDir', output, '--module', 'commonjs', '--target', 'es2020', '--skipLibCheck']);
const { assembleHealthContext } = require(join(output, 'health-context.js'));
const { seedData } = require(join(output, 'health.js'));
const { DevelopmentAIService } = require(join(output, 'ai.js'));
after(() => rmSync(output, { recursive: true, force: true }));

test('consent is required even when records are supplied', async () => {
  assert.equal(assembleHealthContext({ personalize: false, logs: 'malformed' }), undefined);
  const data = seedData(); data.personalize = false;
  assert.match((await new DevelopmentAIService().answerHealthQuestion('Symptoms?', data))[0].text, /Personalization is off/);
});
test('context scopes ownership, bounds dates, deduplicates days and strips private notes', () => {
  const data = seedData('2026-09-26');
  const first = data.logs.find(log => log.date === '2026-09-25');
  data.logs.push({ ...first, id: 'duplicate' });
  data.logs.push({ ...first, id: 'foreign', userId: 'someone-else', symptoms: ['FOREIGN'] });
  data.logs.push({ ...first, id: 'future', date: '2026-09-27', symptoms: ['FUTURE'] });
  data.logs.push({ ...first, id: 'old', date: '2026-01-01', symptoms: ['OLD'] });
  const context = assembleHealthContext(data, '2026-09-26');
  assert.equal(context.start, '2026-06-29');
  assert.equal(context.loggedDays, new Set(data.logs.filter(log => log.userId === data.user.id && log.date >= context.start && log.date <= context.end).map(log => log.date)).size);
  assert.ok(context.symptoms.every(symptom => symptom.days <= context.loggedDays));
  assert.doesNotMatch(JSON.stringify(context), /FOREIGN|FUTURE|OLD|demo-user|Felt tired|Alex/);
});
test('malformed consented records and impossible dates fail validation', () => {
  const data = seedData('2026-09-26');
  data.logs[0].date = '2026-02-30';
  assert.throws(() => assembleHealthContext(data, '2026-09-26'));
  data.logs[0].date = '2026-09-25'; data.logs[0].symptoms = [null];
  assert.throws(() => assembleHealthContext(data, '2026-09-26'));
});
test('mock separates provenance and never invents research', async () => {
  const service = new DevelopmentAIService();
  const answer = await service.answerHealthQuestion('What about my lab result?');
  assert.equal(answer.length, 5);
  assert.deepEqual(await service.retrieveRelevantResearch('PCOS'), []);
  assert.match(answer.find(s => s.source === 'Research').text, /not connected/);
  assert.match(answer.find(s => s.source === 'AI interpretation').text, /does not interpret/);
});
test('research can be injected and retains citation provenance', async () => {
  const source = { id: 'fixture', title: 'Test source', url: 'https://example.com', publisher: 'Test publisher', excerpt: 'Fixture only.' };
  const service = new DevelopmentAIService({ retrieve: async () => ({ status: 'available', sources: [source] }) });
  const answer = await service.answerHealthQuestion('Question');
  assert.deepEqual(answer.find(s => s.source === 'Research').citations, [source]);
});
