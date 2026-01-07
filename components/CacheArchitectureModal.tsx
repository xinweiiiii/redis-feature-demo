'use client';

import { useState, useEffect } from 'react';

interface ContentSection {
  type: 'list' | 'grid' | 'text' | 'image' | 'twoColumns';
  items?: string[];
  gridItems?: { title: string; description: string; icon?: string }[];
  text?: string;
  imageSrc?: string;
  imageAlt?: string;
  left?: Omit<ContentSection, 'twoColumns' | 'left' | 'right'>;
  right?: Omit<ContentSection, 'twoColumns' | 'left' | 'right'>;
}

interface Slide {
  title: string;
  subtitle?: string;
  content: ContentSection[];
}

const slides: Slide[] = [
  {
    title: "CACHING",
    subtitle: "The fastest apps start with the world's only feature-rich modern cache",
    content: [
      {
        type: "grid",
        gridItems: [
          {
            title: "Caching with Redis you can",
            description:
              "→ Improve app performance\n→ Increase scalability\n→ Speed up microservices\n→ Modernize your app fast\n→ Build faster, less expensive API-based apps\n→ Unify customer experience",
            icon: "",
          },
          {
            title: "Why choose Redis as a caching solution",
            description:
              "🔄 Unified data model - Cache it all: key-value, document, vector, geospatial, time series, and more\n\n🔍 Redis Query Engine - Lets customers to easily index, search, and query data in their cache\n\n🔄 Active-Active - Provides the highest availability on the market with 99.999% uptime\n\n💰 Redis Flex and multi-tenancy - Allow customers to cache with incredible cost-efficiency\n\n🔗 Redis Data Integration - Automatically keeps your database and cache in sync to eliminate cache misses and stale data—without writing code\n\n👥 Redis Insight and official client libraries - Make Redis the easiest and most complete caching solution",
            icon: "",
          },
        ],
      },
      {
        type: "text",
        text: "How you can cache with Redis",
      },
      {
        type: "grid",
        gridItems: [
          {
            title: "Cache-aside",
            description: "Application manages cache and database separately, loading data into cache on demand",
            icon: "",
          },
          {
            title: "Cache prefetching",
            description: "Proactively load data into cache before it's requested to eliminate latency",
            icon: "",
          },
          {
            title: "Query caching",
            description: "Store query results to avoid expensive database operations on repeated requests",
            icon: "",
          },
        ],
      },
    ],
  },
  {
    title: "Cache-aside",
    subtitle: "TECHNICAL IMPLEMENTATION",
    content: [
      {
        type: "text",
        text: "Cache-aside (aka lazy loading) is the most common way to use Redis as a cache.\n\nWhen using a cache-aside pattern the app directly communicates with both the cache and primary data source (DB, API, LLM, etc.), and is responsible for writing data to the cache as needed.",
      },
      {
        type: "text",
        text: "How it works",
      },
      {
        type: "list",
        items: [
          "1. The application first looks into the cache to retrieve the data. If data is found (cache hit), the cache delivers the data to the application with < 1 ms latency",
          "2. If data is not found (cache miss), the application then retrieves the data from the database (or API, LLM, or anything else that needs to be sped up) with lower latency. The application then writes data to the cache for subsequent requests.",
        ],
      },
      {
        type: "text",
        text: "Data is loaded into the cache only when necessary",
      },
      {
        type: "image",
        imageSrc: "/cache/cache-aside.png",
        imageAlt: "Cache-aside pattern diagram showing Application, Database, and Cache with numbered flow: 1. Application checks Cache, 2. On miss, Application queries Database and writes to Cache",
      },
    ],
  },
  {
    title: "Cache prefetching",
    subtitle: "TECHNICAL IMPLEMENTATION",
    content: [
      {
        type: "text",
        text: "Cache prefetching is a caching strategy where data is proactively loaded into the cache before it is requested by the application. Unlike cache-aside, which loads data on demand (after a cache miss), prefetching ensures data is available in the cache ahead of time.",
      },
      {
        type: "text",
        text: "How it works",
      },
      {
        type: "list",
        items: [
          "1. RDI initially populates Redis with data from your DB.",
          "2. A change data capture (CDC) collector keeps track of any changed data written to your database.",
          "3. RDI stream processor translates the data to the preferred data model and types.",
          "4. The data is ingested into Redis so your app runs faster and on the latest data.",
        ],
      },
      {
        type: "image",
        imageSrc: "/cache/cache-prefetching.png",
        imageAlt: "Cache prefetching diagram showing App writing to Database, CDC collector and Stream processor (RDI) capturing changes and updating Redis Cache, then App reading from Redis",
      },
    ],
  },
  {
    title: "API Gateway caching",
    subtitle: "TECHNICAL IMPLEMENTATION",
    content: [
      {
        type: "text",
        text: "Keep microservices apps fast and distribute shared data efficiently by caching it at the API gateway. This includes session details (user ID, preferences, etc.) and authentication data (tokens, permissions, access status, etc.), making it instantly available to all services.",
      },
      {
        type: "text",
        text: "How it works",
      },
      {
        type: "list",
        items: [
          "1. A user logs in with their credentials.",
          "2. Two tokens are created with user authentication and session data. The API gateway caches these in Redis.",
          "3. The API gateway manages calls from individual microservices. When a request is made, the API gateway retrieves tokens and session data cached in Redis to validate requests and enforce access control.",
        ],
      },
      {
        type: "image",
        imageSrc: "/cache/api-caching.png",
        imageAlt: "API Gateway caching diagram showing Client login flow through API Gateway to Redis cache and microservices",
      },
    ],
  },
];

