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
    title: "Fluid UX runs on world-class session management",
    subtitle: "SESSION MANAGEMENT",
    content: [
      {
        type: "grid",
        gridItems: [
          {
            title: "What you're trying to do",
            description:
              "→ More responsive user sessions\n→ Increase scalability\n→ Better personalization & recommendations\n→ Faster matchmaking\n→ Unify customer experience",
            icon: "",
          },
          {
            title: "How we help",
            description:
              "In-memory speed\nFast, scalable session storage and retrieval.\n\nAdvanced data structures\nSupport for JSON to model hierarchy and advanced features like hash field expiration.\n\nRedis Query Engine\nSearch, filter, and sort session data fast, with advanced querying.\n\nGlobal & highly resilient\nPower stateful session sharing across microservices and regions with the highest availability on the market.\n\nHyperscale layer\nRedis cluster manager and proxy scales the Redis engine to any amount of users and data.",
            icon: "",
          },
        ],
      },
      {
        type: "text",
        text: "How Redis session management can be used",
      },
      {
        type: "grid",
        gridItems: [
          {
            title: "Session storage",
            description: "",
            icon: "",
          },
          {
            title: "Authentication token storage",
            description: "",
            icon: "",
          },
          {
            title: "User profile storage",
            description: "",
            icon: "",
          },
          {
            title: "Rate limiting",
            description: "",
            icon: "",
          },
        ],
      },
    ],
  },
  {
    title: "Session storage",
    subtitle: "TECHNICAL IMPLEMENTATION",
    content: [
      {
        type: "text",
        text: "Session storage is a mechanism used to store state and data related to a user or system's interaction with an app during a given period of time.",
      },
      {
        type: "text",
        text: "How it works",
      },
      {
        type: "list",
        items: [
          "1. When a user logs into an app, a user session is created and data is loaded from an RDBMS into the session store in Redis",
          "2. When a user interacts with the app, the app fetches and updates session data, such as form input data, content drafts, recent actions, shopping cart items, and more from the session store in Redis",
        ],
      },
      {
        type: "image",
        imageSrc: "/cache/session-storage.png",
        imageAlt:
          "Session storage diagram showing User interacting with Web app, which loads data from RDBMS and stores/retrieves session data from Redis session store",
      },
    ],
  },
  {
    title: "Authentication token storage",
    subtitle: "TECHNICAL IMPLEMENTATION",
    content: [
      {
        type: "text",
        text: "Authentication token storage is a mechanism for storing an auth token that authorizes a user to access an application. An auth token is like a wristband you get at an event that gives you access without having to show your ID repeatedly.",
      },
      {
        type: "text",
        text: "How it works",
      },
      {
        type: "list",
        items: [
          "1. A user enters their credentials.",
          "2. An identity provider (e.g. authentication server) validates the user credentials and generates an authentication token.",
          "3. The authentication token is stored in Redis for the duration of a user session. The app and all its components can consult the token to recognize the user as validated.",
        ],
      },
      {
        type: "image",
        imageSrc: "/cache/authentication-token.png",
        imageAlt:
          "Authentication token storage diagram showing Client connecting to API Gateway or app server, which validates with Identity provider and stores token in Redis",
      },
    ],
  },
  {
    title: "User profile storage",
    subtitle: "TECHNICAL IMPLEMENTATION",
    content: [
      {
        type: "text",
        text: "User profile storage is when user profiles are stored, managed, and can be made accessible for use by an application. User profiles contain user data, including personal information, settings and preferences, account status, and activity history.",
      },
      {
        type: "text",
        text: "How it works",
      },
      {
        type: "list",
        items: [
          "1. User profile data is aggregated from multiple databases or data sources to make the data fast and easily accessible.",
          "2. When a user logs in to an application, the app fetches the profile from the user profile store. This user profile is often compiled from data spanning various backend databases. As the user interacts with the application, any updates are written to their user profile.",
          "3. When the user completes their session, updates to the user profile storage can be written to databases.",
        ],
      },
      {
        type: "image",
        imageSrc: "/cache/user-profile.png",
        imageAlt:
          "User profile storage diagram showing User interacting with Web app, which connects to User profile store in Redis, which aggregates data from multiple databases (Accounts, Activity, etc.)",
      },
    ],
  },
];

interface SessionManagementArchitectureModalProps {
  onClose: () => void;
}

export default function SessionManagementArchitectureModal({ onClose }: SessionManagementArchitectureModalProps) {
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
          <h2>Session Management Architecture</h2>
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
