import type { Metadata } from "next";
import AboutContent from "./AboutContent";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about Flink Freight Logistics — a full-service logistics company with over 20 years of experience moving freight across the globe.",
};

export default function AboutPage() {
  return <AboutContent />;
}
