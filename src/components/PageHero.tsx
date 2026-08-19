"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export default function PageHero({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    /* Always dark regardless of site theme */
    <section className="relative overflow-hidden bg-[#0d1f3c] py-20 text-white">
      {/* Same background photo as the homepage hero, kept faint so the
          title/subtitle stay fully legible — texture, not a focal image. */}
      <Image
        src="/hero-port.jpg"
        alt=""
        fill
        priority
        className="object-cover object-center opacity-20"
        sizes="100vw"
      />

      <div className="container relative">
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-4xl font-extrabold text-white md:text-5xl"
        >
          {title}
        </motion.h1>

        {subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 max-w-2xl text-lg text-slate-200"
          >
            {subtitle}
          </motion.p>
        )}
      </div>
    </section>
  );
}
