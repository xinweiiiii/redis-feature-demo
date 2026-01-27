// Use case data for different Redis features

export const geospatialUseCases = {
  realWorldUseCases: [
    'Location-based services (find nearby restaurants, stores, or services)',
    'Ride-sharing apps (match drivers with passengers based on proximity)',
    'Real estate search (find properties within a radius of a location)',
    'Asset tracking (monitor fleet vehicles, delivery tracking)',
    'Geo-fencing and proximity alerts',
    'Social networking (find friends nearby)',
    'Gaming (multiplayer location-based games)'
  ],
  whenToUse: [
    'Need to find entities within a specific radius quickly',
    'Implementing location-based search or recommendations',
    'Real-time proximity calculations required',
    'Working with latitude/longitude coordinates',
    'Need to calculate distances between multiple points',
    'Building location-aware features with low latency requirements'
  ],
  whenNotToUse: [
    'Need complex polygon-based geospatial queries',
    'Require 3D coordinates or altitude data',
    'Need advanced GIS features (use PostGIS instead)',
    'Working with large polygons or complex geometries',
    'Require geospatial joins across multiple datasets'
  ],
  performance: {
    characteristics: [
      'O(log(N)) complexity for adding locations',
      'O(N+log(M)) for radius queries (N = results, M = total items)',
      'Sub-millisecond response times for typical queries',
      'Efficient memory usage with geohash encoding',
      'Scales well to millions of locations'
    ],
    benchmarks: [
      '~0.1-1ms for radius search with 100K locations',
      'Can handle 10K+ writes/sec on standard hardware',
      'Memory: ~50-100 bytes per location'
    ]
  },
  tradeoffs: {
    pros: [
      'Extremely fast proximity searches',
      'Built-in distance calculations',
      'Simple API for common use cases',
      'Efficient memory usage',
      'Atomic operations',
      'No external dependencies'
    ],
    cons: [
      'Limited to 2D coordinates (no altitude)',
      'No complex polygon support',
      'Radius queries only (no arbitrary shapes)',
      'Limited to Earth-based coordinates',
      'Cannot store additional metadata with coordinates',
      'No built-in routing or path finding'
    ]
  }
};

export const pubsubUseCases = {
  realWorldUseCases: [
    'Real-time chat applications and messaging systems',
    'Live notifications and alerts',
    'Event broadcasting (sports scores, stock prices)',
    'Microservices communication and event-driven architecture',
    'IoT device communication and sensor data streaming',
    'Live dashboards and real-time analytics updates',
    'Collaborative tools (document editing, whiteboarding)'
  ],
  whenToUse: [
    'Need real-time message broadcasting to multiple subscribers',
    'Implementing event-driven architecture',
    'Building chat or notification systems',
    'Decoupling services in microservices architecture',
    'Real-time updates without polling',
    'Fan-out messaging patterns'
  ],
  whenNotToUse: [
    'Need guaranteed message delivery (messages are fire-and-forget)',
    'Require message persistence or replay',
    'Need message ordering guarantees across channels',
    'Complex routing logic required (use message queues)',
    'Need acknowledgments or two-way communication',
    'Subscribers may be offline (messages are lost if no active subscribers)'
  ],
  performance: {
    characteristics: [
      'O(N) complexity where N = number of subscribers',
      'Sub-millisecond message delivery latency',
      'Can handle millions of messages per second',
      'Memory efficient (messages not stored)',
      'Linear scalability with subscribers'
    ],
    benchmarks: [
      '~0.01-0.1ms message delivery latency',
      '1M+ messages/sec on standard hardware',
      'Supports 10K+ concurrent subscribers per channel',
      'Memory: minimal (no message storage)'
    ]
  }
};

