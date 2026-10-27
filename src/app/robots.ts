import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

/**
 * Served at /robots.txt.
 *
 * The API routes are POST-only endpoints with nothing to index, and the legal
 * pages are marked noindex in their own metadata — crawlers may still follow
 * links into them, which is what the law requires (reachable), without them
 * competing with the service pages in search results.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
