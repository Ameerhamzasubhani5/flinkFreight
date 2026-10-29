#!/usr/bin/env node
/**
 * Connection checker for the Microsoft 365 setup.
 *
 *   npm run check           — test everything, no files sent, no email sent
 *   npm run check -- --live — also upload a real test file and send a real email
 *
 * Reads .env.local. Never prints secret values.
 *
 * Everything the live site needs goes through one Microsoft 365 app
 * registration: Files.ReadWrite.All to file uploads, Mail.Send to send the
 * notifications. This script exercises both with the same credentials the
 * site will use, so a pass here means the site can do its job.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

// ── tiny .env parser ────────────────────────────────────────────────────────
// Next.js itself loads .env.local, .env.production and .env, in that order of
// precedence, so this checker looks in the same places rather than insisting on
// one filename — otherwise a correctly configured project fails the check for
// having put its values in a file Next reads perfectly well.
const ENV_CANDIDATES = [".env.local", ".env.production", ".env"];
const envPath = ENV_CANDIDATES.map((f) => resolve(process.cwd(), f)).find((p) =>
  existsSync(p)
);
if (!envPath) {
  console.error(
    `✗ No env file found. Looked for: ${ENV_CANDIDATES.join(", ")}.\n` +
      "  Copy .env.local.example to .env.local and fill it in."
  );
  quit(1);
}
console.log(`\nReading ${envPath.split(/[\\/]/).pop()}`);
for (const line of readFileSync(envPath, "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (!m) continue;
  let v = m[2].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  if (v) process.env[m[1]] = v;
}

const LIVE = process.argv.includes("--live");
const env = process.env;
let failed = false;

const ok = (m) => console.log(`  \x1b[32m✓\x1b[0m ${m}`);
const bad = (m) => { failed = true; console.log(`  \x1b[31m✗\x1b[0m ${m}`); };
const info = (m) => console.log(`    \x1b[90m${m}\x1b[0m`);
const head = (m) => console.log(`\n\x1b[1m${m}\x1b[0m`);

/**
 * Ends the run with the right exit status.
 *
 * Two things must be true at once: execution has to stop immediately (a failed
 * sign-in must not be followed by checks that assume it worked), and the process
 * must not call process.exit() while a fetch socket is still closing - on Windows
 * that trips an assertion inside libuv and makes a working script look crashed.
 *
 * So quit() throws a sentinel that the try/catch at the bottom of this file
 * swallows. Execution stops at the throw, exitCode carries the status, and Node
 * shuts down on its own once the sockets are done.
 */
class Done extends Error {}

function quit(code) {
  process.exitCode = code;
  throw new Done();
}