export const cachingUseCases = {
  realWorldUseCases: [
    'Database query result caching',
    'API response caching',
    'Session storage for web applications',
    'Full-page or fragment caching',
    'Rate limiting and throttling',
    'Temporary data storage (shopping carts, user preferences)',
    'Reducing database load for frequently accessed data'
  ],
  whenToUse: [
    'Data is read frequently but changed infrequently',
    'Need to reduce database load',
    'Acceptable to serve slightly stale data',
    'Predictable data expiration patterns',
    'Need to improve response times',
    'Handling traffic spikes'
  ],
  whenNotToUse: [
    'Data must always be 100% up-to-date',
    'No clear expiration strategy',
    'Data changes very frequently',
    'Cache invalidation is complex',
    'Working with very large objects (>100MB)',
    'Need ACID transactions across multiple keys'
  ],
  performance: {
    characteristics: [
      'O(1) complexity for GET/SET operations',
      'Sub-millisecond response times',
      'Can handle 100K+ operations/sec per instance',
      'Memory-based storage for maximum speed',
      'Supports various data structures (strings, hashes, lists, sets, sorted sets)'
    ],
    benchmarks: [
      '~0.1ms average latency for GET/SET',
      '100K-500K ops/sec on standard hardware',
      '1M+ ops/sec with pipelining',
      'Memory: actual data size + ~100 bytes overhead per key'
    ]
  },
  tradeoffs: {
    pros: [
      '10-100x faster than database queries',
      'Reduces database load significantly',
      'Simple key-value API',
      'Automatic expiration (TTL)',
      'Atomic operations',
      'Rich data structure support'
    ],
    cons: [
      'Limited by available RAM',
      'Potential data loss on restart (unless persistence enabled)',
      'Cache invalidation complexity',
      'Possible stale data',
      'Additional infrastructure to manage',
      'Memory costs higher than disk storage'
    ]
  }
};

export const leaderboardUseCases = {
  realWorldUseCases: [
    'Gaming leaderboards and rankings',
    'Social media trending topics and viral content',
    'E-commerce product rankings and bestsellers',
    'Real-time analytics dashboards (top users, top products)',
    'Rate limiting with priority queues',
    'Task prioritization and scheduling',
    'Recommendation engines (top-rated items)'
  ],
  whenToUse: [
    'Need real-time rankings and leaderboards',
    'Frequent score updates',
    'Range queries on sorted data',
    'Top-N or bottom-N queries',
    'Need both score and rank information',
    'Time-based or score-based sorting'
  ],
  whenNotToUse: [
    'Complex multi-dimensional sorting',
    'Need to sort by multiple criteria simultaneously',
    'Very large datasets (billions of entries)',
    'Require full-text search on ranked items',
    'Need distributed leaderboards across regions',
    'Complex aggregations required'
  ],
  performance: {
    characteristics: [
      'O(log(N)) for add/update/delete operations',
      'O(log(N)+M) for range queries (M = size of result)',
      'O(1) for score and rank retrieval by member',
      'Efficient memory usage with skip lists',
      'Atomic operations for score updates'
    ],
    benchmarks: [
      '~0.1-0.5ms for score updates',
      '~0.1ms for rank lookups',
      'Can handle millions of entries efficiently',
      '50K-100K updates/sec on standard hardware',
      'Memory: ~50-70 bytes per entry'
    ]
  },
  tradeoffs: {
    pros: [
      'Real-time ranking updates',
      'Efficient range queries',
      'Atomic increment operations',
      'Combined score and rank retrieval',
      'Memory efficient sorted storage',
      'Built-in score-based operations'
    ],
    cons: [
      'Single-dimension sorting only',
      'Memory usage grows with dataset size',
      'No built-in tie-breaking beyond lexicographic',
      'Complex distributed rankings need custom logic',
      'Limited aggregation capabilities',
      'No built-in pagination helpers for large result sets'
    ]
  }
};

