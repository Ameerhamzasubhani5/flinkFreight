/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Hides the framework version from responses — one less thing telling a
  // scanner exactly which advisories to try.
  poweredByHeader: false,

  // Security headers — served by Next.js itself now that the app runs as a
  // single Node.js process behind Nginx.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Stops the endpoints being framed into someone else's page —
          // the setup for clickjacking a form.
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          // Browsers must honour the declared Content-Type rather than
          // sniffing it, which is how an uploaded file becomes a script.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Full URL to our own pages, origin only to others, nothing
          // when leaving HTTPS.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // The site asks for none of these, so deny them outright.
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
        ],
      },
    ];
    // HSTS is handled by Nginx — see the deployment guide.
  },
};

export default nextConfig;
