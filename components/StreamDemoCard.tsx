'use client';

import { useState } from 'react';
import StreamDemoModal from './StreamDemoModal';

export default function StreamDemoCard() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="card active-card demo-card-compact" onClick={() => setIsModalOpen(true)}>
        <div className="active-badge">Active Demo</div>
        <div className="card-icon">
          <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Stream flow icon */}
            <path d="M 10 15 L 50 15" stroke="#dc382d" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 10 25 L 50 25" stroke="#dc382d" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 10 35 L 50 35" stroke="#dc382d" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 10 45 L 50 45" stroke="#dc382d" strokeWidth="2.5" strokeLinecap="round" />
            {/* Arrows */}
            <path d="M 45 15 L 50 15 L 47 12" stroke="#dc382d" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M 45 25 L 50 25 L 47 22" stroke="#dc382d" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M 45 35 L 50 35 L 47 32" stroke="#dc382d" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M 45 45 L 50 45 L 47 42" stroke="#dc382d" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            {/* Data points */}
            <circle cx="20" cy="15" r="2.5" fill="#dc382d" />
            <circle cx="30" cy="25" r="2.5" fill="#dc382d" />
            <circle cx="25" cy="35" r="2.5" fill="#dc382d" />
            <circle cx="35" cy="45" r="2.5" fill="#dc382d" />
          </svg>
        </div>
        <h2>Redis Streams</h2>
        <p className="card-description">
          Build real-time event streams with Redis Streams for message queuing and event sourcing
        </p>
        <div className="feature-list">
          <div className="feature-item">
            <span className="feature-icon">✓</span>
            <span>Event streaming</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">✓</span>
            <span>Consumer groups</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">✓</span>
            <span>Message acknowledgment</span>
          </div>
        </div>
        <button className="demo-button" onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); }}>
          Try Demo
        </button>
      </div>

      {isModalOpen && <StreamDemoModal onClose={() => setIsModalOpen(false)} />}
    </>
  );
}
