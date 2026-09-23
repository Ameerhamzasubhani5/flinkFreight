# Flink Freight — Session Handoff

**Written for:** another Claude Code session (and the developer) picking this
project up on a different machine.

**Last updated:** 2026-09-23
**Repo state at handoff:** branch `main`, last commit `bba0dcf`, with
uncommitted deployment-prep work (listed at the end).

---

## 1. What this project is

A bilingual (German / English) marketing website for **Flink Freight
Logistics**, a freight-forwarding company with offices in Canada, Germany,
Pakistan and the UAE.

Next.js 14 (App Router), TypeScript, Tailwind, shadcn/ui primitives, Framer
Motion. Six pages: Home, About Us, Services, Carriers, Careers, Contact.

Two working forms:
- **Contact** — enquiry + package dimensions (L/W/H/weight) + optional photo
- **Careers** — job application + CV upload (required)

Both upload their file to **SharePoint** and email the team a link to it.

---

## 2. Architecture — and why it looks like this

This is the part worth reading carefully. Several decisions were reversed
during the work, and the reasons matter.

### Current shape

```
STRATO Starter hosting  →  the website (static HTML/CSS/JS, ~2.9 MB)
Free serverless (Vercel) →  one form handler — this is where the secret lives
Microsoft 365            →  file storage (SharePoint) AND email (Graph sendMail)
```

### Why the site is split in two

STRATO's **Starter** plan is standard webhosting: PHP/MySQL, 50 GB webspace,
1 SSL certificate. **It has no Node.js runtime.** The site's form handlers need
one, because the Microsoft client secret must never reach the browser.

Uploading the whole app to STRATO produces a site that *looks* fine but where
every form silently fails. Hence: static pages on STRATO (the plan the client
paid for gets used), form handler on a free serverless deployment.

The alternative — a STRATO V-Server — was rejected as too much ongoing
maintenance (Node, nginx, PM2, certificates, security updates).

### Why there is no database

MongoDB was removed on 2026-08-19. Contact enquiries and job applications now
go to SharePoint (the file) + email (the notification). **Email is the record.**

Rationale: the free Atlas tier caps at 512 MB while uploads are capped at 5 MB
each, so roughly a hundred applications would have filled it. Nobody was ever
going to query the data. Files in OneDrive/SharePoint is where the team
actually works.

*Consequence to remember:* if someone deletes the notification email, the
enquiry is gone. The uploaded file survives in SharePoint either way.

### Why email goes through Microsoft 365, not Resend

This one cost the most time, so the reasoning is recorded in full.

Resend was set up first and got as far as DKIM verifying on both domains. But
Resend also requires an **MX record on a `send.` subdomain** before it will
release a domain for sending. **STRATO's DNS panel cannot create MX records for
subdomains** — its MX page is scoped to the bare domain only (no host field),
and its "TXT and CNAME records" page only offers TXT and CNAME types. Both
were checked directly.

Result: `flinkfreight.de` and `.eu` were permanently stuck at "not verified",
and every send was rejected with 403.

The fix was to drop Resend entirely and send through **Microsoft Graph
`sendMail`**, using the same app registration that already handles SharePoint
uploads. Mail goes out from a real licensed mailbox whose SPF/DKIM is already
valid through Microsoft 365 — so there is **no DNS work, no API key and no
domain verification** to maintain. One fewer vendor, one fewer secret.

Resend code is commented out, not deleted, with a note explaining how to
restore it if STRATO ever adds that MX record.

---

## 3. Where things stand

### ✅ Working and verified

| Area | Status |
|---|---|
| All six pages, both locales, dark mode | Verified in a real browser |
| Logo (full wordmark → icon on scroll) | Working, light + dark variants |
| Office map — region hover shows office address | Verified across all 4 regions |
| SharePoint upload (CVs + photos) | **Verified with real files** |
| Folder auto-creation | `Web/CVs`, `Web/Queries/Transport Material` |
| Form validation (size, MIME, required) | Correct 400s, client + server |
| Static export for STRATO | Builds clean, all routes 200 when served as dumb files |
| CORS | Trusted origin allowed, unknown refused — both verified |
| typecheck / lint / production build | All pass |

### 🔴 The one blocker

**`Mail.Send` is not granted on the Entra app registration.** The app currently
has only `Files.ReadWrite.All`. Until this is granted *with admin consent*,
both forms return 503 and no email is sent.

Fix (2 minutes, needs a Global Administrator):
`entra.microsoft.com` → App registrations → the app → **API permissions** →
Add a permission → Microsoft Graph → **Application permissions** → `Mail.Send`
→ Add → **Grant admin consent** (the green tick is what matters).

Verify afterwards with:
```bash
npm run check          # config + storage + folders
npm run check -- --live  # actually uploads a file and sends an email
```

