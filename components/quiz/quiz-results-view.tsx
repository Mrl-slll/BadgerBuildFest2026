'use client';

import React from 'react';
import type { QuizResult } from '../../lib/quiz-types';
import styles from './quiz.module.css';

interface QuizResultsViewProps {
  result: QuizResult;
  onRetake: () => void;
  onFinish?: () => void;
  isModal?: boolean;
}

export function QuizResultsView({
  result,
  onRetake,
  onFinish,
  isModal = false,
}: QuizResultsViewProps) {
  const {
    phenotype,
    phenotypeTitle,
    phenotypeSubtitle,
    phenotypeDescription,
    primaryPillar,
    primaryPillarDescription,
    secondaryPillar,
    secondaryPillarDescription,
    whyThisMatters,
    scores,
    keySignals,
    recommendations,
    questionsForClinician,
    answers,
  } = result;

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className={styles.resultsSurface}>
      {/* 1. Phenotype Hero Banner */}
      <div className={styles.resultsHero}>
        <div className={styles.phenotypeBadgeRow}>
          <span className={styles.phenotypePill}>Assessed Profile</span>
          <span className={styles.modalHeaderBadge}>{phenotype}</span>
        </div>
        <h2 className={styles.resultsHeroTitle}>{phenotypeTitle}</h2>
        <p className={styles.resultsHeroSubtitle}>{phenotypeSubtitle}</p>
        <p className={styles.resultsHeroDesc}>{phenotypeDescription}</p>
      </div>

      {/* 2. Primary & Secondary Pillars Grid */}
      <div className={styles.pillarsGrid}>
        <div className={styles.pillarCard}>
          <span className={styles.pillarTag}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            Primary Pillar (Cycle Mechanics)
          </span>
          <h3 className={styles.pillarTitle}>{primaryPillar}</h3>
          <p className={styles.pillarDesc}>{primaryPillarDescription}</p>
        </div>

        <div className={styles.pillarCard}>
          <span className={styles.pillarTag} style={{ color: '#246563' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            Secondary Pillar (Co-Driver)
          </span>
          <h3 className={styles.pillarTitle}>{secondaryPillar}</h3>
          <p className={styles.pillarDesc}>{secondaryPillarDescription}</p>
        </div>
      </div>

      {/* 3. "Why this matters" Card (Calm, non-scary, 2-3 sentences) */}
      <div className={styles.whyMattersBox} role="region" aria-label="Why this matters">
        <div className={styles.whyMattersIconWrap}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
        </div>
        <div>
          <h3 className={styles.whyMattersHeading}>Why this matters</h3>
          <p className={styles.whyMattersText}>{whyThisMatters}</p>
        </div>
      </div>

      {/* 4. Driver Balance & Signal Mapping */}
      <div className={styles.driversCard}>
        <h3 className={styles.driversHeading}>Root-Cause Driver Profiling</h3>
        <p className={styles.driversSub}>
          Calculated balance across metabolic glucose stability, adrenal autonomic tone, low-grade inflammation, and androgen tissue sensitivity.
        </p>

        {/* Metabolic Meter */}
        <div className={styles.meterRow}>
          <div className={styles.meterLabelGroup}>
            <span>Metabolic & Glycemic Instability</span>
            <span className={styles.meterValue}>{scores.metabolic}%</span>
          </div>
          <div className={styles.meterBarBg}>
            <div
              className={styles.meterBarFill}
              style={{
                width: `${scores.metabolic}%`,
                background: scores.metabolic > 60 ? '#3368a0' : '#66a3bf',
              }}
            />
          </div>
        </div>

        {/* Neuro-Adrenal Meter */}
        <div className={styles.meterRow}>
          <div className={styles.meterLabelGroup}>
            <span>Neuro-Adrenal & Autonomic Stress</span>
            <span className={styles.meterValue}>{scores.adrenal}%</span>
          </div>
          <div className={styles.meterBarBg}>
            <div
              className={styles.meterBarFill}
              style={{
                width: `${scores.adrenal}%`,
                background: scores.adrenal > 60 ? '#184e4d' : '#246563',
              }}
            />
          </div>
        </div>

        {/* Inflammatory Meter */}
        <div className={styles.meterRow}>
          <div className={styles.meterLabelGroup}>
            <span>Systemic & Gut-Immune Drivers</span>
            <span className={styles.meterValue}>{scores.inflammatory}%</span>
          </div>
          <div className={styles.meterBarBg}>
            <div
              className={styles.meterBarFill}
              style={{
                width: `${scores.inflammatory}%`,
                background: scores.inflammatory > 60 ? '#467472' : '#8fa8a4',
              }}
            />
          </div>
        </div>

        {/* Androgenic Sensitivity Meter */}
        <div className={styles.meterRow}>
          <div className={styles.meterLabelGroup}>
            <span>Androgenic Tissue Sensitivity</span>
            <span className={styles.meterValue}>{scores.androgenic}%</span>
          </div>
          <div className={styles.meterBarBg}>
            <div
              className={styles.meterBarFill}
              style={{
                width: `${scores.androgenic}%`,
                background: scores.androgenic > 60 ? '#246563' : '#66a3bf',
              }}
            />
          </div>
        </div>

        {/* Key Signals Detected */}
        {keySignals && keySignals.length > 0 && (
          <div className={styles.signalsWrap}>
            <span className={styles.signalsLabel}>Identified Behavioral & Physiological Signals</span>
            <div className={styles.signalsChips}>
              {keySignals.map((signal) => (
                <span key={signal} className={styles.signalChip}>
                  {signal}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 5. Qualitative Context Recap */}
      {(answers.frustratingSymptom || answers.pastSupplements) && (
        <div className={styles.qualitativeCard}>
          <span className={styles.pillarTag} style={{ color: '#246563' }}>Your Personal Context</span>
          {answers.frustratingSymptom && (
            <div style={{ marginTop: 8 }}>
              <strong style={{ fontSize: '0.9rem', color: '#243f40' }}>Primary Frustration to Solve:</strong>
              <p className={styles.qualitativeQuote}>&ldquo;{answers.frustratingSymptom}&rdquo;</p>
            </div>
          )}
          {answers.pastSupplements && (
            <div style={{ marginTop: 12 }}>
              <strong style={{ fontSize: '0.9rem', color: '#243f40' }}>Past Supplements, Diets & Interventions:</strong>
              <p className={styles.qualitativeQuote}>&ldquo;{answers.pastSupplements}&rdquo;</p>
            </div>
          )}
        </div>
      )}

      {/* 6. Personalized Actionable Recommendations */}
      <div className={styles.recsGrid}>
        {recommendations.map((rec) => (
          <div key={rec.category} className={styles.recCard}>
            <h4 className={styles.recCategory}>{rec.category}</h4>
            <ul className={styles.recList}>
              {rec.points.map((pt, i) => (
                <li key={i}>{pt}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* 7. Questions to Bring to Your Clinician */}
      <div className={styles.clinicianCard}>
        <h4 className={styles.clinicianTitle}>Questions Worth Discussing with Your Doctor</h4>
        <ul className={styles.clinicianList}>
          {questionsForClinician.map((q, idx) => (
            <li key={idx}>{q}</li>
          ))}
        </ul>
      </div>

      {/* 8. Action Footer */}
      <div className={styles.resultsActions}>
        <button type="button" className={styles.btnQuiet} onClick={onRetake}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
          <span>Retake Assessment</span>
        </button>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="button" className={styles.btnQuiet} onClick={handlePrint} title="Print or save PDF summary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M6 9V2h12v7" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <path d="M6 14h12v8H6z" />
            </svg>
            <span>Print Summary</span>
          </button>

          {onFinish && (
            <button type="button" className={styles.btnPrimary} onClick={onFinish}>
              <span>{isModal ? 'Return to Journal' : 'Continue to Journal'}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14m-5-5 5 5-5 5" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
