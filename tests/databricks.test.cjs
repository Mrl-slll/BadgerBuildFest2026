/* eslint-disable @typescript-eslint/no-require-imports -- Node test runner loads temporary CommonJS compilation. */
const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const { mkdirSync, rmSync } = require('node:fs');
const { join } = require('node:path');
const { execFileSync } = require('node:child_process');

const output = join(__dirname, '../.test-cache-databricks');
mkdirSync(output, { recursive: true });
const tscBin = process.platform === 'win32'
  ? join(process.cwd(), 'node_modules/.bin/tsc.cmd')
  : join(process.cwd(), 'node_modules/.bin/tsc');
execFileSync(tscBin, [
  'lib/server/databricks-research.ts',
  'lib/server/databricks-lakehouse.ts',
  'lib/server/databricks-ai.ts',
  '--outDir', output,
  '--module', 'commonjs',
  '--target', 'es2020',
  '--skipLibCheck'
], { shell: process.platform === 'win32' });

// Mock server-only in Node test environment (Next.js bundler maps it to empty in react-server)
try {
  const serverOnlyPath = require.resolve('server-only');
  require.cache[serverOnlyPath] = {
    id: serverOnlyPath,
    filename: serverOnlyPath,
    loaded: true,
    exports: {},
  };
} catch {
  const Module = require('node:module');
  const originalLoad = Module._load;
  Module._load = function (request) {
    if (request === 'server-only') return {};
    return originalLoad.apply(this, arguments);
  };
}

const { DatabricksVectorSearchRetriever } = require(join(output, 'server/databricks-research.js'));
const { DatabricksLakehouseAnalytics } = require(join(output, 'server/databricks-lakehouse.js'));
const { DatabricksAIService } = require(join(output, 'server/databricks-ai.js'));

after(() => rmSync(output, { recursive: true, force: true }));

test('Databricks Vector Search Retriever returns clinical sources in mock mode', async () => {
  const retriever = new DatabricksVectorSearchRetriever({ mockMode: true });

  const result = await retriever.retrieve('What does research say about metformin and inositol for PCOS?');
  assert.equal(result.status, 'available');
  assert.ok(result.sources.length > 0, 'Should return at least one source');

  const metforminStudy = result.sources.find((s) => s.title.toLowerCase().includes('metformin'));
  assert.ok(metforminStudy, 'Should retrieve study referencing metformin');
  assert.ok(metforminStudy.url.startsWith('https://doi.org/'), 'Should have valid DOI URL');
  assert.ok(metforminStudy.excerpt.length > 20, 'Should have rich clinical excerpt');
});

test('Databricks Lakehouse Analytics produces cohort statistics from simulated Delta Lake', async () => {
  const lakehouse = new DatabricksLakehouseAnalytics({ mockMode: true });

  const fatigueInsight = await lakehouse.getCohortSummary('Why do I feel so fatigued after meals?');
  assert.ok(fatigueInsight.includes('Databricks Lakehouse Cohort Analysis'));
  assert.ok(fatigueInsight.includes('Delta table'));
  assert.ok(fatigueInsight.includes('de-identified'));

  const medicationInsight = await lakehouse.getCohortSummary('How long do metformin side effects last?');
  assert.ok(medicationInsight.includes('Delta table `pcos_cohorts.treatment_adherence`'));
});

test('Databricks AI Service synthesizes grounded answers with all 5 clinical sections', async () => {
  const service = new DatabricksAIService({ mockMode: true });

  const question = 'What questions should I ask my doctor about my irregular cycles and fatigue?';
  const mockHealthData = {
    userId: 'user-pcos-123',
    version: 1,
    logs: [
      {
        date: '2026-09-15',
        symptoms: ['Fatigue', 'Acne'],
        periodStart: true,
        energyLevel: 3,
        sleepHours: 6.5,
      },
      {
        date: '2026-09-16',
        symptoms: ['Fatigue', 'Bloating'],
        energyLevel: 4,
        sleepHours: 7,
      },
    ],
    medications: [
      {
        id: 'med-1',
        name: 'Metformin',
        dosage: '500mg',
        frequency: 'once daily',
        startedAt: '2026-09-01',
      },
    ],
    labs: [],
  };

  const answer = await service.answerHealthQuestion(question, mockHealthData);
  assert.ok(Array.isArray(answer), 'Answer must be an array of sections');

  const sources = answer.map((a) => a.source);
  assert.ok(sources.includes('AI interpretation'), 'Must contain AI interpretation');
  assert.ok(sources.includes('Your data'), 'Must contain Your data');
  assert.ok(sources.includes('Questions for your clinician'), 'Must contain clinician questions');
  assert.ok(sources.includes('Research'), 'Must contain Research citations');
  assert.ok(sources.includes('Community experiences'), 'Must contain Community experiences');

  const researchSection = answer.find((a) => a.source === 'Research');
  assert.ok(researchSection?.citations && researchSection.citations.length > 0, 'Research must include Vector Search citations');

  const communitySection = answer.find((a) => a.source === 'Community experiences');
  assert.ok(communitySection?.text.includes('Databricks Lakehouse'), 'Community section must contain Databricks Lakehouse insights');
});
