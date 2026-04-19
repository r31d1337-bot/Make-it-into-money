import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "mintr — make what you know pay",
  description:
    "Turn any skill into a monetization plan, and write the resume, cover letter, and interview prep to back it up.",
};

// Runs before React hydrates — sets `.light` on <html> based on stored
// preference or OS preference, so the correct theme paints immediately
// (no flash of wrong theme).
const themeBootstrap = `(function() {
  try {
    var stored = localStorage.getItem('money.theme');
    var prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    var isLight = stored ? stored === 'light' : prefersLight;
    if (isLight) document.documentElement.classList.add('light');
  } catch (e) {}
})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
