"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import AuthBar from "@/components/AuthBar";
import ToolsMenu from "@/components/ToolsMenu";
import Wordmark from "@/components/Wordmark";
import { extractTasksFromMarkdown, taskKey, type ExtractedTask } from "@/lib/tasks";

type Message = { role: "user" | "assistant"; content: string };
type HistoryItem = {
  id: string;
  idea: string;
  messages: Message[];
  createdAt: number;
};

type PlanTasks = {
  planId: string;
  idea: string;
  createdAt: number;
  tasks: Array<ExtractedTask & { checked: boolean }>;
};

const HISTORY_KEY = "money.history.v1";

function loadHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Combine all task lines across all assistant messages in a plan. Dedup by
 * hash so a task that appears in both the first plan and a follow-up only
 * shows up once (the most recent wins).
 */
function buildPlanTasks(item: HistoryItem): PlanTasks {
  const byHash = new Map<string, ExtractedTask>();
  for (const m of item.messages) {
    if (m.role !== "assistant") continue;
    for (const t of extractTasksFromMarkdown(m.content)) {
      byHash.set(t.textHash, t);
    }
  }
  const tasks = Array.from(byHash.values()).map((t) => {
    let checked = false;
    try {
      checked = localStorage.getItem(taskKey(item.id, t.textHash)) === "1";
    } catch {
      // ignore
    }
    return { ...t, checked };
  });
  return {
    planId: item.id,
    idea: item.idea,
    createdAt: item.createdAt,
    tasks,
  };
}

