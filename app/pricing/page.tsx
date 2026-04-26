"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MobileNav from "@/components/MobileNav";
import HeaderModelToggle from "@/components/HeaderModelToggle";
import AuthBar from "@/components/AuthBar";
import ToolsMenu from "@/components/ToolsMenu";
import Wordmark from "@/components/Wordmark";

type SessionUser = {
  id: string;
  email: string;
  createdAt: number;
  isPro?: boolean;
  proSince?: number | null;
  proPlan?: "monthly" | "yearly" | "lifetime" | null;
  proExpiresAt?: number | null;
};

type Plan = "monthly" | "yearly" | "lifetime";

const PRO_FEATURES = [
  "Write my resume — unlimited",
  "Cover letter writer — unlimited",
  "Interview prep — unlimited",
  "All three on Claude Opus 4.7",
  "Priority email support",
];

const FREE_FEATURES = [
  "Unlimited Turn-This-Into-Money plans",
  "Web search for real market data",
  "Shareable plan links · Discover",
  "History on device",
];

export default function PricingPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null | undefined>(undefined);
  const [submitting, setSubmitting] = useState<Plan | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { user: null }))
      .then((data) => setUser(data.user ?? null))
      .catch(() => setUser(null));
  }, []);

  async function onUpgrade(plan: Plan) {
    if (!user) {
      router.push(`/signup?next=${encodeURIComponent("/pricing")}`);
      return;
    }
    setSubmitting(plan);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.url) {
        throw new Error(data?.error || `Checkout failed (${res.status})`);
      }
      // Hand off to Stripe's hosted checkout.
      window.location.href = data.url;
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(null);
    }
  }

  const isPro = !!user?.isPro;
  const currentPlan = user?.proPlan ?? null;

  return (
    <main className="relative mx-auto max-w-5xl px-6 py-10">
      <div
        aria-hidden
        className="ambient-glow pointer-events-none absolute inset-x-0 top-0 -z-10 h-[500px]"
      />

      <div className="mb-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Wordmark />
          <ToolsMenu />
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          <HeaderModelToggle />          <AuthBar />
        </div>
        <MobileNav />
      </div>

      <header className="mb-12 text-center">
        <h1 className="bg-gradient-to-br from-white to-neutral-400 bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-5xl">
          Pricing.
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-neutral-400">
          Monetize ideas free forever. Pick a Pro plan to unlock the career suite.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        {/* Free */}
        <PricingCard
          tier="Free"
          price="$0"
          period="forever"
          features={FREE_FEATURES}
          cta={
            <Link
              href="/monetize"
              className="inline-flex w-full justify-center rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-2.5 text-sm text-neutral-300 hover:border-neutral-700 hover:text-white"
            >
              Use free tools
            </Link>
          }
        />

        {/* Monthly */}
        <PricingCard
          tier="Pro · Monthly"
          price="$7.99"
          period="per month"
          subtitle="Cancel anytime."
          features={PRO_FEATURES}
          highlight={false}
          cta={
            <UpgradeButton
              plan="monthly"
              current={isPro && currentPlan === "monthly"}
              submitting={submitting === "monthly"}
              onClick={() => onUpgrade("monthly")}
              disabled={user === undefined || submitting !== null}
              hasUser={!!user}
            />
          }
        />

        {/* Yearly — most popular */}
        <PricingCard
          tier="Pro · Yearly"
          price="$79"
          period="per year"
          subtitle="Save 17% vs monthly · $6.58/mo effective"
          badge="Most popular"
          badgeColor="purple"
          features={PRO_FEATURES}
          highlight
          cta={
            <UpgradeButton
              plan="yearly"
              current={isPro && currentPlan === "yearly"}
              submitting={submitting === "yearly"}
              onClick={() => onUpgrade("yearly")}
              disabled={user === undefined || submitting !== null}
              hasUser={!!user}
            />
          }
        />

        {/* Lifetime */}
        <PricingCard
          tier="Pro · Lifetime"
          price="$249"
          period="one-time"
          subtitle="Pay once. Yours forever."
          badge="Best value"
          badgeColor="amber"
          features={[...PRO_FEATURES, "Never pay again"]}
          cta={
            <UpgradeButton
              plan="lifetime"
              current={isPro && currentPlan === "lifetime"}
              submitting={submitting === "lifetime"}
              onClick={() => onUpgrade("lifetime")}
              disabled={user === undefined || submitting !== null}
              hasUser={!!user}
            />
          }
        />
      </div>

      {error && (
        <p className="mt-6 text-center text-sm text-red-400">{error}</p>
      )}

      {isPro && (
        <p className="mt-8 text-center text-sm text-neutral-500">
          You&apos;re on Pro{currentPlan ? ` · ${currentPlan}` : ""}.{" "}
          <Link href="/account" className="text-purple-300 underline decoration-dotted hover:text-purple-200">
            Manage in Account →
          </Link>
        </p>
      )}

      <section className="mx-auto mt-16 max-w-2xl text-sm text-neutral-500">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">
          FAQ
        </h3>
        <dl className="space-y-4">
          <div>
            <dt className="mb-1 font-medium text-neutral-300">
              What&apos;s the difference between Sonnet and Opus?
            </dt>
            <dd>
              Opus is Anthropic&apos;s top model — sharper reasoning, more nuanced
              writing. Best for career documents where one word matters.
            </dd>
          </div>
          <div>
            <dt className="mb-1 font-medium text-neutral-300">Can I cancel monthly or yearly?</dt>
            <dd>Yes. Cancel from the Account page anytime. You keep access until the end of the current period.</dd>
          </div>
          <div>
            <dt className="mb-1 font-medium text-neutral-300">Is lifetime really forever?</dt>
            <dd>Yes — one payment, Pro access for as long as mintr exists.</dd>
          </div>
          <div>
            <dt className="mb-1 font-medium text-neutral-300">Is Turn This Into Money really free forever?</dt>
            <dd>Yes. Unlimited, no credit card, no daily limit.</dd>
          </div>
        </dl>
        <p className="mt-10 text-center text-xs text-neutral-600">
          Secure checkout by Stripe. Cancel anytime from your Account page.
        </p>
      </section>
    </main>
  );
}

