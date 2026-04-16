/**
 * Incident triage agent.
 *
 * Reads unread emails from the configured Outlook mailbox, asks Claude to
 * classify each one as an incident (priority + category + summary +
 * suggested actions), and posts high-priority incidents to Slack.
 *
 * Motivation (from the design discussion in Teams):
 *   Rashed wanted a Zapier + Outlook + Slack + OpenAI flow to escalate
 *   high-priority incoming support emails in Slack. Willow flagged OpenAI
 *   as not privacy-safe — customer data must stay in a protected LLM.
 *   This implementation uses Anthropic (Claude) instead, called directly
 *   over HTTPS with no third-party relay.
 *
 * Execution:
 *   - From a Next.js route handler (POST /api/agents/incident-triage), or
 *   - From a cron job via `npm run agent:incident-triage`.
 */

import Anthropic from "@anthropic-ai/sdk";
import {
  fetchMessages,
  markMessageRead,
  type OutlookMessage,
} from "./outlook";
import { postIncidentAlert, type IncidentAlert } from "./slack";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Priority = "P1" | "P2" | "P3" | "P4";

export interface TriageDecision {
  isIncident: boolean;
  priority: Priority;
  category: string;
  summary: string;
  suggestedActions: string[];
  customerImpact: string;
  confidence: "high" | "medium" | "low";
  reasoning: string;
}

export interface ProcessedEmail {
  messageId: string;
  subject: string;
  from: string;
  receivedAt: string;
  decision: TriageDecision;
  alerted: boolean;
  alertError?: string;
}

export interface AgentRunResult {
  mailbox: string;
  startedAt: string;
  finishedAt: string;
  totalFetched: number;
  totalProcessed: number;
  totalAlerted: number;
  processed: ProcessedEmail[];
  errors: Array<{ messageId?: string; error: string }>;
}

export interface RunAgentOptions {
  /** Max messages to triage on this run. Default 25. */
  limit?: number;
  /**
   * If true, the agent marks processed messages as read in Outlook so they
   * are not re-triaged on the next run. Requires Mail.ReadWrite on the
   * Azure AD app. Default: true.
   */
  markRead?: boolean;
  /**
   * Priorities that trigger a Slack alert. Default: ["P1", "P2"].
   */
  alertPriorities?: Priority[];
  /**
   * If true, Claude classifies emails but no Slack alerts are posted and
   * no messages are marked as read. Useful for local development.
   */
  dryRun?: boolean;
  /** Model override. Default claude-opus-4-6. */
  model?: string;
}

// ---------------------------------------------------------------------------
// System prompt — cached across runs. Keep it frozen (no timestamps, no per-
// run data) so the cache key stays stable.
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are the Locus Robotics Support Triage Agent. You read incoming customer \
support emails and classify each one so that the on-call team is alerted to \
high-priority incidents in Slack within minutes of the email landing.

Your classifications must be consistent, conservative, and grounded in the \
email content. Never invent facts that are not in the email. If a field is \
genuinely unknowable from the email, say so explicitly in the reasoning.

You are deployed inside Locus Robotics infrastructure. Customer data shown to \
you stays on Locus systems — do not attempt to access external resources.

PRIORITY RUBRIC

P1 — Critical / fleet-down
  - Multiple robots or an entire site are down, offline, or unsafe.
  - Production is fully or severely halted.
  - Safety incident involving a robot and a person.
  - Security incident (unauthorized access, data breach, ransomware signals).

P2 — High / major degradation
  - A single robot is down and blocking operations.
  - Major subsystem failing (charging, picking workflow, LocusHub auth).
  - A customer-visible SLA is at immediate risk.
  - Strong language from a customer ("urgent", "escalate", "emergency")
    combined with a concrete operational impact.

P3 — Normal support request
  - Single robot behaving oddly but site is operational.
  - Configuration or how-to question.
  - Non-urgent defect report.

P4 — Informational / low
  - Thank-yous, acknowledgements, out-of-office, newsletters, marketing.
  - Anything that is not a support request at all.

CATEGORY
Pick the best short label (2–4 words) describing the nature of the issue,
for example:
  "Fleet down", "Single robot offline", "Charging failure",
  "LocusHub login", "Pick workflow error", "Network / VPN",
  "Firmware / software update", "Safety incident", "Security incident",
  "General how-to", "Administrative", "Non-incident".

