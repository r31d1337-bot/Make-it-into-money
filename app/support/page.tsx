import Link from "next/link";
import HeaderModelToggle from "@/components/HeaderModelToggle";
import MobileNav from "@/components/MobileNav";
import AuthBar from "@/components/AuthBar";
import ToolsMenu from "@/components/ToolsMenu";
import Wordmark from "@/components/Wordmark";

export const metadata = {
  title: "Support · mintr",
  description: "Contact the mintr team. Email team@adroitventures.io.",
};

const SUPPORT_EMAIL = "team@adroitventures.io";

const FAQ: Array<{ q: string; a: React.ReactNode }> = [
  {
    q: "How do I cancel my subscription?",
    a: (
      <>
        Open your{" "}
        <Link href="/account" className="text-purple-300 underline decoration-dotted">
          Account page
        </Link>{" "}
        → click <span className="text-white">Manage billing (Stripe)</span>. That opens
        Stripe&apos;s customer portal where you can cancel. You keep Pro access until
        the end of your current paid period.
      </>
    ),
  },
  {
    q: "I didn't get my verification / password reset email.",
    a: (
      <>
        Check your spam folder first. If it&apos;s not there, you can request another
        from the{" "}
        <Link href="/account" className="text-purple-300 underline decoration-dotted">
          Account page
        </Link>{" "}
        (verification) or{" "}
        <Link href="/forgot-password" className="text-purple-300 underline decoration-dotted">
          Forgot password
        </Link>{" "}
        (reset). If you still don&apos;t get it, email us.
      </>
    ),
  },
  {
    q: "What's the refund policy?",
    a: (
      <>
        Monthly and yearly subscriptions aren&apos;t refunded for partial periods —
        cancel and you keep access till the end. Lifetime purchases are refundable
        within 7 days of purchase. For billing errors or unauthorized charges, email
        us and we&apos;ll sort it out.
      </>
    ),
  },
  {
    q: "The AI got something wrong — can I report it?",
    a: (
      <>
        Yes. Copy the output and email us the details — what tool, what input, what
        went wrong. That feedback shapes the system prompts directly.
      </>
    ),
  },
  {
    q: "I want my data deleted.",
    a: (
      <>
        Email us from the address associated with your account and we&apos;ll delete
        everything — profile, history, shared plans, subscription record — within 7
        days. See our{" "}
        <Link href="/privacy" className="text-purple-300 underline decoration-dotted">
          Privacy Policy
        </Link>{" "}
        for the full data-rights overview.
      </>
    ),
  },
  {
    q: "Can I use mintr for something else — team/agency/enterprise?",
    a: (
      <>
        Absolutely. Email us with what you&apos;re trying to do — team seats,
        white-label, API access, higher rate limits — and we&apos;ll figure it out.
      </>
    ),
  },
];

export default function SupportPage() {
  return (
    <main className="relative mx-auto max-w-3xl px-6 py-10">
      <div
        aria-hidden
        className="ambient-glow pointer-events-none absolute inset-x-0 top-0 -z-10 h-[500px]"
      />

      <div className="mb-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Wordmark />
          <ToolsMenu />
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          <HeaderModelToggle />
          <AuthBar />
        </div>
        <MobileNav />
      </div>

      <header className="mb-10">
        <h1 className="bg-gradient-to-br from-white to-neutral-400 bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-5xl">
          Support.
        </h1>
        <p className="mt-3 text-neutral-400">
          Stuck? Have a question? Want to yell at us? Email the team — a real human
          reads every message.
        </p>
      </header>

      {/* Contact card */}
      <section className="mb-12 rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 via-neutral-950/60 to-neutral-950/60 p-6 shadow-xl shadow-purple-500/10">
        <p className="text-xs font-semibold uppercase tracking-wider text-purple-200">
          Email us
        </p>
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="mt-2 block text-2xl font-semibold tracking-tight text-white hover:text-purple-200 sm:text-3xl"
        >
          {SUPPORT_EMAIL}
        </a>
        <p className="mt-3 text-sm text-neutral-400">
          We aim to reply within 1 business day. Include screenshots, error messages,
          or plan URLs wherever you can — it speeds things up a lot.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <a
            href={`mailto:${SUPPORT_EMAIL}?subject=mintr%20support%20request`}
            className="inline-flex rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-500/30 hover:brightness-110"
          >
            Send email →
          </a>
          <a
            href={`mailto:${SUPPORT_EMAIL}?subject=Billing%20question`}
            className="inline-flex rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-2 text-sm text-neutral-300 hover:border-neutral-700 hover:text-white"
          >
            Billing question
          </a>
          <a
            href={`mailto:${SUPPORT_EMAIL}?subject=Bug%20report`}
            className="inline-flex rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-2 text-sm text-neutral-300 hover:border-neutral-700 hover:text-white"
          >
            Report a bug
          </a>
        </div>
      </section>

      {/* FAQ */}
      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-neutral-500">
          Frequently asked
        </h2>
        <dl className="space-y-4">
          {FAQ.map((item) => (
            <div
              key={item.q}
              className="rounded-xl border border-neutral-900 bg-neutral-950/60 p-5"
            >
              <dt className="mb-1.5 font-medium text-white">{item.q}</dt>
              <dd className="text-sm leading-relaxed text-neutral-400">{item.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-12 text-sm text-neutral-500">
        <p>
          For legal / privacy requests, the same email works. See also our{" "}
          <Link href="/terms" className="text-purple-300 underline decoration-dotted">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-purple-300 underline decoration-dotted">
            Privacy Policy
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
