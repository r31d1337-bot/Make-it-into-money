/**
 * Shared helpers for interactive GFM task lists.
 *
 * Two places need to agree on how a task-list item is identified in
 * localStorage:
 *   1. components/PlanMarkdown.tsx — renders tasks as checkboxes inside a plan
 *   2. app/checklist/page.tsx — aggregates tasks across all plans
 *
 * Both use `hashText(normalizeTaskText(rawLine))` so clicking a checkbox in
 * either place reads/writes the same key.
 */

/** Fast deterministic 32-bit hash (djb2) → short base36 string. */
export function hashText(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
  return (h >>> 0).toString(36);
}

/** localStorage key for a task's checked state. */
export function taskKey(planId: string, textHash: string): string {
  return `money.task.${planId}.${textHash}`;
}

/**
 * Strip the checkbox prefix and common markdown syntax so the resulting text
 * matches what react-markdown's rendered text would look like. This has to
 * stay in sync with extractText() in PlanMarkdown — both feed the same hash.
 */
export function normalizeTaskText(raw: string): string {
  return raw
    .replace(/^\s*[-*+]\s*\[[ xX]\]\s*/, "") // drop `- [ ] ` / `* [x] ` prefix
    .replace(/\*\*([^*]+)\*\*/g, "$1") // **bold**
    .replace(/\*([^*]+)\*/g, "$1") // *italic*
    .replace(/__([^_]+)__/g, "$1") // __bold__
    .replace(/_([^_]+)_/g, "$1") // _italic_
    .replace(/`([^`]+)`/g, "$1") // `code`
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // [text](url)
    .replace(/\s+/g, " ")
    .trim();
}

export type ExtractedTask = {
  /** Normalized, rendered-text version of the item (hashed for the store key). */
  text: string;
  /** The raw source line, preserved for display. */
  raw: string;
  textHash: string;
  /** True if the markdown source marked it [x] — initial default only. */
  defaultChecked: boolean;
};

/**
 * Scan markdown for GFM task-list items and return one entry per task,
 * preserving document order.
 */
export function extractTasksFromMarkdown(md: string): ExtractedTask[] {
  const tasks: ExtractedTask[] = [];
  const lines = md.split("\n");
  for (const line of lines) {
    const m = line.match(/^\s*[-*+]\s*\[([ xX])\]\s+(.+)$/);
    if (!m) continue;
    const defaultChecked = m[1].toLowerCase() === "x";
    const text = normalizeTaskText(line);
    if (!text) continue;
    tasks.push({
      text,
      raw: line.trim(),
      textHash: hashText(text),
      defaultChecked,
    });
  }
  return tasks;
}
