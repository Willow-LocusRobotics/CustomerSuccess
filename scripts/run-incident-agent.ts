/**
 * Cron-runnable entry point for the incident triage agent.
 *
 * The Next.js app uses `output: "export"` so it ships as a static bundle
 * with no hosted runtime — this script is how the agent is meant to be
 * run in production, from a scheduler (cron, systemd timer, GitHub
 * Actions, Azure Function timer, etc.).
 *
 * Run it with:
 *   npm run agent:incident-triage
 *
 * Flags:
 *   --dry-run          Classify emails, do NOT post to Slack or mark as read
 *   --limit <n>        Max messages to process (default 25)
 *   --no-mark-read     Leave messages unread after processing
 *   --priorities P1,P2 Priorities that trigger Slack alerts
 *
 * Environment:
 *   Reads .env / .env.local on startup (Next.js does this automatically in
 *   dev, but standalone scripts need to do it manually). See
 *   env.local.example for the full list of required variables.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";

import {
  runIncidentTriageAgent,
  type Priority,
  type RunAgentOptions,
} from "../src/lib/incident-agent";

// ---------------------------------------------------------------------------
// .env loader — small enough not to warrant a dep. Reads .env.local first
// then .env, without overriding anything already in process.env.
// ---------------------------------------------------------------------------

function loadEnvFile(path: string): void {
  let contents: string;
  try {
    contents = readFileSync(path, "utf8");
  } catch {
    return;
  }
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(resolve(process.cwd(), ".env.local"));
loadEnvFile(resolve(process.cwd(), ".env"));

// ---------------------------------------------------------------------------
// CLI arg parsing
// ---------------------------------------------------------------------------

function parseArgs(argv: string[]): RunAgentOptions {
  const opts: RunAgentOptions = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case "--dry-run":
        opts.dryRun = true;
        break;
      case "--no-mark-read":
        opts.markRead = false;
        break;
      case "--limit": {
        const next = argv[++i];
        const n = Number.parseInt(next ?? "", 10);
        if (Number.isFinite(n) && n > 0) opts.limit = n;
        break;
      }
      case "--priorities": {
        const next = argv[++i] ?? "";
        const allowed: Priority[] = ["P1", "P2", "P3", "P4"];
        const parsed = next
          .split(",")
          .map((p) => p.trim().toUpperCase())
          .filter((p): p is Priority => (allowed as string[]).includes(p));
        if (parsed.length > 0) opts.alertPriorities = parsed;
        break;
      }
      case "--model": {
        const next = argv[++i];
        if (next) opts.model = next;
        break;
      }
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
        break;
      default:
        if (arg.startsWith("--")) {
          console.error(`Unknown flag: ${arg}`);
          printHelp();
          process.exit(2);
        }
    }
  }
  return opts;
}

function printHelp(): void {
  console.log(
    [
      "Usage: npm run agent:incident-triage -- [flags]",
      "",
      "Flags:",
      "  --dry-run            Classify emails, skip Slack posts and mark-read",
      "  --limit <n>          Max messages to process (default 25)",
      "  --no-mark-read       Leave processed messages unread in Outlook",
      "  --priorities P1,P2   Priorities that trigger Slack alerts",
      "  --model <id>         Anthropic model id (default claude-opus-4-6)",
      "  -h, --help           Show this help",
    ].join("\n")
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const opts = parseArgs(process.argv.slice(2));
  const started = Date.now();

  console.log(
    `[incident-triage] Starting${opts.dryRun ? " (dry run)" : ""}...`
  );
  const result = await runIncidentTriageAgent(opts);

  const elapsedMs = Date.now() - started;
  console.log(
    `[incident-triage] Finished in ${elapsedMs}ms — fetched ${result.totalFetched}, processed ${result.totalProcessed}, alerted ${result.totalAlerted}.`
  );

  for (const p of result.processed) {
    const tag = p.alerted ? "ALERTED " : "       ";
    console.log(
      `  ${tag}${p.decision.priority} ${p.decision.category.padEnd(22)} ${truncate(p.subject, 60)}`
    );
  }

  if (result.errors.length > 0) {
    console.error(`[incident-triage] ${result.errors.length} error(s):`);
    for (const err of result.errors) {
      console.error(
        `  ${err.messageId ? err.messageId + " - " : ""}${err.error}`
      );
    }
    process.exitCode = 1;
  }
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + "…";
}

main().catch((err) => {
  console.error("[incident-triage] Fatal:", err);
  process.exit(1);
});
