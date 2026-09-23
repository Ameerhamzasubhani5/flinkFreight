/** @type {import('next').NextConfig} */

// The project builds in two shapes:
//
//   npm run build         → full Next.js app, API routes included. This is the
//                           deployment that actually handles form submissions.
//
//   npm run build:static  → plain HTML/CSS/JS in out/, for STRATO's hosting,
//                           which serves files but cannot run Node.
//
// BUILD_TARGET is set by scripts/build-static.mjs; nothing else sets it.
const isStatic = process.env.BUILD_TARGET === "static";

const nextConfig = {
  reactStrictMode: true,

  ...(isStatic
    ? {
        output: "export",

        // Next's image optimizer needs a server, so images ship as-is.
        // The source files are pre-compressed to compensate.
        images: { unoptimized: true },

        // Emit about-us/index.html rather than about-us.html. Plain static
        // hosts resolve /about-us/ to that index file natively; without this
        // a direct visit or refresh on any page but the homepage 404s.
        trailingSlash: true,
      }
    : {}),
};

export default nextConfig;
