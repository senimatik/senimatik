"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { UserRole, setRoleCookie, clearRoleCookie, getRoleCookie } from "@/lib/cookies";
import { useWalletAddress } from "@/lib/hooks/useWalletAddress";

interface UserContextValue {
  user: Doc<"users"> | null | undefined;
  isLoading: boolean;
  role: UserRole | null;
}

const UserContext = createContext<UserContextValue>({
  user: null,
  isLoading: true,
  role: null,
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { connected } = useWallet();
  const walletAddress = useWalletAddress();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<Doc<"users"> | null>(null);

  const getOrCreate = useMutation(api.users.getOrCreate);

  // Refs to avoid stale closures and prevent loops
  const getOrCreateRef = useRef(getOrCreate);
  getOrCreateRef.current = getOrCreate;
  const isSyncingRef = useRef(false);
  const lastSyncedWalletRef = useRef("");

  useEffect(() => {
    // Not connected — clear state
    if (!connected || !walletAddress) {
      setIsLoading(false);
      if (lastSyncedWalletRef.current) {
        lastSyncedWalletRef.current = "";
        setUser(null);
        clearRoleCookie();
        fetch("/api/auth", { method: "DELETE" }).catch(() => {});
      }
      return;
    }

    // Already synced this wallet, or sync in-flight
    if (lastSyncedWalletRef.current === walletAddress || isSyncingRef.current) return;

    isSyncingRef.current = true;
    let cancelled = false;

    async function syncUser() {
      setIsLoading(true);
      try {
        const result = await getOrCreateRef.current({
          walletAddress,
        });
        if (!cancelled && result) {
          lastSyncedWalletRef.current = walletAddress;
          setUser(result as Doc<"users">);
          // Role cookie is set by /api/auth during SIWS authentication
          // Just update the hint cookie here for instant UI
          setRoleCookie(result.role as UserRole);
        }
      } catch (err) {
        console.error("Failed to sync user:", err);
      } finally {
        if (!cancelled) {
          isSyncingRef.current = false;
          setIsLoading(false);
        }
      }
    }

    syncUser();
    return () => { cancelled = true; };
  }, [connected, walletAddress]);

  // Re-sync cookie whenever Convex reactively updates the user's role mid-session
  useEffect(() => {
    if (!user || !connected) return;
    const cookieRole = getRoleCookie();
    if (user.role === cookieRole) return;

    // Role changed — update hint cookie (HttpOnly cookie is managed by /api/auth)
    setRoleCookie(user.role as UserRole);
  }, [user, connected]);

  // Use Convex role if synced, otherwise fall back to cookie from previous session
  const role = (user?.role as UserRole | null) ?? (typeof document !== "undefined" ? getRoleCookie() : null);

  return (
    <UserContext.Provider value={{ user, isLoading, role }}>
      {children}
    </UserContext.Provider>
  );
}

export function useCurrentUser() {
  return useContext(UserContext);
}
