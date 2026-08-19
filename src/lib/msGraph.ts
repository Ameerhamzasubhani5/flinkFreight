// Minimal Microsoft Graph client for uploading files into a Microsoft 365
// OneDrive mailbox via app-only (client-credentials) auth. Deliberately
// dependency-free — token acquisition + upload are both a couple of plain
// fetch calls, so we skip pulling in @azure/msal-node or the Graph SDK.
//
// Setup (one-time, in the Microsoft 365 tenant's Entra ID / Azure AD):
//   1. Register an app, grant it the Graph application permission
//      Files.ReadWrite.All, and have an admin grant consent.
//   2. Put the tenant id, client id, client secret and the target mailbox's
//      email in MS_GRAPH_TENANT_ID / MS_GRAPH_CLIENT_ID /
//      MS_GRAPH_CLIENT_SECRET / MS_GRAPH_USER_EMAIL (.env.local).

interface UploadResult {
  id: string;
  webUrl: string;
}

let cachedToken: { value: string; expiresAt: number } | null = null;

export function isGraphConfigured(): boolean {
  return Boolean(
    process.env.MS_GRAPH_TENANT_ID &&
      process.env.MS_GRAPH_CLIENT_ID &&
      process.env.MS_GRAPH_CLIENT_SECRET &&
      process.env.MS_GRAPH_USER_EMAIL
  );
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
 * Uploads a file into the configured mailbox's OneDrive, under `folder`
 * (created automatically if missing). Uses a Graph upload session rather than
 * the simple PUT endpoint so it works uniformly regardless of file size —
 * the simple endpoint caps out at 4MB.
 */
export async function uploadToOneDrive(
  file: Buffer,
  filename: string,
  folder: string
): Promise<UploadResult> {
  const userEmail = process.env.MS_GRAPH_USER_EMAIL;
  if (!userEmail) {
    throw new Error("MS_GRAPH_USER_EMAIL is not set.");
  }

  const token = await getAccessToken();
  const safeName = filename.replace(/[\\/:*?"<>|]/g, "_");
  const path = `${folder}/${Date.now()}-${safeName}`;

  const sessionRes = await fetch(
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(userEmail)}/drive/root:/${path}:/createUploadSession`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ item: { "@microsoft.graph.conflictBehavior": "rename" } }),
    }
  );
  if (!sessionRes.ok) {
    throw new Error(`Failed to create Graph upload session: ${sessionRes.status} ${await sessionRes.text()}`);
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
    throw new Error(`Failed to upload file to OneDrive: ${uploadRes.status} ${await uploadRes.text()}`);
  }

  const item = (await uploadRes.json()) as { id: string; webUrl: string };
  return { id: item.id, webUrl: item.webUrl };
}
