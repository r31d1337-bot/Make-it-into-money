import type { MetadataRoute } from "next";

/**
 * PWA manifest. Lets users install mintr to their home screen on iOS /
 * Android / desktop Chrome. Next.js auto-serves this at /manifest.webmanifest.
 *
 * Icons come from app/icon.tsx (32×32) and app/apple-icon.tsx (180×180).
 * The manifest also references them via the Next-generated PNG URLs.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "mintr — make what you know pay",
    short_name: "mintr",
    description:
      "Turn any skill into a monetization plan, a resume, a cover letter, and tailored interview prep.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#07070a",
    theme_color: "#07070a",
    categories: ["productivity", "business", "finance"],
    icons: [
      {
        src: "/icon",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
