import type { Metadata } from "next";
import AboutContent from "./AboutContent";
import { company } from "@/lib/site";

export const metadata: Metadata = {
  alternates: { canonical: "/about-us" },
  title: "About Us",
  description:
    `Learn about ${company.name} — a full-service logistics company with over ${company.yearsExperience} years of experience moving freight across the globe.`,
};

export default function AboutPage() {
  return <AboutContent />;
}
