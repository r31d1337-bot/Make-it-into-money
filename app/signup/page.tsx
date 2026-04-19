import { Suspense } from "react";
import AuthForm from "@/components/AuthForm";
import ThemeToggle from "@/components/ThemeToggle";
import Wordmark from "@/components/Wordmark";

export const metadata = { title: "Sign up · minr" };

export default function SignupPage() {
  return (
    <main className="relative mx-auto flex min-h-screen max-w-3xl flex-col px-6 py-10">
      <div
        aria-hidden
        className="ambient-glow pointer-events-none absolute inset-x-0 top-0 -z-10 h-[500px]"
      />

      <nav className="mb-12 flex items-center justify-between">
        <Wordmark />
        <ThemeToggle />
      </nav>

      <div className="flex flex-1 items-center">
        <Suspense fallback={null}>
          <AuthForm mode="signup" />
        </Suspense>
      </div>
    </main>
  );
}
