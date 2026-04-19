"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useModelChoice, type ModelChoice } from "./ModelPicker";

/**
 * Compact segmented pill for Pro users to pick Opus vs Sonnet globally.
 * Lives in every page header next to the theme toggle. Free users and
 * signed-out visitors don't see it at all — they always get Sonnet.
 *
 * Stays in sync with the inline ModelPicker on Pro tool pages via the
 * shared useModelChoice() hook (localStorage + custom event).
 */
export default function HeaderModelToggle() {
  const pathname = usePathname();
  const [isPro, setIsPro] = useState<boolean | null>(null);
  const [choice, setChoice] = useModelChoice();

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { user: null }))
      .then((data) => {
        if (!cancelled) setIsPro(!!data?.user?.isPro);
      })
      .catch(() => {
        if (!cancelled) setIsPro(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]); // re-check when route changes (login/logout/upgrade)

  // While we don't know yet, reserve nothing — avoids layout shift.
  if (isPro === null) return null;
  if (!isPro) return null;

  const OPTIONS: { value: ModelChoice; label: string; hint: string }[] = [
    { value: "opus", label: "Opus", hint: "Claude Opus 4.7 — sharpest" },
    { value: "sonnet", label: "Sonnet", hint: "Claude Sonnet 4.6 — faster" },
  ];

  return (
    <div
      role="radiogroup"
      aria-label="AI model"
      className="inline-flex rounded-full border border-neutral-800 bg-neutral-950 p-0.5"
    >
      {OPTIONS.map((opt) => {
        const active = choice === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setChoice(opt.value)}
            title={opt.hint}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              active
                ? "bg-purple-500/20 text-purple-100 shadow-sm"
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
