# Flink Freight — Deployment on STRATO V-Server

The single reference for getting this site live on a STRATO V-Server and
keeping it running. Covers the architecture, the Microsoft 365 setup, the
server provisioning, deployment, verification, handover and troubleshooting.

**Written for:** whoever deploys this site and hands it over to the client.

Work through the parts in order. Part 2 is the one that will silently break
things if skipped.

---

## Part 1 — How it works

### One server, one process

The site runs as a **single Next.js application** on a STRATO V-Server. Pages
and API routes are served from the same origin — no split deployment, no
cross-origin setup, no Vercel.

```
         ┌──────────────────────────────────────┐
         │  STRATO V-Server (Linux)             │
         │  Nginx → Node.js (PM2)               │
         ├──────────────────────────────────────┤
         │  8 pages (SSR / static)              │
visitor→ │  POST /api/contact                   │
         │  POST /api/career                    │
         │  robots.txt, sitemap.xml             │
         │  images, CSS, JS                     │
         └──────────────────┬───────────────────┘
                            │
                            ▼
          ┌──────────────────────────────────────┐
          │  Microsoft 365 (client's tenant)     │
          │  SharePoint  → CVs, photos           │
          │  Graph sendMail → notifications      │
          └──────────────────────────────────────┘
```

Nothing runs on hardware the client does not already pay for (besides the
V-Server). There is no database and no admin panel — **the inbox is the
record.**

### What each submission sends — four emails, two per form

| Form | Email | To | Reply-To | Language |
| --- | --- | --- | --- | --- |
| Contact | Notification | `CONTACT_TO_EMAIL` (the team) | the visitor | English |
| Contact | Acknowledgement | the visitor | `CONTACT_TO_EMAIL` | the visitor's |
| Career | Notification | `CAREER_TO_EMAIL` (the team) | the applicant | English |
| Career | Acknowledgement | the applicant | `CAREER_TO_EMAIL` | the applicant's |

The team notification is always English — one inbox, one working language. The
acknowledgement is written in whichever language the visitor had the site set to,
passed as a `locale` field with the submission.

**The two are not equally important, and the code reflects that.** The team
notification is sent first and it is the one that decides the response: if it
fails, the visitor is told the submission failed, because with no database that
email *is* the enquiry. The acknowledgement is sent afterwards inside a
`try/catch` that only logs — by then the enquiry is already safe, so a bounced
courtesy email must never tell a customer their message was lost when it was not.

### The 13 routes

| Route | Type | Description |
| --- | --- | --- |
| `/` | Page | Home — hero, services, why-us, values, FAQ, CTA |
| `/about-us` | Page | Company story, mission, vision, values |
| `/services` | Page | Ocean, Air, Ground, Warehousing, Customs, Supply Chain |
| `/carriers` | Page | Carrier partnership info & onboarding steps |
| `/career` | Page | Careers pitch + application form with CV upload |
| `/contact` | Page | Contact form (dimensions, weight, photo upload) + office map |
| `/impressum` | Page | Imprint — § 5 DDG |
| `/datenschutz` | Page | Privacy policy — Art. 13 GDPR |
| `/_not-found` | Page | Custom 404 page |
| `/robots.txt` | Generated | SEO robots file |
| `/sitemap.xml` | Generated | SEO sitemap |
| **`/api/contact`** | **API** | Contact form handler |
| **`/api/career`** | **API** | Career application handler |

All served from the same Node.js process.

### Two decisions already made, and why

**No database.** MongoDB was removed on 2026-08-19. Submissions go to SharePoint
(the file) plus email (the notification). *Consequence:* delete the notification
email and that enquiry is gone. The uploaded file survives in SharePoint either way.

**Email goes through Microsoft 365, not Resend.** Resend requires an MX record on
a `send.` subdomain before it will release a domain for sending, and **STRATO's
DNS panel cannot create MX records for subdomains**. Graph `sendMail` uses the
same app registration as the uploads and sends from a real licensed mailbox whose
SPF/DKIM is already valid: no DNS work, no API key, no domain verification, one
fewer vendor.

---

## Part 2 — Pre-flight (blockers)

