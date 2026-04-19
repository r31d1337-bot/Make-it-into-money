import { promises as fs } from "fs";
import path from "path";
import { createHmac, scrypt, randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

// Dev-only file-backed user store.
// In production (Vercel), swap this for a real DB (Vercel KV, Upstash, Postgres).
const DATA_DIR = path.join(process.cwd(), ".data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

export type User = {
  id: string;
  email: string;
  passwordHash: string; // "salt:hex-derived-key"
  createdAt: number;
  isPro?: boolean;
  proSince?: number | null;
};

// Public shape — never leak passwordHash to clients.
export type SessionUser = Pick<User, "id" | "email" | "createdAt" | "isPro" | "proSince">;

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
    isPro: !!u.isPro,
    proSince: u.proSince ?? null,
  };
}

export async function setUserPro(userId: string, isPro: boolean): Promise<User | null> {
  const users = await loadUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx < 0) return null;
  users[idx] = {
    ...users[idx],
    isPro,
    proSince: isPro ? users[idx].proSince ?? Date.now() : null,
  };
  await saveUsers(users);
  return users[idx];
}

export async function requirePro(): Promise<
  { ok: true; user: User } | { ok: false; status: 401 | 402; message: string }
> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, status: 401, message: "Sign in to use this feature." };
  if (!user.isPro)
    return {
      ok: false,
      status: 402,
      message: "This feature is Pro-only. Upgrade to unlock it.",
    };
  return { ok: true, user };
}

// ── User store ─────────────────────────────────────────────────────────────

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function loadUsers(): Promise<User[]> {
  try {
    const raw = await fs.readFile(USERS_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as User[]) : [];
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
}

async function saveUsers(users: User[]): Promise<void> {
  await ensureDir();
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), "utf8");
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
  // Constant-time compare
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

// ── High-level API ─────────────────────────────────────────────────────────

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 200;
}

export function validatePassword(password: string): boolean {
  return typeof password === "string" && password.length >= 8 && password.length <= 200;
}

export async function createUser(
  email: string,
  password: string,
): Promise<{ user?: User; error?: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!validateEmail(normalizedEmail)) return { error: "Enter a valid email." };
  if (!validatePassword(password))
    return { error: "Password must be at least 8 characters." };

  const users = await loadUsers();
  if (users.some((u) => u.email === normalizedEmail)) {
    return { error: "An account already exists for this email." };
  }
  const user: User = {
    id: randomBytes(8).toString("hex"),
    email: normalizedEmail,
    passwordHash: await hashPassword(password),
    createdAt: Date.now(),
  };
  users.push(user);
  await saveUsers(users);
  return { user };
}

export async function authenticate(
  email: string,
  password: string,
): Promise<User | null> {
  const normalizedEmail = email.trim().toLowerCase();
  const users = await loadUsers();
  const user = users.find((u) => u.email === normalizedEmail);
  if (!user) return null;
  const ok = await verifyPassword(password, user.passwordHash);
  return ok ? user : null;
}

export async function findUserById(id: string): Promise<User | null> {
  const users = await loadUsers();
  return users.find((u) => u.id === id) ?? null;
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
