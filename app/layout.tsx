import type { Metadata, Viewport } from "next";
import "./globals.css";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "mintr — make what you know pay",
  description:
    "Turn any skill into a monetization plan, and write the resume, cover letter, and interview prep to back it up.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "mintr",
  },
};

export const viewport: Viewport = {
  themeColor: "#07070a",
  colorScheme: "dark",
  // "cover" lets env(safe-area-inset-*) work so notched iPhones don't cut
  // content under the dynamic island or home indicator.
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