### 2.1 🔴 Grant `Mail.Send`

The Entra app registration has `Files.ReadWrite.All` but **not** `Mail.Send`.
Until it does, uploads work and both forms return 503. Needs a Global
Administrator; two minutes.

1. <https://entra.microsoft.com> → **App registrations** → select the app
2. **API permissions** → **Add a permission** → **Microsoft Graph**
3. **Application permissions** (not Delegated) → `Mail.Send` → **Add**
4. **Grant admin consent for \<tenant\>** → confirm

The **green tick** in the Status column is the thing that matters. Without it the
permission is listed and still rejected.

### 2.2 🔴 Restore the production recipients

`.env.local` currently points both recipient variables at a test Gmail address.
Restore them:

```ini
CONTACT_TO_EMAIL=info@flinkfreight.de,info@flinkfreight.eu
CAREER_TO_EMAIL=karriere@flinkfreight.de,careers@flinkfreight.eu
```

### 2.3 🔴 Fill in the legal details

`src/lib/site.ts` has six placeholders in the `legal` block. They render as
**red warning boxes** on the live `/impressum` and `/datenschutz`. A German
business site must carry them (§ 5 DDG):

`registeredName` · `representatives` · `registerCourt` · `registerNumber` ·
`vatId` · `contentResponsible`

Take them from the Handelsregister entry. `npm run check` counts what is still
missing.

### 2.4 Confirm the registered address

`site.ts` says *Willy-Brand-Platz 2, 12529 Schönefeld*. The street at that
postcode is **Willy-Brandt-Platz** — with the *t*. This appears in the Impressum,
where it must be exact.

### 2.5 Have the legal texts reviewed

`src/lib/legalContent.ts` honestly describes what this site does, but it is not
legal advice. The retention periods depend on how the company actually operates.

### 2.6 Pending decisions

Both commented out in `src/lib/site.ts`, each a one-line restore:

- **Phone number** — no confirmed number. Email plus the contact form satisfies
  the Impressum requirement, but a phone number is what visitors look for.
- **Social links** — Facebook and X are still `#`. Set real URLs and uncomment
  the icon row in `Footer.tsx`, or leave both off.

### 2.7 Verify the whole setup

```bash
npm run check           # config, sign-in, SharePoint, folders, mailbox, legal
npm run check -- --live  # also uploads a real file and sends a real email
```

All seven sections must pass before deploying.

---

## Part 3 — Microsoft 365 setup

Skip if the tenant is already configured (it is — these are the steps that
produced the current values, kept for when the secret expires or the app must be
rebuilt).

### 3.1 Register the application

<https://entra.microsoft.com> → **App registrations** → **New registration**.
Name it something recognisable; leave the redirect URI empty. Single tenant.

### 3.2 Copy the two IDs

From the app's **Overview** page. German portal labels:

| German label | English | Variable |
| --- | --- | --- |
| Anwendungs-ID (Client) | Application (client) ID | `MS_GRAPH_CLIENT_ID` |
| Verzeichnis-ID (Mandant) | Directory (tenant) ID | `MS_GRAPH_TENANT_ID` |

### 3.3 Create the client secret

**Certificates & secrets** → **New client secret**. Max lifetime 24 months.

> Copy the **"Wert" / Value** column — **not** "Geheime ID" / Secret ID. The
> Secret ID is useless here, and the real value is masked permanently once you
> leave the page. If you miss it, delete the secret and make a new one.

→ `MS_GRAPH_CLIENT_SECRET`

### 3.4 Grant both permissions

**API permissions** → **Add a permission** → **Microsoft Graph** →
**Application permissions**:

| Permission | For |
| --- | --- |
| `Files.ReadWrite.All` | storing CVs and photos |
| `Mail.Send` | sending the notifications |

Then **Grant admin consent**. Green ticks on both.

### 3.5 Choose where files go

SharePoint is preferred over OneDrive: the files belong to the company rather
than to one person, so access survives staff changes.

For `https://flinkfreightgermany.sharepoint.com`:

```ini
MS_GRAPH_SITE_HOSTNAME=flinkfreightgermany.sharepoint.com
MS_GRAPH_SITE_PATH=          # empty = the tenant's root site
```

