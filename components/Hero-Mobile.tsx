"use client";

import { ArrowRightIcon } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
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

export default function HeroMobile() {
  const [cards, setCards] = useState(ARTWORKS);
  const [resetKeys, setResetKeys] = useState<Record<number, number>>({});

  const removeCard = () => {
    setCards((prev) => {
      const next = [...prev];
      next.push(next.shift()!);
      return next;
    });
    setResetKeys((prev) => ({
      ...prev,
      [cards[0].id]: (prev[cards[0].id] || 0) + 1,
    }));
  };

  const topCard = cards[0];

  return (
    <div className="relative w-full h-full flex flex-col md:flex-row items-center justify-center gap-8 px-4">
      <div className="mt-8 mb-8">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-4xl font-semibold text-white mb-4"
        >
          Protect art. <br /> Define rights. <br /> Build legacy.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-muted text-sm mb-6 leading-relaxed"
        >
          The IP-first art marketplace for protecting provenance, empowering
          artists, and building lasting legacy.
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

      <div className="relative w-full max-w-xs aspect-3/4">
        {cards.map((card, index) => (
          <motion.div
            key={`${card.id}-${resetKeys[card.id] || 0}`}
            className="absolute w-full h-full cursor-grab active:cursor-grabbing"
            initial={{
              scale: 1 - index * 0.04,
              y: index * 8,
              x: 0,
              rotate: index === 0 ? 0 : index % 2 === 0 ? 6 : -6,
              opacity: 1,
            }}
            animate={{
              scale: 1 - index * 0.04,
              y: index * 8,
              x: 0,
              rotate: index === 0 ? 0 : index % 2 === 0 ? 6 : -6,
              opacity: 1,
            }}
            exit={{ opacity: 0 }}
            drag={index === 0 ? "x" : false}
            dragSnapToOrigin={index === 0}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              const threshold = 100;
              if (info.offset.x > threshold || info.offset.x < -threshold) {
                removeCard();
              }
            }}
            style={{ zIndex: cards.length - index }}
          >
            <Link
              href={`/art/${card.id}`}
              className={`block w-full h-full ${index === 0 ? "pointer-events-none" : ""}`}
            >
              <div className="relative w-full h-full overflow-hidden rounded-3xl border border-white/10">
                <Image
                  src={card.url}
                  alt={card.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 320px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/30" />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Info panel — outside the card, to the right */}
      <motion.div
        key={topCard.id}
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-row md:flex-col items-center md:items-stretch gap-4 md:gap-1 min-w-35 mb-8"
      >
        <div>
          <h3 className="text-white font-semibold text-lg leading-tight">
            {topCard.title}
          </h3>
          <p className="text-muted text-sm">
            {"// "}
            {topCard.creator}
          </p>
        </div>
        {/* <Link
          href={`/art/${topCard.id}`}
          className="text-xs flex gap-2 items-center justify-start text-white/60 hover:text-white transition-colors underline underline-offset-4"
        >
          View artwork <ArrowUpRightIcon size={12} />
        </Link> */}
      </motion.div>
    </div>
  );
}
