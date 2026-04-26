#!/usr/bin/env node
/**
 * One-shot migration: read the legacy .data/*.json files (users, shares,
 * verify/reset tokens) and copy them into .data/mintr.db.
 *
 * Idempotent — uses INSERT OR IGNORE so re-running won't duplicate rows.
 * After successful import the JSON files are renamed to *.json.bak so they
 * won't be re-imported but stay around for a day or two as belt-and-braces.
 *
 * Run on the droplet AFTER `git pull` and BEFORE `pm2 restart mintr`:
 *   cd /opt/mintr
 *   node scripts/migrate-json-to-sqlite.mjs
 *
 * Local dev: same command.
 */

import Database from "better-sqlite3";
import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_PATH = process.env.DATABASE_PATH || path.join(DATA_DIR, "mintr.db");

async function readJsonOrEmpty(p, fallback) {
  try {
    const raw = await fs.readFile(p, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === "ENOENT") return fallback;
    throw err;
  }
}

async function backupAndRename(p) {
  try {
    await fs.rename(p, `${p}.bak`);
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
  }
}

function ensureSchema(db) {
  db.exec(`
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
      context TEXT,
      messages TEXT NOT NULL,
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

async function migrateUsers(db) {
  const file = path.join(DATA_DIR, "users.json");
  const users = await readJsonOrEmpty(file, []);
  if (!users.length) return 0;
  const insert = db.prepare(
    `INSERT OR IGNORE INTO users (
       id, email, password_hash, created_at, email_verified_at,
       is_pro, pro_since, pro_plan, pro_expires_at,
       stripe_customer_id, stripe_subscription_id, cancel_at_period_end
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const tx = db.transaction((rows) => {
    for (const u of rows) {
      insert.run(
        u.id,
        u.email,
        u.passwordHash,
        u.createdAt,
        u.emailVerifiedAt ?? null,
        u.isPro ? 1 : 0,
        u.proSince ?? null,
        u.proPlan ?? null,
        u.proExpiresAt ?? null,
        u.stripeCustomerId ?? null,
        u.stripeSubscriptionId ?? null,
        u.cancelAtPeriodEnd ? 1 : 0,
      );
    }
  });
  tx(users);
  await backupAndRename(file);
  return users.length;
}

async function migrateShares(db) {
  const dir = path.join(DATA_DIR, "shares");
  let files;
  try {
    files = await fs.readdir(dir);
  } catch (err) {
    if (err.code === "ENOENT") return 0;
    throw err;
  }
  const insert = db.prepare(
    `INSERT OR IGNORE INTO shares (id, idea, context, messages, created_at)
     VALUES (?, ?, ?, ?, ?)`,
  );
  let count = 0;
  for (const name of files) {
    if (!name.endsWith(".json")) continue;
    try {
      const raw = await fs.readFile(path.join(dir, name), "utf8");
      const plan = JSON.parse(raw);
      insert.run(
        plan.id,
        plan.idea,
        plan.context ? JSON.stringify(plan.context) : null,
        JSON.stringify(plan.messages),
        plan.createdAt,
      );
      count++;
    } catch (err) {
      console.warn(`  ⚠ skipped ${name}: ${err.message}`);
    }
  }
  if (count > 0) {
    await fs.rename(dir, `${dir}.bak`).catch(() => {});
  }
  return count;
}

async function migrateTokens(db, file, table) {
  const filePath = path.join(DATA_DIR, file);
  const tokens = await readJsonOrEmpty(filePath, []);
  if (!tokens.length) return 0;
  const insert = db.prepare(
    `INSERT OR IGNORE INTO ${table} (token_hash, user_id, expires_at, used_at)
     VALUES (?, ?, ?, ?)`,
  );
  const tx = db.transaction((rows) => {
    for (const t of rows) {
      insert.run(t.tokenHash, t.userId, t.expiresAt, t.usedAt ?? null);
    }
  });
  tx(tokens);
  await backupAndRename(filePath);
  return tokens.length;
}

async function main() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  ensureSchema(db);

  console.log(`→ migrating to ${DB_PATH}`);
  const users = await migrateUsers(db);
  console.log(`  users:           ${users}`);
  const shares = await migrateShares(db);
  console.log(`  shares:          ${shares}`);
  const verify = await migrateTokens(db, "email-verify-tokens.json", "verify_tokens");
  console.log(`  verify tokens:   ${verify}`);
  const reset = await migrateTokens(db, "password-reset-tokens.json", "reset_tokens");
  console.log(`  reset tokens:    ${reset}`);

  // Sanity counts from the live db
  const counts = {
    users: db.prepare("SELECT COUNT(*) AS n FROM users").get().n,
    shares: db.prepare("SELECT COUNT(*) AS n FROM shares").get().n,
    verify: db.prepare("SELECT COUNT(*) AS n FROM verify_tokens").get().n,
    reset: db.prepare("SELECT COUNT(*) AS n FROM reset_tokens").get().n,
  };
  console.log(`\n✓ db now contains:`);
  console.log(`  users:           ${counts.users}`);
  console.log(`  shares:          ${counts.shares}`);
  console.log(`  verify tokens:   ${counts.verify}`);
  console.log(`  reset tokens:    ${counts.reset}`);
  db.close();
}

main().catch((err) => {
  console.error("\n✗ migration failed:", err.message);
  process.exit(1);
});
