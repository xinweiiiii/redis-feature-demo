'use client';

import { useState } from 'react';
import RateLimitingArchitectureModal from './RateLimitingArchitectureModal';

export default function RateLimitingArchitectureCard() {
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
              r="20"
              stroke="#667eea"
              strokeWidth="2.5"
              fill="none"
            />
            <path
              d="M30 15V30M30 30L40 35"
              stroke="#667eea"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M15 30H25M35 30H45"
              stroke="#667eea"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <h2>Rate Limiting</h2>
        <p className="card-description">
          Learn how Redis controls request rates to protect your resources
        </p>
        <div className="feature-list">
          <div className="feature-item">
            <span className="feature-icon">✓</span>
            <span>Request Throttling</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">✓</span>
            <span>API Protection</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">✓</span>
            <span>Abuse Prevention</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">✓</span>
            <span>Resource Management</span>
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
        <RateLimitingArchitectureModal onClose={() => setIsModalOpen(false)} />
      )}
    </>
  );
}
