'use client';

import React, { useEffect } from 'react';
import { QuizInterface } from './quiz-interface';
import type { QuizResult } from '../../lib/quiz-types';
import styles from './quiz.module.css';

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string | null;
  initialResult?: QuizResult | null;
}

export function QuizModal({
  isOpen,
  onClose,
  userId,
  initialResult = null,
}: QuizModalProps) {
  // Handle Escape key & body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={styles.modalBackdrop}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="quiz-modal-title"
    >
      <div
        className={styles.modalContainer}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderTitle} id="quiz-modal-title">
            <span>PHASE Phenotype Assessment</span>
            <span className={styles.modalHeaderBadge}>6-Part Evaluation</span>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close assessment dialog"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className={styles.modalBody}>
          <QuizInterface
            userId={userId}
            initialResult={initialResult}
            onFinish={onClose}
            isModal={true}
          />
        </div>
      </div>
    </div>
  );
}
