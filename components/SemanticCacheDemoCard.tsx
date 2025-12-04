'use client';

import { useState } from 'react';
import SemanticCacheDemoModal from './SemanticCacheDemoModal';

export default function SemanticCacheDemoCard() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="card active-card demo-card-compact" onClick={() => setIsModalOpen(true)}>
        <div className="active-badge">Active Demo</div>
        <div className="card-icon">
          <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Brain/AI icon */}
            <circle cx="30" cy="30" r="18" stroke="#dc382d" strokeWidth="2.5" fill="none" />
            <path d="M 25 25 Q 30 20 35 25" stroke="#dc382d" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M 25 35 Q 30 40 35 35" stroke="#dc382d" strokeWidth="2" fill="none" strokeLinecap="round" />
            <circle cx="25" cy="30" r="2" fill="#dc382d" />
            <circle cx="35" cy="30" r="2" fill="#dc382d" />
            {/* Cache symbol */}
            <path d="M 15 15 L 20 15 L 20 20" stroke="#4caf50" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M 45 15 L 40 15 L 40 20" stroke="#4caf50" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="17" cy="17" r="1.5" fill="#4caf50" />
            <circle cx="43" cy="17" r="1.5" fill="#4caf50" />
            {/* Lightning bolt for speed */}
            <path d="M 28 10 L 26 18 L 30 18 L 28 26" stroke="#ffd700" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2>Semantic Cache</h2>
        <p className="card-description">
          Cache GPT-5 responses using vector similarity to save costs and reduce latency for similar queries
        </p>
        <div className="feature-list">
          <div className="feature-item">
            <span className="feature-icon">✓</span>
            <span>Vector embeddings</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">✓</span>
            <span>Cost optimization</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">✓</span>
            <span>Instant responses</span>
          </div>
        </div>
        <button className="demo-button" onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); }}>
          Try Demo
        </button>
      </div>

      {isModalOpen && <SemanticCacheDemoModal onClose={() => setIsModalOpen(false)} />}
    </>
  );
}
