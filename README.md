# Redis Feature Demo

A Next.js application showcasing multiple Redis features through interactive demo cards.

## Features

### Card-Based Demo Layout
Each Redis feature is presented in its own interactive card for easy exploration:

#### 1. Basic Caching Demo (Active)
- Support for all major Redis data types:
  - **String**: Simple key-value storage
  - **Hash**: Object storage with multiple fields
  - **List**: Ordered collection of strings
  - **Set**: Unordered collection of unique strings
  - **Sorted Set**: Ordered collection with scores
- Real-time performance metrics showing execution time
- Interactive write and read operations

#### 2. Pub/Sub Messaging (Active)
- Real-time message publishing and subscription
- Multi-channel support
- Live message updates using Server-Sent Events
- Publisher and Subscriber interfaces
- Message history with timestamps
- Shows subscriber count for published messages

#### 3. Rate Limiting (Active)
- API request throttling using Redis INCR
- Configurable request limits and time windows
- Visual counter showing request usage
- Progress bar with color-coded status (green/red)
- Auto-reset timer with countdown
- Request history log with allowed/denied status
- Throttle warning when limit exceeded

#### 4. Session Management (Active)
- OAuth SSO login simulation (Google, GitHub, Microsoft, Okta)
- Session data stored as Redis hash with auto-expiration
- Session ID generation and management
- Multi-session support per user
- Active sessions list with TTL tracking
- Session termination (logout) functionality
- User avatar and profile display

#### 5. Time Series Data (Active)
- Track sensor data over time (temperature, humidity, pressure, CPU usage)
- Real-time data visualization with interactive charts
- Time-based queries and range filtering
- Aggregation functions (avg, min, max, sum)
- Historical data analysis
- Automatic timestamp management

#### 6. Redis Search (Active)
- **Full-Text Search**: Search product names and descriptions
- **Semantic Search**: Vector similarity search with embeddings
- **Hybrid Search**: Combines full-text and semantic search
- **Geo-Location Search**: Find locations by distance with GEORADIUS
- Search index creation and management
- Performance metrics and execution time tracking
- Sample data initialization for testing

#### 7. Redis Streams (Active)
- **Single Consumer**: Basic message streaming
- **Consumer Groups**: Load-balanced message processing with multiple consumers
- **Fan-Out Pattern**: Broadcast messages to multiple consumer groups
- Message acknowledgment (ACK)
- Pending messages tracking
- Stream statistics and monitoring
- Real-time message consumption

#### 8. Leaderboard (Active)
- Gaming/ranking system using Redis Sorted Sets
- Add players with scores (ZADD)
- Real-time leaderboard updates
- Get top players (ZRANGE)
- Find player rank (ZRANK)
- View players around a specific rank
- Increment player scores (ZINCRBY)
- Performance tracking for large datasets

#### 9. Semantic Cache (Active)
- AI query caching with vector embeddings
- Semantic similarity matching (finds similar queries)
- OpenAI GPT integration for responses
- Cost and token usage tracking
- Cache hit/miss statistics
- Configurable similarity threshold
- Total savings calculation (tokens and cost)
- Cache management and browsing

#### 10. Redis Data Integration (RDI) - Coming Soon
- Sync data from various sources to Redis in real-time

#### 11. Feature Store - Coming Soon
- Manage and serve machine learning features with Redis

### Additional Features
- **Performance Tracking**: Real-time metrics showing execution time for read operations
- **Interactive UI**: Write and read operations for each data type
- **Modern Stack**: Built with Next.js 14, TypeScript, and Redis
- **Responsive Design**: Grid layout that adapts to different screen sizes

## Prerequisites

- Node.js 18+
- Redis server running locally or remotely
- **Redis Stack** (recommended) - Required for advanced features:
  - RediSearch (for Search demo)
  - RedisTimeSeries (for Time Series demo)
  - RedisJSON (for Search demo with JSON documents)

**Note:** Basic features (Caching, Pub/Sub, Rate Limiting, Session Management, Streams, Leaderboard) work with standard Redis. Advanced features (Time Series, Search, Semantic Cache) require Redis Stack or specific modules.

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Create a `.env.local` file with the following configuration:
```env
# Redis Configuration (optional - defaults to localhost:6379)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# OpenAI API Key (required for Semantic Cache feature)
OPENAI_API_KEY=your_openai_api_key

# Session Secret (auto-generated if not provided)
SESSION_SECRET=your_session_secret
```

**Note:**
- Redis configuration is optional and defaults to `localhost:6379`
- OpenAI API key is only required if you want to use the Semantic Cache feature
- Session secret will be auto-generated if not provided