interface CacheArchitectureModalProps {
  onClose: () => void;
}

export default function CacheArchitectureModal({ onClose }: CacheArchitectureModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        nextSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        prevSlide();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide]);

  // Touch swipe handlers
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }
  };

  const slide = slides[currentSlide];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content architecture-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Cache Architecture Patterns</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="slide-deck-header">
          <div className="slide-counter">
            Slide {currentSlide + 1} of {slides.length}
          </div>
        </div>

        <div
          className="modal-body"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div className="slide-title-section">
            <h1 className="slide-title">{slide.title}</h1>
            {slide.subtitle && <p className="slide-subtitle">{slide.subtitle}</p>}
          </div>

          <div className="slide-body">
            {slide.content.map((section, idx) => {
              if (section.type === 'text') {
                return (
                  <p key={idx} className="slide-text">
                    {section.text}
                  </p>
                );
              }

              if (section.type === 'image') {
                return (
                  <div key={idx} className="slide-image-container">
                    <img
                      src={section.imageSrc}
                      alt={section.imageAlt || 'Slide image'}
                      className="slide-image"
                    />
                  </div>
                );
              }

              if (section.type === 'list') {
                return (
                  <ul key={idx} className="slide-list">
                    {section.items?.map((item, itemIdx) => (
                      <li key={itemIdx}>{item}</li>
                    ))}
                  </ul>
                );
              }

              if (section.type === 'grid') {
                return (
                  <div key={idx} className="slide-grid">
                    {section.gridItems?.map((item, itemIdx) => (
                      <div key={itemIdx} className="slide-grid-item">
                        {item.icon && <div className="slide-grid-icon">{item.icon}</div>}
                        <h3 className="slide-grid-title">{item.title}</h3>
                        <p className="slide-grid-description">{item.description}</p>
                      </div>
                    ))}
                  </div>
                );
              }

              if (section.type === 'twoColumns') {
                const renderColumn = (column: ContentSection | undefined) => {
                  if (!column) return null;

                  if (column.type === 'list') {
                    return (
                      <ul className="slide-list">
                        {column.items?.map((item, itemIdx) => (
                          <li key={itemIdx}>{item}</li>
                        ))}
                      </ul>
                    );
                  }

                  if (column.type === 'text') {
                    return <p className="slide-text">{column.text}</p>;
                  }

                  return null;
                };

                return (
                  <div key={idx} className="slide-two-columns">
                    <div>{renderColumn(section.left)}</div>
                    <div>{renderColumn(section.right)}</div>
                  </div>
                );
              }

              return null;
            })}
          </div>
        </div>

        <div className="slide-navigation">
          <button
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className="nav-button"
          >
            ← Previous
          </button>

          <div className="slide-dots">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goToSlide(idx)}
                className={`slide-dot ${idx === currentSlide ? 'active' : ''}`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          <button
            onClick={nextSlide}
            disabled={currentSlide === slides.length - 1}
            className="nav-button"
          >
            Next →
          </button>
        </div>

        <div className="keyboard-hint">
          Use ← → arrow keys or swipe to navigate
        </div>
      </div>
    </div>
  );
}
