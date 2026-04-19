"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import AuthBar from "@/components/AuthBar";
import ToolsMenu from "@/components/ToolsMenu";
import Wordmark from "@/components/Wordmark";

type Plan = "monthly" | "yearly" | "lifetime";

type SessionUser = {
  id: string;
  email: string;
  createdAt: number;
  isPro?: boolean;
  proSince?: number | null;
  proPlan?: Plan | null;
  proExpiresAt?: number | null;
};

const PRICES: Record<Plan, string> = {
  monthly: "$7.99/month",
  yearly: "$79/year",
  lifetime: "$249 one-time",
};

const LABELS: Record<Plan, string> = {
  monthly: "Monthly",
  yearly: "Yearly",
  lifetime: "Lifetime",
};

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { user: null }))
      .then((data) => setUser(data.user ?? null))
      .catch(() => setUser(null));
  }, []);

  async function hit(endpoint: "/api/subscribe" | "/api/unsubscribe", plan?: Plan) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: plan ? JSON.stringify({ plan }) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
      setUser(data.user);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative mx-auto max-w-2xl px-6 py-10">
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

      <h1 className="mb-8 text-3xl font-semibold tracking-tight">Account</h1>

      {user === undefined ? (
        <div className="text-sm text-neutral-500">Loading...</div>
      ) : !user ? (
        <div className="rounded-xl border border-neutral-900 bg-neutral-950/60 p-6">
          <p className="mb-4 text-neutral-300">You&apos;re not signed in.</p>
          <Link
            href="/login?next=/account"
            className="inline-flex rounded-lg bg-gradient-to-br from-white to-neutral-200 px-4 py-2 text-sm font-semibold text-black"
          >
            Sign in
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Profile */}
          <section className="rounded-xl border border-neutral-900 bg-neutral-950/60 p-6">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Profile
            </h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-neutral-500">Email</dt>
                <dd className="text-neutral-200">{user.email}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-500">Member since</dt>
                <dd className="text-neutral-200">
                  {new Date(user.createdAt).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </section>

          {/* Subscription */}
          <section
            className={`rounded-xl border p-6 ${
              user.isPro
                ? "border-purple-500/30 bg-gradient-to-br from-purple-500/10 via-neutral-950/60 to-neutral-950/60"
                : "border-neutral-900 bg-neutral-950/60"
            }`}
          >
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Subscription
            </h2>

            {user.isPro ? (
              <>
                <div className="flex items-center gap-2 text-lg font-semibold text-white">
                  <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-purple-400 to-purple-600 px-2.5 py-0.5 text-xs uppercase tracking-wider text-white">
                    Pro
                  </span>
                  Active
                </div>

                <dl className="mt-4 space-y-2 text-sm">
                  {user.proPlan && (
                    <div className="flex justify-between">
                      <dt className="text-neutral-500">Plan</dt>
                      <dd className="text-neutral-200">
                        {LABELS[user.proPlan]} · {PRICES[user.proPlan]}
                      </dd>
                    </div>
                  )}
                  {user.proSince && (
                    <div className="flex justify-between">
                      <dt className="text-neutral-500">Started</dt>
                      <dd className="text-neutral-200">
                        {new Date(user.proSince).toLocaleDateString()}
                      </dd>
                    </div>
                  )}
                  {user.proPlan === "lifetime" ? (
                    <div className="flex justify-between">
                      <dt className="text-neutral-500">Renewal</dt>
                      <dd className="text-neutral-200">Never — yours forever</dd>
                    </div>
                  ) : user.proExpiresAt ? (
                    <div className="flex justify-between">
                      <dt className="text-neutral-500">
                        {user.proPlan === "monthly" ? "Renews on" : "Renews on"}
                      </dt>
                      <dd className="text-neutral-200">
                        {new Date(user.proExpiresAt).toLocaleDateString()}
                      </dd>
                    </div>
                  ) : null}
                </dl>

                <div className="mt-5 flex flex-wrap gap-2">
                  {user.proPlan !== "lifetime" && (
                    <>
                      {user.proPlan !== "yearly" && (
                        <button
                          type="button"
                          onClick={() => hit("/api/subscribe", "yearly")}
                          disabled={loading}
                          className="rounded-lg border border-purple-500/40 bg-purple-500/10 px-4 py-2 text-sm text-purple-200 hover:border-purple-500/70 hover:bg-purple-500/20 disabled:opacity-60"
                        >
                          Switch to yearly · save 17%
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => hit("/api/subscribe", "lifetime")}
                        disabled={loading}
                        className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm text-amber-200 hover:border-amber-500/70 hover:bg-amber-500/20 disabled:opacity-60"
                      >
                        Upgrade to lifetime
                      </button>
                      <button
                        type="button"
                        onClick={() => hit("/api/unsubscribe")}
                        disabled={loading}
                        className="rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-2 text-sm text-neutral-300 hover:border-red-900 hover:text-red-300 disabled:opacity-60"
                      >
                        Cancel subscription
                      </button>
                    </>
                  )}
                  {user.proPlan === "lifetime" && (
                    <p className="text-sm text-neutral-400">
                      Thanks for going lifetime. No renewals, no cancel needed.
                    </p>
                  )}
                </div>
              </>
            ) : (
              <>
                <p className="text-neutral-300">You&apos;re on the free tier.</p>
                <p className="mt-2 text-sm text-neutral-500">
                  Upgrade to Pro for unlimited resumes, cover letters, and interview prep
                  — powered by Claude Opus 4.7.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Link
                    href="/pricing"
                    className="rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-500/30 hover:brightness-110"
                  >
                    See Pro plans →
                  </Link>
                </div>
              </>
            )}

            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

            <p className="mt-6 text-xs text-neutral-600">
              Billing is in dev mode — clicks flip the Pro flag directly. Real Stripe
              checkout will replace this before launch.
            </p>
          </section>
        </div>
      )}
    </main>
  );
}
