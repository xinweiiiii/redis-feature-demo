'use client';

import { useState } from 'react';
import LeaderboardDemoModal from './LeaderboardDemoModal';

export default function LeaderboardDemoCard() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="card active-card demo-card-compact" onClick={() => setIsModalOpen(true)}>
        <div className="active-badge">Active Demo</div>
        <div className="card-icon">
          <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Trophy icon */}
            <path d="M 20 15 L 20 10 L 40 10 L 40 15" stroke="#dc382d" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M 15 15 L 15 20 Q 15 25 20 25" stroke="#dc382d" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M 45 15 L 45 20 Q 45 25 40 25" stroke="#dc382d" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M 20 15 L 40 15 L 38 30 Q 38 35 30 35 Q 22 35 22 30 Z" fill="#dc382d" opacity="0.2" stroke="#dc382d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M 25 35 L 25 42 L 35 42 L 35 35" stroke="#dc382d" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M 22 42 L 38 42 L 40 48 L 20 48 Z" fill="#dc382d" stroke="#dc382d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            {/* Stars */}
            <circle cx="30" cy="22" r="2" fill="#ffd700" />
          </svg>
        </div>
        <h2>Redis Leaderboards</h2>
        <p className="card-description">
          Build real-time gaming leaderboards and ranking systems with Redis Sorted Sets
        </p>
        <div className="feature-list">
          <div className="feature-item">
            <span className="feature-icon">✓</span>
            <span>Real-time rankings</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">✓</span>
            <span>Score updates</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">✓</span>
            <span>Player positioning</span>
          </div>
        </div>
        <button className="demo-button" onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); }}>
          Try Demo
        </button>
      </div>

      {isModalOpen && <LeaderboardDemoModal onClose={() => setIsModalOpen(false)} />}
    </>
  );
}
