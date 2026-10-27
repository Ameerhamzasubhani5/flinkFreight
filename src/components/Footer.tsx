"use client";

import Link from "next/link";
import { Mail, MapPin } from "lucide-react";
// `Phone` is unused while the phone number is disabled below — restore it
// alongside that block.

import { company, navLinks, legalLinks, getContactEmail } from "@/lib/site";
import { useApp } from "@/contexts/AppContext";
import Logo from "@/components/shared/Logo";

/* ─────────────────────────────────────────────────────────────────────────────
 * DISABLED — social media links, 2026-08-19.
 * Switched off until the company's social accounts are live (the Facebook and
 * X entries in src/lib/site.ts are still placeholder "#" links). To restore:
 * uncomment this array and the icon row below, and set the real URLs in
 * `company.social` in src/lib/site.ts.
 * ───────────────────────────────────────────────────────────────────────── */
/*
const socials = [
  {
    label: "LinkedIn",
    href: company.social.linkedin,
    path: "M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z",
  },
  {
    label: "Facebook",
    href: company.social.facebook,
    path: "M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z",
  },
  {
    label: "X",
    href: company.social.twitter,
    path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817-5.966 6.817h-3.31l7.73-8.835-8.156-10.665h6.83l4.713 6.231 5.45-6.231zm-1.161 17.52h1.833l-11.832-15.66h-1.967l11.966 15.66z",
  },
];
*/

const NAV_KEYS = ["home", "aboutUs", "services", "carriers", "career", "contact"] as const;

export default function Footer() {
  const { t, locale } = useApp();
  const contactEmail = getContactEmail(locale);

  const localizedNavLinks = navLinks.map((link, i) => ({
    ...link,
    label: t.nav[NAV_KEYS[i]],
  }));

  return (
    <footer className="bg-brand-dark text-slate-300">
      <div className="container grid gap-10 py-16 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo tone="light" />
          <p className="mt-4 text-sm leading-relaxed text-slate-400">
            {t.footer.tagline
              .replace("{tagline}", company.tagline)
              .replace("{years}", String(company.yearsExperience))}
          </p>
          {/* DISABLED — social icons, see the `socials` note at the top of this file.
          <div className="mt-5 flex gap-3">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                aria-label={s.label}
                target="_blank"
                rel="noreferrer"
                className="grid h-9 w-9 place-items-center rounded-md bg-white/10 text-white transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path d={s.path} />
                </svg>
              </a>
            ))}
          </div>
          */}
        </div>

        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-white">
            {t.footer.quickLinks}
          </h4>
          <ul className="mt-4 space-y-2 text-sm">
            {localizedNavLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="inline-block py-1 hover:text-accent">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-white">
            {t.footer.services}
          </h4>
          <ul className="mt-4 space-y-2 text-sm">
            {t.servicesList.slice(0, 5).map((s) => (
              <li key={s.slug}>
                <Link href={`/services#${s.slug}`} className="inline-block py-1 hover:text-accent">
                  {s.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-white">
            {t.footer.getInTouch}
          </h4>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
              <span>
                {company.address.line1}
                <br />
                {company.address.line2}
              </span>
            </li>
            <li className="flex items-center gap-3">
              <Mail className="h-5 w-5 shrink-0 text-accent" />
              <a href={`mailto:${contactEmail}`} className="hover:text-accent">
                {contactEmail}
              </a>
            </li>
            {/* DISABLED — phone number, 2026-08-22: no confirmed number yet.
                Restore alongside company.phone in src/lib/site.ts.
            <li className="flex items-center gap-3">
              <Phone className="h-5 w-5 shrink-0 text-accent" />
              <a href={`tel:${company.phone}`} className="hover:text-accent">
                {company.phone}
              </a>
            </li>
            */}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        {/* Imprint and privacy have to be reachable from every page of a German
            business site, in no more than two clicks and under a label a
            visitor recognises — hence the fixed wording, not a creative one. */}
        <div className="container flex flex-col items-center justify-between gap-3 py-6 text-xs text-slate-400 sm:flex-row">
          <p>
            {t.footer.copyright
              .replace("{year}", String(new Date().getFullYear()))
              .replace("{name}", company.name)}
          </p>
          <nav className="flex items-center gap-5">
            {legalLinks.map((link) => (
              <Link key={link.href} href={link.href} className="inline-block py-1 hover:text-accent">
                {t.footer[link.key]}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
