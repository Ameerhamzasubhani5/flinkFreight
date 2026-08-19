# Flink Freight Logistics

Marketing website for Flink Freight Logistics, built with **Next.js 14 (App Router)**,
**TypeScript**, **Tailwind CSS** and **MongoDB**.

Mostly static content with four dynamic pieces: the contact form, the career
application form, the newsletter sign-up, and a health/keep-alive endpoint.
The whole site is bilingual (German / English), switchable from the navbar.

## Pages

| Route        | Contents                                                        |
| ------------ | --------------------------------------------------------------- |
| `/`          | Home — hero, services overview, why-us, values, FAQ, CTA         |
| `/about-us`  | Company story, mission, vision, values                           |
| `/services`  | Ocean, Air, Ground, Warehousing, Customs, Supply Chain           |
| `/carriers`  | Carrier partnership info & onboarding steps                      |
| `/career`    | Careers pitch + application form with resume upload              |
| `/contact`   | Contact form (package dimensions, weight, photo upload) + map    |

## Tech Stack

| Concern      | Choice                                        |
| ------------ | --------------------------------------------- |
| Framework    | Next.js 14 (App Router)                       |
| Language     | TypeScript                                    |
| Styling      | Tailwind CSS + shadcn/ui primitives           |
| Animation    | Framer Motion                                 |
| Database     | MongoDB via Mongoose                          |
| Email        | Resend                                        |
| File storage | Microsoft 365 OneDrive via Graph API          |
| Hosting      | Vercel (CI/CD in `.github/workflows/deploy.yml`) |

## Getting Started

```bash
# 1. Install dependencies (the repo pins legacy-peer-deps via .npmrc)
npm install

# 2. Configure environment
cp .env.local.example .env.local
# then fill in the values — see the comments in that file

# 3. Run the dev server
npm run dev
```

Open <http://localhost:3000>.

## Environment Variables

Copy `.env.local.example` → `.env.local` and fill in. Every variable is
documented inline in that file.

| Variable                 | Required | Purpose                                              |
| ------------------------ | -------- | ---------------------------------------------------- |
| `MONGODB_URI`            | Yes      | MongoDB connection string (Atlas M0 free tier is fine) |
| `RESEND_API_KEY`         | Yes      | Sends form notifications to the team                  |
| `RESEND_FROM_EMAIL`      | Yes      | Verified "from" address                               |
| `CONTACT_TO_EMAIL`       | Yes      | Inbox receiving contact-form submissions              |
| `CAREER_TO_EMAIL`        | No       | Inbox for job applications (falls back to `CONTACT_TO_EMAIL`) |
| `MS_GRAPH_TENANT_ID`     | No       | Microsoft 365 tenant (Entra ID)                       |
| `MS_GRAPH_CLIENT_ID`     | No       | Registered app's client ID                            |
| `MS_GRAPH_CLIENT_SECRET` | No       | Registered app's client secret                        |
| `MS_GRAPH_USER_EMAIL`    | No       | Mailbox whose OneDrive receives uploads               |

Set the same variables in **Vercel → Project → Settings → Environment Variables**
before the first production deploy.

If the Microsoft Graph variables are left blank, uploaded resumes and shipment
photos are stored in MongoDB instead. Nothing is lost — the files simply stay in
the database until Graph is configured.

> **Configure Graph before going live if you expect any volume.** The Atlas M0
> free tier caps total storage at **512MB**, and uploads are capped at 5MB each,
> so the fallback path can fill a free cluster after roughly a hundred
> submissions. With Graph configured, files go to OneDrive and only a link is
> stored, which keeps the database tiny.

## API Routes

| Route                 | Body            | Behaviour                                            |
| --------------------- | --------------- | ---------------------------------------------------- |
| `POST /api/contact`   | `multipart/form-data` | Stores enquiry + emails the team. Optional photo (≤5MB, JPG/PNG/WEBP) and package L/W/H/weight. |
| `POST /api/career`    | `multipart/form-data` | Stores application + emails the team. Resume required (≤5MB, PDF/DOC/DOCX). |
| `POST /api/subscribe` | `{ email }`     | Stores a newsletter subscriber (duplicates ignored). |
| `GET /api/health`     | —               | Pings the database. `200` when reachable, `503` when not. |

### Delivery guarantee

The contact and career routes write to MongoDB **and** send an email, in
parallel. A submission is accepted if **either** channel succeeds, so a database
outage or an email misconfiguration can never silently lose a customer enquiry
or a job application. Only if both fail does the visitor get an error asking
them to retry. Partial deliveries are logged with a `partial delivery` warning
so they can be reconciled.

## Keeping the free MongoDB cluster alive

Atlas pauses **M0 (free tier)** clusters after **60 days with no connections**,
and a paused cluster has to be resumed by hand from the Atlas UI.

`vercel.json` registers a Vercel Cron job that calls `GET /api/health` once a
day at 06:00 UTC. That single daily connection resets the inactivity timer, so
the cluster is never paused and never needs a manual resume.

Two things to check on the Atlas side after deploying:

1. **Network Access → add `0.0.0.0/0`.** Vercel's functions have no fixed IP
   address, so an IP allowlist will block the site intermittently.
2. **Confirm the cron is running** — Vercel → Project → Cron Jobs. It should
   show a daily run against `/api/health` returning 200.

`GET /api/health` also works as an uptime-monitor target if you want alerting
(UptimeRobot, Better Stack, etc.) — it returns 503 whenever the database is
unreachable.

## Project Structure

```
src/
  app/
    api/career/route.ts      # job application handler (resume upload)
    api/contact/route.ts     # contact form handler (photo + dimensions)
    api/subscribe/route.ts   # newsletter handler
    api/health/route.ts      # DB health check + Atlas keep-alive
    about-us/ carriers/ career/ contact/ services/
    page.tsx                 # home
    layout.tsx
    globals.css
  components/
    ui/                      # shadcn/ui primitives
    motion/                  # Reveal, Stagger, HoverLift wrappers
    shared/                  # Logo, SectionHeading, ServiceCard, ...
    Navbar.tsx Footer.tsx ContactForm.tsx CareerForm.tsx OfficeMap.tsx
  contexts/AppContext.tsx    # locale + theme
  lib/
    site.ts                  # company details + nav structure
    translations.ts          # all visible copy (DE + EN)
    mongodb.ts               # cached, serverless-safe Mongoose connection
    email.ts                 # Resend templates
    msGraph.ts               # OneDrive upload via Microsoft Graph
    submissions.ts           # store-or-email delivery strategy
    uploads.ts               # shared file-size / MIME constraints
  models/                    # Contact, CareerApplication, Subscriber schemas
```

Visible copy lives in `lib/translations.ts` (both languages), not in the
components — that is the file to edit for wording changes.

## Deployment

Pushing to `main` runs lint → typecheck → build, then deploys to Vercel
production. Any other branch deploys to a preview URL. See
`.github/workflows/deploy.yml`.

Required GitHub secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`,
`MONGODB_URI`.
