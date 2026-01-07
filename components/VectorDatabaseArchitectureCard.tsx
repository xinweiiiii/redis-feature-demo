'use client';

import { useState } from 'react';
import VectorDatabaseArchitectureModal from './VectorDatabaseArchitectureModal';

export default function VectorDatabaseArchitectureCard() {
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
            <circle cx="15" cy="15" r="4" stroke="#667eea" strokeWidth="2.5" fill="none" />
            <circle cx="45" cy="15" r="4" stroke="#667eea" strokeWidth="2.5" fill="none" />
            <circle cx="15" cy="45" r="4" stroke="#667eea" strokeWidth="2.5" fill="none" />
            <circle cx="45" cy="45" r="4" stroke="#667eea" strokeWidth="2.5" fill="none" />
            <circle cx="30" cy="30" r="4" fill="#667eea" />
            <line x1="19" y1="15" x2="26" y2="30" stroke="#667eea" strokeWidth="2" />
            <line x1="41" y1="15" x2="34" y2="30" stroke="#667eea" strokeWidth="2" />
            <line x1="19" y1="45" x2="26" y2="30" stroke="#667eea" strokeWidth="2" />
            <line x1="41" y1="45" x2="34" y2="30" stroke="#667eea" strokeWidth="2" />
          </svg>
        </div>
        <h2>Vector Database</h2>
        <p className="card-description">
          The world's fastest vector database for AI applications
        </p>
        <div className="feature-list">
          <div className="feature-item">
            <span className="feature-icon">✓</span>
            <span>RAG Content Retrieval</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">✓</span>
            <span>Semantic Search</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">✓</span>
            <span>LLM Memory</span>
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
        <VectorDatabaseArchitectureModal onClose={() => setIsModalOpen(false)} />
      )}
    </>
  );
}
