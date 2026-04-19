import { promises as fs } from "fs";
import path from "path";
import { randomBytes, createHash, timingSafeEqual } from "crypto";

/**
 * Single-use, time-bounded tokens for email verification and password reset.
 *
 * Two stores:
 *   .data/email-verify-tokens.json  — 7-day expiry
 *   .data/password-reset-tokens.json — 1-hour expiry
 *
 * We only persist SHA-256 hashes of tokens, never the raw value. Tokens are
 * 32 random bytes encoded as base64url — ~43 chars, safe in URLs.
 *
 * File-backed for now; swap for the DB when we move off the JSON store.
 */

const DATA_DIR = path.join(process.cwd(), ".data");
const VERIFY_FILE = path.join(DATA_DIR, "email-verify-tokens.json");
const RESET_FILE = path.join(DATA_DIR, "password-reset-tokens.json");

export const VERIFY_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const RESET_TTL_MS = 60 * 60 * 1000;

type TokenRecord = {
  userId: string;
  tokenHash: string; // sha256 of the raw token
  expiresAt: number;
  usedAt?: number;
};

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

async function loadTokens(file: string): Promise<TokenRecord[]> {
  try {
    const raw = await fs.readFile(file, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as TokenRecord[]) : [];
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
}

async function saveTokens(file: string, tokens: TokenRecord[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  // Prune expired + used tokens so the file stays small.
  const now = Date.now();
  const keep = tokens.filter((t) => !t.usedAt && t.expiresAt > now);
  await fs.writeFile(file, JSON.stringify(keep, null, 2), "utf8");
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

async function createToken(
  file: string,
  userId: string,
  ttlMs: number,
): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const record: TokenRecord = {
    userId,
    tokenHash: hashToken(token),
    expiresAt: Date.now() + ttlMs,
  };
  const tokens = await loadTokens(file);
  // Invalidate any prior pending tokens for this user to prevent a stockpile.
  const fresh = tokens.filter((t) => t.userId !== userId);
  fresh.push(record);
  await saveTokens(file, fresh);
  return token;
}

async function consumeToken(file: string, rawToken: string): Promise<string | null> {
  if (!rawToken || rawToken.length < 8) return null;
  const hash = hashToken(rawToken);
  const tokens = await loadTokens(file);
  const now = Date.now();
  const idx = tokens.findIndex(
    (t) =>
      !t.usedAt &&
      t.expiresAt > now &&
      constantTimeHashEq(t.tokenHash, hash),
  );
  if (idx < 0) return null;
  const record = tokens[idx];
  tokens[idx] = { ...record, usedAt: now };
  await saveTokens(file, tokens);
  return record.userId;
}

export function createVerificationToken(userId: string): Promise<string> {
  return createToken(VERIFY_FILE, userId, VERIFY_TTL_MS);
}

export function consumeVerificationToken(token: string): Promise<string | null> {
  return consumeToken(VERIFY_FILE, token);
}

export function createResetToken(userId: string): Promise<string> {
  return createToken(RESET_FILE, userId, RESET_TTL_MS);
}

export function consumeResetToken(token: string): Promise<string | null> {
  return consumeToken(RESET_FILE, token);
}