Find the exact values for any site with:

```bash
node scripts/find-sharepoint.mjs
```

Folders are created automatically on first use:

```ini
MS_GRAPH_CAREER_FOLDER=Web/CVs
MS_GRAPH_CONTACT_FOLDER=Web/Queries/Transport Material
```

### 3.6 The sender mailbox

`MS_GRAPH_SENDER_EMAIL` must be a **real, licensed mailbox** — not an alias and
not a distribution list, or Graph refuses to send as it. A copy of everything
sent is kept in that mailbox's Sent Items, which is the audit trail.

### 3.7 Optional hardening

`Mail.Send` as an application permission lets the app send as **any** mailbox in
the tenant. An Entra **Application Access Policy** can scope it to
`info@flinkfreight.de` only. Worth doing; not required to function.

---

## Part 4 — Provision the STRATO V-Server

### 4.1 Order and access

1. STRATO panel → your V-Server package
2. Choose **Ubuntu 22.04 LTS** (or the latest Ubuntu LTS) as the OS
3. Note the **IP address** from the server dashboard
4. SSH in as root: `ssh root@<YOUR_SERVER_IP>`

### 4.2 Initial server hardening

```bash
# Update the system
apt update && apt upgrade -y

# Create a deploy user (never run the app as root)
adduser deploy
usermod -aG sudo deploy

# Set up SSH key auth for the deploy user
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys

# Disable root SSH login and password auth (edit sshd_config)
sed -i 's/^PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/^#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart sshd
```

### 4.3 Set up the firewall

```bash
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

### 4.4 Install Node.js 20 LTS

```bash
# As root or with sudo:
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Verify
node -v   # v20.x.x
npm -v    # 10.x.x
```

### 4.5 Install PM2

```bash
npm install -g pm2

# Make PM2 start on boot
pm2 startup systemd -u deploy --hp /home/deploy
```

### 4.6 Install and configure Nginx

```bash
apt install -y nginx

# Remove the default site
rm /etc/nginx/sites-enabled/default
```

Create `/etc/nginx/sites-available/flinkfreight`:

```nginx
# Redirect HTTP → HTTPS and naked domains → www
server {
    listen 80;
    listen [::]:80;
    server_name flinkfreight.de www.flinkfreight.de flinkfreight.eu www.flinkfreight.eu;
    return 301 https://www.flinkfreight.de$request_uri;
}

# Main HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name www.flinkfreight.de flinkfreight.de www.flinkfreight.eu flinkfreight.eu;

    # SSL certs — managed by Certbot (see Part 5)
    ssl_certificate     /etc/letsencrypt/live/www.flinkfreight.de/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/www.flinkfreight.de/privkey.pem;
    include             /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;

    # Redirect non-www to www
    if ($host != www.flinkfreight.de) {
        return 301 https://www.flinkfreight.de$request_uri;
    }

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Upload limit — matches the 5 MB app limit with headroom for multipart overhead
    client_max_body_size 10M;

    # Proxy timeouts — Graph calls can take a few seconds
    proxy_connect_timeout 30s;
    proxy_send_timeout    60s;
    proxy_read_timeout    60s;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade           $http_upgrade;
        proxy_set_header Connection        "upgrade";
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Next.js static assets — let Nginx serve them directly for performance
    location /_next/static/ {
        alias /home/deploy/flinkfreight/.next/static/;
        expires 365d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    location /public/ {
        alias /home/deploy/flinkfreight/public/;
        expires 30d;
        access_log off;
    }
}
```

Enable the site:

```bash
ln -s /etc/nginx/sites-available/flinkfreight /etc/nginx/sites-enabled/
nginx -t          # must say "syntax is ok"
systemctl reload nginx
```

> **Note:** The SSL lines will fail until Certbot runs (Part 5). Comment them out
> temporarily if you need Nginx running first, or set up Certbot before enabling
> the HTTPS server block.

---

## Part 5 — SSL with Let's Encrypt

### 5.1 Point DNS first

In the STRATO DNS panel (or wherever DNS is managed), create A records:

| Hostname | Type | Value |
| --- | --- | --- |
| `flinkfreight.de` | A | `<YOUR_SERVER_IP>` |
| `www.flinkfreight.de` | A | `<YOUR_SERVER_IP>` |
| `flinkfreight.eu` | A | `<YOUR_SERVER_IP>` |
| `www.flinkfreight.eu` | A | `<YOUR_SERVER_IP>` |

Wait for propagation (check with `dig www.flinkfreight.de`).

> ### ⛔ Do not touch the MX records
>
> Both domains' MX records point at Microsoft 365. They deliver the company's
> actual mail **and every form notification this site sends**. Changing them
> breaks both. Only the A records should change.

### 5.2 Install Certbot

```bash
apt install -y certbot python3-certbot-nginx
```

### 5.3 Obtain certificates

```bash
certbot --nginx \
  -d flinkfreight.de \
  -d www.flinkfreight.de \
  -d flinkfreight.eu \
  -d www.flinkfreight.eu
