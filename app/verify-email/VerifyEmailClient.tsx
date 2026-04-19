"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type State = "loading" | "success" | "error" | "no-token";

export default function VerifyEmailClient() {
  const searchParams = useSearchParams();
  const [state, setState] = useState<State>("loading");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setState("no-token");
      return;
    }
    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (r.ok) setState("success");
        else {
          setState("error");
          setMessage(data?.error || `Request failed (${r.status})`);
        }
      })
      .catch((err) => {
        setState("error");
        setMessage((err as Error).message);
      });
  }, [searchParams]);

  if (state === "loading") {
    return (
      <div className="text-center">
        <div className="inline-flex gap-1">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-500 [animation-delay:-0.3s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-500 [animation-delay:-0.15s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-500" />
        </div>
        <p className="mt-3 text-sm text-neutral-400">Verifying your email…</p>
      </div>
    );
  }

  if (state === "success") {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-purple-500/40 bg-purple-500/10">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-purple-300">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-white">Email verified</h1>
        <p className="mt-2 text-neutral-400">You&apos;re all set.</p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-lg bg-gradient-to-br from-white to-neutral-200 px-5 py-2.5 text-sm font-semibold text-black hover:brightness-110"
        >
          Continue →
        </Link>
      </div>
    );
  }

  if (state === "no-token") {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-white">Verify your email</h1>
        <p className="mt-2 text-neutral-400">
          Check the email we sent you and click the link there.
        </p>
        <Link
          href="/account"
          className="mt-6 inline-flex rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-2 text-sm text-neutral-300 hover:border-neutral-700 hover:text-white"
        >
          Back to account
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md text-center">
      <h1 className="text-2xl font-semibold text-white">Verification failed</h1>
      <p className="mt-2 text-neutral-400">{message}</p>
      <p className="mt-6 text-sm text-neutral-500">
        Links expire after 7 days and can only be used once. You can request a new one
        from the{" "}
        <Link href="/account" className="text-purple-300 underline decoration-dotted">
          Account page
        </Link>
        .
      </p>
    </div>
  );
}
