"use client";

import { useState, useMemo, useCallback } from "react";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Navbar from "@/components/Navbar";
import Image from "next/image";
import { MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL!;

function DiscoverContent() {
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("recent");
    const [licenseType, setLicenseType] = useState("all");
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);

    // Stable callbacks to avoid recreating on every render
    const handleSearch = useCallback((value: string) => setSearch(value), []);
    const handleLicenseChange = useCallback((value: string) => setLicenseType(value), []);
    const handleSortChange = useCallback((value: string) => setSortBy(value), []);
    const handleResetFilters = useCallback(() => {
        setSearch("");
        setLicenseType("all");
    }, []);

    // Fetch only listed (available for purchase) artworks
    const rawArtworks = useQuery(api.artworks.getByStatus, { status: "listed" });

    // Stabilize artworks reference to prevent unnecessary useMemo recalculations
    const artworks = useMemo(() => rawArtworks ?? [], [rawArtworks]);

    // Transform Convex artworks to display format
    const displayData = useMemo(() => {
        return artworks.map((artwork) => {
            // Construct R2 public URL from key
            const r2PublicUrl = `${R2_PUBLIC_URL}/${artwork.r2PreviewKey}`;

            // Get license types from license options
            const licenseTypes: string[] = artwork.licenseOptions?.map(opt => opt.licenseType) ?? [];

            // Get minimum price across all license options (for "From $X" display)
            const minPrice = artwork.licenseOptions && artwork.licenseOptions.length > 0
                ? Math.min(...artwork.licenseOptions.map(opt => opt.price))
                : 0;

            // Display license label (show primary or "Multiple" if many)
            const licenseLabel = licenseTypes.length > 1
                ? "Multiple"
                : licenseTypes[0] === "personal_use" ? "Personal"
                    : licenseTypes[0] === "commercial_digital" ? "Commercial"
                        : licenseTypes[0] === "limited_print" ? "Limited Print"
                            : "License";

            return {
                _id: artwork._id,
                title: artwork.name,
                artist: artwork.creatorDisplayName || artwork.walletAddress.slice(0, 6) + "..." + artwork.walletAddress.slice(-4),
                price: licenseTypes.length > 1 ? `From ${minPrice} USD` : `${minPrice} USD`,
                minPrice,
                licenseTypes, // array for filtering
                license: licenseLabel,
                image: r2PublicUrl,
            };
        });
    }, [artworks]);

    const filteredData = useMemo(() => {
        return [...displayData].filter((item) => {
            const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) ||
                item.artist.toLowerCase().includes(search.toLowerCase());
            // Match if ANY license type matches the filter
            const matchesLicense = licenseType === "all" || item.licenseTypes.includes(licenseType);
            return matchesSearch && matchesLicense;
        }).sort((a, b) => {
            if (sortBy === "price_low") {
                return a.minPrice - b.minPrice;
            }
            if (sortBy === "price_high") {
                return b.minPrice - a.minPrice;
            }
            return 0; // default (recent)
        });
    }, [displayData, search, licenseType, sortBy]);

    return (
        <main className="min-h-screen bg-white text-black flex flex-col relative">
            <Navbar variant="dark"/>

            <header className="px-4 lg:px-12 mt-12 mb-2 w-full mx-auto">
                <div className="flex flex-col gap-2">
                    <h1 className="text-4xl font-bold mb-1">
                        Discover
                    </h1>
                    <p className="text-base text-muted">Discover unique digital art pieces with flexible licensing options</p>
                </div>
            </header>

            {/* Masonry Grid */}
            <div className="flex-1 overflow-y-auto no-scrollbar py-8">
                {filteredData.length > 0 ? (
                    <div className="w-full mx-auto px-4 lg:px-12 columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-6">
                        <AnimatePresence mode="sync">
                            {filteredData.map((item) => (
                                <motion.div
                                    layoutId={item._id}
                                    initial={{ opacity: 0, scale: 0.96 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.96 }}
                                    transition={{
                                        opacity: { duration: 0.2, ease: "easeOut" },
                                        scale: { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] },
                                        layout: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }
                                    }}
                                    key={item._id}
                                    className="break-inside-avoid mb-6 group"
                                >
                                    <Link href={`/art/${item._id}`} className="block">
                                    <div className="relative overflow-hidden shrink-0">
                                        <Image
                                            src={item.image}
                                            alt={item.title}
                                            width={400}
                                            height={600}
                                            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                                            className="w-full h-auto"
                                        />
                                        <div className="absolute top-3 right-3 px-2 py-1 bg-primary flex items-center group-hover:opacity-100 opacity-0 transition-opacity">
                                            <span className="font-pixel text-white text-[10px] uppercase leading-none">{item.license}</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1 mt-3">
                                        <div className="flex justify-between items-start gap-2">
                                            <h3 className="text-sm line-clamp-1 flex-1">{item.title}</h3>
                                            <span className="text-primary font-bold text-sm shrink-0">{item.price}</span>
                                        </div>
                                        <p className="text-xs text-muted">{"// "}{item.artist}</p>
                                    </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                ) : (
                    <div className="h-48 flex flex-col items-center justify-center gap-4 border border-dashed mx-4 lg:mx-12">
                        <p className="font-pixel text-base text-muted uppercase tracking-widest">No results found</p>
                        <Button
                            variant="outline"
                            onClick={handleResetFilters}
                            className="text-black"
                        >Reset Filters</Button>
                    </div>
                )}
            </div>

            {/* Bottom Navigation */}
            <motion.div
                layout
                className={`fixed bottom-4 left-0 right-0 mx-auto flex items-center bg-background-2 backdrop-blur-lg border border-white/10 px-4 py-1  z-10 lg:z-50 shadow-2xl ${isSearchExpanded ? 'w-[calc(100%-2rem)] max-w-md' : 'w-fit'}`}
                transition={{ layout: { duration: 0.25, ease: [0.23, 1, 0.32, 1] } }}
            >
                {isSearchExpanded ? (
                    <div className="flex items-center gap-2 w-full">
                        <MagnifyingGlassIcon size={16} className="text-white shrink-0" />
                        <input
                            type="text"
                            placeholder="SEARCH..."
                            autoFocus
                            className="flex-1 bg-transparent outline-none text-[10px] text-white font-pixel uppercase min-w-0"
                            value={search}
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                        <button
                            onClick={() => {
                                setIsSearchExpanded(false);
                                setSearch("");
                            }}
                            className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white"
                        >
                            <XIcon size={16}/>
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 md:gap-4">
                        <button
                            onClick={() => setIsSearchExpanded(true)}
                            className="w-8 h-8 flex items-center justify-center hover:text-white/70"
                        >
                            <MagnifyingGlassIcon size={16} className="text-white" />
                        </button>

                        <div className="w-px h-6 bg-white/10" />

                        <select
                            className="bg-transparent font-pixel text-[10px]  outline-none cursor-pointer hover:text-white/70 appearance-none text-center text-white"
                            value={licenseType}
                            onChange={(e) => handleLicenseChange(e.target.value)}
                        >
                            <option value="all" className="bg-black text-white">All Licenses</option>
                            <option value="personal_use" className="bg-black text-white">Personal</option>
                            <option value="commercial_digital" className="bg-black text-white">Commercial</option>
                            <option value="limited_print" className="bg-black text-white">Limited Print</option>
                        </select>

                        <div className="w-px h-6 bg-white/10" />

                        <select
                            className="bg-transparent font-pixel text-[10px] outline-none cursor-pointer hover:text-white/70 appearance-none text-center text-white"
                            value={sortBy}
                            onChange={(e) => handleSortChange(e.target.value)}
                        >
                            <option value="recent" className="bg-black text-white">Recent</option>
                            <option value="price_low" className="bg-black text-white">Price: Low</option>
                            <option value="price_high" className="bg-black text-white">Price: High</option>
                        </select>
                    </div>
                )}
            </motion.div>
        </main>
    );
}

export default function DiscoverPage() {
    return <DiscoverContent />;
}
