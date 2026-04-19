"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import PlanMarkdown from "@/components/PlanMarkdown";
import ThemeToggle from "@/components/ThemeToggle";
import AuthBar from "@/components/AuthBar";
import ToolsMenu from "@/components/ToolsMenu";
import Wordmark from "@/components/Wordmark";
import ProGate from "@/components/ProGate";
import { Input, Textarea } from "@/components/FormFields";

type Form = {
  jobDescription: string;
  companyName: string;
  background: string;
};

const EMPTY: Form = {
  jobDescription: "",
  companyName: "",
  background: "",
};

export default function InterviewPrepPage() {
  const [form, setForm] = useState<Form>(EMPTY);
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const outputRef = useRef<HTMLDivElement | null>(null);

  function update<K extends keyof Form>(key: K, v: Form[K]) {
    setForm((prev) => ({ ...prev, [key]: v }));
  }

  const canSubmit = !loading && form.jobDescription.trim().length > 0;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    setOutput("");
    setCopied(false);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/interview-prep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        const msg = await res.text().catch(() => "");
        throw new Error(msg || `Request failed (${res.status})`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let first = true;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setOutput((prev) => prev + chunk);
        if (first && outputRef.current) {
          outputRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
          first = false;
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") setError((err as Error).message);
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }

  function onStop() {
    abortRef.current?.abort();
  }

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  function onPrint() {
    window.print();
  }

  function onReset() {
    abortRef.current?.abort();
    setForm(EMPTY);
    setOutput("");
    setError(null);
  }

  return (
    <main className="relative mx-auto max-w-3xl px-6 py-12 sm:py-16">
      <div
        aria-hidden
        className="ambient-glow pointer-events-none absolute inset-x-0 top-0 -z-10 h-[500px]"
      />

      <div className="no-print mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Wordmark />
          <ToolsMenu />
        </div>
        <div className="flex items-center gap-2">
          {output && !loading && (
            <button
              type="button"
              onClick={onReset}
              className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-sm text-neutral-300 hover:border-neutral-700 hover:text-white"
            >
              + New
            </button>
          )}
          <ThemeToggle />
          <AuthBar />
        </div>
      </div>

      <ProGate feature="interview prep">
      {!output && !loading ? (
        <>
          <header className="mb-10 no-print">
            <h1 className="bg-gradient-to-br from-white to-neutral-400 bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-5xl">
              Interview prep.
            </h1>
            <p className="mt-3 text-lg text-neutral-400">
              Paste the job posting. Get 8 likely questions, how to approach each, and
              smart questions to ask them.
            </p>
          </header>

          <form onSubmit={onSubmit} className="space-y-5 no-print">
            <Textarea
              label="Job posting"
              hint="Paste the full posting — the more detail, the more tailored the prep."
              required
              value={form.jobDescription}
              onChange={(v) => update("jobDescription", v)}
              rows={10}
              placeholder="Paste the job posting here..."
              mono={false}
            />

            <Input
              label="Company (optional)"
              hint="Helps tailor the culture / fit questions"
              value={form.companyName}
              onChange={(v) => update("companyName", v)}
              placeholder="Acme"
            />

            <Textarea
              label="Your background (optional)"
              hint="Paste your resume, or drop key bullets. Lets the openers cite your actual wins."
              value={form.background}
              onChange={(v) => update("background", v)}
              rows={8}
              placeholder="Senior PM at Acme 2021–now, launched Widget 2.0 (4x MAU growth)..."
            />

            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-lg bg-gradient-to-br from-white to-neutral-200 px-6 py-2.5 text-sm font-semibold text-black shadow-lg shadow-white/10 transition hover:brightness-110 disabled:from-neutral-800 disabled:to-neutral-900 disabled:text-neutral-500 disabled:shadow-none"
            >
              Prep me →
            </button>
          </form>
        </>
      ) : (
        <>
          <header className="mb-6 no-print">
            <h2 className="text-xs uppercase tracking-wider text-neutral-500">
              Interview prep
            </h2>
            {form.companyName && (
              <p className="mt-1 text-neutral-400">For {form.companyName}</p>
            )}
          </header>

          <article
            ref={outputRef}
            className="markdown relative rounded-xl border border-neutral-900 bg-neutral-950/60 p-6 shadow-xl shadow-black/30 sm:p-8"
          >
            {loading && !output && (
              <div className="flex items-center gap-2 text-sm text-neutral-500">
                <span className="inline-flex gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-500 [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-500 [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-500" />
                </span>
                Thinking...
              </div>
            )}
            <PlanMarkdown>{output}</PlanMarkdown>
          </article>

          {loading && (
            <div className="no-print mt-3 text-sm text-neutral-500">
              Streaming...{" "}
              <button
                type="button"
                onClick={onStop}
                className="text-neutral-400 underline decoration-dotted hover:text-white"
              >
                stop
              </button>
            </div>
          )}

          {!loading && output && (
            <div className="no-print mt-6 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onCopy}
                className="rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-2 text-sm text-neutral-300 hover:border-neutral-700 hover:text-white"
              >
                {copied ? "Copied ✓" : "Copy"}
              </button>
              <button
                type="button"
                onClick={onPrint}
                className="rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-2 text-sm text-neutral-300 hover:border-neutral-700 hover:text-white"
              >
                Print / PDF
              </button>
              <button
                type="button"
                onClick={onReset}
                className="rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-2 text-sm text-neutral-300 hover:border-neutral-700 hover:text-white"
              >
                Edit inputs
              </button>
            </div>
          )}
        </>
      )}

      {error && (
        <div className="no-print mt-6 rounded-lg border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}
      </ProGate>

      <footer className="mt-24 text-center text-xs text-neutral-600 no-print">
        Powered by Claude Opus 4.7.
      </footer>
    </main>
  );
}