```

Certbot will update the Nginx config automatically and set up auto-renewal.

Verify auto-renewal:

```bash
certbot renew --dry-run
```

---

## Part 6 — Deploy the application

### 6.1 Clone or upload the code

```bash
# As the deploy user
su - deploy

# Option A: Clone from Git
git clone https://github.com/Ameerhamzasubhani5/flinkFreight.git ~/flinkfreight
cd ~/flinkfreight

# Option B: Upload via SCP from your local machine
# scp -r ./flinkFreight deploy@<SERVER_IP>:~/flinkfreight
```

### 6.2 Install dependencies

```bash
cd ~/flinkfreight
npm ci --legacy-peer-deps

# Confirm sharp built correctly - the site resizes images on demand and this
# is the native library that does it.
node -e "console.log('sharp OK, libvips', require('sharp').versions.vips)"
```

> **`sharp` matters more than it looks.** Without it Next falls back to a
> WebAssembly image encoder that is several times slower and far more
> CPU-hungry. On a 1-2 core V-Server that turns the first visit to each page
> into a visible stall while the hero image is converted. `npm ci` installs a
> prebuilt binary on normal Linux x64; if it ever fails to build, install the
> build tools and retry:
>
> ```bash
> sudo apt install -y build-essential python3
> npm rebuild sharp
> ```

### 6.3 Create the environment file

```bash
cp .env.local.example .env.local
nano .env.local
# Fill in ALL the Microsoft 365 values — see Part 3
```

**Secure it:**

```bash
chmod 600 .env.local
```

### 6.4 Verify the setup

```bash
npm run check           # all sections must pass
npm run check -- --live  # uploads a file and sends an email
```

### 6.5 Build the application

```bash
NEXT_PUBLIC_SITE_URL=https://www.flinkfreight.de npm run build
```

> `NEXT_PUBLIC_SITE_URL` is baked in at build time. A wrong value means the
> sitemap and link previews point at the wrong place. **A rebuild is needed to
> change it.**

### 6.6 Start with PM2

```bash
# Start the app. `start:prod` binds Next to 127.0.0.1 so the only way in is
# through Nginx — see the note below.
pm2 start npm --name "flinkfreight" -- run start:prod

# Save the process list so it survives a reboot
pm2 save

# Verify it is running
pm2 status
pm2 logs flinkfreight --lines 20