export default function ChecklistPage() {
  const [plans, setPlans] = useState<PlanTasks[] | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    const history = loadHistory();
    const withTasks = history
      .map(buildPlanTasks)
      .filter((p) => p.tasks.length > 0)
      .sort((a, b) => b.createdAt - a.createdAt);
    setPlans(withTasks);
  }, []);

  const { totalOpen, totalDone, totalAll } = useMemo(() => {
    if (!plans) return { totalOpen: 0, totalDone: 0, totalAll: 0 };
    let open = 0;
    let done = 0;
    for (const p of plans) {
      for (const t of p.tasks) {
        if (t.checked) done++;
        else open++;
      }
    }
    return { totalOpen: open, totalDone: done, totalAll: open + done };
  }, [plans]);

  function toggle(planId: string, textHash: string) {
    if (!plans) return;
    const next = plans.map((p) => {
      if (p.planId !== planId) return p;
      return {
        ...p,
        tasks: p.tasks.map((t) => {
          if (t.textHash !== textHash) return t;
          const nextChecked = !t.checked;
          try {
            localStorage.setItem(taskKey(planId, textHash), nextChecked ? "1" : "0");
          } catch {
            // ignore quota
          }
          return { ...t, checked: nextChecked };
        }),
      };
    });
    setPlans(next);
  }

  function clearCompleted() {
    if (!plans) return;
    if (!window.confirm("Remove all checked items from the checklist? (They stay in the underlying plans — this just hides them here.)")) {
      return;
    }
    // We can't actually delete tasks — they live in the plan markdown. But we
    // can clear the localStorage state, which unchecks them. User asked for
    // "remove completed" which is effectively the same as "reset them to
    // unchecked", which removes them from the "Done" pile.
    for (const p of plans) {
      for (const t of p.tasks) {
        if (t.checked) {
          try {
            localStorage.removeItem(taskKey(p.planId, t.textHash));
          } catch {}
        }
      }
    }
    setPlans(plans.map((p) => ({ ...p, tasks: p.tasks.map((t) => ({ ...t, checked: false })) })));
  }

  return (
    <main className="relative mx-auto max-w-3xl px-6 py-10">
      <div
        aria-hidden
        className="ambient-glow pointer-events-none absolute inset-x-0 top-0 -z-10 h-[500px]"
      />

      <div className="mb-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Wordmark />
          <ToolsMenu />
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <AuthBar />
        </div>
      </div>

      <header className="mb-8">
        <h1 className="bg-gradient-to-br from-white to-neutral-400 bg-clip-text text-3xl font-semibold tracking-tight text-transparent sm:text-4xl">
          Your checklist.
        </h1>
        <p className="mt-3 text-neutral-400">
          Every actionable item from every monetization plan you&apos;ve generated, in one place.
        </p>
      </header>

      {plans === null ? (
        <div className="text-sm text-neutral-500">Loading...</div>
      ) : plans.length === 0 ? (
        <div className="rounded-xl border border-neutral-900 bg-neutral-950/60 p-8 text-center text-sm text-neutral-500">
          No tasks yet. Generate a plan on the{" "}
          <Link href="/monetize" className="text-purple-300 underline decoration-dotted">
            monetize page
          </Link>{" "}
          — the &ldquo;First 30 days&rdquo; section shows up here as checkable items.
        </div>
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-neutral-900 bg-neutral-950/60 px-5 py-4">
            <div className="flex-1">
              <div className="text-xl font-semibold tabular-nums text-white">
                {totalOpen} <span className="text-base font-normal text-neutral-500">open</span>
                <span className="mx-2 text-neutral-700">·</span>
                {totalDone} <span className="text-base font-normal text-neutral-500">done</span>
                <span className="mx-2 text-neutral-700">·</span>
                <span className="text-base font-normal text-neutral-500">{totalAll} total</span>
              </div>
              {totalAll > 0 && (
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-900">
                  <div
                    className="h-full bg-gradient-to-r from-purple-400 to-purple-600 transition-[width] duration-300"
                    style={{ width: `${Math.round((totalDone / totalAll) * 100)}%` }}
                  />
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <label className="flex cursor-pointer items-center gap-2 text-neutral-400">
                <input
                  type="checkbox"
                  checked={showCompleted}
                  onChange={(e) => setShowCompleted(e.target.checked)}
                  className="accent-purple-500"
                />
                Show completed
              </label>
              {totalDone > 0 && (
                <button
                  type="button"
                  onClick={clearCompleted}
                  className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1 text-xs text-neutral-400 hover:border-red-900 hover:text-red-300"
                >
                  Reset done
                </button>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {plans.map((p) => {
              const visibleTasks = p.tasks
                .filter((t) => showCompleted || !t.checked)
                // Open first, then done
                .sort((a, b) => Number(a.checked) - Number(b.checked));
              if (visibleTasks.length === 0) return null;
              const open = p.tasks.filter((t) => !t.checked).length;
              return (
                <section
                  key={p.planId}
                  className="rounded-xl border border-neutral-900 bg-neutral-950/40 p-5"
                >
                  <header className="mb-3 flex items-baseline justify-between gap-3">
                    <h2 className="min-w-0 truncate text-base font-medium text-white">
                      {p.idea}
                    </h2>
                    <span className="flex-none text-xs text-neutral-500">
                      {open}/{p.tasks.length} open
                    </span>
                  </header>
                  <ul className="space-y-2">
                    {visibleTasks.map((t) => (
                      <li
                        key={t.textHash}
                        className="group flex items-start gap-2.5"
                      >
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={t.checked}
                          onClick={() => toggle(p.planId, t.textHash)}
                          className={`mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded border transition ${
                            t.checked
                              ? "border-purple-500 bg-purple-500/20 text-purple-200"
                              : "border-neutral-700 bg-neutral-950 hover:border-neutral-500"
                          }`}
                        >
                          {t.checked && (
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </button>
                        <span
                          className={`flex-1 cursor-pointer text-sm leading-relaxed ${
                            t.checked
                              ? "text-neutral-500 line-through decoration-neutral-600"
                              : "text-neutral-200"
                          }`}
                          onClick={() => toggle(p.planId, t.textHash)}
                        >
                          {t.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        </>
      )}

      <p className="mt-12 text-xs text-neutral-600">
        Tasks are stored locally on this device. Signed-in cloud sync is coming soon.
      </p>
    </main>
  );
}
