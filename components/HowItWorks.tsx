"use client";

import { motion } from "framer-motion";
import {
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  SparkleIcon,
} from "@phosphor-icons/react";

const SOLUTIONS = [
  {
    number: "01",
    icon: MagnifyingGlassIcon,
    title: "Curated Artist Discovery",
    description:
      "Help artists reach the right collectors through featured drops, smart recommendations, and curated visibility.",
  },
  {
    number: "02",
    icon: ShieldCheckIcon,
    title: "Authenticity + Smart Licensing",
    description:
      "Verify each artwork with files, drafts, and metadata, then attach clear personal, limited, or commercial rights to every sale.",
  },
  {
    number: "03",
    icon: SparkleIcon,
    title: "Collector-Centric Experience",
    description:
      "Create a Web2-friendly experience that helps collectors discover art through story, style, and meaning — not wallet jargon.",
  },
];

const viewport = { once: true, margin: "-50px" };

export default function HowItWorks() {
  return (
    <section className="relative w-full bg-background-2 text-white py-32">
      <div className="w-full mx-auto px-4 lg:px-12">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="mb-24 md:mb-32"
        >
          <p className="text-lg font-pixel text-primary mb-8">
            How It Works
          </p>
          <h2 className="text-4xl md:text-5xl lg:text-7xl leading-tight tracking-tight max-w-4xl">
            An IP-native marketplace, not just another art store.
          </h2>
        </motion.div>

        {/* Solution Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 border-y border-neutral-800">
          {SOLUTIONS.map((solution, index) => (
            <motion.div
              key={solution.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewport}
              transition={{
                duration: 0.6,
                delay: 0.1 * index,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              className={`group flex flex-col py-12 md:p-12 md:first:pl-0 md:last:pr-0 ${
                index !== 0 ? "border-t md:border-t-0 md:border-l border-neutral-800" : ""
              }`}
            >
              <div className="flex justify-between items-start mb-16">
                <solution.icon className="w-8 h-8 text-primary" weight="light" />
                <span className="text-muted text-sm font-pixel">
                  {solution.number}
                </span>
              </div>

              <h3 className="text-xl md:text-2xl font-medium tracking-wide mb-4 text-neutral-100">
                {solution.title}
              </h3>

              <p className="text-neutral-400 text-sm md:text-base leading-relaxed font-light">
                {solution.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
