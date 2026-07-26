"use client";

import dynamic from "next/dynamic";
import { MapPin, Mail, Phone } from "lucide-react";

import { company } from "@/lib/site";
import { useApp } from "@/contexts/AppContext";
import PageHero from "@/components/PageHero";
import { Card, CardContent } from "@/components/ui/card";
import Reveal from "@/components/motion/Reveal";
import SectionHeading from "@/components/shared/SectionHeading";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import ContactForm from "@/components/ContactForm";

// Client-only: react-simple-maps' zoom behaviour needs `document`.
const OfficeMap = dynamic(() => import("@/components/OfficeMap"), {
  ssr: false,
  loading: () => (
    <div className="aspect-[900/520] w-full animate-pulse rounded-2xl border border-border bg-[#0b1a2e]" />
  ),
});

const detailIcons = [MapPin, Mail, Phone] as const;

export default function ContactContent() {
  const { t } = useApp();
  const co = t.contact;

  const details = [
    {
      icon: detailIcons[0],
      label: co.office,
      value: (
        <>
          {company.address.line1}
          <br />
          {company.address.line2}
        </>
      ),
    },
    {
      icon: detailIcons[1],
      label: co.email,
      value: (
        <a href={`mailto:${company.email}`} className="hover:text-primary">
          {company.email}
        </a>
      ),
    },
    {
      icon: detailIcons[2],
      label: co.phone,
      value: (
        <a href={`tel:${company.phone}`} className="hover:text-primary">
          {company.phone}
        </a>
      ),
    },
  ];

  return (
    <>
      <PageHero
        title={co.heroTitle}
        subtitle={co.heroSubtitle}
        crumbs={[{ label: co.crumb, href: "/contact" }]}
      />

      <section className="section">
        <div className="container grid gap-12 lg:grid-cols-2">
          <div className="flex flex-col justify-center">
          <Reveal direction="right">
            <p className="eyebrow">{co.eyebrow}</p>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">{co.sectionTitle}</h2>
            <p className="mt-4 text-muted-foreground">{co.subtitle}</p>

            <Stagger className="mt-8 space-y-5">
              {details.map((d) => (
                <StaggerItem key={d.label}>
                  <div className="flex items-start gap-4">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                      <d.icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-semibold text-primary">{d.label}</p>
                      <p className="text-sm text-muted-foreground">{d.value}</p>
                    </div>
                  </div>
                </StaggerItem>
              ))}
              
            </Stagger>
          </Reveal>

          {/* <Reveal className="mt-12">
            <OfficeMap />
          </Reveal> */}

          </div>

          <Reveal direction="left" delay={0.1}>
            <Card>
              <CardContent className="p-8">
                <h3 className="text-xl font-bold text-primary">{co.formTitle}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{co.formNote}</p>
                <div className="mt-6">
                  <ContactForm />
                </div>
              </CardContent>
            </Card>
          </Reveal>
        </div>
      </section>

      {/* Global office map */}
      <section className="section bg-secondary/40">
        <div className="container">
          <SectionHeading
            eyebrow={co.mapEyebrow}
            title={co.mapTitle}
            description={co.mapSubtitle}
          />
          <Reveal className="mt-12">
            <OfficeMap />
          </Reveal>
        </div>
      </section>
    </>
  );
}
