"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type SessionUser = { id: string; email: string; createdAt: number; isPro?: boolean };

/**
 * Header widget: "Sign in / Sign up" when logged out, or email + "Log out"
 * dropdown when logged in. Hits /api/auth/me on mount to read state.
 */
export default function AuthBar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<SessionUser | null | undefined>(undefined);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

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
  }, [pathname]); // re-check on route change (e.g., after /login redirect)

  async function onLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    setUser(null);
    setMenuOpen(false);
    setLoggingOut(false);
    router.refresh();
  }

  // Initial fetch in progress — reserve space but don't flash a button.
  if (user === undefined) {
    return <div aria-hidden className="h-8 w-20" />;
  }

  if (!user) {
    const next = encodeURIComponent(pathname || "/");
    return (
      <div className="flex items-center gap-1.5">
        <Link
          href={`/login?next=${next}`}
          className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-sm text-neutral-300 hover:border-neutral-700 hover:text-white"
        >
          Sign in
        </Link>
        <Link
          href={`/signup?next=${next}`}
          className="rounded-lg bg-gradient-to-br from-white to-neutral-200 px-3 py-1.5 text-sm font-medium text-black shadow hover:brightness-110"
        >
          Sign up
        </Link>
      </div>
    );
  }

  const initial = user.email.charAt(0).toUpperCase();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-950 py-1 pl-1 pr-3 text-sm text-neutral-300 hover:border-neutral-700 hover:text-white"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-purple-500/20 text-xs font-semibold text-purple-200">
          {initial}
        </span>
        <span className="hidden max-w-[140px] truncate sm:inline">{user.email}</span>
        {user.isPro && (
          <span className="rounded bg-gradient-to-r from-purple-400 to-purple-600 px-1 text-[9px] font-semibold uppercase tracking-wider text-white">
            Pro
          </span>
        )}
      </button>

      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setMenuOpen(false)}
            aria-hidden
          />
          <div
            role="menu"
            className="absolute right-0 z-50 mt-1 w-48 rounded-lg border border-neutral-800 bg-neutral-950 p-1 shadow-xl shadow-black/50"
          >
            <div className="px-3 py-2 text-xs text-neutral-500">
              Signed in as
              <div className="mt-0.5 flex items-center gap-1.5 truncate text-neutral-200">
                <span className="truncate">{user.email}</span>
                {user.isPro && (
                  <span className="rounded bg-gradient-to-r from-purple-400 to-purple-600 px-1 text-[9px] font-semibold uppercase tracking-wider text-white">
                    Pro
                  </span>
                )}
              </div>
            </div>
            <div className="my-1 h-px bg-neutral-900" />
            <Link
              href="/account"
              role="menuitem"
              className="block rounded px-3 py-1.5 text-left text-sm text-neutral-300 hover:bg-neutral-900 hover:text-white"
              onClick={() => setMenuOpen(false)}
            >
              Account
            </Link>
            {!user.isPro && (
              <Link
                href="/pricing"
                role="menuitem"
                className="block rounded px-3 py-1.5 text-left text-sm text-purple-300 hover:bg-neutral-900 hover:text-purple-200"
                onClick={() => setMenuOpen(false)}
              >
                Upgrade to Pro
              </Link>
            )}
            <div className="my-1 h-px bg-neutral-900" />
            <button
              type="button"
              onClick={onLogout}
              disabled={loggingOut}
              role="menuitem"
              className="block w-full rounded px-3 py-1.5 text-left text-sm text-neutral-300 hover:bg-neutral-900 hover:text-white disabled:opacity-60"
            >
              {loggingOut ? "Signing out..." : "Sign out"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
