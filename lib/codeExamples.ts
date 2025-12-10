// Code example generators for different Redis features

export const geospatialExamples = {
  nodejs: `// Using node-redis
import { createClient } from 'redis';

const client = await createClient()
  .on('error', err => console.log('Redis Client Error', err))
  .connect();

// Add location
await client.geoAdd('locations', {
  longitude: 103.8607,
  latitude: 1.2834,
  member: 'Marina Bay Sands'
});

// Search nearby locations
const results = await client.geoSearch(
  'locations',
  { longitude: 103.8520, latitude: 1.2905 },
  { radius: 5, unit: 'km' },
  ['WITHDIST', 'WITHCOORD']
);

console.log(results);`,

  python: `# Using redis-py
import redis

client = redis.Redis(
    host='localhost',
    port=6379,
    decode_responses=True
)

# Add location
client.geoadd('locations',
    103.8607, 1.2834, 'Marina Bay Sands'
)

# Search nearby locations
results = client.georadius(
    'locations',
    103.8520, 1.2905,
    5, unit='km',
    withdist=True, withcoord=True
)

print(results)`,

  cli: `# Add location to Redis
GEOADD locations 103.8607 1.2834 "Marina Bay Sands"

# Search nearby locations within 5km
GEOSEARCH locations FROMLONLAT 103.8520 1.2905 BYRADIUS 5 km WITHDIST WITHCOORD

# Calculate distance between two locations
GEODIST locations "Marina Bay Sands" "Orchard Road" km`
};

export const pubsubExamples = {
  nodejs: `// Using node-redis
import { createClient } from 'redis';

const subscriber = createClient();
const publisher = createClient();

await subscriber.connect();
await publisher.connect();

// Subscribe to a channel
await subscriber.subscribe('notifications', (message) => {
  console.log('Received:', message);
});

// Publish a message
await publisher.publish('notifications', 'Hello, World!');`,

  python: `# Using redis-py
import redis

# Create separate clients for pub and sub
subscriber = redis.Redis(host='localhost', port=6379)
publisher = redis.Redis(host='localhost', port=6379)

# Create pubsub object
pubsub = subscriber.pubsub()

# Subscribe to channel
pubsub.subscribe('notifications')

# Publish message
publisher.publish('notifications', 'Hello, World!')

# Listen for messages
for message in pubsub.listen():
    if message['type'] == 'message':
        print(f"Received: {message['data']}")`,

  cli: `# Subscribe to a channel
SUBSCRIBE notifications

# In another terminal, publish a message
PUBLISH notifications "Hello, World!"

# Subscribe to multiple channels
SUBSCRIBE news sports weather

# Pattern-based subscription
PSUBSCRIBE news.*`
};

export const cachingExamples = {
  nodejs: `// Using node-redis
import { createClient } from 'redis';

const client = await createClient().connect();

// String operations
await client.set('user:1:name', 'John Doe', { EX: 3600 });
const name = await client.get('user:1:name');

// Hash operations
await client.hSet('user:1', {
  name: 'John Doe',
  email: 'john@example.com',
  age: '30'
});
const user = await client.hGetAll('user:1');

// List operations
await client.lPush('tasks', 'task1', 'task2');
const tasks = await client.lRange('tasks', 0, -1);

// Set operations
await client.sAdd('tags', 'redis', 'cache', 'database');
const tags = await client.sMembers('tags');`,

  python: `# Using redis-py
import redis

client = redis.Redis(host='localhost', port=6379)

# String operations
client.set('user:1:name', 'John Doe', ex=3600)
name = client.get('user:1:name')

# Hash operations
client.hset('user:1', mapping={
    'name': 'John Doe',
    'email': 'john@example.com',
    'age': '30'
})
user = client.hgetall('user:1')

# List operations
client.lpush('tasks', 'task1', 'task2')
tasks = client.lrange('tasks', 0, -1)

# Set operations
client.sadd('tags', 'redis', 'cache', 'database')
tags = client.smembers('tags')`,

  cli: `# String operations
SET user:1:name "John Doe" EX 3600
GET user:1:name

# Hash operations
HSET user:1 name "John Doe" email "john@example.com" age 30
HGETALL user:1

# List operations
LPUSH tasks "task1" "task2"
LRANGE tasks 0 -1

# Set operations
SADD tags "redis" "cache" "database"
SMEMBERS tags`
};

