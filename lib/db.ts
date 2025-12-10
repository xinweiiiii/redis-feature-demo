import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'demo.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

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

// Create tables for different cache types
db.exec(`
  CREATE TABLE IF NOT EXISTS cache_strings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS cache_hashes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hash_key TEXT NOT NULL,
    field TEXT NOT NULL,
    value TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    UNIQUE(hash_key, field)
  );

  CREATE INDEX IF NOT EXISTS idx_hash_key ON cache_hashes(hash_key);

  CREATE TABLE IF NOT EXISTS cache_lists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    list_key TEXT NOT NULL,
    value TEXT NOT NULL,
    position INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_list_key ON cache_lists(list_key);

  CREATE TABLE IF NOT EXISTS cache_sets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    set_key TEXT NOT NULL,
    member TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    UNIQUE(set_key, member)
  );

  CREATE INDEX IF NOT EXISTS idx_set_key ON cache_sets(set_key);

  CREATE TABLE IF NOT EXISTS cache_sorted_sets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    zset_key TEXT NOT NULL,
    member TEXT NOT NULL,
    score REAL NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    UNIQUE(zset_key, member)
  );

  CREATE INDEX IF NOT EXISTS idx_zset_key ON cache_sorted_sets(zset_key);
  CREATE INDEX IF NOT EXISTS idx_zset_score ON cache_sorted_sets(zset_key, score DESC);
`);

export default db;

// Helper functions for common operations
export const dbHelpers = {
  // String operations
  setString: async (key: string, value: string) => {
    await simulateNetworkLatency();
    const now = Date.now();
    const stmt = db.prepare(`
      INSERT INTO cache_strings (key, value, created_at, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = ?
    `);
    stmt.run(key, value, now, now, value, now);
  },

  getString: async (key: string): Promise<string | null> => {
    await simulateNetworkLatency();
    const stmt = db.prepare('SELECT value FROM cache_strings WHERE key = ?');
    const result = stmt.get(key) as { value: string } | undefined;
    return result?.value || null;
  },

  // Hash operations
  setHash: async (key: string, field: string, value: string) => {
    await simulateNetworkLatency();
    const now = Date.now();
    const stmt = db.prepare(`
      INSERT INTO cache_hashes (hash_key, field, value, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(hash_key, field) DO UPDATE SET value = ?, updated_at = ?
    `);
    stmt.run(key, field, value, now, now, value, now);
  },

  getHash: async (key: string, field: string): Promise<string | null> => {
    await simulateNetworkLatency();
    const stmt = db.prepare('SELECT value FROM cache_hashes WHERE hash_key = ? AND field = ?');
    const result = stmt.get(key, field) as { value: string } | undefined;
    return result?.value || null;
  },

  getAllHash: async (key: string): Promise<Record<string, string>> => {
    await simulateNetworkLatency();
    const stmt = db.prepare('SELECT field, value FROM cache_hashes WHERE hash_key = ?');
    const results = stmt.all(key) as Array<{ field: string; value: string }>;
    return results.reduce((acc, { field, value }) => {
      acc[field] = value;
      return acc;
    }, {} as Record<string, string>);
  },

  // List operations
  pushList: async (key: string, value: string) => {
    await simulateNetworkLatency();
    const stmt = db.prepare('SELECT COALESCE(MAX(position), -1) + 1 as next_pos FROM cache_lists WHERE list_key = ?');
    const { next_pos } = stmt.get(key) as { next_pos: number };
    const insertStmt = db.prepare('INSERT INTO cache_lists (list_key, value, position, created_at) VALUES (?, ?, ?, ?)');
    insertStmt.run(key, value, next_pos, Date.now());
  },

  getList: async (key: string, start: number = 0, end: number = -1): Promise<string[]> => {
    await simulateNetworkLatency();
    let query = 'SELECT value FROM cache_lists WHERE list_key = ? ORDER BY position';
    const stmt = db.prepare(query);
    const results = stmt.all(key) as Array<{ value: string }>;

    if (end === -1) end = results.length - 1;
    return results.slice(start, end + 1).map(r => r.value);
  },

  // Set operations
  addSet: async (key: string, member: string) => {
    await simulateNetworkLatency();
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO cache_sets (set_key, member, created_at)
      VALUES (?, ?, ?)
    `);
    stmt.run(key, member, Date.now());
  },

  getSet: async (key: string): Promise<string[]> => {
    await simulateNetworkLatency();
    const stmt = db.prepare('SELECT member FROM cache_sets WHERE set_key = ?');
    const results = stmt.all(key) as Array<{ member: string }>;
    return results.map(r => r.member);
  },

  isMemberSet: async (key: string, member: string): Promise<boolean> => {
    await simulateNetworkLatency();
    const stmt = db.prepare('SELECT 1 FROM cache_sets WHERE set_key = ? AND member = ?');
    return stmt.get(key, member) !== undefined;
  },

  // Sorted Set operations
  addSortedSet: async (key: string, member: string, score: number) => {
    await simulateNetworkLatency();
    const now = Date.now();
    const stmt = db.prepare(`
      INSERT INTO cache_sorted_sets (zset_key, member, score, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(zset_key, member) DO UPDATE SET score = ?, updated_at = ?
    `);
    stmt.run(key, member, score, now, now, score, now);
  },

  getSortedSet: async (key: string, start: number = 0, end: number = -1, reverse: boolean = false): Promise<Array<{ member: string; score: number }>> => {
    await simulateNetworkLatency();
    const order = reverse ? 'DESC' : 'ASC';
    const stmt = db.prepare(`SELECT member, score FROM cache_sorted_sets WHERE zset_key = ? ORDER BY score ${order}`);
    const results = stmt.all(key) as Array<{ member: string; score: number }>;

    if (end === -1) end = results.length - 1;
    return results.slice(start, end + 1);
  },

  getRankSortedSet: async (key: string, member: string): Promise<number | null> => {
    await simulateNetworkLatency();
    const stmt = db.prepare(`
      SELECT COUNT(*) as rank FROM cache_sorted_sets
      WHERE zset_key = ? AND score > (
        SELECT score FROM cache_sorted_sets WHERE zset_key = ? AND member = ?
      )
    `);
    const result = stmt.get(key, key, member) as { rank: number } | undefined;
    return result !== undefined ? result.rank : null;
  },

  getScoreSortedSet: async (key: string, member: string): Promise<number | null> => {
    await simulateNetworkLatency();
    const stmt = db.prepare('SELECT score FROM cache_sorted_sets WHERE zset_key = ? AND member = ?');
    const result = stmt.get(key, member) as { score: number } | undefined;
    return result?.score ?? null;
  },

  // Clear operations
  clearString: (key: string) => {
    const stmt = db.prepare('DELETE FROM cache_strings WHERE key = ?');
    stmt.run(key);
  },

  clearHash: (key: string) => {
    const stmt = db.prepare('DELETE FROM cache_hashes WHERE hash_key = ?');
    stmt.run(key);
  },

  clearList: (key: string) => {
    const stmt = db.prepare('DELETE FROM cache_lists WHERE list_key = ?');
    stmt.run(key);
  },

  clearSet: (key: string) => {
    const stmt = db.prepare('DELETE FROM cache_sets WHERE set_key = ?');
    stmt.run(key);
  },

  clearSortedSet: (key: string) => {
    const stmt = db.prepare('DELETE FROM cache_sorted_sets WHERE zset_key = ?');
    stmt.run(key);
  },
};
