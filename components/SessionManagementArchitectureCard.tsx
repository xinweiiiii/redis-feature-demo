'use client';

import { useState } from 'react';
import SessionManagementArchitectureModal from './SessionManagementArchitectureModal';

export default function SessionManagementArchitectureCard() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div
        className="card demo-card-compact"
        onClick={() => setIsModalOpen(true)}
      >
        <div className="card-icon">
          <svg
            width="60"
            height="60"
            viewBox="0 0 60 60"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="30"
              cy="30"
              r="22"
              stroke="#667eea"
              strokeWidth="2.5"
              fill="none"
            />
            <path
              d="M30 15V30L40 35"
              stroke="#667eea"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="30" cy="30" r="3" fill="#667eea" />
          </svg>
        </div>
        <h2>Session Management</h2>
        <p className="card-description">
          Learn how Redis manages user sessions efficiently
        </p>
        <div className="feature-list">
          <div className="feature-item">
            <span className="feature-icon">✓</span>
            <span>Fast Session Storage</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">✓</span>
            <span>Automatic Expiration</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">✓</span>
            <span>Distributed Sessions</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">✓</span>
            <span>Session Persistence</span>
          </div>
        </div>
        <button
          className="demo-button"
          onClick={(e) => {
            e.stopPropagation();
            setIsModalOpen(true);
          }}
        >
          View Architecture
        </button>
      </div>

      {isModalOpen && (
        <SessionManagementArchitectureModal onClose={() => setIsModalOpen(false)} />
      )}
    </>
  );
}
