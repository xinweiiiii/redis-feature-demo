'use client';

import { useState } from 'react';
import CachingDemoModal from './CachingDemoModal';

export default function CachingDemoCard() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="card active-card demo-card-compact" onClick={() => setIsModalOpen(true)}>
        <div className="active-badge">Active Demo</div>
        <div className="card-icon">
          <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="8" y="8" width="44" height="44" rx="6" stroke="#dc382d" strokeWidth="2.5" />
            <path d="M20 30H40M30 20V40" stroke="#dc382d" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="22" cy="22" r="2" fill="#dc382d" />
            <circle cx="38" cy="38" r="2" fill="#dc382d" />
            <circle cx="38" cy="22" r="2" fill="#dc382d" />
          </svg>
        </div>
        <h2>Basic Caching Demo</h2>
        <p className="card-description">
          Write and read different Redis data types (String, Hash, List, Set, Sorted Set) with real-time performance metrics
        </p>
        <div className="feature-list">
          <div className="feature-item">
            <span className="feature-icon">✓</span>
            <span>5 Redis data types</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">✓</span>
            <span>Performance tracking</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">✓</span>
            <span>Real-time operations</span>
          </div>
        </div>
        <button className="demo-button" onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); }}>
          Try Demo
        </button>
      </div>

      {isModalOpen && <CachingDemoModal onClose={() => setIsModalOpen(false)} />}
    </>
  );
}
