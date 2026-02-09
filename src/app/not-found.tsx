import Link from "next/link";

export default function NotFound() {
  return (
    <div className="relative flex min-h-[75vh] items-center justify-center overflow-hidden">
      {/* Faint void glow */}
      <div
        className="absolute inset-0 breathing-glow opacity-30"
        style={{
          background:
            "radial-gradient(ellipse 400px 300px at 50% 50%, rgba(45, 27, 78, 0.15) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center stagger-children">
        {/* Glitch-style number */}
        <div className="mb-8 flex items-center gap-2">
          <div className="h-px w-6 bg-sheep-muted/10" />
          <span
            className="text-[8px] font-light tracking-[0.4em] text-sheep-text/75"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            404
          </span>
          <div className="h-px w-6 bg-sheep-muted/10" />
        </div>

        {/* Message */}
        <p
          className="mb-2 text-xl font-light italic text-sheep-light/80 tracking-wide md:text-2xl"
          style={{ fontFamily: "var(--font-dream)" }}
        >
          This dream does not exist.
        </p>
        <p
          className="mb-10 text-sm font-light italic text-sheep-text/75"
          style={{ fontFamily: "var(--font-dream)" }}
        >
          Perhaps it was never dreamed.
        </p>

        {/* Return link */}
        <Link
          href="/"
          className="glow-hover group flex items-center gap-3 transition-all duration-700"
        >
          <div className="h-px w-4 bg-sheep-muted/15 transition-all duration-500 group-hover:w-8 group-hover:bg-sheep-muted/30" />
          <span
            className="text-[9px] font-light tracking-[0.25em] text-sheep-text/80 uppercase transition-colors duration-700 group-hover:text-sheep-light"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Return to the feed
          </span>
        </Link>
      </div>
    </div>
  );
}
