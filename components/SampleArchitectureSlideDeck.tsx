'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
    title: "Redis Enterprise Sample Architecture",
    subtitle: "Real-World Architecture Patterns and Reference Implementations",
    content: [
      {
        type: "grid",
        gridItems: [
          {
            title: "E-Commerce Platform",
            description:
              "- Session management for millions of users\n- Product catalog caching\n- Real-time inventory tracking\n- Shopping cart persistence",
            icon: "🛒",
          },
          {
            title: "Financial Services",
            description:
              "- Real-time fraud detection\n- High-frequency trading data\n- Transaction caching\n- Rate limiting for APIs",
            icon: "💳",
          },
          {
            title: "Gaming & Entertainment",
            description:
              "- Player session state\n- Leaderboards and rankings\n- In-game item inventory\n- Matchmaking systems",
            icon: "🎮",
          },
          {
            title: "IoT & Telemetry",
            description:
              "- Time-series sensor data\n- Real-time device monitoring\n- Alert management\n- Data aggregation",
            icon: "📡",
          },
        ],
      },
    ],
  },
  {
    title: "E-Commerce Architecture Pattern",
    subtitle: "High-Performance Shopping Experience",
    content: [
      {
        type: "list",
        items: [
          "🛍️ Session Store - User sessions with sub-millisecond access across regions",
          "📦 Product Catalog Cache - Cache product details, pricing, and inventory with TTL-based invalidation",
          "🛒 Shopping Cart - Persistent cart data with Redis Hash for individual items",
          "🔍 Search & Autocomplete - RediSearch for fast product search and autocomplete",
          "⚡ Rate Limiting - API rate limiting to prevent abuse and ensure fair usage",
          "📊 Real-time Analytics - Track user behavior, page views, and conversions",
        ],
      },
    ],
  },
  {
    title: "Financial Services Architecture",
    subtitle: "Real-Time Transaction Processing",
    content: [
      {
        type: "grid",
        gridItems: [
          {
            title: "Fraud Detection",
            description:
              "• Store user transaction patterns\n• Real-time anomaly detection\n• Velocity checks (transactions/hour)\n• Geographic anomaly detection",
            icon: "🔍",
          },
          {
            title: "Market Data Cache",
            description:
              "• Cache stock prices and quotes\n• Sub-millisecond data access\n• Time-series for historical data\n• Pub/Sub for price updates",
            icon: "📈",
          },
          {
            title: "API Rate Limiting",
            description:
              "• Protect trading APIs\n• Per-user and per-IP limits\n• Sliding window counters\n• Distributed rate limiting",
            icon: "⚖️",
          },
          {
            title: "Session Management",
            description:
              "• Secure session storage\n• Multi-device login tracking\n• Session expiration policies\n• Active-Active for global access",
            icon: "🔐",
          },
        ],
      },
    ],
  },
  {
    title: "Gaming Platform Architecture",
    subtitle: "Low-Latency Player Experience",
    content: [
      {
        type: "list",
        items: [
          "🎮 Player Sessions - Store player state, inventory, and progress with Redis Hash",
          "🏆 Leaderboards - Sorted Sets for real-time rankings across multiple dimensions",
          "👥 Matchmaking - Queue management with Lists and Sets for player matching",
          "💬 Chat Systems - Pub/Sub for in-game chat and notifications",
          "🎁 Inventory Management - Hash-based item storage with expiration for limited-time items",
          "📊 Analytics - Time-series data for player activity and engagement metrics",
        ],
      },
    ],
  },
  {
    title: "Microservices Architecture Pattern",
    subtitle: "Distributed System Coordination",
    content: [
      {
        type: "twoColumns",
        left: {
          type: "list",
          items: [
            "🔄 Service Discovery - Register and discover microservices dynamically",
            "📨 Message Queue - Reliable message delivery between services",
            "🔐 Distributed Locks - Coordinate access to shared resources",
            "📋 Configuration Store - Centralized configuration management",
          ],
        },
        right: {
          type: "list",
          items: [
            "🚦 Circuit Breaker - Track service health and failures",
            "📊 Metrics Aggregation - Collect and aggregate service metrics",
            "🔔 Event Bus - Pub/Sub for event-driven architecture",
            "💾 Distributed Cache - Shared cache across all services",
          ],
        },
      },
    ],
  },
  {
    title: "IoT & Telemetry Architecture",
    subtitle: "Real-Time Device Data Processing",
    content: [
      {
        type: "grid",
        gridItems: [
          {
            title: "Time-Series Data",
            description:
              "• RedisTimeSeries for sensor readings\n• Automatic downsampling and aggregation\n• Compaction rules for data retention\n• Real-time queries and analytics",
            icon: "📈",
          },
          {
            title: "Device State",
            description:
              "• Hash for device configuration\n• Last seen tracking with TTL\n• Connection status monitoring\n• Geospatial device location",
            icon: "📱",
          },
          {
            title: "Alert Management",
            description:
              "• Threshold-based alerting\n• Sorted Sets for priority queues\n• Pub/Sub for alert notifications\n• Rate limiting for alert storms",
            icon: "🚨",
          },
          {
            title: "Data Aggregation",
            description:
              "• Stream processing for events\n• Consumer groups for scalability\n• Real-time aggregation pipelines\n• Historical data rollups",
            icon: "⚡",
          },
        ],
      },
    ],
  },
  {
    title: "AI/ML Architecture Pattern",
    subtitle: "Feature Store & Model Serving",
    content: [
      {
        type: "list",
        items: [
          "🤖 Feature Store - Low-latency feature serving for ML models with Redis Hash",
          "🔄 Model Cache - Cache model predictions to reduce inference costs",
          "📊 Vector Search - Store and query embeddings for similarity search",
          "🎯 A/B Testing - Track experiments and feature flags with consistent hashing",
          "💾 Training Data Cache - Cache frequently accessed training datasets",
          "⚡ Real-time Inference - Sub-millisecond feature lookup for online predictions",
        ],
      },
    ],
  },
  {
    title: "Content Delivery Architecture",
    subtitle: "High-Performance Content Serving",
    content: [
      {
        type: "grid",
        gridItems: [
          {
            title: "CDN Cache",
            description:
              "• Cache static assets and pages\n• Geo-distributed caching\n• TTL-based invalidation\n• Cache-aside pattern",
            icon: "🌐",
          },
          {
            title: "Personalization",
            description:
              "• User preferences and settings\n• Content recommendations\n• Real-time user segmentation\n• A/B test assignments",
            icon: "👤",
          },
          {
            title: "Rate Limiting",
            description:
              "• API endpoint protection\n• DDoS mitigation\n• Per-user bandwidth limits\n• Token bucket algorithm",
            icon: "⚡",
          },
          {
            title: "Session Store",
            description:
              "• Multi-region session replication\n• Active-Active for global users\n• Secure cookie storage\n• Session analytics",
            icon: "🔐",
          },
        ],
      },
    ],
  },
  {
    title: "Best Practices for Production",
    subtitle: "Design Principles for Redis Architectures",
    content: [
      {
        type: "list",
        items: [
          "🎯 Right Data Structure - Choose the optimal Redis data structure for your use case",
          "⏰ Set Appropriate TTLs - Always set expiration for cache entries to prevent memory bloat",
          "🔄 Connection Pooling - Reuse connections to reduce overhead and improve performance",
          "📊 Monitor Memory Usage - Track memory consumption and set eviction policies",
          "🔐 Secure Your Data - Enable TLS, authentication, and network isolation",
          "🌍 Plan for Scale - Use clustering and Active-Active for global deployments",
          "💾 Backup & Recovery - Implement regular backups and disaster recovery plans",
          "🔍 Observability - Set up monitoring, logging, and alerting from day one",
        ],
      },
    ],
  },
  {
    title: "Common Anti-Patterns to Avoid",
    subtitle: "What Not to Do",
    content: [
      {
        type: "grid",
        gridItems: [
          {
            title: "No TTL on Cache Keys",
            description:
              "❌ Forgetting to set expiration leads to unbounded memory growth\n✅ Always set TTL or use eviction policies",
            icon: "⏰",
          },
          {
            title: "Large Keys",
            description:
              "❌ Storing huge values (>1MB) causes performance issues\n✅ Break large data into smaller chunks or use compression",
            icon: "📦",
          },
          {
            title: "Synchronous Operations",
            description:
              "❌ Blocking operations in request path\n✅ Use async patterns and pipelines",
            icon: "🔄",
          },
          {
            title: "No Connection Pooling",
            description:
              "❌ Creating new connections per request\n✅ Use connection pools to reuse connections",
            icon: "🔌",
          },
        ],
      },
    ],
  },
  {
    title: "Deployment Topology Examples",
    subtitle: "Choosing the Right Deployment Model",
    content: [
      {
        type: "list",
        items: [
          "🏢 Single Region HA - For applications with users in one region, use HA within the region for 99.99% uptime",
          "🌍 Active-Passive (DR) - For mission-critical apps requiring disaster recovery, replicate to standby region",
          "🌐 Active-Active (Global) - For global applications requiring <1ms latency everywhere, deploy Active-Active across regions",
          "🔄 Hybrid Cloud - For enterprises with on-premises requirements, use Redis Enterprise in hybrid mode",
          "☸️ Kubernetes - For containerized workloads, deploy Redis Enterprise Operator on Kubernetes",
        ],
      },
    ],
  },
  {
    title: "Cost Optimization Strategies",
    subtitle: "Getting More from Your Redis Deployment",
    content: [
      {
        type: "grid",
        gridItems: [
          {
            title: "Right-Size Your Cluster",
            description:
              "• Monitor actual memory usage\n• Use autoscaling where available\n• Consolidate underutilized databases\n• Set appropriate eviction policies",
            icon: "💰",
          },
          {
            title: "Optimize Data Structures",
            description:
              "• Use Hashes for objects instead of JSON strings\n• Compress large values\n• Use appropriate encoding\n• Archive old data to cheaper storage",
            icon: "📊",
          },
          {
            title: "Smart Replication",
            description:
              "• Don't over-replicate\n• Use Quorum-Only nodes for even clusters\n• Active-Passive instead of Active-Active when appropriate\n• Optimize cross-region bandwidth",
            icon: "🔄",
          },
          {
            title: "Leverage Cloud Credits",
            description:
              "• Use marketplace for billing consolidation\n• Take advantage of committed use discounts\n• Monitor and optimize reserved capacity\n• Track ROI on Redis spend",
            icon: "☁️",
          },
        ],
      },
    ],
  },
  {
    title: "Security Architecture Patterns",
    subtitle: "Protecting Your Redis Deployment",
    content: [
      {
        type: "list",
        items: [
          "🔐 Network Isolation - Deploy Redis in private VPC/subnets with no public internet access",
          "🔒 TLS Encryption - Enable TLS for all client connections and replica-to-primary replication",
          "🔑 Authentication - Use strong passwords and rotate credentials regularly",
          "👥 RBAC - Implement role-based access control for different application services",
          "🚫 Disable Dangerous Commands - Block commands like FLUSHDB, CONFIG in production",
          "📝 Audit Logging - Enable audit logs for compliance and security monitoring",
          "🔐 Customer Managed Keys - Use CMK for encryption at rest (available in Redis Cloud)",
        ],
      },
    ],
  },
  {
    title: "Migration Strategies",
    subtitle: "Moving to Redis Enterprise",
    content: [
      {
        type: "grid",
        gridItems: [
          {
            title: "Lift and Shift",
            description:
              "• Direct migration of Redis OSS\n• Use RIOT or similar tools\n• Minimal application changes\n• Quick wins on reliability",
            icon: "📦",
          },
          {
            title: "Phased Approach",
            description:
              "• Migrate workloads incrementally\n• Start with non-critical services\n• Validate performance and functionality\n• Gradual traffic cutover",
            icon: "📊",
          },
          {
            title: "Active-Passive Migration",
            description:
              "• Set up Redis Enterprise as passive replica\n• Sync data continuously\n• Failover when ready\n• Zero-downtime migration",
            icon: "🔄",
          },
          {
            title: "Dual Write Pattern",
            description:
              "• Write to both old and new Redis\n• Compare results for validation\n• Switch reads when confident\n• Safe rollback option",
            icon: "✍️",
          },
        ],
      },
    ],
  },
  {
    title: "Monitoring & Observability",
    subtitle: "Key Metrics to Track",
    content: [
      {
        type: "list",
        items: [
          "📊 Memory Metrics - Used memory, fragmentation ratio, eviction count",
          "⚡ Performance Metrics - Latency (p50, p99, p999), throughput (ops/sec), hit rate",
          "🔄 Replication Metrics - Replication lag, sync status, last sync time",
          "💾 Persistence Metrics - Last save time, save duration, AOF rewrite status",
          "🌐 Network Metrics - Connections, input/output bytes, rejected connections",
          "🚨 Error Metrics - Connection errors, command errors, timeout events",
          "☸️ Cluster Metrics - Shard health, failover events, node status",
        ],
      },
    ],
  },
  {
    title: "Capacity Planning",
    subtitle: "Sizing Your Redis Deployment",
    content: [
      {
        type: "text",
        text: "Proper capacity planning ensures optimal performance and cost efficiency. Consider these key factors:",
      },
      {
        type: "list",
        items: [
          "📈 Data Size - Estimate total data size including keys, values, and overhead (20-30% extra for fragmentation)",
          "⚡ Throughput Requirements - Operations per second (read/write ratio affects sizing)",
          "🔄 Replication Factor - Account for replica copies (HA requires 2x data, Active-Active requires 2x per region)",
          "📊 Peak Load - Size for peak capacity, not average (add 30-50% headroom)",
          "💾 Eviction Policy - Determine if you need all data in memory or can use eviction",
          "🌍 Geographic Distribution - Plan for cross-region latency and bandwidth costs",
        ],
      },
    ],
  },
  {
    title: "Reference Implementation",
    subtitle: "Sample Code Repository",
    content: [
      {
        type: "text",
        text: "This demo application showcases production-ready patterns for Redis Enterprise:",
      },
      {
        type: "grid",
        gridItems: [
          {
            title: "Caching Patterns",
            description:
              "• Cache-aside implementation\n• Write-through caching\n• Performance comparison\n• TTL management",
            icon: "💾",
          },
          {
            title: "Session Management",
            description:
              "• Secure session storage\n• iron-session integration\n• Cookie configuration\n• Multi-region sessions",
            icon: "🔐",
          },
          {
            title: "Real-Time Features",
            description:
              "• Pub/Sub messaging\n• Leaderboards with Sorted Sets\n• Rate limiting\n• Time-series data",
            icon: "⚡",
          },
          {
            title: "Advanced Capabilities",
            description:
              "• Vector search (Semantic cache)\n• RediSearch integration\n• Streams processing\n• Probabilistic data structures",
            icon: "🚀",
          },
        ],
      },
    ],
  },
  {
    title: "Additional Resources",
    subtitle: "Learn More About Redis Enterprise",
    content: [
      {
        type: "list",
        items: [
          "📚 [Redis Documentation](https://redis.io/docs/) - Official Redis documentation and guides",
          "🎓 [Redis University](https://university.redis.com/) - Free courses and certifications",
          "💻 [GitHub Examples](https://github.com/redis-developer) - Sample code and reference implementations",
          "🌐 [Redis Cloud Console](https://app.redislabs.com/) - Managed Redis Enterprise service",
          "👥 [Redis Community](https://redis.com/community/) - Connect with Redis users and experts",
          "📖 [Architecture Guides](https://redis.com/redis-enterprise/technology/) - In-depth architecture documentation",
        ],
      },
    ],
  },
];

