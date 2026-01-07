'use client';

import { useState } from 'react';
import MessageInterserviceArchitectureModal from './MessageInterserviceArchitectureModal';

export default function MessageInterserviceArchitectureCard() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="card demo-card-compact" onClick={() => setIsModalOpen(true)}>
        <div className="card-icon">
          <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="15" cy="30" r="6" stroke="#f093fb" strokeWidth="2.5" fill="none" />
            <circle cx="45" cy="30" r="6" stroke="#f093fb" strokeWidth="2.5" fill="none" />
            <circle cx="30" cy="15" r="6" stroke="#f093fb" strokeWidth="2.5" fill="none" />
            <circle cx="30" cy="45" r="6" stroke="#f093fb" strokeWidth="2.5" fill="none" />
            <path d="M20 28 L25 28" stroke="#f093fb" strokeWidth="2" strokeLinecap="round" />
            <path d="M35 28 L40 28" stroke="#f093fb" strokeWidth="2" strokeLinecap="round" />
            <path d="M28 20 L28 25" stroke="#f093fb" strokeWidth="2" strokeLinecap="round" />
            <path d="M28 35 L28 40" stroke="#f093fb" strokeWidth="2" strokeLinecap="round" />
            <circle cx="30" cy="30" r="3" fill="#f093fb" />
          </svg>
        </div>
        <h2>Message & Interservice Communication</h2>
        <p className="card-description">
          Discover Redis patterns for message queues, pub/sub, and microservice communication
        </p>
        <div className="feature-list">
          <div className="feature-item">
            <span className="feature-icon">✓</span>
            <span>Pub/Sub Messaging</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">✓</span>
            <span>Stream Processing</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">✓</span>
            <span>Service Discovery</span>
          </div>
        </div>
        <button className="demo-button" onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); }}>
          View Architecture
        </button>
      </div>

      {isModalOpen && <MessageInterserviceArchitectureModal onClose={() => setIsModalOpen(false)} />}
    </>
  );
}
