import { Suspense } from "react";
import ResetPasswordClient from "./ResetPasswordClient";
import HeaderModelToggle from "@/components/HeaderModelToggle";
import Wordmark from "@/components/Wordmark";
import MobileNav from "@/components/MobileNav";

export const metadata = { title: "Reset password · mintr" };

export default function ResetPasswordPage() {
  return (
    <main className="relative mx-auto flex min-h-[80vh] max-w-3xl flex-col px-6 py-10">
      <div
        aria-hidden
        className="ambient-glow pointer-events-none absolute inset-x-0 top-0 -z-10 h-[500px]"
      />
      <nav className="mb-12 flex items-center justify-between">
        <Wordmark />
        <div className="hidden items-center gap-2 sm:flex">
          <HeaderModelToggle />
        </div>
        <MobileNav />
      </nav>

      <div className="flex flex-1 items-center">
        <Suspense fallback={<div className="mx-auto text-sm text-neutral-500">Loading…</div>}>
          <ResetPasswordClient />
        </Suspense>
      </div>
    </main>
  );
}
