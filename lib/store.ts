import type { SharedPlan } from "./types";
import { db } from "./db";

/**
 * Shared-plan store. SQLite-backed. The shape of `SharedPlan` is preserved
 * so the rest of the app (POST /api/share, GET /p/[id], /discover) doesn't
 * care that storage moved.
 */

type ShareRow = {
  id: string;
  idea: string;
  context: string | null;
  messages: string;
  created_at: number;
};

function rowToShare(row: ShareRow | undefined): SharedPlan | null {
  if (!row) return null;
  return {
    id: row.id,
    idea: row.idea,
    context: row.context ? JSON.parse(row.context) : undefined,
    messages: JSON.parse(row.messages),
    createdAt: row.created_at,
  };
}

export async function saveShare(plan: SharedPlan): Promise<void> {
  db()
    .prepare(
      `INSERT OR REPLACE INTO shares (id, idea, context, messages, created_at)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(
      plan.id,
      plan.idea,
      plan.context ? JSON.stringify(plan.context) : null,
      JSON.stringify(plan.messages),
      plan.createdAt,
    );
}

export async function loadShare(id: string): Promise<SharedPlan | null> {
  // Defensive: only allow [a-z0-9-] to avoid surprises.
  if (!/^[a-z0-9-]+$/i.test(id)) return null;
  const row = db()
    .prepare("SELECT * FROM shares WHERE id = ?")
    .get(id) as ShareRow | undefined;
  return rowToShare(row);
}

export async function listShares(limit = 30): Promise<SharedPlan[]> {
  const rows = db()
    .prepare("SELECT * FROM shares ORDER BY created_at DESC LIMIT ?")
    .all(limit) as ShareRow[];
  return rows.map((r) => rowToShare(r)!).filter(Boolean);
}

export function newId(): string {
  // 10-char URL-safe random ID. Crypto.randomUUID would be longer; this is
  // friendly to share verbally.
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  for (let i = 0; i < 10; i++) {
    id += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return id;
}
