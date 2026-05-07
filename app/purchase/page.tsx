"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { api } from "@/convex/_generated/api";
import { useWalletAddress } from "@/lib/hooks/useWalletAddress";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  ShoppingBagIcon,
  CertificateIcon,
  CopyIcon,
  ArrowSquareOutIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  PackageIcon,
  TruckIcon,
} from "@phosphor-icons/react";

const R2_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL!;

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type OrderStatus = "pending" | "processing" | "shipped" | "delivered";

const ORDER_STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "Pending", color: "text-amber-600 bg-amber-50", icon: <ClockIcon size={10} weight="fill" /> },
  processing: { label: "Processing", color: "text-blue-600 bg-blue-50", icon: <PackageIcon size={10} weight="fill" /> },
  shipped: { label: "Shipped", color: "text-purple-600 bg-purple-50", icon: <TruckIcon size={10} weight="fill" /> },
  delivered: { label: "Delivered", color: "text-green-600 bg-green-50", icon: <CheckCircleIcon size={10} weight="fill" /> },
};

function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const cfg = ORDER_STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1 text-[9px] font-pixel uppercase tracking-widest px-2 py-0.5 rounded ${cfg.color}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-black/5 rounded-xl p-6">
      <p className="font-pixel text-[9px] uppercase tracking-[0.3em] text-zinc-400 mb-2">{label}</p>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
    </div>
  );
}

