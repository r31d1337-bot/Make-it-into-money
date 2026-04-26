"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useModelChoice, type ModelChoice } from "./ModelPicker";

type SessionUser = {
  id: string;
  email: string;
  isPro?: boolean;
};

const NAV_GROUPS: Array<{
  heading: string;
  items: Array<{ href: string; label: string; pro?: boolean; hint?: string }>;
}> = [
  {
    heading: "Tools",
    items: [
      { href: "/monetize", label: "Monetize an idea" },
      { href: "/checklist", label: "Checklist" },
      { href: "/resume", label: "Write my resume", pro: true },
      { href: "/cover-letter", label: "Cover letter", pro: true },
      { href: "/interview-prep", label: "Interview prep", pro: true },
    ],
  },
  {
    heading: "More",
    items: [
      { href: "/discover", label: "Discover" },
      { href: "/pricing", label: "Pricing" },
      { href: "/support", label: "Support" },
    ],
  },
];

/**
 * Full-screen mobile navigation sheet. Replaces the crowded desktop header
 * controls (ToolsMenu + HeaderModelToggle + AuthBar email) with a single
 * hamburger button. Tapping opens a right-side sheet with:
 * nav links, Pro-only model toggle, auth state.
 *
 * Only rendered via `sm:hidden` — desktop keeps the inline controls.
 */
export default function MobileNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<SessionUser | null | undefined>(undefined);
  const [modelChoice, setModelChoice] = useModelChoice();
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    // Lock body scroll while sheet is open.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Poll auth on route change.
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

  async function onLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    setUser(null);
    setLoggingOut(false);
    setOpen(false);
    router.refresh();
  }

  const isPro = !!user?.isPro;
  const next = encodeURIComponent(pathname || "/");

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-950 text-neutral-300 hover:border-neutral-700 hover:text-white sm:hidden"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          {/* Scrim */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          {/* Sheet */}
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="absolute right-0 top-0 flex h-full w-full max-w-xs flex-col overflow-y-auto border-l border-neutral-900 bg-neutral-950 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-neutral-900 px-5 py-4">
              <span className="text-sm font-semibold text-white">Menu</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-900 hover:text-white"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Nav groups */}
            <nav className="flex-1 px-3 py-4">
              {NAV_GROUPS.map((group) => (
                <div key={group.heading} className="mb-6">
                  <p className="mb-1 px-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    {group.heading}
                  </p>
                  <ul>
                    {group.items.map((item) => {
                      const active = item.href === pathname;
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition ${
                              active
                                ? "bg-neutral-900 text-white"
                                : "text-neutral-300 hover:bg-neutral-900 hover:text-white"
                            }`}
                          >
                            <span>{item.label}</span>
                            {item.pro && (
                              <span
                                className={`rounded px-1 text-[9px] font-semibold uppercase tracking-wider ${
                                  isPro
                                    ? "bg-purple-500/20 text-purple-200"
                                    : "bg-neutral-900 text-neutral-500"
                                }`}
                              >
                                Pro
                              </span>
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </nav>

            {/* Settings */}
            {isPro && (
              <div className="border-t border-neutral-900 px-5 py-5">
                <SettingRow label="Model">
                  <SegmentedTwo
                    value={modelChoice}
                    onChange={setModelChoice}
                    left={{ value: "opus", label: "Opus" }}
                    right={{ value: "sonnet", label: "Sonnet" }}
                  />
                </SettingRow>
              </div>
            )}

            {/* Auth */}
            <div className="border-t border-neutral-900 px-5 py-5">
              {user === undefined ? (
                <div className="h-10" />
              ) : user ? (
                <div className="space-y-3">
                  <div>
                    <p className="truncate text-sm font-medium text-white">
                      {user.email}
                    </p>
                    {user.isPro && (
                      <p className="mt-0.5 text-xs">
                        <span className="rounded bg-gradient-to-r from-purple-400 to-purple-600 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                          Pro
                        </span>
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href="/account"
                      className="flex-1 rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-center text-sm text-neutral-300 hover:border-neutral-700 hover:text-white"
                    >
                      Account
                    </Link>
                    <button
                      type="button"
                      onClick={onLogout}
                      disabled={loggingOut}
                      className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-300 hover:border-neutral-700 hover:text-white disabled:opacity-60"
                    >
                      {loggingOut ? "..." : "Sign out"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link
                    href={`/login?next=${next}`}
                    className="block rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-2.5 text-center text-sm text-neutral-300 hover:border-neutral-700 hover:text-white"
                  >
                    Sign in
                  </Link>
                  <Link
                    href={`/signup?next=${next}`}
                    className="block rounded-lg bg-gradient-to-br from-white to-neutral-200 px-4 py-2.5 text-center text-sm font-semibold text-black shadow hover:brightness-110"
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <span className="text-sm text-neutral-400">{label}</span>
      {children}
    </div>
  );
}

function SegmentedTwo<T extends string>({
  value,
  onChange,
  left,
  right,
}: {
  value: T;
  onChange: (v: T) => void;
  left: { value: T; label: string };
  right: { value: T; label: string };
}) {
  return (
    <div className="inline-flex rounded-full border border-neutral-800 bg-neutral-950 p-0.5">
      {[left, right].map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              active
                ? "bg-purple-500/20 text-purple-100"
                : "text-neutral-500 hover:text-white"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// Re-export for typing consistency in case something imports alongside ModelChoice.
export type { ModelChoice };
