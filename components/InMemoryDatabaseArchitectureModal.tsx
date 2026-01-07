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
    title: "IN-MEMORY DATABASE",
    subtitle: "The fastest apps run on in-memory databases",
    content: [
      {
        type: "grid",
        gridItems: [
          {
            title: "What this solution allows you to do",
            description:
              "→ Improve application performance\n→ Increase scalability\n→ Reduce lag in sessions\n→ Real-time data processing\n→ Identify fraud in real-time\n→ More response user experiences\n→ Reduce traditional database load",
            icon: "",
          },
          {
            title: "What features set us apart",
            description:
              "🔀 Multi-modality - Data structures like JSON, streams and sorted sets for more flexibility than other IMDBs\n\n💎 Durability - Supports both RDB snapshotting and AOF for durability on every write\n\n🔍 Redis Query Engine - Easily access and transform data fast\n\n📦 Redis Flex - Store 5X more data so the last 5 days of data is fast—rather than just the last day of data\n\n🔄 Active-Active - Provides the highest availability on the market with 99.999% uptime",
            icon: "",
          },
        ],
      },
      {
        type: "text",
        text: "Redis can be used as an in-memory:",
      },
      {
        type: "grid",
        gridItems: [
          {
            title: "Document database",
            description: "Store and query JSON documents with flexible schemas and native JSON support",
            icon: "",
          },
          {
            title: "Feature store",
            description: "Serve ML features in real-time with sub-millisecond latency for model inference",
            icon: "",
          },
          {
            title: "Time series database",
            description: "Capture and analyze time-stamped data for IoT, monitoring, and analytics",
            icon: "",
          },
        ],
      },
    ],
  },
  {
    title: "TECHNICAL IMPLEMENTATION",
    subtitle: "Document database",
    content: [
      {
        type: "text",
        text: "A document database is a NoSQL database that stores, manages, and retrieves semi-structured data, usually in JSON format. Documents can include fields, arrays, and nested objects.",
      },
      {
        type: "text",
        text: "How it works",
      },
      {
        type: "list",
        items: [
          "1. When a client sends a request to the app, a response within 100 millisecond is guaranteed.",
          "2. The app requests data from Redis as the document database. Its built-in Redis Query Engine retrieves it in under 10 milliseconds, and the app returns the response to the client for a fluid UX.",
        ],
      },
      {
        type: "image",
        imageSrc: "/cache/document-db.png",
        imageAlt: "Document database architecture diagram showing client requests, application, and Redis document database flow",
      },
    ],
  },
  {
    title: "TECHNICAL IMPLEMENTATION",
    subtitle: "Feature store",
    content: [
      {
        type: "text",
        text: "A Feature Store stores and serves features—variables or derived values used in machine learning models. These features make real-time inferencing possible and keep training data and predictions consistent.",
      },
      {
        type: "text",
        text: "How it works",
      },
      {
        type: "list",
        items: [
          "1. Raw data is ingested from batch systems and real-time streaming platforms.",
          "2. Feature engineering pipelines turn that raw data into useful features.",
          "3. Those features are stored in offline and online feature stores, synched through a feature registry.",
          "4. During inference, the model retrieves real-time features from the online store to make predictions instantly.",
          "5. The system is monitored for feature drift and performance to ensure accuracy and reliability.",
        ],
      },
      {
        type: "image",
        imageSrc: "/cache/feature-store.png",
        imageAlt: "Feature store architecture diagram showing streaming and batch data flow through feature engineering to online and offline stores",
      },
    ],
  },
  {
    title: "TECHNICAL IMPLEMENTATION",
    subtitle: "Time series database",
    content: [
      {
        type: "text",
        text: "A time series database captures, stores, and organizes data points recorded over time, each linked to a specific timestamp.\n\nExamples of data points include stock prices, CPU usage metrics, and IoT sensor readings.",
      },
      {
        type: "text",
        text: "How it works",
      },
      {
        type: "list",
        items: [
          "1. Redis stores data streams and automatically distributes and balances them for sub-millisecond response times, no matter where users or apps are located.",
          "2. Apps can use the Redis Query Engine for fast access to time series data with specialized query and search functions.",
        ],
      },
      {
        type: "image",
        imageSrc: "/cache/time-series.png",
        imageAlt: "Time series database architecture diagram showing app/infra metrics, IoT metrics, and other time series data feeding into Redis",
      },
    ],
  },
];

interface InMemoryDatabaseArchitectureModalProps {
  onClose: () => void;
}

export default function InMemoryDatabaseArchitectureModal({ onClose }: InMemoryDatabaseArchitectureModalProps) {
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
          <h2>In-Memory Database Architecture</h2>
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