# Confirm it is bound to loopback ONLY — this must show 127.0.0.1:3000,
# never 0.0.0.0:3000 or :::3000
ss -tlnp | grep 3000
```

> **Why `start:prod` and not `start`.** Plain `next start` binds to every
> interface, so port 3000 answers on the server's public IP as well. The
> firewall is the only thing stopping that, which means one `ufw disable`
> during troubleshooting exposes the app directly — bypassing TLS, the security
> headers, and Nginx's request limits, and making every visitor look like the
> same IP to the rate limiter. Binding to 127.0.0.1 makes Nginx the only
> possible route in, regardless of firewall state.

### 6.7 Verify the proxy chain

```bash
# From the server itself:
curl -I http://127.0.0.1:3000        # Next.js directly — should be 200
curl -I https://www.flinkfreight.de   # Through Nginx — should be 200
```

---

## Part 7 — Verify the live site

```bash
curl -I https://www.flinkfreight.de                  # 200
curl -I http://www.flinkfreight.de                   # 301 → https
curl -s https://www.flinkfreight.de/robots.txt       # real domain, not localhost
curl -s https://www.flinkfreight.de/sitemap.xml      # 6 URLs, all https
curl -I https://www.flinkfreight.de/about-us         # 200
curl -I https://www.flinkfreight.de/impressum        # 200
curl -s -o /dev/null -w "%{http_code}\n" https://www.flinkfreight.de/nope   # 404
```

In a browser — this is the part that actually matters:

- [ ] All 8 pages load, and **each one survives a direct refresh**
- [ ] Language switch DE ⇄ EN changes the whole site and survives a reload
- [ ] Dark mode toggle works and survives a reload
- [ ] Office map: hovering each of the four regions shows that office's address
- [ ] **Real contact enquiry with a photo** → arrives at `info@flinkfreight.de`,
      the photo link opens in SharePoint, Reply-To is the visitor
- [ ] **…and the visitor receives an acknowledgement**, in the language the form
      was submitted in, whose Reply-To is the team inbox
- [ ] **Real job application with a PDF CV** → arrives at the career inbox, CV
      link opens
- [ ] **…and the applicant receives an acknowledgement**, same checks
- [ ] Switch the site to English and repeat one of each — the acknowledgement
      must come through in English
- [ ] `/impressum` and `/datenschutz` load, are linked in the footer, and show
      **no red placeholder boxes**
- [ ] The site on a phone
- [ ] Devtools console clean on every page

### 7.1 Tidy up

Delete the test files in SharePoint under `Web/CVs` — `setup-check-*.txt`,
`qa-cv.pdf`, `Max-Mustermann-CV.pdf`, plus anything the checks above created.

---

## Part 8 — Handover

What the client must be given and told:

1. **Where things live** — everything on one STRATO V-Server, files and email in
   their own Microsoft 365.
2. **The client secret expires** (24 months max). When it lapses, uploads and
   email **stop silently** — the forms still look like they work. Put the expiry
   in a shared calendar with a month's warning. This is the most likely cause of
   a future outage. Renewing: Part 3.3, then update `.env.local` on the server
   and restart the app with `pm2 restart flinkfreight`.
3. **Submissions live in the inbox.** No database, no admin panel. Deleting a
   notification loses that enquiry; the file survives in SharePoint.
4. **Editing copy** — all visible text is in `src/lib/translations.ts`, both
   languages. Changes need a rebuild and restart (see "Redeploying" below).
5. **Adding any third-party script** — analytics, a chat widget, an embedded
   Google map — makes the privacy policy inaccurate and most likely requires a
   cookie consent banner. The site deliberately has none today, which is exactly
   why it needs no banner.
6. Hand over this file. Transfer `.env.local` **separately and securely** — a
   password manager, never chat or email.

### Redeploying later

```bash
# SSH into the server as the deploy user
ssh deploy@<SERVER_IP>
cd ~/flinkfreight

# Pull the latest code
git pull origin main

# Install any new dependencies
npm ci --legacy-peer-deps

# Rebuild
NEXT_PUBLIC_SITE_URL=https://www.flinkfreight.de npm run build

# Restart the app
pm2 restart flinkfreight

# Optional: if images were changed, clear the optimised-image cache so the new
# versions are generated. Leave it alone otherwise - it is a warm cache and
# clearing it makes the next visit to each page slower.
# rm -rf .next/cache/images && pm2 restart flinkfreight

# Verify
pm2 logs flinkfreight --lines 10
```

Changing a value in `.env.local` only needs a restart (`pm2 restart flinkfreight`),
not a rebuild — **unless** the variable starts with `NEXT_PUBLIC_`, which is baked
in at build time.

---

## Part 9 — Maintenance

### 9.1 Server updates

```bash
# As root or with sudo
apt update && apt upgrade -y

# Reboot if a kernel update was installed
# PM2 will restart the app automatically
sudo reboot
```

### 9.2 Node.js updates

```bash
# Check current version
node -v

