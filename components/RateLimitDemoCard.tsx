'use client';

import { useState } from 'react';
import RateLimitDemoModal from './RateLimitDemoModal';

export default function RateLimitDemoCard() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="card active-card demo-card-compact" onClick={() => setIsModalOpen(true)}>
        <div className="active-badge">Active Demo</div>
        <div className="card-icon">
          <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="30" cy="30" r="22" stroke="#dc382d" strokeWidth="2.5" fill="none" />
            <path d="M30 15 L30 30 L40 35" stroke="#dc382d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="20" y="8" width="20" height="4" rx="2" fill="#dc382d" />
            <circle cx="30" cy="30" r="3" fill="#dc382d" />
          </svg>
        </div>
        <h2>Rate Limiting</h2>
        <p className="card-description">
          Control API usage with Redis-based rate limiting using INCR and expiration
        </p>
        <div className="feature-list">
          <div className="feature-item">
            <span className="feature-icon">✓</span>
            <span>Request throttling</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">✓</span>
            <span>Configurable limits</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">✓</span>
            <span>Auto-reset timer</span>
          </div>
        </div>
        <button className="demo-button" onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); }}>
          Try Demo
        </button>
      </div>

      {isModalOpen && <RateLimitDemoModal onClose={() => setIsModalOpen(false)} />}
    </>
  );
}
