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
    title: "Query, Sorting and Analytics",
    subtitle: "Unlock the power of your data with query, sorting, and analysis",
    content: [
      {
        type: "grid",
        gridItems: [
          {
            title: "What you're trying to do",
            description:
              "→ Power fast business analytics\n→ Provide real-time search to your app's users\n→ Enable fast location-based queries\n→ Quickly and efficiently match users with real-time matchmaking",
            icon: "",
          },
          {
            title: "How we help",
            description:
              "Performance\nSearch, query and analyze your data in real-time.\n\nScalability\nMaintain consistent search performance at any scale.\n\nRedis Query Engine\nIndex, aggregate, search, and query popular data types like JSON and vector.\n\nProbabilistic data types\nHandle large-scale data with approximate for improved memory efficiency.\n\nGeospatial indexing\nQuery and filter data based on geographic locations.\n\nRDI\nSeamlessly sync data from your database into Redis to enable real-time query, sorting, and analysis.",
            icon: "",
          },
        ],
      },
      {
        type: "text",
        text: "How this solution can be used",
      },
      {
        type: "grid",
        gridItems: [
          {
            title: "Deduplication",
            description: "",
            icon: "",
          },
          {
            title: "Full-text search",
            description: "",
            icon: "",
          },
          {
            title: "Geospatial search",
            description: "",
            icon: "",
          },
          {
            title: "Query",
            description: "",
            icon: "",
          },
          {
            title: "Probabilistic",
            description: "",
            icon: "",
          },
          {
            title: "Secondary indexing",
            description: "",
            icon: "",
          },
        ],
      },
    ],
  },
  {
    title: "Deduplication",
    subtitle: "TECHNICAL IMPLEMENTATION",
    content: [
      {
        type: "text",
        text: "Data deduplication is a process that eliminates redundant copies of data and reduces storage overhead. Deduplication techniques ensure that only one unique value is stored to improve efficiency, reduce storage costs, prevent redundant processing, and enhance system performance by eliminating duplicate data.",
      },
      {
        type: "text",
        text: "How it works",
      },
      {
        type: "list",
        items: [
          "1. An application attempts to write data to a database.",
          "2. Deduplication check (via hash of the data) stored in a Redis set OR using probabilistic data types:\n   a. If data already exists in Redis, it is a duplicate and the write cannot go through.\n   b. If the data does not exist in Redis, it is not a duplicate and the write can go through to the database.",
        ],
      },
      {
        type: "image",
        imageSrc: "/cache/deduplication.png",
        imageAlt:
          "Deduplication pattern diagram showing App sending data to Redis for deduplication check, with paths for duplicate (deny) and non-duplicate (allow to Database)",
      },
    ],
  },
  {
    title: "Full-text search",
    subtitle: "TECHNICAL IMPLEMENTATION",
    content: [
      {
        type: "text",
        text: "Full-text search is an information retrieval technique that searches documents based on keywords or phrases within the entire text. Unlike traditional search, it considers context, synonyms, and word proximity for more relevant results.",
      },
      {
        type: "text",
        text: "How it works",
      },
      {
        type: "list",
        items: [
          "1. Data from primary databases or applications is indexed and stored in Redis or Redis functions as a standalone in-memory search engine.",
          "2. A user or system submits a full-text search query, which is processed directly within Redis.",
          "3. The Redis Query Engine executes the query, leveraging inverted indexes to deliver results instantly.",
        ],
      },
      {
        type: "image",
        imageSrc: "/cache/full-text-search.png",
        imageAlt:
          "Full-text search diagram showing Database indexed into Redis, User submits query to Redis, and Redis Query Engine returns search results",
      },
    ],
  },
  {
    title: "Geospatial search",
    subtitle: "TECHNICAL IMPLEMENTATION",
    content: [
      {
        type: "text",
        text: "Geospatial search allows querying and filtering of data based on geographic locations. It enables finding nearby places or objects using coordinates (latitude and longitude).",
      },
      {
        type: "text",
        text: "How it works",
      },
      {
        type: "list",
        items: [
          "1. Apps add locations to a Redis geospatial index",
          "2. Redis performs queries based geolocation data\n   a. Retrieve all values within a geometric shape drawn on a map\n   b. Calculates the distance between two stored locations\n   c. Retrieve all values within a specific radius",
        ],
      },
      {
        type: "image",
        imageSrc: "/cache/geospatial.png",
        imageAlt:
          "Geospatial search diagram showing User querying Redis, which performs different types of location-based searches on a map",
      },
    ],
  },
  {
    title: "Query",
    subtitle: "TECHNICAL IMPLEMENTATION",
    content: [
      {
        type: "text",
        text: "A query is a request to retrieve data from a data source. Queries are typically formulated using a specific syntax, allowing users to specify the desired data based on fields, conditions, and relationships.",
      },
      {
        type: "text",
        text: "How it works",
      },
      {
        type: "list",
        items: [
          "1. Data from primary DBs or applications is cached (ideally prefetched using RDI) into Redis or Redis acts as a standalone in-memory DB for an app.",
          "2. Redis hashes the data to create secondary indexes, enabling relationships between records and allowing fast queries.",
          "3. A user or system makes a query request which is processed in Redis.",
          "4. The Redis Query Engine processes the request and delivers the queried data in real-time.\n   ○ The Redis Query Engine supports multi field queries, numeric filters and range queries, complex boolean queries, query clauses, and aggregation.",
        ],
      },
      {
        type: "image",
        imageSrc: "/cache/query.png",
        imageAlt:
          "Query diagram showing Database cached into Redis, App makes query to Redis, and Redis Query Engine returns results",
      },
    ],
  },
  {
    title: "Probabilistic",
    subtitle: "TECHNICAL IMPLEMENTATION",
    content: [
      {
        type: "text",
        text: "Probabilistic data types in Redis are data structures that provide approximations of statistics such as counts, frequencies, and rankings rather than precise values. They provide memory-efficient ways to handle large-scale data with approximate (vs exact) results.",
      },
      {
        type: "text",
        text: "How it works",
      },
      {
        type: "list",
        items: [
          "1. Apps or users provide data inputs.",
          "2. Redis hashes the data into a fixed-length number or bit pattern and then stores the hashed data in specialized data structures\n   ○ Bloom Filters for membership checks\n   ○ HyperLogLog for unique counts\n   ○ Count-Min Sketch for frequency tracking\n   ○ Cuckoo Filters for membership with deletions",
          "3. When checking for probability, Redis rehashes your input and checks its internal storage to make estimates for membership, counts, frequency, etc.",
        ],
      },
      {
        type: "image",
        imageSrc: "/cache/probabilistic.png",
        imageAlt:
          "Probabilistic diagram showing Input hashed and stored in Redis with various data structures (Bloom Filter, HyperLogLog, Count-Min Sketch, Cuckoo Filter, Top-K), then probabilistic check returns results",
      },
    ],
  },
  {
    title: "Secondary indexing",
    subtitle: "TECHNICAL IMPLEMENTATION",
    content: [
      {
        type: "text",
        text: "Secondary indexing makes it easy to search Redis using fields other than the key. Instead of scanning the entire dataset, it allows for fast searches, sorting, and filtering. Without secondary indexes, the database must scan every row in a table to find matching data, making queries slow—especially with large datasets.",
      },
      {
        type: "text",
        text: "How it works",
      },
      {
        type: "list",
        items: [
          "1. Data from the primary database is stored in Redis. Redis hashes this data to create secondary indexes, linking records and making real-time queries fast—without relying on slower disk-based databases.",
          "2. Redis searches data using secondary key queries, making it easy to find records by additional attributes.",
          "3. Redis queries data held in secondary keys and returns accurate results associated with that record in real-time.",
        ],
      },
      {
        type: "image",
        imageSrc: "/cache/secondary-indexing.png",
        imageAlt:
          "Secondary indexing diagram showing customer database table, secondary key query process through Redis creating secondary indexes and returning results",
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
