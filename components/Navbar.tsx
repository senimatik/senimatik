"use client";

import { useState, useMemo, useEffect, useRef, useCallback, type ReactNode } from "react";
import { useQuery, useMutation } from "convex/react";
// import { useQuery as useTanQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ListIcon,
  XIcon,
  CaretDownIcon,
  BellIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ClipboardTextIcon,
  PaintBrushIcon,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
// import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useCurrentUser } from "@/lib/context/UserContext";
import { useWalletAddress } from "@/lib/hooks/useWalletAddress";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { resolveR2PublicUrl } from "@/lib/r2-public-url";
import { AccentPillButton } from "@/components/ui/accent-pill-button";

// const solanaConnection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!);

interface NavbarProps {
  variant?: "light" | "dark";
}

const NOTIF_ICONS: Record<string, ReactNode> = {
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
  // const opacityColor = variant === "light" ? "opacity-40" : "opacity-40";

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
  // const isValidSolanaAddress = !!walletAddress && !walletAddress.startsWith("0x") && walletAddress.length >= 32;

  // const { data: balance = null } = useTanQuery({
  //   queryKey: ["solana-balance", walletAddress],
  //   queryFn: async () => {
  //     const lamports = await solanaConnection.getBalance(new PublicKey(walletAddress));
  //     return lamports / LAMPORTS_PER_SOL;
  //   },
  //   enabled: isValidSolanaAddress && connected,
  //   retry: false,
  // });

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

  /** Desktop center: Discover only (Apply is the accent pill). */
  const desktopExploreLinks = useMemo(
    () => [{ name: "Discover", href: "/discover" }, { name: "Artist", href: "/#" }],
    [],
  );

  /** Mobile drawer: Discover + Apply when role is user. */
  const primaryNavLinks = useMemo(() => {
    const links = [...desktopExploreLinks];
    if (connected && role === "user") {
      links.push({ name: "Apply", href: "/apply" });
    }
    return links;
  }, [connected, role, desktopExploreLinks]);

  /** Wallet menu (desktop): Create → accent pill, not listed here. */
  const dropdownNavLinks = useMemo(() => {
    const links: { name: string; href: string }[] = [];

    if (connected && user?.walletAddress) {
      if (role === "creator" || role === "admin" || role === "super_admin") {
        links.push({ name: "Studio", href: "/studio" });
      }
      links.push({ name: "Purchases", href: "/purchase" });
      links.push({ name: "Profile", href: `/profile/${user.walletAddress}` });
      if (role === "admin" || role === "super_admin") {
        links.push({ name: "Admin", href: "/admin" });
      }
    }

    return links;
  }, [connected, role, user]);

  /** Mobile drawer: includes Create for creators. */
  const mobileAccountNavLinks = useMemo(() => {
    const links: { name: string; href: string }[] = [];

    if (connected && user?.walletAddress) {
      if (role === "creator" || role === "admin" || role === "super_admin") {
        links.push({ name: "Studio", href: "/studio" });
        links.push({ name: "Create", href: "/create" });
      }
      links.push({ name: "Purchases", href: "/purchase" });
      links.push({ name: "Profile", href: `/profile/${user.walletAddress}` });
      if (role === "admin" || role === "super_admin") {
        links.push({ name: "Admin", href: "/admin" });
      }
    }

    return links;
  }, [connected, role, user]);

  const fullNavLinks = useMemo(
    () => [...primaryNavLinks, ...mobileAccountNavLinks],
    [primaryNavLinks, mobileAccountNavLinks],
  );

  const showApplyPill = connected && role === "user";
  const showCreatePill =
    connected &&
    (role === "creator" || role === "admin" || role === "super_admin");

  /** Mobile drawer: hide Apply/Create text links when shown as accent pills above. */
  const mobileDrawerListLinks = useMemo(() => {
    const omit = new Set<string>();
    if (showApplyPill) omit.add("Apply");
    if (showCreatePill) omit.add("Create");
    return fullNavLinks.filter((l) => !omit.has(l.name));
  }, [fullNavLinks, showApplyPill, showCreatePill]);

  const shortAddress = walletAddress
    ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
    : "";

  /** Same display rules as `app/profile/[id]/page.tsx` (own profile uses `user` from context). */
  const menuWalletLabel = (() => {
    const w = user?.walletAddress ?? walletAddress;
    if (!w) return "";
    return `${w.slice(0, 6)}...${w.slice(-4)}`;
  })();
  const menuDisplayName = user?.displayName ?? "Anonymous";
  const menuEmail = user?.email?.trim();
  const menuSubtitle = menuEmail ?? menuWalletLabel;

  const resolvedAvatarUrl = resolveR2PublicUrl(user?.avatarUrl);

  const menuInitial = (
    user?.displayName?.[0] ??
    user?.walletAddress?.[0] ??
    walletAddress?.[0] ??
    "?"
  ).toUpperCase();
  const menuSubtitleIsEmail = !!menuEmail;

  return (
    <nav
      className={`z-50 flex w-full items-center py-4 px-4 lg:px-12 ${textColor}`}
    >
      <div className="flex min-w-0 flex-1 items-center justify-start">
        <Link href="/" className="group flex shrink-0 items-center gap-3">
          <span className="font-pixel text-base font-black tracking-tighter uppercase">
            Seni<span className="text-primary">matik</span>
          </span>
        </Link>
      </div>

      {/* Desktop Navigation — centered via equal flex-1 left/right columns */}
      <div className="hidden lg:flex shrink-0 items-center justify-center gap-12 px-4">
        {desktopExploreLinks.map((link) => (
          <Link
            key={link.name}
            href={link.href}
            className="font-pixel text-xs tracking-widest uppercase whitespace-nowrap text-muted hover:text-primary transition-opacity"
          >
            {link.name}
          </Link>
        ))}
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-end gap-4">
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
                  className="absolute z-1 right-0 top-full mt-2 w-72 md:w-80 bg-white text-black shadow-xl border border-black/5 overflow-hidden"
                >
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-black/5 flex items-center justify-between">
                    <p className="text-[9px] uppercase tracking-widest opacity-40 font-pixel">Notifications</p>
                    {unreadCount > 0 && (
                      <button
                        onClick={() => handleMarkAllRead()}
                        className="text-[9px] uppercase tracking-widest font-pixel text-muted hover:text-primary transition-colors cursor-pointer"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  {/* List */}
                  <div className="max-h-80 overflow-y-auto">
                    {(!notifications || notifications.length === 0) && (
                      <div className="px-4 py-8 text-center">
                        <p className="font-pixel text-xs uppercase tracking-widest text-zinc-300">No notifications</p>
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
                          <p className={`text-sm leading-snug mb-0.5 ${!n.isRead ? "font-semibold" : "font-medium"}`}>{n.title}</p>
                          <p className="text-xs text-muted leading-relaxed line-clamp-2">{n.message}</p>
                          <p className="font-pixel text-[9px] uppercase tracking-widest text-primary mt-1">{timeAgo(n.createdAt)}</p>
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

        {connected && (showApplyPill || showCreatePill) && (
          <div className="hidden lg:flex items-center gap-2 shrink-0 font-pixel tracking-widest">
            {showApplyPill && (
              <AccentPillButton
                href="/apply"
                icon={<ClipboardTextIcon size={14} weight="fill" className="text-white" aria-hidden />}
              >
                Apply
              </AccentPillButton>
            )}
            {showCreatePill && (
              <AccentPillButton
                href="/create"
                icon={<PaintBrushIcon size={14} weight="fill" className="text-white" aria-hidden />}
              >
                Create
              </AccentPillButton>
            )}
          </div>
        )}

        {/* Desktop Wallet */}
        {connected ? (
          <div className="relative hidden lg:block" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 font-pixel text-xs tracking-widest uppercase opacity-80 hover:opacity-100 transition-opacity border border-current/30 px-3 py-[9.5px]"
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
                  className="absolute z-1 right-0 top-full mt-2 w-[min(100vw-2rem,17.5rem)] bg-white text-black shadow-lg overflow-hidden"
                >
                  <div className="flex gap-3 px-4 py-3 border-b border-zinc-100">
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden bg-primary/20 ring-1 ring-primary/80">
                      {resolvedAvatarUrl ? (
                        <Image
                          src={resolvedAvatarUrl}
                          alt={menuDisplayName}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-base font-semibold text-primary">
                          {menuInitial}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <p className="truncate text-sm font-semibold text-black leading-snug">
                        {menuDisplayName}
                      </p>
                      {menuSubtitle ? (
                        <p
                          className={`mt-0.5 truncate text-xs text-muted leading-snug ${menuSubtitleIsEmail ? "" : "font-mono"}`}
                        >
                          {menuSubtitle}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="px-2 py-2">
                    <nav className="flex flex-col gap-0.5">
                      {dropdownNavLinks.length > 0 ? (
                        dropdownNavLinks.map((link) => (
                          <Link
                            key={link.name}
                            href={link.href}
                            onClick={() => setIsDropdownOpen(false)}
                            className="px-3 py-2 text-sm text-black transition-colors hover:bg-primary/10"
                          >
                            {link.name}
                          </Link>
                        ))
                      ) : (
                        <Link
                          href={walletAddress ? `/profile/${walletAddress}` : "#"}
                          onClick={(e) => {
                            if (!walletAddress) e.preventDefault();
                            setIsDropdownOpen(false);
                          }}
                          className="px-3 py-2 text-sm text-black transition-colors hover:bg-primary/10"
                        >
                          Profile
                        </Link>
                      )}
                    </nav>
                  </div>

                  <div className="border-t border-zinc-100 px-2 py-2">
                    <button
                      type="button"
                      onClick={() => {
                        router.push("/settings");
                        setIsDropdownOpen(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-black transition-colors hover:bg-primary/10 cursor-pointer"
                    >
                      Settings
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        disconnect();
                        setIsDropdownOpen(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50 cursor-pointer"
                    >
                      Disconnect wallet
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
            className="hidden lg:block font-pixel text-xs tracking-widest uppercase opacity-80 hover:opacity-100 transition-opacity border border-current/30 px-3 py-[9.5px] disabled:opacity-30"
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
            <div className="flex justify-between items-center mb-10">
              <span className="font-pixel text-base font-black tracking-tighter uppercase">
                Seni<span className="text-primary">matik</span>
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

            <div className="flex flex-col gap-6">
              {mobileDrawerListLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="text-2xl font-bold tracking-tighter uppercase hover:opacity-60 transition-opacity"
                >
                  {link.name}
                </Link>
              ))}
            </div>

            <div className="mt-auto pt-8 border-t border-black/5 flex flex-col gap-4">
            {connected && (showApplyPill || showCreatePill) && (
              <div className="flex w-full shrink-0 flex-col">
                {showApplyPill && (
                  <AccentPillButton
                    href="/apply"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex w-full justify-center"
                    icon={<ClipboardTextIcon size={14} weight="fill" className="text-white" aria-hidden />}
                  >
                    Apply
                  </AccentPillButton>
                )}
                {showCreatePill && (
                  <AccentPillButton
                    href="/create"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex w-full justify-center"
                    icon={<PaintBrushIcon size={14} weight="fill" className="text-white" aria-hidden />}
                  >
                    Create
                  </AccentPillButton>
                )}
              </div>
            )}
              {connected ? (
                <>
                  {/* <div className="space-y-1">
                    <p className="text-[9px] uppercase tracking-widest opacity-40">Balance</p>
                    <p className="font-mono text-sm font-bold">
                      {balance !== null ? `${balance.toFixed(4)} SOL` : "—"}
                    </p>
                  </div> */}
                  <button
                    onClick={() => { disconnect(); setIsMenuOpen(false); }}
                    className="w-full border border-red-300 px-5 py-2 font-medium text-red-600 hover:bg-red-50"
                  >
                    Disconnect
                  </button>
                </>
              ) : (
                <button
                  onClick={() => { openWalletModal(true); setIsMenuOpen(false); }}
                  disabled={connecting}
                  className="w-full bg-black px-5 py-2 font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
                >
                  {connecting ? "Connecting..." : "Connect Wallet"}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
