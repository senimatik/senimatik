"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen bg-background-2 text-white flex flex-col items-center justify-center px-4">
      <div className="max-w-sm w-full space-y-8 text-center">
        <div className="space-y-1">
          <p className="font-pixel text-base uppercase text-white">
            Seni<span className="text-primary">matik</span>
          </p>
          <h1 className="text-8xl font-bold text-primary">500</h1>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-medium">Server Error</h2>
          <p className="text-sm text-muted font-light">
            Something went wrong on our end. Please try again.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={reset}
            className="w-full inline-flex items-center justify-center rounded-md bg-white px-4 py-2.5 text-sm font-medium text-black hover:bg-zinc-200 transition-colors"
          >
            Try again
          </button>
          <Link
            href="/"
            className="w-full inline-flex items-center justify-center rounded-md border border-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
          >
            Go home
          </Link>
        </div>
      </div>
    </main>
  );
}
