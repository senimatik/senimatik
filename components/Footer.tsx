"use client";

import Link from "next/link";

interface FooterProps {
  variant?: "light" | "dark";
}

export default function Footer({ variant = "light" }: FooterProps) {
  const textColor = variant === "light" ? "text-white" : "text-black";
  const borderColor =
    variant === "light" ? "border-white/10" : "border-black/5";
  // const opacityClass = variant === "light" ? "opacity-40" : "opacity-30";

  return (
    <footer
      className={`w-full backdrop-blur-2xl py-12 px-4 lg:px-12 border-t ${borderColor} ${textColor}`}
    >
      <div className="flex flex-col md:flex-row justify-between items-start gap-12">
        <div className="flex flex-col gap-6">
          <Link
            href="/"
            className="font-pixel text-xl font-black tracking-tighter uppercase"
          >
            Seni<span className="text-primary">matik</span>
          </Link>
          <p className={`text-md max-w-80 ${textColor}`}>
           An IP-first marketplace helping artists protect their work, define clear rights, and build lasting legacy.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-12 md:gap-24">
          <div className="flex flex-col gap-4">
            <span
              className={`text-xs uppercase tracking-widest font-bold text-primary`}
            >
              Platform
            </span>
            <div className="flex flex-col gap-2">
              <Link
                href="/discover"
                className="text-sm uppercase tracking-wider hover:text-primary  transition-color"
              >
                Discover
              </Link>
              <Link
                href="#"
                className="text-sm uppercase tracking-wider hover:text-primary transition-color"
              >
                Explore Artist
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <span
              className={`text-xs uppercase tracking-widest font-bold text-primary`}
            >
              Connect
            </span>
            <div className="flex flex-col gap-2">
              <Link
                href="https://x.com/senimatik_art"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm uppercase tracking-wider hover:text-primary transition-color"
              >
                Twitter
              </Link>
              {/* <Link href="#" className="text-sm uppercase tracking-wider hover:text-primary transition-color">Discord</Link>
                            <Link href="#" className="text-sm uppercase tracking-wider hover:text-primary transition-color">Instagram</Link> */}
            </div>
          </div>

          <div className="flex flex-col gap-4 col-span-2 md:col-span-1">
            <span
              className={`text-xs uppercase tracking-widest font-bold text-primary`}
            >
              Legal
            </span>
            <div className="flex flex-col gap-2">
              <Link
                href="#"
                className="text-sm uppercase tracking-wider hover:text-primary transition-color"
              >
                Terms of Rights
              </Link>
              <Link
                href="#"
                className="text-sm uppercase tracking-wider hover:text-primary transition-color"
              >
                Privacy
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`mt-20 pt-8 border-t ${borderColor} flex justify-between items-center`}
      >
        <span className="font-pixel text-xs uppercase tracking-widest">
          © 2026 Senimatik
        </span>
        {/* <span className="font-pixel text-[9px] uppercase tracking-widest">v0.2.1-stable</span> */}
      </div>
    </footer>
  );
}
