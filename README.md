# Flink Freight Logistics

Bilingual (German / English) marketing website for Flink Freight Logistics,
built with **Next.js 14 (App Router)**, **TypeScript** and **Tailwind CSS**.

Eight pages plus two form handlers, all served from a single Node.js process.
No database — a submission's file goes to SharePoint and the team gets an email
with a link to it, so **the inbox is the record**.

> **Deploying, configuring or handing this over?**
> Everything is in **[`DEPLOYMENT.md`](DEPLOYMENT.md)** — architecture, Microsoft
> 365 setup, the STRATO V-Server provisioning, Nginx, PM2, verification,
> handover and troubleshooting. It is the only document you need.

## Pages

| Route          | Contents                                                      |
| -------------- | ------------------------------------------------------------- |
| `/`            | Home — hero, services, why-us, values, FAQ, CTA                |
| `/about-us`    | Company story, mission, vision, values                         |
| `/services`    | Ocean, Air, Ground, Warehousing, Customs, Supply Chain         |
| `/carriers`    | Carrier partnership info & onboarding steps                    |
| `/career`      | Careers pitch + application form with CV upload                |
| `/contact`     | Contact form (dimensions, weight, photo upload) + office map   |
| `/impressum`   | Imprint — § 5 DDG. `noindex`, linked from the footer           |
| `/datenschutz` | Privacy policy — Art. 13 GDPR. `noindex`, linked from footer   |

Plus `robots.txt` and `sitemap.xml`, both generated at build time.

## Tech Stack

| Concern      | Choice                                 |
| ------------ | -------------------------------------- |
| Framework    | Next.js 14 (App Router)                |
| Language     | TypeScript                             |
| Styling      | Tailwind CSS + shadcn/ui primitives    |
| Animation    | Framer Motion                          |
| Email        | Microsoft 365 via Graph `sendMail`     |
| File storage | SharePoint via Graph                   |
| Hosting      | STRATO V-Server (Nginx + PM2 + Node.js)|

## Getting Started

```bash
npm install                  # .npmrc pins legacy-peer-deps
cp .env.local.example .env.local
# fill in the values — each is documented inline in that file
npm run check                # verify the Microsoft 365 setup
npm run dev
```

Open <http://localhost:3000>. Every page renders without any configuration —
only the two forms need credentials.

## Scripts

| Command | Does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build — pages + API routes |
| `npm run start` | Start the production server (port 3000) |
| `npm run check` | Verifies Microsoft 365 config, storage, folders, legal details |
| `npm run check -- --live` | Also uploads a real test file and sends a real email |
| `npm run lint` | ESLint |
| `node scripts/find-sharepoint.mjs` | Lists visible SharePoint sites and their exact env values |

## Architecture

```
STRATO V-Server
┌────────────────────────────────┐
│  Nginx (443) → Node.js (3000) │
│  Pages + /api/contact          │
│          + /api/career         │
└────────────┬───────────────────┘
             │
             ▼
Microsoft 365: SharePoint + sendMail
```

Everything runs on one server. Nginx handles TLS and proxies to the Next.js
process managed by PM2. `DEPLOYMENT.md` explains the full setup.

## API Routes

| Route | Body | Behaviour |
| --- | --- | --- |
| `POST /api/contact` | `multipart/form-data` | Notifies the team **and** acknowledges to the visitor. Optional photo (≤5MB, JPG/PNG/WEBP) + package L/W/H/weight. A failed photo upload does **not** block the enquiry. |
| `POST /api/career` | `multipart/form-data` | Notifies the team **and** acknowledges to the applicant. CV required (≤5MB, PDF/DOC/DOCX). A failed CV upload **does** fail the request — an application without a CV is not reviewable. |

Each submission sends **two** emails: the notification to the team (English,
Reply-To the visitor) and an acknowledgement to the person who submitted (in
their own language, Reply-To the team inbox). The notification decides the HTTP
response; the acknowledgement is best-effort and only logged on failure, so a
bounced courtesy email can never tell a customer their enquiry was lost.
See `DEPLOYMENT.md` Part 1.

Both are guarded by:

- **Rate limit** (`src/lib/rateLimit.ts`) — 5 per IP per 10 minutes, checked
  before the body is parsed. Exact with a single PM2 instance.
- **Honeypot** (`src/lib/honeypot.ts`) — a hidden field real visitors never see.
  When filled, the submission is dropped and the *success* message returned, so
  a bot gets no signal to adapt to.

## Environment Variables

Documented inline in `.env.local.example`; the deployment-specific details are in
`DEPLOYMENT.md` Part 6.3. The variable that catches people out:

| Variable | Gotcha |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | **Compiled in at build time.** Unset means sitemap and link previews point at localhost |

## Project Structure

```
src/
  app/
    api/contact/route.ts     # enquiry: upload photo → email team
    api/career/route.ts      # application: upload CV → email team
    {about-us,services,carriers,career,contact}/
    impressum/ datenschutz/  # legal pages
    robots.ts sitemap.ts     # generated at /robots.txt and /sitemap.xml
    page.tsx layout.tsx globals.css
  components/
    ui/                      # shadcn/ui primitives
    motion/                  # Reveal, Stagger, HoverLift
    shared/                  # Logo, SectionHeading, ServiceCard, LegalPage, Honeypot, …
    Navbar.tsx Footer.tsx ContactForm.tsx CareerForm.tsx OfficeMap.tsx
  contexts/AppContext.tsx    # locale + theme, and the <html lang> attribute
  lib/
    site.ts                  # company details, legal identity, nav, siteUrl
    translations.ts          # ALL visible marketing copy, DE + EN
    legalContent.ts          # imprint + privacy text, DE + EN
    msGraph.ts               # Graph client: uploads AND sendMail
    email.ts                 # the two notification templates
    formEndpoint.ts          # API URL resolver (same-origin)
    uploads.ts               # size/MIME limits + folder paths
    rateLimit.ts             # per-IP throttle (server only)
    honeypot.ts              # shared bot-trap field name
scripts/
  check-setup.mjs            # npm run check
  find-sharepoint.mjs        # site discovery
public/                      # static assets (images, fonts)
```

**All visible marketing copy is in `src/lib/translations.ts`** (both languages),
not in components — that is the file to edit for wording changes. Legal copy is
kept separately in `src/lib/legalContent.ts`, because changing it should be a
considered act rather than a drive-by edit.

## Things that break silently

- **The Microsoft client secret expires** (24 months max). Uploads and email
  both stop while the site keeps looking healthy. Diarise the expiry.
- **`NEXT_PUBLIC_SITE_URL` wrong at build time** —
  nothing errors; the sitemap points at localhost.
- **Adding any third-party script** makes the privacy policy inaccurate and most
  likely requires a consent banner. There are none today, which is why the site
  needs no cookie banner.

Unfilled legal details are the one failure mode that is *not* silent — they
render as red boxes on the live Impressum, deliberately.
