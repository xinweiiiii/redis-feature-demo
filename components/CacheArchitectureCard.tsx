'use client';

import { useState } from 'react';
import CacheArchitectureModal from './CacheArchitectureModal';

export default function CacheArchitectureCard() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="card demo-card-compact" onClick={() => setIsModalOpen(true)}>
        <div className="card-icon">
          <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="8" y="8" width="44" height="44" rx="6" stroke="#667eea" strokeWidth="2.5" />
            <path d="M20 30H40M30 20V40" stroke="#667eea" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="22" cy="22" r="2" fill="#667eea" />
            <circle cx="38" cy="38" r="2" fill="#667eea" />
            <circle cx="38" cy="22" r="2" fill="#667eea" />
          </svg>
        </div>
        <h2>Cache Architecture</h2>
        <p className="card-description">
          Learn caching patterns, strategies, and best practices for building high-performance applications
        </p>
        <div className="feature-list">
          <div className="feature-item">
            <span className="feature-icon">✓</span>
            <span>Cache-Aside Pattern</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">✓</span>
            <span>Write-Through Strategy</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">✓</span>
            <span>TTL & Eviction Policies</span>
          </div>
        </div>
        <button className="demo-button" onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); }}>
          View Architecture
        </button>
      </div>

      {isModalOpen && <CacheArchitectureModal onClose={() => setIsModalOpen(false)} />}
    </>
  );
}
