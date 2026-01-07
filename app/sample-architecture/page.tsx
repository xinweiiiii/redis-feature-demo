'use client';

import Link from 'next/link';
import CacheArchitectureCard from '@/components/CacheArchitectureCard';
import InMemoryDatabaseArchitectureCard from '@/components/InMemoryDatabaseArchitectureCard';
import MessageInterserviceArchitectureCard from '@/components/MessageInterserviceArchitectureCard';

export default function SampleArchitecturePage() {
  return (
    <div className="container">
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <Link href="/" style={{ display: 'inline-block', marginBottom: '1rem', color: 'var(--accent-color)', textDecoration: 'none' }}>
          ← Back to Home
        </Link>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Redis Enterprise Sample Architecture</h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
          Explore real-world architecture patterns and reference implementations
        </p>
      </div>

      <div className="cards-grid">
        <CacheArchitectureCard />
        <InMemoryDatabaseArchitectureCard />
        <MessageInterserviceArchitectureCard />
      </div>
    </div>
  );
}
