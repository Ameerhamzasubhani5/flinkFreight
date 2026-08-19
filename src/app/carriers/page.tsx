import type { Metadata } from "next";
import CarriersContent from "./CarriersContent";

export const metadata: Metadata = {
  title: "Carriers",
  description:
    "Partner with Flink Freight Logistics. Competitive rates, consistent freight, dedicated support and modern technology for our carrier network.",
};

export default function CarriersPage() {
  return <CarriersContent />;
}
