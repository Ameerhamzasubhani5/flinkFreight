"use client";

import Link from "next/link";
import Image from "next/image";
import { Globe, Clock, ShieldCheck, Network, Check } from "lucide-react";

import { company } from "@/lib/site";
import { useApp } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Reveal from "@/components/motion/Reveal";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import HoverLift from "@/components/motion/HoverLift";
import StatGrid from "@/components/shared/StatGrid";
import SectionHeading from "@/components/shared/SectionHeading";
import ServiceCard from "@/components/shared/ServiceCard";
import CTASection from "@/components/shared/CTASection";
import FaqSection from "@/components/shared/FaqSection";

const featureIcons = [Globe, Clock, ShieldCheck, Network];

export default function HomePage() {
  const { t } = useApp();

  const features = t.home.features.map((f, i) => ({
    icon: featureIcons[i],
    title: f.title,
    text: f.text,
  }));

  return (
    <>
      {/* Hero — photo background, always dark regardless of site theme */}
      <section className="relative overflow-hidden bg-[#0b1a2e] text-white">
        {/* Background photo — no visible brand marks */}
        <Image
          src="/hero-port.jpg"
          alt=""
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        {/* Left-heavy dark overlay: text col stays near-opaque, image shows more on the right */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b1a2e]/95 via-[#0b1a2e]/80 to-[#0b1a2e]/55" />
        {/* Subtle bottom vignette so the section blends into the page below */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0b1a2e]/60 to-transparent" />
        {/* Fine dot grid for texture */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "36px 36px",
          }}
        />
        <div className="container relative grid items-center gap-12 py-24 lg:grid-cols-2">
          <Reveal direction="right">
            <Badge variant="accent">{t.home.heroBadge}</Badge>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight text-white md:text-5xl lg:text-6xl">
              {t.home.heroTitle}
            </h1>
            <p className="mt-6 max-w-xl text-lg text-slate-200">
              {company.description}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button asChild variant="accent" size="lg">
                <Link href="/contact">{t.home.heroCta1}</Link>
              </Button>
              <Button asChild variant="outlineLight" size="lg">
                <Link href="/services">{t.home.heroCta2}</Link>
              </Button>
            </div>
          </Reveal>
          <Reveal direction="left" delay={0.15}>
            <StatGrid stats={t.stats} variant="glass" />
          </Reveal>
        </div>
      </section>

      {/* Who we are */}
      <section className="section">
        <div className="container grid items-center gap-12 lg:grid-cols-2">
          <Reveal direction="right">
            <p className="eyebrow">{t.home.whoEyebrow}</p>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">
              {t.home.whoTitle}
            </h2>
            <p className="mt-5 text-muted-foreground">
              {t.home.whoDesc
                .replace("{years}", String(company.yearsExperience))
                .replace("{name}", company.name)}
            </p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {t.home.whoList.map((item) => (
                <li key={item} className="flex items-center gap-3 text-foreground">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-primary/10 text-primary">
                    <Check className="h-4 w-4" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <Button asChild className="mt-8">
              <Link href="/about-us">{t.home.whoCta}</Link>
            </Button>
          </Reveal>

          <Stagger className="grid gap-4 sm:grid-cols-2">
            {features.map((c) => (
              <StaggerItem key={c.title}>
                <HoverLift className="h-full">
                  <Card className="h-full">
                    <CardContent className="p-6">
                      <span className="grid h-12 w-12 place-items-center rounded-lg bg-primary/10 text-primary">
                        <c.icon className="h-6 w-6" />
                      </span>
                      <h3 className="mt-4 text-lg font-bold text-primary">
                        {c.title}
                      </h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {c.text}
                      </p>
                    </CardContent>
                  </Card>
                </HoverLift>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Services */}
      <section className="section bg-secondary/40">
        <div className="container">
          <SectionHeading
            eyebrow={t.home.servicesEyebrow}
            title={t.home.servicesTitle}
            description={t.home.servicesDesc}
          />
          <Stagger className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {t.servicesList.map((s) => (
              <StaggerItem key={s.slug} className="h-full">
                <ServiceCard service={s} />
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Values */}
      <section className="section">
        <div className="container">
          <SectionHeading
            eyebrow={t.home.valuesEyebrow}
            title={t.home.valuesTitle}
          />
          <Stagger className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {t.values.map((v) => (
              <StaggerItem key={v.title}>
                <div className="h-full rounded-xl bg-secondary/50 p-7">
                  <h3 className="text-lg font-bold text-primary">{v.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{v.text}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <FaqSection />

      <CTASection
        title={t.home.ctaTitle}
        text={t.home.ctaText}
      />
    </>
  );
}
