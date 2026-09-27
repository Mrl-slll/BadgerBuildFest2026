'use client';

import React from 'react';
import { useUser } from '@clerk/nextjs';
import { QuizInterface } from '../../components/quiz/quiz-interface';
import { useStoredQuizResult } from '../../lib/quiz-storage';
import Link from 'next/link';

export default function QuizPage() {
  const { user, isSignedIn } = useUser();
  const userId = isSignedIn && user ? user.id : 'local-user';
  const storedResult = useStoredQuizResult(userId);

  return (
    <div style={{ maxWidth: '880px', margin: '0 auto', padding: '24px 20px 80px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.9rem',
            color: 'var(--muted, #586966)',
            textDecoration: 'none',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 12H5m7 7-7-7 7-7" />
          </svg>
          <span>Back to Home</span>
        </Link>
      </div>

      <QuizInterface
        userId={userId}
        initialResult={storedResult}
        isModal={false}
      />
    </div>
  );
}
