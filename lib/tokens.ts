import { randomBytes, createHash, timingSafeEqual } from "crypto";
import { db } from "./db";

/**
 * Single-use, time-bounded tokens for email verification and password reset.
 *
 * SQLite-backed. Two tables: verify_tokens (7-day TTL) and reset_tokens (1-hour
 * TTL). Only token hashes are stored; the raw value is in the email link.
 */

export const VERIFY_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const RESET_TTL_MS = 60 * 60 * 1000;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function constantTimeHashEq(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  try {
    return timingSafeEqual(ab, bb);
  } catch {
    return false;
  }
}

type TokenRow = {
  token_hash: string;
  user_id: string;
  expires_at: number;
  used_at: number | null;
};

function createToken(table: "verify_tokens" | "reset_tokens", userId: string, ttlMs: number): string {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const expiresAt = Date.now() + ttlMs;
  const conn = db();
  // Invalidate any prior pending tokens for this user — keeps mailbox stockpiles down.
  conn.prepare(`DELETE FROM ${table} WHERE user_id = ?`).run(userId);
  conn
    .prepare(
      `INSERT INTO ${table} (token_hash, user_id, expires_at) VALUES (?, ?, ?)`,
    )
    .run(tokenHash, userId, expiresAt);
  return token;
}

function consumeToken(table: "verify_tokens" | "reset_tokens", rawToken: string): string | null {
  if (!rawToken || rawToken.length < 8) return null;
  const hash = hashToken(rawToken);
  const conn = db();
  // Pull all candidate rows whose hash MIGHT match — there's only one in
  // practice (PK on token_hash). We still constant-time compare just in case.
  const row = conn
    .prepare(`SELECT * FROM ${table} WHERE token_hash = ?`)
    .get(hash) as TokenRow | undefined;
  if (!row || row.used_at) return null;
  if (row.expires_at <= Date.now()) return null;
  if (!constantTimeHashEq(row.token_hash, hash)) return null;
  // Mark used.
  conn.prepare(`UPDATE ${table} SET used_at = ? WHERE token_hash = ?`).run(Date.now(), hash);
  return row.user_id;
}

export function createVerificationToken(userId: string): Promise<string> {
  return Promise.resolve(createToken("verify_tokens", userId, VERIFY_TTL_MS));
}

export function consumeVerificationToken(token: string): Promise<string | null> {
  return Promise.resolve(consumeToken("verify_tokens", token));
}

export function createResetToken(userId: string): Promise<string> {
  return Promise.resolve(createToken("reset_tokens", userId, RESET_TTL_MS));
}

export function consumeResetToken(token: string): Promise<string | null> {
  return Promise.resolve(consumeToken("reset_tokens", token));
}
