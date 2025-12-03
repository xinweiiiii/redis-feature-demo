'use client';

import { useState } from 'react';
import TimeSeriesDemoModal from './TimeSeriesDemoModal';

export default function TimeSeriesDemoCard() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="card active-card demo-card-compact" onClick={() => setIsModalOpen(true)}>
        <div className="active-badge">Active Demo</div>
        <div className="card-icon">
          <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Time series line chart icon */}
            <rect x="10" y="10" width="40" height="40" rx="2" stroke="#dc382d" strokeWidth="2.5" fill="none" />
            {/* X and Y axes */}
            <line x1="15" y1="45" x2="45" y2="45" stroke="#dc382d" strokeWidth="1.5" />
            <line x1="15" y1="15" x2="15" y2="45" stroke="#dc382d" strokeWidth="1.5" />
            {/* Time series line */}
            <path
              d="M 15 40 L 22 35 L 28 38 L 35 25 L 42 30 L 45 20"
              stroke="#dc382d"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Data points */}
            <circle cx="15" cy="40" r="2" fill="#dc382d" />
            <circle cx="22" cy="35" r="2" fill="#dc382d" />
            <circle cx="28" cy="38" r="2" fill="#dc382d" />
            <circle cx="35" cy="25" r="2" fill="#dc382d" />
            <circle cx="42" cy="30" r="2" fill="#dc382d" />
            <circle cx="45" cy="20" r="2" fill="#dc382d" />
          </svg>
        </div>
        <h2>Time Series</h2>
        <p className="card-description">
          Track and analyze time-based data with Redis TimeSeries
        </p>
        <div className="feature-list">
          <div className="feature-item">
            <span className="feature-icon">✓</span>
            <span>Real-time metrics</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">✓</span>
            <span>Data aggregation</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">✓</span>
            <span>Time-based queries</span>
          </div>
        </div>
        <button className="demo-button" onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); }}>
          Try Demo
        </button>
      </div>

      {isModalOpen && <TimeSeriesDemoModal onClose={() => setIsModalOpen(false)} />}
    </>
  );
}