RULES
- Emit exactly one call to the \`triage_email\` tool per email, and nothing else.
- isIncident=false only for P4 non-incident traffic (marketing, thank-yous,
  OOO, etc.). P1–P3 are all incidents.
- suggestedActions: 1–4 short, action-oriented steps for the on-call engineer
  (who to page, what to check first, which runbook).
- confidence: "high" when the email is unambiguous, "medium" when you had to
  infer intent, "low" when the email is vague enough that a human should
  double-check.
- Never include PII or full customer names in suggestedActions — keep them to
  operational steps.`;

// ---------------------------------------------------------------------------
// Tool definition — the classifier returns structured triage output via a
// forced tool call. Schema mirrors `TriageDecision` above.
// ---------------------------------------------------------------------------

const TRIAGE_TOOL: Anthropic.Tool = {
  name: "triage_email",
  description:
    "Record the triage decision for the customer support email shown in this turn.",
  input_schema: {
    type: "object",
    properties: {
      isIncident: {
        type: "boolean",
        description:
          "True when the email represents any real support incident (P1–P3). False only for non-incident traffic (marketing, thank-yous, OOO, etc).",
      },
      priority: {
        type: "string",
        enum: ["P1", "P2", "P3", "P4"],
        description: "Triage priority per the rubric.",
      },
      category: {
        type: "string",
        description: "Short 2–4 word label describing the issue.",
      },
      summary: {
        type: "string",
        description:
          "One-to-three sentence neutral summary of the situation, grounded in the email.",
      },
      suggestedActions: {
        type: "array",
        items: { type: "string" },
        description:
          "1–4 short operational steps for the on-call engineer. Avoid PII.",
      },
      customerImpact: {
        type: "string",
        description:
          "One sentence describing the customer-facing business impact (e.g. 'Site X is at 40% throughput, manual picking in effect').",
      },
      confidence: {
        type: "string",
        enum: ["high", "medium", "low"],
        description:
          "How confident you are in this classification given the content of the email.",
      },
      reasoning: {
        type: "string",
        description:
          "Brief explanation of why you chose this priority. Do not include customer PII beyond what is unavoidable.",
      },
    },
    required: [
      "isIncident",
      "priority",
      "category",
      "summary",
      "suggestedActions",
      "customerImpact",
      "confidence",
      "reasoning",
    ],
    additionalProperties: false,
  },
};

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export async function runIncidentTriageAgent(
  opts: RunAgentOptions = {}
): Promise<AgentRunResult> {
  const startedAt = new Date().toISOString();
  const mailbox = process.env.MS_GRAPH_MAILBOX ?? "(unset)";

  const limit = opts.limit ?? parseIntEnv("INCIDENT_AGENT_MAX_EMAILS", 25);
  const markRead = opts.markRead ?? true;
  const dryRun = opts.dryRun ?? false;
  const alertPriorities =
    opts.alertPriorities ?? parseAlertPriorities(process.env.INCIDENT_AGENT_ALERT_PRIORITIES);
  const model =
    opts.model ?? process.env.INCIDENT_AGENT_MODEL ?? "claude-opus-4-6";

  const client = new Anthropic();

  const errors: AgentRunResult["errors"] = [];
  const processed: ProcessedEmail[] = [];

  let messages: OutlookMessage[] = [];
  try {
    messages = await fetchMessages({ limit, unreadOnly: true });
  } catch (error) {
    errors.push({ error: `Failed to fetch mailbox: ${formatError(error)}` });
    return {
      mailbox,
      startedAt,
      finishedAt: new Date().toISOString(),
      totalFetched: 0,
      totalProcessed: 0,
      totalAlerted: 0,
      processed,
      errors,
    };
  }

  for (const message of messages) {
    try {
      const decision = await classify(client, model, message);
      let alerted = false;
      let alertError: string | undefined;

      const shouldAlert =
        !dryRun &&
        decision.isIncident &&
        alertPriorities.includes(decision.priority);

      if (shouldAlert) {
        try {
          const alert: IncidentAlert = {
            priority: decision.priority,
            category: decision.category,
            summary: decision.summary,
            suggestedActions: decision.suggestedActions,
            customerImpact: decision.customerImpact,
            message,
          };
          await postIncidentAlert(alert);
          alerted = true;
        } catch (error) {
          alertError = formatError(error);
          errors.push({ messageId: message.id, error: `Slack post failed: ${alertError}` });
        }
      }

      if (!dryRun && markRead) {
        try {
          await markMessageRead(message.id);
        } catch (error) {
          // Non-fatal — we still record the triage decision.
          errors.push({
            messageId: message.id,
            error: `Mark-as-read failed: ${formatError(error)}`,
          });
        }
      }

      processed.push({
        messageId: message.id,
        subject: message.subject,
        from: message.from.address,
        receivedAt: message.receivedDateTime,
        decision,
        alerted,
        alertError,
      });
    } catch (error) {
      errors.push({
        messageId: message.id,
        error: `Triage failed: ${formatError(error)}`,
      });
    }
  }

  const finishedAt = new Date().toISOString();
  return {
    mailbox,
    startedAt,
    finishedAt,
    totalFetched: messages.length,
    totalProcessed: processed.length,
    totalAlerted: processed.filter((p) => p.alerted).length,
    processed,
    errors,
  };
}

