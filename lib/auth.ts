import { createHmac, scrypt, randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { db } from "./db";

/**
 * Auth + user store, backed by SQLite (lib/db.ts). Functions still use the
 * `User` shape the rest of the app expects; serialization to/from rows
 * happens here.
 */

export type ProPlan = "monthly" | "yearly" | "lifetime";

export type User = {
  id: string;
  email: string;
  passwordHash: string; // "salt:hex-derived-key"
  createdAt: number;
  /** Epoch ms when the user clicked their verification email. null = unverified. */
  emailVerifiedAt?: number | null;
  isPro?: boolean;
  proSince?: number | null;
  proPlan?: ProPlan | null;
  /** Epoch ms; null = lifetime / no expiry. */
  proExpiresAt?: number | null;
  /** Stripe customer ID (cus_...). Set when a checkout session starts. */
  stripeCustomerId?: string | null;
  /** Stripe subscription ID (sub_...) for monthly/yearly. Null for lifetime. */
  stripeSubscriptionId?: string | null;
  /**
   * True if the user has scheduled their subscription to cancel at the end
   * of the current paid period. They still have Pro access until proExpiresAt.
   * Synced from Stripe via the customer.subscription.updated webhook.
   */
  cancelAtPeriodEnd?: boolean | null;
};

// Public shape — never leak passwordHash to clients.
export type SessionUser = Pick<
  User,
  | "id"
  | "email"
  | "createdAt"
  | "emailVerifiedAt"
  | "isPro"
  | "proSince"
  | "proPlan"
  | "proExpiresAt"
  | "stripeCustomerId"
  | "cancelAtPeriodEnd"
>;

export const PLAN_DURATIONS_MS: Record<ProPlan, number | null> = {
  monthly: 30 * 24 * 60 * 60 * 1000,
  yearly: 365 * 24 * 60 * 60 * 1000,
  lifetime: null,
};

export const PLAN_PRICES: Record<ProPlan, number> = {
  monthly: 7.99,
  yearly: 79,
  lifetime: 249,
};

export const SESSION_COOKIE = "money.session";
const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function getSecret(): string {
  const s = process.env.AUTH_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET env var is required in production (>= 16 chars).");
  }
  // Dev-only fallback so the user doesn't need to configure another secret
  // just to try auth locally.
  return "dev-only-auth-secret-do-not-use-in-production";
}

export function toSessionUser(u: User): SessionUser {
  return {
    id: u.id,
    email: u.email,
    createdAt: u.createdAt,
    emailVerifiedAt: u.emailVerifiedAt ?? null,
    isPro: !!u.isPro,
    proSince: u.proSince ?? null,
    proPlan: u.proPlan ?? null,
    proExpiresAt: u.proExpiresAt ?? null,
    stripeCustomerId: u.stripeCustomerId ?? null,
    cancelAtPeriodEnd: u.cancelAtPeriodEnd ?? null,
  };
}

// ── Row mapping ────────────────────────────────────────────────────────────

type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  created_at: number;
  email_verified_at: number | null;
  is_pro: number;
  pro_since: number | null;
  pro_plan: ProPlan | null;
  pro_expires_at: number | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  cancel_at_period_end: number;
};

function rowToUser(row: UserRow | undefined): User | null {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    createdAt: row.created_at,
    emailVerifiedAt: row.email_verified_at,
    isPro: !!row.is_pro,
    proSince: row.pro_since,
    proPlan: row.pro_plan,
    proExpiresAt: row.pro_expires_at,
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    cancelAtPeriodEnd: !!row.cancel_at_period_end,
  };
}

// ── Password hashing (scrypt, no deps) ─────────────────────────────────────

function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = randomBytes(16).toString("hex");
    scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`${salt}:${derivedKey.toString("hex")}`);
    });
  });
}

