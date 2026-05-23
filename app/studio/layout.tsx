"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const TABS = [
  { label: "Artworks", href: "/studio" },
  { label: "Orders", href: "/studio/orders" },
];

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <main className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white">
      <Navbar variant="dark" />

      {/* Sub-nav tabs */}
      <div className="mx-auto px-4 lg:px-12 mt-12">
        <nav className="flex gap-12 border-b border-black/5">
          {TABS.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={`pb-6 text-base uppercase font-pixel tracking-widest transition-all relative ${pathname === tab.href
                  ? "text-primary font-bold"
                  : "text-muted hover:text-primary"
                }`}
            >
              {tab.label}
              {pathname === tab.href && (
                <motion.div
                  layoutId="studioTabUnderline"
                  className="absolute bottom-0 left-0 right-0 h-px bg-white"
                />
              )}
            </Link>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="w-full mx-auto px-4 lg:px-12">
        {children}
      </div>

      <Footer variant="dark" />
    </main>
  );
}
