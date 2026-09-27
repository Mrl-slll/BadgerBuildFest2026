import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateQuizResult } from '../lib/quiz-algorithm.ts';

test('Phenotype A calculation: Classic Hyperandrogenic with Anovulation and Metabolic markers', () => {
  const result = calculateQuizResult({
    cyclePattern: 'highly_irregular_46_90',
    birthControlTimeline: 'more_than_12_months_or_never',
    fertileMucus: 'almost_never',
    carbReaction: 'shaky_hypoglycemia',
    cravingsIntensity: 5,
    fatStorage: 'midsection',
    skinMarkers: ['darkened_patches', 'skin_tags'],
    androgenOnset: 'early_puberty',
    hirsutismSites: ['chin_jawline_lip', 'abdomen_thighs'],
    acnePatterns: ['cystic_jawline'],
    exerciseReaction: 'energized_recovers',
    nervousSleepPatterns: [],
    stressLevel: 2,
    inflammatorySymptoms: [],
    relatedConditions: [],
    frustratingSymptom: 'Irregular cycles and stubborn weight around belly',
  });

  assert.equal(result.phenotype, 'Phenotype A');
  assert.equal(result.primaryPillar, 'True Anovulation Pattern');
  assert.ok(result.scores.metabolic >= 60);
  assert.ok(result.scores.androgenic >= 50);
  assert.ok(result.scores.ovulatoryDisruption >= 40);
  assert.ok(result.whyThisMatters.toLowerCase().includes('phenotype'));
  assert.ok(result.whyThisMatters.toLowerCase().includes('pillar'));
});

test('Phenotype B calculation: Hyperandrogenic Anovulatory without metabolic markers (Lean/Non-Metabolic)', () => {
  const result = calculateQuizResult({
    cyclePattern: 'highly_irregular_46_90',
    birthControlTimeline: 'more_than_12_months_or_never',
    fertileMucus: 'almost_never',
    carbReaction: 'energized',
    cravingsIntensity: 0,
    fatStorage: 'evenly',
    skinMarkers: ['neither'],
    androgenOnset: 'early_puberty',
    hirsutismSites: ['chin_jawline_lip', 'chest_back'],
    acnePatterns: ['cystic_jawline'],
    exerciseReaction: 'energized_recovers',
    nervousSleepPatterns: [],
    stressLevel: 1,
    inflammatorySymptoms: [],
    relatedConditions: [],
  });

  assert.equal(result.phenotype, 'Phenotype B');
  assert.equal(result.primaryPillar, 'True Anovulation Pattern');
  assert.ok(result.scores.metabolic < 40);
  assert.ok(result.scores.androgenic >= 50);
});

test('Phenotype C calculation: Ovulatory with Androgenic sensitivity', () => {
  const result = calculateQuizResult({
    cyclePattern: 'predictable_21_35',
    birthControlTimeline: 'more_than_12_months_or_never',
    fertileMucus: 'regularly_monthly',
    carbReaction: 'energized',
    cravingsIntensity: 2,
    fatStorage: 'hips_thighs',
    skinMarkers: ['neither'],
    androgenOnset: 'late_teens',
    hirsutismSites: ['chin_jawline_lip'],
    acnePatterns: ['cystic_jawline', 'pre_bleed_flare'],
    exerciseReaction: 'energized_recovers',
    nervousSleepPatterns: [],
    stressLevel: 2,
    inflammatorySymptoms: [],
    relatedConditions: [],
  });

  assert.equal(result.phenotype, 'Phenotype C');
  assert.equal(result.primaryPillar, 'Preserved / Subtle Ovulatory Pattern');
  assert.ok(result.scores.androgenic >= 35);
  assert.ok(result.scores.ovulatoryDisruption < 40);
});

test('Phenotype D calculation: Normoandrogenic / Metabolic with cycle delay', () => {
  const result = calculateQuizResult({
    cyclePattern: 'highly_irregular_46_90',
    birthControlTimeline: 'more_than_12_months_or_never',
    fertileMucus: 'almost_never',
    carbReaction: 'severe_crash',
    cravingsIntensity: 4,
    fatStorage: 'midsection',
    skinMarkers: ['darkened_patches'],
    androgenOnset: 'no_symptoms',
    hirsutismSites: ['none_vellus'],
    acnePatterns: ['rarely_never'],
    exerciseReaction: 'energized_recovers',
    nervousSleepPatterns: [],
    stressLevel: 2,
    inflammatorySymptoms: ['severe_bloating_post_meal'],
    relatedConditions: ['ibs_sibo'],
  });

  assert.equal(result.phenotype, 'Phenotype D');
  assert.equal(result.primaryPillar, 'True Anovulation Pattern');
  assert.ok(result.scores.androgenic < 35);
  assert.ok(result.scores.metabolic >= 40);
});

test('Post-Pill Synthetic Hormone Transition detection', () => {
  const result = calculateQuizResult({
    cyclePattern: 'highly_irregular_46_90',
    birthControlTimeline: 'less_than_3_months',
    fertileMucus: 'almost_never',
    androgenOnset: 'post_birth_control',
    carbReaction: 'energized',
    cravingsIntensity: 1,
    fatStorage: 'evenly',
    skinMarkers: ['neither'],
    hirsutismSites: ['chin_jawline_lip'],
    acnePatterns: ['cystic_jawline'],
    exerciseReaction: 'energized_recovers',
    nervousSleepPatterns: [],
    stressLevel: 1,
    inflammatorySymptoms: [],
    relatedConditions: [],
  });

  assert.equal(result.primaryPillar, 'Post-Pill Synthetic Hormone Transition');
});

test('Hypothalamic Amenorrhea detection', () => {
  const result = calculateQuizResult({
    cyclePattern: 'absent_6_plus_months',
    birthControlTimeline: 'more_than_12_months_or_never',
    fertileMucus: 'almost_never',
    carbReaction: 'energized',
    cravingsIntensity: 0,
    fatStorage: 'evenly',
    skinMarkers: ['neither'],
    androgenOnset: 'no_symptoms',
    hirsutismSites: ['none_vellus'],
    acnePatterns: ['rarely_never'],
    exerciseReaction: 'exhausted_24h',
    nervousSleepPatterns: ['wired_but_tired', 'wake_2am_4am'],
    stressLevel: 5,
    inflammatorySymptoms: [],
    relatedConditions: [],
  });

  assert.equal(result.primaryPillar, 'Hypothalamic Amenorrhea Pattern');
});
