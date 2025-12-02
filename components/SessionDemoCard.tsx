'use client';

import { useState } from 'react';
import SessionDemoModal from './SessionDemoModal';

export default function SessionDemoCard() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="card active-card demo-card-compact" onClick={() => setIsModalOpen(true)}>
        <div className="active-badge">Active Demo</div>
        <div className="card-icon">
          <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="30" cy="20" r="8" stroke="#dc382d" strokeWidth="2.5" fill="none" />
            <path d="M15 45 C15 35, 45 35, 45 45" stroke="#dc382d" strokeWidth="2.5" fill="none" />
            <rect x="10" y="47" width="40" height="8" rx="2" stroke="#dc382d" strokeWidth="2.5" fill="none" />
            <circle cx="20" cy="51" r="1.5" fill="#dc382d" />
            <circle cx="25" cy="51" r="1.5" fill="#dc382d" />
            <circle cx="30" cy="51" r="1.5" fill="#dc382d" />
          </svg>
        </div>
        <h2>Session Management</h2>
        <p className="card-description">
          OAuth SSO login simulation with Redis session storage and management
        </p>
        <div className="feature-list">
          <div className="feature-item">
            <span className="feature-icon">✓</span>
            <span>OAuth login flow</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">✓</span>
            <span>Session storage</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">✓</span>
            <span>Auto expiration</span>
          </div>
        </div>
        <button className="demo-button" onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); }}>
          Try Demo
        </button>
      </div>

      {isModalOpen && <SessionDemoModal onClose={() => setIsModalOpen(false)} />}
    </>
  );
}
