"use client";

import { motion } from "framer-motion";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import Link from "next/link";

const viewport = { once: true, margin: "-50px" };

export default function CTASection() {
  const { setVisible: openWalletModal } = useWalletModal();

  return (
    <section className="relative w-full bg-gradient-custom text-white py-32 md:py-48 overflow-hidden">
      {/* Decorative overlay for contrast */}
      <div className="absolute inset-0 bg-black/5" />

      <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-12 text-center">
        {/* Eyebrow */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-lg font-pixel text-primary mb-8"
        >
          Join Us
        </motion.p>

        {/* Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-2xl md:text-4xl leading-tight tracking-tight mb-8"
        >
          Be among the first to experience a more trusted way to discover and collect art.
        </motion.h2>

        {/* Supporting text */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-white/80 text-base md:text-xl max-w-2xl mx-auto mb-16 leading-relaxed"
        >
          Join early to explore a marketplace built to protect art, clarify
          rights, and help emerging artists reach the right audience.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6"
        >
          {/* Primary CTA */}
          <Link
            href="/discover"
            className="group flex items-center justify-center gap-3 bg-white text-black px-4 py-2 font-medium text-sm font-pixel hover:bg-primary transition-colors cursor-pointer w-full sm:w-auto"
          >
            Discover Art
            <ArrowRightIcon
              className="text-primary group-hover:text-white w-4 h-4"
              weight="bold"
            />
          </Link>

          {/* Secondary CTA */}
          <button
            onClick={() => openWalletModal(true)}
            className="group border border-primary text-white px-4 py-2 font-medium text-sm font-pixel hover:bg-primary/10 hover:border-white transition-all w-full sm:w-auto backdrop-blur-sm cursor-pointer"
          >
            Apply As An Artist
          </button>
        </motion.div>
      </div>
    </section>
  );
}
