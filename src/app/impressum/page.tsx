import type { Metadata } from "next";
import ImpressumContent from "./ImpressumContent";

export const metadata: Metadata = {
  alternates: { canonical: "/impressum" },
  title: "Impressum",
  description:
    "Anbieterkennzeichnung und Pflichtangaben gemäß § 5 DDG für Flink Freight Logistics.",
  // Required by law but of no search value, and an imprint is a favourite
  // source of addresses for scrapers — indexed pages should be the ones that
  // sell freight.
  robots: { index: false, follow: true },
};

export default function ImpressumPage() {
  return <ImpressumContent />;
}
