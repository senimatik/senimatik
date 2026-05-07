"use client";

import { useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

export function useWalletAddress(): string {
  const { publicKey, connected } = useWallet();

  return useMemo(() => {
    if (!publicKey || !connected) return "";
    return publicKey.toBase58();
  }, [publicKey, connected]);
}