## Running the Application

1. Make sure Redis is running:

**Option 1: Redis Stack (Recommended - includes all modules)**
```bash
# Using Docker
docker run -d -p 6379:6379 redis/redis-stack:latest

# Or using Docker Compose (if you have a docker-compose.yml)
docker-compose up -d
```

**Option 2: Standard Redis (basic features only)**
```bash
# Using Docker
docker run -d -p 6379:6379 redis:latest

# Or start your local Redis server
redis-server
```

2. Start the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### String Operations
- Enter a key and value
- Click "Write String" to store in Redis
- Click "Read String" to retrieve and see performance metrics

### Hash Operations
- Enter a key and JSON object (e.g., `{"name":"John","age":"30"}`)
- Click "Write Hash" to store the object
- Click "Read Hash" to retrieve all fields

### List Operations
- Enter a key and JSON array (e.g., `["item1","item2","item3"]`)
- Click "Write List" to add items to the list
- Click "Read List" to retrieve all items

### Set Operations
- Enter a key and JSON array of unique members
- Click "Write Set" to add members
- Click "Read Set" to retrieve all members

### Sorted Set Operations
- Enter a key, score, and value
- Click "Write Sorted Set" to add a member with score
- Click "Read Sorted Set" to retrieve all members with scores

### Pub/Sub Messaging
**Publisher:**
- Enter a channel name (e.g., "notifications")
- Type your message
- Click "Publish Message" to send
- See how many subscribers received the message

**Subscriber:**
- Enter channel names separated by commas (e.g., "notifications,updates")
- Click "Subscribe" to start listening
- Messages appear in real-time with timestamps
- Click "Unsubscribe" to stop receiving messages
- Use "Clear Messages" to reset the message history

**Testing Pub/Sub:**
1. Open the demo in two browser windows
2. In Window 1: Subscribe to "notifications" channel
3. In Window 2: Publish a message to "notifications" channel
4. Watch the message appear instantly in Window 1!

### Rate Limiting
**Configuration:**
- Set an identifier (e.g., "user:123" or an IP address)
- Configure max requests (e.g., 5)
- Set time window in seconds (e.g., 10)

**Testing:**
1. Click "Make API Request" multiple times
2. Watch the counter increase and progress bar fill up
3. Visual feedback changes from green to red when throttled
4. See the countdown timer showing when the limit resets
5. View the request history showing allowed/denied requests
6. Click "Reset Rate Limit" to clear the counter manually

**What Happens:**
- Each request increments a Redis counter using `INCR`
- First request sets an expiration time using `EXPIRE`
- Subsequent requests check if limit is exceeded
- Counter automatically resets after the time window expires
- Real-time countdown shows remaining time until reset

### Session Management
**OAuth Login:**
- Enter your name and email
- Select an OAuth provider (Google, GitHub, Microsoft, or Okta)
- Click "Sign in with [Provider]" to create a session

**Session Features:**
1. View current session details (Session ID, User ID, IP, Login time, Expiration)
2. See all active sessions for your email address
3. Each session shows:
   - OAuth provider badge
   - Session ID (truncated)
   - Login time
   - Time remaining until expiration
4. Terminate other sessions with "Terminate" button
5. Logout from current session with "Logout" button
6. Refresh sessions list to see updated TTL values

**What Happens:**
- Login creates a unique session ID (64-character hex string)
- Session data stored in Redis hash using `HSET`
- Session expires automatically after 30 minutes using `EXPIRE`
- User's session IDs stored in a Redis set using `SADD`
- Sessions can be retrieved, listed, and deleted on demand
- Multiple concurrent sessions supported per user

**Testing Multi-Session:**
1. Login with Google
2. Open demo in new tab/window
3. Login with GitHub (same email)
4. Both sessions appear in "All Active Sessions"
5. Terminate one session from the other tab

### Time Series Data
**Adding Data Points:**
- Select a sensor type (Temperature, Humidity, Pressure, CPU Usage)
- Enter a value for the sensor
- Click "Add Data Point" to record with current timestamp
- View real-time chart visualization

**Querying & Aggregation:**
1. Set start and end time range
2. Select aggregation type (avg, min, max, sum)
3. Click "Get Aggregation" to analyze historical data
4. Results show calculated values over time period

**What Happens:**
- Data points stored with timestamps using Redis TimeSeries
- Range queries filter by time periods
- Aggregations computed over specified windows
- Chart updates in real-time with new data

### Redis Search
**Setup:**
1. Click "Initialize Sample Data" to create search index and test data
2. Choose search type: Full-Text, Semantic, Hybrid, or Geo-Location

