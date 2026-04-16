/**
 * Slack Incoming Webhook poster for the incident-triage agent.
 *
 * Keeps to plain fetch so the module works in both the Next.js runtime and
 * in a standalone Node cron script.
 *
 * Required environment variables:
 *   SLACK_INCIDENT_WEBHOOK_URL - the Incoming Webhook URL
 *
 * Optional:
 *   SLACK_INCIDENT_CHANNEL     - overrides the channel configured on the
 *                                webhook (e.g. #support-incidents)
 */

import type { OutlookMessage } from "./outlook";

export interface IncidentAlert {
  /** Triage priority — P1 is most severe. */
  priority: "P1" | "P2" | "P3" | "P4";
  category: string;
  summary: string;
  suggestedActions: string[];
  customerImpact: string;
  message: OutlookMessage;
}

const PRIORITY_STYLE: Record<IncidentAlert["priority"], { color: string; emoji: string }> = {
  P1: { color: "#C4142B", emoji: "🚨" },
  P2: { color: "#E8762D", emoji: "⚠️" },
  P3: { color: "#F0B400", emoji: "🟡" },
  P4: { color: "#3A8DDE", emoji: "🔵" },
};

/**
 * Posts an incident alert to Slack via Incoming Webhook.
 * Returns the raw response text (Slack returns "ok" on success).
 */
export async function postIncidentAlert(alert: IncidentAlert): Promise<string> {
  const webhookUrl = requireEnv("SLACK_INCIDENT_WEBHOOK_URL");
  const channel = process.env.SLACK_INCIDENT_CHANNEL;

  const payload = buildPayload(alert, channel);

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Slack webhook failed (${res.status}): ${text}`);
  }
  return text;
}

function buildPayload(alert: IncidentAlert, channel?: string) {
  const { priority, category, summary, suggestedActions, customerImpact, message } = alert;
  const style = PRIORITY_STYLE[priority];
  const fromLabel = message.from.name
    ? `${message.from.name} <${message.from.address}>`
    : message.from.address;

  const actionLines = suggestedActions.length
    ? suggestedActions.map((a, i) => `${i + 1}. ${a}`).join("\n")
    : "_No suggested actions — investigate manually._";

  const blocks: Record<string, unknown>[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `${style.emoji} ${priority} incident: ${truncate(message.subject, 120)}`,
        emoji: true,
      },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Category*\n${category}` },
        { type: "mrkdwn", text: `*From*\n${fromLabel}` },
        {
          type: "mrkdwn",
          text: `*Received*\n<!date^${Math.floor(new Date(message.receivedDateTime).getTime() / 1000)}^{date_short_pretty} at {time}|${message.receivedDateTime}>`,
        },
        {
          type: "mrkdwn",
          text: `*Outlook importance*\n${message.importance}`,
        },
      ],
    },
    {
      type: "section",
      text: { type: "mrkdwn", text: `*Summary*\n${summary}` },
    },
    {
      type: "section",
      text: { type: "mrkdwn", text: `*Customer impact*\n${customerImpact}` },
    },
    {
      type: "section",
      text: { type: "mrkdwn", text: `*Suggested actions*\n${actionLines}` },
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: message.webLink
            ? `<${message.webLink}|Open in Outlook> · conversation \`${message.conversationId || message.id}\``
            : `conversation \`${message.conversationId || message.id}\``,
        },
      ],
    },
  ];

  return {
    // Fallback text for notifications/clients that can't render blocks.
    text: `${style.emoji} ${priority} ${category}: ${truncate(message.subject, 100)}`,
    username: "Support Incident Triage",
    icon_emoji: ":rotating_light:",
    ...(channel ? { channel } : {}),
    attachments: [
      {
        color: style.color,
        blocks,
      },
    ],
  };
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + "…";
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
