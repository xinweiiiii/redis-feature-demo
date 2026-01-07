'use client';

import { useState } from 'react';
import InMemoryDatabaseArchitectureModal from './InMemoryDatabaseArchitectureModal';

export default function InMemoryDatabaseArchitectureCard() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="card demo-card-compact" onClick={() => setIsModalOpen(true)}>
        <div className="card-icon">
          <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="8" y="12" width="44" height="10" rx="2" stroke="#764ba2" strokeWidth="2.5" fill="none" />
            <rect x="8" y="25" width="44" height="10" rx="2" stroke="#764ba2" strokeWidth="2.5" fill="none" />
            <rect x="8" y="38" width="44" height="10" rx="2" stroke="#764ba2" strokeWidth="2.5" fill="none" />
            <path d="M18 17 L18 43" stroke="#764ba2" strokeWidth="2" strokeLinecap="round" />
            <path d="M30 17 L30 43" stroke="#764ba2" strokeWidth="2" strokeLinecap="round" />
            <path d="M42 17 L42 43" stroke="#764ba2" strokeWidth="2" strokeLinecap="round" />
            <circle cx="18" cy="17" r="1.5" fill="#764ba2" />
            <circle cx="30" cy="30" r="1.5" fill="#764ba2" />
            <circle cx="42" cy="43" r="1.5" fill="#764ba2" />
          </svg>
        </div>
        <h2>In-Memory Database</h2>
        <p className="card-description">
          Explore Redis as a primary database with sub-millisecond latency, persistence, and high availability
        </p>
        <div className="feature-list">
          <div className="feature-item">
            <span className="feature-icon">✓</span>
            <span>Rich Data Structures</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">✓</span>
            <span>Persistence & Durability</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">✓</span>
            <span>High Availability</span>
          </div>
        </div>
        <button className="demo-button" onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); }}>
          View Architecture
        </button>
      </div>

      {isModalOpen && <InMemoryDatabaseArchitectureModal onClose={() => setIsModalOpen(false)} />}
    </>
  );
}