export const leaderboardExamples = {
  nodejs: `// Using node-redis
import { createClient } from 'redis';

const client = await createClient().connect();

// Add player score
await client.zAdd('leaderboard', {
  score: 1500,
  value: 'player1'
});

// Get top 10 players
const topPlayers = await client.zRangeWithScores(
  'leaderboard',
  0, 9,
  { REV: true }
);

// Get player rank
const rank = await client.zRevRank('leaderboard', 'player1');

// Increment score
await client.zIncrBy('leaderboard', 100, 'player1');`,

  python: `# Using redis-py
import redis

client = redis.Redis(host='localhost', port=6379)

# Add player score
client.zadd('leaderboard', {'player1': 1500})

# Get top 10 players
top_players = client.zrevrange(
    'leaderboard', 0, 9,
    withscores=True
)

# Get player rank
rank = client.zrevrank('leaderboard', 'player1')

# Increment score
client.zincrby('leaderboard', 100, 'player1')`,

  cli: `# Add player score
ZADD leaderboard 1500 "player1"

# Get top 10 players
ZREVRANGE leaderboard 0 9 WITHSCORES

# Get player rank
ZREVRANK leaderboard "player1"

# Increment score
ZINCRBY leaderboard 100 "player1"

# Get score range
ZRANGEBYSCORE leaderboard 1000 2000 WITHSCORES`
};

export const timeSeriesExamples = {
  nodejs: `// Using node-redis with RedisTimeSeries
import { createClient } from 'redis';

const client = await createClient().connect();

// Create time series
await client.sendCommand([
  'TS.CREATE', 'temperature',
  'LABELS', 'sensor', 'temp-1',
  'location', 'room-a'
]);

// Add data point
const timestamp = Date.now();
await client.sendCommand([
  'TS.ADD', 'temperature',
  timestamp.toString(),
  '25.5'
]);

// Query time range
const data = await client.sendCommand([
  'TS.RANGE', 'temperature',
  (timestamp - 3600000).toString(), // 1 hour ago
  timestamp.toString()
]);`,

  python: `# Using redis-py with RedisTimeSeries
import redis
import time

client = redis.Redis(host='localhost', port=6379)

# Create time series
client.execute_command(
    'TS.CREATE', 'temperature',
    'LABELS', 'sensor', 'temp-1',
    'location', 'room-a'
)

# Add data point
timestamp = int(time.time() * 1000)
client.execute_command(
    'TS.ADD', 'temperature',
    timestamp, 25.5
)

# Query time range
data = client.execute_command(
    'TS.RANGE', 'temperature',
    timestamp - 3600000,  # 1 hour ago
    timestamp
)`,

  cli: `# Create time series
TS.CREATE temperature LABELS sensor temp-1 location room-a

# Add data points
TS.ADD temperature * 25.5

# Query time range (last hour)
TS.RANGE temperature - +

# Get latest value
TS.GET temperature

# Aggregation
TS.RANGE temperature - + AGGREGATION avg 60000`
};

export const streamExamples = {
  nodejs: `// Using node-redis
import { createClient } from 'redis';

const client = await createClient().connect();

// Add message to stream
const messageId = await client.xAdd('events', '*', {
  user: 'john',
  action: 'login',
  timestamp: Date.now().toString()
});

// Read messages
const messages = await client.xRead(
  { key: 'events', id: '0' },
  { COUNT: 10 }
);

// Consumer group
await client.xGroupCreate('events', 'processors', '0', {
  MKSTREAM: true
});

const groupMessages = await client.xReadGroup(
  'processors', 'consumer1',
  { key: 'events', id: '>' },
  { COUNT: 10 }
);`,

  python: `# Using redis-py
import redis
import time

client = redis.Redis(host='localhost', port=6379)

# Add message to stream
message_id = client.xadd('events', {
    'user': 'john',
    'action': 'login',
    'timestamp': str(int(time.time() * 1000))
})

# Read messages
messages = client.xread({'events': '0'}, count=10)

# Consumer group
client.xgroup_create('events', 'processors', '0', mkstream=True)

group_messages = client.xreadgroup(
    'processors', 'consumer1',
    {'events': '>'}, count=10
)`,

  cli: `# Add message to stream
XADD events * user john action login timestamp 1234567890

# Read messages
XREAD COUNT 10 STREAMS events 0

# Create consumer group
XGROUP CREATE events processors 0 MKSTREAM

# Read as consumer
XREADGROUP GROUP processors consumer1 COUNT 10 STREAMS events >

# Acknowledge message
XACK events processors <message-id>`
};

