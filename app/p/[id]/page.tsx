import Link from "next/link";
import { notFound } from "next/navigation";
import PlanMarkdown from "@/components/PlanMarkdown";
import ThemeToggle from "@/components/ThemeToggle";
import AuthBar from "@/components/AuthBar";
import ToolsMenu from "@/components/ToolsMenu";
import { loadShare } from "@/lib/store";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const plan = await loadShare(id).catch(() => null);
  if (!plan) return { title: "Plan not found · Turn This Into Money" };
  const title = `"${plan.idea.slice(0, 80)}" — a monetization plan`;
  return {
    title,
    description: "A concrete plan to turn this skill or idea into income.",
  };
}

export default async function SharedPlanPage({ params }: PageProps) {
  const { id } = await params;
  let plan;
  try {
    plan = await loadShare(id);
  } catch {
    notFound();
  }
  if (!plan) notFound();

  return (
    <main className="relative mx-auto max-w-3xl px-6 py-12 sm:py-16">
      <div
        aria-hidden
        className="ambient-glow pointer-events-none absolute inset-x-0 top-0 -z-10 h-[500px]"
      />

      <nav className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            href="/discover"
            className="inline-flex items-center gap-1 text-sm text-neutral-400 hover:text-white"
          >
            ← Discover
          </Link>
          <ToolsMenu />
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/?idea=${encodeURIComponent(plan.idea)}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-purple-500/40 bg-purple-500/10 px-3 py-1.5 text-sm text-purple-200 transition hover:border-purple-500/70 hover:bg-purple-500/20"
          >
            Remix this plan →
          </Link>
          <ThemeToggle />
          <AuthBar />
        </div>
      </nav>

      <header className="mb-10">
        <p className="text-xs uppercase tracking-wider text-neutral-500">The idea</p>
        <h1 className="mt-1 text-2xl font-semibold text-white sm:text-3xl">
          {plan.idea}
        </h1>
        {plan.context && (plan.context.time || plan.context.budget || plan.context.tech) && (
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            {plan.context.time && <span className="rounded-full border border-neutral-800 bg-neutral-950 px-2.5 py-1 text-neutral-400">⏱ {plan.context.time}</span>}
            {plan.context.budget && <span className="rounded-full border border-neutral-800 bg-neutral-950 px-2.5 py-1 text-neutral-400">💰 {plan.context.budget}</span>}
            {plan.context.tech && <span className="rounded-full border border-neutral-800 bg-neutral-950 px-2.5 py-1 text-neutral-400">⚙ {plan.context.tech}</span>}
          </div>
        )}
      </header>

      <div className="space-y-6">
        {plan.messages.map((m, i) => {
          if (m.role === "user" && i === 0) return null; // don't repeat idea
          if (m.role === "user") {
            return (
              <div key={i} className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
                <p className="mb-1 text-xs uppercase tracking-wider text-neutral-500">Follow-up</p>
                <p className="text-neutral-200">{m.content}</p>
              </div>
            );
          }
          return (
            <article
              key={i}
              className="markdown rounded-xl border border-neutral-900 bg-neutral-950/60 p-6 shadow-xl shadow-black/30"
            >
              <PlanMarkdown planId={`share:${id}`}>{m.content}</PlanMarkdown>
            </article>
          );
        })}
      </div>

      <footer className="mt-16 text-center text-xs text-neutral-600">
        Generated at {new Date(plan.createdAt).toLocaleDateString()} · Powered by Claude Sonnet 4.6
      </footer>
    </main>
  );
}
