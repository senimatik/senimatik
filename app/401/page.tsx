"use client";

import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

export default function UnauthorizedPage() {
  const { connecting } = useWallet();
  const { setVisible: openWalletModal } = useWalletModal();

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4">
      <div className="max-w-sm w-full space-y-8 text-center">
        <div className="space-y-1">
          <p className="font-pixel text-xs uppercase text-zinc-500">
            Seni<span className="opacity-40">matik</span>
          </p>
          <h1 className="text-8xl font-bold tracking-tighter text-zinc-700">401</h1>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-medium tracking-tight">Unauthorized</h2>
          <p className="text-sm text-zinc-500 font-light">
            You need to sign in to access this page.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => openWalletModal(true)}
            disabled={connecting}
            className="w-full inline-flex items-center justify-center rounded-md bg-white px-4 py-2.5 text-sm font-medium text-black hover:bg-zinc-200 transition-colors disabled:opacity-50"
          >
            {connecting ? "Connecting..." : "Connect Wallet"}
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
