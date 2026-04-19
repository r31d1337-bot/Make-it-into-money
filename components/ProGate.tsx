"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type SessionUser = { id: string; email: string; createdAt: number; isPro?: boolean };

type Props = {
  /** Short name of the feature being gated, e.g. "the resume writer". */
  feature: string;
  children: React.ReactNode;
};

/**
 * Client-side gate for Pro-only tool pages. Fetches /api/auth/me on mount:
 * - signed-in + Pro → renders children
 * - signed-in + not Pro → renders upgrade CTA
 * - not signed in → renders sign-in CTA
 *
 * The API routes also enforce Pro server-side — this layer is UX, not security.
 */
export default function ProGate({ feature, children }: Props) {
  const pathname = usePathname();
  const [user, setUser] = useState<SessionUser | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { user: null }))
      .then((data) => {
        if (!cancelled) setUser(data.user ?? null);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  if (user === undefined) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-neutral-500">
        Loading...
      </div>
    );
  }

  if (user && user.isPro) {
    return <>{children}</>;
  }

  const next = encodeURIComponent(pathname || "/");

  return (
    <div className="mx-auto max-w-xl py-8">
      <div className="rounded-2xl border border-purple-500/30 bg-purple-500/5 p-8 text-center shadow-xl shadow-purple-500/5">
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-purple-500/40 bg-purple-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-purple-200">
          <LockIcon />
          Pro feature
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-white">
          Unlock {feature} with Pro
        </h2>
        <p className="mx-auto mt-3 max-w-md text-neutral-400">
          Pro gives you unlimited resumes, cover letters, and interview prep — all powered
          by Claude Opus 4.7 for sharper, more tailored results.
        </p>
        <p className="mt-4 text-3xl font-semibold tracking-tight text-white">
          $7.99<span className="text-base font-normal text-neutral-500">/month</span>
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {user ? (
            <Link
              href="/pricing"
              className="rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/30 transition hover:brightness-110"
            >
              Upgrade to Pro →
            </Link>
          ) : (
            <>
              <Link
                href={`/signup?next=${next}`}
                className="rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/30 transition hover:brightness-110"
              >
                Sign up to continue
              </Link>
              <Link
                href={`/login?next=${next}`}
                className="rounded-lg border border-neutral-800 bg-neutral-950 px-5 py-2.5 text-sm font-medium text-neutral-300 hover:border-neutral-700 hover:text-white"
              >
                Sign in
              </Link>
            </>
          )}
        </div>

        <p className="mt-6 text-xs text-neutral-500">
          Or use the{" "}
          <Link href="/" className="text-neutral-300 underline decoration-dotted hover:text-white">
            Turn This Into Money
          </Link>{" "}
          tool — it stays free forever.
        </p>
      </div>
    </div>
  );
}

function LockIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
