'use client';

import Link from 'next/link';

export default function EcommerceChatCard() {
  return (
    <Link href="/ecommerce-chat" style={{ textDecoration: 'none' }}>
      <div className="card active-card demo-card-compact" style={{ cursor: 'pointer' }}>
        <div className="active-badge">Active Demo</div>

        <div className="card-icon">
          <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Shopping cart */}
            <path d="M8 10h6l4 24h22l4-16H16" stroke="#dc382d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <circle cx="24" cy="38" r="2.5" fill="#dc382d"/>
            <circle cx="38" cy="38" r="2.5" fill="#dc382d"/>
            {/* Chat bubble */}
            <rect x="32" y="8" width="20" height="14" rx="4" stroke="#dc382d" strokeWidth="2" fill="none"/>
            <path d="M36 34l-4 4v-4" stroke="#dc382d" strokeWidth="2" strokeLinecap="round" fill="none"/>
            {/* Dots in bubble */}
            <circle cx="38" cy="15" r="1.5" fill="#dc382d"/>
            <circle cx="43" cy="15" r="1.5" fill="#dc382d"/>
            <circle cx="48" cy="15" r="1.5" fill="#dc382d"/>
          </svg>
        </div>

        <h2>E-Commerce ChatBot</h2>
        <p className="card-description">
          AI shopping assistant powered by Redis Cloud Context Retriever and LangGraph
        </p>

        <div className="feature-list">
          <div className="feature-item">
            <span className="feature-icon">✓</span>
            <span>6 auto-generated MCP tools</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">✓</span>
            <span>Context Retriever search</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">✓</span>
            <span>GPT-4o ReAct agent</span>
          </div>
        </div>

        <button className="demo-button">Try Demo</button>
      </div>
    </Link>
  );
}
