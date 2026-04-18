import Link from "next/link";
import { listShares } from "@/lib/store";
import ThemeToggle from "@/components/ThemeToggle";

export const dynamic = "force-dynamic"; // always fresh — reads the filesystem

export const metadata = {
  title: "Discover plans · Turn This Into Money",
  description: "Browse recent monetization plans shared by others.",
};

function timeAgo(ts: number): string {
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function firstAssistantPreview(text: string, max = 180): string {
  const stripped = text
    .replace(/```[\s\S]*?```/g, "")
    .replace(/#+\s*/g, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  return stripped.length > max ? stripped.slice(0, max - 1) + "…" : stripped;
}

export default async function DiscoverPage() {
  const plans = await listShares(30);

  return (
    <main className="relative mx-auto max-w-3xl px-6 py-12 sm:py-16">
      <div
        aria-hidden
        className="ambient-glow pointer-events-none absolute inset-x-0 top-0 -z-10 h-[500px]"
      />

      <nav className="mb-8 flex items-center justify-between">
        <Link href="/" className="text-sm text-neutral-400 hover:text-white">
          ← Home
        </Link>
        <ThemeToggle />
      </nav>

      <header className="mb-10">
        <h1 className="bg-gradient-to-br from-white to-neutral-400 bg-clip-text text-3xl font-semibold tracking-tight text-transparent sm:text-4xl">
          Discover
        </h1>
        <p className="mt-3 text-neutral-400">
          Recent plans shared by others. Tap one to read it — or remix it into your own.
        </p>
      </header>

      {plans.length === 0 ? (
        <div className="rounded-xl border border-neutral-900 bg-neutral-950/60 p-8 text-center text-sm text-neutral-500">
          No shared plans yet. Make one on the{" "}
          <Link href="/" className="text-purple-300 underline decoration-dotted">
            home page
          </Link>{" "}
          and hit Share.
        </div>
      ) : (
        <ul className="space-y-3">
          {plans.map((p) => {
            const firstAssistant = p.messages.find((m) => m.role === "assistant");
            const preview = firstAssistant ? firstAssistantPreview(firstAssistant.content) : "";
            return (
              <li key={p.id}>
                <Link
                  href={`/p/${p.id}`}
                  className="block rounded-xl border border-neutral-900 bg-neutral-950/60 p-5 transition hover:border-neutral-700 hover:bg-neutral-950"
                >
                  <div className="mb-1 flex items-baseline justify-between gap-3">
                    <h2 className="truncate text-lg font-medium text-white">{p.idea}</h2>
                    <span className="flex-none text-xs text-neutral-600">{timeAgo(p.createdAt)}</span>
                  </div>
                  {preview && (
                    <p className="line-clamp-2 text-sm text-neutral-400">{preview}</p>
                  )}
                  {p.context && (p.context.time || p.context.budget || p.context.tech) && (
                    <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
                      {p.context.time && <span className="rounded-full border border-neutral-800 px-2 py-0.5 text-neutral-500">⏱ {p.context.time}</span>}
                      {p.context.budget && <span className="rounded-full border border-neutral-800 px-2 py-0.5 text-neutral-500">💰 {p.context.budget}</span>}
                      {p.context.tech && <span className="rounded-full border border-neutral-800 px-2 py-0.5 text-neutral-500">⚙ {p.context.tech}</span>}
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
