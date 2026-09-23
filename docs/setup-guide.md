# Flink Freight Website — Setup Guide

**What this is:** a step-by-step guide to set up the accounts the new Flink Freight
website needs, and to get the domain and hosting ready at STRATO.

**Who it's for:** you'll be doing this yourself in four places — STRATO, Resend,
Microsoft 365, and your own email. No coding involved. Everything is done by
clicking through websites.

**What you'll produce:** eight settings, which you send back so the website can
be connected to your accounts. There's a form to fill in at the end, in Part 4.

**How long:** about 60–90 minutes, plus some waiting time in Part 2 while a DNS
change takes effect.

> **If you get stuck at any point, stop and send me a screenshot of what you're
> seeing.** Several of these screens look similar to each other, and guessing is
> more expensive than asking. Nothing here is urgent enough to rush.

---

## Do the parts in this order

The order matters. Part 2 can't be finished until Part 1 is done, because
verifying your email domain needs access to the domain's settings at STRATO.

| Part | What | Where | Roughly |
| --- | --- | --- | --- |
| 1 | Domain and hosting | STRATO | 30 min |
| 2 | Email sending | Resend | 20 min + waiting |
| 3 | File storage | Microsoft 365 | 20 min |
| 4 | Send the settings back | — | 5 min |

---

# Part 1 — STRATO: domain and hosting

This part does three things: confirms your domain is ready, gets the details
needed to upload the website, and creates the mailboxes that enquiries will
arrive in.

## 1.1 — Log in

1. Go to **strato.de**
2. Click **Login** (top right), then **Kunden-Login** (customer login)
3. Sign in with the STRATO account you used when buying the package

You'll land on your customer dashboard, which lists the products you own.

## 1.2 — Check what you have

Look at the dashboard and note down two things:

- **The domain name** — for example `flinkfreight.com` or `flinkfreight.de`
- **The hosting package name** — for example "STRATO Webhosting Basic"

Write both down. You'll need them in Part 4.

> If you don't see a domain listed, it may still be registering. Domain
> registration can take a few hours. Wait and check again before continuing.

## 1.3 — Find the domain settings

1. In the menu, open **Domains** → **Domainverwaltung** (domain management)
2. Find your domain in the list
3. Click it to open its settings

Inside, look for a section about **DNS** — usually called **DNS-Verwaltung** or
**Nameserver / DNS-Einstellungen**. This is where you can add records like *A*,
*CNAME* and *TXT*.

**You don't need to change anything yet.** You just need to know where this
screen is, because Part 2 sends you back here.

> **Confirm you can actually edit records here.** If the screen only lets you
> pick a nameserver and shows no way to add individual records, tell me before
> going further — the email setup in Part 2 depends on being able to add records.

## 1.4 — Get the upload details (FTP)

This is how the finished website gets onto your hosting.

1. In the menu, look for **Hosting** or your package, then find
   **FTP** — often shown as **FTP-Verwaltung**, **FTP-Zugänge** or
   **Zugangsdaten** (access details)
2. You need three things:
   - **Host / server address** — something like `ssh.strato.de` or `ftp.yourdomain.com`
   - **Username**
   - **Password**

If there's no password shown, or you never set one, use the option to **set a new
FTP password**. STRATO usually shows the password only once, so save it
straight away.

> **These are the keys to your website.** Anyone with them can replace your site
> with anything they like. Don't put them in a normal email or a WhatsApp
> message — Part 4 explains how to send them safely.

## 1.5 — Create the mailboxes

Enquiries from the website need somewhere to arrive.

1. In the menu, open **E-Mail** (or **Mail**), then the mailbox management
   section — often **E-Mail-Verwaltung** or **Postfächer**
2. Create these two addresses if they don't already exist:
   - **info@yourdomain** — where contact enquiries and quote requests arrive
   - **jobs@yourdomain** — where job applications arrive

> If your package only includes one mailbox, just create **info@** and skip
> **jobs@**. Job applications will go to **info@** instead. That's fine.

3. Make sure someone actually checks these. With no database behind the website,
   **the inbox is the record** — if an enquiry email is deleted, there's no other
   copy of it.

**Part 1 done.** You now have: the domain name, the FTP details, and the
mailboxes.

---

# Part 2 — Resend: sending email

The website needs permission to send email from your domain. Resend handles
that. The free plan allows 3,000 emails a month, far more than a contact form
will ever use.

## 2.1 — Create the account

1. Go to **resend.com** and click **Sign up**
2. Use a **company email address**, not a personal one — so the account can be
   handed over later if someone leaves
3. Confirm your email address when the verification message arrives

## 2.2 — Add your domain

1. In the left menu, click **Domains**
2. Click **Add Domain**
3. Type your domain exactly as it is — for example `flinkfreight.com`
   (no `www.`, no `https://`)
4. If you're offered a region, choose an **EU** one
5. Click **Add**

Resend now shows you a list of DNS records. **Leave this page open** — you need
it in the next step.

