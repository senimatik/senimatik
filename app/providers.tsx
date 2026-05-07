"use client";

import "@solana/wallet-adapter-react-ui/styles.css";
import { useState, useMemo } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { UserProvider } from "@/lib/context/UserContext";
import { useWalletAuth } from "@/lib/hooks/useWalletAuth";

const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL!;

function ConvexWithAuth({ children }: { children: React.ReactNode }) {
  const [convex] = useState(() => new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!));

  return (
    <ConvexProviderWithAuth client={convex} useAuth={useWalletAuth}>
      {children}
    </ConvexProviderWithAuth>
  );
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ConnectionProvider endpoint={SOLANA_RPC_URL}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <ConvexWithAuth>
              <UserProvider>{children}</UserProvider>
            </ConvexWithAuth>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </QueryClientProvider>
  );
}
