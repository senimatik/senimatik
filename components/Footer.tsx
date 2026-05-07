"use client";

import Link from "next/link";

interface FooterProps {
    variant?: "light" | "dark";
}

export default function Footer({ variant = "light" }: FooterProps) {
    const textColor = variant === "light" ? "text-white" : "text-black";
    const borderColor = variant === "light" ? "border-white/10" : "border-black/5";
    const opacityClass = variant === "light" ? "opacity-40" : "opacity-30";

    return (
        <footer className={`w-full backdrop-blur-2xl py-12 px-4 lg:px-12 border-t ${borderColor} mt-20 ${textColor}`}>
            <div className="flex flex-col md:flex-row justify-between items-start gap-12">
                <div className="flex flex-col gap-6">
                    <Link href="/" className="font-pixel text-xl font-black tracking-tighter uppercase">
                        Seni<span className={opacityClass}>matik</span>
                    </Link>
                    <p className={`text-[10px] uppercase tracking-[0.2em] max-w-60 leading-relaxed ${opacityClass} font-bold`}>
                        The first verified creator licensing marketplace. Built for the era of digital ownership.
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-12 md:gap-24">
                    <div className="flex flex-col gap-4">
                        <span className={`text-[10px] uppercase tracking-[0.3em] font-bold ${opacityClass}`}>Platform</span>
                        <div className="flex flex-col gap-2">
                            <Link href="/discover" className="text-[11px] uppercase tracking-wider hover:opacity-100 transition-opacity">Discover</Link>
                            <Link href="#" className="text-[11px] uppercase tracking-wider hover:opacity-100 transition-opacity">Licensing</Link>
                            <Link href="#" className="text-[11px] uppercase tracking-wider hover:opacity-100 transition-opacity">Verification</Link>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <span className={`text-[10px] uppercase tracking-[0.3em] font-bold ${opacityClass}`}>Connect</span>
                        <div className="flex flex-col gap-2">
                            <Link href="#" className="text-[11px] uppercase tracking-wider hover:opacity-100 transition-opacity">Twitter / X</Link>
                            <Link href="#" className="text-[11px] uppercase tracking-wider hover:opacity-100 transition-opacity">Discord</Link>
                            <Link href="#" className="text-[11px] uppercase tracking-wider hover:opacity-100 transition-opacity">Instagram</Link>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 col-span-2 md:col-span-1">
                        <span className={`text-[10px] uppercase tracking-[0.3em] font-bold ${opacityClass}`}>Legal</span>
                        <div className="flex flex-col gap-2">
                            <Link href="#" className="text-[11px] uppercase tracking-wider hover:opacity-100 transition-opacity">Terms of Rights</Link>
                            <Link href="#" className="text-[11px] uppercase tracking-wider hover:opacity-100 transition-opacity">Privacy</Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className={`mt-20 pt-8 border-t ${borderColor} flex justify-between items-center`}>
                <span className="font-pixel text-[9px] uppercase tracking-widest">© 2026 Senimatik</span>
                <span className="font-pixel text-[9px] uppercase tracking-widest">v0.2.1-stable</span>
            </div>
        </footer>
    );
}
