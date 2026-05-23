"use client";

import { useState } from "react";

const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL!;
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserIcon,
  ShieldCheckIcon,
  GlobeIcon,
} from "@phosphor-icons/react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/lib/context/UserContext";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useWalletAddress } from "@/lib/hooks/useWalletAddress";
import { resolveR2PublicUrl } from "@/lib/r2-public-url";

type Tab = "collect" | "create";

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("collect");
  const { role, user: currentUser } = useCurrentUser();
  const walletAddress = useWalletAddress();

  // Fetch the profile being viewed (public — no auth required)
  const profileUser = useQuery(api.users.getByWallet, { walletAddress: id });

  const isOwnProfile = walletAddress?.toLowerCase() === id?.toLowerCase();
  const displayUser = isOwnProfile ? currentUser : profileUser;
  const isApprovedCreator =
    isOwnProfile &&
    (role === "creator" || role === "admin" || role === "super_admin");

  // Fetch creator's artworks (only for own profile)
  const creatorArtworks = useQuery(
    api.artworks.getByCreator,
    isOwnProfile && walletAddress ? { walletAddress } : "skip"
  );

  // Fetch purchased artworks (collect tab, own profile only)
  const myPurchases = useQuery(
    api.purchases.getMyPurchases,
    isOwnProfile && walletAddress ? { walletAddress } : "skip"
  );

  const avatarUrl = resolveR2PublicUrl(displayUser?.avatarUrl);
  const userBio = (displayUser as { bio?: string } | undefined)?.bio;
  const userSocialUrl = (displayUser as { socialUrl?: string } | undefined)?.socialUrl;

  return (
    <main className="min-h-screen">
      <Navbar variant="dark" />

      <div className="w-full mx-auto mt-10 mb-20 lg:mt-12 px-4 lg:px-12">
        <div className="flex flex-col lg:flex-row gap-12 2xl:gap-24">
          {/* Sidebar */}
          <aside className="w-full lg:w-80 flex flex-col gap-12 shrink-0">
            {/* Avatar */}
            <div className="relative w-32 h-32 md:w-40 md:h-40 overflow-hidden group border border-white/5 rounded-full">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={displayUser?.displayName || "Avatar"}
                  fill
                  className="object-cover"
                  sizes="160px"
                />
              ) : (
                <UserIcon
                  size={96}
                  weight="thin"
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-zinc-800"
                />
              )}
            </div>

            {/* Info */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl font-medium tracking-tight leading-tight">
                  {displayUser?.displayName ?? "Anonymous"}
                </h1>
                {displayUser?.walletAddress && (
                  <Button
                    variant="ghost"
                    size="xs"
                    className="px-0 hover:bg-transparent mr-4"
                  >
                    {displayUser.walletAddress.slice(0, 6)}...{displayUser.walletAddress.slice(-4)}
                  </Button>
                )}
                {/* {isOwnProfile && role && role !== "user" && (
                  <span className="inline-block text-[9px] uppercase tracking-widest px-2 py-1 bg-zinc-100 text-muted rounded">
                    {role.replace("_", " ")}
                  </span>
                )} */}
              </div>

              {userBio && (
                <p className="text-muted text-sm leading-relaxed font-light max-w-xs">
                  {userBio.length > 160 ? `${userBio.slice(0, 160)}...` : userBio}
                </p>
              )}

              {/* Socials */}
              {userSocialUrl && (
                <div className="flex items-center gap-6 pt-2">
                  <a
                    href={userSocialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted hover:text-primary transition-colors"
                  >
                    <GlobeIcon size={20} weight="light" />
                  </a>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="space-y-6 pt-8 border-t border-white/5">
              <div className="flex justify-between items-baseline">
                <span className="text-xs uppercase tracking-widest text-primary">
                  Joined
                </span>
                <span className="text-sm font-medium text-muted">
                  {displayUser?.createdAt
                    ? new Date(displayUser.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })
                    : "—"}
                </span>
              </div>
            </div>
          </aside>

          {/* Content */}
          <section className="flex-1 flex flex-col pt-2 lg:pt-0">
            <nav className="flex gap-12 mb-16 border-b border-black/5">
              {(["collect", "create"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-6 text-sm uppercase tracking-widest transition-all relative ${activeTab === tab
                      ? "text-primary font-bold"
                      : "text-muted hover:text-primary"
                    }`}
                >
                  {tab}
                  {activeTab === tab && (
                    <motion.div
                      layoutId="profileTabUnderline"
                      className="absolute bottom-0 left-0 right-0 h-px bg-white"
                    />
                  )}
                </button>
              ))}
            </nav>

            <div className="flex-1 relative min-h-100">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="h-full flex flex-col justify-start"
                >
                  {activeTab === "collect" ? (
                    isOwnProfile && myPurchases === undefined ? (
                      <div className="flex items-center justify-center h-96">
                        <div className="animate-spin rounded-full h-12 w-12 border-2 border-black/10 border-t-black"></div>
                      </div>
                    ) : isOwnProfile && myPurchases && myPurchases.length > 0 ? (
                      <div className="w-full space-y-8">
                        {(() => {
                          // Group purchases by artworkId and count
                          const groupedByArtwork = new Map<string, { purchase: typeof myPurchases[0]; count: number }>();
                          myPurchases.forEach((purchase) => {
                            const artworkKey = purchase.artworkId.toString();
                            if (groupedByArtwork.has(artworkKey)) {
                              const existing = groupedByArtwork.get(artworkKey)!;
                              existing.count += 1;
                            } else {
                              groupedByArtwork.set(artworkKey, { purchase, count: 1 });
                            }
                          });
                          const uniqueArtworks = Array.from(groupedByArtwork.values());

                          return (
                            <>
                              {/* <div className="space-y-2">
                                <h2 className="text-3xl font-medium tracking-tight text-black">
                                  Collected
                                </h2>
                                <p className="text-muted text-sm">
                                  {uniqueArtworks.length} artwork{uniqueArtworks.length !== 1 ? "s" : ""} in your collection ({myPurchases.length} piece{myPurchases.length !== 1 ? "s" : ""})
                                </p>
                              </div> */}
                              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
                                {uniqueArtworks.map(({ purchase, count }) => (
                                  <div
                                    key={purchase._id}
                                    className="group cursor-pointer [content-visibility:auto] relative"
                                    onClick={() => router.push(`/art/${purchase.artworkId}`)}
                                  >
                                    {count > 1 && (
                                      <div className="absolute top-4 right-4 z-10 bg-black/70 text-white rounded-full w-8 h-8 flex items-center justify-center backdrop-blur-sm">
                                        <span className="text-xs font-pixel font-bold">×{count}</span>
                                      </div>
                                    )}
                                    <div className="relative bg-zinc-100 overflow-hidden mb-4 border border-black/5 aspect-square">
                                      {purchase.artworkPreviewKey && (
                                        <Image
                                          src={`${R2_PUBLIC_URL}/${purchase.artworkPreviewKey}`}
                                          alt={purchase.artworkName}
                                          fill
                                          className="object-cover group-hover:scale-105 transition-transform duration-700"
                                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                        />
                                      )}
                                      {/* <div className="absolute top-4 left-4">
                                        <span className="inline-block text-[9px] font-pixel uppercase tracking-widest px-3 py-1 bg-black/70 text-white rounded backdrop-blur-sm">
                                          {purchase.licenseType.replace(/_/g, " ")}
                                        </span>
                                      </div> */}
                                    </div>
                                    <div className="space-y-1">
                                      <h3 className="text-lg 2xl:text-2xl font-medium text-black line-clamp-1">
                                        {purchase.artworkName}
                                      </h3>
                                      {/* <div className="flex items-center justify-between">
                                        <span className="text-xs text-muted capitalize">{purchase.deliveryType}</span>
                                        {purchase.verificationId && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              router.push(`/verify/${purchase.verificationId}`);
                                            }}
                                            className="text-xs font-pixel uppercase tracking-widest text-muted hover:text-black transition-colors"
                                          >
                                            Verify
                                          </button>
                                        )}
                                      </div> */}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="max-w-md space-y-8">
                        <div className="space-y-4 mt-24">
                          <h2 className="text-3xl font-medium tracking-tight text-black">
                            The vault is empty.
                          </h2>
                          <p className="text-muted text-sm leading-relaxed max-w-sm">
                            {isOwnProfile
                              ? "Start curating your digital legacy. Every piece you acquire is cryptographically secured on the protocol."
                              : "This collector has not acquired any artworks yet."}
                          </p>
                        </div>
                        {isOwnProfile && (
                          <Button
                            variant="default"
                            size="main"
                            onClick={() => router.push("/discover")}
                          >
                            Explore Gallery
                          </Button>
                        )}
                      </div>
                    )
                  ) : (
                    <div className="w-full space-y-8">
                      {isOwnProfile ? (
                        isApprovedCreator ? (
                          creatorArtworks && creatorArtworks.length > 0 ? (
                            <div className="space-y-8">
                              <div className="space-y-4">
                                <h2 className="text-3xl font-medium tracking-tight text-black">
                                  Your Creations
                                </h2>
                                <p className="text-muted text-sm leading-relaxed">
                                  Manage and review your published artworks.
                                </p>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {creatorArtworks.map((artwork) => {
                                  const artworkImageUrl = `${R2_PUBLIC_URL}/${artwork.r2PreviewKey}`;
                                  const aspectRatio = 4 / 5;

                                  return (
                                    <div
                                      key={artwork._id}
                                      className="group cursor-pointer"
                                      onClick={() => router.push(`/art/${artwork._id}`)}
                                    >
                                      <div className="relative bg-zinc-100 overflow-hidden mb-4 border border-black/5" style={{ aspectRatio }}>
                                        <Image
                                          src={artworkImageUrl}
                                          alt={artwork.name}
                                          fill
                                          className="object-contain"
                                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                        />
                                        <div className="absolute top-4 left-4">
                                          <span className="inline-block text-xs font-pixel uppercase tracking-widest px-3 py-1 bg-green-100 text-green-800 rounded">
                                            Minted
                                          </span>
                                        </div>
                                      </div>
                                      <div className="space-y-2">
                                        <h3 className="font-medium text-black line-clamp-1">
                                          {artwork.name}
                                        </h3>
                                        {/* <p className="text-sm text-zinc-500 line-clamp-2">
                                          {artwork.description}
                                        </p> */}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ) : (
                            <div className="max-w-md space-y-8">
                              <div className="space-y-4 mt-24">
                                <h2 className="text-3xl font-medium tracking-tight text-black text-balance">
                                  Ready for your first creation.
                                </h2>
                                <p className="text-muted text-sm leading-relaxed">
                                  Your creator status is verified. You can now
                                  publish your digital works directly to the
                                  repository.
                                </p>
                              </div>
                              <Button variant="default" size="main" onClick={() => router.push("/create")}>
                                Create Now
                              </Button>
                            </div>
                          )
                        ) : (
                          <div className="max-w-md space-y-8">
                            <div className="space-y-4 mt-24">
                              <div className="flex items-center gap-2 text-muted mb-2">
                                <ShieldCheckIcon size={20} weight="light" />
                                <span className="text-xs font-pixel uppercase tracking-widest">
                                  Restricted
                                </span>
                              </div>
                              <h2 className="text-3xl font-medium tracking-tight text-black">
                                Apply for Creator Status.
                              </h2>
                              <p className="text-muted text-sm leading-relaxed">
                                Join our verified artist community. Submit your
                                portfolio for review by the council to begin
                                publishing.
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="main"
                              onClick={() => router.push("/apply")}
                            >
                              Submit Application
                            </Button>
                          </div>
                        )
                      ) : (
                        <div className="space-y-4 mt-24">
                          <h2 className="text-3xl font-medium tracking-tight text-black">
                            No artworks yet.
                          </h2>
                          <p className="text-muted text-sm leading-relaxed max-w-sm">
                            This creator has not published any artworks yet.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </section>
        </div>
      </div>

      <Footer variant="dark" />
    </main>
  );
}
