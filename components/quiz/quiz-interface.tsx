'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { QuizAnswers, QuizResult } from '../../lib/quiz-types';
import { calculateQuizResult } from '../../lib/quiz-algorithm';
import { saveQuizResultLocally, syncQuizResultToCloud } from '../../lib/quiz-storage';
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
} from './quiz-data';
import { QuizResultsView } from './quiz-results-view';
import styles from './quiz.module.css';

interface QuizInterfaceProps {
  userId?: string | null;
  initialResult?: QuizResult | null;
  onFinish?: () => void;
  isModal?: boolean;
}

export function QuizInterface({
  userId,
  initialResult = null,
  onFinish,
  isModal = false,
}: QuizInterfaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [result, setResult] = useState<QuizResult | null>(initialResult);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form State - start completely blank with no pre-selections
  const [answers, setAnswers] = useState<QuizAnswers>({});

  const section = QUIZ_SECTIONS[currentStep - 1];
  const progressPercent = Math.round((currentStep / QUIZ_SECTIONS.length) * 100);

  // Scroll to top of both window and any modal/parent container whenever section changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      let parent = containerRef.current.parentElement;
      while (parent) {
        if (parent.scrollTop > 0) {
          parent.scrollTo({ top: 0, behavior: 'smooth' });
        }
        parent = parent.parentElement;
      }
    }
  }, [currentStep]);

  // Handle single choice updates
  const handleSingleSelect = <K extends keyof QuizAnswers>(key: K, value: QuizAnswers[K]) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  // Handle multi-choice toggles with mutually exclusive options (like 'neither' or 'none')
  const handleMultiToggle = <T extends string>(
    key: 'skinMarkers' | 'hirsutismSites' | 'acnePatterns' | 'nervousSleepPatterns' | 'inflammatorySymptoms' | 'relatedConditions',
    value: T,
    exclusiveOption?: T
  ) => {
    setAnswers((prev) => {
      const currentList = (prev[key] as T[]) || [];
      if (exclusiveOption && value === exclusiveOption) {
        return { ...prev, [key]: [exclusiveOption] };
      }

      let updated: T[];
      if (currentList.includes(value)) {
        updated = currentList.filter((item) => item !== value);
      } else {
        const withoutExclusive = exclusiveOption ? currentList.filter((item) => item !== exclusiveOption) : currentList;
        updated = [...withoutExclusive, value];
      }

      return { ...prev, [key]: updated };
    });
  };

  // Step validation
  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1:
        return Boolean(answers.cyclePattern && answers.birthControlTimeline && answers.fertileMucus);
      case 2:
        return Boolean(
          answers.carbReaction &&
          answers.cravingsIntensity !== undefined &&
          answers.fatStorage &&
          (answers.skinMarkers?.length ?? 0) > 0
        );
      case 3:
        return Boolean(answers.androgenOnset && (answers.hirsutismSites?.length ?? 0) > 0 && (answers.acnePatterns?.length ?? 0) > 0);
      case 4:
        return Boolean(answers.exerciseReaction && answers.stressLevel !== undefined);
      case 5:
        return Boolean((answers.inflammatorySymptoms?.length ?? 0) > 0);
      case 6:
        return Boolean(answers.frustratingSymptom && answers.frustratingSymptom.trim().length > 3);
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (currentStep < QUIZ_SECTIONS.length) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const finalResult = calculateQuizResult(answers);
      setResult(finalResult);
      saveQuizResultLocally(finalResult, userId);

      if (userId && userId !== 'local-user') {
        await syncQuizResultToCloud(finalResult, userId);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetake = () => {
    setResult(null);
    setAnswers({});
    setCurrentStep(1);
  };

  // If results already available, display results view
  if (result) {
    return (
      <QuizResultsView
        result={result}
        onRetake={handleRetake}
        onFinish={onFinish}
        isModal={isModal}
      />
    );
  }

  return (
    <div ref={containerRef} className={isModal ? styles.modalWrapper : styles.container}>
      {/* Progress Header */}
      <div className={styles.progressHeader}>
        <div className={styles.progressMeta}>
          <span className={styles.progressStepBadge}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            Step {currentStep} of {QUIZ_SECTIONS.length}
          </span>
          <span>{progressPercent}% Complete</span>
        </div>
        <div className={styles.progressBarTrack} role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100}>
          <div className={styles.progressBarFill} style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      {/* Section Title & Clinical Goal */}
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>{section.title}</h2>
        <div className={styles.sectionGoalCard}>
          <span className={styles.sectionGoalIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </span>
          <p>
            <strong className={styles.sectionGoalLabel}>Clinical Goal:</strong>
            {section.goal}
          </p>
        </div>
      </div>

      {/* SECTION 1: Cycle Mechanics & Ovulatory History */}
      {currentStep === 1 && (
        <div>
          {/* Q1 */}
          <div className={styles.questionBlock}>
            <label className={styles.questionLabel} id="q1-label">
              Which pattern best describes your natural menstrual cycles over the past 12 months?
            </label>
            <p className={styles.questionHint}>Select the single option closest to your typical experience.</p>
            <div className={styles.optionsGrid} role="radiogroup" aria-labelledby="q1-label">
              {CYCLE_PATTERN_OPTIONS.map((opt) => {
                const isSelected = answers.cyclePattern === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    className={`${styles.choiceCard} ${isSelected ? styles.choiceCardSelected : ''}`}
                    onClick={() => handleSingleSelect('cyclePattern', opt.value)}
                    role="radio"
                    aria-checked={isSelected}
                  >
                    <span className={`${styles.radioIndicator} ${isSelected ? styles.radioIndicatorChecked : ''}`}>
                      {isSelected && <span className={styles.radioDot} />}
                    </span>
                    <span className={styles.choiceText}>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Q2 */}
          <div className={styles.questionBlock}>
            <label className={styles.questionLabel} htmlFor="birth-control-select">
              If you have recently stopped hormonal birth control (Pill, Patch, IUD, Shot), when was your last dose?
            </label>
            <p className={styles.questionHint}>Choose your timeline from the dropdown.</p>
            <div className={styles.selectWrapper}>
              <select
                id="birth-control-select"
                className={styles.selectInput}
                value={answers.birthControlTimeline || ''}
                onChange={(e) => handleSingleSelect('birthControlTimeline', e.target.value as any)}
              >
                <option value="" disabled>Select your timeline...</option>
                {BIRTH_CONTROL_TIMELINE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <span className={styles.selectChevron}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </span>
            </div>
          </div>

          {/* Q3 */}
          <div className={styles.questionBlock}>
            <label className={styles.questionLabel} id="q3-label">
              How often do you notice fertile cervical mucus (clear, stretchy, egg-white consistency)?
            </label>
            <p className={styles.questionHint}>Fertile cervical fluid reflects high follicular estrogen prior to ovulation.</p>
            <div className={styles.optionsGrid} role="radiogroup" aria-labelledby="q3-label">
              {FERTILE_MUCUS_OPTIONS.map((opt) => {
                const isSelected = answers.fertileMucus === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    className={`${styles.choiceCard} ${isSelected ? styles.choiceCardSelected : ''}`}
                    onClick={() => handleSingleSelect('fertileMucus', opt.value)}
                    role="radio"
                    aria-checked={isSelected}
                  >
                    <span className={`${styles.radioIndicator} ${isSelected ? styles.radioIndicatorChecked : ''}`}>
                      {isSelected && <span className={styles.radioDot} />}
                    </span>
                    <span className={styles.choiceText}>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: Metabolic & Post-Prandial (Glucose) Profiling */}
      {currentStep === 2 && (
        <div>
          {/* Q1 */}
          <div className={styles.questionBlock}>
            <label className={styles.questionLabel} id="q2-1-label">
              How do you typically feel 60 to 120 minutes after eating a meal rich in carbohydrates (e.g., pasta, rice, bread, or sweets)?
            </label>
            <p className={styles.questionHint}>This reveals post-prandial glycemic response and reactive insulin release.</p>
            <div className={styles.optionsGrid} role="radiogroup" aria-labelledby="q2-1-label">
              {CARB_REACTION_OPTIONS.map((opt) => {
                const isSelected = answers.carbReaction === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    className={`${styles.choiceCard} ${isSelected ? styles.choiceCardSelected : ''}`}
                    onClick={() => handleSingleSelect('carbReaction', opt.value)}
                    role="radio"
                    aria-checked={isSelected}
                  >
                    <span className={`${styles.radioIndicator} ${isSelected ? styles.radioIndicatorChecked : ''}`}>
                      {isSelected && <span className={styles.radioDot} />}
                    </span>
                    <span className={styles.choiceText}>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Q2 */}
          <div className={styles.questionBlock}>
            <label className={styles.questionLabel} id="q2-2-label">
              On a scale of 0 to 5, how intense are your late-afternoon (3–5 PM) or late-night (8–10 PM) sugar and carbohydrate cravings?
            </label>
            <p className={styles.questionHint}>0 = No cravings &middot; 5 = Uncontrollable, daily urge</p>
            <div className={styles.scaleContainer} aria-labelledby="q2-2-label">
              <div className={styles.scaleButtonsRow} role="group" aria-label="Cravings scale 0 to 5">
                {[0, 1, 2, 3, 4, 5].map((val) => {
                  const isActive = answers.cravingsIntensity === val;
                  return (
                    <button
                      key={val}
                      type="button"
                      className={`${styles.scaleButton} ${isActive ? styles.scaleButtonActive : ''}`}
                      onClick={() => handleSingleSelect('cravingsIntensity', val)}
                      aria-pressed={isActive}
                    >
                      <span className={styles.scaleButtonValue}>{val}</span>
                      {isActive && <span className={styles.scaleCheckBadge} aria-hidden="true">✓</span>}
                    </button>
                  );
                })}
              </div>
              <div className={styles.scaleLabels}>
                <span>0 = No cravings</span>
                <span>5 = Uncontrollable daily urge</span>
              </div>
            </div>
          </div>

          {/* Q3 */}
          <div className={styles.questionBlock}>
            <label className={styles.questionLabel} id="q2-3-label">
              Where do you notice your body tends to store fat most easily when your weight shifts?
            </label>
            <div className={styles.optionsGrid} role="radiogroup" aria-labelledby="q2-3-label">
              {FAT_STORAGE_OPTIONS.map((opt) => {
                const isSelected = answers.fatStorage === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    className={`${styles.choiceCard} ${isSelected ? styles.choiceCardSelected : ''}`}
                    onClick={() => handleSingleSelect('fatStorage', opt.value)}
                    role="radio"
                    aria-checked={isSelected}
                  >
                    <span className={`${styles.radioIndicator} ${isSelected ? styles.radioIndicatorChecked : ''}`}>
                      {isSelected && <span className={styles.radioDot} />}
                    </span>
                    <span className={styles.choiceText}>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Q4 */}
          <div className={styles.questionBlock}>
            <label className={styles.questionLabel} id="q2-4-label">
              Have you noticed dark, velvety patches of skin (Acanthosis Nigricans) or small skin tags in body creases (neck, underarms, bra line)?
            </label>
            <p className={styles.questionHint}>Multiple choice: select all that apply.</p>
            <div className={styles.optionsGrid} role="group" aria-labelledby="q2-4-label">
              {SKIN_MARKER_OPTIONS.map((opt) => {
                const isChecked = (answers.skinMarkers ?? []).includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    className={`${styles.choiceCard} ${isChecked ? styles.choiceCardSelected : ''}`}
                    onClick={() => handleMultiToggle('skinMarkers', opt.value, 'neither')}
                    role="checkbox"
                    aria-checked={isChecked}
                  >
                    <span className={`${styles.checkIndicator} ${isChecked ? styles.checkIndicatorChecked : ''}`}>
                      {isChecked && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </span>
                    <span className={styles.choiceText}>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: Androgenic Mapping & Tissue Sensitivity */}
      {currentStep === 3 && (
        <div>
          {/* Q1 */}
          <div className={styles.questionBlock}>
            <label className={styles.questionLabel} id="q3-1-label">
              At what age or life event did your facial hair growth, acne, or scalp hair loss first become noticeable?
            </label>
            <div className={styles.optionsGrid} role="radiogroup" aria-labelledby="q3-1-label">
              {ANDROGEN_ONSET_OPTIONS.map((opt) => {
                const isSelected = answers.androgenOnset === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    className={`${styles.choiceCard} ${isSelected ? styles.choiceCardSelected : ''}`}
                    onClick={() => handleSingleSelect('androgenOnset', opt.value)}
                    role="radio"
                    aria-checked={isSelected}
                  >
                    <span className={`${styles.radioIndicator} ${isSelected ? styles.radioIndicatorChecked : ''}`}>
                      {isSelected && <span className={styles.radioDot} />}
                    </span>
                    <span className={styles.choiceText}>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Q2 */}
          <div className={styles.questionBlock}>
            <label className={styles.questionLabel} id="q3-2-label">
              Where do your facial or body hair growth (hirsutism) patterns occur most prominently?
            </label>
            <p className={styles.questionHint}>Multiple choice: select all that apply.</p>
            <div className={styles.optionsGrid} role="group" aria-labelledby="q3-2-label">
              {HIRSUTISM_SITE_OPTIONS.map((opt) => {
                const isChecked = (answers.hirsutismSites ?? []).includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    className={`${styles.choiceCard} ${isChecked ? styles.choiceCardSelected : ''}`}
                    onClick={() => handleMultiToggle('hirsutismSites', opt.value, 'none_vellus')}
                    role="checkbox"
                    aria-checked={isChecked}
                  >
                    <span className={`${styles.checkIndicator} ${isChecked ? styles.checkIndicatorChecked : ''}`}>
                      {isChecked && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </span>
                    <span className={styles.choiceText}>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Q3 */}
          <div className={styles.questionBlock}>
            <label className={styles.questionLabel} id="q3-3-label">
              Where do your hormonal acne breakouts primarily occur, and what type are they?
            </label>
            <p className={styles.questionHint}>Multiple choice: select all that apply.</p>
            <div className={styles.optionsGrid} role="group" aria-labelledby="q3-3-label">
              {ACNE_PATTERN_OPTIONS.map((opt) => {
                const isChecked = (answers.acnePatterns ?? []).includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    className={`${styles.choiceCard} ${isChecked ? styles.choiceCardSelected : ''}`}
                    onClick={() => handleMultiToggle('acnePatterns', opt.value, 'rarely_never')}
                    role="checkbox"
                    aria-checked={isChecked}
                  >
                    <span className={`${styles.checkIndicator} ${isChecked ? styles.checkIndicatorChecked : ''}`}>
                      {isChecked && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </span>
                    <span className={styles.choiceText}>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: Neuro-Adrenal & Autonomic Stress Signaling */}
      {currentStep === 4 && (
        <div>
          {/* Q1 */}
          <div className={styles.questionBlock}>
            <label className={styles.questionLabel} id="q4-1-label">
              How does your body react to high-intensity cardiovascular exercise (e.g., HIIT, intense running, heavy spin classes)?
            </label>
            <div className={styles.optionsGrid} role="radiogroup" aria-labelledby="q4-1-label">
              {EXERCISE_REACTION_OPTIONS.map((opt) => {
                const isSelected = answers.exerciseReaction === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    className={`${styles.choiceCard} ${isSelected ? styles.choiceCardSelected : ''}`}
                    onClick={() => handleSingleSelect('exerciseReaction', opt.value)}
                    role="radio"
                    aria-checked={isSelected}
                  >
                    <span className={`${styles.radioIndicator} ${isSelected ? styles.radioIndicatorChecked : ''}`}>
                      {isSelected && <span className={styles.radioDot} />}
                    </span>
                    <span className={styles.choiceText}>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Q2 */}
          <div className={styles.questionBlock}>
            <label className={styles.questionLabel} id="q4-2-label">
              Select any sleep and nervous system patterns you regularly experience:
            </label>
            <p className={styles.questionHint}>Multiple choice: select all that apply.</p>
            <div className={styles.optionsGrid} role="group" aria-labelledby="q4-2-label">
              {NERVOUS_SLEEP_OPTIONS.map((opt) => {
                const isChecked = (answers.nervousSleepPatterns ?? []).includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    className={`${styles.choiceCard} ${isChecked ? styles.choiceCardSelected : ''}`}
                    onClick={() => handleMultiToggle('nervousSleepPatterns', opt.value)}
                    role="checkbox"
                    aria-checked={isChecked}
                  >
                    <span className={`${styles.checkIndicator} ${isChecked ? styles.checkIndicatorChecked : ''}`}>
                      {isChecked && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </span>
                    <span className={styles.choiceText}>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Q3 */}
          <div className={styles.questionBlock}>
            <label className={styles.questionLabel} id="q4-3-label">
              On a scale of 0 to 5, rate your chronic baseline stress levels over the past 6 months:
            </label>
            <p className={styles.questionHint}>0 = Very calm/grounded &middot; 5 = Constant high stress/burnout</p>
            <div className={styles.scaleContainer} aria-labelledby="q4-3-label">
              <div className={styles.scaleButtonsRow} role="group" aria-label="Stress scale 0 to 5">
                {[0, 1, 2, 3, 4, 5].map((val) => {
                  const isActive = answers.stressLevel === val;
                  return (
                    <button
                      key={val}
                      type="button"
                      className={`${styles.scaleButton} ${isActive ? styles.scaleButtonActive : ''}`}
                      onClick={() => handleSingleSelect('stressLevel', val)}
                      aria-pressed={isActive}
                    >
                      <span className={styles.scaleButtonValue}>{val}</span>
                      {isActive && <span className={styles.scaleCheckBadge} aria-hidden="true">✓</span>}
                    </button>
                  );
                })}
              </div>
              <div className={styles.scaleLabels}>
                <span>0 = Very calm & grounded</span>
                <span>5 = Constant high stress & burnout</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5: Inflammatory, Immune & Environmental Triggers */}
      {currentStep === 5 && (
        <div>
          {/* Q1 */}
          <div className={styles.questionBlock}>
            <label className={styles.questionLabel} id="q5-1-label">
              Do you experience frequent, unexplained bodily symptoms that flare together?
            </label>
            <p className={styles.questionHint}>Multiple choice: select all that apply.</p>
            <div className={styles.optionsGrid} role="group" aria-labelledby="q5-1-label">
              {INFLAMMATORY_SYMPTOM_OPTIONS.map((opt) => {
                const isChecked = (answers.inflammatorySymptoms ?? []).includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    className={`${styles.choiceCard} ${isChecked ? styles.choiceCardSelected : ''}`}
                    onClick={() => handleMultiToggle('inflammatorySymptoms', opt.value, 'none')}
                    role="checkbox"
                    aria-checked={isChecked}
                  >
                    <span className={`${styles.checkIndicator} ${isChecked ? styles.checkIndicatorChecked : ''}`}>
                      {isChecked && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </span>
                    <span className={styles.choiceText}>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Q2 */}
          <div className={styles.questionBlock}>
            <label className={styles.questionLabel} id="q5-2-label">
              Have you ever been diagnosed with or suspect any of the following related conditions?
            </label>
            <p className={styles.questionHint}>Multiple choice: select all that apply.</p>
            <div className={styles.optionsGrid} role="group" aria-labelledby="q5-2-label">
              {RELATED_CONDITION_OPTIONS.map((opt) => {
                const isChecked = (answers.relatedConditions ?? []).includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    className={`${styles.choiceCard} ${isChecked ? styles.choiceCardSelected : ''}`}
                    onClick={() => handleMultiToggle('relatedConditions', opt.value)}
                    role="checkbox"
                    aria-checked={isChecked}
                  >
                    <span className={`${styles.checkIndicator} ${isChecked ? styles.checkIndicatorChecked : ''}`}>
                      {isChecked && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </span>
                    <span className={styles.choiceText}>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 6: Qualitative Nuance (Free Response) */}
      {currentStep === 6 && (
        <div>
          {/* Q1 */}
          <div className={styles.questionBlock}>
            <label className={styles.questionLabel} htmlFor="frustrating-symptom-input">
              In 1–2 sentences, what is the single most frustrating symptom you are dealing with right now that you want PHASE to help you solve?
            </label>
            <p className={styles.questionHint}>Short text input: e.g., irregular bleeding, severe afternoon fatigue, chin hair, or painful bloating.</p>
            <textarea
              id="frustrating-symptom-input"
              className={styles.textarea}
              placeholder="e.g. My cycle is completely unpredictable and I get intense afternoon sugar crashes that make it hard to focus..."
              value={answers.frustratingSymptom || ''}
              onChange={(e) => handleSingleSelect('frustratingSymptom', e.target.value)}
              rows={3}
            />
          </div>

          {/* Q2 */}
          <div className={styles.questionBlock}>
            <label className={styles.questionLabel} htmlFor="past-supplements-input">
              If you have tried any supplements, diets, or medications in the past, what gave you the best results (or made you feel worse)?
            </label>
            <p className={styles.questionHint}>Optional short text input: e.g., inositol, metformin, birth control, keto, intermittent fasting.</p>
            <textarea
              id="past-supplements-input"
              className={styles.textarea}
              placeholder="e.g. Inositol helped my cravings slightly, but strict low-carb made my sleep and fatigue worse..."
              value={answers.pastSupplements || ''}
              onChange={(e) => handleSingleSelect('pastSupplements', e.target.value)}
              rows={3}
            />
          </div>
        </div>
      )}

      {/* Navigation Footer */}
      <div className={styles.navFooter}>
        {currentStep > 1 ? (
          <button type="button" className={styles.btnQuiet} onClick={handleBack}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5m7 7-7-7 7-7" />
            </svg>
            <span>Back</span>
          </button>
        ) : (
          <div />
        )}

        <button
          type="button"
          className={styles.btnPrimary}
          onClick={handleNext}
          disabled={!canProceed() || isSubmitting}
        >
          {isSubmitting ? (
            <span>Calculating Phenotype...</span>
          ) : currentStep === QUIZ_SECTIONS.length ? (
            <>
              <span>Calculate My Phenotype</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </>
          ) : (
            <>
              <span>Next Section</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14m-5-5 5 5-5 5" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
