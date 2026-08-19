"use client";

import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";

import { useApp } from "@/contexts/AppContext";
import PageHero from "@/components/PageHero";
import { Button } from "@/components/ui/button";
import Reveal from "@/components/motion/Reveal";
import Icon from "@/components/Icon";
import CTASection from "@/components/shared/CTASection";
import FaqSection from "@/components/shared/FaqSection";

export default function ServicesContent() {
  const { t } = useApp();
  const sv = t.services;

  return (
    <>
      <PageHero
        title={sv.heroTitle}
        subtitle={sv.heroSubtitle}
      />

      <section className="section">
        <div className="container space-y-16 lg:space-y-24">
          {t.servicesList.map((s, i) => {
            const reversed = i % 2 === 1;
            return (
              <div
                key={s.slug}
                id={s.slug}
                className="grid scroll-mt-24 items-center gap-10 lg:grid-cols-2"
              >
                <Reveal
                  direction={reversed ? "left" : "right"}
                  className={reversed ? "lg:order-2" : ""}
                >
                  <span className="grid h-14 w-14 place-items-center rounded-lg bg-primary text-primary-foreground">
                    <Icon name={s.icon} className="h-7 w-7" />
                  </span>
                  <h2 className="mt-5 text-3xl font-bold">{s.title}</h2>
                  <p className="mt-4 text-muted-foreground">{s.description}</p>
                  <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                    {s.highlights.map((h) => (
                      <li key={h} className="flex items-center gap-3 text-foreground">
                        <span className="grid h-6 w-6 place-items-center rounded-full bg-primary/10 text-primary">
                          <Check className="h-4 w-4" />
                        </span>
                        <span className="text-sm">{h}</span>
                      </li>
                    ))}
                  </ul>
                </Reveal>

                <Reveal
                  direction={reversed ? "right" : "left"}
                  delay={0.1}
                  className={reversed ? "lg:order-1" : ""}
                >
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-brand-light to-brand-dark p-10 text-white shadow-md">
                    <Icon name={s.icon} className="h-24 w-24 text-white/20" />
                    <p className="mt-6 text-xl font-semibold">{s.short}</p>
                    <Link
                      href="/contact"
                      className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline"
                    >
                      {sv.requestQuote}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </Reveal>
              </div>
            );
          })}
        </div>
      </section>

      <div className="bg-secondary/40">
        <FaqSection />
      </div>

      <CTASection
        title={sv.ctaTitle}
        text={sv.ctaText}
        buttonLabel={sv.ctaButton}
      />
    </>
  );
}
