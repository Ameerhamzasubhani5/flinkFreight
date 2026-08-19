import type { Metadata } from "next";
import CareerContent from "./CareerContent";

export const metadata: Metadata = {
  title: "Careers",
  description:
    "Join the Flink Freight Logistics team. Send us your application and resume — we're always looking for driven people to grow with us.",
};

export default function CareerPage() {
  return <CareerContent />;
}
