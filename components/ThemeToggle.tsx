"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "money.theme";
type Theme = "light" | "dark";

/**
 * Pill-shaped sun/moon toggle.
 * Reads the current theme from the <html> class (set by the inline
 * pre-hydration script in app/layout.tsx), so it never flashes the wrong
 * state on first paint.
 */
export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const isLight = document.documentElement.classList.contains("light");
    setTheme(isLight ? "light" : "dark");
  }, []);

  function setAndPersist(next: Theme) {
    setTheme(next);
    const html = document.documentElement;
    if (next === "light") html.classList.add("light");
    else html.classList.remove("light");
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // quota / privacy mode — ignore
    }
  }

  function toggle() {
    setAndPersist(theme === "light" ? "dark" : "light");
  }

  // Don't render until we know the theme — avoids flicker.
  if (theme === null) {
    return <div aria-hidden className="h-8 w-16" />;
  }

  const isLight = theme === "light";

  return (
    <button
      type="button"
      onClick={toggle}
      role="switch"
      aria-checked={isLight}
      aria-label={`Switch to ${isLight ? "dark" : "light"} mode`}
      title={`Switch to ${isLight ? "dark" : "light"} mode`}
      className="relative inline-flex h-8 w-16 flex-none items-center rounded-full border border-neutral-800 bg-neutral-950 p-1 transition-colors hover:border-neutral-700"
    >
      {/* Track icons */}
      <span className="pointer-events-none absolute inset-0 flex items-center justify-between px-2 text-neutral-500">
        <SunIcon className={isLight ? "opacity-30" : "opacity-60"} />
        <MoonIcon className={isLight ? "opacity-60" : "opacity-30"} />
      </span>
      {/* Sliding knob */}
      <span
        className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white text-neutral-900 shadow transition-transform duration-200 ${
          isLight ? "translate-x-0" : "translate-x-8"
        }`}
      >
        {isLight ? <SunIcon solid /> : <MoonIcon solid />}
      </span>
    </button>
  );
}

function SunIcon({ className, solid }: { className?: string; solid?: boolean }) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill={solid ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r={solid ? "4" : "5"} />
      {!solid && (
        <>
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </>
      )}
    </svg>
  );
}

function MoonIcon({ className, solid }: { className?: string; solid?: boolean }) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill={solid ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}
