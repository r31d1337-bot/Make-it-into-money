import Link from "next/link";
import MobileNav from "@/components/MobileNav";
import HeaderModelToggle from "@/components/HeaderModelToggle";
import ThemeToggle from "@/components/ThemeToggle";
import AuthBar from "@/components/AuthBar";
import ToolsMenu from "@/components/ToolsMenu";
import Wordmark from "@/components/Wordmark";

const TOOLS = [
  {
    title: "Turn it into money",
    href: "/monetize",
    tag: "Free",
    tagColor: "neutral" as const,
    blurb: "Describe a skill or idea. Get a concrete plan: quickest path to $1, three business models, first five customers, pricing, and a 30-day action checklist.",
    icon: "💵",
  },
  {
    title: "Write my resume",
    href: "/resume",
    tag: "Pro",
    tagColor: "purple" as const,
    blurb: "Dump your background in rough notes. Get a polished, ATS-friendly, one-page resume in 20 seconds.",
    icon: "📄",
  },
  {
    title: "Cover letter",
    href: "/cover-letter",
    tag: "Pro",
    tagColor: "purple" as const,
    blurb: "Paste the job posting. Get a tight, three-paragraph letter that doesn't say 'results-driven team player'.",
    icon: "✉️",
  },
  {
    title: "Interview prep",
    href: "/interview-prep",
    tag: "Pro",
    tagColor: "purple" as const,
    blurb: "Eight tailored questions for this exact role, how to approach each, and five smart questions to ask them.",
    icon: "🎯",
  },
];

const STEPS = [
  { n: "1", t: "Tell us what you know", d: "Any skill, idea, or job posting — rough notes are fine." },
  { n: "2", t: "Claude writes it up", d: "Streamed in seconds. Opus 4.7 on Pro, Sonnet 4.6 on free." },
  { n: "3", t: "Ship it, save it, share it", d: "Check off action items, export to PDF, remix it for the next one." },
];

export default function Landing() {
  return (
    <main className="relative">
      <div
        aria-hidden
        className="ambient-glow pointer-events-none absolute inset-x-0 top-0 -z-10 h-[720px]"
      />

      {/* Top bar */}
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 pt-8">
        <div className="flex items-center gap-3">
          <Wordmark />
          <ToolsMenu />
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          <HeaderModelToggle />          <ThemeToggle />
          <AuthBar />
        </div>
        <MobileNav />
      </div>

      {/* Hero */}
      <section className="mx-auto max-w-3xl px-6 pb-12 pt-16 text-center sm:pt-24">
        <p className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs uppercase tracking-wider text-purple-200">
          <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
          Powered by artificial intelligence
        </p>
        <h1 className="bg-gradient-to-br from-white to-neutral-400 bg-clip-text text-5xl font-semibold leading-[1.05] tracking-tight text-transparent sm:text-7xl">
          Make what you know pay.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-neutral-400">
          One app that turns any skill into a monetization plan, a polished resume, a
          sharp cover letter, and tailored interview prep. Built so you can go from idea
          to income faster.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/monetize"
            className="rounded-lg bg-gradient-to-br from-white to-neutral-200 px-6 py-3 text-sm font-semibold text-black shadow-lg shadow-white/10 transition hover:brightness-110"
          >
            Try it free →
          </Link>
          <Link
            href="/pricing"
            className="rounded-lg border border-neutral-800 bg-neutral-950 px-6 py-3 text-sm font-medium text-neutral-300 hover:border-neutral-700 hover:text-white"
          >
            See Pro plans
          </Link>
        </div>
        <p className="mt-4 text-xs text-neutral-500">
          No credit card · Monetize tool is free forever
        </p>
      </section>

      {/* Feature grid */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="mb-2 text-center text-xs font-semibold uppercase tracking-wider text-neutral-500">
          Four tools
        </h2>
        <p className="mb-12 text-center text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Everything you need, one account.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {TOOLS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="group relative rounded-2xl border border-neutral-900 bg-neutral-950/60 p-6 transition hover:border-neutral-700 hover:bg-neutral-950"
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="text-3xl">{t.icon}</div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                    t.tagColor === "purple"
                      ? "bg-gradient-to-r from-purple-400 to-purple-600 text-white shadow-lg shadow-purple-500/30"
                      : "border border-neutral-800 text-neutral-400"
                  }`}
                >
                  {t.tag}
                </span>
              </div>
              <h3 className="mb-1 text-lg font-semibold text-white group-hover:text-white">
                {t.title}
              </h3>
              <p className="text-sm leading-relaxed text-neutral-400">{t.blurb}</p>
              <div className="mt-4 text-sm text-purple-300 opacity-0 transition group-hover:opacity-100">
                Open →
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="mb-2 text-center text-xs font-semibold uppercase tracking-wider text-neutral-500">
          How it works
        </h2>
        <p className="mb-12 text-center text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          From rough notes to real output in 30 seconds.
        </p>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="rounded-xl border border-neutral-900 bg-neutral-950/40 p-6">
              <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-purple-500/40 bg-purple-500/10 text-sm font-semibold text-purple-200">
                {s.n}
              </div>
              <h3 className="mb-1 text-lg font-semibold text-white">{s.t}</h3>
              <p className="text-sm text-neutral-400">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="mx-auto max-w-3xl px-6 py-16 text-center">
        <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Free to start. Pro when you&apos;re ready.
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-neutral-400">
          The monetize tool is unlimited and free forever. Upgrade to Pro for the full
          career suite — resume, cover letter, and interview prep — from $7.99/month.
        </p>
        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-neutral-900 bg-neutral-950/60 p-5">
            <div className="text-xs uppercase tracking-wider text-neutral-500">Monthly</div>
            <div className="mt-1 text-2xl font-semibold text-white">$7.99</div>
            <div className="text-xs text-neutral-500">per month</div>
          </div>
          <div className="rounded-xl border border-purple-500/40 bg-purple-500/10 p-5">
            <div className="text-xs uppercase tracking-wider text-purple-200">Yearly</div>
            <div className="mt-1 text-2xl font-semibold text-white">$79</div>
            <div className="text-xs text-neutral-400">per year · save 17%</div>
          </div>
          <div className="rounded-xl border border-neutral-900 bg-neutral-950/60 p-5">
            <div className="text-xs uppercase tracking-wider text-neutral-500">Lifetime</div>
            <div className="mt-1 text-2xl font-semibold text-white">$249</div>
            <div className="text-xs text-neutral-500">one-time · never pay again</div>
          </div>
        </div>
        <Link
          href="/pricing"
          className="mt-8 inline-flex rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/30 hover:brightness-110"
        >
          See full plan comparison →
        </Link>
      </section>

      {/* Bottom CTA */}
      <section className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          You have a skill.
          <br />
          It&apos;s worth something.
        </h2>
        <p className="mx-auto mt-4 max-w-md text-neutral-400">
          Stop wondering. Start with one idea.
        </p>
        <Link
          href="/monetize"
          className="mt-8 inline-flex rounded-lg bg-gradient-to-br from-white to-neutral-200 px-8 py-3.5 text-sm font-semibold text-black shadow-lg shadow-white/10 transition hover:brightness-110"
        >
          Turn it into money →
        </Link>
      </section>
    </main>
  );
}
