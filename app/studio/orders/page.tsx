"use client";

import { useQuery } from "convex/react";
import { useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";
import Image from "next/image";
import { api } from "@/convex/_generated/api";
import { useWalletAddress } from "@/lib/hooks/useWalletAddress";
import {
  StorefrontIcon,
  ClockIcon,
  PackageIcon,
  TruckIcon,
  CheckCircleIcon,
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

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending:    { label: "Pending",    color: "bg-amber-50 text-amber-600",  icon: <ClockIcon size={12} weight="fill" /> },
  processing: { label: "Processing", color: "bg-blue-50 text-blue-600",    icon: <PackageIcon size={12} weight="fill" /> },
  shipped:    { label: "Shipped",    color: "bg-purple-50 text-purple-600", icon: <TruckIcon size={12} weight="fill" /> },
  delivered:  { label: "Delivered",  color: "bg-green-50 text-green-600",  icon: <CheckCircleIcon size={12} weight="fill" /> },
};

export default function OrdersPage() {
  const { connected: isConnected } = useWallet();
  const walletAddress = useWalletAddress();

  const skip = !isConnected || !walletAddress;
  const sales = useQuery(api.purchases.getSalesByCreator, skip ? "skip" : { walletAddress });

  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-40 flex flex-col items-center gap-4">
        <p className="font-pixel text-[10px] uppercase tracking-[0.3em] opacity-40">
          Connect wallet to view your orders
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-16">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold tracking-tighter mb-1">Orders</h1>
        <p className="text-sm text-zinc-500">Manage shipping and track buyer orders</p>
      </div>

      {/* Orders List */}
      {!sales && <p className="text-sm text-zinc-400">Loading...</p>}
      {sales && sales.length === 0 && (
        <div className="py-12 flex flex-col items-center gap-3 border border-dashed border-black/10 rounded-xl">
          <StorefrontIcon size={28} className="opacity-20" />
          <p className="font-pixel text-[10px] uppercase tracking-[0.3em] opacity-30">No orders yet</p>
        </div>
      )}
      {sales && sales.length > 0 && (
        <div className="flex flex-col gap-3">
          {sales.map((sale) => {
            const isPhysical = sale.deliveryType === "physical" || sale.deliveryType === "both";
            const status = (sale.orderStatus ?? (isPhysical ? "pending" : null)) as OrderStatus | null;
            const sc = status ? STATUS_CONFIG[status] : null;

            return (
              <Link
                key={sale._id}
                href={`/studio/orders/${sale._id}`}
                className="group border border-black/5 rounded-xl overflow-hidden hover:border-black/10 hover:shadow-sm transition-all [content-visibility:auto]"
              >
                <div className="flex gap-4 items-center p-4">
                  {/* Artwork thumbnail */}
                  <div className="relative w-12 h-12 bg-zinc-100 rounded-lg overflow-hidden shrink-0">
                    {sale.artworkPreviewKey && (
                      <Image src={`${R2_URL}/${sale.artworkPreviewKey}`} alt={sale.artworkName} fill sizes="48px" className="object-cover" />
                    )}
                  </div>

                  {/* Order info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm tracking-tight truncate">{sale.artworkName}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {sale.buyerDisplayName || `${sale.buyerWallet.slice(0, 4)}...${sale.buyerWallet.slice(-4)}`}
                    </p>
                  </div>

                  {/* Price and date */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <p className="font-bold text-sm">{sale.totalPrice} USD</p>
                    <p className="text-[10px] text-zinc-400">{formatDate(sale.createdAt)}</p>
                  </div>

                  {/* Status badge */}
                  {sc && (
                    <span className={`flex items-center gap-1 text-[9px] font-pixel uppercase tracking-widest px-2 py-0.5 rounded-full shrink-0 ${sc.color}`}>
                      {sc.icon} {sc.label}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
