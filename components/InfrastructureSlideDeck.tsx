'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ContentSection {
  type: 'list' | 'grid' | 'text' | 'comparison' | 'image' | 'twoColumns' | 'table';
  items?: string[];
  gridItems?: { title: string; description: string; icon?: string }[];
  text?: string;
  comparison?: { feature: string; oss: string; enterprise: string }[];
  table?: {
    headers: string[];
    rows: string[][];
  };
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
    title: "Redis Capabilities",
    content: [
      {
        type: "image",
        imageSrc: "/redis-architecture-diagram.png",
        imageAlt: "Redis Capabilities Architecture Diagram",
      },
    ],
  },
  {
    title: "Redis Enterprise 8 & Redis 8 are here!",
    subtitle: "Powering the Next Generation of Real-time Applications",
    content: [
      {
        type: "grid",
        gridItems: [
          {
            title: "Build for AI",
            description:
              "- Larger dataset with Redis Flex (v2)\n- LangCache next level caching for AI\n- New Vector Sets data structure",
            icon: "🤖",
          },
          {
            title: "Fastest Redis Ever",
            description:
              "- 40% faster scaling\n- Up to 78% Latency improvements\n- More robust replication\n- RQE performance improvement : up to 16x",
            icon: "⚡",
          },
          {
            title: "Security & Control",
            description:
              "- Connect with AWS Private Link\n- Customer Managed Keys in Redis Cloud\n- Managed your own CA",
            icon: "🔒",
          },
          {
            title: "Reliability & Simplicity",
            description:
              "- Seamless client experience on database changes\n- Redis manages minor version upgrades\n- Customer upgrades major self-serve",
            icon: "☁️",
          },
          {
            title: "Focus on Building Apps",
            description:
              "- Numerous API improvement that save you time\n- Model Context Protocol (MCP) for Redis",
            icon: "💻",
          },
        ],
      },
    ],
  },
  {
    title: "Optimize Infrastructure",
    subtitle: "How is your redis deployed today?",
    content: [
      {
        type: "image",
        imageSrc: "/redis-oss-deployment-diagram.png",
        imageAlt: "Redis deployment design",
      },
    ],
  },
  {
    title: "Optimize Infrastructure",
    subtitle: "What is the challenges with current OSS/EC/MS deployment?",
    content: [
      {
        type: "image",
        imageSrc: "/redis-oss-deployment-challenges-diagram.png",
        imageAlt: "Redis deployment design",
      },
    ],
  },
  {
    title: "Optimize Infrastructure",
    subtitle: "How do we solve them?",
    content: [
      {
        type: "image",
        imageSrc: "/redis-enterprise-resolve-oss-challenges-diagram.png",
        imageAlt: "Redis deployment design",
      },
    ],
  },
  {
    title: "The High Availability - Pyramid",
    subtitle: "99.999% uptime",
    content: [
      {
        type: "list",
        items: [
          "🔄 Cross-cluster replication - Allow switching to another cluster in another region in case of a disaster (outage of an entire cluster)",
          "🌐 Rack-zone awareness (Multi-AZ) - Minimal downtime in case of a failure of up to one zone at the same time",
          "⚡ Automatic failover (of shards/nodes) - Minimal downtime in case of a failure of up to one node at the same time",
          "📋 Internal replication - Up to two copies of the data, whereby each copy is on a different node",
          "💾 Persistence and backup - Allows recovering from persistent data files",
        ],
      },
    ],
  },
  {
    title: "High Availability",
    subtitle: "Quorum Concept: Protecting Against Split-Brain Situations",
    content: [
      {
        type: "text",
        text: "Redis Enterprise uses a node-based quorum concept, which means that we need to have an odd number of nodes to protect the cluster from split-brain situation",
      },
      {
        type: "list",
        items: [
          "❓ The Challenge - It's impossible within the distributed system to device why a node is no longer reachable. Node failure or network partitioning event?",
          "🧠 The Solution - In order to avoid split-brain situations, Redis Enterprise's Master of the Cluster (the brain) is elected within the majority network partition (the one which has the majority of the nodes). Nodes within the minority partition stop working and will no longer serve requests",
        ],
      },
    ],
  },
  {
    title: "High Availability",
    subtitle: "Quorum-Only Node for Cost Optimization",
    content: [
      {
        type: "list",
        items: [
          "🎯 Q(uorum) - O(nly) node - A specialized node type for maintaining quorum",
          "⚖️ Only necessary if we have an even number of data nodes - Balances the cluster topology",
          "✅ Ensures an odd number of nodes - Required for proper quorum calculation",
          "💰 Lower HW spec, so for cost-saving purposes - More economical than full data nodes",
          "📦 Doesn't host any data - Participates in cluster decisions only",
        ],
      },
      {
        type: "image",
        imageSrc: "/redis-qo-node-diagram.png",
        imageAlt:
          "Redis Enterprise Cluster with QO Node showing Node 1, Node 2 with data shards, and Node 3 as QO node with no data",
      },
    ],
  },
  {
    title: "High Availability",
    subtitle: "Redis Architecture - A Single Node Machine",
    content: [
      {
        type: "image",
        imageSrc: "/redis-single-node-design-diagram.png",
        imageAlt: "Redis Single Node Deployment Diagram",
      },
    ],
  },
  {
    title: "High Availability",
    subtitle: "Redis Architecture - A Cluster",
    content: [
      {
        type: "image",
        imageSrc: "/redis-cluster-design-diagram.png",
        imageAlt: "Redis Single Node Deployment Diagram",
      },
    ],
  },
  {
    title: "Diaster Recovery",
    subtitle: "Building highly available and resilient global apps",
    content: [
      {
        type: "grid",
        gridItems: [
          {
            title: "Active-Passive",
            description:
              "- Improves application response time\n- Enables highly available standby nodes in disaster recovery scenarios\n- Provides flexible cluster configuration to manage cost",
            icon: "🔵",
          },
          {
            title: "Active-Active",
            description:
              "- Delivers local latency across geos\n- Provides instant failover without data loss\n- Unifies your data layer across environments through seamless conflict resolution",
            icon: "🟠",
          },
        ],
      },
    ],
  },
  {
    title: "Disaster Recovery - Understanding Active-Passive (Replica-of)",
    subtitle: "Cross-Region Replication for Disaster Recovery",
    content: [
      {
        type: "list",
        items: [
          "✍️ Active instance accepts read and write - Primary database handles all write operations",
          "🔐 Updates are compressed and encrypted - Secure and efficient data transmission across regions",
          "📖 Passive instance can be read from - Secondary replicas available for read operations",
        ],
      },
      {
        type: "image",
        imageSrc: "/redis-active-passive-diagram.png",
        imageAlt:
          "Redis Active-Passive replication showing active instance replicating to multiple passive instances globally with encrypted and compressed streams",
      },
    ],
  },
  {
    title: "Disaster Recovery",
    subtitle: "Redis Cloud SLA",
    content: [
      {
        type: "image",
        imageSrc: "/redis-deployment-sla.png",
        imageAlt: "Redis Single Node Deployment Diagram",
      },
    ],
  },
  {
    title: "Disaster Recovery - Active/Active",
    subtitle: "CRDTs based Active-Active delivers key differentiators",
    content: [
      {
        type: "twoColumns",
        left: {
          type: "list",
          items: [
            "✍️ Local <1ms latency",
            "🔐 [CRDTs-based conflict resolution](https://redis.io/active-active/)",
            "📖 Strong resilency based on consensus-free protocol",
          ],
        },
        right: {
          type: "image",
          imageSrc: "/active-active-crdt-explanation.png",
          imageAlt: "Active Active CRDT Diagram",
        },
      },
    ],
  },
  {
    title: "Disaster Recovery",
    subtitle: "Sub-millisecond performance delivers unique value",
    content: [
      {
        type: "image",
        imageSrc: "/replication-database-comparison.png",
        imageAlt: "Redis replication comparison",
      },
    ],
  },
  {
    title: "Disaster Recovery - Options",
    subtitle:
      "High Availability (Enable in a single region across multiple AZs)",
    content: [
      {
        type: "list",
        items: [
          "Zero Data Loss Architecture\n\nUses real-time sync between primary and replica nodes, ensuring that data is replicated before write operations are acknowledges.",
          "Automatic Failover and Proxy Redirection\n\nIntelligent proxy layer monitor database health - when a primary node fail the system redirect to the replica node.",
        ],
      },
      {
        type: "image",
        imageSrc: "/dr-ha.png",
        imageAlt: "Disaster Recovery HA",
      },
    ],
  },
  {
    title: "Disaster Recovery - Options",
    subtitle: "Active/Passive",
    content: [
      {
        type: "image",
        imageSrc: "/dr-ap.png",
        imageAlt: "Redis Active Passive",
      },
    ],
  },
  {
    title: "Disaster Recovery - Options",
    subtitle: "Active/Passive",
    content: [
      {
        type: "list",
        items: [
          "🔄 This standby region is not a simple backup, it operates as a live, asynchronous replica of the primary Redis cluster",
          "🌐 Each primary shard has a one-to-one replica shard in the passive region continuously updated via async replication",
          "⚡ The passive cluster remains hot and failover ready with minimal replication lag",
          "📋 This architecture requires ~2x shard capacity\n- Full shard set in the primary region\n- A full replica shard set in the standby region",
        ],
      },
    ],
  },
  {
    title: "Disaster Recovery - Options",
    subtitle: "Active/Active",
    content: [
      {
        type: "image",
        imageSrc: "/dr-aa.png",
        imageAlt: "Redis Active Passive",
      },
    ],
  },
  {
    title: "Disaster Recovery - Options",
    subtitle: "Active/Active - How CRDTs Work?",
    content: [
      {
        type: "list",
        items: [
          "🌍 Each region operates independently\n   • No global lock\n   • No cross region coordination\n   • Low latency local writes",
          "🔄 All updates replicate asynchronous\n   • Uses logical timestamps + metadata\n   • Replication is eventually consistent\n   • No write conflicts block the application",
          "⚙️ Automatic state convergence\n   • Compare CRDT metadata\n   • Merge conflicting operation deterministically\n   • Reach the same final state in all regions",
          "♻️ Region recovery is automatic\n   • If a region disconnect, continue accepting local write, when reconnect, CRDT algo merge all divergent changes",
        ],
      },
    ],
  },
  {
    title: "Scenarios between Region A and Region B",
    subtitle: "App writes to region A and region A goes down",
    content: [
      {
        type: "text",
        text: "Write are already committed to region A locally before it failed",
      },
      {
        type: "text",
        text: "All committed write are stored in the CRDT dataset in Region A",
      },
      {
        type: "grid",
        gridItems: [
          {
            title: "Case 1: Replication already happened",
            description:
              "• Region A → B replication usually happens within milliseconds\n• If they already received the update, nothing is lost",
            icon: "✅",
          },
          {
            title: "Case 2: Replication had not happened",
            description:
              "• Region A still has the committed CRDT write on disk\n• When region A recovers:\n   ○ Reconnect\n   ○ Send its missed updates to B and C\n   ○ Receives updates from B and C\n   ○ Merges everything via CRDTs",
            icon: "🔄",
          },
        ],
      },
    ],
  },
  {
    title: "Redis Deployment Models Summary Table",
    content: [
      {
        type: "table",
        table: {
          headers: [
            "Feature / Behavior",
            "HA (Single Region)",
            "Active/Passive (Multi Region DR)",
            "Active/Active (Multi-Region CRDT)",
          ],
          rows: [
            [
              "Regions",
              "1 Region",
              "2+ Regions (Primary + Replica)",
              "2+ regions (all active)",
            ],
            [
              "Replication Type",
              "Sync within region",
              "Async cross-region replication",
              "CRDT-based async merging",
            ],
            [
              "Failover Behaviour",
              "Local failover only",
              "Standby promoted to primary",
              "No promotion needed; other region continue immediately",
            ],
            [
              "RPO (Data loss risk)",
              "-",
              "> 0 (some data may be lost)",
              "0 - no data loss for CRDT type",
            ],
            [
              "RTO (Recovery Time)",
              "-",
              "Minutes (Promotion + DNS app/routing)",
              "Full global durability with automatic conflict resolution) - Near Zero",
            ],
          ],
        },
      },
    ],
  },
  {
    title: "Redis Deployment Models Summary Table",
    subtitle: "Operational Characteristics",
    content: [
      {
        type: "table",
        table: {
          headers: [
            "Feature / Behavior",
            "HA (Single Region)",
            "Active/Passive (Multi Region DR)",
            "Active/Active (Multi-Region CRDT)",
          ],
          rows: [
            [
              "If a region fails",
              "Cluster self-heals inside region",
              "Passive becomes writable after failover",
              "Other region continue writing immediately",
            ],
            [
              "When Failed Region Returns",
              "Syncs from surviving replica",
              "Must rebuild from new primary",
              "Automatic merges via CRDTs",
            ],
            [
              "Traffic Routing",
              "Local only",
              "Needs failover routing (DNS/LB)",
              "Geo-routing or multi-endpoint clients",
            ],
            [
              "Best For",
              "Single Region HA",
              "DR with limited RPO/RTO requirements",
              "Mission critical multi region apps demanding RPO/RTO = 0",
            ],
          ],
        },
      },
    ],
  },
  {
    title: "Observability & Management",
    subtitle:
      "Out of the box real-time montioring - Support metrics beyond Redis Info",
    content: [
      {
        type: "twoColumns",
        left: {
          type: "image",
          imageSrc: "/monitoring-pie.png",
          imageAlt: "Monitoring PIE",
        },
        right: {
          type: "image",
          imageSrc: "/monitoring.gif",
          imageAlt: "Monitoring GIF",
        },
      },
    ],
  },
  {
    title: "Smart on Cost",
    subtitle: "Put the infrastructure you pay to use",
    content: [
      {
        type: "image",
        imageSrc: "/put-pay-infra-to-use.png",
        imageAlt: "Put pay infra to use",
      },
    ],
  },
  {
    title: "Smart on Cost",
    subtitle: "Only pay for what you use",
    content: [
      {
        type: "image",
        imageSrc: "/only-pay-what-you-use.png",
        imageAlt: "Put pay infra to use",
      },
    ],
  },
  {
    title: "Smart on Cost",
    subtitle: "Simplify billing through Cloud Provider Marketplace",
    content: [
      {
        type: "image",
        imageSrc: "/marketplace.png",
        imageAlt: "Marketplace",
      },
    ],
  },
  {
    title: "Smart on Costs",
    subtitle: "Multi-Cloud and Hybrid Support",
    content: [
      {
        type: "twoColumns",
        left: {
          type: "list",
          items: [
            "Deploy in any cloud",
            "Deploy on premises or hybrid",
            "Native Kubernetes support with operator",
          ],
        },
        right: {
          type: "image",
          imageSrc: "/multi-cloud.png",
          imageAlt: "Mutli Cloud Diagram",
        },
      },
    ],
  },
];

export default function InfrastructureSlideDeck() {
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

            if (section.type === 'comparison') {
              return (
                <div key={idx} className="comparison-table-wrapper">
                  <table className="comparison-table">
                    <thead>
                      <tr>
                        <th>Feature</th>
                        <th>Redis OSS</th>
                        <th>Redis Enterprise</th>
                      </tr>
                    </thead>
                    <tbody>
                      {section.comparison?.map((row, rowIdx) => (
                        <tr key={rowIdx}>
                          <td className="feature-name">{row.feature}</td>
                          <td className="oss-column">{row.oss}</td>
                          <td className="enterprise-column">{row.enterprise}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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

            if (section.type === 'table') {
              return (
                <div key={idx} className="comparison-table-wrapper">
                  <table className="comparison-table">
                    <thead>
                      <tr>
                        {section.table?.headers.map((header, headerIdx) => (
                          <th key={headerIdx}>{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {section.table?.rows.map((row, rowIdx) => (
                        <tr key={rowIdx}>
                          {row.map((cell, cellIdx) => (
                            <td key={cellIdx}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
