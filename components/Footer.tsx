import Link from "next/link";

/**
 * Global footer — copyright notice + legal links. Rendered from
 * app/layout.tsx so it appears on every page without per-page wiring.
 */
export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="no-print mt-20 border-t border-neutral-900 py-8">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-6 text-xs text-neutral-500 sm:flex-row">
        <p>© {year} mintr. All rights reserved.</p>
        <nav className="flex items-center gap-4">
          <Link href="/pricing" className="hover:text-white">Pricing</Link>
          <Link href="/terms" className="hover:text-white">Terms</Link>
          <Link href="/privacy" className="hover:text-white">Privacy</Link>
        </nav>
      </div>
    </footer>
  );
}
