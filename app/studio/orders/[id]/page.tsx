"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { api } from "@/convex/_generated/api";
import { useWalletAddress } from "@/lib/hooks/useWalletAddress";
import {
  ArrowLeftIcon,
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
  pending:    { label: "Pending",    color: "bg-amber-50 text-amber-600",  icon: <ClockIcon size={16} weight="fill" /> },
  processing: { label: "Processing", color: "bg-blue-50 text-blue-600",    icon: <PackageIcon size={16} weight="fill" /> },
  shipped:    { label: "Shipped",    color: "bg-purple-50 text-purple-600", icon: <TruckIcon size={16} weight="fill" /> },
  delivered:  { label: "Delivered",  color: "bg-green-50 text-green-600",  icon: <CheckCircleIcon size={16} weight="fill" /> },
};

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { connected: isConnected } = useWallet();
  const walletAddress = useWalletAddress();

  const [isUpdating, setIsUpdating] = useState(false);
  const [isShippingFormOpen, setIsShippingFormOpen] = useState(false);
  const [courierName, setCourierName] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");

  const skip = !isConnected || !walletAddress || !params.id;

  // Get single order by fetching all and filtering (since there's no getSaleById query)
  const allSales = useQuery(api.purchases.getSalesByCreator, skip ? "skip" : { walletAddress });
  const sale = allSales?.find(s => s._id === params.id);

  const updateOrderStatus = useMutation(api.purchases.updateOrderStatus);

  async function handleStatusUpdate(newStatus: OrderStatus, courier?: string, tracking?: string) {
    if (!walletAddress || !sale) return;
    setIsUpdating(true);
    try {
      await updateOrderStatus({
        walletAddress,
        id: sale._id,
        newStatus,
        courierName: courier,
        trackingNumber: tracking
      });
      setIsShippingFormOpen(false);
      setCourierName("");
      setTrackingNumber("");
    } catch (err) {
      console.error("[updateOrderStatus]", err);
    } finally {
      setIsUpdating(false);
    }
  }

  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-40 flex flex-col items-center gap-4">
        <p className="font-pixel text-[10px] uppercase tracking-[0.3em] opacity-40">
          Connect wallet to view order details
        </p>
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-zinc-500 hover:text-black transition-colors mb-10"
        >
          <ArrowLeftIcon size={16} /> Back to orders
        </button>
        <p className="text-sm text-zinc-400">Loading...</p>
      </div>
    );
  }

  const isPhysical = sale.deliveryType === "physical" || sale.deliveryType === "both";
  const status = (sale.orderStatus ?? (isPhysical ? "pending" : null)) as OrderStatus | null;
  const sc = status ? STATUS_CONFIG[status] : null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-zinc-500 hover:text-black transition-colors mb-8"
      >
        <ArrowLeftIcon size={16} /> Back to orders
      </button>

      {/* Order header */}
      <div className="border border-black/5 rounded-xl p-6 mb-8">
        <div className="flex gap-6 items-start">
          {/* Artwork image */}
          <div className="relative w-20 h-20 bg-zinc-100 rounded-lg overflow-hidden shrink-0">
            {sale.artworkPreviewKey && (
              <Image
                src={`${R2_URL}/${sale.artworkPreviewKey}`}
                alt={sale.artworkName}
                fill
                sizes="80px"
                className="object-cover"
              />
            )}
          </div>

          {/* Order info */}
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <h1 className="text-2xl font-bold tracking-tight mb-1">{sale.artworkName}</h1>
                <p className="text-sm text-zinc-500">
                  Buyer: {sale.buyerDisplayName || `${sale.buyerWallet.slice(0, 6)}...${sale.buyerWallet.slice(-4)}`}
                </p>
              </div>
              {sc && (
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${sc.color}`}>
                  {sc.icon}
                  <span className="text-sm font-medium">{sc.label}</span>
                </div>
              )}
            </div>

            {/* Order details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-black/5">
              <div>
                <p className="font-pixel text-[9px] uppercase tracking-widest text-zinc-400 mb-1">License Type</p>
                <p className="text-sm font-medium">{sale.licenseType.replace(/_/g, " ")}</p>
              </div>
              <div>
                <p className="font-pixel text-[9px] uppercase tracking-widest text-zinc-400 mb-1">Delivery</p>
                <p className="text-sm font-medium capitalize">{sale.deliveryType}</p>
              </div>
              <div>
                <p className="font-pixel text-[9px] uppercase tracking-widest text-zinc-400 mb-1">Price</p>
                <p className="text-sm font-medium">{sale.totalPrice} USD</p>
              </div>
              <div>
                <p className="font-pixel text-[9px] uppercase tracking-widest text-zinc-400 mb-1">Date</p>
                <p className="text-sm font-medium">{formatDate(sale.createdAt)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Physical order details */}
      {isPhysical && (
        <>
          {/* Shipping address */}
          {sale.shippingAddress && (
            <div className="border border-black/5 rounded-xl p-6 mb-8">
              <h2 className="text-lg font-bold tracking-tight mb-4">Shipping Address</h2>
              <div className="space-y-2 text-sm">
                <p className="font-medium">{sale.shippingAddress.fullName}</p>
                <p className="text-zinc-600">{sale.shippingAddress.street}</p>
                <p className="text-zinc-600">
                  {sale.shippingAddress.city}, {sale.shippingAddress.state} {sale.shippingAddress.zipCode}
                </p>
                <p className="text-zinc-600">{sale.shippingAddress.country}</p>
                {sale.shippingAddress.phone && <p className="text-zinc-600">{sale.shippingAddress.phone}</p>}
                {sale.selectedShipping && (
                  <p className="text-xs text-zinc-500 pt-2 border-t border-black/5 mt-3">
                    {sale.selectedShipping.zone.replace(/_/g, " ")} · est. {sale.selectedShipping.estimatedDays} days
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Tracking info */}
          {sale.courierName && sale.trackingNumber && (
            <div className="border border-black/5 rounded-xl p-6 mb-8">
              <h2 className="text-lg font-bold tracking-tight mb-4">Tracking Information</h2>
              <div className="space-y-3">
                <div>
                  <p className="font-pixel text-[9px] uppercase tracking-widest text-zinc-400 mb-1">Courier</p>
                  <p className="text-sm font-medium">{sale.courierName}</p>
                </div>
                <div>
                  <p className="font-pixel text-[9px] uppercase tracking-widest text-zinc-400 mb-1">Tracking Number</p>
                  <p className="text-sm font-mono">{sale.trackingNumber}</p>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="border border-black/5 rounded-xl p-6">
            <h2 className="text-lg font-bold tracking-tight mb-4">Order Status</h2>
            <div className="flex flex-col gap-3">
              {status === "pending" && (
                <button
                  disabled={isUpdating}
                  onClick={() => handleStatusUpdate("processing")}
                  className="text-sm font-medium px-4 py-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 w-full"
                >
                  {isUpdating ? "Updating..." : "Mark as Processing"}
                </button>
              )}

              {status === "processing" && !isShippingFormOpen && (
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsShippingFormOpen(true)}
                    className="flex-1 text-sm font-medium px-4 py-3 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
                  >
                    Mark as Shipped
                  </button>
                  <button
                    disabled={isUpdating}
                    onClick={() => handleStatusUpdate("pending")}
                    className="flex-1 text-sm font-medium px-4 py-3 text-red-500 hover:bg-red-50 rounded-lg hover:border hover:border-red-200 transition-colors disabled:opacity-50"
                  >
                    {isUpdating ? "Reverting..." : "Revert to Pending"}
                  </button>
                </div>
              )}

              {status === "processing" && isShippingFormOpen && (
                <div className="flex flex-col gap-3 p-4 bg-zinc-50 rounded-xl">
                  <p className="font-pixel text-[9px] uppercase tracking-widest text-zinc-400">Enter shipping information</p>
                  <input
                    type="text"
                    placeholder="Courier name (e.g. Pos Malaysia)"
                    value={courierName}
                    onChange={(e) => setCourierName(e.target.value)}
                    className="border border-black/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-black transition-colors"
                  />
                  <input
                    type="text"
                    placeholder="Tracking number"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="border border-black/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-black transition-colors"
                  />
                  <div className="flex gap-2">
                    <button
                      disabled={isUpdating || !courierName.trim() || !trackingNumber.trim()}
                      onClick={() => handleStatusUpdate("shipped", courierName, trackingNumber)}
                      className="flex-1 text-sm font-medium px-4 py-2 bg-black text-white rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50"
                    >
                      {isUpdating ? "Saving..." : "Confirm Shipment"}
                    </button>
                    <button
                      onClick={() => { setIsShippingFormOpen(false); setCourierName(""); setTrackingNumber(""); }}
                      className="flex-1 text-sm font-medium px-4 py-2 text-zinc-400 hover:text-black transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {status === "shipped" && (
                <button
                  disabled={isUpdating}
                  onClick={() => handleStatusUpdate("delivered")}
                  className="text-sm font-medium px-4 py-3 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50 w-full"
                >
                  {isUpdating ? "Updating..." : "Mark as Delivered"}
                </button>
              )}

              {status === "delivered" && (
                <div className="text-sm text-zinc-400 font-pixel uppercase tracking-widest text-center py-3">
                  ✓ Order completed
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Digital orders */}
      {!isPhysical && (
        <div className="border border-black/5 rounded-xl p-6">
          <h2 className="text-lg font-bold tracking-tight mb-3">Digital Delivery</h2>
          <p className="text-sm text-zinc-600">
            This is a digital order. No shipping required.
          </p>
        </div>
      )}
    </div>
  );
}
