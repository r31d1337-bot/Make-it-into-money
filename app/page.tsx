"use client";

import { useState, useRef } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    setLoading(true);
    setError(null);
    setOutput("");

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

  return (
    <main className="mx-auto max-w-2xl px-6 py-12 sm:py-20">
      <header className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
          Turn this into money.
        </h1>
        <p className="mt-3 text-neutral-400">
          Describe a skill, idea, or thing you&apos;re good at. Get a concrete plan to monetize it.
        </p>
      </header>

      <form onSubmit={onSubmit} className="space-y-4">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. I'm good at explaining tax law to founders..."
          rows={5}
          disabled={loading}
          className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-3 text-base text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-600 focus:outline-none disabled:opacity-60"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-black hover:bg-neutral-200 disabled:bg-neutral-800 disabled:text-neutral-500"
          >
            {loading ? "Thinking..." : "Monetize it"}
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

      {error && (
        <div className="mt-6 rounded-lg border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {output && (
        <article className="mt-10 whitespace-pre-wrap text-[15px] leading-relaxed text-neutral-200">
          {output}
        </article>
      )}
    </main>
  );
}