### ⏳ Not yet done

1. Full end-to-end test with real email delivery (blocked on `Mail.Send`)
2. Deploy the form handler to Vercel
3. Build + FTP the static site to STRATO
4. Point the domain, enable SSL
5. Restore production recipient emails (see §5 — currently pointed at a test Gmail)

---

## 4. Go-live runbook

**Step 1 — Grant `Mail.Send`** (above), then run `npm run check -- --live`.

**Step 2 — Deploy the form handler.** Import the repo at vercel.com (free
Hobby). Set the environment variables from §5. Note the deployment URL.

**Step 3 — Build the static site:**
```bash
NEXT_PUBLIC_FORM_API_BASE=https://<your-api>.vercel.app npm run build:static
```
Produces `out/`. The API URL is baked into the JS at build time.

**Step 4 — Upload to STRATO.** FTP the **contents** of `out/` (not the folder)
to the web root. **Include the hidden `.htaccess`** — most FTP clients hide
dotfiles until you turn that on.

**Step 5 — Domain + SSL.** Point the domain at the hosting package, activate
the SSL certificate in the STRATO panel. The `.htaccess` forces HTTPS — don't
enable it before the certificate is live or you get redirect loops.

**Step 6 — Verify.** Six pages, both languages, dark mode, office map, both
forms end to end, file arrives in SharePoint, email arrives in the inbox.

---

## 5. Configuration

Secrets live in **`.env.local`**, which is gitignored and has **never** been
committed (verified against full history). It will **not** arrive via git —
transfer it separately and securely (password manager, not chat or email).

`.env.local.example` is the committed template and is accurate/current.

### Required on the API deployment

| Variable | Notes |
|---|---|
| `MS_GRAPH_TENANT_ID` | Entra → "Verzeichnis-ID (Mandant)" |
| `MS_GRAPH_CLIENT_ID` | Entra → "Anwendungs-ID (Client)" |
| `MS_GRAPH_CLIENT_SECRET` | The **"Wert" / Value** column — *not* "Geheime ID" |
| `MS_GRAPH_SENDER_EMAIL` | `info@flinkfreight.de` — real licensed mailbox |
| `MS_GRAPH_SITE_HOSTNAME` | `flinkfreightgermany.sharepoint.com` |
| `MS_GRAPH_SITE_PATH` | *(empty = tenant root site)* |
| `MS_GRAPH_CAREER_FOLDER` | `Web/CVs` |
| `MS_GRAPH_CONTACT_FOLDER` | `Web/Queries/Transport Material` |
| `CONTACT_TO_EMAIL` | `info@flinkfreight.de,info@flinkfreight.eu` |
| `CAREER_TO_EMAIL` | `karriere@flinkfreight.de,careers@flinkfreight.eu` |
| `ALLOWED_ORIGINS` | `https://flinkfreight.de,https://www.flinkfreight.eu` etc. |

Recipient variables are **comma-separated** — every address listed gets every
notification, so nothing is missed based on which language site was used.

### Build-time only (STRATO bundle)

`NEXT_PUBLIC_FORM_API_BASE` — the API deployment's URL. Unset everywhere else.

> ⚠️ **`.env.local` is currently pointed at `subhania895@gmail.com`** for both
> recipient variables, for testing. **Restore the production addresses above
> before going live.** There is a comment in the file marking this.

### Domains

- `flinkfreight.de` and `flinkfreight.eu`, both on STRATO nameservers (`rzone.de`)
- Both root MX records point at Microsoft 365 (`flinkfreight-{de,eu}.mail.protection.outlook.com`) — **do not touch these**, they deliver the company's actual mail
- DKIM + SPF TXT for Resend are published but unused

---

## 6. Gotchas — things that cost time, recorded so they don't again

**STRATO DNS cannot create subdomain MX records.** Its MX page is bare-domain
only. This is what killed Resend. Confirmed by inspection, not assumption.

**The Resend SDK does not throw on API errors.** `resend.emails.send()`
*resolves* with `{ data: null, error: {...} }`. The original code never checked
`error`, so **every form reported success to the visitor even when the send was
rejected.** This was live for a while. If Resend is ever restored, keep the
`error` check. General lesson: verify a "success" actually succeeded.

**Next.js cannot combine `output: export` with API route handlers.** It errors
out. `scripts/build-static.mjs` moves `src/app/api` aside for the build and
restores it afterwards — including on failure or Ctrl-C.

**`trailingSlash: true` is mandatory for static hosting.** Without it Next emits
`about-us.html`, but links point to `/about-us`, so every page except the
homepage 404s on a direct visit, refresh or Google result. Client-side
navigation hides the problem during testing.

**Static export disables the Next image optimizer** (`images: { unoptimized:
true }`), so source images ship as-is. This is why `logi.png` was converted
from a 2.6 MB PNG to a 303 KB JPEG (`hero-port.jpg`) — it loads on every page.
Don't add large source images.