> **This step is not optional.** Until the domain is verified, Resend will only
> deliver email to the address you signed up with. Real customer enquiries
> would never arrive.

## 2.3 — Add the records at STRATO

Resend has just shown you three or four records. Each has a **Type** (like TXT
or MX), a **Name** (sometimes called Host), and a **Value**.

1. Open STRATO in another browser tab and go back to the DNS screen you found in
   step 1.3
2. Add each record from Resend, one at a time, copying the Type, Name and Value
   **exactly**
3. Save

**The mistake almost everyone makes here:** STRATO usually adds your domain name
automatically. So if Resend says the name is:

```
resend._domainkey.flinkfreight.com
```

you probably only need to type:

```
resend._domainkey
```

If you type the full thing, you end up with
`resend._domainkey.flinkfreight.com.flinkfreight.com`, which won't work. If
you're unsure, add it the short way first — that's right far more often.

> **Do not delete or change any existing MX record.** Those deliver mail *to*
> your mailboxes. Removing one stops your email from arriving. You're only
> adding new records here, never removing.

## 2.4 — Verify

1. Go back to the Resend tab
2. Click **Verify DNS Records**

If it doesn't work immediately, that's normal — DNS changes take time to spread.
At STRATO it's usually 15–30 minutes, occasionally a few hours. Have a coffee
and click Verify again.

Keep going until **every record shows as verified.** Partly verified is not
enough.

## 2.5 — Create the API key

1. In the left menu, click **API Keys**
2. Click **Create API Key**
3. Name it something like `Website`
4. For permission, choose **Sending access**
5. Click **Add**

A long key starting with `re_` appears.

> **Copy it now.** It's shown once and never again. If you lose it, you'll have
> to delete it and make a new one.

**Write down for Part 4:**

- **Setting 1 — `RESEND_API_KEY`** — the key starting with `re_`
- **Setting 2 — `RESEND_FROM_EMAIL`** — the address the website sends *from*,
  for example `noreply@flinkfreight.com`. It must use the domain you just
  verified. It does **not** need to be a real mailbox.
- **Setting 3 — `CONTACT_TO_EMAIL`** — `info@yourdomain` from step 1.5
- **Setting 4 — `CAREER_TO_EMAIL`** — `jobs@yourdomain` from step 1.5
  (skip if you only made one mailbox)

---

# Part 3 — Microsoft 365: file storage

When someone applies for a job, their CV needs to go somewhere. This connects
the website to your Microsoft 365 storage, so CVs and shipment photos land in
your company OneDrive and you get an email with a link to each one.

## Before you start

You need:

- An active **Microsoft 365 Business** subscription
- An account with **Global Administrator** rights — one step needs admin
  approval and simply cannot be done without it
- To know **which mailbox** will hold the files (a shared one like
  `operations@` is better than a personal one, so access doesn't disappear if
  someone leaves)

> **Do this first:** sign in to **onedrive.com** as that mailbox, just once.
> OneDrive is only created the first time someone signs in, and file uploads
> fail until it exists. This takes 30 seconds and prevents a confusing problem
> later.

## 3.1 — Open the admin portal

1. Go to **entra.microsoft.com**
2. Sign in as the **administrator** account
3. In the left menu, open **Applications** → **App registrations**

## 3.2 — Register the application

1. Click **New registration**
2. **Name:** `Flink Freight Website Uploads`
3. **Supported account types:** choose
   **Accounts in this organizational directory only**
4. **Redirect URI:** leave completely empty
5. Click **Register**

You'll land on the new application's overview page.

## 3.3 — Copy the two IDs

They're both on the overview page you're looking at now.

**Write down for Part 4:**

- **Setting 5 — `MS_GRAPH_TENANT_ID`** — shown as **Directory (tenant) ID**
- **Setting 6 — `MS_GRAPH_CLIENT_ID`** — shown as **Application (client) ID**

Both look like `a1b2c3d4-e5f6-7890-abcd-ef1234567890`.

> Careful: these two look almost identical. Label them clearly as you copy them.

## 3.4 — Create the password

1. In the left menu, click **Certificates & secrets**
2. Click **New client secret**
3. **Description:** `Website`
4. **Expires:** choose the **longest option available** (usually 24 months)
5. Click **Add**

A table row appears with two columns, **Value** and **Secret ID**.

> **Copy the "Value" column — not "Secret ID".** This is the single most
> common mistake in this whole guide. The Value is hidden permanently as soon
> as you leave the page, and it cannot be recovered — only replaced.

**Write down for Part 4:**

- **Setting 7 — `MS_GRAPH_CLIENT_SECRET`** — the **Value**

**Also note the expiry date in your calendar now.** When this expires, file
uploads stop working silently — forms still submit, files just stop arriving.
Set a reminder two weeks before.

## 3.5 — Give it permission to save files

