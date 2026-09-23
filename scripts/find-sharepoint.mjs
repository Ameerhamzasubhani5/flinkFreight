#!/usr/bin/env node
/**
 * Lists the SharePoint sites this app can see, and prints the exact
 * MS_GRAPH_SITE_HOSTNAME / MS_GRAPH_SITE_PATH values for each one.
 *
 *   node scripts/find-sharepoint.mjs
 *
 * Reads .env.local. Never prints the secret or the access token.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const envPath = resolve(process.cwd(), ".env.local");
if (!existsSync(envPath)) {
  console.error("✗ .env.local not found.");
  process.exit(1);
}
for (const line of readFileSync(envPath, "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (!m) continue;
  const v = m[2].trim();
  if (v) process.env[m[1]] = v;
}

const env = process.env;

// ── sign in ─────────────────────────────────────────────────────────────────
const tokenRes = await fetch(
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
const tokenBody = await tokenRes.json().catch(() => ({}));
if (!tokenRes.ok) {
  console.error(`✗ Sign-in failed (${tokenRes.status}): ${tokenBody.error_description?.split("\n")[0] ?? ""}`);
  process.exit(1);
}
console.log("✓ Signed in to Microsoft 365\n");

const token = tokenBody.access_token;
const authed = { Authorization: `Bearer ${token}` };

// ── what permissions were actually granted? ─────────────────────────────────
// The access token's payload lists them under `roles`. Decoding it locally
// reveals nothing secret; it just saves a trip to the Entra portal.
try {
  const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());
  const roles = payload.roles ?? [];
  console.log("Granted application permissions:");
  if (roles.length === 0) {
    console.log("  (none — admin consent has probably not been granted yet)");
  } else {
    for (const r of roles.sort()) console.log(`  • ${r}`);
  }
  const needed = ["Sites.Read.All", "Sites.ReadWrite.All", "Sites.FullControl.All"];
  if (!roles.some((r) => needed.includes(r))) {
    console.log("\n  ⚠ No Sites.* permission found. Add Sites.ReadWrite.All in Entra");
    console.log("    (Application permission) and click 'Grant admin consent'.");
  }
  console.log("");
} catch {
  /* token shape changed — not important */
}

// ── the tenant's root SharePoint host ───────────────────────────────────────
let hostname = null;
const rootRes = await fetch("https://graph.microsoft.com/v1.0/sites/root", { headers: authed });
if (rootRes.ok) {
  const root = await rootRes.json();
  hostname = root.siteCollection?.hostname ?? null;
  console.log(`Your SharePoint hostname:  ${hostname}`);
  console.log(`Root site display name:    ${root.displayName ?? "(none)"}\n`);
} else {
  console.log(`Could not read the root site (${rootRes.status}).`);
  if (rootRes.status === 403) {
    console.log("Add Sites.ReadWrite.All and grant admin consent, then re-run.\n");
    process.exit(1);
  }
}

// ── list every site the app can see ─────────────────────────────────────────
const listRes = await fetch("https://graph.microsoft.com/v1.0/sites?search=*", { headers: authed });
if (!listRes.ok) {
  console.log(`Could not list sites (${listRes.status}).`);
  if (listRes.status === 403) console.log("Missing Sites.* permission — see above.");
  process.exit(1);
}
const { value: sites = [] } = await listRes.json();

if (sites.length === 0) {
  console.log("No sites found. Create a SharePoint team site first, then re-run.");
  process.exit(0);
}

console.log(`Found ${sites.length} site${sites.length === 1 ? "" : "s"}. Use one of these:\n`);

for (const site of sites) {
  // webUrl looks like  https://contoso.sharepoint.com/sites/FlinkFreight
  let host = hostname, path = "";
  try {
    const u = new URL(site.webUrl);
    host = u.hostname;
    path = u.pathname.replace(/^\/+|\/+$/g, "");
  } catch {
    continue;
  }

  console.log(`  ${site.displayName || site.name || "(unnamed)"}`);
  console.log(`    ${site.webUrl}`);
  if (path) {
    console.log(`      MS_GRAPH_SITE_HOSTNAME=${host}`);
    console.log(`      MS_GRAPH_SITE_PATH=${path}`);
  } else {
    console.log(`      (root site — use a team site instead if you have one)`);
    console.log(`      MS_GRAPH_SITE_HOSTNAME=${host}`);
    console.log(`      MS_GRAPH_SITE_PATH=`);
  }
  console.log("");
}

console.log("Copy the pair you want into .env.local, then run:  npm run check");
