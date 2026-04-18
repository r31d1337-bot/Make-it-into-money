import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[500px] bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(120,80,255,0.18),transparent_70%)]"
      />

      <nav className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-neutral-400 hover:text-white"
        >
          ← Make your own
        </Link>
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
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
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
