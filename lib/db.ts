import { Pool } from 'pg';

// PostgreSQL connection configuration (same as RDI demo)
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'rdi-rds-pg-xw-y5vdps.cd8u51tyxbit.ap-southeast-1.rds.amazonaws.com',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'rdi_tag_team_demo',
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: {
    rejectUnauthorized: false // Required for AWS RDS and most cloud PostgreSQL instances
  }
});

// Test the connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database for cache demo');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client (cache demo)', err);
});

// Simulate network latency for realistic demo comparison
// In production, your DB would be on a remote server with network latency
const SIMULATE_NETWORK_LATENCY_MS = 50; // 50ms simulates typical database network latency

/**
 * Simulates network latency by introducing an artificial delay
 * This makes the demo more realistic by simulating a remote database
 */
const simulateNetworkLatency = async () => {
  if (SIMULATE_NETWORK_LATENCY_MS > 0) {
    await new Promise(resolve => setTimeout(resolve, SIMULATE_NETWORK_LATENCY_MS));
  }
};

// Initialize database schema
const initializeSchema = async () => {
  try {
    // Create cache schema if it doesn't exist
    await pool.query('CREATE SCHEMA IF NOT EXISTS cache');

    // Create tables for different cache types
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cache.cache_strings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        created_at BIGINT NOT NULL,
        updated_at BIGINT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS cache.cache_hashes (
        id SERIAL PRIMARY KEY,
        hash_key TEXT NOT NULL,
        field TEXT NOT NULL,
        value TEXT NOT NULL,
        created_at BIGINT NOT NULL,
        updated_at BIGINT NOT NULL,
        UNIQUE(hash_key, field)
      );

      CREATE INDEX IF NOT EXISTS idx_hash_key ON cache.cache_hashes(hash_key);

      CREATE TABLE IF NOT EXISTS cache.cache_lists (
        id SERIAL PRIMARY KEY,
        list_key TEXT NOT NULL,
        value TEXT NOT NULL,
        position INTEGER NOT NULL,
        created_at BIGINT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_list_key ON cache.cache_lists(list_key);

      CREATE TABLE IF NOT EXISTS cache.cache_sets (
        id SERIAL PRIMARY KEY,
        set_key TEXT NOT NULL,
        member TEXT NOT NULL,
        created_at BIGINT NOT NULL,
        UNIQUE(set_key, member)
      );

      CREATE INDEX IF NOT EXISTS idx_set_key ON cache.cache_sets(set_key);

      CREATE TABLE IF NOT EXISTS cache.cache_sorted_sets (
        id SERIAL PRIMARY KEY,
        zset_key TEXT NOT NULL,
        member TEXT NOT NULL,
        score DOUBLE PRECISION NOT NULL,
        created_at BIGINT NOT NULL,
        updated_at BIGINT NOT NULL,
        UNIQUE(zset_key, member)
      );

      CREATE INDEX IF NOT EXISTS idx_zset_key ON cache.cache_sorted_sets(zset_key);
      CREATE INDEX IF NOT EXISTS idx_zset_score ON cache.cache_sorted_sets(zset_key, score DESC);
    `);

    console.log('Cache demo PostgreSQL schema initialized successfully');
  } catch (error) {
    console.error('Error initializing cache demo schema:', error);
    throw error;
  }
};

// Initialize schema on module load
initializeSchema();

export default pool;

// Helper functions for common operations
export const dbHelpers = {
  // String operations
  setString: async (key: string, value: string) => {
    await simulateNetworkLatency();
    const now = Date.now();
    await pool.query(`
      INSERT INTO cache.cache_strings (key, value, created_at, updated_at)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT(key) DO UPDATE SET value = $2, updated_at = $4
    `, [key, value, now, now]);
  },

  getString: async (key: string): Promise<string | null> => {
    await simulateNetworkLatency();
    const result = await pool.query('SELECT value FROM cache.cache_strings WHERE key = $1', [key]);
    return result.rows[0]?.value || null;
  },

  // Hash operations
  setHash: async (key: string, field: string, value: string) => {
    await simulateNetworkLatency();
    const now = Date.now();
    await pool.query(`
      INSERT INTO cache.cache_hashes (hash_key, field, value, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT(hash_key, field) DO UPDATE SET value = $3, updated_at = $5
    `, [key, field, value, now, now]);
  },

  getHash: async (key: string, field: string): Promise<string | null> => {
    await simulateNetworkLatency();
    const result = await pool.query('SELECT value FROM cache.cache_hashes WHERE hash_key = $1 AND field = $2', [key, field]);
    return result.rows[0]?.value || null;
  },

  getAllHash: async (key: string): Promise<Record<string, string>> => {
    await simulateNetworkLatency();
    const result = await pool.query('SELECT field, value FROM cache.cache_hashes WHERE hash_key = $1', [key]);
    return result.rows.reduce((acc, { field, value }) => {
      acc[field] = value;
      return acc;
    }, {} as Record<string, string>);
  },

  // List operations
  pushList: async (key: string, value: string) => {
    await simulateNetworkLatency();
    const posResult = await pool.query('SELECT COALESCE(MAX(position), -1) + 1 as next_pos FROM cache.cache_lists WHERE list_key = $1', [key]);
    const next_pos = posResult.rows[0].next_pos;
    await pool.query('INSERT INTO cache.cache_lists (list_key, value, position, created_at) VALUES ($1, $2, $3, $4)', [key, value, next_pos, Date.now()]);
  },

  getList: async (key: string, start: number = 0, end: number = -1): Promise<string[]> => {
    await simulateNetworkLatency();
    const result = await pool.query('SELECT value FROM cache.cache_lists WHERE list_key = $1 ORDER BY position', [key]);
    const values = result.rows.map(r => r.value);

    if (end === -1) end = values.length - 1;
    return values.slice(start, end + 1);
  },

  // Set operations
  addSet: async (key: string, member: string) => {
    await simulateNetworkLatency();
    await pool.query(`
      INSERT INTO cache.cache_sets (set_key, member, created_at)
      VALUES ($1, $2, $3)
      ON CONFLICT(set_key, member) DO NOTHING
    `, [key, member, Date.now()]);
  },

  getSet: async (key: string): Promise<string[]> => {
    await simulateNetworkLatency();
    const result = await pool.query('SELECT member FROM cache.cache_sets WHERE set_key = $1', [key]);
    return result.rows.map(r => r.member);
  },

  isMemberSet: async (key: string, member: string): Promise<boolean> => {
    await simulateNetworkLatency();
    const result = await pool.query('SELECT 1 FROM cache.cache_sets WHERE set_key = $1 AND member = $2', [key, member]);
    return result.rows.length > 0;
  },

  // Sorted Set operations
  addSortedSet: async (key: string, member: string, score: number) => {
    await simulateNetworkLatency();
    const now = Date.now();
    await pool.query(`
      INSERT INTO cache.cache_sorted_sets (zset_key, member, score, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT(zset_key, member) DO UPDATE SET score = $3, updated_at = $5
    `, [key, member, score, now, now]);
  },

  getSortedSet: async (key: string, start: number = 0, end: number = -1, reverse: boolean = false): Promise<Array<{ member: string; score: number }>> => {
    await simulateNetworkLatency();
    const order = reverse ? 'DESC' : 'ASC';
    const result = await pool.query(`SELECT member, score FROM cache.cache_sorted_sets WHERE zset_key = $1 ORDER BY score ${order}`, [key]);

    if (end === -1) end = result.rows.length - 1;
    return result.rows.slice(start, end + 1);
  },

  getRankSortedSet: async (key: string, member: string): Promise<number | null> => {
    await simulateNetworkLatency();
    const result = await pool.query(`
      SELECT COUNT(*) as rank FROM cache.cache_sorted_sets
      WHERE zset_key = $1 AND score > (
        SELECT score FROM cache.cache_sorted_sets WHERE zset_key = $1 AND member = $2
      )
    `, [key, member]);
    return result.rows[0] ? parseInt(result.rows[0].rank) : null;
  },

  getScoreSortedSet: async (key: string, member: string): Promise<number | null> => {
    await simulateNetworkLatency();
    const result = await pool.query('SELECT score FROM cache.cache_sorted_sets WHERE zset_key = $1 AND member = $2', [key, member]);
    return result.rows[0]?.score ?? null;
  },

  // Clear operations
  clearString: async (key: string) => {
    await pool.query('DELETE FROM cache.cache_strings WHERE key = $1', [key]);
  },

  clearHash: async (key: string) => {
    await pool.query('DELETE FROM cache.cache_hashes WHERE hash_key = $1', [key]);
  },

  clearList: async (key: string) => {
    await pool.query('DELETE FROM cache.cache_lists WHERE list_key = $1', [key]);
  },

  clearSet: async (key: string) => {
    await pool.query('DELETE FROM cache.cache_sets WHERE set_key = $1', [key]);
  },

  clearSortedSet: async (key: string) => {
    await pool.query('DELETE FROM cache.cache_sorted_sets WHERE zset_key = $1', [key]);
  },
};
