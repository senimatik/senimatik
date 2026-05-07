"use client";

import { useState, useMemo, useCallback} from "react";

const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL!;
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  ArrowLeftIcon,
  CaretLeftIcon,
  CaretRightIcon,
  ShoppingCartSimpleIcon,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ImageLightbox } from "@/components/ui/ImageLightbox";
import dynamic from "next/dynamic";
import { useCurrentUser } from "@/lib/context/UserContext";

const PurchaseModal = dynamic(() => import("@/components/PurchaseModal"), { ssr: false });
import Link from "next/link";

type LicenseType = "personal_use" | "commercial_digital" | "limited_print";

interface LicenseOption {
  licenseType: LicenseType;
  price: number;
  printLimit?: number;
  printsMinted?: number;
  resaleMinPrice?: number;
}

export default function ArtDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("details");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHoveringImage, setIsHoveringImage] = useState(false);
  const [selectedPrintSize, setSelectedPrintSize] = useState<number | null>(null);
  const [selectedShipping, setSelectedShipping] = useState<number | null>(null);
  const [selectedLicenseIndex, setSelectedLicenseIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const handleLightboxClose = useCallback(() => setLightboxOpen(false), []);

  const { connected: isConnected } = useWallet();
  const { user } = useCurrentUser();

  // Fetch artwork from Convex
  const artwork = useQuery(api.artworks.getById, {
    id: params.id as Id<"artworks">,
  });

  // Get license options
  const licenseOptions: LicenseOption[] = useMemo(() => {
    if (!artwork || !artwork.licenseOptions) return [];
    return artwork.licenseOptions as LicenseOption[];
  }, [artwork]);

  const selectedLicense = licenseOptions[selectedLicenseIndex] ?? licenseOptions[0];
  const selectedLicenseType = selectedLicense?.licenseType ?? "personal_use";

  // Validate selections: only valid for their license types
  const validPrintSize = selectedLicenseType === "limited_print" ? selectedPrintSize : null;
  const validShipping = selectedLicenseType === "commercial_digital" ? null : selectedShipping;

  // Derived purchase-button state — computed at render, not inline
  const isListed = artwork?.status === "listed";
  const isOwnArtwork = !!(user && artwork && user._id === artwork.creatorId);
  const isSoldOut =
    (selectedLicense?.licenseType === "limited_print" &&
      selectedLicense.printLimit !== undefined &&
      selectedLicense.printLimit > 0 &&
      (selectedLicense.printsMinted ?? 0) >= selectedLicense.printLimit) ||
    (selectedLicense?.licenseType === "personal_use" &&
      (selectedLicense.printsMinted ?? 0) >= 1);
  const needsShipping = selectedLicenseType !== "commercial_digital" &&
    artwork?.shippingRates && artwork.shippingRates.length > 0;
  const needsPrintSize = selectedLicenseType === "limited_print" &&
    artwork?.printSizes && artwork.printSizes.length > 0;
  const purchaseDisabled =
    !isConnected ||
    !isListed ||
    isOwnArtwork ||
    isSoldOut ||
    !selectedLicense ||
    (needsShipping && selectedShipping === null) ||
    (needsPrintSize && selectedPrintSize === null);

  // Total price: base + selected print size add-on + selected shipping
  const totalPrice = useMemo(() => {
    if (!artwork || !selectedLicense) return null;
    let total = selectedLicense.price;
    if (validPrintSize !== null && artwork.printSizes?.[validPrintSize]) {
      total += artwork.printSizes[validPrintSize].priceAddon;
    }
    if (validShipping !== null && artwork.shippingRates?.[validShipping]) {
      total += artwork.shippingRates[validShipping].price;
    }
    return total;
  }, [artwork, selectedLicense, validPrintSize, validShipping]);

  const purchaseLabel = !isListed
    ? "Not Listed"
    : isOwnArtwork
    ? "Your Artwork"
    : isSoldOut
    ? "Sold Out"
    : (needsShipping && selectedShipping === null)
    ? "Select Shipping"
    : (needsPrintSize && selectedPrintSize === null)
    ? "Select Print Size"
    : totalPrice !== null
    ? `Purchase · ${totalPrice} USD`
    : "Purchase";

  const art = useMemo(() => {
    if (!artwork) return null;

    // Construct R2 preview URL from key
    const previewImageUrl = `${R2_PUBLIC_URL}/${artwork.r2PreviewKey}`;

    // Build images array with preview + supplementary images
    const images = [previewImageUrl];
    if (artwork.supplementaryImages && artwork.supplementaryImages.length > 0) {
      artwork.supplementaryImages.forEach((img: { file: string; type: string; size: number; r2Key: string }) => {
        if (img.r2Key) {
          images.push(`${R2_PUBLIC_URL}/${img.r2Key}`);
        }
      });
    }

    // Default aspect ratio for preview
    const aspectRatio = 4 / 5;

    return {
      title: artwork.name,
      artist: artwork.creatorDisplayName || artwork.walletAddress.slice(0, 6) + "..." + artwork.walletAddress.slice(-4),
      walletAddress: artwork.walletAddress,
      price: `${selectedLicense?.price ?? 0} USD`,
      license: selectedLicenseType === "personal_use" ? "Personal" : selectedLicenseType === "commercial_digital" ? "Commercial" : "Limited Print",
      images: images,
      aspectRatio: aspectRatio,
      description: artwork.detailsDescription || artwork.description,
      about: `Creator: ${artwork.creatorDisplayName || artwork.walletAddress}`,
      tags: artwork.tags || [],
      created: new Date(artwork.createdAt).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
      edition: selectedLicenseType === "limited_print" && selectedLicense?.printLimit
        ? `Limited Edition: ${selectedLicense.printLimit} prints`
        : selectedLicenseType === "commercial_digital"
        ? "Unlimited Licenses"
        : "Single Edition",
      printLimit: selectedLicense?.printLimit,
      printsMinted: selectedLicense?.printsMinted,
      printsLeft: selectedLicense?.printLimit ? (selectedLicense.printLimit - (selectedLicense.printsMinted || 0)) : null,
      attributes: artwork.attributes || [],
      printSizes: artwork.printSizes || [],
      shippingRates: artwork.shippingRates || [],
      specs: [
        ...(selectedLicenseType === "limited_print" && selectedLicense?.printLimit
          ? [`Limited Edition: ${selectedLicense.printLimit} prints`] : []),
      ],
      licenseSummary: selectedLicenseType === "personal_use"
        ? "Personal use only. Physical print edition."
        : selectedLicenseType === "limited_print"
        ? "Commercial rights available. Limited physical print edition."
        : "Commercial rights available.",
      licenseTable: [
        { label: "Commercial Use", value: selectedLicenseType.includes("commercial") ? "Allowed" : "Not Allowed" },
        { label: "Distribution", value: "Not Allowed" },
        { label: "Transfer Rights", value: selectedLicenseType === "limited_print" || selectedLicenseType === "personal_use" ? "Allowed" : "Not Allowed" },
        { label: "Territory", value: "Worldwide" },
      ],
    };
  }, [artwork, selectedLicenseType, selectedLicense]);

  if (!art) {
    return (
      <main className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white">
        <Navbar variant="dark" />
        <div className="max-w-7xl mx-auto flex items-center justify-center h-96">
          <p className="text-zinc-500">Loading artwork...</p>
        </div>
        <Footer variant="dark" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white">
      {/* Global Navbar */}

      <Navbar variant="dark" />

      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row relative border-b border-black/5">
        {/* ... existing main content ... */}
        {/* Left Side: Large Image Gallery */}
        <div className="w-full lg:w-[50%] p-4 lg:p-6 flex flex-col gap-10">
          <div
            className="relative w-full bg-white overflow-hidden cursor-zoom-in select-none"
            style={{ aspectRatio: art.aspectRatio }}
            onMouseEnter={() => setIsHoveringImage(true)}
            onMouseLeave={() => setIsHoveringImage(false)}
            onClick={() => setLightboxOpen(true)}
            onContextMenu={(e) => e.preventDefault()}
            onDragStart={(e) => e.preventDefault()}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentImageIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="w-full h-full"
              >
                <Image
                  src={art.images[currentImageIndex]}
                  alt={art.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 60vw"
                  className="object-contain pointer-events-none"
                  draggable={false}
                  priority
                />
                {/* Transparent overlay blocks right-click on the img element */}
                <div className="absolute inset-0" />
              </motion.div>
            </AnimatePresence>

            {/* Interactive Arrows (Only show on hover) */}
            <AnimatePresence>
              {isHoveringImage && art.images.length > 1 && (
                <>
                  <motion.button
                    exit={{ opacity: 0 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(
                        (prev) =>
                          (prev - 1 + art.images.length) % art.images.length,
                      );
                    }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/30 backdrop-blur-xl border border-white/20 transition-all active:scale-90 animate-in fade-in duration-300"
                  >
                    <CaretLeftIcon size={24} weight="light" />
                  </motion.button>
                  <motion.button
                    exit={{ opacity: 0 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(
                        (prev) => (prev + 1) % art.images.length,
                      );
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/30 backdrop-blur-xl border border-white/20 transition-all active:scale-90 animate-in fade-in duration-300"
                  >
                    <CaretRightIcon size={24} weight="light" />
                  </motion.button>
                </>
              )}
            </AnimatePresence>

            {/* Thumbnail Carousel Overlay (Only show on hover) */}
            <AnimatePresence>
              {isHoveringImage && art.images.length > 1 && (
                <motion.div
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-3 p-2 bg-black/20 backdrop-blur-xl border border-white/10 rounded-sm overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300"
                >
                  {art.images.map((img: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentImageIndex(idx);
                      }}
                      className={`relative w-12 aspect-square shrink-0 transition-all duration-300 overflow-hidden border ${idx === currentImageIndex ? "border-white scale-110 opacity-100" : "border-white/5 opacity-50 hover:opacity-100"}`}
                    >
                      <Image
                        src={img}
                        alt={`${art.title} thumbnail ${idx}`}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Side: Back Button Top, Details Bottom */}
        <div className="w-full lg:w-[50%] px-4 lg:px-6 lg:pt-20 lg:pb-20 flex flex-col justify-between">
          {/* Top: Back Button */}
          <div className="hidden lg:flex justify-end mb-10">
            <Button variant="ghost" onClick={() => router.back()}>
              Return to Discover <ArrowLeftIcon size={16} />
            </Button>
          </div>

          {/* Bottom: Aligned with Image bottom */}
          <div className="flex flex-col gap-12 mt-auto">
            <div className="flex flex-col gap-3">
              <h1 className="text-3xl md:text-5xl font-bold tracking-tighter leading-none wrap-break-word">
                {art.title}
              </h1>
              <div className="flex justify-between items-baseline mt-4 border-b border-black/5 pb-4">
                <div>
                  <span className="font-pixel text-sm text-zinc-500 uppercase tracking-[0.4em]">
                    Price
                  </span>
                  {art.license === "Limited Print" && art.printsLeft !== null && (
                    <p className="text-xs text-green-500 mt-2">
                      {art.printsLeft} of {art.printLimit} available
                    </p>
                  )}
                </div>
                <span className="text-2xl font-medium">{art.price}</span>
              </div>
            </div>

            <div className="space-y-10">
              {art.description && (
                <section>
                  <h2 className="font-pixel text-sm text-zinc-500 uppercase tracking-[0.4em] mb-4">
                    About This Art
                  </h2>
                  <div className="text-sm leading-relaxed font-medium whitespace-pre-wrap">
                    {art.description}
                  </div>
                </section>
              )}
              
              <section>
                <h2 className="font-pixel text-sm text-zinc-500 uppercase tracking-[0.4em] mb-4">
                  Artist
                </h2>
                <Link className="text-sm font-medium" href={`/profile/${art.walletAddress}`}>{art.artist}</Link>
              </section>

              {art.attributes && art.attributes.length > 0 && (
                <section>
                  <h2 className="font-pixel text-sm text-zinc-500 uppercase tracking-[0.4em] mb-4">
                    Traits
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    {art.attributes.map((attr: { trait_type: string; value: string }, i: number) => (
                      <div
                        key={i}
                        className="text-sm border border-black/5 p-3 opacity-60"
                      >
                        <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold mb-1">
                          {attr.trait_type}
                        </p>
                        <p className="font-medium">{attr.value}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* License Selector (shown if multiple licenses available) */}
              {licenseOptions.length > 1 && (
                <section>
                  <h2 className="font-pixel text-sm text-zinc-500 uppercase tracking-[0.4em] mb-4">
                    License Type
                  </h2>
                  <div className="space-y-3">
                    {licenseOptions.map((opt, i) => {
                      const isSelected = selectedLicenseIndex === i;
                      const licenseLabel = opt.licenseType === "personal_use" ? "Personal Use (1 to 1 artwork)"
                        : opt.licenseType === "commercial_digital" ? "Commercial Digital"
                        : opt.licenseType === "limited_print" ? "Limited Edition"
                        : opt.licenseType;
                      const optSoldOut =
                        (opt.licenseType === "limited_print" &&
                          opt.printLimit !== undefined && opt.printLimit > 0 &&
                          (opt.printsMinted ?? 0) >= opt.printLimit) ||
                        (opt.licenseType === "personal_use" &&
                          (opt.printsMinted ?? 0) >= 1);

                      return (
                        <button
                          key={opt.licenseType}
                          onClick={() => setSelectedLicenseIndex(i)}
                          disabled={optSoldOut}
                          className={`w-full flex justify-between items-center text-sm border p-3 transition-all ${
                            optSoldOut
                              ? "border-zinc-200 bg-zinc-50 text-zinc-400 cursor-not-allowed"
                              : isSelected
                              ? "border-black bg-black text-white"
                              : "border-black/5 hover:border-black/20"
                          }`}
                        >
                          <div className="text-left">
                            <p className="font-bold capitalize tracking-wider">
                              {licenseLabel}
                            </p>
                            {opt.licenseType === "limited_print" && opt.printLimit && (
                              <p className="text-xs opacity-70">
                                {optSoldOut ? "Sold out" : `${opt.printLimit - (opt.printsMinted ?? 0)} of ${opt.printLimit} left`}
                              </p>
                            )}
                          </div>
                          <p className="font-medium">{opt.price} USD</p>
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}

              {art.shippingRates && art.shippingRates.length > 0 && selectedLicenseType !== "commercial_digital" && (
                <section>
                  <h2 className="font-pixel text-sm text-zinc-500 uppercase tracking-[0.4em] mb-4">
                    Shipping
                  </h2>
                  <div className="space-y-3">
                    {art.shippingRates.map((rate: { zone: string; method: string; price: number; estimatedDays: string }, i: number) => (
                      <button
                        key={i}
                        onClick={() => setSelectedShipping(i)}
                        className={`w-full flex justify-between items-center text-sm border p-3 transition-all ${
                          selectedShipping === i
                            ? "border-black bg-black text-white"
                            : "border-black/5 hover:border-black/20"
                        }`}
                      >
                        <div className="text-left">
                          <p className="font-bold capitalize tracking-wider">
                            {rate.zone.replace(/_/g, " ")}
                          </p>
                          <p className="text-xs opacity-70">{rate.estimatedDays} days</p>
                        </div>
                        <p className="font-medium">{rate.price} USD</p>
                      </button>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {art.printSizes && art.printSizes.length > 0 && selectedLicenseType === "limited_print" && (
              <section>
                <h2 className="font-pixel text-sm text-zinc-500 uppercase tracking-[0.4em] mb-4">
                  Print Size
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {art.printSizes.map((size: { label: string; widthCm: number; heightCm: number; priceAddon: number }, i: number) => (
                    <button
                      key={i}
                      onClick={() => setSelectedPrintSize(i)}
                      className={`p-3 border text-sm font-medium transition-all ${
                        selectedPrintSize === i
                          ? "border-black bg-black text-white"
                          : "border-black/5 hover:border-black/20"
                      }`}
                    >
                      <div>{size.label}</div>
                      <div className="text-xs opacity-75 mt-1">{size.widthCm}×{size.heightCm}cm</div>
                      {size.priceAddon > 0 && <div className="text-xs opacity-75">+{size.priceAddon} USD</div>}
                    </button>
                  ))}
                </div>
              </section>
            )}

            <div className="flex flex-col gap-4">
              <Button
                variant="default"
                size="main"
                disabled={purchaseDisabled}
                onClick={() => {
                  if (!isConnected) return;
                  setIsPurchaseModalOpen(true);
                }}
              >
                {purchaseLabel} <ShoppingCartSimpleIcon size={22} />
              </Button>
              {!isConnected && isListed && (
                <p className="text-xs uppercase tracking-[0.3em] text-center opacity-40">
                  Connect wallet to purchase
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="max-w-7xl mx-auto px-4 mt-10">
        <div className="flex flex-wrap md:flex-nowrap gap-8 border-b border-black/5 relative">
          {[
            "details",
            "license",
            // "what you get",
            // "proof & verification",
            // "creator",
          ].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 text-xs uppercase tracking-[0.2em] font-bold transition-all relative ${activeTab === tab ? "opacity-100" : "opacity-30 hover:opacity-60"}`}
            >
              {tab}
              {activeTab === tab && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 min-h-0.5 bg-primary"
                />
              )}
            </button>
          ))}
        </div>

        <div className="mt-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="animate-in fade-in slide-in-from-bottom-2"
            >
              {activeTab === "details" && (
                <div className="flex flex-col gap-10">
                  {art.description && (
                    <div className="max-w-3xl">
                      <h3 className="font-bold text-sm uppercase tracking-wider mb-4">
                        About This Art
                      </h3>
                      <div className="text-sm leading-relaxed opacity-60 whitespace-pre-wrap">
                        {art.description}
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="font-bold text-sm uppercase tracking-wider mb-6">
                      Tags
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {art.tags?.map((tag: string) => (
                        <span
                          key={tag}
                          className="px-4 py-2 bg-zinc-50 border border-black/5 rounded-full text-xs uppercase tracking-wider font-medium opacity-60"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pt-8 border-t border-black/5">
                    <div className="flex flex-col gap-2">
                      <span className="text-xs uppercase tracking-widest opacity-40">
                        Created
                      </span>
                      <span className="text-sm font-bold tracking-tight">
                        {art.created}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className="text-xs uppercase tracking-widest opacity-40">
                        Edition
                      </span>
                      <span className="text-sm font-bold tracking-tight">
                        {art.edition}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "license" && (
                <div className="flex flex-col gap-10">
                  <div className="max-w-3xl">
                    <h3 className="font-bold text-sm uppercase tracking-wider mb-4">
                      License Summary
                    </h3>
                    <p className="text-sm leading-relaxed opacity-60">
                      {art.licenseSummary}
                    </p>
                  </div>

                  <div className="flex flex-col gap-6">
                    <span className="font-mono text-xs text-blue-600 uppercase tracking-widest font-bold">
                      {art.license === "Commercial"
                        ? "COMMERCIAL DIGITAL"
                        : art.license === "Limited Print"
                        ? "LIMITED PRINT"
                        : "PERSONAL USAGE"}
                    </span>

                    <div className="border border-black/5 rounded-sm overflow-hidden bg-zinc-50/30">
                      {art.licenseTable?.map((row: { label: string; value: string }, i: number) => (
                        <div
                          key={i}
                          className={`flex border-b border-black/5 last:border-0 ${i % 2 === 0 ? "bg-white/40" : ""}`}
                        >
                          <div className="w-1/3 p-4 text-[11px] font-bold uppercase tracking-wider opacity-60 border-r border-black/5">
                            {row.label}
                          </div>
                          <div className="w-2/3 p-4 text-[11px] font-medium opacity-80">
                            {row.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "proof & verification" && (
                <div className="flex flex-col gap-8">
                  <div className="max-w-3xl">
                    <h3 className="font-bold text-sm uppercase tracking-wider mb-4">
                      Proof & Verification
                    </h3>
                    <p className="text-sm leading-relaxed opacity-60">
                      Your purchase generates a verification link to confirm
                      rights. This serves as legally valid proof of your
                      license.
                    </p>
                  </div>

                  <div className="p-10 bg-zinc-50/50 border border-black/5 rounded-sm flex items-center gap-4 group cursor-pointer hover:bg-zinc-100/50 transition-colors">
                    <div className="w-8 h-8 flex items-center justify-center border border-black/10 rounded-full opacity-40">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.823a4 4 0 015.656 0l4 4a4 4 0 01-5.656 5.656l-1.103-1.103"
                        />
                      </svg>
                    </div>
                    <span className="font-mono text-xs opacity-30 tracking-widest group-hover:opacity-60 transition-opacity">
                      artlicense.io/verify/abc123xyz...
                    </span>
                  </div>
                </div>
              )}

              {/* Placeholders for other tabs */}
              {["what you get", "creator"].includes(activeTab) && (
                <div className="py-20 flex flex-col items-center justify-center opacity-20 border border-dashed border-black/10">
                  <span className="text-xs uppercase font-pixel tracking-[0.5em]">
                    {activeTab} section content coming soon
                  </span>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <Footer variant="dark" />

      <AnimatePresence>
        {lightboxOpen && (
          <ImageLightbox
            images={art.images}
            currentIndex={currentImageIndex}
            title={art.title}
            onClose={handleLightboxClose}
            onIndexChange={setCurrentImageIndex}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isPurchaseModalOpen && artwork && selectedLicense && (
          <PurchaseModal
            artwork={artwork}
            selectedLicenseType={selectedLicenseType}
            selectedPrintSizeIndex={validPrintSize}
            selectedShippingIndex={validShipping}
            onClose={() => setIsPurchaseModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
