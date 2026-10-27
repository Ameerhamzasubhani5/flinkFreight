"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { translations, type Locale } from "@/lib/translations";

type Theme = "light" | "dark";

interface AppContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
  t: (typeof translations)["de"];
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("de");
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    const savedLocale = localStorage.getItem("ff-locale") as Locale | null;
    if (savedLocale === "de" || savedLocale === "en") {
      setLocaleState(savedLocale);
      // Keep <html lang> honest — the server renders "de" (the default), so
      // a visitor restored to English needs the attribute corrected or screen
      // readers announce English copy with German pronunciation.
      document.documentElement.lang = savedLocale;
    }

    const savedTheme = localStorage.getItem("ff-theme") as Theme | null;
    if (savedTheme === "dark") {
      setThemeState("dark");
      document.documentElement.classList.add("dark");
    }
  }, []);

  function setLocale(l: Locale) {
    setLocaleState(l);
    localStorage.setItem("ff-locale", l);
    document.documentElement.lang = l;
  }

  function setTheme(t: Theme) {
    setThemeState(t);
    localStorage.setItem("ff-theme", t);
    if (t === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }

  return (
    <AppContext.Provider value={{ locale, setLocale, theme, setTheme, t: translations[locale] }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
