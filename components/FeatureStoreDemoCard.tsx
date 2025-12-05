'use client';

import { useState } from 'react';
import FeatureStoreDemoModal from './FeatureStoreDemoModal';

export default function FeatureStoreDemoCard() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="card active-card demo-card-compact" onClick={() => setIsModalOpen(true)}>
        <div className="active-badge">Active Demo</div>
        <div className="card-icon">
          <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Database/Storage icon */}
            <ellipse cx="30" cy="20" rx="15" ry="5" stroke="#dc382d" strokeWidth="2.5" fill="none" />
            <path d="M 15 20 L 15 40 Q 15 45 30 45 Q 45 45 45 40 L 45 20" stroke="#dc382d" strokeWidth="2.5" fill="none" />
            <ellipse cx="30" cy="30" rx="15" ry="5" stroke="#dc382d" strokeWidth="2.5" fill="none" />
            <ellipse cx="30" cy="40" rx="15" ry="5" stroke="#dc382d" strokeWidth="2.5" fill="none" />
            {/* ML/Features icon */}
            <circle cx="30" cy="12" r="2.5" fill="#4caf50" />
            <circle cx="20" cy="25" r="2.5" fill="#4caf50" />
            <circle cx="40" cy="25" r="2.5" fill="#4caf50" />
            <circle cx="25" cy="35" r="2.5" fill="#4caf50" />
            <circle cx="35" cy="35" r="2.5" fill="#4caf50" />
            {/* Lightning/Speed icon */}
            <path d="M 50 10 L 48 16 L 51 16 L 49 22" stroke="#ffd700" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2>Feature Store</h2>
        <p className="card-description">
          Real-time ML feature management for fraud detection with Redis
        </p>
        <div className="feature-list">
          <div className="feature-item">
            <span className="feature-icon">✓</span>
            <span>Real-time fraud scoring</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">✓</span>
            <span>Low-latency retrieval</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">✓</span>
            <span>Batch operations</span>
          </div>
        </div>
        <button className="demo-button" onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); }}>
          Try Demo
        </button>
      </div>

      {isModalOpen && <FeatureStoreDemoModal onClose={() => setIsModalOpen(false)} />}
    </>
  );
}
