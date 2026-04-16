# Incident Triage — Azure Functions + Power Automate

> 🧭 **New to this?** Follow the step-by-step walkthrough in
> [DEPLOY.md](./DEPLOY.md). It covers installing tools, creating the AD app
> registration, Slack webhook, Function App, and Power Automate flow from
> scratch — and calls out which steps require IT involvement.
>
> This README is the short reference for people who already know the
> Azure / PA stack.

Hosts the Outlook → Claude → Slack incident-triage agent as an Azure Function
so that Power Automate (running on the Locus Robotics recurrence schedule) can
invoke it without leaving the Microsoft tenant.

This answers the concern from the Teams thread: OpenAI is not a protected
LLM, but Claude (Anthropic) called directly from inside Azure is, and Power
Automate only sees an internal HTTPS endpoint.

```
  ┌────────────────────────┐
  │ Power Automate         │
  │  Recurrence (15 min)   │
  │  → HTTP POST           │
  └────────────┬───────────┘
               │  x-functions-key
               ▼
  ┌────────────────────────┐
  │ Azure Function         │
  │  /api/incidentTriage   │
  │  runIncidentTriageAgent│ ───► Microsoft Graph (Outlook mailbox)
  └────────────┬───────────┘ ───► Anthropic (Claude classifier)
               │                 ───► Slack Incoming Webhook
               ▼
         JSON AgentRunResult
```

---

## 1. Prerequisites

- Azure subscription + resource group you can deploy into.
- Azure AD app registration with **Mail.Read** and **Mail.ReadWrite**
  _Application_ permissions (admin-consented) for the shared support mailbox.