**Framer Motion writes `undefined` when animating the SVG `r` attribute** on the
first frame, which the browser rejects. Animate `scale` with a fixed `r`
instead (see the pin halos in `OfficeMap.tsx`).

**Decorative SVG needs `pointer-events: none`.** Route curves and pin halos were
silently stealing hover from the countries underneath them, so region hover
didn't work over large parts of the map.

**German Entra labels:** "Anwendungs-ID (Client)" = client ID,
"Verzeichnis-ID (Mandant)" = tenant ID. For the secret, copy **"Wert"**
(Value), never "Geheime ID" (Secret ID) — the latter is useless and the real
value is masked permanently once you leave the page.

**The client secret expires** (24 months max). When it does, uploads and email
stop **silently** — forms still look like they work. Put the expiry in a
calendar.

**Browser-test timing:** the site uses scroll-triggered Framer Motion reveals.
Screenshots taken too early capture elements at `opacity: 0` and look broken
when they aren't. Wait ~2–4 s after navigation, or assert against the DOM.

**Console-buffer carryover:** the browse tool retains console messages across
navigations. Clear it before per-page error checks or you'll attribute one
page's errors to another. This produced two false bug reports.

---

## 7. Code map

```
src/
  app/
    api/contact/route.ts    ← enquiry: upload photo → email team
    api/career/route.ts     ← application: upload CV → email team
    api/_health/            ← DISABLED (was the Atlas keep-alive)
    api/_subscribe/         ← DISABLED (newsletter, was DB-only)
    {about-us,services,carriers,career,contact}/
  components/
    OfficeMap.tsx           ← static map, region hover → office address card
    ContactForm.tsx  CareerForm.tsx
    Navbar.tsx  Footer.tsx  PageHero.tsx
    shared/Logo.tsx         ← full wordmark ⇄ icon on scroll
  lib/
    msGraph.ts              ← Graph client: uploads AND sendMail
    email.ts                ← the two email templates
    cors.ts                 ← origin allowlist for the split deployment
    formEndpoint.ts         ← relative vs absolute API URL
    uploads.ts              ← size/MIME limits + folder paths
    translations.ts         ← ALL visible copy, DE + EN
    site.ts                 ← company details, nav, locale-aware emails
    mongodb.ts submissions.ts  ← DISABLED
  models/                   ← all DISABLED (Mongo schemas)
scripts/
  check-setup.mjs           ← npm run check [-- --live]
  find-sharepoint.mjs       ← lists sites + shows granted Graph permissions
  build-static.mjs          ← npm run build:static
public/.htaccess            ← HTTPS, 404, caching, gzip (ships into out/)
docs/setup-guide.md         ← client-facing account-setup guide (PDF gitignored)
```

**Disabled code is commented out, never deleted** — a standing preference from
the developer. Each block carries a header saying why and how to restore it.
Keep doing this.

**All visible copy lives in `lib/translations.ts`** (both languages) — not in
components. That's the file to edit for wording changes.

---

## 8. Deliberately switched off

- **Newsletter signup** — was DB-only, had nowhere to write after Mongo went
- **Social media icons** — Facebook/X links in `site.ts` are still `#` placeholders
- **Phone number** — no confirmed number yet; commented out in `site.ts`,
  `Footer.tsx` and `ContactContent.tsx`

---

## 9. Uncommitted work at handoff

Deployment prep, tested but not yet committed:

```
 M .env.local.example        rewritten for Microsoft 365; documents new vars
 M next.config.mjs           BUILD_TARGET=static switch
 M package.json              added build:static
 M src/app/api/*/route.ts    CORS (OPTIONS handler + withCors wrappers)
 M src/components/*Form.tsx  use formEndpoint()
?? public/.htaccess          NEW
?? scripts/build-static.mjs  NEW
?? src/lib/cors.ts           NEW
?? src/lib/formEndpoint.ts   NEW
?? docs/                     NEW (setup guide + this file)
```

All of it passes typecheck, lint and both builds.

## 10. Open questions for the developer

1. **`.github/workflows/deploy.yml`** still deploys to Vercel on push to `main`
   and references stale `MONGODB_URI`. It could usefully deploy the *API* now —
   wants rewriting or disabling.
2. **`vercel.json`** is an empty stub since the Atlas cron was removed. Remove?
3. **`Mail.Send` is tenant-wide** — it lets the app send as any mailbox. An
   Entra *Application Access Policy* can scope it to `info@flinkfreight.de`
   only. Worth doing before launch; not required to function.
4. **Test files left in SharePoint** (`setup-check-*.txt`, `qa-cv.pdf`,
   `Max-Mustermann-CV.pdf`) under `Web/CVs` — safe to delete.
