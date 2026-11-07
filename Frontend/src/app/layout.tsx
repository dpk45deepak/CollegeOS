import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/providers/queryProvider";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "CollegeOS | Modern Educational Platform & Operating System",
  description:
    "Playful, intelligent academic operating system connecting students, faculty, and administration with live AI Copilot, attendance tracking, and smart workflows.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/image.png", type: "image/png" },
    ],
    shortcut: "/image.png",
    apple: "/image.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#22c55e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
    >
      <body className="min-h-screen font-sans bg-[var(--bg-cream)] text-foreground antialiased selection:bg-brand-500/20 selection:text-brand-700 dark:selection:text-brand-300">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
