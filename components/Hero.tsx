"use client";

import { ArrowRightIcon } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";

const ARTWORKS = [
  {
    id: 1,
    url: "https://cdn.senimatik.com/artworks/2KCcmn4pBR2ZB8MN6zhSk6uSRP1fwkHKAZuAo8zWVqtm/ff4b1132-84ae-4c91-b8d2-cb5551b665be/preview.webp",
    title: "Memori Yang Sirna",
    creator: "Deham.Rasmi",
  },
  {
    id: 2,
    url: "https://cdn.senimatik.com/artworks/CcbwBjwXvqAjYSGfTUpp2YFPcgUsXGCVRpwwjUzbfVEo/258e8319-9977-43e4-9fab-b521df492d4c/preview.webp",
    title: "Crossing Paths in Life",
    creator: "0xmuden",
  },
  {
    id: 3,
    url: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1000&auto=format&fit=crop",
    title: "Digital Horizon",
    creator: "Marcus Thorne",
  },
  {
    id: 4,
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop",
    title: "Geometric Flow",
    creator: "Sana Kim",
  },
  {
    id: 5,
    url: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1000&auto=format&fit=crop",
    title: "Binary Soul",
    creator: "Jaxson Reed",
  },
  {
    id: 6,
    url: "https://images.unsplash.com/photo-1633167606207-d840b5070fc2?q=80&w=800",
    title: "Prism Flow",
    creator: "Elena Lux",
  },
  {
    id: 7,
    url: "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=800",
    title: "Solaris",
    creator: "Vahn",
  },
  {
    id: 8,
    url: "https://images.unsplash.com/photo-1617791160505-6f00504e3519?q=80&w=800",
    title: "Void",
    creator: "Null Segment",
  },
];

export default function Hero() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hasEntered, setHasEntered] = useState(false);

  // We'll take the first 5 artworks for the hero section to match the reference
  const heroArtworks = ARTWORKS.slice(0, 5);

  return (
    <section className="relative w-full min-h-screen flex flex-col justify-between bg-gradient-custom text-white overflow-hidden pt-12 md:pt-24">
      {/* Header / Text Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end px-4 lg:px-12 w-full mb-20">
        <div className="max-w-2xl">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl lg:text-7xl 2xl:text-8xl font-semibold text-white mb-4"
          >
            Protect art. Define rights. Build legacy.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-muted text-base md:text-lg 2xl:text-2xl mb-6 leading-relaxed"
          >
            The IP-first art marketplace for protecting provenance, empowering artists, and building lasting legacy.
          </motion.p>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="group flex items-center gap-3 bg-white text-black px-4 py-2 font-medium text-sm font-pixel hover:bg-primary transition-colors cursor-pointer"
            onClick={() => {
              window.location.href = "/discover";
            }}
          >
            DISCOVER
            <ArrowRightIcon
              className="text-primary group-hover:text-white w-4 h-4"
              weight="bold"
            />
          </motion.button>
        </div>
      </div>

      {/* Card Draw Animation Images at the Bottom */}
      <div className="flex flex-row items-end h-[50vh] 2xl:h-[65vh] w-full gap-3 md:gap-2 px-4 lg:px-12 pb-0 mt-20">
        {heroArtworks.map((art, index) => {
          const isActive = hoveredIndex === index;

          return (
            <motion.div
              key={art.id}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => setHoveredIndex(isActive ? null : index)}
              layout
              initial={{ flex: 1, opacity: 0 }}
              animate={{
                flex: hoveredIndex === null ? 1 : isActive ? 1.4 : 0.85,
                opacity: 1,
              }}
              transition={{
                duration: 0.6,
                ease: [0.32, 0.72, 0, 1],
                delay: hasEntered ? 0 : index * 0.1,
              }}
              onAnimationComplete={() => {
                if (!hasEntered) setHasEntered(true);
              }}
              className="relative h-full cursor-pointer group flex flex-col justify-end"
            >
              {/* Animated inner content - moves up/down */}
              <motion.div
                initial={{ y: 100 }}
                animate={{
                  y: hoveredIndex === null ? 0 : isActive ? -60 : 0,
                }}
                transition={{
                  duration: 0.5,
                  ease: [0.32, 0.72, 0, 1],
                  delay: hasEntered ? 0 : index * 0.1,
                }}
                className="relative w-full h-full transform-gpu"
              >
                {/* Title and Artist Info Overlay (OUTSIDE, ON TOP) */}
                <motion.div
                  className="absolute bottom-full left-0 w-full mb-4 flex flex-col pointer-events-none z-10"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : 10 }}
                  transition={{ duration: 0.3, delay: isActive ? 0.1 : 0 }}
                >
                  <h3 className="text-white text-xl font-semibold tracking-tight whitespace-nowrap">
                    {art.title}
                  </h3>
                  <p className="text-muted text-sm font-medium mt-1 whitespace-nowrap">
                    {"// "}{art.creator}
                  </p>
                </motion.div>

                {/* The Image itself */}
                <div className="relative w-full h-full overflow-hidden bg-black shadow-2xl">
                  <Image
                    src={art.url}
                    alt={art.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 20vw"
                    priority
                  />

                  {/* Darkening Overlay for non-active items */}
                  <motion.div
                    className="absolute inset-0 bg-black pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{
                      opacity: hoveredIndex === null ? 0 : isActive ? 0 : 0.6,
                    }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
