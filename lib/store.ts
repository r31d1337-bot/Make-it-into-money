import { promises as fs } from "fs";
import path from "path";
import type { SharedPlan } from "./types";

// Local JSON-file store for shared plans.
// Dev-only. In production, swap this for Vercel KV or Upstash Redis.
// Each plan is written to .data/shares/<id>.json.

const DATA_DIR = path.join(process.cwd(), ".data", "shares");

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

function filePath(id: string): string {
  // Defensive: only allow [a-z0-9-] to prevent any path traversal.
  if (!/^[a-z0-9-]+$/i.test(id)) throw new Error("Invalid id");
  return path.join(DATA_DIR, `${id}.json`);
}

export async function saveShare(plan: SharedPlan): Promise<void> {
  await ensureDir();
  await fs.writeFile(filePath(plan.id), JSON.stringify(plan), "utf8");
}

export async function loadShare(id: string): Promise<SharedPlan | null> {
  try {
    const raw = await fs.readFile(filePath(id), "utf8");
    return JSON.parse(raw) as SharedPlan;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}

export function newId(): string {
  // 10-char URL-safe random ID.
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  for (let i = 0; i < 10; i++) {
    id += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return id;
}