**Full-Text Search:**
- Enter keywords to search product names and descriptions
- Uses Redis Search (RediSearch) with FT.SEARCH
- Returns matching products with relevance scoring

**Semantic Search:**
- Enter natural language query
- Uses vector embeddings for similarity search
- Finds semantically similar products even with different wording

**Hybrid Search:**
- Combines full-text and semantic search
- Best of both approaches for comprehensive results

**Geo-Location Search:**
- Enter latitude, longitude, and radius
- Finds locations within specified distance
- Uses Redis GEORADIUS command

### Redis Streams
**Single Consumer Mode:**
1. Enter a message in JSON format (e.g., `{"user":"Alice","action":"login"}`)
2. Click "Add to Stream" to publish
3. Click "Read Messages" to consume as single consumer
4. Messages appear in chronological order

**Consumer Groups Mode:**
1. Enter a message
2. Click "Add to Stream"
3. Messages automatically distributed between Consumer 1 and Consumer 2
4. Click "Acknowledge" to mark messages as processed
5. View pending message counts per consumer

**Fan-Out Pattern:**
1. Enter a message
2. Click "Add to Stream"
3. Message delivered to both Group 1 and Group 2
4. Each group processes independently
5. Demonstrates broadcast capabilities

**What Happens:**
- XADD adds messages to stream
- XREADGROUP reads messages for consumer groups
- XACK acknowledges processed messages
- Supports event sourcing and message queue patterns

### Leaderboard
**Add Player Score:**
1. Enter player name and score
2. Click "Add/Update Score" using ZADD
3. Leaderboard updates in real-time

**Find Player Rank:**
1. Enter player name in search field
2. Click "Find Rank" to get position and score
3. View players ranked above and below

**Increment Score:**
1. Enter player name and amount to add
2. Click "Increment Score" using ZINCRBY
3. Great for game events, achievements, etc.

**What Happens:**
- Sorted Set maintains ranking order by score
- ZADD adds/updates player scores
- ZRANGE retrieves top players
- ZRANK finds player position
- ZINCRBY atomically increments scores

### Semantic Cache
**Prerequisites:**
- Requires OpenAI API key in environment variables
- Set `OPENAI_API_KEY` in `.env.local`

**Making Queries:**
1. Enter a question (e.g., "What is Redis?")
2. Toggle "Use Cache" on/off to test behavior
3. Click "Submit Query"
4. First query calls OpenAI API (cache miss)
5. Similar queries return cached response (cache hit)

**Understanding Results:**
- **Cache Hit**: Response from cache, shows similar cached query
- **Cache Miss**: Fresh API call, response cached for future
- **Similarity Score**: How similar query is to cached queries
- **Tokens & Cost**: Track API usage and savings

