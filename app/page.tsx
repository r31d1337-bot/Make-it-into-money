"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const EXAMPLES = [
  "I'm a great home cook specializing in Thai food",
  "I know Excel and pivot tables really well",
  "I'm fluent in Portuguese and English",
  "I can fix bikes",
];

export default function Home() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const outputRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to output when it starts streaming
  useEffect(() => {
    if (output && outputRef.current) {
      outputRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [output.length > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  async function onSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    setLoading(true);
    setError(null);
    setOutput("");
    setCopied(false);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/monetize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
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
        setOutput((prev) => prev + decoder.decode(value, { stream: true }));
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError((err as Error).message);
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }

  function onStop() {
    abortRef.current?.abort();
  }

  function useExample(text: string) {
    setInput(text);
    setError(null);
  }

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available; ignore silently
    }
  }

  return (
    <main className="relative mx-auto max-w-3xl px-6 py-12 sm:py-20">
      {/* Ambient gradient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[500px] bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(120,80,255,0.18),transparent_70%)]"
      />

      <header className="mb-12">
        <h1 className="bg-gradient-to-br from-white to-neutral-400 bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-6xl">
          Turn this into money.
        </h1>
        <p className="mt-4 text-lg text-neutral-400">
          Describe a skill, idea, or thing you&apos;re good at. Get a concrete plan to monetize it.
        </p>
      </header>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) onSubmit();
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

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="rounded-lg bg-gradient-to-br from-white to-neutral-200 px-6 py-2.5 text-sm font-semibold text-black shadow-lg shadow-white/10 transition hover:brightness-110 disabled:from-neutral-800 disabled:to-neutral-900 disabled:text-neutral-500 disabled:shadow-none"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                Thinking
                <span className="inline-flex gap-0.5">
                  <span className="h-1 w-1 animate-bounce rounded-full bg-neutral-500 [animation-delay:-0.3s]" />
                  <span className="h-1 w-1 animate-bounce rounded-full bg-neutral-500 [animation-delay:-0.15s]" />
                  <span className="h-1 w-1 animate-bounce rounded-full bg-neutral-500" />
                </span>
              </span>
            ) : (
              "Monetize it →"
            )}
          </button>
          {loading && (
            <button
              type="button"
              onClick={onStop}
              className="rounded-lg border border-neutral-800 px-5 py-2.5 text-sm font-medium text-neutral-300 hover:bg-neutral-900"
            >
              Stop
            </button>
          )}
        </div>
      </form>

      {/* Example prompts */}
      {!output && !loading && (
        <div className="mt-6">
          <p className="mb-2 text-xs uppercase tracking-wider text-neutral-500">Try one of these</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => useExample(ex)}
                className="rounded-full border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-sm text-neutral-300 transition hover:border-neutral-700 hover:bg-neutral-900 hover:text-white"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-lg border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {output && (
        <section ref={outputRef} className="mt-12">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs uppercase tracking-wider text-neutral-500">Your plan</h2>
            <button
              type="button"
              onClick={onCopy}
              className="rounded-md border border-neutral-800 bg-neutral-950 px-3 py-1 text-xs text-neutral-400 transition hover:border-neutral-700 hover:text-white"
            >
              {copied ? "Copied ✓" : "Copy"}
            </button>
          </div>
          <article className="markdown rounded-xl border border-neutral-900 bg-neutral-950/60 p-6 shadow-xl shadow-black/30">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{output}</ReactMarkdown>
          </article>
        </section>
      )}

      <footer className="mt-24 text-center text-xs text-neutral-600">
        Powered by Claude Sonnet 4.6. Not financial advice.
      </footer>
    </main>
  );
}
