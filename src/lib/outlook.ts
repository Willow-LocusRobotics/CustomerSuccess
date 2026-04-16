/**
 * Microsoft Graph (Outlook) integration for the incident-triage agent.
 *
 * Authenticates with client-credentials and reads messages from a shared
 * support mailbox. Kept deliberately dependency-free (plain fetch) so the
 * agent can run either from a Next.js route handler or as a standalone
 * Node script on a cron schedule.
 *
 * Required environment variables:
 *   MS_GRAPH_TENANT_ID      - Azure AD tenant id
 *   MS_GRAPH_CLIENT_ID      - Azure AD app (application) id
 *   MS_GRAPH_CLIENT_SECRET  - Azure AD app client secret
 *   MS_GRAPH_MAILBOX        - Mailbox UPN or object id (e.g. support@locus.com)
 *
 * The Azure AD app needs the `Mail.Read` Application permission
 * (plus `Mail.ReadWrite` if the agent should mark messages as read).
 */

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

export interface OutlookMessage {
  id: string;
  subject: string;
  bodyPreview: string;
  body: string;
  from: {
    name: string;
    address: string;
  };
  toRecipients: string[];
  receivedDateTime: string;
  conversationId: string;
  importance: "low" | "normal" | "high";
  hasAttachments: boolean;
  webLink?: string;
}

interface GraphMessageRaw {
  id: string;
  subject?: string;
  bodyPreview?: string;
  body?: { contentType: "text" | "html"; content: string };
  from?: { emailAddress?: { name?: string; address?: string } };
  toRecipients?: Array<{ emailAddress?: { address?: string } }>;
  receivedDateTime: string;
  conversationId?: string;
  importance?: "low" | "normal" | "high";
  hasAttachments?: boolean;
  webLink?: string;
}

// ---------------------------------------------------------------------------
// Token cache — the client-credentials token is valid for ~1 hour, so we
// reuse it across calls within the same process.
// ---------------------------------------------------------------------------

let cachedToken: { accessToken: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt - 60_000 > now) {
    return cachedToken.accessToken;
  }

  const tenantId = requireEnv("MS_GRAPH_TENANT_ID");
  const clientId = requireEnv("MS_GRAPH_CLIENT_ID");
  const clientSecret = requireEnv("MS_GRAPH_CLIENT_SECRET");

  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials",
  });

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Microsoft Graph token request failed (${res.status}): ${text}`
    );
  }

  const json = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };

  cachedToken = {
    accessToken: json.access_token,
    expiresAt: now + json.expires_in * 1000,
  };
  return json.access_token;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface FetchMessagesOptions {
  /** Max messages to pull per run. Default 25. */
  limit?: number;
  /** If true, only unread messages are returned (default true). */
  unreadOnly?: boolean;
  /** Only fetch messages newer than this ISO timestamp. */
  since?: string;
}

/**
 * Fetches recent messages from the configured support mailbox.
 */
export async function fetchMessages(
  opts: FetchMessagesOptions = {}
): Promise<OutlookMessage[]> {
  const { limit = 25, unreadOnly = true, since } = opts;
  const mailbox = requireEnv("MS_GRAPH_MAILBOX");
  const token = await getAccessToken();

  const filters: string[] = [];
  if (unreadOnly) filters.push("isRead eq false");
  if (since) filters.push(`receivedDateTime ge ${since}`);

  const params = new URLSearchParams();
  params.set("$top", String(Math.min(limit, 100)));
  params.set("$orderby", "receivedDateTime desc");
  params.set(
    "$select",
    "id,subject,bodyPreview,body,from,toRecipients,receivedDateTime,conversationId,importance,hasAttachments,webLink"
  );
  if (filters.length > 0) params.set("$filter", filters.join(" and "));

  const url = `${GRAPH_BASE}/users/${encodeURIComponent(mailbox)}/messages?${params}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Microsoft Graph messages request failed (${res.status}): ${text}`
    );
  }

  const json = (await res.json()) as { value: GraphMessageRaw[] };
  return json.value.map(normalizeMessage);
}

/**
 * Marks a message as read so the agent does not re-process it on the next run.
 * Requires `Mail.ReadWrite` on the Azure AD app registration.
 */
export async function markMessageRead(messageId: string): Promise<void> {
  const mailbox = requireEnv("MS_GRAPH_MAILBOX");
  const token = await getAccessToken();

  const url = `${GRAPH_BASE}/users/${encodeURIComponent(mailbox)}/messages/${encodeURIComponent(messageId)}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ isRead: true }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Microsoft Graph mark-read failed (${res.status}): ${text}`
    );
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeMessage(raw: GraphMessageRaw): OutlookMessage {
  const bodyContent = raw.body?.content ?? "";
  const plainBody =
    raw.body?.contentType === "html" ? stripHtml(bodyContent) : bodyContent;

  return {
    id: raw.id,
    subject: raw.subject ?? "(no subject)",
    bodyPreview: raw.bodyPreview ?? "",
    body: plainBody.trim(),
    from: {
      name: raw.from?.emailAddress?.name ?? "",
      address: raw.from?.emailAddress?.address ?? "",
    },
    toRecipients: (raw.toRecipients ?? [])
      .map((r) => r.emailAddress?.address ?? "")
      .filter(Boolean),
    receivedDateTime: raw.receivedDateTime,
    conversationId: raw.conversationId ?? "",
    importance: raw.importance ?? "normal",
    hasAttachments: raw.hasAttachments ?? false,
    webLink: raw.webLink,
  };
}

function stripHtml(html: string): string {
  // Minimal HTML → text cleanup. Good enough for classification; we keep the
  // original HTML available via the raw body if something needs it later.
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*\/?>(?=\s*)/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. See env.local.example.`
    );
  }
  return value;
}
