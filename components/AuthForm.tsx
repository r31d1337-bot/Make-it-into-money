"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

type Mode = "login" | "signup";

/**
 * Shared form for both /login and /signup. Hits the corresponding endpoint,
 * then redirects to the `next` query param (or `/`) on success.
 */
export default function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const title = mode === "login" ? "Welcome back" : "Create an account";
  const cta = mode === "login" ? "Sign in" : "Sign up";
  const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/signup";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || `Request failed (${res.status})`);
      }
      router.push(next);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-sm">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mb-8 text-sm text-neutral-400">
        {mode === "login"
          ? "Sign in to save your plans to your account."
          : "Accounts keep your history and shared plans in one place."}
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
            className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-100 focus:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20 disabled:opacity-60"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-xs uppercase tracking-wider text-neutral-500">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-100 focus:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20 disabled:opacity-60"
          />
          {mode === "signup" && (
            <p className="mt-1 text-xs text-neutral-600">At least 8 characters.</p>
          )}
        </div>

        {error && (
          <div className="rounded-lg border border-red-900 bg-red-950/40 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !email || !password}
          className="w-full rounded-lg bg-gradient-to-br from-white to-neutral-200 px-4 py-2.5 text-sm font-semibold text-black shadow-lg shadow-white/10 transition hover:brightness-110 disabled:from-neutral-800 disabled:to-neutral-900 disabled:text-neutral-500 disabled:shadow-none"
        >
          {loading ? "Working..." : cta}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-500">
        {mode === "login" ? (
          <>
            New here?{" "}
            <Link href="/signup" className="text-purple-300 underline decoration-dotted hover:text-purple-200">
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="text-purple-300 underline decoration-dotted hover:text-purple-200">
              Sign in
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
