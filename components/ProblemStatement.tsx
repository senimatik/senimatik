"use client";

import { motion } from "framer-motion";

const PROBLEMS = [
  {
    number: "01",
    title: "NO DISCOVERY",
    description:
      "Great artists struggle to reach the right collectors and get consistent visibility.",
  },
  {
    number: "02",
    title: "NO TRUST LAYER",
    description:
      "Collectors want more context, confidence, and connection before they buy.",
  },
  {
    number: "03",
    title: "IP THEFT",
    description:
      "Original work gets copied, reposted, and even used commercially without the artist's consent.",
  },
];

const viewport = { once: true, margin: "-50px" };

export default function ProblemStatement() {
  return (
    <section className="relative w-full bg-[#D4E3EC] text-neutral-900 py-32">
      <div className="w-full mx-auto px-4 lg:px-12">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="mb-20 md:mb-32 flex flex-col md:flex-row md:items-end justify-between gap-8"
        >
          <div className="max-w-5xl">
            <p className="text-lg font-pixel text-primary mb-8">
              The Problem
            </p>
            <h2 className="text-4xl md:text-5xl lg:text-7xl leading-tight tracking-tight text-black">
              Today&apos;s art platforms fail both artists and collectors.
            </h2>
          </div>
        </motion.div>

        {/* Problem Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-y-12 md:gap-x-16 border-t border-neutral-900/20 pt-16 pb-8 md:pb-32">
          {PROBLEMS.map((problem, index) => (
            <motion.div
              key={problem.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewport}
              transition={{
                duration: 0.6,
                delay: 0.1 * index,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              className={`group flex flex-col ${
                index === 1 ? "md:mt-24" : index === 2 ? "md:mt-48" : ""
              }`}
            >
              <span className="text-muted font-pixel text-lg mb-8">
                {problem.number}
              </span>

              <h3 className="text-xl md:text-2xl font-bold tracking-tight mb-4 text-primary">
                {problem.title}
              </h3>

              <p className="text-black text-base md:text-lg leading-relaxed">
                {problem.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
