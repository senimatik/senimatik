"use client";

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface AccentPillButtonProps {
  href: string;
  icon: ReactNode;
  children: ReactNode;
  className?: string;
  onClick?: ComponentProps<typeof Link>["onClick"];
}

/** Dark CTA link with a full-width violet → orange → emerald gradient along the bottom edge. */
export function AccentPillButton({
  href,
  icon,
  children,
  className,
  onClick,
}: AccentPillButtonProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "relative isolate inline-flex items-center gap-2 overflow-hidden bg-zinc-950 px-4 py-3 text-sm font-pixel tracking-widest text-white ring-1 ring-white/10 transition-colors hover:bg-zinc-900 hover:ring-white/15 md:py-2",
        className,
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[3px] bg-linear-to-r from-violet-500 via-orange-400 to-emerald-400 opacity-95"
      />
      <span className="relative z-1 shrink-0 text-white [&>svg]:block">{icon}</span>
      <span className="relative z-1">{children}</span>
    </Link>
  );
}
