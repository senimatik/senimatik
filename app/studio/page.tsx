"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useWalletAddress } from "@/lib/hooks/useWalletAddress";
import {
  StorefrontIcon,
  PencilIcon,
  WarningIcon,
} from "@phosphor-icons/react";

const R2_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL!;

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-black/5 rounded-xl p-6">
      <p className="font-pixel text-[9px] uppercase tracking-[0.3em] text-zinc-400 mb-2">{label}</p>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
    </div>
  );
}

type ConfirmAction =
  | { type: "publish"; id: Id<"artworks">; name: string }
  | { type: "unlist"; id: Id<"artworks">; name: string };

export default function StudioPage() {
  const router = useRouter();
  const { connected: isConnected } = useWallet();
  const walletAddress = useWalletAddress();
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [unlistingId, setUnlistingId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);

  const skip = !isConnected || !walletAddress;

  const stats = useQuery(api.purchases.getCreatorStats, skip ? "skip" : { walletAddress });
  const myArtworks = useQuery(api.artworks.getByCreator, skip ? "skip" : { walletAddress });

  const publish = useMutation(api.artworks.publish);
  const unlist = useMutation(api.artworks.unlist);


  async function handleConfirm() {
    if (!confirmAction || !walletAddress) return;
    const { type, id } = confirmAction;
    setConfirmAction(null);

    if (type === "publish") {
      setPublishingId(id);
      try {
        await publish({ id, walletAddress });
      } catch (err) {
        console.error("[publish]", err);
      } finally {
        setPublishingId(null);
      }
    } else {
      setUnlistingId(id);
      try {
        await unlist({ id, walletAddress });
      } catch (err) {
        console.error("[unlist]", err);
      } finally {
        setUnlistingId(null);
      }
    }
  }

  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-40 flex flex-col items-center gap-4">
        <p className="font-pixel text-[10px] uppercase tracking-[0.3em] opacity-40">
          Connect wallet to view your studio
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Confirmation Modal */}
      {confirmAction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
          onClick={() => setConfirmAction(null)}
        >
          <div
            className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl flex flex-col gap-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <WarningIcon size={18} weight="fill" className={confirmAction.type === "unlist" ? "text-red-500" : "text-black"} />
                <h2 className="font-bold text-lg tracking-tight">
                  {confirmAction.type === "publish" ? "List Artwork" : "Unlist Artwork"}
                </h2>
              </div>
              <p className="text-sm text-zinc-500">
                {confirmAction.type === "publish"
                  ? <>Are you sure you want to list <span className="font-semibold text-black">{confirmAction.name}</span> on Discover? Buyers will be able to purchase it.</>
                  : <>Are you sure you want to unlist <span className="font-semibold text-black">{confirmAction.name}</span>? It will be removed from Discover and no new purchases can be made.</>
                }
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="flex-1 border border-black/10 text-sm font-medium py-2.5 rounded-xl hover:bg-zinc-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className={`flex-1 text-sm font-medium py-2.5 rounded-xl transition-colors ${
                  confirmAction.type === "publish"
                    ? "bg-black text-white hover:bg-zinc-800"
                    : "bg-red-500 text-white hover:bg-red-600"
                }`}
              >
                {confirmAction.type === "publish" ? "Yes, List It" : "Yes, Unlist It"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto py-16">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold tracking-tighter mb-1">Artworks</h1>
          <p className="text-sm text-zinc-500">Manage and track your published artworks</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <StatCard label="Total Sales" value={stats?.totalSales ?? "—"} />
          <StatCard label="Total Revenue" value={stats ? `${stats.totalRevenue} USD` : "—"} />
          <StatCard label="Listed Artworks" value={stats?.listedCount ?? "—"} />
          <StatCard label="Artworks Sold" value={stats?.soldArtworksCount ?? "—"} />
        </div>

        {/* Manage Artworks */}
        <section className="mb-12">
          <h2 className="text-xl font-bold tracking-tight mb-4">Manage Artworks</h2>
          {!myArtworks && <p className="text-sm text-zinc-400">Loading...</p>}
          {myArtworks && myArtworks.length === 0 && (
            <div className="py-12 flex flex-col items-center gap-3 border border-dashed border-black/10 rounded-xl">
              <StorefrontIcon size={28} className="opacity-20" />
              <p className="font-pixel text-[10px] uppercase tracking-[0.3em] opacity-30">
                No artworks yet
              </p>
              <Link
                href="/create"
                className="text-sm font-medium underline underline-offset-4 opacity-60 hover:opacity-100"
              >
                Create artwork
              </Link>
            </div>
          )}
          {myArtworks && myArtworks.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {myArtworks.map((artwork) => {
                const isPublished = artwork.status === "listed";
                const isPublishing = publishingId === artwork._id;
                const isUnlisting = unlistingId === artwork._id;
                const minPrice = artwork.licenseOptions && artwork.licenseOptions.length > 0
                  ? Math.min(...artwork.licenseOptions.map(opt => opt.price))
                  : 0;

                return (
                  <div
                    key={artwork._id}
                    className="border border-black/5 rounded-xl overflow-hidden [content-visibility:auto]"
                  >
                    <Link href={`/art/${artwork._id}`}>
                      <div className="relative w-full aspect-video bg-zinc-50">
                        <Image
                          src={`${R2_URL}/${artwork.r2PreviewKey}`}
                          alt={artwork.name}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover"
                        />
                      </div>
                    </Link>
                    <div className="p-4 flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-bold text-sm tracking-tight truncate">{artwork.name}</p>
                        <span
                          className={`shrink-0 text-[9px] font-pixel uppercase tracking-widest px-2 py-1 rounded ${
                            isPublished ? "bg-green-50 text-green-600" : "bg-zinc-100 text-zinc-500"
                          }`}
                        >
                          {isPublished ? "Listed" : "Draft"}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-400">
                        <span>From {minPrice} USD</span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            router.push(`/edit/${artwork._id}`);
                          }}
                          className="flex items-center justify-center gap-1 border border-black/10 text-black text-xs font-medium px-3 py-2 rounded-lg hover:bg-zinc-50 transition-colors"
                        >
                          <PencilIcon size={12} />
                          Edit
                        </button>
                        {!isPublished ? (
                          <button
                            disabled={isPublishing}
                            onClick={() => setConfirmAction({ type: "publish", id: artwork._id, name: artwork.name })}
                            className="flex-1 bg-black text-white text-xs font-medium py-2 rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isPublishing ? "Publishing..." : "Publish"}
                          </button>
                        ) : (
                          <button
                            disabled={isUnlisting}
                            onClick={() => setConfirmAction({ type: "unlist", id: artwork._id, name: artwork.name })}
                            className="flex-1 text-xs font-medium py-2 rounded-lg border border-black/10 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isUnlisting ? "Unlisting..." : "Unlist"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