function verifyPassword(password: string, hash: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const [salt, keyHex] = hash.split(":");
    if (!salt || !keyHex) return resolve(false);
    const stored = Buffer.from(keyHex, "hex");
    scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return reject(err);
      try {
        resolve(stored.length === derivedKey.length && timingSafeEqual(stored, derivedKey));
      } catch {
        resolve(false);
      }
    });
  });
}

// ── Signed session token ───────────────────────────────────────────────────

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

export function createSessionToken(userId: string): string {
  const expires = Date.now() + SESSION_MAX_AGE_MS;
  const payload = `${userId}.${expires}`;
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(
  token: string,
): { userId: string; expires: number } | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, expiresStr, sig] = parts;
  const payload = `${userId}.${expiresStr}`;
  const expected = sign(payload);
  if (expected.length !== sig.length) return null;
  try {
    if (!timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return null;
  } catch {
    return null;
  }
  const expires = Number(expiresStr);
  if (!Number.isFinite(expires) || expires < Date.now()) return null;
  return { userId, expires };
}

// ── Validators ─────────────────────────────────────────────────────────────

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 200;
}

export function validatePassword(password: string): boolean {
  return typeof password === "string" && password.length >= 8 && password.length <= 200;
}

// ── User CRUD ──────────────────────────────────────────────────────────────

export async function createUser(
  email: string,
  password: string,
): Promise<{ user?: User; error?: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!validateEmail(normalizedEmail)) return { error: "Enter a valid email." };
  if (!validatePassword(password))
    return { error: "Password must be at least 8 characters." };

  const existing = db()
    .prepare("SELECT id FROM users WHERE email = ?")
    .get(normalizedEmail);
  if (existing) {
    return { error: "An account already exists for this email." };
  }

  const id = randomBytes(8).toString("hex");
  const now = Date.now();
  const passwordHash = await hashPassword(password);
  db()
    .prepare(
      `INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)`,
    )
    .run(id, normalizedEmail, passwordHash, now);

  return {
    user: {
      id,
      email: normalizedEmail,
      passwordHash,
      createdAt: now,
    },
  };
}

export async function authenticate(
  email: string,
  password: string,
): Promise<User | null> {
  const normalizedEmail = email.trim().toLowerCase();
  const row = db()
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(normalizedEmail) as UserRow | undefined;
  const user = rowToUser(row);
  if (!user) return null;
  const ok = await verifyPassword(password, user.passwordHash);
  return ok ? user : null;
}

export async function findUserById(id: string): Promise<User | null> {
  const row = db()
    .prepare("SELECT * FROM users WHERE id = ?")
    .get(id) as UserRow | undefined;
  return rowToUser(row);
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const normalized = email.trim().toLowerCase();
  const row = db()
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(normalized) as UserRow | undefined;
  return rowToUser(row);
}

export async function findUserByStripeCustomerId(
  stripeCustomerId: string,
): Promise<User | null> {
  const row = db()
    .prepare("SELECT * FROM users WHERE stripe_customer_id = ?")
    .get(stripeCustomerId) as UserRow | undefined;
  return rowToUser(row);
}

export async function markEmailVerified(userId: string): Promise<User | null> {
  const row = db()
    .prepare("SELECT email_verified_at FROM users WHERE id = ?")
    .get(userId) as { email_verified_at: number | null } | undefined;
  if (!row) return null;
  if (row.email_verified_at) return findUserById(userId); // already verified
  db()
    .prepare("UPDATE users SET email_verified_at = ? WHERE id = ?")
    .run(Date.now(), userId);
  return findUserById(userId);
}

export async function updateUserPassword(
  userId: string,
  newPassword: string,
): Promise<{ user?: User; error?: string }> {
  if (!validatePassword(newPassword)) {
    return { error: "Password must be at least 8 characters." };
  }
  const passwordHash = await hashPassword(newPassword);
  const result = db()
    .prepare("UPDATE users SET password_hash = ? WHERE id = ?")
    .run(passwordHash, userId);
  if (result.changes === 0) return { error: "User not found." };
  const user = await findUserById(userId);
  return user ? { user } : { error: "User not found." };
}

