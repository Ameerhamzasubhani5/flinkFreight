import type { MetadataRoute } from "next";
import { siteUrl, navLinks } from "@/lib/site";

/**
 * Served at /sitemap.xml.
 *
 * Built from navLinks so a new page added to the navigation appears here
 * automatically — a sitemap maintained by hand is a sitemap that goes stale.
 * The legal pages are left out deliberately: they are noindex, and listing a
 * noindex URL in a sitemap is a contradiction Search Console reports as an
 * error.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  // No trailing slashes: `next start` serves /about-us directly, so that is the
  // canonical form. (The old static export needed /about-us/ — if the site ever
  // goes back to a static host with trailingSlash, these have to match whatever
  // it serves, or Search Console reports our own sitemap as full of redirects.)
  return navLinks.map((link) => ({
    url: `${siteUrl}${link.href === "/" ? "" : link.href}`,
    lastModified,
    changeFrequency: link.href === "/" ? "weekly" : "monthly",
    // The homepage is the entry point; the contact page is where enquiries
    // actually come from, so it ranks above the rest of the set.
    priority: link.href === "/" ? 1 : link.href === "/contact" ? 0.9 : 0.8,
  }));
}
