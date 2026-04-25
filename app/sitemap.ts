import type { MetadataRoute } from "next";

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://mintrapp.com").replace(/\/$/, "");

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  // Static, public-facing pages only. Per-user routes (account, login, etc.)
  // are excluded by robots.ts so we don't list them here either.
  const routes = [
    "/",
    "/monetize",
    "/resume",
    "/cover-letter",
    "/interview-prep",
    "/checklist",
    "/discover",
    "/pricing",
    "/support",
    "/terms",
    "/privacy",
  ];
  return routes.map((path) => ({
    url: `${SITE}${path}`,
    lastModified: now,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : path === "/monetize" || path === "/pricing" ? 0.9 : 0.6,
  }));
}