try {

// ── 1. required settings present ────────────────────────────────────────────
head("1. Settings in .env.local");

const required = [
  "MS_GRAPH_TENANT_ID",
  "MS_GRAPH_CLIENT_ID",
  "MS_GRAPH_CLIENT_SECRET",
  "MS_GRAPH_SENDER_EMAIL",
  "CONTACT_TO_EMAIL",
];
for (const key of required) {
  if (env[key]) ok(`${key} is set`);
  else bad(`${key} is MISSING`);
}

const useSharePoint = Boolean(env.MS_GRAPH_SITE_HOSTNAME);
if (useSharePoint) {
  ok(`Destination: SharePoint — ${env.MS_GRAPH_SITE_HOSTNAME}${env.MS_GRAPH_SITE_PATH ? "/" + env.MS_GRAPH_SITE_PATH : " (root site)"}`);
} else if (env.MS_GRAPH_USER_EMAIL) {
  ok(`Destination: OneDrive — ${env.MS_GRAPH_USER_EMAIL}`);
} else {
  bad("No destination set (need MS_GRAPH_SITE_HOSTNAME, or MS_GRAPH_USER_EMAIL)");
}

const careerFolder = env.MS_GRAPH_CAREER_FOLDER || "Web/CVs";
const contactFolder = env.MS_GRAPH_CONTACT_FOLDER || "Web/Queries/Transport Material";
info(`CVs        → ${careerFolder}`);
info(`Enquiries  → ${contactFolder}`);

if (env.MS_GRAPH_CLIENT_SECRET && /^[0-9a-f-]{36}$/i.test(env.MS_GRAPH_CLIENT_SECRET)) {
  bad('MS_GRAPH_CLIENT_SECRET looks like a GUID — you probably copied "Geheime ID" (Secret ID) instead of "Wert" (Value)');
}

if (failed) {
  console.log("\nFix the above before continuing.\n");
  quit(1);
}

// ── 2. legal pages ──────────────────────────────────────────────────────────
// Checked here, BEFORE anything touches Microsoft, on purpose: filling these
// in is a launch blocker unrelated to Graph, and every Microsoft section below
// exits the script on failure. Run last, this check stays invisible until the
// tenant is perfectly configured - which is exactly when nobody is looking for
// it any more.
head("2. Legal details (Impressum / Datenschutz)");

{
  // These are read out of the source file rather than the environment because
  // that is where they live — and shipping an Impressum full of placeholders
  // to a German business site is a legal problem, not a cosmetic one.
  const siteSrc = readFileSync(resolve(process.cwd(), "src/lib/site.ts"), "utf8");
  // Matches `field: TBD,` and `field: [TBD],` at the start of a line, which is
  // how every unfilled value in the `legal` block is written.
  const placeholders = (siteSrc.match(/^\s+\w+:\s*\[?TBD\]?,/gm) ?? []).length;

  if (placeholders === 0) {
    ok("All legal details filled in");
  } else {
    bad(`${placeholders} legal detail(s) still set to TBD in src/lib/site.ts`);
    info("Registered name, representatives, register court + number, VAT ID,");
    info("and the person responsible for content must all be filled in before launch.");
    info("They are rendered on /impressum and /datenschutz exactly as written.");
  }

  if (!env.NEXT_PUBLIC_SITE_URL) {
    bad("NEXT_PUBLIC_SITE_URL is not set");
    info("Without it the sitemap, canonical URLs and link-preview images all point at localhost.");
  } else if (!/^https:\/\//.test(env.NEXT_PUBLIC_SITE_URL)) {
    bad(`NEXT_PUBLIC_SITE_URL should start with https:// (got "${env.NEXT_PUBLIC_SITE_URL}")`);
  } else {
    ok(`Public URL: ${env.NEXT_PUBLIC_SITE_URL}`);
  }
}


// ── 2. Microsoft sign-in ────────────────────────────────────────────────────
head("3. Microsoft 365 sign-in");

let token;
{
  const res = await fetch(
    `https://login.microsoftonline.com/${env.MS_GRAPH_TENANT_ID}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: env.MS_GRAPH_CLIENT_ID,
        client_secret: env.MS_GRAPH_CLIENT_SECRET,
        scope: "https://graph.microsoft.com/.default",
        grant_type: "client_credentials",
      }),
    }
  );
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    bad(`Sign-in failed (${res.status}) — ${body.error_description?.split("\n")[0] ?? "unknown error"}`);
    if (body.error === "invalid_client") info("Wrong client secret, or you copied the Secret ID instead of the Value.");
    if (body.error === "unauthorized_client") info("Client ID does not match this tenant.");
    quit(1);
  }
  token = body.access_token;
  ok("Signed in — tenant, client ID and secret all accepted");
}

const authed = { Authorization: `Bearer ${token}` };

// ── 3. find the destination drive ───────────────────────────────────────────
head("4. Storage location");

let driveRoot;
if (useSharePoint) {
  const host = env.MS_GRAPH_SITE_HOSTNAME;
  const path = (env.MS_GRAPH_SITE_PATH ?? "").replace(/^\/+|\/+$/g, "");
  const siteUrl = path
    ? `https://graph.microsoft.com/v1.0/sites/${host}:/${path}`
    : `https://graph.microsoft.com/v1.0/sites/${host}`;
  const siteRes = await fetch(siteUrl, { headers: authed });
  if (!siteRes.ok) {
    bad(`SharePoint site not found (${siteRes.status})`);
    info(`Looked for: https://${host}/${path}`);
    if (siteRes.status === 403) info("Permission missing — add Sites.ReadWrite.All and grant admin consent.");
    if (siteRes.status === 404) info("Check the hostname and site path match the URL in your browser.");
    quit(1);
  }
  const site = await siteRes.json();
  ok(`Found site: ${site.displayName ?? path}`);

  const driveRes = await fetch(`https://graph.microsoft.com/v1.0/sites/${site.id}/drive`, { headers: authed });
  if (!driveRes.ok) {
    bad(`Could not open the document library (${driveRes.status})`);
    quit(1);
  }
  const drive = await driveRes.json();
  ok(`Document library: ${drive.name}`);
  driveRoot = `https://graph.microsoft.com/v1.0/drives/${drive.id}`;
} else {
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(env.MS_GRAPH_USER_EMAIL)}/drive`,
    { headers: authed }
  );
  if (!res.ok) {
    bad(`OneDrive not reachable (${res.status})`);
    if (res.status === 404) info("That user has no OneDrive yet — sign in to onedrive.com once as them.");
    if (res.status === 403) info("Permission missing — add Files.ReadWrite.All and grant admin consent.");
    quit(1);
  }
  ok("OneDrive reachable");
  driveRoot = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(env.MS_GRAPH_USER_EMAIL)}/drive`;
}

// ── 4. folders ──────────────────────────────────────────────────────────────
head("5. Folder structure");

async function ensureFolders(folderPath) {
  let parent = "";
  for (const segment of folderPath.split("/").filter(Boolean)) {
    const url = parent
      ? `${driveRoot}/root:/${encodeURI(parent)}:/children`
      : `${driveRoot}/root/children`;
    const res = await fetch(url, {
      method: "POST",
      headers: { ...authed, "Content-Type": "application/json" },
      body: JSON.stringify({ name: segment, folder: {}, "@microsoft.graph.conflictBehavior": "fail" }),
    });
    if (!res.ok && res.status !== 409) {
      bad(`Could not create "${segment}" in ${folderPath} (${res.status})`);
      info((await res.text()).slice(0, 200));
      return false;
    }
    parent = parent ? `${parent}/${segment}` : segment;
  }
  ok(`${folderPath}`);
  return true;
}

const foldersOk = (await ensureFolders(careerFolder)) && (await ensureFolders(contactFolder));
if (!foldersOk) quit(1);

// ── 5. upload ───────────────────────────────────────────────────────────────
head("6. File upload");

if (!LIVE) {
  info("skipped — re-run with --live to upload a real test file");
} else {
  const content = Buffer.from(
    `Flink Freight setup check\nUploaded ${new Date().toISOString()}\nSafe to delete.\n`
  );
  const name = `setup-check-${Date.now()}.txt`;
  const full = `${careerFolder}/${name}`;

  const sessionRes = await fetch(`${driveRoot}/root:/${encodeURI(full)}:/createUploadSession`, {
    method: "POST",
    headers: { ...authed, "Content-Type": "application/json" },
    body: JSON.stringify({ item: { "@microsoft.graph.conflictBehavior": "rename" } }),
  });
  if (!sessionRes.ok) {
    bad(`Upload session failed (${sessionRes.status})`);
    info((await sessionRes.text()).slice(0, 300));
    quit(1);
  }
  const { uploadUrl } = await sessionRes.json();

  const put = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Length": String(content.byteLength),
      "Content-Range": `bytes 0-${content.byteLength - 1}/${content.byteLength}`,
    },
    body: new Uint8Array(content),
  });
  if (!put.ok) {
    bad(`Upload failed (${put.status})`);
    info((await put.text()).slice(0, 300));
    quit(1);
  }
  const item = await put.json();
  ok(`Uploaded ${name}`);
  info(item.webUrl);
}

