import type { ReactNode } from "react";

interface TerminalFrameProps {
  title?: string;
  children: ReactNode;
  variant?: "default" | "system" | "warning";
  className?: string;
}

const VARIANT_STYLES = {
  default: {
    borderColor: "text-term-cyan/55",
    titleColor: "text-term-cyan/70",
    glowClass: "terminal-border",
  },
  system: {
    borderColor: "text-term-green/55",
    titleColor: "text-term-green/70",
    glowClass: "terminal-border-green",
  },
  warning: {
    borderColor: "text-term-amber/55",
    titleColor: "text-term-amber/70",
    glowClass: "terminal-border-amber",
  },
} as const;

export function TerminalFrame({
  title,
  children,
  variant = "default",
  className = "",
}: TerminalFrameProps) {
  const styles = VARIANT_STYLES[variant];

  return (
    <div
      className={`relative ${styles.glowClass} bg-sheep-black/80 ${className}`}
      style={{ fontFamily: "var(--font-mono)" }}
    >
      {/* Top border with box-drawing characters */}
      <div
        className={`flex items-center text-[10px] leading-none ${styles.borderColor} select-none`}
        aria-hidden="true"
      >
        <span>{"\u250C"}</span>
        {title ? (
          <>
            <span>{"\u2500\u2500"} </span>
            <span className={`px-1 text-[9px] tracking-[0.15em] uppercase ${styles.titleColor}`}>
              {title}
            </span>
            <span> </span>
            <span className="flex-1 overflow-hidden whitespace-nowrap">
              {"\u2500".repeat(80)}
            </span>
          </>
        ) : (
          <span className="flex-1 overflow-hidden whitespace-nowrap">
            {"\u2500".repeat(80)}
          </span>
        )}
        <span>{"\u2510"}</span>
      </div>

      {/* Content area with side borders */}
      <div className="flex">
        <span
          className={`text-[10px] leading-none ${styles.borderColor} select-none shrink-0`}
          aria-hidden="true"
        >
          {"\u2502"}
        </span>
        <div className="flex-1 min-w-0 px-3 py-2">{children}</div>
        <span
          className={`text-[10px] leading-none ${styles.borderColor} select-none shrink-0`}
          aria-hidden="true"
        >
          {"\u2502"}
        </span>
      </div>

      {/* Bottom border */}
      <div
        className={`flex items-center text-[10px] leading-none ${styles.borderColor} select-none`}
        aria-hidden="true"
      >
        <span>{"\u2514"}</span>
        <span className="flex-1 overflow-hidden whitespace-nowrap">
          {"\u2500".repeat(80)}
        </span>
        <span>{"\u2518"}</span>
      </div>
    </div>
  );
}