- Anthropic API key.
- Slack Incoming Webhook URL targeting the incident channel.
- `node >= 20`, `npm`, and the
  [Azure Functions Core Tools v4](https://learn.microsoft.com/azure/azure-functions/functions-run-local)
  (`func`) on the machine that runs the first deploy.

---

## 2. Local development

```bash
cd azure-functions
npm install
cp local.settings.json.example local.settings.json   # fill in real values
npm start                                            # runs `func start`
```

Then POST against the local endpoint:

```bash
curl -X POST http://localhost:7071/api/incidentTriage \
  -H "Content-Type: application/json" \
  -d '{"dryRun": true, "limit": 5}'
```

`dryRun: true` classifies emails but skips the Slack post and the
mark-as-read. Use it until you have confidence in the triage output.

---

## 3. Create the Function App in Azure

Choose names that match Locus conventions. The values below are illustrative:

```bash
RG=rg-customersuccess-prod
LOCATION=eastus
STORAGE=stcustsuccessprod$RANDOM
FUNCAPP=func-incident-triage-prod

az group create --name $RG --location $LOCATION

az storage account create \
  --name $STORAGE --location $LOCATION \
  --resource-group $RG --sku Standard_LRS

az functionapp create \
  --resource-group $RG \
  --consumption-plan-location $LOCATION \
  --runtime node --runtime-version 20 \
  --functions-version 4 \
  --name $FUNCAPP \
  --storage-account $STORAGE \
  --os-type Linux
```

Configure application settings (these replace what's in
`local.settings.json` for production):

```bash
az functionapp config appsettings set --name $FUNCAPP --resource-group $RG --settings \
  ANTHROPIC_API_KEY="sk-ant-..." \
  MS_GRAPH_TENANT_ID="<tenant-guid>" \
  MS_GRAPH_CLIENT_ID="<app-client-id>" \
  MS_GRAPH_CLIENT_SECRET="<app-secret>" \
  MS_GRAPH_MAILBOX="support@locusrobotics.com" \
  SLACK_INCIDENT_WEBHOOK_URL="https://hooks.slack.com/services/..." \
  SLACK_INCIDENT_CHANNEL="#support-incidents" \
  INCIDENT_AGENT_TIMER_ENABLED="false"
```

> Recommended: store `ANTHROPIC_API_KEY`, `MS_GRAPH_CLIENT_SECRET`, and
> `SLACK_INCIDENT_WEBHOOK_URL` in an Azure Key Vault and reference them with
> `@Microsoft.KeyVault(...)` app-setting syntax instead of inlining them.

---

## 4. Deploy the code

From this directory:

```bash
npm install
npm run package          # tsc -> dist/
func azure functionapp publish $FUNCAPP
```

After publish, grab the function key Power Automate will use:

```bash
az functionapp function keys list \
  --resource-group $RG --name $FUNCAPP \
  --function-name incidentTriage \
  --query default --output tsv
```

Then test:

```bash
curl -X POST \
  "https://$FUNCAPP.azurewebsites.net/api/incidentTriage?code=<function-key>" \
  -H "Content-Type: application/json" \
  -d '{"dryRun": true, "limit": 5}'
```

Expect a JSON `AgentRunResult` with `processed[]` entries and no Slack posts
(because of `dryRun`).

---

## 5. Wire up Power Automate

Create a new flow in the Locus tenant (https://make.powerautomate.com →
**Create → Scheduled cloud flow**).

### Step 1 — Trigger: Recurrence

| Field              | Value                  |
| ------------------ | ---------------------- |
| Interval           | `15`                   |
| Frequency          | `Minute`               |
| Time zone          | `(UTC-05:00) Eastern`  |

Fifteen minutes is a reasonable default; tighten to 5 once you are
comfortable with the classifier's precision.

### Step 2 — Action: HTTP

| Field    | Value                                                                                          |
| -------- | ---------------------------------------------------------------------------------------------- |
| Method   | `POST`                                                                                         |
| URI      | `https://<function-app>.azurewebsites.net/api/incidentTriage`                                  |
| Headers  | `Content-Type: application/json`<br>`x-functions-key: <function key from step 4>`              |
| Body     | `{ "limit": 25, "markRead": true, "alertPriorities": ["P1", "P2"] }`                           |

> Store the function key in a Power Automate **environment variable** (or
> Key Vault reference) rather than pasting it into the flow. That way
> rotating the key does not require editing the flow.

### Step 3 — Action: Parse JSON (optional but recommended)

Parses the response so the next steps can reference fields like
`totalAlerted` and `errors`. Use this schema:

```json
{
  "type": "object",
  "properties": {
    "mailbox": { "type": "string" },
    "startedAt": { "type": "string" },
    "finishedAt": { "type": "string" },
    "totalFetched": { "type": "integer" },
    "totalProcessed": { "type": "integer" },
    "totalAlerted": { "type": "integer" },
    "processed": { "type": "array" },
    "errors": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "messageId": { "type": "string" },
          "error": { "type": "string" }
        }
      }
    }
  }
}
```

### Step 4 — Condition: fail loud on errors

- **If** `length(body('Parse_JSON')?['errors'])` **is greater than** `0`
  - **Yes** branch: **Post a message (V3)** in a `#support-ops-alerts`
    Slack/Teams channel with the `errors` array rendered as text.
  - **No** branch: do nothing.

### Step 5 — Save and turn on

Run the flow manually once from the PA UI, confirm the Azure Function logs
show the invocation, and confirm that a dry-run incident is posted to the
staging Slack channel before pointing at production `#support-incidents`.

---

## 6. Operational notes

- **Overlap protection**: Power Automate will not skip a run just because a
  previous run is still executing. The agent is idempotent on individual
  messages (it marks them read before the next run sees them) but avoid
  setting the recurrence faster than the 95th-percentile run duration. Watch
  the Application Insights `requests` table.
- **Retries**: Power Automate's HTTP action retries on 5xx by default. The
  function returns 207 when a run partially failed — PA treats 207 as
  success, which is what we want (we already logged the partial errors in
  the response body).
- **Killing an alert loop**: if a bad classification starts spamming Slack,
  set `INCIDENT_AGENT_TIMER_ENABLED=false` (already the default) _and_ turn
  the Power Automate flow off. No other caller exists.
- **Updating the triage rubric**: lives in `src/lib/incident-agent.ts`
  (`SYSTEM_PROMPT`). Redeploy the Function after editing; the Power
  Automate flow does not need to change.
- **Switching models**: pass `"model": "claude-sonnet-4-6"` in the HTTP body
  from PA if you want to A/B without redeploying. Default is
  `claude-opus-4-6`.

---

## 7. Security checklist

- [ ] Function auth level is `function` (set in code; requires the
      per-function key to call).
- [ ] Power Automate stores the function key in a secure variable / Key
      Vault reference, not plaintext in the flow body.
- [ ] Function App is configured with a Managed Identity and
      `ANTHROPIC_API_KEY` / `MS_GRAPH_CLIENT_SECRET` /
      `SLACK_INCIDENT_WEBHOOK_URL` are Key Vault references.
- [ ] IP restrictions on the Function App allow only the Power Automate
      outbound IP range for your region (optional hardening).
- [ ] Slack webhook points at a channel whose members are all authorized to
      see support-case content.
- [ ] Mailbox shared inbox has consent recorded for automated processing.
