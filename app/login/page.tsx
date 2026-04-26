import { Suspense } from "react";
import AuthForm from "@/components/AuthForm";
import HeaderModelToggle from "@/components/HeaderModelToggle";
import Wordmark from "@/components/Wordmark";
import MobileNav from "@/components/MobileNav";

export const metadata = { title: "Sign in · mintr" };

export default function LoginPage() {
  return (
    <main className="relative mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-6 sm:px-6 sm:py-10">
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
        <Suspense fallback={null}>
          <AuthForm mode="login" />
        </Suspense>
      </div>
    </main>
  );
}
