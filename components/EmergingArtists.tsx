"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { ArrowRightIcon } from "@phosphor-icons/react";
import Link from "next/link";

const ARTISTS = [
  {
    id: "artist-1",
    name: "Elena Voss",
    handle: "@elenavoss",
    specialty: "Digital Surrealism",
    image:
      "https://images.unsplash.com/photo-1634926878768-2a5b3c42f139?q=80&w=800&auto=format&fit=crop",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop",
  },
  {
    id: "artist-2",
    name: "Marcus Chen",
    handle: "@marcuschen",
    specialty: "Generative Art",
    image:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop",
  },
  {
    id: "artist-3",
    name: "Zara Okonkwo",
    handle: "@zaraokonkwo",
    specialty: "Abstract Expressionism",
    image:
      "https://images.unsplash.com/photo-1549490349-8643362247b5?q=80&w=800&auto=format&fit=crop",
    avatar:
      "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=200&auto=format&fit=crop",
  },
  {
    id: "artist-4",
    name: "Kai Nomura",
    handle: "@kainomura",
    specialty: "Neo-Minimalism",
    image:
      "https://images.unsplash.com/photo-1633167606207-d840b5070fc2?q=80&w=800&auto=format&fit=crop",
    avatar:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=200&auto=format&fit=crop",
  },
];

const viewport = { once: true, margin: "-50px" };

export default function EmergingArtists() {
  return (
    <section className="relative w-full bg-background-2 text-white md:py-32 overflow-hidden">
      <div className="relative w-full mx-auto px-4 lg:px-12">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="mb-16 md:mb-20"
        >
          <p className="font-pixel text-lg text-primary mb-8">
            Featured Creators
          </p>
          <h2 className="text-4xl md:text-5xl lg:text-7xl leading-tight tracking-tight max-w-4xl mb-4">
            Discover the next generation of artists.
          </h2>
          <p className="text-muted text-base md:text-lg max-w-4xl">
            A curated selection of rising artists building their presence, protecting their work, and reaching new collectors through clearer rights and trusted discovery.
          </p>
        </motion.div>

        {/* Artists Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {ARTISTS.map((artist, index) => (
            <motion.div
              key={artist.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewport}
              transition={{
                duration: 0.6,
                delay: 0.1 * index,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              className="group"
            >
              {/* Image Container */}
              <div className="relative aspect-3/4 mb-4 overflow-hidden bg-white/5">
                <Image
                  src={artist.image}
                  alt={`Artwork by ${artist.name}`}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />

                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Specialty tag */}
                <div className="absolute top-3 right-3">
                  <span className="font-pixel text-[9px] tracking-wider bg-primary px-2 py-1 text-white">
                    {artist.specialty.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Artist Info */}
              <div className="flex items-center gap-3 mb-3">
                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-white/10">
                  <Image
                    src={artist.avatar}
                    alt={artist.name}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">
                    {artist.name}
                  </h3>
                  <p className="text-xs text-muted">{artist.handle}</p>
                </div>
              </div>

              {/* View Artist Button */}
              <Link
                href={`/profile/${artist.id}`}
                className="group/btn inline-flex items-center gap-2 text-sm font-medium text-white/70 hover:text-white transition-colors"
              >
                <span className="font-pixel text-xs tracking-wider">
                  VIEW ARTIST
                </span>
                <ArrowRightIcon
                  className="w-4 h-4 transition-transform group-hover/btn:translate-x-1"
                  weight="bold"
                />
              </Link>
            </motion.div>
          ))}
        </div>

        {/* View All CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16 flex justify-center"
        >
          <Link
            href="/discover"
            className="group inline-flex items-center gap-3 bg-white text-black px-6 py-3 font-pixel text-xs tracking-wider hover:bg-primary hover:text-white transition-colors"
          >
            EXPLORE ALL ARTISTS
            <ArrowRightIcon
              className="w-4 h-4 text-primary group-hover:text-white transition-colors"
              weight="bold"
            />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
