import { Suspense } from "react";
import VerifyEmailClient from "./VerifyEmailClient";
import ThemeToggle from "@/components/ThemeToggle";
import HeaderModelToggle from "@/components/HeaderModelToggle";
import Wordmark from "@/components/Wordmark";
import MobileNav from "@/components/MobileNav";

export const metadata = { title: "Verify email · mintr" };

export default function VerifyEmailPage() {
  return (
    <main className="relative mx-auto flex min-h-[70vh] max-w-3xl flex-col px-6 py-10">
      <div
        aria-hidden
        className="ambient-glow pointer-events-none absolute inset-x-0 top-0 -z-10 h-[500px]"
      />
      <nav className="mb-12 flex items-center justify-between">
        <Wordmark />
        <div className="hidden items-center gap-2 sm:flex">
          <HeaderModelToggle />
          <ThemeToggle />
        </div>
        <MobileNav />
      </nav>

      <div className="flex flex-1 items-center justify-center">
        <Suspense fallback={<div className="text-sm text-neutral-500">Loading…</div>}>
          <VerifyEmailClient />
        </Suspense>
      </div>
    </main>
  );
}
