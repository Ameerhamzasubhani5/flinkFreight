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
    line1: "Willy-Brandt-Platz 2",
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

/**
 * Public origin of the site, no trailing slash.
 *
 * Needed by three things that break silently without it: Open Graph image URLs
 * (which must be absolute, or link previews show nothing), the sitemap, and
 * canonical URLs. Set NEXT_PUBLIC_SITE_URL in the environment on the server —
 * the localhost fallback is for development only, and a production build that
 * ships it will advertise localhost to Google.
 */
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
).replace(/\/+$/, "");

/* ─────────────────────────────────────────────────────────────────────────────
 * Legal identity — used by /impressum and /datenschutz.
 *
 * A German business website must name these details (§5 DDG, formerly §5 TMG),
 * and an incomplete Impressum is itself the thing competitors and Abmahn-
 * Kanzleien send warning letters about. Every TBD below is a go-live blocker:
 * the pages render the marker verbatim so a missing value is impossible to
 * miss on the page itself.
 *
 * Fill these from the Handelsregister entry, not from memory.
 * ───────────────────────────────────────────────────────────────────────── */

/** Rendered as-is wherever a legal value has not been supplied yet. */
export const TBD = "[ NOCH EINZUTRAGEN / TO BE FILLED IN ]";

export const legal = {
  /** Full registered name including legal form, exactly as in the register. */
  registeredName: TBD, // e.g. "Flink Freight Logistics GmbH"
  /** Managing director(s) / authorised representative(s). One entry each. */
  representatives: [TBD],
  /** Registergericht — the court holding the entry, e.g. "Amtsgericht Cottbus". */
  registerCourt: TBD,
  /** Registernummer, e.g. "HRB 12345". */
  registerNumber: TBD,
  /** USt-IdNr. under §27a UStG, e.g. "DE123456789". Empty string if none issued. */
  vatId: TBD,
  /**
   * Person responsible for editorial content under §18 Abs. 2 MStV.
   * Usually the same person as the managing director.
   */
  contentResponsible: TBD,
  /**
   * Date the legal texts were last reviewed, ISO format. Shown on both pages —
   * a privacy policy with no date reads as abandoned.
   */
  lastUpdated: "2026-09-23",
  /**
   * Supervisory authority for data protection complaints. Brandenburg, to match
   * the Schönefeld registered office — change this if the seat changes.
   */
  supervisoryAuthority: {
    name: "Die Landesbeauftragte für den Datenschutz und für das Recht auf Akteneinsicht Brandenburg",
    address: "Stahnsdorfer Damm 77, 14532 Kleinmachnow",
    url: "https://www.lda.brandenburg.de",
  },
};

/** True when every legal value has been supplied — checked by `npm run check`. */
export function isLegalComplete(): boolean {
  return (
    ![
      legal.registeredName,
      legal.registerCourt,
      legal.registerNumber,
      legal.vatId,
      legal.contentResponsible,
    ].includes(TBD) && !legal.representatives.includes(TBD)
  );
}

export function getContactEmail(locale: Locale): string {
  return company.emailByLocale[locale];
}

export function getCareerEmail(locale: Locale): string {
  return company.careerEmailByLocale[locale];
}

// Order matters: Navbar and Footer zip this against NAV_KEYS to pull the
// translated label for each entry, so the two lists must stay in sync.
export const legalLinks = [
  { key: "imprint", href: "/impressum" },
  { key: "privacy", href: "/datenschutz" },
] as const;

export const navLinks = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about-us" },
  { label: "Services", href: "/services" },
  { label: "Carriers", href: "/carriers" },
  { label: "Careers", href: "/career" },
  { label: "Contact", href: "/contact" },
];
