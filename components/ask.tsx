'use client';

import { useRef, useState, type FormEvent } from 'react';
import type { Answer } from '../lib/ai';
import type { HealthData } from '../lib/health';
import styles from '../app/ask/ask.module.css';

const prompts = [
  ['Symptoms', 'What symptoms have I been logging most frequently?'],
  ['Cycle history', 'What questions should I ask my doctor about irregular cycles?'],
  ['Medication changes', 'What should I discuss about changes after starting a medication?'],
  ['Lab results', 'What should I ask my clinician about a lab result?'],
];
type Entry = { question: string; answer: Answer };
export default function Ask({ data }: { data?: HealthData }) {
  const [personalize, setPersonalize] = useState(false);
  const [question, setQuestion] = useState('');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const input = useRef<HTMLTextAreaElement>(null);
  const busy = useRef(false);
  const history = data;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current) return;
    if (!question.trim() || question.length > 2000) {
      setError('Enter a question of up to 2,000 characters.');
      input.current?.focus();
      return;
    }
    const submitted = question.trim();
    busy.current = true;
    setPending(true);
    setError('');
    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: submitted, ...(personalize && history ? { data: { ...history, personalize: true } } : {}) }),
        signal: AbortSignal.timeout(30000),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'The assistant is unavailable. Try again.');
      if (!Array.isArray(result.answer)) throw new Error('The response could not be read. Try again.');
      setEntries(previous => [...previous, { question: submitted, answer: result.answer }]);
      setQuestion('');
    } catch (cause) {
      setError(cause instanceof Error && cause.name !== 'TimeoutError' && cause.name !== 'TypeError' ? cause.message : 'The assistant could not be reached. Check your connection and try again.');
    } finally {
      busy.current = false;
      setPending(false);
    }
  }

  return <div className={styles.page}>
    <a className={styles.skip} href="#ask-content">Skip to questions</a>
    <header className={styles.masthead}><span>PCOS health companion</span><span className={styles.mode}>Development preview</span></header>
    <main className={styles.layout} id="ask-content">
      <div className={styles.workspace}>
        <header className={styles.intro}>
          <p className={styles.sectionLabel}>Ask</p>
          <h1>Make sense of<br />your health history.</h1>
          <p>A place to explore what you’ve recorded and find questions to bring to your care team.</p>
        </header>
        {!entries.length && <section className={styles.suggestions} aria-labelledby="starting-points">
          <h2 id="starting-points">A starting point</h2>
          <div>{prompts.map(([label, prompt]) => <button type="button" key={label} disabled={pending} onClick={() => { setQuestion(prompt); setError(''); input.current?.focus(); }}>
            <span>{label}</span><span>{prompt}</span><span aria-hidden="true">↗</span>
          </button>)}</div>
        </section>}
        <div className={styles.answers} aria-live="polite" aria-relevant="additions">
          {entries.map((entry, index) => <article className={styles.answer} key={index}>
            <p className={styles.sectionLabel}>Your question</p>
            <h2>{entry.question}</h2>
            <p className={styles.answerMeta}>Scripted development response</p>
            {entry.answer.map(section => <section className={styles.answerSection} key={section.source}>
              <h3>{section.source}</h3><p>{section.text}</p>
              {section.citations?.map(citation => <blockquote key={citation.id}>
                <p>{citation.excerpt}</p>
                {/^(https?):\/\//.test(citation.url) ? <a href={citation.url} target="_blank" rel="noopener noreferrer">{citation.title} (opens in a new tab)</a> : <span>{citation.title}</span>}
                <small>{citation.publisher}</small>
              </blockquote>)}
            </section>)}
          </article>)}
        </div>
        <form className={styles.composer} onSubmit={submit}>
          <label htmlFor="health-question">{entries.length ? 'Ask another question' : 'What would you like to understand?'}</label>
          <textarea ref={input} id="health-question" name="question" autoComplete="off" value={question} onChange={event => setQuestion(event.target.value)} maxLength={2000} rows={4} readOnly={pending} aria-invalid={!!error} aria-describedby={error ? 'ask-error question-help' : 'question-help'} placeholder="For example, what should I discuss about my cycle history…" />
          <div className={styles.composerFooter}><span id="question-help">{question.length.toLocaleString()} / 2,000 characters</span><button disabled={pending} type="submit">{pending ? 'Preparing response…' : 'Ask question'}</button></div>
          {error && <p className={styles.error} id="ask-error" role="alert">{error}</p>}
          <p role="status" className={styles.status}>{pending ? 'Preparing your response. Your question will stay here if the connection fails.' : ''}</p>
        </form>
        <p className={styles.footnote}>For reflection and preparation, not diagnosis or treatment. This assistant is not monitored for emergencies.</p>
      </div>
      <aside className={styles.context} aria-labelledby="context-title">
        <h2 id="context-title">What informs your answer</h2>
        <section>
          <h3>Your recorded history</h3>
          <p>{history ? 'Your health records are available to include.' : 'No health records are connected to this page yet.'}</p>
          {history && <label className={styles.toggle}><input type="checkbox" checked={personalize} disabled={pending} onChange={event => setPersonalize(event.target.checked)} /><span>Include my records</span></label>}
          <p className={styles.small}>{personalize ? 'The last 90 days of symptoms, cycle starts, medications, and labs inform the response.' : 'Personalization is off. Only your question is sent.'}</p>
        </section>
        <section><h3>Research & community</h3><p>Not connected in this preview. Responses do not include live medical research or community experiences.</p></section>
        <section><h3>You choose what to include</h3><p>Questions and any included records are sent to this app’s server. The development provider makes no external AI requests.</p><p className={styles.small}>This page keeps questions and responses in memory. Reloading clears them. Each question is answered independently.</p></section>
      </aside>
    </main>
  </div>;
}
