import { company, legal, siteUrl, TBD } from "@/lib/site";

/**
 * schema.org JSON-LD describing the company.
 *
 * This is what lets Google show the business properly — name, logo, address
 * and contact point — rather than guessing from the page text. It is a server
 * component with no interactivity, so it costs nothing on the client.
 *
 * Deliberately conservative: every field here is a fact we actually hold. A
 * value still set to TBD is omitted rather than published as the placeholder
 * string, because structured data that contradicts the page is worse than no
 * structured data at all.
 */
export default function StructuredData() {
  const filled = (value: string) => (value && value !== TBD ? value : undefined);

  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    name: filled(legal.registeredName) ?? company.name,
    alternateName: company.shortName,
    url: siteUrl,
    logo: `${siteUrl}/logo-full.png`,
    image: `${siteUrl}/hero-port.jpg`,
    description: company.description,
    slogan: company.tagline,
    address: {
      "@type": "PostalAddress",
      streetAddress: company.address.line1,
      // line2 is "12529 Schönefeld, Germany" — split so the parts are correct.
      postalCode: company.address.line2.split(" ")[0],
      addressLocality: company.address.line2.replace(/^\d+\s*/, "").split(",")[0].trim(),
      addressCountry: "DE",
    },
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer service",
        email: company.emailByLocale.de,
        availableLanguage: ["German", "English"],
      },
      {
        "@type": "ContactPoint",
        contactType: "human resources",
        email: company.careerEmailByLocale.de,
        availableLanguage: ["German", "English"],
      },
    ],
    ...(filled(legal.vatId) ? { vatID: legal.vatId } : {}),
    knowsAbout: [
      "Freight forwarding",
      "Ocean freight",
      "Air freight",
      "Ground transport",
      "Warehousing",
      "Customs brokerage",
      "Supply chain management",
    ],
  };

  return (
    <script
      type="application/ld+json"
      // The object is built from our own constants, never from user input, so
      // there is nothing here that could inject markup.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
