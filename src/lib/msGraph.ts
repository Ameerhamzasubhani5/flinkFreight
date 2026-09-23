// Minimal Microsoft Graph client for uploading files into Microsoft 365 via
// app-only (client-credentials) auth. Deliberately dependency-free — token
// acquisition and upload are both a few plain fetch calls, so we skip pulling
// in @azure/msal-node or the Graph SDK.
//
// Two destinations are supported, chosen by which variables are set:
//
//   SharePoint (preferred) — files land in a team site's document library.
//     Set MS_GRAPH_SITE_HOSTNAME + MS_GRAPH_SITE_PATH. The site belongs to the
//     company rather than one person, so access survives staff changes.
//
//   OneDrive (fallback) — files land in one mailbox's personal drive.
//     Set MS_GRAPH_USER_EMAIL.
//
// The same client also sends the notification emails (see sendMailViaGraph),
// so Microsoft 365 covers both storage and mail and no third-party email
// service is needed.
//
// Setup (one-time, in the tenant's Entra ID):
//   1. Register an app; grant the Graph APPLICATION permissions
//      Files.ReadWrite.All (storage) and Mail.Send (email), then have an
//      administrator click "Grant admin consent".
//   2. Put the tenant id, client id and client secret ("Wert" / Value, not
//      "Geheime ID" / Secret ID) in .env.local.

interface UploadResult {
  id: string;
  webUrl: string;
}

export interface GraphMailOptions {
  to: string[];
  subject: string;
  html: string;
  /** Address the team replies to — the person who filled in the form. */
  replyTo?: string;
}

let cachedToken: { value: string; expiresAt: number } | null = null;
let cachedDriveId: { value: string; expiresAt: number } | null = null;

/** True when credentials plus at least one destination are configured. */
export function isGraphConfigured(): boolean {
  const hasCredentials = Boolean(
    process.env.MS_GRAPH_TENANT_ID &&
      process.env.MS_GRAPH_CLIENT_ID &&
      process.env.MS_GRAPH_CLIENT_SECRET
  );
  return hasCredentials && Boolean(sharePointTarget() || process.env.MS_GRAPH_USER_EMAIL);
}

/**
 * SharePoint destination. Only the hostname is required — leaving the path
 * empty targets that hostname's root site, which is what a tenant gets by
 * default before anyone creates a team site.
 */
function sharePointTarget(): { hostname: string; sitePath: string } | null {
  const hostname = process.env.MS_GRAPH_SITE_HOSTNAME;
  if (!hostname) return null;
  const sitePath = (process.env.MS_GRAPH_SITE_PATH ?? "").replace(/^\/+|\/+$/g, "");
  return { hostname, sitePath };
}

async function getAccessToken(): Promise<string> {
  const tenantId = process.env.MS_GRAPH_TENANT_ID;
  const clientId = process.env.MS_GRAPH_CLIENT_ID;
  const clientSecret = process.env.MS_GRAPH_CLIENT_SECRET;
  if (!tenantId || !clientId || !clientSecret) {
    throw new Error(
      "Microsoft Graph is not configured. Set MS_GRAPH_TENANT_ID, MS_GRAPH_CLIENT_ID and MS_GRAPH_CLIENT_SECRET."
    );
  }

  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.value;
  }

  const res = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      scope: "https://graph.microsoft.com/.default",
      grant_type: "client_credentials",
    }),
  });

  if (!res.ok) {
    throw new Error(`Microsoft Graph auth failed: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return cachedToken.value;
}

/**
 * Resolves the Graph API prefix for the drive that receives uploads —
 * a SharePoint document library when configured, otherwise a OneDrive.
 * The SharePoint site lookup is cached because it never changes in practice.
 */
async function getDriveRoot(token: string): Promise<string> {
  const site = sharePointTarget();

  if (!site) {
    const userEmail = process.env.MS_GRAPH_USER_EMAIL;
    if (!userEmail) {
      throw new Error(
        "No upload destination configured. Set MS_GRAPH_SITE_HOSTNAME + MS_GRAPH_SITE_PATH (SharePoint) or MS_GRAPH_USER_EMAIL (OneDrive)."
      );
    }
    return `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(userEmail)}/drive`;
  }

  if (cachedDriveId && cachedDriveId.expiresAt > Date.now()) {
    return `https://graph.microsoft.com/v1.0/drives/${cachedDriveId.value}`;
  }

  // Look the site up by hostname (+ server-relative path for a team site),
  // then take its default document library.
  const siteUrl = site.sitePath
    ? `https://graph.microsoft.com/v1.0/sites/${site.hostname}:/${site.sitePath}`
    : `https://graph.microsoft.com/v1.0/sites/${site.hostname}`;

  const siteRes = await fetch(siteUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!siteRes.ok) {
    throw new Error(
      `Could not find the SharePoint site "${site.hostname}/${site.sitePath}": ${siteRes.status} ${await siteRes.text()}`
    );
  }
  const { id: siteId } = (await siteRes.json()) as { id: string };

  const driveRes = await fetch(`https://graph.microsoft.com/v1.0/sites/${siteId}/drive`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!driveRes.ok) {
    throw new Error(
      `Could not open the document library for that SharePoint site: ${driveRes.status} ${await driveRes.text()}`
    );
  }
  const { id: driveId } = (await driveRes.json()) as { id: string };

  cachedDriveId = { value: driveId, expiresAt: Date.now() + 60 * 60 * 1000 };
  return `https://graph.microsoft.com/v1.0/drives/${driveId}`;
}

