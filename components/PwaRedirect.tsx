"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * When the app is launched as an installed PWA (standalone display mode),
 * skip the marketing homepage and drop the user straight into the Monetize
 * tool. Browser visitors still see the landing page normally.
 *
 * Mounted once at the top of `/`. No-op if not in standalone mode.
 */
export default function PwaRedirect({ to = "/monetize" }: { to?: string }) {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      // iOS Safari pre-PWA spec
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) {
      router.replace(to);
    }
  }, [router, to]);

  return null;
}
