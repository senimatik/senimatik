"use client";

import { useState, useMemo, useCallback } from "react";

const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL!;
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Navbar from "@/components/Navbar";
import Image from "next/image";
import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

function DiscoverContent() {
    const [cols, setCols] = useState(3);
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("recent");
    const [licenseType, setLicenseType] = useState("all");

    // Stable callbacks to avoid recreating on every render
    const handleSearch = useCallback((value: string) => setSearch(value), []);
    const handleLicenseChange = useCallback((value: string) => setLicenseType(value), []);
    const handleSortChange = useCallback((value: string) => setSortBy(value), []);
    const handleColsDecrease = useCallback(() => setCols((prev) => Math.max(3, prev - 1)), []);
    const handleColsIncrease = useCallback(() => setCols((prev) => Math.min(5, prev + 1)), []);
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
        <main className="min-h-screen bg-gradient-custom text-white font-sans selection:bg-white selection:text-black flex flex-col">
            <Navbar />

            <header className="mt-10 lg:mt-20 mb-16 flex flex-col gap-12 max-w-7xl mx-auto w-full px-4">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 lg:gap-0">
                    <div className="flex flex-col gap-3">
                        <h1 className="font-pixel text-4xl md:text-6xl uppercase tracking-tighter leading-none">
                            Explore<span className="opacity-20">Works</span>
                        </h1>
                        <p className="font-pixel text-sm opacity-30 uppercase tracking-[0.4em]">Verified Assets</p>
                    </div>

                    <div className="flex items-center gap-6 w-full md:w-auto">
                        {/* Search */}
                        <div className="relative flex-1 md:w-80 group">
                            <MagnifyingGlassIcon className="absolute left-0 top-1/2 -translate-y-1/2 opacity-20 group-focus-within:opacity-100 transition-opacity" size={16} />
                            <input
                                type="text"
                                placeholder="Search collections..."
                                className="w-full placeholder:text-white bg-transparent border-b border-white/10 pl-8 py-3 outline-none text-[10px] font-pixel placeholder:opacity-100 uppercase tracking-[0.2em] focus:border-white/40 transition-all"
                                value={search}
                                onChange={(e) => handleSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
                
                {/* Filters & Controls */}
                <div className="flex flex-wrap justify-between items-center gap-6 py-4 border-y border-white/5">
                    <div className="flex items-center gap-8">
                        {/* Sort by License */}
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-pixel opacity-40 uppercase tracking-[0.2em]">License Type</span>
                            <select
                                className="bg-transparent font-pixel text-xs uppercase outline-none cursor-pointer hover:text-accent transition-colors"
                                value={licenseType}
                                onChange={(e) => handleLicenseChange(e.target.value)}
                            >
                                <option value="all" className="bg-black text-white">All Licenses</option>
                                <option value="personal_use" className="bg-black text-white">Personal</option>
                                <option value="commercial_digital" className="bg-black text-white">Commercial</option>
                                <option value="limited_print" className="bg-black text-white">Limited Print</option>
                            </select>
                        </div>

                        {/* Sort by Price */}
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-pixel opacity-40 uppercase tracking-[0.2em]">Sort By</span>
                            <select
                                className="bg-transparent font-pixel text-xs uppercase outline-none cursor-pointer hover:text-accent transition-colors"
                                value={sortBy}
                                onChange={(e) => handleSortChange(e.target.value)}
                            >
                                <option value="recent" className="bg-black text-white">Recent</option>
                                <option value="price_low" className="bg-black text-white">Price: Low to High</option>
                                <option value="price_high" className="bg-black text-white">Price: High to Low</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-pixel opacity-40 uppercase tracking-[0.2em]">Grid Scale</span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleColsDecrease}
                                    className="w-8 h-8 flex items-center justify-center border border-white/10 hover:bg-white/10 transition-colors"
                                >-</button>
                                <span className="font-pixel text-xs min-w-4 text-center">{cols}</span>
                                <button
                                    onClick={handleColsIncrease}
                                    className="w-8 h-8 flex items-center justify-center border border-white/10 hover:bg-white/10 transition-colors"
                                >+</button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Grid Container */}
            <div className="flex-1 overflow-y-auto no-scrollbar py-8">
                <div className="max-w-7xl mx-auto">
                    <div
                        className="grid grid-cols-1 md:grid-cols-[repeat(var(--grid-cols),minmax(0,1fr))] gap-x-12 gap-y-20 px-4"
                        style={{
                            "--grid-cols": cols
                        } as React.CSSProperties}
                    >
                        <AnimatePresence mode="popLayout">
                            {filteredData.map((item, idx) => (
                                <motion.div
                                    layout
                                    key={item._id}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                                    className="flex flex-col group animate-in fade-in slide-in-from-bottom-4 duration-600"
                                    style={{ animationDelay: `${idx * 0.05}s`, animationFillMode: "both" }}
                                >
                                    <Link href={`/art/${item._id}`} className="flex flex-col">
                                        <div className="relative aspect-3/4 overflow-hidden bg-white/5 mb-4 border border-white">
                                            <Image
                                                src={item.image}
                                                alt={item.title}
                                                fill
                                                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 33vw, 25vw"
                                                className="object-cover transition-transform duration-1000 group-hover:scale-105"
                                            />
                                            <div className="absolute top-4 right-4 px-2 bg-black/40 backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="font-pixel text-sm  uppercase">{item.license}</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <div className="flex justify-between items-start">
                                                <h3 className="font-pixel text-xs md:text-lg uppercase tracking-tight line-clamp-1">{item.title}</h3>
                                                <span className="font-pixel text-white text-xs md:text-lg">{item.price}</span>
                                            </div>
                                            <p className="font-sans text-sm opacity-30 uppercase tracking-[0.2em]">{"// "} {item.artist}</p>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {filteredData.length === 0 && (
                <div className="h-64 min-w-full lg:min-w-7xl mx-auto flex flex-col items-center justify-center gap-4 border border-dashed border-white/10">
                    <p className="font-pixel text-xs opacity-40 uppercase tracking-widest">No results found</p>
                    <Button
                        variant="outline"
                        onClick={handleResetFilters}
                        className="text-black"
                    >Reset Filters</Button>
                </div>
            )}

            <Footer variant="dark" />
        </main>
    );
}

export default function DiscoverPage() {
    return <DiscoverContent />;
}