/**
 * Creates each folder in `folderPath` that doesn't exist yet, one level at a
 * time. Graph will happily create a file at a deep path, but doing this
 * explicitly means the folder tree exists even before the first submission —
 * so the team can see the structure straight away.
 */
async function ensureFolderPath(driveRoot: string, token: string, folderPath: string) {
  const segments = folderPath.split("/").filter(Boolean);
  let parent = "";

  for (const segment of segments) {
    const parentRef = parent
      ? `${driveRoot}/root:/${encodeURI(parent)}:/children`
      : `${driveRoot}/root/children`;

    const res = await fetch(parentRef, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        name: segment,
        folder: {},
        // Already there? Leave it alone rather than making "Folder 1".
        "@microsoft.graph.conflictBehavior": "fail",
      }),
    });

    // 409 = it already exists, which is the normal case after the first run.
    if (!res.ok && res.status !== 409) {
      throw new Error(
        `Could not create folder "${segment}": ${res.status} ${await res.text()}`
      );
    }

    parent = parent ? `${parent}/${segment}` : segment;
  }
}

/**
 * Uploads a file to `folderPath` in the configured destination, creating the
 * folder tree if needed. Uses an upload session rather than the simple PUT
 * endpoint so it behaves the same at any size — simple PUT caps out at 4MB.
 */
export async function uploadToOneDrive(
  file: Buffer,
  filename: string,
  folderPath: string
): Promise<UploadResult> {
  const token = await getAccessToken();
  const driveRoot = await getDriveRoot(token);

  await ensureFolderPath(driveRoot, token, folderPath);

  // Strip characters SharePoint and OneDrive reject in file names, and prefix
  // a timestamp so two applicants sending "CV.pdf" don't collide.
  const safeName = filename.replace(/[\\/:*?"<>|#%]/g, "_");
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  const fullPath = `${folderPath}/${stamp}-${safeName}`;

  const sessionRes = await fetch(
    `${driveRoot}/root:/${encodeURI(fullPath)}:/createUploadSession`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ item: { "@microsoft.graph.conflictBehavior": "rename" } }),
    }
  );
  if (!sessionRes.ok) {
    throw new Error(
      `Failed to create Graph upload session: ${sessionRes.status} ${await sessionRes.text()}`
    );
  }
  const { uploadUrl } = (await sessionRes.json()) as { uploadUrl: string };

  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Length": String(file.byteLength),
      "Content-Range": `bytes 0-${file.byteLength - 1}/${file.byteLength}`,
    },
    body: new Uint8Array(file),
  });
  if (!uploadRes.ok) {
    throw new Error(
      `Failed to upload the file: ${uploadRes.status} ${await uploadRes.text()}`
    );
  }

  const item = (await uploadRes.json()) as { id: string; webUrl: string };
  return { id: item.id, webUrl: item.webUrl };
}

/** The mailbox notifications are sent from. Must be a real, licensed mailbox. */
export function graphSenderAddress(): string | undefined {
  return process.env.MS_GRAPH_SENDER_EMAIL;
}

/** True when Graph is configured well enough to send mail. */
export function isGraphMailConfigured(): boolean {
  return Boolean(
    process.env.MS_GRAPH_TENANT_ID &&
      process.env.MS_GRAPH_CLIENT_ID &&
      process.env.MS_GRAPH_CLIENT_SECRET &&
      graphSenderAddress()
  );
}

/**
 * Sends an email through Microsoft 365 as MS_GRAPH_SENDER_EMAIL.
 *
 * Uses the same app-only credentials as the file uploads, so there is no
 * separate email provider, API key or domain verification to maintain — the
 * mailbox's own SPF/DKIM (already set up for Microsoft 365) authenticates it.
 *
 * Requires the Graph APPLICATION permission Mail.Send with admin consent.
 * Graph answers 202 Accepted with an empty body on success.
 */
export async function sendMailViaGraph({ to, subject, html, replyTo }: GraphMailOptions) {
  const sender = graphSenderAddress();
  if (!sender) {
    throw new Error("MS_GRAPH_SENDER_EMAIL is not set — cannot send mail.");
  }
  if (to.length === 0) {
    throw new Error("No recipients supplied — cannot send mail.");
  }

  const token = await getAccessToken();

  const res = await fetch(
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(sender)}/sendMail`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        message: {
          subject,
          body: { contentType: "HTML", content: html },
          toRecipients: to.map((address) => ({ emailAddress: { address } })),
          ...(replyTo
            ? { replyTo: [{ emailAddress: { address: replyTo } }] }
            : {}),
        },
        // Keep a copy in the sender's Sent Items so there is a visible audit
        // trail of what the website sent.
        saveToSentItems: true,
      }),
    }
  );

  if (!res.ok) {
    const detail = await res.text();
    // 403 here almost always means Mail.Send is missing or not consented.
    throw new Error(`Microsoft Graph refused to send the email: ${res.status} ${detail}`);
  }
}
