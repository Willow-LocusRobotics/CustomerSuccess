/**
 * Azure Functions entry point for the incident-triage agent.
 *
 * Two triggers are registered:
 *
 *   1. HTTP POST /api/incidentTriage  (authLevel: "function")
 *      — called by Power Automate on the Locus recurrence schedule.
 *      — returns the AgentRunResult JSON.
 *
 *   2. Timer (opt-in, gated by INCIDENT_AGENT_TIMER_ENABLED=true)
 *      — belt-and-suspenders fallback if Power Automate is paused or broken.
 *      — CRON from INCIDENT_AGENT_TIMER_SCHEDULE (default every 15 minutes).
 *
 * The shared classifier lives in ../../../src/lib/incident-agent so there is
 * a single source of truth; the Next.js repo, the CLI runner, and this
 * Function App all call the same code.
 */

import {
  app,
  type HttpRequest,
  type HttpResponseInit,
  type InvocationContext,
  type Timer,
} from "@azure/functions";

import {
  runIncidentTriageAgent,
  type Priority,
  type RunAgentOptions,
} from "../../../src/lib/incident-agent";

// ---------------------------------------------------------------------------
// HTTP trigger
// ---------------------------------------------------------------------------

export async function incidentTriageHttp(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log(
    `incidentTriage HTTP invocation ${context.invocationId} started`
  );

  let rawBody: unknown = null;
  try {
    if (request.method === "POST") {
      const text = await request.text();
      rawBody = text.length > 0 ? JSON.parse(text) : null;
    }
  } catch (error) {
    return {
      status: 400,
      jsonBody: {
        error: "Invalid JSON body",
        detail: error instanceof Error ? error.message : String(error),
      },
    };
  }

  const opts = parseOptions(rawBody);

  try {
    const result = await runIncidentTriageAgent(opts);
    context.log(
      `incidentTriage finished: fetched=${result.totalFetched} processed=${result.totalProcessed} alerted=${result.totalAlerted} errors=${result.errors.length}`
    );

    // HTTP 207 if we processed some mail but had partial errors — lets Power
    // Automate surface the failure in its "Condition" action without failing
    // the whole run.
    const status = result.errors.length > 0 && result.totalProcessed > 0 ? 207 : 200;

    return { status, jsonBody: result };
  } catch (error) {
    context.error("incidentTriage fatal error:", error);
    return {
      status: 500,
      jsonBody: {
        error: "Incident triage agent failed",
        detail: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

app.http("incidentTriage", {
  route: "incidentTriage",
  methods: ["POST"],
  authLevel: "function",
  handler: incidentTriageHttp,
});

// ---------------------------------------------------------------------------
// Timer trigger — opt-in fallback. Leave INCIDENT_AGENT_TIMER_ENABLED unset
// (or "false") in production so Power Automate is the sole trigger and we do
// not double-alert.
// ---------------------------------------------------------------------------

const timerSchedule =
  process.env.INCIDENT_AGENT_TIMER_SCHEDULE ?? "0 */15 * * * *";
const timerEnabled =
  (process.env.INCIDENT_AGENT_TIMER_ENABLED ?? "").toLowerCase() === "true";

if (timerEnabled) {
  app.timer("incidentTriageTimer", {
    schedule: timerSchedule,
    handler: async (_timer: Timer, context: InvocationContext) => {
      context.log(
        `incidentTriageTimer invocation ${context.invocationId} started (schedule=${timerSchedule})`
      );
      try {
        const result = await runIncidentTriageAgent({});
        context.log(
          `incidentTriageTimer finished: fetched=${result.totalFetched} processed=${result.totalProcessed} alerted=${result.totalAlerted} errors=${result.errors.length}`
        );
        if (result.errors.length > 0) {
          context.warn(
            `incidentTriageTimer: ${result.errors.length} error(s) during run`,
            result.errors
          );
        }
      } catch (error) {
        context.error("incidentTriageTimer fatal error:", error);
        throw error; // lets Azure Functions retry per host.json policy
      }
    },
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseOptions(raw: unknown): RunAgentOptions {
  if (!raw || typeof raw !== "object") return {};
  const body = raw as Record<string, unknown>;
  const opts: RunAgentOptions = {};

  if (typeof body.limit === "number" && Number.isFinite(body.limit) && body.limit > 0) {
    opts.limit = Math.floor(body.limit);
  }
  if (typeof body.dryRun === "boolean") opts.dryRun = body.dryRun;
  if (typeof body.markRead === "boolean") opts.markRead = body.markRead;
  if (typeof body.model === "string" && body.model.length > 0) opts.model = body.model;

  if (Array.isArray(body.alertPriorities)) {
    const allowed: Priority[] = ["P1", "P2", "P3", "P4"];
    const filtered = body.alertPriorities.filter(
      (p): p is Priority =>
        typeof p === "string" && (allowed as string[]).includes(p)
    );
    if (filtered.length > 0) opts.alertPriorities = filtered;
  }

  return opts;
}
