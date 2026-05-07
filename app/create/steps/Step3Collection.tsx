"use client";

import { useWatch } from "react-hook-form";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import { useFormContext } from "../MintFormProvider";
import { useWalletAddress } from "@/lib/hooks/useWalletAddress";
import { FolderSimplePlusIcon, FolderNotchIcon, ProhibitIcon, InfoIcon } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { Textarea } from "@/components/ui/textarea";

const MODES = [
    { value: "none" as const, label: "Solo Art", icon: ProhibitIcon, desc: "Keep this art standalone." },
    { value: "existing" as const, label: "Existing Collection", icon: FolderNotchIcon, desc: "Add to a collection you already have." },
    { value: "new" as const, label: "New Collection", icon: FolderSimplePlusIcon, desc: "Create a new collection for this art." },
];

export function Step3Collection() {
    const { form } = useFormContext();
    const { register, setValue, control } = form;
    const walletAddress = useWalletAddress();
    const collectionMode = useWatch({ control, name: "collectionMode" });

    // Fetch creator's collections
    const collections = useQuery(api.artworks.getCollectionsByCreator, {
        walletAddress: walletAddress || "",
    });

    return (
        <div className="space-y-12">
            <div className="space-y-4">
                <h3 className="text-2xl font-medium tracking-tight">Collection</h3>
                <p className="text-zinc-500 text-sm font-light leading-relaxed max-w-md">
                    Keep this art standalone or group it with other artworks in a collection for easier discovery.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {MODES.map((mode) => {
                    const Icon = mode.icon;
                    const isActive = collectionMode === mode.value;

                    return (
                        <button
                            key={mode.value}
                            type="button"
                            onClick={() => setValue("collectionMode", mode.value)}
                            className={`p-6 border text-left flex items-start gap-6 relative group overflow-hidden ${isActive
                                ? "border-black bg-black text-white shadow-xl shadow-black/5"
                                : "border-zinc-100 bg-zinc-50/50 hover:border-zinc-200"
                                }`}
                        >
                            <div className={`w-14 h-14 flex items-center justify-center shrink-0 ${isActive ? "bg-white/10" : "bg-black/5"
                                }`}>
                                <Icon size={28} weight="thin" />
                            </div>
                            <div className="flex-1 space-y-1">
                                <h4 className="text-base font-medium">{mode.label}</h4>
                                <p className={`text-sm font-light ${isActive ? "text-white/60" : "text-black"}`}>
                                    {mode.desc}
                                </p>
                            </div>
                            {isActive && (
                                <motion.div
                                    layoutId="modeCheck"
                                    className="absolute -right-4 -top-4 w-12 h-12 bg-white/10 rotate-45"
                                />
                            )}
                        </button>
                    );
                })}
            </div>

            {collectionMode === "new" && (
                <div
                    className="p-8 border border-zinc-100 space-y-8 bg-zinc-50/30 animate-in fade-in slide-in-from-bottom-3 duration-300"
                >
                    <div className="flex items-center gap-3 text-zinc-400">
                        <InfoIcon size={18} weight="thin" />
                        <span className="text-sm font-pixel uppercase tracking-widest leading-none">Collection Details</span>
                    </div>

                    <div className="grid grid-cols-1 gap-8">
                        <div className="space-y-3">
                            <label className="text-sm font-pixel uppercase tracking-widest text-black">Collection Name</label>
                            <Input
                                {...register("newCollection.name")}
                                placeholder="e.g. Summer Vibes, Digital Series"
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-sm font-pixel uppercase tracking-widest text-black">Description</label>
                            <Textarea
                                {...register("newCollection.description")}
                                placeholder="Tell collectors what this collection is about..."
                                className="min-h-40 leading-relaxed resize-none"
                            />
                        </div>
                    </div>
                </div>
            )}

            {collectionMode === "existing" && (
                <div
                    className="p-8 border border-zinc-100 bg-zinc-50/30 animate-in fade-in slide-in-from-bottom-3 duration-300"
                >
                    <div className="space-y-3">
                        <label className="text-sm font-pixel uppercase tracking-widest text-black">Select a Collection</label>
                        <select
                            {...register("collectionId")}
                            className="w-full h-14 mt-2 border border-zinc-100 bg-white px-6 focus:ring-1 focus:ring-black/5 outline-none cursor-pointer"
                            disabled={!collections}
                        >
                            <option value="">
                                {!collections ? "Loading collections..." : collections.length > 0 ? "Choose a collection" : "No collections found"}
                            </option>
                            {collections && collections.map((collection) => (
                                <option key={collection._id} value={collection._id}>
                                    {collection.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            )}
        </div>
    );
}
