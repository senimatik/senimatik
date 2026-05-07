"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { useQuery as useTanQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ListIcon, XIcon, CaretDownIcon, BellIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useCurrentUser } from "@/lib/context/UserContext";
import { useWalletAddress } from "@/lib/hooks/useWalletAddress";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

const solanaConnection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!);

interface NavbarProps {
  variant?: "light" | "dark";
}

const NOTIF_ICONS: Record<string, React.ReactNode> = {
  application_approved: <CheckCircleIcon size={14} weight="fill" className="text-green-500" />,
  application_rejected: <XCircleIcon size={14} weight="fill" className="text-red-400" />,
  application_in_review: <ClockIcon size={14} weight="fill" className="text-blue-400" />,
  sale_completed: <CheckCircleIcon size={14} weight="fill" className="text-blue-500" />,
};

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Navbar({ variant = "light" }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const textColor = variant === "light" ? "text-white" : "text-black";
  const opacityColor = variant === "light" ? "opacity-40" : "opacity-40";

  const { connected, connecting, disconnect } = useWallet();
  const { setVisible: openWalletModal } = useWalletModal();
  const { role, user } = useCurrentUser();
  const walletAddress = useWalletAddress();

  // Notifications — pass "skip" as args to skip the query when not connected
  const notifications = useQuery(api.notifications.getMyNotifications, connected ? {} : "skip");
  const unreadCount = useQuery(api.notifications.getUnreadCount, connected ? {} : "skip") ?? 0;
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);

  const handleNotifClick = useCallback(async (id: Id<"notifications">, linkTo?: string) => {
    if (!walletAddress) return;
    try {
      await markAsRead({ walletAddress, notificationId: id });
    } catch (err) {
      console.error("[markAsRead] failed:", err);
    }
    setIsNotifOpen(false);
    if (linkTo) router.push(linkTo);
  }, [markAsRead, router, walletAddress]);

  const handleMarkAllRead = useCallback(async () => {
    if (!walletAddress) return;
    try {
      await markAllAsRead({ walletAddress });
    } catch (err) {
      console.error("[markAllAsRead] failed:", err);
    }
  }, [markAllAsRead, walletAddress]);

  // Validate as Solana base58 address (32-44 chars, no 0x prefix)
  const isValidSolanaAddress = !!walletAddress && !walletAddress.startsWith("0x") && walletAddress.length >= 32;

  const { data: balance = null } = useTanQuery({
    queryKey: ["solana-balance", walletAddress],
    queryFn: async () => {
      const lamports = await solanaConnection.getBalance(new PublicKey(walletAddress));
      return lamports / LAMPORTS_PER_SOL;
    },
    enabled: isValidSolanaAddress && connected,
    retry: false,
  });

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setIsDropdownOpen(false);
    }
    if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
      setIsNotifOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  // Role-based nav links
  const navLinks = useMemo(() => {
    const links = [{ name: "Discover", href: "/discover" }];

    if (connected && user?.walletAddress) {
      links.push({ name: "Profile", href: `/profile/${user.walletAddress}` });
      links.push({ name: "Purchases", href: "/purchase" });

      if (role === "user") {
        links.push({ name: "Apply", href: "/apply" });
      }

      if (role === "creator" || role === "admin" || role === "super_admin") {
        links.push({ name: "Create", href: "/create" });
        links.push({ name: "Studio", href: "/studio" });
      }

      if (role === "admin" || role === "super_admin") {
        links.push({ name: "Admin", href: "/admin" });
      }
    }

    return links;
  }, [connected, role, user]);

  const shortAddress = walletAddress
    ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
    : "";

  return (
    <nav
      className={`z-50 flex items-center justify-between w-full pt-4 px-4 lg:px-12  ${textColor}`}
    >
      <Link href="/" className="group flex items-center gap-3">
        <span className="font-pixel text-base font-black tracking-tighter uppercase">
          Seni<span className={opacityColor}>matik</span>
        </span>
      </Link>

      {/* Desktop Navigation */}
      <div className="hidden lg:flex items-center gap-12">
        {navLinks.map((link) => (
          <Link
            key={link.name}
            href={link.href}
            className="font-pixel text-[10px] tracking-[0.3em] uppercase opacity-60 hover:opacity-100 transition-opacity"
          >
            {link.name}
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-4">
        {/* Notification Bell (all screens, only when connected) */}
        {connected && (
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setIsNotifOpen((prev) => !prev)}
              className="relative flex items-center justify-center w-8 h-8 opacity-60 hover:opacity-100 transition-opacity"
              aria-label="Notifications"
            >
              <BellIcon size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-red-500" />
              )}
            </button>

            <AnimatePresence>
              {isNotifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute z-1 right-0 top-full mt-2 w-72 md:w-80 rounded-lg bg-white text-black shadow-xl border border-black/5 overflow-hidden"
                >
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-black/5 flex items-center justify-between">
                    <p className="text-[9px] uppercase tracking-[0.2em] opacity-40 font-pixel">Notifications</p>
                    {unreadCount > 0 && (
                      <button
                        onClick={() => handleMarkAllRead()}
                        className="text-[9px] uppercase tracking-widest font-pixel text-zinc-400 hover:text-black transition-colors"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  {/* List */}
                  <div className="max-h-80 overflow-y-auto">
                    {(!notifications || notifications.length === 0) && (
                      <div className="px-4 py-8 text-center">
                        <p className="font-pixel text-[9px] uppercase tracking-widest text-zinc-300">No notifications</p>
                      </div>
                    )}
                    {notifications?.map((n) => (
                      <button
                        key={n._id}
                        onClick={() => handleNotifClick(n._id, n.linkTo)}
                        className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-zinc-50 transition-colors border-b border-black/3 last:border-0 ${!n.isRead ? "bg-blue-50/30" : ""}`}
                      >
                        <span className="mt-0.5 shrink-0">{NOTIF_ICONS[n.type] ?? <BellIcon size={14} />}</span>
                        <div className="min-w-0">
                          <p className={`text-xs leading-snug mb-0.5 ${!n.isRead ? "font-semibold" : "font-medium"}`}>{n.title}</p>
                          <p className="text-[11px] text-zinc-500 leading-relaxed line-clamp-2">{n.message}</p>
                          <p className="font-pixel text-[9px] uppercase tracking-widest text-zinc-300 mt-1">{timeAgo(n.createdAt)}</p>
                        </div>
                        {!n.isRead && (
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 mt-1.5" />
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Desktop Wallet */}
        {connected ? (
          <div className="relative hidden lg:block" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 font-pixel text-[10px] tracking-[0.2em] uppercase opacity-80 hover:opacity-100 transition-opacity border border-current/30 rounded px-3 py-1.5"
            >
              {shortAddress}
              <CaretDownIcon size={10} />
            </button>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute z-1 right-0 top-full mt-2 w-56 rounded-lg bg-white text-black shadow-xl border border-black/5 overflow-hidden"
                >
                  {/* Balance */}
                  <div className="px-4 py-3 border-b border-black/5">
                    <p className="text-[9px] uppercase tracking-[0.2em] opacity-40 mb-1">Balance</p>
                    <p className="font-mono text-sm font-bold">
                      {balance !== null ? `${balance.toFixed(4)} SOL` : "—"}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="p-2 flex flex-col gap-1">
                    <button
                      onClick={() => { router.push("/settings"); setIsDropdownOpen(false); }}
                      className="w-full text-left px-3 py-2 text-sm rounded hover:bg-zinc-50 transition-colors"
                    >
                      Settings
                    </button>
                    <button
                      onClick={() => { disconnect(); setIsDropdownOpen(false); }}
                      className="w-full text-left px-3 py-2 text-sm rounded text-red-500 hover:bg-red-50 transition-colors"
                    >
                      Disconnect
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <button
            onClick={() => openWalletModal(true)}
            disabled={connecting}
            className="hidden lg:block font-pixel text-[10px] tracking-[0.2em] uppercase opacity-80 hover:opacity-100 transition-opacity border border-current/30 rounded px-3 py-1.5 disabled:opacity-30"
          >
            {connecting ? "Connecting..." : "Connect"}
          </button>
        )}

        {/* Mobile Menu Toggle */}
        <button
          className="lg:hidden p-2"
          onClick={() => setIsMenuOpen((prev) => !prev)}
        >
          {isMenuOpen ? <XIcon size={24} /> : <ListIcon size={24} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={`fixed inset-0 z-60 flex flex-col px-4 py-6 lg:hidden bg-white text-black`}
          >
            <div className="flex justify-between items-center mb-16">
              <span className="font-pixel text-base font-black tracking-tighter uppercase">
                Seni<span className={opacityColor}>matik</span>
              </span>
              <div className="flex items-center gap-4">
                {/* Mobile notification indicator */}
                {connected && unreadCount > 0 && (
                  <button
                    onClick={() => { setIsMenuOpen(false); setIsNotifOpen(true); }}
                    className="relative p-1"
                    aria-label="Notifications"
                  >
                    <BellIcon size={20} />
                    <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-red-500" />
                  </button>
                )}
                <button onClick={() => setIsMenuOpen(false)}>
                  <XIcon size={24} />
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="text-4xl font-bold tracking-tighter uppercase hover:opacity-60 transition-opacity"
                >
                  {link.name}
                </Link>
              ))}
            </div>

            <div className="mt-auto pt-10 border-t border-black/5 flex flex-col gap-6">
              {connected ? (
                <>
                  <div className="space-y-1">
                    <p className="text-[9px] uppercase tracking-[0.2em] opacity-40">Balance</p>
                    <p className="font-mono text-sm font-bold">
                      {balance !== null ? `${balance.toFixed(4)} SOL` : "—"}
                    </p>
                  </div>
                  <button
                    onClick={() => { disconnect(); setIsMenuOpen(false); }}
                    className="w-full rounded-lg border border-red-300 px-5 py-2 font-medium text-red-600 hover:bg-red-50"
                  >
                    Disconnect
                  </button>
                </>
              ) : (
                <button
                  onClick={() => { openWalletModal(true); setIsMenuOpen(false); }}
                  disabled={connecting}
                  className="w-full rounded-lg bg-zinc-900 px-5 py-2 font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
                >
                  {connecting ? "Connecting..." : "Connect Wallet"}
                </button>
              )}
              <p className="text-[9px] uppercase tracking-[0.3em] text-center opacity-30">
                Verifiable Rights v0.2.1
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
