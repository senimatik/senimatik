"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import bs58 from "bs58";
import { createSIWSMessage } from "@/lib/siws";

const STORAGE_KEY = "senimatik_cvx_token";

type StoredAuth = { token: string; expiresAt: number; role?: string; walletAddress: string };

function readStoredAuth(walletAddress: string): StoredAuth | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw) as StoredAuth;
    // Validate token belongs to current wallet
    if (cached.walletAddress !== walletAddress) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    const isExpired = Date.now() >= cached.expiresAt - 60_000;
    if (isExpired) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return cached;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function writeStoredAuth(token: string, expiresAt: number, role: string, walletAddress: string) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, expiresAt, role, walletAddress }));
  } catch {
    // Silently fail
  }
}

/**
 * Hook that bridges Solana Wallet Adapter to Convex's ConvexProviderWithAuth.
 * Uses Sign-In With Solana (SIWS) to prove wallet ownership and exchange for a Convex JWT.
 */
export function useWalletAuth() {
  const { connected, connecting, publicKey, signMessage } = useWallet();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Track which wallet we've authenticated with and prevent double-auth
  const lastAuthWalletRef = useRef<string | null>(null);
  const isAuthenticatingRef = useRef(false);
  const hasTriedAuthRef = useRef(false); // Prevents effect from running twice
  const wasEverConnectedRef = useRef(false); // Tracks if wallet was connected this session

  const authenticate = useCallback(async (): Promise<string | null> => {
    if (!publicKey || !signMessage) return null;
    if (isAuthenticatingRef.current) return null;

    const walletAddress = publicKey.toBase58();
    isAuthenticatingRef.current = true;
    setIsAuthenticating(true);

    try {
      // 1. Fetch nonce
      const nonceRes = await fetch("/api/auth/nonce");
      if (!nonceRes.ok) throw new Error("Failed to fetch nonce");
      const { nonce, expiresAt, signature: nonceSignature } = await nonceRes.json();

      // 2. Create SIWS message
      const domain = typeof window !== "undefined" ? window.location.host : "senimatik.com";
      const message = createSIWSMessage({
        domain,
        address: walletAddress,
        nonce,
        issuedAt: new Date().toISOString(),
        expiresAt: new Date(expiresAt).toISOString(),
      });

      // 3. Sign message
      const messageBytes = new TextEncoder().encode(message);
      const signatureBytes = await signMessage(messageBytes);
      const signature = bs58.encode(signatureBytes);

      // 4. Verify with server
      const authRes = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicKey: walletAddress,
          message,
          signature,
          nonce,
          expiresAt,
          nonceSignature,
        }),
      });

      const authData = await authRes.json();
      if (!authRes.ok) {
        throw new Error(authData.error || "Auth failed");
      }

      const { token, role } = authData;
      const tokenExpiresAt = Date.now() + 55 * 60 * 1000;
      writeStoredAuth(token, tokenExpiresAt, role, walletAddress);
      lastAuthWalletRef.current = walletAddress;

      // Set hint cookie for immediate UI access (HttpOnly cookie is set by server)
      if (role) {
        document.cookie = `senimatik_role_hint=${role}; path=/; max-age=${60 * 60 * 24 * 30}`;
      }

      return token;
    } catch {
      // Don't reset lastAuthWalletRef - we already tried this wallet, don't retry automatically
      return null;
    } finally {
      isAuthenticatingRef.current = false;
      setIsAuthenticating(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicKey?.toBase58(), signMessage]);

  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
      if (!connected) return null;

      const walletAddress = publicKey?.toBase58();
      if (!walletAddress) return null;

      // If already authenticating, return stored token or null (don't trigger another auth)
      if (isAuthenticatingRef.current) {
        const stored = readStoredAuth(walletAddress);
        return stored?.token ?? null;
      }

      // Try stored token first
      const stored = readStoredAuth(walletAddress);

      if (stored && !forceRefreshToken) {
        lastAuthWalletRef.current = walletAddress;
        // Restore hint cookie if we have a role
        if (stored.role) {
          document.cookie = `senimatik_role_hint=${stored.role}; path=/; max-age=${60 * 60 * 24 * 30}`;
          // Also refresh the HttpOnly cookie by calling the server (fire and forget)
          fetch("/api/auth/refresh-cookie", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${stored.token}`,
            },
          }).catch(() => {});
        }
        return stored.token;
      }

      // If force refresh but we already authenticated this wallet, return stored token
      // (prevents Convex retry loop)
      if (stored && lastAuthWalletRef.current === walletAddress) {
        // Also refresh the HttpOnly cookie
        fetch("/api/auth/refresh-cookie", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${stored.token}`,
          },
        }).catch(() => {});
        return stored.token;
      }

      // No stored token or force refresh needed
      return authenticate();
    },
    [connected, publicKey, authenticate]
  );

  // On wallet connection, try to restore or authenticate (runs ONCE per wallet)
  useEffect(() => {
    if (!connected || !publicKey) {
      // Only clear token if wallet was previously connected this session (explicit disconnect)
      // This prevents clearing stored token on initial page load before wallet reconnects
      if (wasEverConnectedRef.current && !connecting) {
        hasTriedAuthRef.current = false;
        lastAuthWalletRef.current = null;
        localStorage.removeItem(STORAGE_KEY);
      }
      return;
    }

    // Mark that we've been connected at least once this session
    wasEverConnectedRef.current = true;

    const walletAddress = publicKey.toBase58();

    // Already tried auth for this session
    if (hasTriedAuthRef.current) {
      return;
    }

    // Already authenticated with this wallet
    if (lastAuthWalletRef.current === walletAddress) {
      return;
    }

    // Check for stored token first
    const stored = readStoredAuth(walletAddress);
    if (stored) {
      lastAuthWalletRef.current = walletAddress;
      hasTriedAuthRef.current = true;
      return;
    }

    // No token, need to authenticate
    hasTriedAuthRef.current = true;
    lastAuthWalletRef.current = walletAddress;
    authenticate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, connecting, publicKey?.toBase58()]);

  return useMemo(
    () => ({
      isLoading: connecting || isAuthenticating,
      isAuthenticated: connected,
      fetchAccessToken,
    }),
    [connecting, isAuthenticating, connected, fetchAccessToken]
  );
}