**What Happens:**
- Query converted to embedding vector using OpenAI
- Vector similarity search finds similar queries (VSS)
- If similarity > threshold, cached response returned
- Saves API calls and reduces latency for similar queries
- Cache statistics show total tokens and cost saved

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── cache/              # Caching API routes
│   │   │   ├── string/
│   │   │   ├── hash/
│   │   │   ├── list/
│   │   │   ├── set/
│   │   │   └── sortedset/
│   │   ├── pubsub/             # Pub/Sub API routes
│   │   │   ├── publish/
│   │   │   └── subscribe/
│   │   ├── ratelimit/          # Rate Limiting API routes
│   │   │   ├── check/
│   │   │   ├── reset/
│   │   │   └── status/
│   │   ├── session/            # Session Management API routes
│   │   │   ├── login/
│   │   │   ├── logout/
│   │   │   ├── get/
│   │   │   ├── list/
│   │   │   └── refresh/
│   │   ├── timeseries/         # Time Series API routes
│   │   │   ├── add/
│   │   │   ├── range/
│   │   │   ├── aggregate/
│   │   │   └── generate/
│   │   ├── search/             # Search API routes
│   │   │   ├── fulltext/
│   │   │   ├── semantic/
│   │   │   ├── hybrid/
│   │   │   ├── geo/
│   │   │   └── generate/
│   │   ├── stream/             # Streams API routes
│   │   │   ├── add/
│   │   │   ├── read/
│   │   │   ├── group/
│   │   │   ├── ack/
│   │   │   ├── info/
│   │   │   └── delete/
│   │   ├── leaderboard/        # Leaderboard API routes
│   │   │   ├── add-score/
│   │   │   ├── top/
│   │   │   ├── rank/
│   │   │   ├── around/
│   │   │   ├── increment/
│   │   │   └── clear/
│   │   └── semantic-cache/     # Semantic Cache API routes
│   │       ├── query/
│   │       ├── stats/
│   │       └── clear/
│   ├── globals.css             # Global styles
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Home page with demo cards
├── components/
│   ├── CachingDemoCard.tsx     # Caching demo card
│   ├── CachingDemoModal.tsx    # Caching demo modal
│   ├── PubSubDemoCard.tsx      # Pub/Sub demo card
│   ├── PubSubDemoModal.tsx     # Pub/Sub demo modal
│   ├── RateLimitDemoCard.tsx   # Rate Limiting demo card
│   ├── RateLimitDemoModal.tsx  # Rate Limiting demo modal
│   ├── SessionDemoCard.tsx     # Session Management demo card
│   ├── SessionDemoModal.tsx    # Session Management demo modal
│   ├── TimeSeriesDemoCard.tsx  # Time Series demo card
│   ├── TimeSeriesDemoModal.tsx # Time Series demo modal
│   ├── SearchDemoCard.tsx      # Search demo card
│   ├── SearchDemoModal.tsx     # Search demo modal
│   ├── StreamDemoCard.tsx      # Streams demo card
│   ├── StreamDemoModal.tsx     # Streams demo modal
│   ├── LeaderboardDemoCard.tsx # Leaderboard demo card
│   ├── LeaderboardDemoModal.tsx # Leaderboard demo modal
│   ├── SemanticCacheDemoCard.tsx # Semantic Cache demo card
│   ├── SemanticCacheDemoModal.tsx # Semantic Cache demo modal
│   └── PlaceholderCard.tsx     # Placeholder for upcoming demos
├── lib/
│   └── redis.ts                # Redis client configuration
└── package.json
```

## API Endpoints

### Caching
- `POST /api/cache/string` - Write string
- `GET /api/cache/string?key=<key>` - Read string
- `POST /api/cache/hash` - Write hash
- `GET /api/cache/hash?key=<key>` - Read hash
- `POST /api/cache/list` - Write list
- `GET /api/cache/list?key=<key>` - Read list
- `POST /api/cache/set` - Write set
- `GET /api/cache/set?key=<key>` - Read set
- `POST /api/cache/sortedset` - Write sorted set
- `GET /api/cache/sortedset?key=<key>` - Read sorted set

### Pub/Sub
- `POST /api/pubsub/publish` - Publish message to channel
- `GET /api/pubsub/subscribe?channels=<channel1,channel2>` - Subscribe to channels (SSE)

### Rate Limiting
- `POST /api/ratelimit/check` - Check and increment rate limit counter
- `POST /api/ratelimit/reset` - Reset rate limit for identifier
- `GET /api/ratelimit/status?identifier=<id>` - Get current rate limit status

### Session Management
- `POST /api/session/login` - Create new session (OAuth login)
- `GET /api/session/get?sessionId=<id>` - Get session data
- `POST /api/session/logout` - Terminate session
- `GET /api/session/list?email=<email>` - List all active sessions for user
- `POST /api/session/refresh` - Refresh session data

### Time Series
- `POST /api/timeseries/add` - Add data point to time series
- `GET /api/timeseries/range` - Query time series data by range
- `POST /api/timeseries/aggregate` - Get aggregated time series data
- `POST /api/timeseries/generate` - Generate sample time series data

### Search
- `POST /api/search/generate` - Initialize search index and sample data
- `POST /api/search/fulltext` - Full-text search on products
- `POST /api/search/semantic` - Semantic search using vector embeddings
- `POST /api/search/hybrid` - Hybrid search (full-text + semantic)
- `POST /api/search/geo` - Geo-location radius search

### Streams
- `POST /api/stream/add` - Add message to stream
- `POST /api/stream/read` - Read messages from stream
- `POST /api/stream/group` - Read messages from consumer group
- `POST /api/stream/ack` - Acknowledge message processing
- `GET /api/stream/info` - Get stream information and statistics
- `POST /api/stream/delete` - Delete stream and consumer groups

### Leaderboard
- `POST /api/leaderboard/add-score` - Add or update player score
- `POST /api/leaderboard/top` - Get top N players
- `POST /api/leaderboard/rank` - Get player rank and score
- `POST /api/leaderboard/around` - Get players around a specific rank
- `POST /api/leaderboard/increment` - Increment player score
- `POST /api/leaderboard/clear` - Clear entire leaderboard

### Semantic Cache
- `POST /api/semantic-cache/query` - Query with semantic caching
- `GET /api/semantic-cache/stats` - Get cache statistics
- `POST /api/semantic-cache/clear` - Clear semantic cache

## Building for Production

```bash
npm run build
npm start
```