function PricingCard({
  tier,
  price,
  period,
  subtitle,
  badge,
  badgeColor,
  features,
  cta,
  highlight,
}: {
  tier: string;
  price: string;
  period: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: "purple" | "amber";
  features: string[];
  cta: React.ReactNode;
  highlight?: boolean;
}) {
  const badgeClass =
    badgeColor === "amber"
      ? "from-amber-400 to-orange-500 shadow-amber-500/30"
      : "from-purple-400 to-purple-600 shadow-purple-500/30";
  return (
    <section
      className={`relative flex flex-col rounded-2xl border p-6 ${
        highlight
          ? "border-purple-500/30 bg-gradient-to-br from-purple-500/10 via-neutral-950/60 to-neutral-950/60 shadow-xl shadow-purple-500/10"
          : "border-neutral-900 bg-neutral-950/60"
      }`}
    >
      {badge && (
        <div
          className={`absolute -top-3 right-4 rounded-full bg-gradient-to-r px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white shadow-lg ${badgeClass}`}
        >
          {badge}
        </div>
      )}
      <h2
        className={`text-xs font-semibold uppercase tracking-wider ${
          highlight ? "text-purple-200" : "text-neutral-500"
        }`}
      >
        {tier}
      </h2>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-white">
        {price}
        <span className="ml-1 text-sm font-normal text-neutral-500">{period}</span>
      </p>
      {subtitle && <p className="mt-1 text-xs text-neutral-500">{subtitle}</p>}

      <ul className="mt-5 flex-1 space-y-2">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-neutral-300">
            <CheckIcon className={highlight ? "text-purple-300" : "text-neutral-500"} />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6">{cta}</div>
    </section>
  );
}

function UpgradeButton({
  plan,
  current,
  submitting,
  onClick,
  disabled,
  hasUser,
}: {
  plan: Plan;
  current: boolean;
  submitting: boolean;
  onClick: () => void;
  disabled: boolean;
  hasUser: boolean;
}) {
  if (current) {
    return (
      <div className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-purple-500/40 bg-purple-500/10 px-4 py-2.5 text-sm font-medium text-purple-200">
        <CheckIcon />
        Current plan
      </div>
    );
  }
  const label = submitting
    ? "Starting..."
    : !hasUser
      ? "Sign up for Pro"
      : plan === "lifetime"
        ? "Buy lifetime"
        : plan === "yearly"
          ? "Start yearly"
          : "Start monthly";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex w-full justify-center rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/30 transition hover:brightness-110 disabled:from-neutral-800 disabled:to-neutral-900 disabled:text-neutral-500 disabled:shadow-none"
    >
      {label}
    </button>
  );
}

function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`mt-0.5 flex-none ${className}`}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
