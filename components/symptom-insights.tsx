"use client";

import { useState, useEffect } from "react";
import "./symptom-insights.css";

type SymptomSuggestion = {
  treatment: string;
  lifestyle: string;
};

type Props = {
  symptoms: string[];
};

export function SymptomInsights({ symptoms }: Props) {
  const [suggestions, setSuggestions] = useState<SymptomSuggestion | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (symptoms.length === 0) {
      setSuggestions(null);
      return;
    }

    setLoading(true);
    fetch("/api/symptom-suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symptoms }),
    })
      .then((res) => res.json())
      .then((data) => {
        setSuggestions(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [symptoms.join(",")]);

  if (symptoms.length === 0 || (!loading && !suggestions)) {
    return null;
  }

  return (
    <div className="symptom-insights">
      <div className="insights-header">
        <svg
          className="insights-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
        </svg>
        <h3>Personalized Suggestions</h3>
      </div>

      {loading ? (
        <div className="insights-loading">
          <div className="loading-spinner">
            <span />
            <span />
            <span />
          </div>
          <p>Getting personalized suggestions...</p>
        </div>
      ) : (
        suggestions && (
          <div className="insights-cards">
            <div className="insight-card treatment-card">
              <div className="card-header">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <h4>Treatment Options</h4>
              </div>
              <div className="card-content">
                {suggestions.treatment.split("\n\n").map((paragraph, idx) => {
                  if (paragraph.includes("• ")) {
                    const lines = paragraph.split("\n").filter(Boolean);
                    const intro = lines.find((l) => !l.startsWith("• "));
                    const items = lines.filter((l) => l.startsWith("• "));
                    return (
                      <div key={idx}>
                        {intro && <p>{intro}</p>}
                        <ul>
                          {items.map((item, itemIdx) => (
                            <li key={itemIdx}>{item.replace(/^•\s*/, "")}</li>
                          ))}
                        </ul>
                      </div>
                    );
                  }
                  return <p key={idx}>{paragraph}</p>;
                })}
              </div>
            </div>

            <div className="insight-card lifestyle-card">
              <div className="card-header">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                </svg>
                <h4>Lifestyle Suggestions</h4>
              </div>
              <div className="card-content">
                {suggestions.lifestyle.split("\n").filter(Boolean).map((item, idx) => (
                  <div key={idx} className="lifestyle-item">
                    <span className="bullet">✓</span>
                    <p>{item.replace(/^[•\-✓]\s*/, "")}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      )}

      <div className="insights-footer">
        <svg viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
        <p>
          These suggestions are for reflection and discussion with your healthcare
          provider. They are not medical advice or a replacement for professional care.
        </p>
      </div>
    </div>
  );
}
