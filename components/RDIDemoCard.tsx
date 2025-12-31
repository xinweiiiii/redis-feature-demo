'use client';

import { useState } from 'react';
import RDIDemoModal from './RDIDemoModal';

export default function RDIDemoCard() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="card active-card demo-card-compact" onClick={() => setIsModalOpen(true)}>
        <div className="active-badge">Active Demo</div>
        <div className="card-icon">
          <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Database icon */}
            <ellipse cx="30" cy="18" rx="16" ry="6" stroke="#dc382d" strokeWidth="2.5" fill="none" />
            <path d="M14 18v12c0 3.3 7.2 6 16 6s16-2.7 16-6V18" stroke="#dc382d" strokeWidth="2.5" fill="none" />
            <path d="M14 30v12c0 3.3 7.2 6 16 6s16-2.7 16-6V30" stroke="#dc382d" strokeWidth="2.5" fill="none" />
            {/* Sync arrows */}
            <path d="M40 25l4 3-4 3" stroke="#dc382d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M20 31l-4-3 4-3" stroke="#dc382d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2>Redis Data Integration (RDI)</h2>
        <p className="card-description">
          Sync data from PostgreSQL to Redis in real-time. Insert records into your database and watch them automatically appear in Redis.
        </p>
        <div className="feature-list">
          <div className="feature-item">
            <span className="feature-icon">✓</span>
            <span>PostgreSQL → Redis sync</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">✓</span>
            <span>Real-time data integration</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">✓</span>
            <span>Live data table view</span>
          </div>
        </div>
        <button className="demo-button" onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); }}>
          Try Demo
        </button>
      </div>

      {isModalOpen && <RDIDemoModal onClose={() => setIsModalOpen(false)} />}
    </>
  );
}
