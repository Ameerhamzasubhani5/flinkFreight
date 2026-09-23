import type { Locale } from "@/lib/translations";

// Locale-independent site data. Anything the visitor reads on screen lives in
// lib/translations.ts (DE + EN); this file holds only the facts that are the
// same in every language — company details and the nav structure.
//
// Contact email is the one exception: Flink Freight uses a market-specific
// address (.de for the German-language site, .eu for the English one), so it
// is keyed by locale here rather than living as a single flat string. Always
// read it through getContactEmail()/getCareerEmail() below rather than
// reaching into emailByLocale directly, so every call site stays correct.

export const company = {
  name: "Flink Freight Logistics",
  shortName: "Flink Freight",
  tagline: "Moving your world, one shipment at a time.",
  description:
    "A stable, growing company offering a full-service approach to logistics. Our mission is to provide innovative, practical and top-quality freight management and freight broker related services that give our customers a competitive advantage.",
  emailByLocale: {
    de: "info@flinkfreight.de",
    en: "info@flinkfreight.eu",
  },
  careerEmailByLocale: {
    de: "karriere@flinkfreight.de",
    en: "careers@flinkfreight.eu",
  },
  // DISABLED — 2026-08-22: no confirmed phone number yet. Kept commented out
  // rather than removed so it's a one-line restore once there is one; also
  // uncomment the phone <li>/detail block in Footer.tsx and ContactContent.tsx.
  // phone: "+1 (905) 000-0000",
  // Shown in the footer and on the contact page. The full set of offices
  // lives in src/components/OfficeMap.tsx.
  address: {
    line1: "Willy-Brand-Platz 2",
    line2: "12529 Schönefeld, Germany",
  },
  yearsExperience: 12,
  social: {
    linkedin: "#",
    facebook: "#",
    twitter: "#",
    instagram: "#",
  },
};

export function getContactEmail(locale: Locale): string {
  return company.emailByLocale[locale];
}

export function getCareerEmail(locale: Locale): string {
  return company.careerEmailByLocale[locale];
}

// Order matters: Navbar and Footer zip this against NAV_KEYS to pull the
// translated label for each entry, so the two lists must stay in sync.
export const navLinks = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about-us" },
  { label: "Services", href: "/services" },
  { label: "Carriers", href: "/carriers" },
  { label: "Careers", href: "/career" },
  { label: "Contact", href: "/contact" },
];
