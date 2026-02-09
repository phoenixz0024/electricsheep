"use client";

import { useCallback, useState } from "react";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";

export function ContractAddress() {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    if (!CONTRACT_ADDRESS) return;
    navigator.clipboard.writeText(CONTRACT_ADDRESS).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  if (!CONTRACT_ADDRESS) return null;

  const truncated = `${CONTRACT_ADDRESS.slice(0, 6)}...${CONTRACT_ADDRESS.slice(-4)}`;

  return (
    <button
      onClick={handleCopy}
      className="group flex items-center gap-2 transition-all duration-300"
      title={`Copy: ${CONTRACT_ADDRESS}`}
      style={{ fontFamily: "var(--font-mono)" }}
    >
      <span className="text-[8px] tracking-[0.15em] text-sheep-muted/70 uppercase">
        CA
      </span>
      <span className="text-[9px] tracking-[0.1em] text-term-amber/70 tabular-nums group-hover:text-term-amber transition-colors duration-300">
        {truncated}
      </span>
      <span
        className={`text-[8px] tracking-[0.1em] transition-all duration-300 ${
          copied
            ? "text-term-green/90"
            : "text-sheep-muted/50 group-hover:text-sheep-light/70"
        }`}
      >
        {copied ? "COPIED" : "COPY"}
      </span>
    </button>
  );
}
