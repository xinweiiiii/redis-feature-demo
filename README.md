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

#### 3. Rate Limiting (Coming Soon)
API rate limiting implementation examples

#### 4. Session Management (Coming Soon)
User session storage and management patterns

### Additional Features
- **Performance Tracking**: Real-time metrics showing execution time for read operations
- **Interactive UI**: Write and read operations for each data type
- **Modern Stack**: Built with Next.js 14, TypeScript, and Redis
- **Responsive Design**: Grid layout that adapts to different screen sizes

## Prerequisites

- Node.js 18+
- Redis server running locally or remotely

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up Redis connection (optional):
Create a `.env.local` file if you need custom Redis configuration:
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
```

## Running the Application

1. Make sure Redis is running:
```bash
# If using Docker
docker run -d -p 6379:6379 redis

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
│   │   └── pubsub/             # Pub/Sub API routes
│   │       ├── publish/
│   │       └── subscribe/
│   ├── globals.css             # Global styles
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Home page with demo cards
├── components/
│   ├── CachingDemoCard.tsx     # Caching demo card
│   ├── CachingDemoModal.tsx    # Caching demo modal
│   ├── PubSubDemoCard.tsx      # Pub/Sub demo card
│   ├── PubSubDemoModal.tsx     # Pub/Sub demo modal
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

## Building for Production

```bash
npm run build
npm start
```
