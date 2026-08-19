// Locale-independent site data. Anything the visitor reads on screen lives in
// lib/translations.ts (DE + EN); this file holds only the facts that are the
// same in every language — company details and the nav structure.

export const company = {
  name: "Flink Freight Logistics",
  shortName: "Flink Freight",
  tagline: "Moving your world, one shipment at a time.",
  description:
    "A stable, growing company offering a full-service approach to logistics. Our mission is to provide innovative, practical and top-quality freight management and freight broker related services that give our customers a competitive advantage.",
  email: "info@flinkfreight.com",
  phone: "+1 (905) 000-0000",
  address: {
    line1: "2250 Bovaird Dr. East",
    line2: "Brampton, Ontario, L6R 0W3, Canada",
  },
  yearsExperience: 20,
  social: {
    linkedin: "https://ca.linkedin.com/company/flinkfreight-logistics",
    facebook: "#",
    twitter: "#",
    instagram: "#",
  },
};

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
