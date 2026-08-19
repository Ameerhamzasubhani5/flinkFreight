"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Sun, Moon, Languages } from "lucide-react";
import { motion } from "framer-motion";

import { navLinks } from "@/lib/site";
import { cn } from "@/lib/utils";
import { useApp } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import Logo from "@/components/shared/Logo";

const NAV_KEYS = ["home", "aboutUs", "services", "carriers", "career", "contact"] as const;

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { t, locale, setLocale, theme, setTheme } = useApp();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const localizedLabel = (key: (typeof NAV_KEYS)[number]) => t.nav[key];

  const navItems = navLinks.map((link, i) => ({
    ...link,
    label: localizedLabel(NAV_KEYS[i]),
  }));

  function toggleTheme() {
    setTheme(theme === "light" ? "dark" : "light");
  }

  function toggleLocale() {
    setLocale(locale === "de" ? "en" : "de");
  }

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={cn(
        "sticky top-0 z-50 border-b transition-colors",
        scrolled
          ? "border-border bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/80"
          : "border-transparent bg-background"
      )}
    >
      <div className="container flex h-20 items-center justify-between">
        <Logo variant={scrolled ? "icon" : "full"} />

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {navItems.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "relative text-sm font-semibold transition-colors hover:text-primary",
                isActive(link.href) ? "text-primary" : "text-muted-foreground"
              )}
            >
              {link.label}
              {isActive(link.href) && (
                <motion.span
                  layoutId="nav-underline"
                  className="absolute -bottom-1.5 left-0 h-0.5 w-full rounded-full bg-accent"
                />
              )}
            </Link>
          ))}

          {/* Controls */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label={t.theme.toggle}
              className="h-9 w-9"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLocale}
              aria-label={t.language.toggle}
              className="h-9 px-2 text-xs font-bold tracking-wider"
            >
              <Languages className="mr-1.5 h-4 w-4" />
              {locale === "de" ? "EN" : "DE"}
            </Button>
          </div>

          <Button asChild variant="accent" size="sm">
            <Link href="/contact">{t.nav.getQuote}</Link>
          </Button>
        </nav>

        {/* Mobile controls + hamburger */}
        <div className="flex items-center gap-1 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={t.theme.toggle}
            className="h-9 w-9"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLocale}
            aria-label={t.language.toggle}
            className="h-9 px-2 text-xs font-bold tracking-wider"
          >
            {locale === "de" ? "EN" : "DE"}
          </Button>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={t.nav.openMenu}>
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <div className="mt-2">
                <Logo />
              </div>
              <nav className="mt-8 flex flex-col gap-1">
                {navItems.map((link) => (
                  <SheetClose asChild key={link.href}>
                    <Link
                      href={link.href}
                      className={cn(
                        "rounded-md px-3 py-2.5 text-sm font-semibold transition-colors hover:bg-secondary",
                        isActive(link.href)
                          ? "bg-secondary text-primary"
                          : "text-muted-foreground"
                      )}
                    >
                      {link.label}
                    </Link>
                  </SheetClose>
                ))}
                <SheetClose asChild>
                  <Button asChild variant="accent" className="mt-4">
                    <Link href="/contact">{t.nav.getQuote}</Link>
                  </Button>
                </SheetClose>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.header>
  );
}
