import type { Metadata } from "next";
import ServicesContent from "./ServicesContent";

export const metadata: Metadata = {
  alternates: { canonical: "/services" },
  title: "Services",
  description:
    "Ocean freight, air freight, ground transportation, warehousing, customs and supply chain management from Flink Freight Logistics.",
};

export default function ServicesPage() {
  return <ServicesContent />;
}
