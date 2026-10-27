import type { Metadata } from "next";
import DatenschutzContent from "./DatenschutzContent";

export const metadata: Metadata = {
  alternates: { canonical: "/datenschutz" },
  title: "Datenschutzerklärung",
  description:
    "Wie Flink Freight Logistics personenbezogene Daten verarbeitet — Informationen nach Art. 13 DSGVO.",
  robots: { index: false, follow: true },
};

export default function DatenschutzPage() {
  return <DatenschutzContent />;
}
