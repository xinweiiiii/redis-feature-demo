'use client';

import { useState } from 'react';

interface UseCaseData {
  realWorldUseCases: string[];
  whenToUse: string[];
  whenNotToUse: string[];
  performance: {
    characteristics: string[];
    benchmarks?: string[];
  };
  tradeoffs?: {
    pros: string[];
    cons: string[];
  };
}

interface UseCaseExplanationProps {
  data: UseCaseData;
  title?: string;
  defaultOpen?: boolean;
}

export default function UseCaseExplanation({
  data,
  title = 'Use Case & Performance Guide',
  defaultOpen = false
}: UseCaseExplanationProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const tradeoffs = data.tradeoffs;

  return (
    <div className="use-case-panel">
      <button
        className="use-case-header"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <h3 className="use-case-title">
          <span className="use-case-icon">📚</span>
          {title}
        </h3>
        <span className={`use-case-arrow ${isOpen ? "open" : ""}`}>▼</span>
      </button>

      {isOpen && (
        <div className="use-case-content">
          {/* Real-World Use Cases */}
          <div className="use-case-section">
            <h4 className="use-case-section-title">
              <span className="section-icon">🌍</span>
              Real-World Use Cases
            </h4>
            <ul className="use-case-list">
              {data.realWorldUseCases.map((useCase, index) => (
                <li key={index}>{useCase}</li>
              ))}
            </ul>
          </div>

          {/* When to Use */}
          <div className="use-case-section">
            <h4 className="use-case-section-title success">
              <span className="section-icon">✅</span>
              When to Use
            </h4>
            <ul className="use-case-list">
              {data.whenToUse.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>

          {/* When NOT to Use */}
          <div className="use-case-section">
            <h4 className="use-case-section-title warning">
              <span className="section-icon">⚠️</span>
              When NOT to Use
            </h4>
            <ul className="use-case-list">
              {data.whenNotToUse.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>

          {/* Performance Characteristics */}
          <div className="use-case-section">
            <h4 className="use-case-section-title">
              <span className="section-icon">⚡</span>
              Performance Characteristics
            </h4>
            <ul className="use-case-list">
              {data.performance.characteristics.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
            {data.performance.benchmarks &&
              data.performance.benchmarks.length > 0 && (
                <div className="benchmarks">
                  <strong>Benchmarks:</strong>
                  <ul className="use-case-list">
                    {data.performance.benchmarks.map((benchmark, index) => (
                      <li key={index}>{benchmark}</li>
                    ))}
                  </ul>
                </div>
              )}
          </div>

          {/* Trade-offs */}
          {(tradeoffs?.pros?.length || tradeoffs?.cons?.length) && (
            <div className="use-case-section">
              <h4 className="use-case-section-title">
                <span className="section-icon">⚖️</span>
                Trade-offs & Limitations
              </h4>

              <div className="tradeoffs-grid">
                {tradeoffs?.pros?.length > 0 && (
                  <div className="tradeoff-column pros">
                    <h5>Pros</h5>
                    <ul className="use-case-list">
                      {tradeoffs.pros.map((pro, index) => (
                        <li key={index}>{pro}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {tradeoffs?.cons?.length > 0 && (
                  <div className="tradeoff-column cons">
                    <h5>Cons</h5>
                    <ul className="use-case-list">
                      {tradeoffs.cons.map((con, index) => (
                        <li key={index}>{con}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
