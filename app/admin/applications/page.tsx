"use client";

import {
    ClockIcon,
    ArrowRightIcon,
    SealCheckIcon,
    IdentificationCardIcon,
    ShieldCheckIcon,
    SpinnerIcon,
    MagnifyingGlassIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { usePaginatedQuery, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";

type StatusFilter = "all" | "submitted" | "in_review" | "approved" | "rejected";

const STATUS_COLORS: Record<string, string> = {
    submitted: "bg-orange-400",
    in_review: "bg-blue-400",
    approved: "bg-green-500",
    rejected: "bg-red-400",
};

const FILTER_TABS: { label: string; value: StatusFilter }[] = [
    { label: "All", value: "all" },
    { label: "Pending", value: "submitted" },
    { label: "In Review", value: "in_review" },
    { label: "Approved", value: "approved" },
    { label: "Rejected", value: "rejected" },
];

export default function AdminApplications() {
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [search, setSearch] = useState("");

    const stats = useQuery(api.applications.getStats, {});

    const { results, status, loadMore } = usePaginatedQuery(
        api.applications.listByStatus,
        { status: statusFilter === "all" ? undefined : statusFilter },
        { initialNumItems: 20 }
    );

    const filtered = search.trim()
        ? results.filter(app =>
            app.twitterHandle?.toLowerCase().includes(search.toLowerCase()) ||
            app.walletAddress.toLowerCase().includes(search.toLowerCase())
        )
        : results;

    const isLoading = status === "LoadingFirstPage";

    return (
        <div className="space-y-12">
            <header className="space-y-4">
                <div className="flex items-center gap-3">
                    <span className="w-8 h-px bg-black/10" />
                    <span className="text-[10px] font-pixel text-zinc-400 uppercase tracking-widest leading-none">Access Control</span>
                </div>
                <h1 className="text-5xl font-medium tracking-tighter uppercase leading-none">Applications</h1>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Stats */}
                <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { label: "Pending Review", value: stats ? String(stats.submitted + stats.in_review) : "—", icon: ClockIcon },
                        { label: "Approved", value: stats ? String(stats.approved) : "—", icon: SealCheckIcon },
                        { label: "Total", value: stats ? String(stats.total) : "—", icon: ShieldCheckIcon },
                    ].map((stat) => (
                        <div key={stat.label} className="p-8 border border-zinc-100 rounded-3xl bg-zinc-50/10 flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-3xl font-medium tabular-nums tracking-tighter">{stat.value}</p>
                                <p className="text-sm font-pixel uppercase tracking-widest text-zinc-400">{stat.label}</p>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-black/5 flex items-center justify-center text-black/40">
                                <stat.icon size={24} weight="thin" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filter Tabs + Search */}
                <div className="lg:col-span-3 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="flex gap-2 flex-wrap">
                        {FILTER_TABS.map(tab => (
                            <button
                                key={tab.value}
                                onClick={() => { setStatusFilter(tab.value); setSearch(""); }}
                                className={`px-4 py-2 rounded-xl font-pixel text-[10px] uppercase tracking-widest transition-colors ${statusFilter === tab.value
                                    ? "bg-black text-white"
                                    : "bg-zinc-50 text-zinc-400 hover:bg-zinc-100"
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="relative">
                        <MagnifyingGlassIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search handle or wallet..."
                            className="pl-8 pr-4 py-2 text-[11px] font-mono border border-zinc-200 rounded-xl bg-white focus:outline-none focus:border-black/20 w-64 placeholder:text-zinc-300"
                        />
                    </div>
                </div>

                {/* Queue */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="flex items-center justify-between px-4">
                        <h2 className="text-sm font-pixel uppercase tracking-widest text-zinc-400">verification queue_</h2>
                        <div className="h-px flex-1 mx-8 bg-zinc-100" />
                        <span className="text-sm font-pixel uppercase tracking-widest text-black/20">
                            {isLoading ? "Loading..." : `${filtered.length} results`}
                        </span>
                    </div>

                    {isLoading && (
                        <div className="flex items-center justify-center h-32">
                            <SpinnerIcon size={24} className="animate-spin text-zinc-300" />
                        </div>
                    )}

                    {!isLoading && filtered.length === 0 && (
                        <div className="flex items-center justify-center h-32">
                            <p className="font-pixel text-[10px] uppercase tracking-widest text-zinc-300">No applications found</p>
                        </div>
                    )}

                    <div className="space-y-4">
                        {filtered.map((app, idx) => (
                            <div
                                key={app._id}
                                className="animate-in fade-in slide-in-from-bottom-2 duration-300 group p-8 border border-zinc-100 rounded-[32px] bg-white hover:border-black/10 hover:shadow-2xl hover:shadow-black/5 flex items-center justify-between"
                                style={{ animationDelay: `${idx * 0.05}s`, animationFillMode: "both" }}
                            >
                                <div className="flex items-center gap-8">
                                    <div className="w-16 h-16 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center relative shadow-inner">
                                        <IdentificationCardIcon size={32} weight="thin" className="text-zinc-300" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-3">
                                            <span className="font-medium text-lg leading-none">{app.twitterHandle}</span>
                                            <span className="text-[10px] font-pixel uppercase tracking-widest text-zinc-400 border border-zinc-100 px-2 py-0.5 rounded leading-none">
                                                Creator Application
                                            </span>
                                        </div>
                                        <p className="text-[11px] font-mono text-zinc-400 italic">
                                            {app.walletAddress.slice(0, 6)}...{app.walletAddress.slice(-6)}
                                        </p>
                                        <div className="flex items-center gap-4 pt-2">
                                            <div className="flex items-center gap-1.5">
                                                <ClockIcon size={14} className="text-zinc-300" />
                                                <span className="text-[10px] font-pixel uppercase tracking-widest text-zinc-400">
                                                    {new Date(app.submittedAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <div className={`w-1.5 h-1.5 rounded-full ${STATUS_COLORS[app.status] ?? "bg-zinc-300"}`} />
                                                <span className="text-[10px] font-pixel tracking-widest text-zinc-400 capitalize">
                                                    {app.status.replace("_", " ")}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Link
                                    href={`/admin/applications/${app._id}`}
                                    className="px-8 py-4 bg-black text-white text-[10px] font-pixel uppercase tracking-widest rounded-2xl flex items-center gap-4 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-black/10"
                                >
                                    Review Application
                                    <ArrowRightIcon size={16} weight="bold" />
                                </Link>
                            </div>
                        ))}
                    </div>

                    {/* Load More */}
                    {status === "CanLoadMore" && !search.trim() && (
                        <div className="flex justify-center pt-4">
                            <button
                                onClick={() => loadMore(20)}
                                className="px-8 py-3 border border-zinc-200 rounded-2xl font-pixel text-[10px] uppercase tracking-widest text-zinc-400 hover:border-black/20 hover:text-black transition-colors"
                            >
                                Load More
                            </button>
                        </div>
                    )}

                    {status === "LoadingMore" && (
                        <div className="flex justify-center pt-4">
                            <SpinnerIcon size={20} className="animate-spin text-zinc-300" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