export async function setStripeCustomer(
  userId: string,
  stripeCustomerId: string,
): Promise<User | null> {
  db()
    .prepare("UPDATE users SET stripe_customer_id = ? WHERE id = ?")
    .run(stripeCustomerId, userId);
  return findUserById(userId);
}

export async function setSubscriptionCancelState(
  userId: string,
  cancelAtPeriodEnd: boolean,
): Promise<User | null> {
  db()
    .prepare("UPDATE users SET cancel_at_period_end = ? WHERE id = ?")
    .run(cancelAtPeriodEnd ? 1 : 0, userId);
  return findUserById(userId);
}

/**
 * Set (or clear) a user's Pro subscription.
 *   setUserPro(id, null)              → cancel / downgrade
 *   setUserPro(id, "monthly")         → 30-day Pro
 *   setUserPro(id, "yearly")          → 365-day Pro
 *   setUserPro(id, "lifetime")        → no expiry
 */
export async function setUserPro(
  userId: string,
  plan: ProPlan | null,
  opts?: {
    subscriptionId?: string | null;
    /** Explicit expiry epoch ms, overrides duration lookup. */
    expiresAt?: number | null;
  },
): Promise<User | null> {
  const existing = await findUserById(userId);
  if (!existing) return null;
  const now = Date.now();

  if (plan === null) {
    db()
      .prepare(
        `UPDATE users SET
            is_pro = 0,
            pro_since = NULL,
            pro_plan = NULL,
            pro_expires_at = NULL,
            stripe_subscription_id = NULL,
            cancel_at_period_end = 0
         WHERE id = ?`,
      )
      .run(userId);
    return findUserById(userId);
  }

  const durationMs = PLAN_DURATIONS_MS[plan];
  const computedExpiry = durationMs == null ? null : now + durationMs;
  const proExpiresAt =
    opts?.expiresAt !== undefined ? opts.expiresAt : computedExpiry;
  const subscriptionId =
    opts?.subscriptionId !== undefined
      ? opts.subscriptionId
      : existing.stripeSubscriptionId ?? null;
  const proSince = existing.proSince ?? now;

  db()
    .prepare(
      `UPDATE users SET
          is_pro = 1,
          pro_since = ?,
          pro_plan = ?,
          pro_expires_at = ?,
          stripe_subscription_id = ?
       WHERE id = ?`,
    )
    .run(proSince, plan, proExpiresAt, subscriptionId, userId);
  return findUserById(userId);
}

/**
 * Pro if the flag is set AND (plan is lifetime OR expiry is in the future).
 * Auto-downgrades expired subscriptions on-read so stale rows self-heal.
 */
export async function requirePro(): Promise<
  { ok: true; user: User } | { ok: false; status: 401 | 402; message: string }
> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, status: 401, message: "Sign in to use this feature." };

  const expired = !!user.proExpiresAt && user.proExpiresAt <= Date.now();
  if (user.isPro && expired) {
    await setUserPro(user.id, null);
    return {
      ok: false,
      status: 402,
      message: "Your Pro subscription expired. Renew to continue.",
    };
  }

  if (!user.isPro)
    return {
      ok: false,
      status: 402,
      message: "This feature is Pro-only. Upgrade to unlock it.",
    };
  return { ok: true, user };
}

// ── Request helpers ────────────────────────────────────────────────────────

export async function getCurrentUser(): Promise<User | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const claims = verifySessionToken(token);
  if (!claims) return null;
  return findUserById(claims.userId);
}

export async function setSessionCookie(userId: string): Promise<void> {
  const jar = await cookies();
  jar.set({
    name: SESSION_COOKIE,
    value: createSessionToken(userId),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(SESSION_MAX_AGE_MS / 1000),
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}