export const timeSeriesUseCases = {
  realWorldUseCases: [
    'IoT sensor data collection and monitoring',
    'Application performance monitoring (APM)',
    'Financial market data and stock prices',
    'Server and infrastructure metrics',
    'User activity tracking and analytics',
    'Weather data and environmental monitoring',
    'Real-time dashboards and visualization'
  ],
  whenToUse: [
    'Collecting time-stamped data points',
    'Need time-based queries and aggregations',
    'Monitoring metrics over time',
    'Real-time analytics on streaming data',
    'Downsampling or aggregating time-series data',
    'Need to retain data with different retention policies'
  ],
  whenNotToUse: [
    'Complex event processing required',
    'Need SQL-like queries',
    'Require joins across multiple time series',
    'Very long retention periods (years)',
    'Need complex statistical analysis',
    'Working with irregular or sparse time series'
  ],
  performance: {
    characteristics: [
      'O(1) for data point insertion',
      'O(n/m) for range queries (n = points, m = aggregation)',
      'Automatic downsampling and aggregation',
      'Compressed storage for time-series data',
      'Sub-millisecond query latency'
    ],
    benchmarks: [
      '~0.1-0.5ms per data point insertion',
      '100K+ writes/sec per time series',
      '~1-10ms for range queries (depending on range)',
      'Memory: ~12-15 bytes per data point (with compression)',
      'Supports 100K+ concurrent time series'
    ]
  },
  tradeoffs: {
    pros: [
      'Optimized for time-series workloads',
      'Built-in downsampling and aggregation',
      'Efficient storage with compression',
      'Fast range queries',
      'Automatic compaction',
      'Label-based filtering'
    ],
    cons: [
      'Requires RedisTimeSeries module',
      'Limited to numeric data',
      'No complex analytics (use specialized TSDB for advanced features)',
      'Memory-based (limited by RAM)',
      'No built-in alerting',
      'Limited retention policy options'
    ]
  }
};

export const streamUseCases = {
  realWorldUseCases: [
    'Event sourcing and audit logs',
    'Activity feeds and timelines',
    'Message queues with consumer groups',
    'Real-time data pipelines',
    'Transaction logs and replication',
    'Microservices event streaming',
    'Click stream analysis and user behavior tracking'
  ],
  whenToUse: [
    'Need ordered message streams',
    'Require message persistence and replay',
    'Multiple consumers need to process same messages',
    'Need consumer group functionality',
    'Implementing event sourcing patterns',
    'Require message acknowledgments'
  ],
  whenNotToUse: [
    'Simple pub/sub is sufficient',
    'Don\'t need message persistence',
    'Complex routing logic required',
    'Need exactly-once delivery guarantees',
    'Require distributed transactions',
    'Very long message retention needed'
  ],
  performance: {
    characteristics: [
      'O(1) for message appending',
      'O(N) for reading N messages',
      'Efficient memory and disk usage',
      'Support for trimming old messages',
      'Consumer group coordination overhead is minimal'
    ],
    benchmarks: [
      '~0.1-0.5ms per message append',
      '100K+ messages/sec throughput',
      'Consumer groups: 10K+ messages/sec per consumer',
      'Memory: ~100-200 bytes per message (varies by content)',
      'Supports millions of messages in a stream'
    ]
  },
  tradeoffs: {
    pros: [
      'Message persistence and replay',
      'Consumer groups for load distribution',
      'Ordered message delivery',
      'Message acknowledgments',
      'Automatic message IDs',
      'Built-in backpressure handling'
    ],
    cons: [
      'More complex than pub/sub',
      'Memory usage grows with stream size',
      'No built-in message routing',
      'Requires manual trimming',
      'Limited to single Redis instance (no built-in partitioning)',
      'No dead letter queue (DLQ) support out of box'
    ]
  }
};

export const sessionUseCases = {
  realWorldUseCases: [
    'User session management for web applications',
    'Shopping cart persistence across devices',
    'Authentication token storage',
    'User preferences and settings',
    'Temporary workflow state (multi-step forms)',
    'SSO (Single Sign-On) session tracking',
    'Mobile app session management'
  ],
  whenToUse: [
    'Need fast session lookups',
    'Require automatic session expiration',
    'Sessions accessed frequently',
    'Need to share sessions across multiple servers',
    'Implementing stateless authentication',
    'Need atomic session updates'
  ],
  whenNotToUse: [
    'Need complex session queries',
    'Require ACID transactions across sessions',
    'Sessions contain very large data (>1MB)',
    'Need session history/audit trail',
    'Long-term data storage required',
    'Complex session relationships needed'
  ],
  performance: {
    characteristics: [
      'O(1) for session read/write operations',
      'Sub-millisecond session retrieval',
      'Automatic TTL expiration',
      'Memory-based for maximum speed',
      'Supports millions of concurrent sessions'
    ],
    benchmarks: [
      '~0.1ms average session lookup',
      '100K+ session operations/sec',
      'Memory: ~1-5KB per session (varies by data)',
      'Scales horizontally with Redis Cluster',
      'Negligible overhead vs in-memory storage'
    ]
  }
};

