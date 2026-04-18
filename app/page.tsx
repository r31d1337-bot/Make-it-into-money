"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Message, Context } from "@/lib/types";

const EXAMPLES = [
  "I'm a great home cook specializing in Thai food",
  "I know Excel and pivot tables really well",
  "I'm fluent in Portuguese and English",
  "I can fix bikes",
];

const TIME_OPTIONS = ["2 hrs/week", "5 hrs/week", "10+ hrs/week"];
const BUDGET_OPTIONS = ["$0", "$100", "$1,000+"];
const TECH_OPTIONS = ["Low", "Medium", "High"];

type HistoryItem = {
  id: string; // local uuid
  idea: string;
  messages: Message[];
  context?: Context;
  createdAt: number;
  shareId?: string;
};

const HISTORY_KEY = "money.history.v1";
const MAX_HISTORY = 20;

function loadHistory(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHistory(items: HistoryItem[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, MAX_HISTORY)));
  } catch {
    // quota exceeded, etc — ignore
  }
}

function uuid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function Home() {
  // Chat state
  const [idea, setIdea] = useState("");
  const [context, setContext] = useState<Context>({});
  const [messages, setMessages] = useState<Message[]>([]);
  const [pendingAssistant, setPendingAssistant] = useState(""); // currently streaming text
  const [followUp, setFollowUp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Share state
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  // History state
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const pendingRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  // Auto-scroll to latest assistant output while streaming
  useEffect(() => {
    if (pendingAssistant && pendingRef.current) {
      pendingRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [pendingAssistant.length > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasStarted = messages.length > 0 || pendingAssistant.length > 0;

  const persist = useCallback(
    (next: Message[]) => {
      if (!currentId) return;
      setHistory((prev) => {
        const updated: HistoryItem[] = [
          {
            id: currentId,
            idea,
            context,
            messages: next,
            createdAt: prev.find((h) => h.id === currentId)?.createdAt ?? Date.now(),
          },
          ...prev.filter((h) => h.id !== currentId),
        ];
        saveHistory(updated);
        return updated;
      });
    },
    [currentId, idea, context],
  );

  async function streamRequest(allMessages: Message[]) {
    setLoading(true);
    setError(null);
    setPendingAssistant("");
    setShareUrl(null);

    const controller = new AbortController();
    abortRef.current = controller;

    let assembled = "";
    try {
      const res = await fetch("/api/monetize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: allMessages, context }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        const msg = await res.text().catch(() => "");
        throw new Error(msg || `Request failed (${res.status})`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        assembled += chunk;
        setPendingAssistant(assembled);
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError((err as Error).message);
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }

    if (assembled) {
      const finalMessages: Message[] = [...allMessages, { role: "assistant", content: assembled }];
      setMessages(finalMessages);
      setPendingAssistant("");
      persist(finalMessages);
    } else {
      setPendingAssistant("");
    }
  }

  function onStart(e?: React.FormEvent) {
    e?.preventDefault();
    if (!idea.trim() || loading) return;
    const id = uuid();
    setCurrentId(id);
    const initial: Message[] = [{ role: "user", content: idea.trim() }];
    setMessages(initial);
    void streamRequest(initial);
  }

  function onFollowUp(e?: React.FormEvent) {
    e?.preventDefault();
    const text = followUp.trim();
    if (!text || loading) return;
    const next: Message[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setFollowUp("");
    void streamRequest(next);
  }

  function onStop() {
    abortRef.current?.abort();
  }

  function onNew() {
    abortRef.current?.abort();
    setIdea("");
    setContext({});
    setMessages([]);
    setPendingAssistant("");
    setFollowUp("");
    setError(null);
    setShareUrl(null);
    setCurrentId(null);
  }

  function openFromHistory(item: HistoryItem) {
    abortRef.current?.abort();
    setIdea(item.idea);
    setContext(item.context ?? {});
    setMessages(item.messages);
    setPendingAssistant("");
    setFollowUp("");
    setError(null);
    setShareUrl(null);
    setCurrentId(item.id);
    setHistoryOpen(false);
  }

  function deleteHistoryItem(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setHistory((prev) => {
      const next = prev.filter((h) => h.id !== id);
      saveHistory(next);
      return next;
    });
  }

  async function onShare() {
    if (!messages.length || shareLoading) return;
    setShareLoading(true);
    setCopiedShare(false);
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea, context, messages }),
      });
      if (!res.ok) throw new Error(`Share failed (${res.status})`);
      const data = (await res.json()) as { id: string };
      const url = `${window.location.origin}/p/${data.id}`;
      setShareUrl(url);
      try {
        await navigator.clipboard.writeText(url);
        setCopiedShare(true);
        setTimeout(() => setCopiedShare(false), 2500);
      } catch {
        // clipboard blocked; still show the URL
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setShareLoading(false);
    }
  }

  function onPrint() {
    window.print();
  }

  return (
    <main className="relative mx-auto max-w-3xl px-6 py-12 sm:py-16">
      {/* Ambient gradient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[500px] bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(120,80,255,0.18),transparent_70%)]"
      />

      {/* Top bar */}
      <div className="no-print mb-8 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setHistoryOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-sm text-neutral-300 hover:border-neutral-700 hover:text-white"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
          History
          {history.length > 0 && (
            <span className="rounded-full bg-neutral-800 px-1.5 text-xs text-neutral-400">{history.length}</span>
          )}
        </button>
        {hasStarted && (
          <button
            type="button"
            onClick={onNew}
            className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-sm text-neutral-300 hover:border-neutral-700 hover:text-white"
          >
            + New
          </button>
        )}
      </div>

      {!hasStarted ? (
        <>
          <header className="mb-10 print-header">
            <h1 className="bg-gradient-to-br from-white to-neutral-400 bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-6xl">
              Turn this into money.
            </h1>
            <p className="mt-4 text-lg text-neutral-400">
              Describe a skill, idea, or thing you&apos;re good at. Get a concrete plan to monetize it.
            </p>
          </header>

          <form onSubmit={onStart} className="space-y-5 no-print">
            <div className="relative">
              <textarea
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) onStart();
                }}
                placeholder="e.g. I'm good at explaining tax law to founders..."
                rows={5}
                disabled={loading}
                className="w-full resize-y rounded-xl border border-neutral-800 bg-neutral-950/80 px-4 py-3 text-base text-neutral-100 shadow-xl shadow-black/30 placeholder:text-neutral-600 focus:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20 disabled:opacity-60"
              />
              <div className="pointer-events-none absolute bottom-3 right-4 text-xs text-neutral-600">
                ⌘↵ to send
              </div>
            </div>

            {/* Context pills (optional) */}
            <div className="space-y-3 rounded-xl border border-neutral-900 bg-neutral-950/40 p-4">
              <p className="text-xs uppercase tracking-wider text-neutral-500">
                Quick context <span className="normal-case text-neutral-600">(optional, but better plans)</span>
              </p>
              <ContextRow label="⏱ Time" options={TIME_OPTIONS} value={context.time} onChange={(v) => setContext({ ...context, time: v })} />
              <ContextRow label="💰 Budget" options={BUDGET_OPTIONS} value={context.budget} onChange={(v) => setContext({ ...context, budget: v })} />
              <ContextRow label="⚙ Tech" options={TECH_OPTIONS} value={context.tech} onChange={(v) => setContext({ ...context, tech: v })} />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!idea.trim() || loading}
                className="rounded-lg bg-gradient-to-br from-white to-neutral-200 px-6 py-2.5 text-sm font-semibold text-black shadow-lg shadow-white/10 transition hover:brightness-110 disabled:from-neutral-800 disabled:to-neutral-900 disabled:text-neutral-500 disabled:shadow-none"
              >
                Monetize it →
              </button>
            </div>
          </form>

          <div className="mt-6 no-print">
            <p className="mb-2 text-xs uppercase tracking-wider text-neutral-500">Try one of these</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setIdea(ex)}
                  className="rounded-full border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-sm text-neutral-300 transition hover:border-neutral-700 hover:bg-neutral-900 hover:text-white"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          <header className="mb-8 print-header">
            <p className="text-xs uppercase tracking-wider text-neutral-500">The idea</p>
            <h1 className="mt-1 text-2xl font-semibold text-white sm:text-3xl">{idea}</h1>
            {(context.time || context.budget || context.tech) && (
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {context.time && <span className="rounded-full border border-neutral-800 bg-neutral-950 px-2.5 py-1 text-neutral-400">⏱ {context.time}</span>}
                {context.budget && <span className="rounded-full border border-neutral-800 bg-neutral-950 px-2.5 py-1 text-neutral-400">💰 {context.budget}</span>}
                {context.tech && <span className="rounded-full border border-neutral-800 bg-neutral-950 px-2.5 py-1 text-neutral-400">⚙ {context.tech}</span>}
              </div>
            )}
          </header>

          <div className="space-y-5">
            {messages.map((m, i) => {
              if (i === 0) return null; // first user message is the idea, already shown
              if (m.role === "user") {
                return (
                  <div key={i} className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
                    <p className="mb-1 text-xs uppercase tracking-wider text-neutral-500">Follow-up</p>
                    <p className="text-neutral-200">{m.content}</p>
                  </div>
                );
              }
              return (
                <article key={i} className="markdown rounded-xl border border-neutral-900 bg-neutral-950/60 p-6 shadow-xl shadow-black/30">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                </article>
              );
            })}

            {pendingAssistant && (
              <article ref={pendingRef} className="markdown rounded-xl border border-neutral-900 bg-neutral-950/60 p-6 shadow-xl shadow-black/30">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{pendingAssistant}</ReactMarkdown>
              </article>
            )}

            {loading && (
              <div className="no-print flex items-center gap-2 px-1 text-sm text-neutral-500">
                <span className="inline-flex gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-500 [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-500 [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-500" />
                </span>
                Thinking...
                <button type="button" onClick={onStop} className="ml-2 text-neutral-400 underline decoration-dotted hover:text-white">stop</button>
              </div>
            )}
          </div>

          {/* Follow-up + actions */}
          {!loading && messages.length > 0 && (
            <>
              <form onSubmit={onFollowUp} className="mt-8 no-print">
                <div className="relative">
                  <textarea
                    value={followUp}
                    onChange={(e) => setFollowUp(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) onFollowUp();
                    }}
                    placeholder="Ask a follow-up. 'How do I actually find those first 5 customers?'"
                    rows={3}
                    className="w-full resize-y rounded-xl border border-neutral-800 bg-neutral-950/80 px-4 py-3 text-base text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                  <div className="pointer-events-none absolute bottom-3 right-4 text-xs text-neutral-600">⌘↵</div>
                </div>
                <button
                  type="submit"
                  disabled={!followUp.trim()}
                  className="mt-3 rounded-lg bg-neutral-800 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:bg-neutral-900 disabled:text-neutral-600"
                >
                  Send →
                </button>
              </form>

              <div className="mt-8 flex flex-wrap gap-2 no-print">
                <button
                  type="button"
                  onClick={onShare}
                  disabled={shareLoading}
                  className="rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-2 text-sm text-neutral-300 hover:border-neutral-700 hover:text-white disabled:opacity-60"
                >
                  {shareLoading ? "Creating link..." : copiedShare ? "Link copied ✓" : "Share"}
                </button>
                <button
                  type="button"
                  onClick={onPrint}
                  className="rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-2 text-sm text-neutral-300 hover:border-neutral-700 hover:text-white"
                >
                  Print / PDF
                </button>
              </div>

              {shareUrl && (
                <div className="mt-3 rounded-lg border border-neutral-900 bg-neutral-950/60 px-3 py-2 text-sm no-print">
                  <span className="text-neutral-500">Link: </span>
                  <Link href={shareUrl} className="break-all text-purple-300 underline decoration-dotted">
                    {shareUrl}
                  </Link>
                </div>
              )}
            </>
          )}
        </>
      )}

      {error && (
        <div className="mt-6 rounded-lg border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300 no-print">
          {error}
        </div>
      )}

      {/* History drawer */}
      {historyOpen && (
        <div className="no-print fixed inset-0 z-50 flex">
          <div
            className="flex-1 bg-black/60 backdrop-blur-sm"
            onClick={() => setHistoryOpen(false)}
            aria-hidden
          />
          <aside className="h-full w-full max-w-sm border-l border-neutral-900 bg-neutral-950 p-5 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">History</h2>
              <button
                type="button"
                onClick={() => setHistoryOpen(false)}
                className="rounded text-neutral-500 hover:text-white"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            {history.length === 0 ? (
              <p className="text-sm text-neutral-500">No saved plans yet. Your plans are saved on this device.</p>
            ) : (
              <ul className="space-y-2">
                {history.map((h) => (
                  <li key={h.id}>
                    <button
                      type="button"
                      onClick={() => openFromHistory(h)}
                      className="group flex w-full items-start justify-between gap-2 rounded-lg border border-neutral-900 bg-neutral-950 px-3 py-2 text-left hover:border-neutral-800 hover:bg-neutral-900"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-neutral-200">{h.idea}</p>
                        <p className="text-xs text-neutral-600">
                          {new Date(h.createdAt).toLocaleDateString()} · {h.messages.length} message{h.messages.length === 1 ? "" : "s"}
                        </p>
                      </div>
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => deleteHistoryItem(h.id, e)}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") deleteHistoryItem(h.id, e as unknown as React.MouseEvent); }}
                        className="cursor-pointer text-xs text-neutral-600 opacity-0 transition hover:text-red-400 group-hover:opacity-100"
                        aria-label="Delete"
                      >
                        Delete
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>
      )}

      <footer className="mt-24 text-center text-xs text-neutral-600 no-print">
        Powered by Claude Sonnet 4.6. Not financial advice.
      </footer>
    </main>
  );
}

function ContextRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value?: string;
  onChange: (v: string | undefined) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-20 shrink-0 text-sm text-neutral-500">{label}</span>
      {options.map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(active ? undefined : opt)}
            className={`rounded-full px-3 py-1 text-xs transition ${
              active
                ? "border border-purple-500/60 bg-purple-500/15 text-purple-200"
                : "border border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200"
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}
