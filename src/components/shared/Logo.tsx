"use client";

import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Variant = "full" | "icon";

/**
 * Logo — uses the official Flink Freight PNGs.
 * Two variants:
 *   variant="full" — complete wordmark, shown at rest (top of page / hero)
 *   variant="icon" — FF monogram only, shown once the page is scrolled
 * Each variant ships a dark-on-light pair and a light-on-dark pair.
 * `tone="dark"` (default) auto-switches between them via the `.dark` class;
 * `tone="light"` forces the light-on-dark pair (e.g. the footer, which is
 * always a dark surface regardless of theme).
 */
const ASSETS: Record<Variant, { dark: string; light: string; w: number; h: number }> = {
  full: { dark: "/logo-full.png", light: "/logo-full-light.png", w: 2200, h: 762 },
  icon: { dark: "/logo-icon.png", light: "/logo-icon-light.png", w: 800, h: 800 },
};

export default function Logo({
  tone = "dark",
  variant = "full",
  className,
}: {
  tone?: "dark" | "light";
  variant?: Variant;
  className?: string;
}) {
  const { dark, light, w, h } = ASSETS[variant];

  return (
    <Link href="/" className={cn("inline-flex items-center", className)}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={variant}
          layout
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.85 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="inline-flex items-center"
        >
          {tone === "light" ? (
            <Image
              src={light}
              alt="Flink Freight Logistics"
              width={w}
              height={h}
              priority
              className="h-12 w-auto object-contain"
            />
          ) : (
            <>
              {/* Dark elements — shown on light backgrounds */}
              <Image
                src={dark}
                alt="Flink Freight Logistics"
                width={w}
                height={h}
                priority
                className="block h-12 w-auto object-contain dark:hidden"
              />
              {/* Light elements — shown on dark backgrounds */}
              <Image
                src={light}
                alt="Flink Freight Logistics"
                width={w}
                height={h}
                priority
                className="hidden h-12 w-auto object-contain dark:block"
              />
            </>
          )}
        </motion.span>
      </AnimatePresence>
    </Link>
  );
}
