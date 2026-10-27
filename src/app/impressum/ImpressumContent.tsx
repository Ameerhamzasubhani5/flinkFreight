"use client";

import { useApp } from "@/contexts/AppContext";
import LegalPage from "@/components/shared/LegalPage";
import { getImprint } from "@/lib/legalContent";

export default function ImpressumContent() {
  const { locale } = useApp();
  return <LegalPage doc={getImprint(locale)} />;
}