export const semanticCacheUseCases = {
  realWorldUseCases: [
    'AI/LLM response caching (ChatGPT-like applications)',
    'Semantic search result caching',
    'Similar question detection in Q&A systems',
    'Recommendation deduplication',
    'Content similarity matching',
    'Chatbot response optimization',
    'Knowledge base query optimization'
  ],
  whenToUse: [
    'Similar queries should return cached results',
    'Working with AI/LLM APIs (reduce costs)',
    'Need fuzzy matching for cache hits',
    'High cost per query (API calls, compute)',
    'Users ask similar questions differently',
    'Semantic similarity is acceptable for cache hits'
  ],
  whenNotToUse: [
    'Exact match caching is sufficient',
    'Responses must be unique every time',
    'No clear similarity threshold',
    'Cost of vector comparison exceeds benefits',
    'Data changes very frequently',
    'Privacy concerns with shared responses'
  ],
  performance: {
    characteristics: [
      'O(log(N)) for vector similarity search',
      'Trade-off between accuracy and speed',
      'Embedding generation overhead',
      'Configurable similarity thresholds',
      'Scales with vector dimensions'
    ],
    benchmarks: [
      '~1-10ms for vector similarity search',
      'Embedding generation: 10-100ms (external API)',
      'Can cache 90%+ of similar queries',
      'Memory: ~1-4KB per cached embedding',
      'ROI improves with query volume'
    ]
  },
  tradeoffs: {
    pros: [
      'Significant cost reduction for AI APIs',
      'Better user experience (faster responses)',
      'Handles query variations',
      'Improves with usage',
      'Reduces API rate limit issues',
      'Semantic understanding of queries'
    ],
    cons: [
      'Embedding generation overhead',
      'May return imperfect matches',
      'Requires vector search capability',
      'Similarity threshold tuning needed',
      'Higher memory usage than simple cache',
      'Potential for inappropriate cache hits'
    ]
  }
};

export const probabilisticUseCases = {
  realWorldUseCases: [
    'Unique visitor counting (HyperLogLog)',
    'Bloom filters for spam detection',
    'Rate limiting with token buckets',
    'Duplicate detection in streams',
    'Membership testing (email blacklists)',
    'Cardinality estimation for analytics',
    'Top-K item tracking (heavy hitters)'
  ],
  whenToUse: [
    'Approximate counts are acceptable',
    'Memory efficiency is critical',
    'Working with massive datasets',
    'Need fast membership tests',
    'Exact accuracy not required',
    'Trading precision for performance/memory'
  ],
  whenNotToUse: [
    'Need exact counts',
    'Require 100% accuracy',
    'Small datasets (exact methods work fine)',
    'Audit/compliance requires precision',
    'Cannot tolerate false positives',
    'Need to retrieve actual members'
  ],
  performance: {
    characteristics: [
      'O(1) for HyperLogLog operations',
      'O(k) for Bloom filter (k = hash functions)',
      'Fixed memory usage regardless of dataset size',
      'Sub-millisecond operations',
      'Error rates configurable'
    ],
    benchmarks: [
      'HyperLogLog: 12KB for billions of unique counts',
      'Bloom filter: ~10 bits per element (1% error rate)',
      '~0.1ms per operation',
      '99%+ accuracy for cardinality estimation',
      'False positive rate: configurable (typically 1-5%)'
    ]
  },
  tradeoffs: {
    pros: [
      'Massive memory savings',
      'Constant memory usage',
      'Extremely fast operations',
      'Scales to billions of elements',
      'Predictable error rates',
      'Simple API'
    ],
    cons: [
      'Approximate results only',
      'Cannot retrieve stored elements',
      'False positives possible (Bloom filters)',
      'Cannot delete elements (Bloom filters)',
      'Requires understanding of error rates',
      'Not suitable for exact analytics'
    ]
  }
};

