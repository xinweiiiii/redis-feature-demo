'use client';

import { useState } from 'react';
import PubSubDemoModal from './PubSubDemoModal';

export default function PubSubDemoCard() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="card active-card demo-card-compact" onClick={() => setIsModalOpen(true)}>
        <div className="active-badge">Active Demo</div>
        <div className="card-icon">
          <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="15" cy="30" r="6" stroke="#dc382d" strokeWidth="2.5" fill="none" />
            <circle cx="45" cy="20" r="5" stroke="#dc382d" strokeWidth="2.5" fill="none" />
            <circle cx="45" cy="40" r="5" stroke="#dc382d" strokeWidth="2.5" fill="none" />
            <path d="M21 30 L40 22 M21 30 L40 38" stroke="#dc382d" strokeWidth="2" />
            <path d="M25 28 L27 30 L25 32" stroke="#dc382d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2>Pub/Sub Messaging</h2>
        <p className="card-description">
          Real-time message publishing and subscription with Redis Pub/Sub channels
        </p>
        <div className="feature-list">
          <div className="feature-item">
            <span className="feature-icon">✓</span>
            <span>Real-time messaging</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">✓</span>
            <span>Multiple channels</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">✓</span>
            <span>Live updates</span>
          </div>
        </div>
        <button className="demo-button" onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); }}>
          Try Demo
        </button>
      </div>

      {isModalOpen && <PubSubDemoModal onClose={() => setIsModalOpen(false)} />}
    </>
  );
}
