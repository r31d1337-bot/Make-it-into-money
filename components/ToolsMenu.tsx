"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Tool = {
  href: string;
  label: string;
  desc: string;
  pro?: boolean;
};

const TOOLS: Tool[] = [
  { href: "/", label: "Monetize an idea", desc: "Turn any skill into a plan · free" },
  { href: "/resume", label: "Write my resume", desc: "One-page ATS-friendly resume", pro: true },
  { href: "/cover-letter", label: "Cover letter", desc: "Tight three-paragraph letter", pro: true },
  { href: "/interview-prep", label: "Interview prep", desc: "Tailored questions + prep", pro: true },
  { href: "/discover", label: "Discover", desc: "Plans shared by others · free" },
  { href: "/pricing", label: "Pricing", desc: "Free vs Pro" },
];

export default function ToolsMenu() {
  const [open, setOpen] = useState(false);
  const [isPro, setIsPro] = useState<boolean | null>(null);
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => setOpen(false), [pathname]);

  // Read Pro status so we can show/hide lock icons. Cheap and cached.
  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { user: null }))
      .then((data) => setIsPro(!!data?.user?.isPro))
      .catch(() => setIsPro(false));
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const current = TOOLS.find((t) => t.href === pathname);
  const currentLabel = current?.label.split(" ")[0] ?? "Tools";

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-sm text-neutral-300 hover:border-neutral-700 hover:text-white"
      >
        {currentLabel}
        <svg
          className={`transition-transform ${open ? "rotate-180" : ""}`}
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 z-50 mt-1 w-72 rounded-lg border border-neutral-800 bg-neutral-950 p-1 shadow-xl shadow-black/50"
        >
          {TOOLS.map((t) => {
            const active = t.href === pathname;
            const locked = !!t.pro && isPro === false;
            return (
              <Link
                key={t.href}
                href={t.href}
                role="menuitem"
                className={`flex items-start justify-between gap-2 rounded px-3 py-2 transition ${
                  active
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-300 hover:bg-neutral-900 hover:text-white"
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-sm font-medium">
                    {t.label}
                    {t.pro && (
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
                  </div>
                  <div className="text-xs text-neutral-500">{t.desc}</div>
                </div>
                {locked && <LockIcon />}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function LockIcon() {
  return (
    <svg
      className="mt-0.5 flex-none text-neutral-600"
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
