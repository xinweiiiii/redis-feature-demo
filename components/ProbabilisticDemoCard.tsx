'use client';

import { useState } from 'react';
import ProbabilisticDemoModal from './ProbabilisticDemoModal';

export default function ProbabilisticDemoCard() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="card active-card demo-card-compact" onClick={() => setIsModalOpen(true)}>
        <div className="active-badge">Active Demo</div>

        <div className="card-icon">
          <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
            {/* Probabilistic icon - abstract nodes/connections */}
            <circle cx="30" cy="15" r="6" fill="#8b5cf6" opacity="0.8"/>
            <circle cx="15" cy="35" r="5" fill="#a78bfa" opacity="0.7"/>
            <circle cx="45" cy="35" r="5" fill="#a78bfa" opacity="0.7"/>
            <circle cx="30" cy="50" r="4" fill="#c4b5fd" opacity="0.6"/>

            {/* Connecting lines */}
            <line x1="30" y1="21" x2="15" y2="30" stroke="#8b5cf6" strokeWidth="2" opacity="0.5"/>
            <line x1="30" y1="21" x2="45" y2="30" stroke="#8b5cf6" strokeWidth="2" opacity="0.5"/>
            <line x1="15" y1="40" x2="30" y2="46" stroke="#a78bfa" strokeWidth="2" opacity="0.4"/>
            <line x1="45" y1="40" x2="30" y2="46" stroke="#a78bfa" strokeWidth="2" opacity="0.4"/>

            {/* Small dots for probabilistic effect */}
            <circle cx="22" cy="25" r="2" fill="#ddd6fe" opacity="0.5"/>
            <circle cx="38" cy="25" r="2" fill="#ddd6fe" opacity="0.5"/>
            <circle cx="30" cy="33" r="2" fill="#ddd6fe" opacity="0.5"/>
          </svg>
        </div>

        <h2>Probabilistic Data Structures</h2>
        <p className="card-description">
          Memory-efficient data structures for approximate queries with guaranteed error bounds
        </p>

        <div className="feature-list">
          <div className="feature-item">
            <span className="feature-icon">✓</span>
            <span>Bloom & Cuckoo Filters</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">✓</span>
            <span>HyperLogLog cardinality</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">✓</span>
            <span>Count-Min Sketch frequency</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">✓</span>
            <span>Top-K trending items</span>
          </div>
        </div>

        <button className="demo-button">
          Try Demo
        </button>
      </div>

      {isModalOpen && (
        <ProbabilisticDemoModal onClose={() => setIsModalOpen(false)} />
      )}
    </>
  );
}
