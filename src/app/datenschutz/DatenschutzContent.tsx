"use client";

import { useApp } from "@/contexts/AppContext";
import LegalPage from "@/components/shared/LegalPage";
import { getPrivacyPolicy } from "@/lib/legalContent";

export default function DatenschutzContent() {
  const { locale } = useApp();
  return <LegalPage doc={getPrivacyPolicy(locale)} />;
}