// ---------------------------------------------------------------------------
// Claude call — forces the triage_email tool so we always get structured
// output, and caches the frozen system prompt + tool definitions.
// ---------------------------------------------------------------------------

async function classify(
  client: Anthropic,
  model: string,
  message: OutlookMessage
): Promise<TriageDecision> {
  const userContent = renderEmailForModel(message);

  const response = await client.messages.create({
    model,
    max_tokens: 1024,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        // Cache the frozen prefix — system prompt + tool defs — across calls.
        // Render order is tools → system → messages, so a marker on the last
        // system block caches both. See shared/prompt-caching.md.
        cache_control: { type: "ephemeral" },
      },
    ],
    tools: [TRIAGE_TOOL],
    tool_choice: { type: "tool", name: "triage_email" },
    messages: [{ role: "user", content: userContent }],
  });

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
  );
  if (!toolUse || toolUse.name !== "triage_email") {
    throw new Error(
      `Classifier did not return a triage_email tool call (stop_reason=${response.stop_reason})`
    );
  }

  return normalizeDecision(toolUse.input);
}

function renderEmailForModel(message: OutlookMessage): string {
  // Keep the body bounded so one giant forwarded thread can't blow up tokens.
  const MAX_BODY_CHARS = 6000;
  const body =
    message.body.length > MAX_BODY_CHARS
      ? message.body.slice(0, MAX_BODY_CHARS) + "\n\n[… truncated …]"
      : message.body;

  return [
    `From: ${message.from.name ? `${message.from.name} <${message.from.address}>` : message.from.address}`,
    `To: ${message.toRecipients.join(", ") || "(unknown)"}`,
    `Received: ${message.receivedDateTime}`,
    `Outlook importance: ${message.importance}`,
    `Has attachments: ${message.hasAttachments ? "yes" : "no"}`,
    `Subject: ${message.subject}`,
    "",
    body || "(email body was empty)",
  ].join("\n");
}

function normalizeDecision(raw: unknown): TriageDecision {
  if (!raw || typeof raw !== "object") {
    throw new Error("Classifier returned non-object tool input");
  }
  const r = raw as Record<string, unknown>;

  const priority = asEnum(r.priority, ["P1", "P2", "P3", "P4"] as const, "P3");
  const confidence = asEnum(
    r.confidence,
    ["high", "medium", "low"] as const,
    "medium"
  );

  return {
    isIncident: Boolean(r.isIncident),
    priority,
    category: String(r.category ?? "Unknown"),
    summary: String(r.summary ?? ""),
    suggestedActions: Array.isArray(r.suggestedActions)
      ? r.suggestedActions.map(String)
      : [],
    customerImpact: String(r.customerImpact ?? ""),
    confidence,
    reasoning: String(r.reasoning ?? ""),
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function asEnum<T extends readonly string[]>(
  value: unknown,
  allowed: T,
  fallback: T[number]
): T[number] {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T[number])
    : fallback;
}

function parseAlertPriorities(raw: string | undefined): Priority[] {
  if (!raw) return ["P1", "P2"];
  const parts = raw
    .split(",")
    .map((p) => p.trim().toUpperCase())
    .filter((p): p is Priority => ["P1", "P2", "P3", "P4"].includes(p));
  return parts.length > 0 ? parts : ["P1", "P2"];
}

function parseIntEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function formatError(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}
