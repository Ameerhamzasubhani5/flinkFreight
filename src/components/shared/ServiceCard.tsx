"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import HoverLift from "@/components/motion/HoverLift";
import Icon from "@/components/Icon";
import { useApp } from "@/contexts/AppContext";

type ServiceItem = {
  slug: string;
  icon: string;
  title: string;
  short: string;
};

export default function ServiceCard({
  service,
  href = "/services",
}: {
  service: ServiceItem;
  href?: string;
}) {
  const { t } = useApp();

  return (
    <HoverLift className="h-full">
      <Card className="group h-full transition-shadow hover:shadow-md">
        <CardContent className="p-7">
          <span className="grid h-14 w-14 place-items-center rounded-lg bg-primary text-primary-foreground transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
            <Icon name={service.icon} className="h-7 w-7" />
          </span>
          <h3 className="mt-5 text-xl font-bold text-primary">
            {service.title}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">{service.short}</p>
          <Link
            href={`${href}#${service.slug}`}
            // py-1 takes this card CTA from 20px to a 24px+ touch target.
            className="mt-4 inline-flex items-center gap-1 py-1 text-sm font-semibold text-primary transition-colors hover:text-accent"
          >
            {t.services.learnMore}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </CardContent>
      </Card>
    </HoverLift>
  );
}
