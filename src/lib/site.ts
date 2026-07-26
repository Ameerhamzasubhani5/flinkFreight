// Central content for the FlinkFreight clone. Most of the site is static, so
// the copy lives here and is imported by the pages.

export const company = {
  name: "FlinkFreight Logistics",
  shortName: "FlinkFreight",
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

export const navLinks = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about-us" },
  { label: "Services", href: "/services" },
  { label: "Carriers", href: "/carriers" },
  { label: "Contact", href: "/contact" },
];

export type Service = {
  slug: string;
  title: string;
  short: string;
  description: string;
  icon: string;
  highlights: string[];
};

export const services: Service[] = [
    {
    slug: "ground-transportation",
    title: "Ground Transportation",
    short: "Expedited U.S.–Mexico and cross-border ground transport.",
    description:
      "We specialize in expedited freight with U.S.–Mexico ground transport, ensuring shipments arrive safely and on time. From full truckload to less-than-truckload, our network and technology keep your cargo moving.",
    icon: "truck",
    highlights: [
      "FTL & LTL nationwide",
      "U.S.–Mexico cross-border expertise",
      "Real-time tracking",
      "Dedicated & expedited options",
    ],
  },
  {
    slug: "ocean-freight",
    title: "Ocean Freight",
    short: "Reliable, cost-effective shipping across the globe.",
    description:
      "Through partnerships with leading global ocean carriers we offer reliable access to competitively priced freight capacity. Each service is customized to meet your unique shipping requirements, ensuring cost-effective, efficient solutions that keep your supply chain running seamlessly.",
    icon: "ship",
    highlights: [
      "FCL & LCL container services",
      "Competitive global carrier rates",
      "Door-to-door visibility",
      "Customs-ready documentation",
    ],
  },
  {
    slug: "air-freight",
    title: "Air Freight",
    short: "Fast, dependable air solutions for time-critical cargo.",
    description:
      "Our expertise is strategically focused on sectors such as automobiles, electronics, aerospace, medical equipment and fashion — industries that depend on fast, reliable air freight. We move time-critical shipments safely and on schedule, anywhere in the world.",
    icon: "plane",
    highlights: [
      "Expedited & next-flight-out options",
      "Temperature-sensitive handling",
      "Aerospace & medical specialists",
      "Global airport coverage",
    ],
  },
  {
    slug: "warehousing",
    title: "Warehousing & Distribution",
    short: "Strategically located warehousing and cross-docking.",
    description:
      "Strategically situated in Laredo, TX, Nuevo Laredo, Monterrey and Queretaro, our warehousing and cross-docking facilities are meticulously tailored to accommodate dynamic business needs — from short-term storage to full distribution.",
    icon: "warehouse",
    highlights: [
      "Cross-docking facilities",
      "Inventory management",
      "Pick & pack fulfilment",
      "Strategic border locations",
    ],
  },
  {
    slug: "customs-compliance",
    title: "Customs & Compliance",
    short: "In-depth customs clearance and compliance mastery.",
    description:
      "We offer customs and compliance mastery with in-depth knowledge of customs clearance and airport inspections. Our team navigates regulations on your behalf so your freight clears borders without costly delays.",
    icon: "shield",
    highlights: [
      "Customs clearance & brokerage",
      "Regulatory compliance",
      "Duty & tariff guidance",
      "Airport inspection handling",
    ],
  },
  {
    slug: "supply-chain",
    title: "Supply Chain Management",
    short: "End-to-end transportation management services.",
    description:
      "Full-service transportation management gives our customers a competitive edge by marrying cutting-edge technology, deep industry expertise and a modern approach to real-world logistics.",
    icon: "network",
    highlights: [
      "End-to-end visibility",
      "Technology-driven planning",
      "Dedicated account management",
      "Scalable, flexible capacity",
    ],
  },
];

export const stats = [
  { value: "20+", label: "Years of experience" },
  { value: "150+", label: "Global carrier partners" },
  { value: "50k+", label: "Shipments delivered" },
  { value: "98%", label: "On-time delivery" },
];

export const values = [
  {
    title: "Reliability",
    text: "We deliver on our promises with consistent, dependable service every step of the way.",
  },
  {
    title: "Innovation",
    text: "We embrace cutting-edge technology to bring modern solutions to real-world logistics.",
  },
  {
    title: "Customer Focus",
    text: "Your success is our priority. We tailor every solution to your unique needs.",
  },
  {
    title: "Integrity",
    text: "Transparent, honest and accountable in everything we do.",
  },
];

export const faqs = [
  {
    q: "What types of freight do you handle?",
    a: "We handle ocean (FCL & LCL), air, and ground freight, plus warehousing, cross-docking and customs brokerage. Whether it's a single pallet or a full container, we have a solution.",
  },
  {
    q: "Which regions do you serve?",
    a: "We operate across North America with deep expertise in U.S.–Mexico cross-border transport, and connect to global trade lanes through our network of ocean and air carrier partners.",
  },
  {
    q: "How do I get a shipping quote?",
    a: "Just head to our Contact page and send us the details of your shipment. A member of our logistics team will get back to you with a tailored quote, usually within one business day.",
  },
  {
    q: "Do you handle customs clearance?",
    a: "Yes. Our team has in-depth knowledge of customs clearance and airport inspections, and we manage the documentation and compliance so your freight clears borders without costly delays.",
  },
  {
    q: "Can I become a carrier partner?",
    a: "Absolutely. We're always growing our network of reliable carriers. Visit the Carriers page to learn about the benefits and reach out to start the onboarding process.",
  },
];

export const carriersIntro = {
  title: "Carrier Partnerships",
  body: "FlinkFreight works hand-in-hand with a vetted network of ocean, air and ground carriers across the globe. By partnering with leading carriers we secure competitively priced capacity and dependable transit times for our customers — and we are always looking to grow our network with reliable partners.",
  benefits: [
    {
      title: "Quick Pay & Fair Rates",
      text: "Competitive, transparent rates with fast, predictable payment terms.",
    },
    {
      title: "Consistent Freight",
      text: "Steady access to loads across lanes throughout North America and beyond.",
    },
    {
      title: "Dedicated Support",
      text: "A responsive carrier-relations team available whenever you need us.",
    },
    {
      title: "Modern Technology",
      text: "Digital load tracking and paperwork that keeps your operation moving.",
    },
  ],
};
