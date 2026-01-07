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
    title: "The world's fastest vector database",
    subtitle: "VECTOR DATABASE",
    content: [
      {
        type: "twoColumns",
        left: {
          type: "image",
          imageSrc: "/cache/vector-db-chart.png",
          imageAlt:
            "Vector database performance benchmark chart showing Redis 7.4 with the highest throughput speedup factor compared to other vector databases like Weaviate, MemoryStore, Milvus, Amazon Aurora, Quadrant, MongoDB Atlas, and Opensearch for glove-100-angular dataset",
        },
        right: {
          type: "grid",
          gridItems: [
            {
              title: "What this solution allows you to do",
              description:
                "→ Power fast RAG for GenAI apps like chatbots and agents\n→ Search for semantically similar data\n→ Work with unstructured data like images and video",
              icon: "",
            },
            {
              title: "What features set us apart",
              description:
                "Performance\nFor real-time AI apps like chatbots and agents, don't make users wait.\n\nHybrid search\nSearch across semantic meaning and exact match to improve quality of results.\n\nVector flexibility\nUse any embedding model, high-dimension vectors, and multiple search types.\n\nGenAI ecosystem integrations\nDevs can build faster whether you use LangChain, LlamaIndex, and many others.\n\nGlobal scale\nTrusted by the world's largest organizations for a billion vectors or more.\n\nBuilt on Redis\nGet the simplicity and flexibility you know from the world's most loved database.",
              icon: "",
            },
          ],
        },
      },
      {
        type: "text",
        text: "How vector database can be used",
      },
      {
        type: "grid",
        gridItems: [
          {
            title: "RAG content retrieval",
            description: "",
            icon: "",
          },
          {
            title: "Semantic caching",
            description: "",
            icon: "",
          },
          {
            title: "Semantic routing",
            description: "",
            icon: "",
          },
          {
            title: "LLM short-term memory",
            description: "",
            icon: "",
          },
          {
            title: "LLM long-term memory",
            description: "",
            icon: "",
          },
        ],
      },
    ],
  },
  {
    title: "RAG",
    subtitle: "TECHNICAL IMPLEMENTATION",
    content: [
      {
        type: "text",
        text: "Retrieval-augmented generation (RAG) is a pattern where any and all related content is retrieved from a trusted data source, augmented with a user request, and sent to an LLM to generate a response.",
      },
      {
        type: "text",
        text: "How it works",
      },
      {
        type: "list",
        items: [
          "1. A user asks a question.",
          "2. The app retrieves the relevant document or chunk from a document store.",
          "3. The user question and relevant document or chunk are sent to an LLM.",
          "4. The LLM generates an answer using its general knowledge and the specific information from the retrieval step.",
          "5. The app returns the answer to the user.",
        ],
      },
      {
        type: "image",
        imageSrc: "/cache/rag.png",
        imageAlt:
          "RAG diagram showing Question flowing through Retrieval (accessing Documents to get Relevant document) to Augmented generation (LLM) which produces an Answer",
      },
    ],
  },
  {
    title: "Semantic caching",
    subtitle: "TECHNICAL IMPLEMENTATION",
    content: [
      {
        type: "text",
        text: "Semantic caching reduces the external calls to LLMs, saving money and decreasing app response times. It works well for retrieval-augmented generation (RAG) for chatbots and AI agents by using vector similarity to store and retrieve responses tied to semantically-related requests.",
      },
      {
        type: "text",
        text: "How it works",
      },
      {
        type: "list",
        items: [
          "1. User asks a question",
          "2. The app converts it into an embedding",
          "3. Redis searches for similar questions",
          "4. If there's a hit, the cache returns it",
          "5. If not, the app asks an LLM to generate an answer",
          "6. The app returns the response to the user",
        ],
      },
      {
        type: "image",
        imageSrc: "/cache/semantic.png",
        imageAlt:
          "Semantic caching diagram showing User interacting with App, which checks Redis cache for similar queries and responds from cache if hit, or invokes LLM API if cache miss and saves LLM response back to cache",
      },
    ],
  },
  {
    title: "Semantic routing",
    subtitle: "TECHNICAL IMPLEMENTATION",
    content: [
      {
        type: "text",
        text: "Semantic routing uses AI to route user queries to the right service, model, or endpoint based on their intent and context. Unlike rule-based systems, it relies on GenAI to understand the meaning behind requests, enabling more accurate and efficient routing.",
      },
      {
        type: "text",
        text: "How it works",
      },
      {
        type: "list",
        items: [
          "1. The user sends a query, which is passed to the system for processing",
          "2. The query is analyzed by an embedding model to understand its semantic intent and context",
          "3. The semantic router directs the query to the optimal route:\n   a. A specific model for further processing\n   b. An agent to handle the query\n   c. A default response if applicable\n   d. Escalation to a human for manual handling, if needed",
          "4. Valid queries go through the RAG pipeline to generate a response",
          "5. The final response is sent back to the user",
        ],
      },
      {
        type: "image",
        imageSrc: "/cache/semantic-routing.png",
        imageAlt:
          "Semantic routing diagram showing User query flowing through Embedding model to Semantic router for Optimal route selection, which directs to Model(s), Agent, Default response, or Escalation to human, with responses sent back to User",
      },
    ],
  },
  {
    title: "LLM short-term memory",
    subtitle: "TECHNICAL IMPLEMENTATION",
    content: [
      {
        type: "text",
        text: "Short-term memory, also known as agent state, is similar to a computer's RAM, temporarily holding information relevant to an ongoing task or conversation. This working memory exists only briefly within a conversation thread and is typically limited due to the constrained context windows of large language models (LLMs) or the need to minimize less relevant information.",
      },
      {
        type: "text",
        text: "How it works",
      },
      {
        type: "list",
        items: [
          "1. User makes a request to an agent.",
          "2. The agent generates a plan.",
          "3. The agent calls tools or an LLM for information.",
          "4. The agent stores information in short-term memory.",
          "5. Some information will be stored for long-term, while other info will only be saved temporarily.",
        ],
      },
      {
        type: "image",
        imageSrc: "/cache/llm-short-term.png",
        imageAlt:
          "LLM short-term memory diagram showing User interacting with AI agent, which accesses Short-term memory, Long-term memory, LLM, and various Tools",
      },
    ],
  },
  {
    title: "LLM long-term memory",
    subtitle: "TECHNICAL IMPLEMENTATION",
    content: [
      {
        type: "text",
        text: "Long-term memory stores information AI agents can use later, while short-term memory only keeps what's needed within a given task or conversation.",
      },
      {
        type: "text",
        text: "How it works",
      },
      {
        type: "list",
        items: [
          "1. User makes a request to an agent.",
          "2. The agent generates a plan.",
          "3. The agent calls tools or an LLM for info.",
          "4. The agent extracts, summarizes, vectorizes, and stores relevant info in short-term memory.",
          "5. The agent pulls relevant info from past queries to add context to the LLM call.",
          "6. Some info is stored long-term, while other data is only saved temporarily.",
        ],
      },
      {
        type: "image",
        imageSrc: "/cache/llm-long-term.png",
        imageAlt:
          "LLM long-term memory diagram showing User interacting with AI agent, which accesses Short-term memory, Long-term memory, LLM, and various Tools",
      },
    ],
  },
];

interface VectorDatabaseArchitectureModalProps {
  onClose: () => void;
}

export default function VectorDatabaseArchitectureModal({ onClose }: VectorDatabaseArchitectureModalProps) {
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
          <h2>Vector Database Architecture</h2>
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

                  if (column.type === 'image') {
                    return (
                      <div className="slide-image-container">
                        <img
                          src={column.imageSrc}
                          alt={column.imageAlt || 'Slide image'}
                          className="slide-image"
                        />
                      </div>
                    );
                  }

                  if (column.type === 'grid') {
                    return (
                      <div className="slide-grid">
                        {column.gridItems?.map((item, itemIdx) => (
                          <div key={itemIdx} className="slide-grid-item">
                            {item.icon && <div className="slide-grid-icon">{item.icon}</div>}
                            <h3 className="slide-grid-title">{item.title}</h3>
                            <p className="slide-grid-description">{item.description}</p>
                          </div>
                        ))}
                      </div>
                    );
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