1. In the left menu, click **API permissions**
2. Click **Add a permission**
3. Choose **Microsoft Graph**
4. Choose **Application permissions** — **not** Delegated permissions
5. In the search box type `Files.ReadWrite.All`
6. Tick the box next to it
7. Click **Add permissions**

> **Application vs Delegated:** Delegated means "acting for a signed-in person".
> The website runs on its own with nobody signed in, so it must be
> **Application permissions**. Picking the wrong one is a common cause of
> uploads failing later.

## 3.6 — Approve it (the step people forget)

You're still on the API permissions screen.

1. Click **Grant admin consent for [your organisation]**
2. Confirm

The Status column must change to a **green tick**.

> **If you skip this, nothing works.** Every setting can be perfectly correct
> and every upload will still be rejected. If the button is greyed out, your
> account doesn't have Global Administrator rights — you'll need someone who
> does.

## 3.7 — Choose where files go

**Write down for Part 4:**

- **Setting 8 — `MS_GRAPH_USER_EMAIL`** — the full address of the mailbox whose
  OneDrive stores the files, for example `operations@flinkfreight.com`

The website creates two folders there by itself:

- **CareerApplications** — CVs from the careers page
- **ContactUploads** — photos from the contact form

You don't need to create these.

---

# Part 4 — Send the settings back

## How to send them safely

Several of these are effectively passwords. The Microsoft secret gives access to
company files, the Resend key allows sending email as your company, and the FTP
password controls the website itself.

**Please don't send them in a plain email, WhatsApp, or a chat message.** Those
get forwarded, backed up and searched.

Pick one of these instead:

1. **Best — a password manager.** If you use 1Password, Bitwarden, Dashlane or
   similar, use its secure-sharing or "send" feature. It creates a link that
   expires after being opened.
2. **Good — a one-time secret service.** Free sites like *onetimesecret.com*
   create a link that self-destructs once read. Paste the values there and send
   the link.
3. **Acceptable — split it up.** Send the settings in one channel (say email)
   and the passwords in a completely different one (say a phone call or SMS).

Whichever you choose, **tell me when you've sent it** so I can collect it before
any link expires.

## The settings to send

Fill this in and send it across:

```
DOMAIN AND HOSTING (STRATO)
  Domain name             ______________________________
  Hosting package         ______________________________
  FTP host                ______________________________
  FTP username            ______________________________
  FTP password            ______________________________

EMAIL (Resend)
  1  RESEND_API_KEY       ______________________________
  2  RESEND_FROM_EMAIL    ______________________________
  3  CONTACT_TO_EMAIL     ______________________________
  4  CAREER_TO_EMAIL      ______________________________   (optional)

FILE STORAGE (Microsoft 365)
  5  MS_GRAPH_TENANT_ID     ______________________________
  6  MS_GRAPH_CLIENT_ID     ______________________________
  7  MS_GRAPH_CLIENT_SECRET ______________________________
  8  MS_GRAPH_USER_EMAIL    ______________________________
```

---

# Checklist

Tick these off before sending:

**STRATO**

- [ ] I can log in to the customer area
- [ ] I know my domain name and it's active
- [ ] I found the DNS screen and can add records there
- [ ] I have working FTP host, username and password
- [ ] `info@` mailbox exists (and `jobs@` if my package allows it)

**Resend**

- [ ] Account created with a company email address
- [ ] Domain added
- [ ] All DNS records added at STRATO
- [ ] Domain shows as **verified** — every record, not just some
- [ ] API key created and copied

**Microsoft 365**

- [ ] Signed in to onedrive.com once as the storage mailbox
- [ ] Application registered
- [ ] Tenant ID and Client ID copied (and clearly labelled)
- [ ] Client secret created and the **Value** copied
- [ ] `Files.ReadWrite.All` added as an **Application** permission
- [ ] **Admin consent granted — green tick showing**
- [ ] Expiry date of the secret saved in my calendar

**Sending**

- [ ] All eight settings written down
- [ ] Sent through a secure method, not plain email
- [ ] Told the developer it's on the way

---

# Things worth knowing

**Your existing email keeps working.** Resend only *sends* on behalf of your
domain. Receiving is untouched — your STRATO mailboxes carry on exactly as they
do now, as long as you don't delete any MX record.

**The inbox is the record.** There's no database behind this website. Every
enquiry and application arrives as an email with a link to any attached file. If
those emails get deleted, there's no second copy. Worth telling whoever manages
the inbox.

**One date to remember.** The Microsoft client secret from step 3.4 expires. It's
the only thing in this setup that stops working on its own with no warning. When
it does, forms will still appear to work — files just quietly stop arriving.
Renewing it takes five minutes if you catch it early.

**Nothing here costs money.** Resend's free plan and the Microsoft app
registration are both included at no extra cost. You're only paying for what you
already have: the domain, the hosting and the Microsoft 365 subscription.

---

*If a menu name in this guide doesn't quite match what you see, look for the
closest equivalent — STRATO and Microsoft both rename things from time to time.
When in doubt, send a screenshot rather than guessing.*
