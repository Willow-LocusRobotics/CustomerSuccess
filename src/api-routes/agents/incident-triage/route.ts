/**
 * Incident triage agent — HTTP trigger.
 *
 * Scans the configured Outlook mailbox for unread mail, classifies each
 * message via Claude, and posts high-priority incidents to Slack.
 *
 * This endpoint is intended to be called by a cron/webhook (Power Automate,
 * an Azure Function timer, a Cron Job service, GitHub Actions, etc.). Keep
 * it behind an authenticated reverse proxy — it triggers real Slack posts.
 *
 * Request body (all optional):
 *   {
 *     "limit": 25,
 *     "dryRun": false,
 *     "markRead": true,
 *     "alertPriorities": ["P1", "P2"]
 *   }
 */

import { NextRequest, NextResponse } from "next/server";
import {
  runIncidentTriageAgent,
  type RunAgentOptions,
  type Priority,
} from "@/lib/incident-agent";

export async function POST(request: NextRequest) {
  try {
    const body = (await safeJson(request)) as Partial<RunAgentOptions> | null;

    const result = await runIncidentTriageAgent({
      limit: toPositiveInt(body?.limit),
      dryRun: typeof body?.dryRun === "boolean" ? body.dryRun : undefined,
      markRead: typeof body?.markRead === "boolean" ? body.markRead : undefined,
      alertPriorities: toPriorities(body?.alertPriorities),
      model: typeof body?.model === "string" ? body.model : undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Incident triage agent failed:", error);
    return NextResponse.json(
      {
        error: "Incident triage agent failed",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

async function safeJson(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function toPositiveInt(value: unknown): number | undefined {
  if (typeof value !== "number") return undefined;
  if (!Number.isFinite(value) || value <= 0) return undefined;
  return Math.floor(value);
}

function toPriorities(value: unknown): Priority[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const allowed: Priority[] = ["P1", "P2", "P3", "P4"];
  const filtered = value.filter((v): v is Priority =>
    typeof v === "string" && (allowed as string[]).includes(v)
  );
  return filtered.length > 0 ? filtered : undefined;
}