// ── 6. email ────────────────────────────────────────────────────────────────
head("7. Email (Microsoft 365)");

{
  const sender = env.MS_GRAPH_SENDER_EMAIL;
  const recipients = (env.CONTACT_TO_EMAIL ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const careerRecipients = (env.CAREER_TO_EMAIL ?? "").split(",").map((s) => s.trim()).filter(Boolean);

  // The sender must be a real, licensed mailbox — Graph will not send as an
  // address that only exists as an alias or a distribution list.
  const mailboxRes = await fetch(
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(sender)}?$select=displayName,mail,userPrincipalName`,
    { headers: authed }
  );

  if (mailboxRes.ok) {
    const mailbox = await mailboxRes.json();
    ok(`Sender mailbox exists: ${mailbox.displayName ?? sender}`);
  } else if (mailboxRes.status === 403) {
    // Reading the directory needs User.Read.All, which the site does not use.
    // Not being able to look the mailbox up says nothing about Mail.Send.
    info("Cannot read the directory (User.Read.All not granted) — skipping the mailbox lookup.");
    info("This is fine: the site never reads the directory. --live is the real test.");
  } else {
    bad(`Sender mailbox "${sender}" not found (${mailboxRes.status})`);
    info("MS_GRAPH_SENDER_EMAIL must be a licensed mailbox in this tenant, not an alias or a group.");
  }

  info(`Enquiries → ${recipients.join(", ") || "(none set)"}`);
  info(`Applications → ${(careerRecipients.length ? careerRecipients : recipients).join(", ") || "(none set)"}${careerRecipients.length ? "" : "  [falling back to CONTACT_TO_EMAIL]"}`);

  if (!LIVE) {
    info("send test skipped — re-run with --live to send a real email");
  } else {
    const res = await fetch(
      `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(sender)}/sendMail`,
      {
        method: "POST",
        headers: { ...authed, "Content-Type": "application/json" },
        body: JSON.stringify({
          message: {
            subject: "Flink Freight — setup check",
            body: {
              contentType: "HTML",
              content: "<p>If you can read this, the website can send email. Safe to delete.</p>",
            },
            toRecipients: recipients.map((address) => ({ emailAddress: { address } })),
          },
          saveToSentItems: true,
        }),
      }
    );

    if (res.ok) {
      ok(`Test email sent to ${recipients.join(", ")} — check the inbox (and the spam folder)`);
    } else {
      const detail = await res.text();
      bad(`Test email failed (${res.status})`);
      if (res.status === 403) {
        info("Mail.Send is missing, or admin consent was never granted. Entra ID →");
        info("App registrations → your app → API permissions → Mail.Send (Application) → Grant admin consent.");
      }
      if (res.status === 404) {
        info(`No mailbox for "${sender}". It must be licensed for Exchange Online.`);
      }
      info(detail.slice(0, 300));
    }
  }
}

// ── done ────────────────────────────────────────────────────────────────────
console.log(
  failed
    ? "\n\x1b[31mSome checks failed.\x1b[0m See the notes above.\n"
    : `\n\x1b[32mAll checks passed.\x1b[0m${LIVE ? "" : " Re-run with --live for a real upload and email.\n"}\n`
);
quit(failed ? 1 : 0);

} catch (err) {
  // Done just means quit() was called - the reason was already printed.
  if (!(err instanceof Done)) throw err;
}

