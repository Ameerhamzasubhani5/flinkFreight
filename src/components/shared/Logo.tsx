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
const ASSETS: Record<
  Variant,
  { dark: string; light: string; w: number; h: number; sizes: string }
> = {
  // `sizes` is the width the logo actually OCCUPIES on screen, not the source
  // file's width. Without it Next sees width={2200}, multiplies by the device
  // pixel ratio, and fetches the 3840px variant — ~48KB each, twice over
  // (light + dark), for a mark that renders about 140px wide. Declaring the
  // real size brings each one down to a few KB and stops them competing with
  // the hero image for bandwidth during LCP.
  full: { dark: "/logo-full.png", light: "/logo-full-light.png", w: 2200, h: 762, sizes: "140px" },
  icon: { dark: "/logo-icon.png", light: "/logo-icon-light.png", w: 800, h: 800, sizes: "48px" },
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
  const { dark, light, w, h, sizes } = ASSETS[variant];

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
              sizes={sizes}
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
                sizes={sizes}
                priority
                className="block h-12 w-auto object-contain dark:hidden"
              />
              {/* Light elements — shown on dark backgrounds */}
              <Image
                src={light}
                alt="Flink Freight Logistics"
                width={w}
                height={h}
                sizes={sizes}
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
