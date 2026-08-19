"use client";

import { CheckCircle2 } from "lucide-react";

import { useApp } from "@/contexts/AppContext";
import PageHero from "@/components/PageHero";
import { Card, CardContent } from "@/components/ui/card";
import Reveal from "@/components/motion/Reveal";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import CareerForm from "@/components/CareerForm";

export default function CareerContent() {
  const { t } = useApp();
  const ca = t.career;

  return (
    <>
      <PageHero
        title={ca.heroTitle}
        subtitle={ca.heroSubtitle}
      />

      <section className="section">
        <div className="container grid gap-12 lg:grid-cols-2">
          <div className="flex flex-col justify-center">
            <Reveal direction="right">
              <p className="eyebrow">{ca.eyebrow}</p>
              <h2 className="mt-3 text-3xl font-bold md:text-4xl">{ca.title}</h2>
              <p className="mt-4 text-muted-foreground">{ca.body}</p>

              <Stagger className="mt-8 space-y-4">
                {ca.bullets.map((bullet) => (
                  <StaggerItem key={bullet}>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <p className="text-sm text-muted-foreground">{bullet}</p>
                    </div>
                  </StaggerItem>
                ))}
              </Stagger>
            </Reveal>
          </div>

          <Reveal direction="left" delay={0.1}>
            <Card>
              <CardContent className="p-8">
                <h3 className="text-xl font-bold text-primary">{ca.formTitle}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{ca.formNote}</p>
                <div className="mt-6">
                  <CareerForm />
                </div>
              </CardContent>
            </Card>
          </Reveal>
        </div>
      </section>
    </>
  );
}