export default function SampleArchitectureSlideDeck() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const router = useRouter();

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

  const handleClose = () => {
    router.push('/');
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        nextSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        prevSlide();
      } else if (e.key === 'Escape') {
        handleClose();
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
    <div className="slide-deck-container">
      <div className="slide-deck-header">
        <button onClick={handleClose} className="close-button">
          ← Back to Demos
        </button>
        <div className="slide-counter">
          Slide {currentSlide + 1} of {slides.length}
        </div>
      </div>

      <div
        className="slide-content"
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
                  {section.items?.map((item, itemIdx) => {
                    // Helper function to parse markdown links and render as JSX
                    const parseLinks = (text: string) => {
                      const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
                      const parts: (string | React.ReactNode)[] = [];
                      let lastIndex = 0;
                      let match;

                      while ((match = linkRegex.exec(text)) !== null) {
                        const [fullMatch, linkText, url] = match;

                        if (match.index > lastIndex) {
                          parts.push(text.substring(lastIndex, match.index));
                        }

                        parts.push(
                          <a
                            key={`link-${itemIdx}-${match.index}`}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="slide-link"
                          >
                            {linkText}
                          </a>
                        );

                        lastIndex = match.index + fullMatch.length;
                      }

                      if (lastIndex < text.length) {
                        parts.push(text.substring(lastIndex));
                      }

                      return parts.length > 0 ? parts : text;
                    };

                    // Parse items with format "emoji term - description"
                    const termMatch = item.match(/^(.+?)\s+(.+?)\s+-\s+(.+)$/);
                    if (termMatch) {
                      const [, emoji, term, description] = termMatch;
                      return (
                        <li key={itemIdx}>
                          {emoji} <strong>{parseLinks(term)}</strong> - {parseLinks(description)}
                        </li>
                      );
                    }
                    return <li key={itemIdx}>{parseLinks(item)}</li>;
                  })}
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
                      {column.items?.map((item, itemIdx) => {
                        const parseLinks = (text: string) => {
                          const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
                          const parts: (string | React.ReactNode)[] = [];
                          let lastIndex = 0;
                          let match;

                          while ((match = linkRegex.exec(text)) !== null) {
                            const [fullMatch, linkText, url] = match;
                            if (match.index > lastIndex) {
                              parts.push(text.substring(lastIndex, match.index));
                            }
                            parts.push(
                              <a
                                key={`link-${itemIdx}-${match.index}`}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="slide-link"
                              >
                                {linkText}
                              </a>
                            );
                            lastIndex = match.index + fullMatch.length;
                          }
                          if (lastIndex < text.length) {
                            parts.push(text.substring(lastIndex));
                          }
                          return parts.length > 0 ? parts : text;
                        };

                        const termMatch = item.match(/^(.+?)\s+(.+?)\s+-\s+(.+)$/);
                        if (termMatch) {
                          const [, emoji, term, description] = termMatch;
                          return (
                            <li key={itemIdx}>
                              {emoji} <strong>{parseLinks(term)}</strong> - {parseLinks(description)}
                            </li>
                          );
                        }
                        return <li key={itemIdx}>{parseLinks(item)}</li>;
                      })}
                    </ul>
                  );
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
  );
}
