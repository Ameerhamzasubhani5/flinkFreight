"use client";

import Link from "next/link";
import { Globe, Network } from "lucide-react";
import Image from "next/image";
import { company } from "@/lib/site";
import { useApp } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Reveal from "@/components/motion/Reveal";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import StatGrid from "@/components/shared/StatGrid";
import SectionHeading from "@/components/shared/SectionHeading";
import CTASection from "@/components/shared/CTASection";
import PageHero from "@/components/PageHero";

const missionIcons = [Globe, Network];

export default function AboutContent() {
  const { t } = useApp();
  const ab = t.about;

  return (
    <>
      <PageHero
        title={ab.heroTitle}
        subtitle={ab.heroSubtitle}
      />

      <section className="section">
        <div className="container grid items-center gap-12 lg:grid-cols-2">
          <Reveal direction="right">
            <p className="eyebrow">{ab.storyEyebrow}</p>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">
              {ab.storyTitle.replace("{years}", String(company.yearsExperience))}
            </h2>
            <p className="mt-5 text-muted-foreground">
              {ab.storyP1
                .replace("{name}", company.name)
                .replace("{years}", String(company.yearsExperience))}
            </p>
            <p className="mt-4 text-muted-foreground">{ab.storyP2}</p>
            <Button asChild className="mt-8">
              <Link href="/contact">{ab.storyCta}</Link>
            </Button>
          </Reveal>
          <Reveal direction="left" delay={0.1}>
            <StatGrid stats={t.stats} />
          </Reveal>
        </div>
      </section>

      <section className="section bg-secondary/40">
        <div className="container grid gap-8 md:grid-cols-2">
          {ab.missionVision.map((m, i) => {
            const Icon = missionIcons[i];
            return (
              <Reveal key={m.title} delay={i * 0.1}>
                <Card className="h-full">
                  <CardContent className="p-8">
                    <span className="grid h-12 w-12 place-items-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-6 w-6" />
                    </span>
                    <h3 className="mt-4 text-2xl font-bold text-primary">{m.title}</h3>
                    <p className="mt-3 text-muted-foreground">{m.text}</p>
                  </CardContent>
                </Card>
              </Reveal>
            );
          })}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeading eyebrow={ab.valuesEyebrow} title={ab.valuesTitle} />
          <Stagger className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {t.values.map((v) => (
              <StaggerItem key={v.title}>
                <Card className="h-full">
                  <CardContent className="p-7">
                    <h3 className="text-lg font-bold text-primary">{v.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{v.text}</p>
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <CTASection
        title={ab.ctaTitle}
        text={ab.ctaText}
        buttonLabel={ab.ctaButton}
      />
    </>
  );
}
