import Link from "next/link";
import Wordmark from "./Wordmark";
import MobileNav from "./MobileNav";

/**
 * Phone-first home screen. Shown to mobile browsers (and to PWA users
 * before the PwaRedirect kicks in). Skips the long marketing scroll —
 * just wordmark, hero CTA, tool tiles, and a compact upgrade nudge.
 *
 * Rendered alongside the desktop landing in app/page.tsx, gated by
 * Tailwind's `sm:hidden` / `hidden sm:block` so server HTML matches
 * the breakpoint without a flash.
 */

const TOOLS: Array<{
  href: string;
  title: string;
  blurb: string;
  icon: string;
  pro?: boolean;
}> = [
  {
    href: "/monetize",
    title: "Monetize an idea",
    blurb: "A real plan in 30 seconds.",
    icon: "💵",
  },
  {
    href: "/resume",
    title: "Write my resume",
    blurb: "Rough notes → ATS-ready.",
    icon: "📄",
    pro: true,
  },
  {
    href: "/cover-letter",
    title: "Cover letter",
    blurb: "Three paragraphs, no fluff.",
    icon: "✉️",
    pro: true,
  },
  {
    href: "/interview-prep",
    title: "Interview prep",
    blurb: "Eight tailored questions.",
    icon: "🎯",
    pro: true,
  },
];

export default function MobileHome() {
  return (
    <main className="relative mx-auto flex min-h-screen max-w-md flex-col px-5 pb-10 pt-6">
      <div
        aria-hidden
        className="ambient-glow pointer-events-none absolute inset-x-0 top-0 -z-10 h-[360px]"
      />

      {/* Top bar */}
      <nav className="mb-6 flex items-center justify-between">
        <Wordmark />
        <MobileNav />
      </nav>

      {/* Hero */}
      <section className="mb-7">
        <h1 className="bg-gradient-to-br from-white to-neutral-400 bg-clip-text text-4xl font-semibold leading-[1.05] tracking-tight text-transparent">
          Make what you know pay.
        </h1>
        <p className="mt-3 text-sm text-neutral-400">
          Turn a skill into a plan, a polished resume, a sharp cover letter,
          or interview prep — in seconds.
        </p>
        <Link
          href="/monetize"
          className="mt-5 flex items-center justify-center rounded-xl bg-gradient-to-br from-white to-neutral-200 px-5 py-3.5 text-sm font-semibold text-black shadow-lg shadow-white/10 active:brightness-95"
        >
          Try it free →
        </Link>
        <p className="mt-2 text-center text-[11px] text-neutral-500">
          No credit card · Monetize is free forever
        </p>
      </section>

      {/* Tool grid */}
      <section className="mb-8 grid grid-cols-2 gap-3">
        {TOOLS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="group relative flex min-h-[112px] flex-col justify-between rounded-2xl border border-neutral-900 bg-neutral-950/70 p-3.5 transition active:bg-neutral-900"
          >
            <div className="flex items-start justify-between">
              <span className="text-2xl">{t.icon}</span>
              {t.pro ? (
                <span className="rounded-full bg-gradient-to-r from-purple-400 to-purple-600 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white shadow-sm shadow-purple-500/40">
                  Pro
                </span>
              ) : (
                <span className="rounded-full border border-neutral-800 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-neutral-500">
                  Free
                </span>
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">{t.title}</h3>
              <p className="mt-0.5 text-xs leading-snug text-neutral-500">
                {t.blurb}
              </p>
            </div>
          </Link>
        ))}
      </section>

      {/* Pricing nudge */}
      <section className="mb-6 rounded-2xl border border-purple-500/30 bg-purple-500/10 p-5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-purple-200">
          Unlock everything
        </p>
        <h2 className="mt-1 text-lg font-semibold text-white">
          Pro from $7.99/mo
        </h2>
        <p className="mt-1.5 text-xs leading-relaxed text-neutral-400">
          Resume, cover letter, and interview prep — plus your pick of Opus 4.7
          or Sonnet 4.6.
        </p>
        <Link
          href="/pricing"
          className="mt-4 inline-flex items-center rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 px-4 py-2 text-xs font-semibold text-white shadow shadow-purple-500/30 active:brightness-95"
        >
          See plans →
        </Link>
      </section>

      <p className="mt-auto text-center text-[11px] text-neutral-600">
        Powered by artificial intelligence
      </p>
    </main>
  );
}
