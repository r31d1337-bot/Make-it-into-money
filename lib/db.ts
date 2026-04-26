import Database from "better-sqlite3";
import path from "path";
import { promises as fs } from "fs";
import { mkdirSync } from "fs";

/**
 * Single SQLite connection used by the whole app. Persists at .data/mintr.db
 * unless DATABASE_PATH is set. better-sqlite3 is synchronous, which is fine
 * inside Next.js API route handlers — every query is microseconds.
 *
 * Schema lives here too: tables are created on first connect and migrations
 * run idempotently. We keep schema changes additive (new columns / tables) so
 * older code keeps working.
 */

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), ".data", "mintr.db");

let _db: Database.Database | null = null;

export function db(): Database.Database {
  if (_db) return _db;

  // Ensure parent directory exists. Synchronous — runs once at startup.
  mkdirSync(path.dirname(DB_PATH), { recursive: true });

  const conn = new Database(DB_PATH);
  conn.pragma("journal_mode = WAL"); // better concurrency
  conn.pragma("synchronous = NORMAL"); // good durability/perf tradeoff
  conn.pragma("foreign_keys = ON");

  initSchema(conn);

  _db = conn;
  return conn;
}

function initSchema(conn: Database.Database) {
  conn.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      email_verified_at INTEGER,
      is_pro INTEGER NOT NULL DEFAULT 0,
      pro_since INTEGER,
      pro_plan TEXT,
      pro_expires_at INTEGER,
      stripe_customer_id TEXT,
      stripe_subscription_id TEXT,
      cancel_at_period_end INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
    CREATE INDEX IF NOT EXISTS users_stripe_customer_idx ON users(stripe_customer_id);

    CREATE TABLE IF NOT EXISTS shares (
      id TEXT PRIMARY KEY,
      idea TEXT NOT NULL,
      context TEXT,        -- JSON
      messages TEXT NOT NULL, -- JSON array
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS shares_created_idx ON shares(created_at DESC);

    CREATE TABLE IF NOT EXISTS verify_tokens (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      used_at INTEGER
    );
    CREATE INDEX IF NOT EXISTS verify_tokens_user_idx ON verify_tokens(user_id);

    CREATE TABLE IF NOT EXISTS reset_tokens (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      used_at INTEGER
    );
    CREATE INDEX IF NOT EXISTS reset_tokens_user_idx ON reset_tokens(user_id);
  `);
}

/**
 * One-time backup: copies the SQLite db to a timestamped path. Used by the
 * nightly backup script. Atomic — uses SQLite's online backup API so the file
 * is consistent even if writes are happening at the same time.
 */
export async function backupTo(targetPath: string): Promise<void> {
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  const conn = db();
  await conn.backup(targetPath);
}
