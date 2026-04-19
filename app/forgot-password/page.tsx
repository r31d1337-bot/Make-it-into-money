"use client";

import Link from "next/link";
import { useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import HeaderModelToggle from "@/components/HeaderModelToggle";
import Wordmark from "@/components/Wordmark";
import MobileNav from "@/components/MobileNav";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      setSent(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative mx-auto flex min-h-[80vh] max-w-3xl flex-col px-6 py-10">
      <div
        aria-hidden
        className="ambient-glow pointer-events-none absolute inset-x-0 top-0 -z-10 h-[500px]"
      />
      <nav className="mb-12 flex items-center justify-between">
        <Wordmark />
        <div className="hidden items-center gap-2 sm:flex">
          <HeaderModelToggle />
          <ThemeToggle />
        </div>
        <MobileNav />
      </nav>

      <div className="flex flex-1 items-center">
        <div className="mx-auto w-full max-w-sm">
          {sent ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-purple-500/40 bg-purple-500/10">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-300">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <h1 className="text-2xl font-semibold tracking-tight">Check your inbox</h1>
              <p className="mt-3 text-sm text-neutral-400">
                If an account exists for <span className="text-neutral-200">{email}</span>,
                we&apos;ve sent a password reset link. It&apos;ll expire in 1 hour.
              </p>
              <Link
                href="/login"
                className="mt-6 inline-flex rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-2 text-sm text-neutral-300 hover:border-neutral-700 hover:text-white"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <h1 className="mb-1 text-2xl font-semibold tracking-tight">Forgot password?</h1>
              <p className="mb-8 text-sm text-neutral-400">
                Enter your email and we&apos;ll send you a reset link.
              </p>

              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="mb-1 block text-xs uppercase tracking-wider text-neutral-500">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    inputMode="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-base text-neutral-100 focus:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20 disabled:opacity-60"
                  />
                </div>

                {error && (
                  <div className="rounded-lg border border-red-900 bg-red-950/40 px-3 py-2 text-sm text-red-300">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full rounded-lg bg-gradient-to-br from-white to-neutral-200 px-4 py-2.5 text-sm font-semibold text-black shadow-lg shadow-white/10 transition hover:brightness-110 disabled:from-neutral-800 disabled:to-neutral-900 disabled:text-neutral-500 disabled:shadow-none"
                >
                  {loading ? "Sending…" : "Send reset link"}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-neutral-500">
                Remembered it?{" "}
                <Link href="/login" className="text-purple-300 underline decoration-dotted hover:text-purple-200">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