export const rateLimitExamples = {
  nodejs: `// Using node-redis for rate limiting
import { createClient } from 'redis';

const client = await createClient().connect();

async function checkRateLimit(userId: string, limit: number = 10) {
  const key = \`ratelimit:\${userId}\`;
  const current = await client.incr(key);

  if (current === 1) {
    await client.expire(key, 60); // 1 minute window
  }

  return current <= limit;
}

// Usage
const allowed = await checkRateLimit('user123');
if (allowed) {
  console.log('Request allowed');
} else {
  console.log('Rate limit exceeded');
}`,

  python: `# Using redis-py for rate limiting
import redis

client = redis.Redis(host='localhost', port=6379)

def check_rate_limit(user_id, limit=10):
    key = f'ratelimit:{user_id}'
    current = client.incr(key)

    if current == 1:
        client.expire(key, 60)  # 1 minute window

    return current <= limit

# Usage
allowed = check_rate_limit('user123')
if allowed:
    print('Request allowed')
else:
    print('Rate limit exceeded')`,

  cli: `# Check and increment counter
INCR ratelimit:user123

# Set expiration if first request
EXPIRE ratelimit:user123 60

# Get current count
GET ratelimit:user123

# Using sliding window with sorted set
ZADD ratelimit:user123 <timestamp> <request-id>
ZREMRANGEBYSCORE ratelimit:user123 0 <old-timestamp>
ZCARD ratelimit:user123`
};

export const sessionExamples = {
  nodejs: `// Using node-redis for session management
import { createClient } from 'redis';

const client = await createClient().connect();

// Create session
const sessionId = 'session:' + crypto.randomUUID();
await client.set(sessionId, JSON.stringify({
  userId: '12345',
  username: 'john_doe',
  email: 'john@example.com',
  loginTime: Date.now()
}), { EX: 3600 }); // 1 hour expiration

// Get session
const sessionData = await client.get(sessionId);
const session = JSON.parse(sessionData);

// Update session
const updated = { ...session, lastActivity: Date.now() };
await client.set(sessionId, JSON.stringify(updated), { EX: 3600 });

// Delete session (logout)
await client.del(sessionId);`,

  python: `# Using redis-py for session management
import redis
import json
import uuid
import time

client = redis.Redis(host='localhost', port=6379)

# Create session
session_id = f'session:{uuid.uuid4()}'
session_data = {
    'userId': '12345',
    'username': 'john_doe',
    'email': 'john@example.com',
    'loginTime': int(time.time())
}
client.setex(session_id, 3600, json.dumps(session_data))

# Get session
session_json = client.get(session_id)
session = json.loads(session_json)

# Update session
session['lastActivity'] = int(time.time())
client.setex(session_id, 3600, json.dumps(session))

# Delete session (logout)
client.delete(session_id)`,

  cli: `# Create session with expiration
SET session:abc123 '{"userId":"12345","username":"john_doe"}' EX 3600

# Get session
GET session:abc123

# Update TTL
EXPIRE session:abc123 3600

# Delete session
DEL session:abc123

# Check if session exists
EXISTS session:abc123`
};

export const semanticCacheExamples = {
  nodejs: `// Semantic caching with vector embeddings
import { createClient } from 'redis';

const client = await createClient().connect();

// Generate embedding (using OpenAI or similar)
async function getEmbedding(text) {
  // Call embedding API
  return [0.1, 0.2, 0.3, ...]; // example vector
}

// Cache response with semantic search
async function semanticCache(query) {
  const embedding = await getEmbedding(query);

  // Search for similar queries
  const results = await client.ft.search(
    'idx:semantic',
    '*=>[KNN 1 @embedding $BLOB AS score]',
    {
      PARAMS: { BLOB: Buffer.from(new Float32Array(embedding).buffer) },
      DIALECT: 2
    }
  );

  if (results.total > 0 && results.documents[0].score < 0.1) {
    // Cache hit - return cached response
    return results.documents[0].value.response;
  }

  // Cache miss - get new response
  const response = await generateResponse(query);

  // Store with embedding
  await client.json.set(\`cache:\${Date.now()}\`, '$', {
    query,
    response,
    embedding
  });

  return response;
}`,

  python: `# Semantic caching with vector embeddings
import redis
import numpy as np

client = redis.Redis(host='localhost', port=6379)

def get_embedding(text):
    # Call embedding API (OpenAI, etc.)
    return np.array([0.1, 0.2, 0.3, ...])

def semantic_cache(query):
    embedding = get_embedding(query)

    # Search for similar queries
    results = client.ft().search(
        '*=>[KNN 1 @embedding $BLOB AS score]',
        query_params={'BLOB': embedding.tobytes()}
    )

    if results.total > 0 and float(results.docs[0].score) < 0.1:
        # Cache hit
        return results.docs[0].response

    # Cache miss - generate and store
    response = generate_response(query)

    client.json().set(f'cache:{time.time()}', '$', {
        'query': query,
        'response': response,
        'embedding': embedding.tolist()
    })

    return response`,

  cli: `# Create vector search index
FT.CREATE idx:semantic ON JSON PREFIX 1 cache: SCHEMA
  $.embedding AS embedding VECTOR HNSW 6 DIM 1536 DISTANCE_METRIC COSINE

# Store cached response with embedding
JSON.SET cache:1 $ '{"query":"hello","response":"Hi there!","embedding":[...]}'

# Search for similar queries
FT.SEARCH idx:semantic "*=>[KNN 1 @embedding $BLOB]"
  PARAMS 2 BLOB <binary_embedding> DIALECT 2`
};

