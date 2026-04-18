"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const TOOLS = [
  { href: "/", label: "Monetize an idea", desc: "Get a plan to make money from a skill" },
  { href: "/resume", label: "Write my resume", desc: "One-page ATS-friendly resume" },
  { href: "/cover-letter", label: "Cover letter", desc: "Tight three-paragraph letter" },
  { href: "/interview-prep", label: "Interview prep", desc: "Questions + tactical prep" },
  { href: "/discover", label: "Discover", desc: "Plans shared by others" },
];

export default function ToolsMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close on route change.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Close on outside click or Escape.
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

  const currentLabel =
    TOOLS.find((t) => t.href === pathname)?.label.split(" ")[0] ?? "Tools";

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
            return (
              <Link
                key={t.href}
                href={t.href}
                role="menuitem"
                className={`block rounded px-3 py-2 transition ${
                  active
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-300 hover:bg-neutral-900 hover:text-white"
                }`}
              >
                <div className="text-sm font-medium">{t.label}</div>
                <div className="text-xs text-neutral-500">{t.desc}</div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