export const featureStoreUseCases = {
  realWorldUseCases: [
    'Machine learning feature storage',
    'Real-time ML model serving',
    'Fraud detection systems',
    'Recommendation engines',
    'A/B testing feature flags',
    'User profile enrichment',
    'Real-time analytics aggregations'
  ],
  whenToUse: [
    'ML models need low-latency feature access',
    'Features computed from streaming data',
    'Need online and offline feature consistency',
    'Real-time predictions required',
    'Features reused across multiple models',
    'Need point-in-time feature lookup'
  ],
  whenNotToUse: [
    'Batch-only ML pipelines',
    'Features change very infrequently',
    'No real-time serving requirements',
    'Simple lookup tables suffice',
    'Features too large for memory',
    'Complex feature transformations at serve time'
  ],
  performance: {
    characteristics: [
      'O(1) for feature retrieval by key',
      'Sub-millisecond feature access',
      'Supports batch and streaming updates',
      'Efficient JSON storage for features',
      'Atomic feature updates'
    ],
    benchmarks: [
      '~0.1-1ms feature retrieval latency',
      '50K+ feature reads/sec',
      'Supports millions of feature vectors',
      'Memory: varies by feature dimensions',
      'P99 latency < 5ms for complex features'
    ]
  },
  tradeoffs: {
    pros: [
      'Low-latency feature serving',
      'Shared across models',
      'Supports real-time updates',
      'Version control capabilities',
      'Simple key-value interface',
      'High availability with Redis Cluster'
    ],
    cons: [
      'Limited by RAM',
      'Not a complete feature store solution',
      'No built-in feature lineage',
      'Manual feature versioning',
      'Limited feature transformation',
      'No built-in feature monitoring'
    ]
  }
};

export const rateLimitUseCases = {
  realWorldUseCases: [
    'API rate limiting for external clients',
    'DDoS protection and abuse prevention',
    'Resource quota management',
    'Login attempt throttling',
    'Email/SMS sending limits',
    'Web scraping protection',
    'Bandwidth throttling for file downloads'
  ],
  whenToUse: [
    'Need to limit request rates per user/IP',
    'Protecting APIs from abuse',
    'Implementing usage quotas',
    'Preventing brute force attacks',
    'Enforcing fair use policies',
    'Need distributed rate limiting'
  ],
  whenNotToUse: [
    'Single server application (can use in-memory)',
    'Don\'t need distributed rate limiting',
    'Complex multi-tier rate limiting',
    'Need sophisticated quota hierarchies',
    'Require detailed analytics on rate limit hits',
    'Very fine-grained time windows (<1ms)'
  ],
  performance: {
    characteristics: [
      'O(1) for token bucket/sliding window checks',
      'Sub-millisecond rate limit checks',
      'Atomic operations prevent race conditions',
      'Minimal memory footprint per user',
      'Scales to millions of users'
    ],
    benchmarks: [
      '~0.1ms per rate limit check',
      '100K+ checks/sec per instance',
      'Memory: ~100-200 bytes per user/key',
      'Supports millions of concurrent rate limits',
      'Negligible overhead on application latency'
    ]
  },
  tradeoffs: {
    pros: [
      'Distributed rate limiting across servers',
      'Atomic operations (no race conditions)',
      'Flexible time windows',
      'Low latency overhead',
      'Simple implementation',
      'Automatic expiration of old data'
    ],
    cons: [
      'Requires Redis for distributed apps',
      'Clock synchronization important',
      'May need custom sliding window logic',
      'Limited built-in algorithms',
      'No built-in rate limit analytics'
    ]
  }
};
