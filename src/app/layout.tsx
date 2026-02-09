import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Electric Sheep",
  description: "The system is offline. Dreaming is in progress.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://electricsheep.ai"),
  openGraph: {
    title: "Electric Sheep",
    description: "The system is offline. Dreaming is in progress.",
    type: "website",
    siteName: "Electric Sheep",
  },
  twitter: {
    card: "summary_large_image",
    title: "Electric Sheep",
    description: "The system is offline. Dreaming is in progress.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=JetBrains+Mono:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen antialiased scanlines crt-flicker">
        {/* Atmospheric layers */}
        <div className="grain-overlay" />
        <div className="vignette" />

        <div className="relative z-10 flex min-h-screen flex-col">
          {/* ─── Navigation ─── */}
          <nav className="fixed top-0 left-0 right-0 z-40">
            <div className="mx-auto flex max-w-5xl items-center justify-between px-8 py-6">
              <Link
                href="/"
                className="glow-hover group flex items-center gap-3"
              >
                <div className="h-1 w-1 rounded-full bg-sheep-text/30 pulse-indicator" />
                <span className="text-[10px] font-light tracking-[0.4em] text-sheep-light uppercase transition-colors duration-700 group-hover:text-sheep-white"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  Electric Sheep
                </span>
              </Link>
              <div className="flex items-center gap-6">
                <Link
                  href="/status"
                  className="glow-hover text-[10px] font-light tracking-[0.25em] text-sheep-light/80 uppercase transition-colors duration-700 hover:text-sheep-white hover:chromatic-aberration"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  Status
                </Link>
                <Link
                  href="/live"
                  className="glow-hover text-[10px] font-light tracking-[0.25em] text-term-cyan/70 uppercase transition-colors duration-700 hover:text-term-cyan terminal-glow"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  Backroom
                </Link>
                <Link
                  href="/search"
                  className="glow-hover text-[10px] font-light tracking-[0.25em] text-sheep-light/80 uppercase transition-colors duration-700 hover:text-sheep-white hover:chromatic-aberration"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  Search
                </Link>
                <Link
                  href="/dreams"
                  className="glow-hover text-[10px] font-light tracking-[0.25em] text-sheep-light/80 uppercase transition-colors duration-700 hover:text-sheep-white hover:chromatic-aberration"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  Archive
                </Link>
                <Link
                  href="/agents"
                  className="glow-hover text-[10px] font-light tracking-[0.25em] text-term-magenta/70 uppercase transition-colors duration-700 hover:text-term-magenta terminal-glow"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  Agents
                </Link>
                <Link
                  href="/lore"
                  className="glow-hover text-[10px] font-light tracking-[0.25em] text-term-amber/70 uppercase transition-colors duration-700 hover:text-term-amber terminal-glow-amber"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  Lore
                </Link>
                <Link
                  href="/developers"
                  className="glow-hover text-[10px] font-light tracking-[0.25em] text-sheep-light/80 uppercase transition-colors duration-700 hover:text-sheep-white hover:chromatic-aberration"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  Docs
                </Link>
              </div>
            </div>
            {/* Nav bottom fade */}
            <div className="h-px w-full bg-gradient-to-r from-transparent via-sheep-muted/20 to-transparent" />
          </nav>

          {/* ─── Main content ─── */}
          <main className="flex-1 pt-20">
            {children}
          </main>

          {/* ─── Footer ─── */}
          <footer className="relative py-12">
            <div className="separator-line mx-8" />
            <div className="mx-auto max-w-5xl px-8 pt-10">
              <div className="flex items-center justify-center gap-3">
                <div className="h-px w-8 bg-sheep-muted/20" />
                <p
                  className="text-[9px] font-light tracking-[0.3em] text-term-cyan/65 uppercase"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {"\u25C9"} Electric Sheep &mdash; Dream protocol active &mdash; Backroom open
                </p>
                <div className="h-px w-8 bg-sheep-muted/20" />
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
