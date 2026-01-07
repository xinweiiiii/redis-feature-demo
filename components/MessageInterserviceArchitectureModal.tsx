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
    title: "MESSAGE & INTERSERVICE COMMUNICATION",
    subtitle: "Building scalable microservice architectures",
    content: [
      {
        type: "grid",
        gridItems: [
          {
            title: "What this solution allows you to do",
            description:
              "→ Modernize your app fast\n\n→ Increase scalability\n\n→ Unify customer experiences\n\n→ Automate manual processes\n\n→ Drive engagement and revenue with personalization and recommendations",
            icon: "",
          },
          {
            title: "What features set us apart",
            description:
              "⏱️ High availability - Meet uptime requirements and avoid app downtime.\n\n💎 Durability & persistence - Append Only File (AOF) ensures little to no data loss on failure.\n\n📡 Redis Streams, Pub/Sub - Data types that help decouple services for greater flexibility.\n\n🔄 Multi-model data store - Supports diverse data types required for microservices.",
            icon: "",
          },
        ],
      },
      {
        type: "text",
        text: "How Redis messaging & interservice comms can be used",
      },
      {
        type: "grid",
        gridItems: [
          {
            title: "Redis Streams",
            description:
              "Durable message queues with consumer groups for distributed processing",
            icon: "",
          },
          {
            title: "Pub/Sub",
            description:
              "Real-time message broadcasting for event-driven architectures",
            icon: "",
          },
          {
            title: "Job queues",
            description:
              "Reliable background job processing with priority queues",
            icon: "",
          },
        ],
      },
    ],
  },
  {
    title: "TECHNICAL IMPLEMENTATION",
    subtitle: "Redis streams",
    content: [
      {
        type: "text",
        text: "A Redis stream is a data structure that acts like an append-only log but also implements several advanced operations such as message acknowledgment, consumer groups, and automatic message retention policies.",
      },
      {
        type: "text",
        text: "How it works",
      },
      {
        type: "list",
        items: [
          "1. Publisher sends messages to Redis Streams, where they are added to an immutable, ordered log.",
          "2. Consumers retrieve messages from the stream.",
          "3. If a consumer is part of a consumer group:\n   a. Messages are distributed across the group, with each message assigned to only one consumer.\n   b. Unread messages remain in the Pending Entries List (PEL) until acknowledged.\n   c. Consumers acknowledge processed messages, removing them from the PEL but not from the stream itself.",
          "4. Messages persist in Redis Streams until they are explicitly deleted.",
        ],
      },
      {
        type: "image",
        imageSrc: "/cache/redis-stream.png",
        imageAlt:
          "Redis Streams architecture diagram showing publishers, Redis streams with entries, consumer groups, and subscribers",
      },
    ],
  },
  {
    title: "TECHNICAL IMPLEMENTATION",
    subtitle: "Pub/Sub",
    content: [
      {
        type: "text",
        text: "Pub/Sub is short for Publish/Subscribe—a communication model through which a broker receives messages from a publisher and distributes them to one or more subscribers who then interpret them according to the needs of their particular use cases.",
      },
      {
        type: "text",
        text: "How it works",
      },
      {
        type: "list",
        items: [
          "1. Publisher sends message to topic.",
          "2. Broker routes message delivery to correct subscribers based on specific subscriptions to topics.",
          "3. Subscriber receives message from subscribed topics.",
        ],
      },
      {
        type: "image",
        imageSrc: "/cache/pubsub.png",
        imageAlt:
          "Pub/Sub architecture diagram showing publishers sending messages to topics through a broker, which routes to subscribers",
      },
    ],
  },
  {
    title: "TECHNICAL IMPLEMENTATION",
    subtitle: "Job Queue",
    content: [
      {
        type: "text",
        text: "A job queue is a system that helps manage and execute tasks that don't need to be processed immediately. Instead of handling a task right away—which could slow down the system or the user experience—the task is placed in a queue, where it waits until it's processed later.",
      },
      {
        type: "text",
        text: "How it works",
      },
      {
        type: "list",
        items: [
          "1. A producer adds a job to a Redis-based job queue.",
          "2. The job queue stores the job until a worker picks it up.This is a simplified example. Job queues can follow different models like FIFO (first in, first out), LIFO (last in, first out), or be based on priority or schedule. Redis can also store jobs as lists for coupling between producers and consumers, sets (no ordering), or streams for more complex queuing. ",
          "3. A worker retrieves the job, processes it, and removes it from the queue.",
        ],
      },
      {
        type: "image",
        imageSrc: "/cache/queue.png"
      },
    ],
  },
];

interface MessageInterserviceArchitectureModalProps {
  onClose: () => void;
}

export default function MessageInterserviceArchitectureModal({ onClose }: MessageInterserviceArchitectureModalProps) {
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
          <h2>Message & Interservice Communication Architecture</h2>
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