# Update via NodeSource (when a new LTS is released)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo bash -
sudo apt install -y nodejs
pm2 restart flinkfreight
```

### 9.3 SSL certificate renewal

Certbot auto-renews via a systemd timer. Verify:

```bash
sudo certbot renew --dry-run
sudo systemctl status certbot.timer
```

### 9.4 PM2 monitoring

```bash
pm2 status                          # process list
pm2 logs flinkfreight               # live logs
pm2 logs flinkfreight --lines 100   # last 100 lines
pm2 monit                           # CPU + memory dashboard
```

### 9.5 Backups

Back up these files regularly (or ensure STRATO snapshots are enabled):

- `/home/deploy/flinkfreight/.env.local` — the secrets
- `/home/deploy/flinkfreight/` — the application (or just rely on Git)
- `/etc/nginx/sites-available/flinkfreight` — the Nginx config
- `/etc/letsencrypt/` — the SSL certificates (Certbot recreates these, but still)

---

## Part 10 — Troubleshooting

| Symptom | Cause |
| --- | --- |
| Site returns 502 Bad Gateway | Node.js process not running — `pm2 status`, then `pm2 restart flinkfreight` |
| Site returns 504 Gateway Timeout | App is hanging — check `pm2 logs flinkfreight` for errors |
| Forms: 503 | `Mail.Send` not granted (2.1), or the client secret expired |
| Forms: 429 | Rate limit — 5 per IP per 10 min, by design |
| Email never arrives | Check the sender's Sent Items. Present → delivery issue; absent → `Mail.Send` |
| Team is notified but the customer gets no confirmation | Acknowledgement failed; it is best-effort by design. Search `pm2 logs` for `Acknowledgement to the` |
| Upload fails but email works | `Files.ReadWrite.All` consent, or the SharePoint path |
| Link previews show no image | `NEXT_PUBLIC_SITE_URL` wrong at build time — rebuild |
| Red boxes on `/impressum` | Legal placeholders unfilled (2.3) |
| `invalid_client` from Microsoft | Secret ID copied instead of the Value (3.3) |
| Sender mailbox "not found" | Alias or group, not a licensed mailbox (3.6) |
| Nginx says "no resolver" in logs | DNS issue on the server — add `resolver 8.8.8.8;` to the Nginx config |
| App starts but immediately crashes | Check `.env.local` for missing variables — `pm2 logs flinkfreight` |
| After reboot, site is down | PM2 startup hook not configured — run `pm2 startup` again |
| Pages hang / never finish loading | A stale Node process is still bound to port 3000. `ss -tlnp \| grep 3000`, kill the orphan, then `pm2 restart flinkfreight`. A second process cannot bind the port, so PM2 silently keeps serving the broken one |
| First visit to a page is slow, later visits fast | Normal — images are optimised on first request and then cached. If it stays slow, `sharp` is missing (see 6.2) |
| `EACCES` errors in logs | File permission issue — `chown -R deploy:deploy ~/flinkfreight` |

### Gotchas that already cost time once

**The in-process rate limiter is now exact.** With PM2 running a single instance,
every request hits the same counter. If you ever switch to PM2 cluster mode (to
use multiple CPU cores), the rate limiter becomes approximate again — each
instance keeps its own counter.

**Framer Motion writes `undefined` when animating the SVG `r` attribute** on the
first frame, which the browser rejects. Animate `scale` with a fixed `r` instead
(see the pin halos in `OfficeMap.tsx`).

**Decorative SVG needs `pointer-events: none`** — route curves and pin halos
silently stole hover from the countries underneath them.

**Scroll-triggered reveals break screenshot testing.** Elements sit at
`opacity: 0` until scrolled into view, so a screenshot taken too early looks
broken when it is not.

**Nginx's `client_max_body_size`** must be larger than the app's 5 MB limit —
set it to 10 MB to account for multipart encoding overhead. Without it, Nginx
rejects the upload with a 413 before Node.js ever sees it.

**`X-Forwarded-For` is set by Nginx** — the `proxy_set_header` directives in the
config are what make the rate limiter see the real client IP. Without them,
every visitor shares one rate-limit bucket.