export const probabilisticExamples = {
  nodejs: `// Probabilistic data structures
import { createClient } from 'redis';

const client = await createClient().connect();

// HyperLogLog - Unique visitor counting
await client.pfAdd('visitors:2024-01-15', ['user1', 'user2', 'user3']);
const uniqueCount = await client.pfCount('visitors:2024-01-15');

// Merge multiple days
await client.pfMerge('visitors:week', [
  'visitors:2024-01-15',
  'visitors:2024-01-16',
  'visitors:2024-01-17'
]);

// Bloom Filter (using RedisBloom module)
await client.bf.add('emails', 'user@example.com');
const exists = await client.bf.exists('emails', 'user@example.com'); // true
const notExists = await client.bf.exists('emails', 'other@example.com'); // probably false

// Count-Min Sketch - Frequency estimation
await client.cms.incrBy('page_views', ['home', 'about', 'contact'], [10, 5, 3]);
const homeViews = await client.cms.query('page_views', 'home');`,

  python: `# Probabilistic data structures
import redis

client = redis.Redis(host='localhost', port=6379)

# HyperLogLog - Unique visitor counting
client.pfadd('visitors:2024-01-15', 'user1', 'user2', 'user3')
unique_count = client.pfcount('visitors:2024-01-15')

# Merge multiple days
client.pfmerge('visitors:week',
    'visitors:2024-01-15',
    'visitors:2024-01-16',
    'visitors:2024-01-17'
)

# Bloom Filter (using RedisBloom module)
client.execute_command('BF.ADD', 'emails', 'user@example.com')
exists = client.execute_command('BF.EXISTS', 'emails', 'user@example.com')

# Count-Min Sketch
client.execute_command('CMS.INCRBY', 'page_views', 'home', 10)
home_views = client.execute_command('CMS.QUERY', 'page_views', 'home')`,

  cli: `# HyperLogLog - Unique counting
PFADD visitors:2024-01-15 user1 user2 user3
PFCOUNT visitors:2024-01-15

# Merge HyperLogLogs
PFMERGE visitors:week visitors:2024-01-15 visitors:2024-01-16

# Bloom Filter
BF.ADD emails user@example.com
BF.EXISTS emails user@example.com

# Count-Min Sketch
CMS.INCRBY page_views home 10 about 5
CMS.QUERY page_views home`
};

export const featureStoreExamples = {
  nodejs: `// Feature store for ML models
import { createClient } from 'redis';

const client = await createClient().connect();

// Store user features
await client.json.set('features:user:12345', '$', {
  userId: '12345',
  features: {
    transactionCount24h: 15,
    avgTransactionAmount: 125.50,
    accountAge: 730,
    lastLoginHours: 2,
    fraudScore: 0.05
  },
  timestamp: Date.now()
});

// Retrieve features for prediction
const userFeatures = await client.json.get('features:user:12345', {
  path: '$.features'
});

// Batch feature retrieval
const pipeline = client.multi();
['user:123', 'user:456', 'user:789'].forEach(key => {
  pipeline.json.get(\`features:\${key}\`, { path: '$.features' });
});
const batchFeatures = await pipeline.exec();

// Update specific feature
await client.json.numIncrBy('features:user:12345', '$.features.transactionCount24h', 1);`,

  python: `# Feature store for ML models
import redis
import json

client = redis.Redis(host='localhost', port=6379)

# Store user features
features = {
    'userId': '12345',
    'features': {
        'transactionCount24h': 15,
        'avgTransactionAmount': 125.50,
        'accountAge': 730,
        'lastLoginHours': 2,
        'fraudScore': 0.05
    },
    'timestamp': time.time()
}
client.json().set('features:user:12345', '$', features)

# Retrieve features for prediction
user_features = client.json().get('features:user:12345', '$.features')

# Batch feature retrieval
pipe = client.pipeline()
for user_id in ['123', '456', '789']:
    pipe.json().get(f'features:user:{user_id}', '$.features')
batch_features = pipe.execute()

# Update specific feature
client.json().numincrby('features:user:12345', '$.features.transactionCount24h', 1)`,

  cli: `# Store user features
JSON.SET features:user:12345 $ '{"userId":"12345","features":{"transactionCount24h":15,"avgTransactionAmount":125.50}}'

# Get features
JSON.GET features:user:12345 $.features

# Update specific feature
JSON.NUMINCRBY features:user:12345 $.features.transactionCount24h 1

# Get multiple features
JSON.MGET features:user:123 features:user:456 $.features`
};
