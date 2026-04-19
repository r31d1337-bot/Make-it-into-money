"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import AuthBar from "@/components/AuthBar";
import ToolsMenu from "@/components/ToolsMenu";
import Wordmark from "@/components/Wordmark";

type SessionUser = {
  id: string;
  email: string;
  createdAt: number;
  isPro?: boolean;
  proSince?: number | null;
};

const FREE_FEATURES = [
  "Unlimited Turn-This-Into-Money plans",
  "Streamed Claude Sonnet 4.6 responses",
  "Real-time web search for market data",
  "Shareable plan links · Discover feed",
  "Dark / light mode · history on device",
];

const PRO_FEATURES = [
  "Everything in free, plus:",
  "Write my resume — unlimited",
  "Cover letter writer — unlimited",
  "Interview prep — unlimited",
  "All three powered by Claude Opus 4.7",
  "Priority email support",
];

export default function PricingPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { user: null }))
      .then((data) => setUser(data.user ?? null))
      .catch(() => setUser(null));
  }, []);

  async function onUpgrade() {
    if (!user) {
      router.push(`/signup?next=${encodeURIComponent("/pricing")}`);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/subscribe", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `Upgrade failed (${res.status})`);
      setUser(data.user);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const isPro = !!user?.isPro;

  return (
    <main className="relative mx-auto max-w-4xl px-6 py-10">
      <div
        aria-hidden
        className="ambient-glow pointer-events-none absolute inset-x-0 top-0 -z-10 h-[500px]"
      />

      <div className="mb-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Wordmark />
          <ToolsMenu />
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <AuthBar />
        </div>
      </div>

      <header className="mb-12 text-center">
        <h1 className="bg-gradient-to-br from-white to-neutral-400 bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-5xl">
          Simple pricing.
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-neutral-400">
          Monetize ideas free, forever. Unlock the full career suite for $7.99/month.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Free */}
        <section className="rounded-2xl border border-neutral-900 bg-neutral-950/60 p-7">
          <div className="mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
              Free
            </h2>
            <p className="mt-2 text-4xl font-semibold tracking-tight text-white">$0</p>
            <p className="text-sm text-neutral-500">forever</p>
          </div>
          <ul className="space-y-2.5">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-neutral-300">
                <CheckIcon className="text-neutral-500" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-2 text-sm text-neutral-300 hover:border-neutral-700 hover:text-white"
          >
            Use free tools →
          </Link>
        </section>

        {/* Pro */}
        <section className="relative rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 via-neutral-950/60 to-neutral-950/60 p-7 shadow-xl shadow-purple-500/10">
          <div className="absolute -top-3 right-6 rounded-full bg-gradient-to-r from-purple-400 to-purple-600 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white shadow-lg shadow-purple-500/30">
            Recommended
          </div>
          <div className="mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-purple-200">
              Pro
            </h2>
            <p className="mt-2 text-4xl font-semibold tracking-tight text-white">
              $7.99<span className="text-base font-normal text-neutral-400">/month</span>
            </p>
            <p className="text-sm text-neutral-500">cancel anytime</p>
          </div>
          <ul className="space-y-2.5">
            {PRO_FEATURES.map((f, i) => (
              <li key={f} className="flex items-start gap-2 text-sm text-neutral-200">
                {i === 0 ? (
                  <SparkleIcon className="text-purple-300" />
                ) : (
                  <CheckIcon className="text-purple-300" />
                )}
                <span>{f}</span>
              </li>
            ))}
          </ul>

          {isPro ? (
            <div className="mt-6 space-y-2">
              <div className="inline-flex items-center gap-1.5 rounded-lg border border-purple-500/40 bg-purple-500/10 px-3 py-1.5 text-sm font-medium text-purple-200">
                <CheckIcon />
                You&apos;re on Pro
              </div>
              <div>
                <Link
                  href="/account"
                  className="inline-flex rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-2 text-sm text-neutral-300 hover:border-neutral-700 hover:text-white"
                >
                  Manage subscription →
                </Link>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={onUpgrade}
              disabled={submitting || user === undefined}
              className="mt-6 inline-flex rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/30 transition hover:brightness-110 disabled:from-neutral-800 disabled:to-neutral-900 disabled:text-neutral-500 disabled:shadow-none"
            >
              {submitting ? "Starting..." : user ? "Start Pro — $7.99/mo" : "Sign up for Pro"}
            </button>
          )}

          {error && (
            <p className="mt-3 text-sm text-red-400">{error}</p>
          )}
        </section>
      </div>

      <section className="mx-auto mt-16 max-w-2xl text-sm text-neutral-500">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">
          FAQ
        </h3>
        <dl className="space-y-4">
          <div>
            <dt className="mb-1 font-medium text-neutral-300">Can I cancel anytime?</dt>
            <dd>Yes. Cancel from the Account page. You keep Pro access until the end of the current period.</dd>
          </div>
          <div>
            <dt className="mb-1 font-medium text-neutral-300">What&apos;s the difference between Sonnet and Opus?</dt>
            <dd>Opus is Anthropic&apos;s top model — sharper reasoning, more nuanced writing. Best for career documents where one word matters.</dd>
          </div>
          <div>
            <dt className="mb-1 font-medium text-neutral-300">Is Turn This Into Money really free forever?</dt>
            <dd>Yes. Unlimited, no credit card, no daily limit.</dd>
          </div>
        </dl>
        <p className="mt-10 text-center text-xs text-neutral-600">
          Heads up: billing is currently in dev mode. The upgrade button flips your Pro flag instantly for testing — real Stripe checkout coming before launch.
        </p>
      </section>
    </main>
  );
}

function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`mt-0.5 flex-none ${className}`}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function SparkleIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`mt-0.5 flex-none ${className}`}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 2l2.39 6.09L20 10.48l-5.61 2.39L12 18.96l-2.39-6.09L4 10.48l5.61-2.39z" />
    </svg>
  );
}
