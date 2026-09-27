import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateQuizResult } from '../lib/quiz-algorithm.ts';
import {
  QUIZ_SECTIONS,
  CYCLE_PATTERN_OPTIONS,
  BIRTH_CONTROL_TIMELINE_OPTIONS,
  FERTILE_MUCUS_OPTIONS,
  CARB_REACTION_OPTIONS,
  FAT_STORAGE_OPTIONS,
  SKIN_MARKER_OPTIONS,
  ANDROGEN_ONSET_OPTIONS,
  HIRSUTISM_SITE_OPTIONS,
  ACNE_PATTERN_OPTIONS,
  EXERCISE_REACTION_OPTIONS,
  NERVOUS_SLEEP_OPTIONS,
  INFLAMMATORY_SYMPTOM_OPTIONS,
  RELATED_CONDITION_OPTIONS,
} from '../components/quiz/quiz-data.ts';

test('Verify Quiz Configuration matches prompt specification exactly', () => {
  assert.equal(QUIZ_SECTIONS.length, 6);
  assert.equal(CYCLE_PATTERN_OPTIONS.length, 5);
  assert.equal(BIRTH_CONTROL_TIMELINE_OPTIONS.length, 5);
  assert.equal(FERTILE_MUCUS_OPTIONS.length, 4);
  assert.equal(CARB_REACTION_OPTIONS.length, 4);
  assert.equal(FAT_STORAGE_OPTIONS.length, 3);
  assert.equal(SKIN_MARKER_OPTIONS.length, 3);
  assert.equal(ANDROGEN_ONSET_OPTIONS.length, 5);
  assert.equal(HIRSUTISM_SITE_OPTIONS.length, 4);
  assert.equal(ACNE_PATTERN_OPTIONS.length, 5);
  assert.equal(EXERCISE_REACTION_OPTIONS.length, 3);
  assert.equal(NERVOUS_SLEEP_OPTIONS.length, 4);
  assert.equal(INFLAMMATORY_SYMPTOM_OPTIONS.length, 5);
  assert.equal(RELATED_CONDITION_OPTIONS.length, 4);
});

test('Full flow calculation generates non-scary whyThisMatters explanation and pillars', () => {
  const result = calculateQuizResult({
    cyclePattern: 'highly_irregular_46_90',
    birthControlTimeline: '6_to_12_months',
    fertileMucus: 'occasionally_patches',
    carbReaction: 'severe_crash',
    cravingsIntensity: 4,
    fatStorage: 'midsection',
    skinMarkers: ['darkened_patches'],
    androgenOnset: 'early_puberty',
    hirsutismSites: ['chin_jawline_lip'],
    acnePatterns: ['cystic_jawline'],
    exerciseReaction: 'exhausted_24h',
    nervousSleepPatterns: ['wired_but_tired', 'caffeine_sensitivity'],
    stressLevel: 3,
    inflammatorySymptoms: ['severe_bloating_post_meal'],
    relatedConditions: ['ibs_sibo'],
    frustratingSymptom: 'Heavy brain fog after meals and irregular 60-day cycles',
    pastSupplements: 'Tried berberine which helped cravings',
  });

  assert.ok(result.phenotype.startsWith('Phenotype'));
  assert.ok(result.primaryPillar.length > 0);
  assert.ok(result.secondaryPillar.length > 0);
  assert.ok(result.whyThisMatters.length > 30);
  assert.ok(result.recommendations.length > 0);
  assert.ok(result.questionsForClinician.length > 0);
  assert.equal(result.answers.frustratingSymptom, 'Heavy brain fog after meals and irregular 60-day cycles');
});
