import type { Metadata } from "next";
import { Inter, Barlow_Condensed, Rajdhani, Libre_Franklin } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Providers from "@/components/Providers";
import ScrollToTop from "@/components/ScrollToTop";
import { company, siteUrl } from "@/lib/site";
import StructuredData from "@/components/StructuredData";

// Body text — Inter
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

// Logo primary wordmark — closest free match to agency-gothic-ct-bold
// (To use the real font: load via Adobe Fonts kit and replace this variable)
const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-barlow-condensed",
});

// Logo subtitle — closest free match to praxis-next-medium
const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-rajdhani",
});

// Body / tagline — closest free match to itc-franklin-gothic-lt-medium
const libreFranklin = Libre_Franklin({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-libre-franklin",
});

const siteTitle = `${company.shortName} | Best Logistics & Freight Forwarding`;

export const metadata: Metadata = {
  // Without metadataBase, Next resolves Open Graph image paths against
  // localhost and every shared link renders with no preview image.
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: `%s | ${company.shortName}`,
  },
  description: company.description,
  applicationName: company.name,
  // Applies to the homepage. Every other page MUST set its own canonical in
  // its metadata — child pages inherit this one otherwise, which tells Google
  // they are all duplicates of "/" and gets them dropped from the index.
  alternates: { canonical: "/" },
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    type: "website",
    // The site serves German by default; English is the same URL with a
    // client-side switch, so there is one canonical locale to declare.
    locale: "de_DE",
    alternateLocale: ["en_GB"],
    url: siteUrl,
    siteName: company.name,
    title: siteTitle,
    description: company.description,
    images: [
      {
        url: "/hero-port.jpg",
        width: 1694,
        height: 929,
        alt: company.tagline,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: company.description,
    images: ["/hero-port.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const fontVars = [
    inter.variable,
    barlowCondensed.variable,
    rajdhani.variable,
    libreFranklin.variable,
  ].join(" ");

  return (
    <html lang="de" className={fontVars} suppressHydrationWarning>
      <head>
        {/* Apply saved theme before first paint — prevents flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('ff-theme');if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}})()`,
          }}
        />
      </head>
      <body className="flex min-h-screen flex-col font-sans">
        <StructuredData />
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <ScrollToTop />
        </Providers>
      </body>
    </html>
  );
}
