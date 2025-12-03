'use client';

import { useState } from 'react';
import SearchDemoModal from './SearchDemoModal';

export default function SearchDemoCard() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="card active-card demo-card-compact" onClick={() => setIsModalOpen(true)}>
        <div className="active-badge">Active Demo</div>
        <div className="card-icon">
          <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Search icon with magnifying glass */}
            <circle cx="25" cy="25" r="12" stroke="#dc382d" strokeWidth="2.5" fill="none" />
            <line x1="34" y1="34" x2="45" y2="45" stroke="#dc382d" strokeWidth="2.5" strokeLinecap="round" />
            {/* Location pin for geo search */}
            <path
              d="M 42 15 L 42 18 M 42 12 C 39.2 12 37 14.2 37 17 C 37 20.5 42 26 42 26 C 42 26 47 20.5 47 17 C 47 14.2 44.8 12 42 12 Z"
              stroke="#dc382d"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Vector/semantic indicator */}
            <circle cx="15" cy="15" r="2" fill="#dc382d" />
            <circle cx="15" cy="35" r="2" fill="#dc382d" />
            <circle cx="25" cy="45" r="2" fill="#dc382d" />
          </svg>
        </div>
        <h2>Query Engine</h2>
        <p className="card-description">
          Explore geospatial, full-text, semantic, and hybrid search capabilities
        </p>
        <div className="feature-list">
          <div className="feature-item">
            <span className="feature-icon">✓</span>
            <span>Geospatial search</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">✓</span>
            <span>Full-text search</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">✓</span>
            <span>Semantic & hybrid</span>
          </div>
        </div>
        <button className="demo-button" onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); }}>
          Try Demo
        </button>
      </div>

      {isModalOpen && <SearchDemoModal onClose={() => setIsModalOpen(false)} />}
    </>
  );
}
