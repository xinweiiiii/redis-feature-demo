'use client';

import { useState } from 'react';
import QueryEngineArchitectureModal from './QueryEngineArchitectureModal';

export default function QueryEngineArchitectureCard() {
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
            <rect
              x="8"
              y="8"
              width="44"
              height="44"
              rx="6"
              stroke="#667eea"
              strokeWidth="2.5"
            />
            <path
              d="M20 30H40M30 20V40"
              stroke="#667eea"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <circle cx="22" cy="22" r="2" fill="#667eea" />
            <circle cx="38" cy="38" r="2" fill="#667eea" />
            <circle cx="38" cy="22" r="2" fill="#667eea" />
          </svg>
        </div>
        <h2>Query Engine</h2>
        <p className="card-description">
          Learn how redis support different search functions
        </p>
        <div className="feature-list">
          <div className="feature-item">
            <span className="feature-icon">✓</span>
            <span>Full-Text Search</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">✓</span>
            <span>Geospatial Search</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">✓</span>
            <span>Probabislitc</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">✓</span>
            <span>Hybrid Search</span>
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
        <QueryEngineArchitectureModal onClose={() => setIsModalOpen(false)} />
      )}
    </>
  );
}
