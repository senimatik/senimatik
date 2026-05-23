"use client";

import {
    TrendUpIcon,
    TrendDownIcon,
    ArrowRightIcon,
    ActivityIcon,
    WalletIcon,
    GlobeIcon,
    UserCirclePlusIcon
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

const STATS = [
    { label: "Total Asset Supply", value: "2,481", trend: "+12.5%", positive: true, icon: ActivityIcon },
    { label: "Active Nodes", value: "842", trend: "+4.2%", positive: true, icon: GlobeIcon },
    { label: "Protocol Revenue", value: "148.5 SOL", trend: "-1.8%", positive: false, icon: WalletIcon },
    { label: "Pending Approvals", value: "24", trend: "+8", positive: true, icon: UserCirclePlusIcon },
];

const RECENT_ACTIVITY = [
    { user: "0x71C...392A", type: "Mint", asset: "Solaris #48", time: "2m ago" },
    { user: "0x92B...114F", type: "Application", asset: "Creator Rights", time: "15m ago" },
    { user: "0x44D...882E", type: "Transfer", asset: "Nebula Core", time: "1h ago" },
    { user: "0x11A...002B", type: "Mint", asset: "Void Unit #09", time: "3h ago" },
];

export default function AdminOverview() {
    return (
        <div className="space-y-12">
            <header className="space-y-4">
                <div className="flex items-center gap-3">
                    <span className="w-8 h-px bg-black/10" />
                    <span className="text-[10px] font-pixel text-zinc-400 uppercase tracking-widest leading-none">Global System State</span>
                </div>
                <h1 className="text-5xl font-medium tracking-tighter uppercase leading-none">Overview</h1>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {STATS.map((stat, idx) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={stat.label}
                            className="animate-in fade-in slide-in-from-bottom-4 duration-500 p-8 border border-zinc-100 rounded-[32px] bg-zinc-50/10 hover:border-black/5 hover:bg-zinc-50/50"
                            style={{ animationDelay: `${idx * 0.1}s`, animationFillMode: "both" }}
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className="w-10 h-10 rounded-xl bg-black/5 flex items-center justify-center">
                                    <Icon size={20} weight="thin" />
                                </div>
                                <div className={`flex items-center gap-1 text-[10px] font-pixel ${stat.positive ? "text-green-600" : "text-red-500"}`}>
                                    {stat.positive ? <TrendUpIcon size={12} /> : <TrendDownIcon size={12} />}
                                    {stat.trend}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-3xl font-medium tracking-tighter">{stat.value}</p>
                                <p className="text-[10px] font-pixel uppercase tracking-widest text-zinc-400">{stat.label}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-12">
                {/* Recent Submissions / Activity */}
                <section className="space-y-8">
                    <div className="flex justify-between items-end border-b border-zinc-100 pb-4">
                        <div className="space-y-1">
                            <h2 className="text-base font-medium">Protocol Registry Timeline</h2>
                            <p className="text-zinc-400 text-xs font-light">Real-time ledger updates.</p>
                        </div>
                        <Button variant="ghost">
                            Full Logs <ArrowRightIcon size={14} />
                        </Button>
                        {/* <button className="text-[10px] font-pixel uppercase tracking-widest hover:text-black transition-colors flex items-center gap-2">
                            Full Logs <ArrowRightIcon size={14} />
                        </button> */}
                    </div>

                    <div className="space-y-4">
                        {RECENT_ACTIVITY.map((activity, idx) => (
                            <div
                                key={idx}
                                className="animate-in fade-in slide-in-from-left-2 duration-500 flex items-center justify-between p-6 bg-zinc-50/30 border border-zinc-100 rounded-2xl group hover:border-black/5"
                                style={{ animationDelay: `${0.4 + idx * 0.1}s`, animationFillMode: "both" }}
                            >
                                <div className="flex items-center gap-6">
                                    <div className="w-10 h-10 rounded-full bg-white border border-zinc-100 flex items-center justify-center text-[10px] font-mono shadow-sm">
                                        {activity.user.slice(0, 4)}
                                    </div>
                                    <div className="space-y-0.5">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium">{activity.asset}</span>
                                            <span className="text-[10px] py-0.5 px-2 bg-black/5 rounded font-pixel uppercase tracking-widest text-zinc-500">{activity.type}</span>
                                        </div>
                                        <p className="text-xs text-zinc-400 font-mono italic">{activity.user}</p>
                                    </div>
                                </div>
                                <span className="text-[10px] font-pixel uppercase tracking-widest text-zinc-300 group-hover:text-zinc-500 transition-colors">
                                    {activity.time}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* System Efficiency */}
                <section className="p-8 border border-zinc-100 rounded-[40px] bg-zinc-50/10 space-y-8">
                    <h2 className="text-[10px] font-pixel uppercase tracking-widest text-zinc-400">Node Performance</h2>

                    <div className="space-y-12">
                        {[
                            { label: "Sync Latency", value: 98, status: "Optimal" },
                            { label: "Validation Thruput", value: 72, status: "Stable" },
                            { label: "Cache Integrity", value: 92, status: "Secure" },
                        ].map((node) => (
                            <div key={node.label} className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-sm font-medium">{node.label}</p>
                                        <p className="text-[10px] font-pixel uppercase text-zinc-400">{node.status}</p>
                                    </div>
                                    <span className="text-xl font-medium tabular-nums">{node.value}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-black"
                                        style={{
                                            "--progress-width": `${node.value}%`,
                                            width: `${node.value}%`,
                                            animation: "progress-grow 1.5s ease-out",
                                        } as React.CSSProperties}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="pt-8 border-t border-zinc-100">
                        <div className="p-4 bg-black/3 rounded-2xl flex items-center gap-4">
                            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)] animate-pulse" />
                            <span className="text-[10px] font-pixel uppercase tracking-widest">Protocol Version 2.0.4 Online</span>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