export default function PurchasePage() {
  const router = useRouter();
  const { connected: isConnected } = useWallet();
  const walletAddress = useWalletAddress();
  const [activeTab, setActiveTab] = useState<"purchases" | "certificates">("purchases");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const skip = !isConnected || !walletAddress;

  const purchases = useQuery(
    api.purchases.getMyPurchases,
    skip ? "skip" : { walletAddress }
  );
  const licenses = useQuery(
    api.purchases.getLicensesByBuyer,
    skip ? "skip" : { walletAddress }
  );
  const stats = useQuery(
    api.purchases.getBuyerStats,
    skip ? "skip" : { walletAddress }
  );

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  }

  if (!isConnected) {
    return (
      <main className="min-h-screen bg-white text-black font-sans">
        <Navbar variant="dark" />
        <div className="max-w-7xl mx-auto px-4 py-40 flex flex-col items-center gap-4">
          <p className="font-pixel text-[10px] uppercase tracking-[0.3em] opacity-40">
            Connect wallet to view your purchases
          </p>
        </div>
        <Footer variant="dark" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white">
      <Navbar variant="dark" />

      <div className="max-w-7xl mx-auto px-4 xl:px-0 py-16">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold tracking-tighter mb-1">My Purchases</h1>
          <p className="text-sm text-zinc-500">Your purchases and licenses</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <StatCard label="Artworks Purchased" value={stats?.totalPurchased ?? "—"} />
          <StatCard
            label="Total Spent"
            value={stats ? `${stats.totalSpent} USD` : "—"}
          />
          <StatCard label="Active Licenses" value={stats?.activeLicenses ?? "—"} />
        </div>

        {/* Tabs */}
        <div className="flex gap-8 border-b border-black/5 mb-8">
          {(["purchases", "certificates"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 font-pixel text-[10px] uppercase tracking-[0.3em] transition-opacity ${
                activeTab === tab ? "opacity-100 border-b-2 border-black" : "opacity-30 hover:opacity-60"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* PURCHASES TAB */}
        {activeTab === "purchases" && (
          <>
            {!purchases && (
              <p className="text-sm text-zinc-400">Loading...</p>
            )}
            {purchases && purchases.length === 0 && (
              <div className="py-20 flex flex-col items-center gap-4 border border-dashed border-black/10 rounded-xl">
                <ShoppingBagIcon size={32} className="opacity-20" />
                <p className="font-pixel text-[10px] uppercase tracking-[0.3em] opacity-30">
                  No purchases yet
                </p>
                <button
                  onClick={() => router.push("/discover")}
                  className="text-sm font-medium underline underline-offset-4 opacity-60 hover:opacity-100"
                >
                  Discover artworks
                </button>
              </div>
            )}
            {purchases && purchases.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {purchases.map((p) => (
                  <div
                    key={p._id}
                    className="border border-black/5 rounded-xl overflow-hidden [content-visibility:auto]"
                  >
                    <Link href={`/art/${p.artworkId}`}>
                      <div className="relative w-full aspect-square bg-zinc-50">
                        {p.artworkPreviewKey && (
                          <Image
                            src={`${R2_URL}/${p.artworkPreviewKey}`}
                            alt={p.artworkName}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover"
                          />
                        )}
                      </div>
                    </Link>
                    <div className="p-4 flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-bold text-sm tracking-tight leading-tight">
                          {p.artworkName}
                        </p>
                        <span className="shrink-0 text-[9px] font-pixel uppercase tracking-widest bg-zinc-100 px-2 py-1 rounded">
                          {p.licenseType.replace(/_/g, " ")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[9px] font-pixel uppercase tracking-widest text-zinc-400 bg-zinc-50 px-2 py-0.5 rounded">
                          {p.deliveryType}
                        </span>
                        {p.printEditionNumber && (
                          <span className="text-[9px] font-pixel uppercase tracking-widest text-zinc-600 bg-amber-50 px-2 py-0.5 rounded">
                            Edition {p.printEditionNumber}
                          </span>
                        )}
                        {p.orderStatus && (
                          <OrderStatusBadge status={p.orderStatus as OrderStatus} />
                        )}
                      </div>
                      {p.orderStatus === "shipped" && p.courierName && p.trackingNumber && (
                        <div className="bg-purple-50 border border-purple-100 rounded-lg px-3 py-2 text-xs">
                          <p className="font-pixel text-[9px] uppercase tracking-widest text-purple-400 mb-1">Tracking</p>
                          <p className="font-medium text-purple-700">{p.courierName}</p>
                          <p className="text-purple-600 font-mono">{p.trackingNumber}</p>
                        </div>
                      )}
                      {p.orderStatus === "delivered" && p.courierName && p.trackingNumber && (
                        <div className="bg-green-50 border border-green-100 rounded-lg px-3 py-2 text-xs">
                          <p className="font-pixel text-[9px] uppercase tracking-widest text-green-400 mb-1">Delivered via</p>
                          <p className="font-medium text-green-700">{p.courierName} · {p.trackingNumber}</p>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-xs text-zinc-400 mt-1">
                        <span>{formatDate(p.createdAt)}</span>
                        <span className="font-medium text-black">{p.totalPrice} USD</span>
                      </div>
                      {p.verificationId && (
                        <Link
                          href={`/verify/${p.verificationId}`}
                          className="mt-1 flex items-center gap-1 text-[10px] font-pixel uppercase tracking-widest text-zinc-400 hover:text-black transition-colors"
                        >
                          View Certificate <ArrowSquareOutIcon size={10} />
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* CERTIFICATES TAB */}
        {activeTab === "certificates" && (
          <>
            {!licenses && <p className="text-sm text-zinc-400">Loading...</p>}
            {licenses && licenses.length === 0 && (
              <div className="py-20 flex flex-col items-center gap-4 border border-dashed border-black/10 rounded-xl">
                <CertificateIcon size={32} className="opacity-20" />
                <p className="font-pixel text-[10px] uppercase tracking-[0.3em] opacity-30">
                  No licenses yet
                </p>
              </div>
            )}
            {licenses && licenses.length > 0 && (
              <div className="flex flex-col gap-3">
                {licenses.map((l) => (
                  <div
                    key={l._id}
                    className="border border-black/5 rounded-xl p-5 flex gap-4 items-start [content-visibility:auto]"
                  >
                    <div className="relative w-14 h-14 bg-zinc-100 rounded-lg overflow-hidden shrink-0">
                      {l.artworkPreviewKey && (
                        <Image
                          src={`${R2_URL}/${l.artworkPreviewKey}`}
                          alt={l.artworkName}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-bold text-sm tracking-tight">{l.artworkName}</p>
                        {l.isActive ? (
                          <span className="flex items-center gap-1 text-[9px] font-pixel uppercase tracking-widest text-green-600 shrink-0">
                            <CheckCircleIcon size={10} weight="fill" /> Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[9px] font-pixel uppercase tracking-widest text-red-500 shrink-0">
                            <XCircleIcon size={10} weight="fill" /> Revoked
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 capitalize mt-0.5">
                        {l.licenseType.replace(/_/g, " ")} · {l.deliveryType}
                        {l.printEditionNumber && ` · Edition ${l.printEditionNumber}`}
                      </p>
                      <p className="text-xs text-zinc-400 mt-1">Issued {formatDate(l.issuedAt)}</p>

                      <div className="flex items-center gap-3 mt-3">
                        <button
                          onClick={() => copyToClipboard(l.verificationId)}
                          className="flex items-center gap-1 text-[9px] font-pixel uppercase tracking-widest text-zinc-400 hover:text-black transition-colors"
                        >
                          <CopyIcon size={10} />
                          {copiedId === l.verificationId ? "Copied!" : "Copy ID"}
                        </button>
                        <Link
                          href={`/verify/${l.verificationId}`}
                          className="flex items-center gap-1 text-[9px] font-pixel uppercase tracking-widest text-zinc-400 hover:text-black transition-colors"
                        >
                          <ArrowSquareOutIcon size={10} /> Verify
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <Footer variant="dark" />
    </main>
  );
}
