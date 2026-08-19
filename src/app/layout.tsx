import type { Metadata } from "next";
import { Inter, Barlow_Condensed, Rajdhani, Libre_Franklin } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Providers from "@/components/Providers";
import ScrollToTop from "@/components/ScrollToTop";
import { company } from "@/lib/site";

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

export const metadata: Metadata = {
  title: {
    default: `${company.shortName} | Best Logistics & Freight Forwarding`,
    template: `%s | ${company.shortName}`,
  },
  description: company.description,
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
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
