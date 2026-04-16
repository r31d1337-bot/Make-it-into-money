import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Turn This Into Money",
  description: "Describe a skill or idea. Get a concrete monetization plan.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
