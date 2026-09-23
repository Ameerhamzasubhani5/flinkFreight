#!/usr/bin/env node
/**
 * Connection checker for the Microsoft 365 and Resend setup.
 *
 *   npm run check          — test everything, no files sent, no email sent
 *   npm run check -- --live — also upload a real test file and send a real email
 *
 * Reads .env.local. Never prints secret values.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

// ── tiny .env parser ────────────────────────────────────────────────────────
const envPath = resolve(process.cwd(), ".env.local");
if (!existsSync(envPath)) {
  console.error("✗ .env.local not found. Copy .env.local.example to .env.local and fill it in.");
  process.exit(1);
}
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

// ── 1. required settings present ────────────────────────────────────────────
head("1. Settings in .env.local");

const required = [
  "MS_GRAPH_TENANT_ID",
  "MS_GRAPH_CLIENT_ID",
  "MS_GRAPH_CLIENT_SECRET",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
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
  process.exit(1);
}

// ── 2. Microsoft sign-in ────────────────────────────────────────────────────
head("2. Microsoft 365 sign-in");

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
    process.exit(1);
  }
  token = body.access_token;
  ok("Signed in — tenant, client ID and secret all accepted");
}

const authed = { Authorization: `Bearer ${token}` };

// ── 3. find the destination drive ───────────────────────────────────────────
head("3. Storage location");

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
    process.exit(1);
  }
  const site = await siteRes.json();
  ok(`Found site: ${site.displayName ?? path}`);

  const driveRes = await fetch(`https://graph.microsoft.com/v1.0/sites/${site.id}/drive`, { headers: authed });
  if (!driveRes.ok) {
    bad(`Could not open the document library (${driveRes.status})`);
    process.exit(1);
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
    process.exit(1);
  }
  ok("OneDrive reachable");
  driveRoot = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(env.MS_GRAPH_USER_EMAIL)}/drive`;
}

// ── 4. folders ──────────────────────────────────────────────────────────────
head("4. Folder structure");

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
if (!foldersOk) process.exit(1);

// ── 5. upload ───────────────────────────────────────────────────────────────
head("5. File upload");

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
    process.exit(1);
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
    process.exit(1);
  }
  const item = await put.json();
  ok(`Uploaded ${name}`);
  info(item.webUrl);
}

// ── 6. email ────────────────────────────────────────────────────────────────
head("6. Email (Resend)");

{
  const fromDomain = env.RESEND_FROM_EMAIL.split("@")[1];

  // A send-only key (the correct kind for this site) cannot list domains, so
  // treat Resend's "restricted" response as proof the key is valid — the only
  // real test for such a key is actually sending, which --live does.
  const probe = await fetch("https://api.resend.com/domains", {
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}` },
  });
  const probeBody = await probe.json().catch(() => ({}));

  let domainStatusKnown = false;

  if (probe.ok) {
    ok("API key accepted (full access)");
    const list = probeBody.data ?? [];
    const match = list.find((d) => d.name === fromDomain);
    domainStatusKnown = true;
    if (!match) {
      bad(`Domain "${fromDomain}" is not registered in Resend`);
      info(`Registered: ${list.map((d) => d.name).join(", ") || "none"}`);
    } else if (match.status !== "verified") {
      bad(`Domain "${fromDomain}" is not verified yet (status: ${match.status})`);
      info("Add the DNS records at STRATO, then press Verify in Resend.");
    } else {
      ok(`Domain "${fromDomain}" is verified`);
    }
  } else if (probeBody.name === "restricted_api_key") {
    ok("API key accepted (send-only — the correct kind for this site)");
    info(`Cannot read domain status with a send-only key; sending is the real test.`);
  } else {
    bad(`Resend key rejected (${probe.status}) — ${probeBody.message ?? "unknown error"}`);
    process.exit(1);
  }

  const recipients = (env.CONTACT_TO_EMAIL ?? "").split(",").map((s) => s.trim()).filter(Boolean);

  if (!LIVE) {
    info("send test skipped — re-run with --live to send a real email");
  } else {
    const send = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: `Flink Freight <${env.RESEND_FROM_EMAIL}>`,
        to: recipients,
        subject: "Flink Freight — setup check",
        html: "<p>If you can read this, the website can send email. Safe to delete.</p>",
      }),
    });
    const sendBody = await send.json().catch(() => ({}));
    if (!send.ok) {
      bad(`Test email failed (${send.status}) — ${sendBody.message ?? ""}`);
      if (/domain is not verified/i.test(sendBody.message ?? "")) {
        info(`"${fromDomain}" is not verified in Resend yet. Add its DNS records at STRATO and press Verify.`);
      }
    } else {
      ok(`Test email sent to ${recipients.join(", ")} — check the inbox (and spam)`);
      if (!domainStatusKnown) info("Delivery proves the domain is verified.");
    }
  }
}

// ── done ────────────────────────────────────────────────────────────────────
console.log(
  failed
    ? "\n\x1b[31mSome checks failed.\x1b[0m See the notes above.\n"
    : `\n\x1b[32mAll checks passed.\x1b[0m${LIVE ? "" : " Re-run with --live for a real upload and email.\n"}\n`
);
process.exit(failed ? 1 : 0);
