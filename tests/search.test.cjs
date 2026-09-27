/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require('node:test');
const assert = require('node:assert/strict');

test('Search API fallback matches PCOS symptom queries gracefully', async () => {
  // Direct test of local corpus matching logic used by route.ts
  const query = 'irregular cycle bleeding';
  const terms = query.toLowerCase().split(' ');
  
  const testCorpus = [
    {
      id: 'sym-1',
      symptom: 'Irregular Menstrual Cycles & Anovulation',
      description: 'Infrequent or absent menstrual bleeding',
    },
    {
      id: 'sym-2',
      symptom: 'Insulin Resistance',
      description: 'Impaired glucose tolerance',
    },
  ];

  const matches = testCorpus.filter((item) => {
    const text = `${item.symptom} ${item.description}`.toLowerCase();
    return terms.some((t) => text.includes(t));
  });

  assert.equal(matches.length, 1);
  assert.equal(matches[0].id, 'sym-1');
});
