"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useConvexAuth } from "convex/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { SpinnerIcon } from "@phosphor-icons/react";
import {
    ChartPieSliceIcon,
    UsersIcon,
    FileTextIcon,
    CaretLeftIcon,
    ShieldCheckIcon,
    ListIcon,
    XIcon
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

const ADMIN_NAV = [
    { title: "Overview", href: "/admin", icon: ChartPieSliceIcon },
    { title: "Users", href: "/admin/users", icon: UsersIcon },
    { title: "Applications", href: "/admin/applications", icon: FileTextIcon },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { isLoading, isAuthenticated } = useConvexAuth();
    const { connecting } = useWallet();

    useEffect(() => {
        if (isLoading || connecting) return;
        if (isAuthenticated) return;

        // Hint cookie only matters if wallet is connected/connecting
        // If wallet is disconnected and auth failed, redirect regardless of hint
        router.push("/");
    }, [isLoading, isAuthenticated, connecting, router]);

    return (
        <div className="bg-white text-black font-sans selection:bg-black selection:text-white h-screen overflow-hidden">
            <div className="flex flex-col lg:flex-row h-full">

                {/* Mobile Header */}
                <header className="lg:hidden h-16 border-b border-zinc-100 flex items-center justify-between px-6 bg-white z-40 shrink-0">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-white">
                            <ShieldCheckIcon size={18} weight="thin" />
                        </div>
                        <span className="font-pixel text-[10px] tracking-widest uppercase">Admin</span>
                    </Link>
                    <Button
                        variant="menu"
                        onClick={() => setIsSidebarOpen(true)}
                    >
                        <ListIcon size={24} />
                    </Button>
                </header>

                {/* Mobile Sidebar Overlay */}
                <AnimatePresence>
                    {isSidebarOpen && (
                        <>
                            <motion.div
                                exit={{ opacity: 0 }}
                                onClick={() => setIsSidebarOpen(false)}
                                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 lg:hidden animate-in fade-in duration-300"
                            />
                            <motion.aside
                                initial={{ x: "-100%" }}
                                animate={{ x: 0 }}
                                exit={{ x: "-100%" }}
                                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                className="fixed left-0 top-0 bottom-0 w-72 bg-white z-60 p-8 flex flex-col gap-12 lg:hidden shadow-2xl"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-white">
                                            <ShieldCheckIcon size={20} weight="thin" />
                                        </div>
                                        <span className="font-pixel text-xs tracking-widest uppercase">Senimatik_Admin</span>
                                    </div>
                                    <Button 
                                    variant="menu"
                                    onClick={() => setIsSidebarOpen(false)}>
                                        <XIcon size={24} />
                                    </Button>
                                </div>

                                <nav className="flex-1 space-y-2">
                                    {ADMIN_NAV.map((item) => {
                                        const Icon = item.icon;
                                        const isActive = pathname === item.href;

                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                onClick={() => setIsSidebarOpen(false)}
                                                className={`flex items-center gap-4 py-3.5 px-4 transition-all duration-300 relative group ${isActive
                                                    ? "bg-black text-white shadow-xl shadow-black/10"
                                                    : "text-zinc-400 hover:text-black hover:bg-zinc-100"
                                                    }`}
                                            >
                                                <Icon size={20} weight={isActive ? "bold" : "thin"} />
                                                <span className={`text-[11px] uppercase tracking-widest font-pixel ${isActive ? "opacity-100" : "opacity-60 group-hover:opacity-100"
                                                    }`}>
                                                    {item.title}
                                                </span>
                                            </Link>
                                        );
                                    })}
                                </nav>

                                <div className="mt-auto pt-8 border-t border-zinc-100">
                                    <Link
                                        href="/"
                                        className="flex items-center gap-3 text-zinc-400 hover:text-black transition-colors"
                                    >
                                        <CaretLeftIcon size={16} />
                                        <span className="text-[10px] font-pixel uppercase tracking-widest">Exit Portal</span>
                                    </Link>
                                </div>
                            </motion.aside>
                        </>
                    )}
                </AnimatePresence>

                {/* Desktop Sidebar */}
                <aside className="hidden lg:flex w-74 border-r border-zinc-100 flex-col p-8 gap-12 bg-zinc-50/30 shrink-0 h-full">
                    <div className="space-y-4">
                        <Link href="/" className="flex items-center gap-2 group">
                            <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-white group-hover:scale-105 transition-transform">
                                <ShieldCheckIcon size={20} weight="thin" />
                            </div>
                            <span className="font-pixel text-xs tracking-widest uppercase">Senimatik_Admin</span>
                        </Link>
                    </div>

                    <nav className="flex-1 space-y-2">
                        {ADMIN_NAV.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-4 py-3 px-4 transition-all duration-300 relative group ${isActive
                                        ? "bg-black text-white shadow-xl shadow-black/10"
                                        : "text-zinc-400 hover:text-black hover:bg-zinc-100"
                                        }`}
                                >
                                    <Icon size={20} weight={isActive ? "bold" : "thin"} />
                                    <span className={`text-[11px] uppercase tracking-widest font-pixel ${isActive ? "opacity-100" : "opacity-60 group-hover:opacity-100"
                                        }`}>
                                        {item.title}
                                    </span>
                                    {isActive && (
                                        <motion.div
                                            layoutId="adminNavIndicator"
                                            className="absolute -left-10 w-1.5 h-8 bg-black rounded-full"
                                        />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="mt-auto pt-8 border-t border-zinc-100">
                        <Link
                            href="/"
                            className="flex items-center gap-3 text-zinc-400 hover:text-black transition-colors"
                        >
                            <CaretLeftIcon size={16} />
                            <span className="text-[10px] font-pixel uppercase tracking-widest">Exit Portal</span>
                        </Link>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-6 md:p-12 lg:p-16 w-full overflow-y-auto">
                    <div className="max-w-7xl mx-auto">
                        {isAuthenticated ? children : (
                            <div className="flex items-center justify-center h-64">
                                <SpinnerIcon size={24} className="animate-spin text-zinc-300" />
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
