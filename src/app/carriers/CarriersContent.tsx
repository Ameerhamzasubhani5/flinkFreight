"use client";

import Link from "next/link";
import { Check } from "lucide-react";

import { useApp } from "@/contexts/AppContext";
import PageHero from "@/components/PageHero";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Reveal from "@/components/motion/Reveal";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import HoverLift from "@/components/motion/HoverLift";
import SectionHeading from "@/components/shared/SectionHeading";
import CTASection from "@/components/shared/CTASection";

export default function CarriersContent() {
  const { t } = useApp();
  const ca = t.carriers;
  const ci = t.carriersIntro;

  return (
    <>
      <PageHero
        title={ca.heroTitle}
        subtitle={ca.heroSubtitle}
      />

      <section className="section">
        <div className="container grid items-center gap-12 lg:grid-cols-2">
          <Reveal direction="right">
            <p className="eyebrow">{ca.partnershipEyebrow}</p>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">{ci.title}</h2>
            <p className="mt-5 text-muted-foreground">{ci.body}</p>
            <Button asChild className="mt-8">
              <Link href="/career">{ca.becomeCta}</Link>
            </Button>
          </Reveal>
          <Stagger className="grid gap-5 sm:grid-cols-2">
            {ci.benefits.map((b) => (
              <StaggerItem key={b.title} className="h-full">
                <HoverLift className="h-full">
                  <Card className="h-full">
                    <CardContent className="p-6">
                      <span className="grid h-11 w-11 place-items-center rounded-lg bg-primary/10 text-primary">
                        <Check className="h-6 w-6" />
                      </span>
                      <h3 className="mt-4 text-lg font-bold text-primary">{b.title}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">{b.text}</p>
                    </CardContent>
                  </Card>
                </HoverLift>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <section className="section bg-secondary/40">
        <div className="container">
          <SectionHeading eyebrow={ca.stepsEyebrow} title={ca.stepsTitle} />
          <Stagger className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {ca.steps.map((s) => (
              <StaggerItem key={s.n}>
                <Card className="h-full">
                  <CardContent className="p-7">
                    <p className="text-4xl font-extrabold text-accent">{s.n}</p>
                    <h3 className="mt-3 text-lg font-bold text-primary">{s.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <CTASection
        title={ca.ctaTitle}
        text={ca.ctaText}
        buttonLabel={ca.ctaButton}
        buttonHref="/career"
      />
    </>
  );
}
