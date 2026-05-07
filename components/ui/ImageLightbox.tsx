"use client";

import { useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { XIcon } from "@phosphor-icons/react";

interface ImageLightboxProps {
  images: string[];
  currentIndex: number;
  title: string;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

export function ImageLightbox({
  images,
  currentIndex,
  title,
  onClose,
  onIndexChange,
}: ImageLightboxProps) {
  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex flex-col overflow-hidden"
      onClick={onClose}
    >
      {/* Close button */}
      <div className="flex justify-end p-4 shrink-0" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
        >
          <XIcon size={24} />
        </button>
      </div>

      {/* Main image */}
      <div
        className="flex-1 relative select-none min-h-0 max-h-[calc(100vh-130px)]"
        onClick={(e) => e.stopPropagation()}
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            <Image
              src={images[currentIndex]}
              alt={title}
              fill
              sizes="100vw"
              className="object-contain pointer-events-none"
              draggable={false}
              priority
            />
            {/* Transparent overlay to block right-click on the image */}
            <div className="absolute inset-0" />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div
          className="shrink-0 flex justify-center gap-3 p-4"
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => onIndexChange(idx)}
              className={`relative w-12 aspect-square shrink-0 overflow-hidden border transition-all duration-200 ${
                idx === currentIndex
                  ? "border-white scale-110 opacity-100"
                  : "border-white/20 opacity-40 hover:opacity-80"
              }`}
            >
              <Image
                src={img}
                alt={`${title} thumbnail ${idx + 1}`}
                fill
                sizes="48px"
                className="object-cover pointer-events-none"
                draggable={false}
              />
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}
