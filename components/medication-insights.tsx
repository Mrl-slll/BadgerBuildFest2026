"use client";

import { useState } from "react";
import "./symptom-insights.css";

type Props = {
  medicationName: string;
  notes: string;
  sideEffects?: string;
};

export function MedicationInsights({ medicationName }: Props) {
  const [inputText, setInputText] = useState("");
  const [savedNotes, setSavedNotes] = useState<string[]>([]);

  const handleSaveNote = () => {
    if (!inputText.trim()) return;
    setSavedNotes([...savedNotes, inputText]);
    setInputText("");
  };

  return (
    <div className="medication-insights-chatbox">
      <div className="chatbox-input-area">
        <label htmlFor="med-notes">
          Questions or notes about your medications
        </label>
        <div className="chatbox-controls">
          <input
            id="med-notes"
            type="text"
            placeholder="e.g., Ask your doctor about timing, side effects, or interactions..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSaveNote();
              }
            }}
          />
          <button
            type="button"
            onClick={handleSaveNote}
            disabled={!inputText.trim()}
            className="analyze-button"
          >
            Save Note
          </button>
        </div>
      </div>

      {savedNotes.length > 0 && (
        <div className="medication-insights-results">
          <div className="insight-card">
            <div className="card-header">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <h4>Your Medication Notes</h4>
            </div>
            <div className="card-content">
              {savedNotes.map((note, idx) => (
                <div key={idx} className="lifestyle-item">
                  <span className="bullet">→</span>
                  <p>{note}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="insights-footer">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <p>
              These notes are saved locally to help you remember questions for your healthcare provider.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
