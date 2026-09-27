'use client';

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import type { Answer } from '../lib/ai';
import { emptyData, type HealthData } from '../lib/health';
import { healthStorageKey, parseStoredHealthData } from '../lib/health-storage';
import styles from '../app/ask/ask.module.css';
import { ScrollReveal, PhysicsInteractive, MagneticButton } from './motion';

const starterSuggestions = [
  'What symptoms have I logged most frequently?',
  'What questions should I ask my doctor about irregular cycles?',
  'What should I discuss about medication changes and side effects?',
  'What snacks and meal patterns support PCOS blood sugar balance?',
];

type Message = {
  id: string;
  role: 'user' | 'assistant';
  question?: string;
  answer?: Answer;
  timestamp: string;
};

export default function Ask({ data: initialPropData }: { data?: HealthData }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [hasLoggedRecords, setHasLoggedRecords] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const busy = useRef(false);

  // Read local storage on client load
  useEffect(() => {
    try {
      const raw = localStorage.getItem(healthStorageKey);
      const parsed = parseStoredHealthData(raw);
      if (parsed.data && parsed.data.logs.length > 0) {
        setHasLoggedRecords(true);
      }
    } catch {
      // Ignored
    }
  }, []);

  const hasMounted = useRef(false);

  // Auto-scroll to latest message only after user starts chatting
  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }
    if (messages.length > 0 || pending) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, pending]);

  function getActiveHealthData(): HealthData {
    if (initialPropData) return initialPropData;
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(healthStorageKey) : null;
      const parsed = parseStoredHealthData(raw);
      return parsed.data ?? emptyData('local-user');
    } catch {
      return emptyData('local-user');
    }
  }

  async function handleSend(textToSend?: string) {
    const rawQuestion = (textToSend ?? question).trim();
    if (busy.current) return;
    if (!rawQuestion || rawQuestion.length > 2000) {
      setError('Enter a question of up to 2,000 characters.');
      textareaRef.current?.focus();
      return;
    }

    const currentRecords = getActiveHealthData();
    const messageId = Date.now().toString();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Append user message immediately
    const userMsg: Message = {
      id: `user-${messageId}`,
      role: 'user',
      question: rawQuestion,
      timestamp: timeStr,
    };

    setMessages((prev) => [...prev, userMsg]);
    setQuestion('');
    setError('');
    busy.current = true;
    setPending(true);

    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: rawQuestion,
          data: {
            ...currentRecords,
            personalize: true, // Always personalize based on user's records!
          },
        }),
        signal: AbortSignal.timeout(30000),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'The assistant is unavailable. Try again.');
      if (!Array.isArray(result.answer)) throw new Error('The response could not be read. Try again.');

      const assistantMsg: Message = {
        id: `assistant-${messageId}`,
        role: 'assistant',
        question: rawQuestion,
        answer: result.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (cause) {
      setError(
        cause instanceof Error && cause.name !== 'TimeoutError' && cause.name !== 'TypeError'
          ? cause.message
          : 'The assistant could not be reached. Check your connection and try again.'
      );
    } finally {
      busy.current = false;
      setPending(false);
      // Refocus input
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    handleSend();
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.chatContainer}>
        {/* Top Header */}
        <ScrollReveal yOffset={20}>
          <header className={styles.header}>
            <div className={styles.headerContent}>
              <div>
                <p className="hero-badge">AI Clinical Companion</p>
                <h1 className={styles.headerTitle}>Make sense of your health history.</h1>
                <p className={styles.headerSubtitle}>
                  A Gemini-style conversational space to explore your symptoms, cycles, and doctor-ready questions.
                </p>
              </div>
              <div className={styles.statusPill}>
                <span className={styles.statusDot} aria-hidden="true" />
                <span>Personalized with your journal</span>
              </div>
            </div>
          </header>
        </ScrollReveal>

        {/* Message History (Scrollable Conversation Area) */}
        <main className={styles.conversation} aria-live="polite" aria-relevant="additions">
          {messages.length === 0 && (
            <div className={styles.welcomeCard}>
              <div className={styles.welcomeIconWrap}>
                <svg className={styles.sparkleIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="var(--teal)" stroke="none" />
                </svg>
              </div>
              <h2 className={styles.welcomeTitle}>Welcome to your PCOS companion</h2>
              <p className={styles.welcomeText}>
                I can help synthesize your recorded symptoms, cycle patterns, and medications to help you prepare for discussions with your care team.
              </p>

              <div className={styles.suggestionsHeader}>Suggested questions:</div>
              <div className={styles.suggestionsGrid}>
                {starterSuggestions.map((suggestion) => (
                  <PhysicsInteractive key={suggestion} scaleOnTap={0.96} scaleOnHover={1.02}>
                    <button
                      type="button"
                      className={styles.suggestionChip}
                      onClick={() => handleSend(suggestion)}
                      disabled={pending}
                    >
                      <span>{suggestion}</span>
                      <svg className={styles.chipArrow} viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </PhysicsInteractive>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => {
            if (message.role === 'user') {
              return (
                <div key={message.id} className={styles.userRow}>
                  <div className={styles.userBubble}>
                    <p className={styles.userText}>{message.question}</p>
                    <span className={styles.messageTime}>{message.timestamp}</span>
                  </div>
                </div>
              );
            }

            // Assistant Message
            const answerSections = message.answer ?? [];
            const dataSection = answerSections.find((s) => s.source === 'Your data');
            const interpretationSection = answerSections.find((s) => s.source === 'AI interpretation');
            const clinicianSection = answerSections.find((s) => s.source === 'Questions for your clinician');
            const researchSection = answerSections.find((s) => s.source === 'Research');
            const tags = interpretationSection?.tags ?? dataSection?.tags ?? [];

            return (
              <div key={message.id} className={styles.assistantRow}>
                <div className={styles.assistantAvatar}>
                  <svg viewBox="0 0 24 24" fill="none" className={styles.assistantAvatarIcon}>
                    <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="currentColor" />
                  </svg>
                </div>

                <div className={styles.assistantBody}>
                  <div className={styles.assistantHeader}>
                    <span className={styles.assistantName}>PCOS Companion</span>
                    <span className={styles.messageTime}>{message.timestamp}</span>
                  </div>

                  {/* Little tags referring to user records pulled */}
                  {tags && tags.length > 0 && (
                    <div className={styles.recordsTags} aria-label="Referenced records from your journal">
                      <span className={styles.tagsLabel}>Referenced records:</span>
                      <div className={styles.tagsPillList}>
                        {tags.map((tag) => (
                          <span key={tag} className={styles.recordTag}>
                            <span className={styles.recordTagDot} aria-hidden="true" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Primary conversational answer */}
                  {interpretationSection && (
                    <div className={styles.primaryText}>
                      {interpretationSection.text.split('\n\n').map((paragraph, pIdx) => {
                        if (paragraph.includes('• ')) {
                          const lines = paragraph.split('\n').filter(Boolean);
                          const intro = lines.find((l) => !l.startsWith('• '));
                          const items = lines.filter((l) => l.startsWith('• '));
                          return (
                            <div key={pIdx} className={styles.paragraphBlock}>
                              {intro && <p>{intro}</p>}
                              <ul className={styles.bulletList}>
                                {items.map((item, itemIdx) => (
                                  <li key={itemIdx}>{item.replace(/^•\s*/, '')}</li>
                                ))}
                              </ul>
                            </div>
                          );
                        }
                        return <p key={pIdx}>{paragraph}</p>;
                      })}
                    </div>
                  )}

                  {/* Clinician Question (only if user asked for doctor questions) */}
                  {clinicianSection && clinicianSection.text && (
                    <div className={styles.doctorCard}>
                      <div className={styles.doctorCardHeader}>
                        <svg className={styles.doctorIcon} viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <span className={styles.doctorCardTitle}>Question to bring to your clinician</span>
                      </div>
                      <p className={styles.doctorQuestionText}>&ldquo;{clinicianSection.text}&rdquo;</p>
                    </div>
                  )}

                  {/* Research Citations */}
                  {researchSection && researchSection.citations && researchSection.citations.length > 0 && (
                    <div className={styles.researchSection}>
                      <span className={styles.researchLabel}>Clinical references:</span>
                      <div className={styles.citationsList}>
                        {researchSection.citations.map((citation) => (
                          <div key={citation.id} className={styles.citationCard}>
                            <p className={styles.citationExcerpt}>&ldquo;{citation.excerpt}&rdquo;</p>
                            <div className={styles.citationMeta}>
                              {/^(https?):\/\//.test(citation.url) ? (
                                <a href={citation.url} target="_blank" rel="noopener noreferrer" className={styles.citationLink}>
                                  {citation.title} ↗
                                </a>
                              ) : (
                                <span className={styles.citationTitle}>{citation.title}</span>
                              )}
                              <span className={styles.citationPublisher}>{citation.publisher}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className={styles.metaDisclaimer}>
                    Development assistant response · For reflection and doctor prep, not diagnosis.
                  </div>
                </div>
              </div>
            );
          })}

          {/* Pending Typing Indicator */}
          {pending && (
            <div className={styles.assistantRow}>
              <div className={styles.assistantAvatar}>
                <svg viewBox="0 0 24 24" fill="none" className={styles.assistantAvatarIcon}>
                  <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="currentColor" />
                </svg>
              </div>
              <div className={styles.thinkingBubble}>
                <div className={styles.pulseDots}>
                  <span />
                  <span />
                  <span />
                </div>
                <span className={styles.thinkingText}>Reviewing your journal records & clinical context…</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </main>

        {/* Bottom Sticky Prompt Box */}
        <div className={styles.bottomComposerArea}>
          <form className={styles.composerForm} onSubmit={onSubmit}>
            <div className={styles.inputWrapper}>
              <textarea
                ref={textareaRef}
                id="health-question"
                name="question"
                rows={2}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={onKeyDown}
                maxLength={2000}
                disabled={pending}
                placeholder="Ask about your symptoms, cycles, or care..."
                className={styles.chatInput}
                aria-label="Ask your PCOS companion a question"
              />

              <div className={styles.composerActions}>
                <span className={styles.characterCount}>
                  {question.length > 0 ? `${question.length}/2000` : ''}
                </span>

                <MagneticButton magneticStrength={0.22} innerStrength={0.12}>
                  <button
                    type="submit"
                    disabled={pending || !question.trim()}
                    className={styles.sendButton}
                    aria-label="Send question"
                    title="Send (Enter)"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.sendIcon}>
                      <line x1="12" y1="19" x2="12" y2="5" />
                      <polyline points="5 12 12 5 19 12" />
                    </svg>
                  </button>
                </MagneticButton>
              </div>
            </div>

            {error && (
              <p className={styles.error} role="alert">
                {error}
              </p>
            )}

            <p className={styles.disclaimerText}>
              For reflection and appointment preparation, not diagnosis or emergency care.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
