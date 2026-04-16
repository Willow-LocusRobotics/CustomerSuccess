# Incident Triage Agent — Step-by-Step Deployment Guide

This guide walks you through deploying the Outlook → Claude → Slack
incident-triage agent from a clean laptop to a running Power Automate flow.
It is written for someone who is newer to coding. Each step explains **what
you are doing** and **why**.

If you just want the short reference, see [README.md](./README.md).

---

## What you are building

```
  ┌────────────────────────┐
  │ Power Automate         │
  │  Runs every 15 min     │
  │  Sends an HTTPS POST   │
  └────────────┬───────────┘
               │
               ▼
  ┌────────────────────────┐
  │ Azure Function         │  Reads Outlook inbox
  │  (Locus Azure tenant)  │  Asks Claude to classify
  │                        │  Posts P1/P2 alerts to Slack
  └────────────────────────┘
```

Everything runs inside Microsoft or Locus-controlled systems. No customer
data is sent to public LLMs.

---

## Who does what

Some steps require admin permissions you may not have. The table below shows
which role needs to own each step. "You" means "the person reading this
guide"; **IT** means someone with Azure Active Directory / subscription
admin access at Locus.

| Step                                               | Who           |
| -------------------------------------------------- | ------------- |
| Install tools on your laptop                        | You           |
| Clone the code                                      | You           |
| Create Anthropic API key                            | You           |
| Create Slack Incoming Webhook                       | You           |
| Create Azure AD app registration (for Outlook)      | **IT**        |
| Grant admin consent on the AD app                   | **IT**        |
| Create the Azure Function App                       | **IT** (or You if you have the subscription role) |
| Deploy the code to the Function App                 | You           |
| Add application settings (env vars) in Azure        | You (IT must grant Contributor role first) |
| Build the Power Automate flow                       | You           |
| Point at production Slack channel                   | You           |

If you don't have the Contributor role on the Azure subscription, send
[Part 5](#part-5-deploy-to-azure) to IT and ask them to do steps 5a–5b on
your behalf. You can then finish the remainder.

---

## Before you start — information to collect

Keep this list open and fill it in as you go. The end of the guide references
these values.

```
  ANTHROPIC_API_KEY         = sk-ant-...
  MS_GRAPH_TENANT_ID        = (Azure AD tenant id, a GUID)
  MS_GRAPH_CLIENT_ID        = (App registration client id, a GUID)
  MS_GRAPH_CLIENT_SECRET    = (App registration secret)
  MS_GRAPH_MAILBOX          = support@locusrobotics.com (the mailbox to monitor)
  SLACK_INCIDENT_WEBHOOK_URL= https://hooks.slack.com/services/...
  SLACK_INCIDENT_CHANNEL    = #support-incidents
  AZURE_SUBSCRIPTION_ID     = (GUID of the Azure subscription to deploy into)
  FUNCTION_APP_NAME         = func-incident-triage-prod
  RESOURCE_GROUP            = rg-customersuccess-prod
  FUNCTION_KEY              = (you get this in step 5d)
```

> Treat every item that looks like a password as a password. Do not paste
> these into chat, email, or `.txt` files. Use a password manager.

---

## Part 1 — Install the tools you need

You need four command-line tools. Skip any that are already installed.

### 1a. Git

Git is how you download the code.

- **macOS**: `git` ships with the Xcode Command Line Tools. Run
  `xcode-select --install` if prompted.
- **Windows**: install [Git for Windows](https://git-scm.com/download/win)
  (accept all defaults). This also installs a "Git Bash" terminal — use
  that one for every command in this guide.
- **Linux**: `sudo apt install git` (Debian/Ubuntu) or equivalent.

Verify:

```bash
git --version
```

You should see a version number like `git version 2.45.0`.

### 1b. Node.js (version 20)

Node.js runs the agent code.

- Install [Node.js 20 LTS from nodejs.org](https://nodejs.org/en/download).
- On macOS with Homebrew: `brew install node@20`.

Verify:

```bash
node --version
# Expected: v20.x.x
npm --version
# Expected: 10.x.x or 11.x.x
```

If `node --version` shows a different major version (18, 22, etc.) that is
usually fine but 20 is what the Function App targets.

### 1c. Azure CLI

The Azure CLI (`az`) lets you talk to Azure from your terminal.

- [Install the Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli).
- macOS: `brew install azure-cli`.
- Windows: run the MSI installer linked from that page.

Verify:

```bash
az --version
# You should see "azure-cli 2.x.x"
```

Log in:

```bash
az login
```

A browser window opens. Sign in with your Locus account. Close the browser
tab when it says "You have logged in".

### 1d. Azure Functions Core Tools (`func`)

This is the tool that deploys the code to Azure.

- [Install Core Tools v4](https://learn.microsoft.com/azure/azure-functions/functions-run-local#install-the-azure-functions-core-tools).
- macOS: `brew tap azure/functions && brew install azure-functions-core-tools@4`.
- Windows: use the linked `.msi` installer.

Verify:

```bash
func --version
# Expected: 4.x.x
```

---

## Part 2 — Get the code

Pick a folder where you want the code to live (e.g. `~/code`).

```bash
cd ~/code
git clone https://github.com/Willow-LocusRobotics/CustomerSuccess.git
cd CustomerSuccess
git checkout claude/build-ai-agent-kVzPm
```

> If `git checkout` complains about an unknown branch, run
> `git fetch origin` first.

Install the JavaScript dependencies for the Function App:

```bash
cd azure-functions
npm install
```

This takes ~30 seconds and creates a `node_modules/` folder. That folder is
big and already excluded from Git — do not commit it.

---

## Part 3 — Set up the external accounts

Three separate services have to be wired up before anything works.

### 3a. Create an Anthropic API key

1. Go to <https://console.anthropic.com>.
2. Sign in (or create an account on Locus billing if you don't have one
   yet — talk to finance).
3. In the left sidebar, click **Settings → API Keys**.
4. Click **Create Key**. Name it `incident-triage-prod`.
5. Copy the key (starts with `sk-ant-…`). You cannot view it again after
   closing the dialog — paste it into your password manager now.

Record this as `ANTHROPIC_API_KEY` on the checklist.

### 3b. Create a Slack Incoming Webhook

1. Go to <https://api.slack.com/apps>.
2. Click **Create New App → From scratch**.
3. Name it `Support Incident Triage`. Pick the Locus workspace.
4. In the left sidebar click **Incoming Webhooks** and toggle them **On**.
5. Click **Add New Webhook to Workspace**.
6. Pick the channel you want alerts in. For your first test use a private
   test channel (e.g. `#support-incidents-test`), _not_ a real on-call
   channel.
7. Click **Allow**. Slack shows a webhook URL like
   `https://hooks.slack.com/services/T000/B000/XXXX`.
8. Copy that URL into your password manager as
   `SLACK_INCIDENT_WEBHOOK_URL`.

> ⚠️ Anyone who has this URL can post to the channel. Treat it like a
> password.

### 3c. Ask IT to create the Azure AD app registration

Paste this into a ticket / message to IT:

> Please create an Azure AD App Registration for the Support Incident
> Triage agent, with the following settings:
>
> - **Name**: `support-incident-triage`
> - **Supported account types**: Single tenant (Locus only)
> - **API permissions** (Microsoft Graph, _Application_ permissions — not
>   Delegated):
>   - `Mail.Read`
>   - `Mail.ReadWrite`
> - **Admin consent**: Please grant admin consent on the two permissions
>   above.
> - **Client secret**: Please create one with a 12-month expiry. Share
>   the *value* (not the secret ID) via our password manager, along with:
>   - Tenant ID
>   - Application (client) ID
>
> The app will authenticate to Microsoft Graph using the
> client-credentials flow and read the shared `support@locusrobotics.com`
> mailbox. It does not need a redirect URI.

When IT gets back to you, record:

- `MS_GRAPH_TENANT_ID`
- `MS_GRAPH_CLIENT_ID`
- `MS_GRAPH_CLIENT_SECRET`

### 3d. Confirm the mailbox to monitor

Record `MS_GRAPH_MAILBOX` as the email address of the shared support
mailbox (e.g. `support@locusrobotics.com`). The agent will only read mail
from this mailbox.

---

## Part 4 — Test locally (highly recommended)

Running the agent on your laptop first catches 90% of mistakes.

### 4a. Create your local secrets file

From inside `azure-functions/`:

```bash
cp local.settings.json.example local.settings.json
```

Open `local.settings.json` in your editor (VS Code, Notepad, etc.) and
replace every `"..."` placeholder with the real values you collected in
Part 3.

> 🚨 `local.settings.json` is already listed in `.gitignore` and will NOT
> be committed to Git. Double-check with `git status` — if you see it
> listed as a new file, stop and tell someone.

### 4b. Start the function locally

```bash
npm start
```

You should see output ending with something like:

```
Functions:
        incidentTriage: [POST] http://localhost:7071/api/incidentTriage

For detailed output, run func with --verbose flag.
```

Leave this terminal running.

### 4c. Call the function with a dry run

Open a **second** terminal, go to the same folder, and run:

```bash
curl -X POST http://localhost:7071/api/incidentTriage \
  -H "Content-Type: application/json" \
  -d '{"dryRun": true, "limit": 5}'
```

`dryRun: true` means: classify emails, but **do not** post to Slack and
**do not** mark the emails as read. It's a safe way to see what the
classifier thinks about real mail.

Expected output is a JSON blob with fields like `totalFetched`,
`totalProcessed`, `processed` (an array of per-email decisions), and
`errors` (hopefully empty).

If you see something like:

- `"error": "Missing required environment variable: ANTHROPIC_API_KEY"` →
  you mis-typed a key in `local.settings.json`. Fix it and restart
  `npm start`.
- `"error": "Microsoft Graph token request failed (401)"` → IT did not
  grant admin consent on the app permissions, or the client secret is
  wrong.
- `"error": "Microsoft Graph messages request failed (403)"` → the
  mailbox email in `MS_GRAPH_MAILBOX` is misspelled, or IT did not grant
  `Mail.Read`.

### 4d. Stop the local run

Go back to the first terminal and press `Ctrl+C` to stop the function.

---

## Part 5 — Deploy to Azure

> This part assumes IT has given you the **Contributor** role on the
> resource group. If not, ask IT to do steps 5a and 5b for you — the
> Function App only needs to exist once.

### 5a. Create the Function App in the Azure portal

1. Go to <https://portal.azure.com>.
2. In the search bar, type **Function App** and click it.
3. Click **+ Create → Function App → Consumption → Select**.
4. Fill in the **Basics** tab:
   - **Subscription**: pick the Locus subscription (confirm with IT).
   - **Resource Group**: create new, named `rg-customersuccess-prod`.
   - **Function App name**: `func-incident-triage-prod` (must be globally
     unique — if taken, add `-locus` or a random suffix).
   - **Runtime stack**: `Node.js`.
   - **Version**: `20 LTS`.
   - **Region**: `East US` (or whatever region Locus uses).
   - **Operating System**: `Linux`.
   - **Plan type**: `Consumption (Serverless)`.
5. Click **Next: Storage**. Accept defaults (a new storage account is
   created automatically).
6. Click **Next: Networking**. Leave defaults unless IT specifies otherwise.
7. Click **Next: Monitoring**. Leave **Enable Application Insights** =
   Yes. That's how you'll see logs later.
8. Click **Review + create → Create**. Wait ~90 seconds for deployment.
9. Click **Go to resource**.

Record the Function App name as `FUNCTION_APP_NAME` on your checklist.

### 5b. Add application settings (environment variables)

In the Function App's left-hand menu, click **Settings → Environment
variables → App settings**. Click **+ Add** for each of these
(case-sensitive names):

| Name                         | Value                                        |
| ---------------------------- | -------------------------------------------- |
| `ANTHROPIC_API_KEY`          | from Part 3a                                 |
| `MS_GRAPH_TENANT_ID`         | from Part 3c                                 |
| `MS_GRAPH_CLIENT_ID`         | from Part 3c                                 |
| `MS_GRAPH_CLIENT_SECRET`     | from Part 3c                                 |
| `MS_GRAPH_MAILBOX`           | from Part 3d                                 |
| `SLACK_INCIDENT_WEBHOOK_URL` | from Part 3b                                 |
| `SLACK_INCIDENT_CHANNEL`     | `#support-incidents-test` (use the test channel for now) |
| `INCIDENT_AGENT_TIMER_ENABLED` | `false`                                    |

Click **Apply** at the bottom. The app will restart.

> For production, ask IT to move the three secret values
> (`ANTHROPIC_API_KEY`, `MS_GRAPH_CLIENT_SECRET`,
> `SLACK_INCIDENT_WEBHOOK_URL`) into Azure Key Vault and reference them
> with `@Microsoft.KeyVault(...)` syntax. Using plaintext settings is
> fine for a first rollout but is not the long-term answer.

### 5c. Deploy the code

Back in your terminal, still inside `azure-functions/`:

```bash
npm run package
func azure functionapp publish func-incident-triage-prod
```

Replace `func-incident-triage-prod` with your actual Function App name.

The first deploy takes 2–3 minutes. It prints progress and ends with
something like:

```
Functions in func-incident-triage-prod:
    incidentTriage - [httpTrigger]
        Invoke url: https://func-incident-triage-prod.azurewebsites.net/api/incidenttriage
```

Copy that **Invoke url** — you need it for Power Automate.

### 5d. Get the function key

The function key is the password Power Automate uses to authenticate.

1. In the Azure portal, open your Function App.
2. Left-hand menu: **Functions → incidentTriage**.
3. Click **Function Keys**.
4. Copy the value of the **default** key.

Record this as `FUNCTION_KEY` on your checklist.

---

## Part 6 — Test the deployed function

Run this from your local terminal (substitute your Function App name and
key):

```bash
curl -X POST \
  "https://func-incident-triage-prod.azurewebsites.net/api/incidentTriage" \
  -H "Content-Type: application/json" \
  -H "x-functions-key: <FUNCTION_KEY>" \
  -d '{"dryRun": true, "limit": 5}'
```

You should see the same kind of JSON response as Part 4c.

### Check the logs in Azure

1. Azure Portal → your Function App → **Monitoring → Log stream**.
2. Run the `curl` again — you should see live log output appear in the
   browser.

If something went wrong, the error message shows up here.

---

## Part 7 — Build the Power Automate flow

Open <https://make.powerautomate.com>. Sign in with your Locus account.

### 7a. Create the flow shell

1. Left-hand menu: **Create**.
2. Click **Scheduled cloud flow**.
3. **Flow name**: `Support Incident Triage`.
4. **Starting**: today, 12:00 AM. **Repeat every**: `15` `Minute`.
5. Click **Create**.

### 7b. Add the HTTP action

1. Click **+ New step** under the Recurrence trigger.
2. Search for `HTTP` and click **HTTP — Premium**.
3. Fill in:
   - **Method**: `POST`
   - **URI**: `https://func-incident-triage-prod.azurewebsites.net/api/incidentTriage`
     (the invoke URL from step 5c — yours will differ)
   - **Headers** (click **+ Add new item** twice):
     - Name: `Content-Type`, Value: `application/json`
     - Name: `x-functions-key`, Value: paste your function key
   - **Body**:
     ```json
     {
       "limit": 25,
       "markRead": true,
       "alertPriorities": ["P1", "P2"]
     }
     ```
4. Rename the action from "HTTP" to "Call incident triage agent" (click
   the "…" → **Rename**).

> Best practice: store the function key as a Power Automate **environment
> variable** (Solutions → Default Solution → New → Environment Variable →
> Secret). Then the flow body references `@variables('FunctionKey')` and
> rotating the key does not require editing the flow. For your first
> deploy, pasting the key directly is acceptable.

### 7c. Add a Parse JSON step (optional but recommended)

This gives later steps named fields to reference.

1. **+ New step → Parse JSON**.
2. **Content**: click the field, then pick **Body** from the "Call
   incident triage agent" action.
3. **Schema**: paste:
   ```json
   {
     "type": "object",
     "properties": {
       "mailbox": { "type": "string" },
       "totalFetched": { "type": "integer" },
       "totalProcessed": { "type": "integer" },
       "totalAlerted": { "type": "integer" },
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

### 7d. Add a Condition to alert on errors (optional)

If the agent had any errors during a run, send yourself an email.

1. **+ New step → Condition**.
2. Left value: click **Expression** tab and type
   `length(body('Parse_JSON')?['errors'])`.
3. Operator: `is greater than`.
4. Right value: `0`.
5. **If yes** branch → **Add an action → Send an email (V2)**:
   - **To**: your email.
   - **Subject**: `Incident triage agent had errors`.
   - **Body**: insert the **errors** dynamic field from Parse JSON.
6. **If no** branch: leave empty.

### 7e. Save and test

1. Click **Save** (top right).
2. Click **Test → Manually → Test**.
3. Click **Run flow** on the confirmation dialog.
4. After ~30 seconds the flow run shows green check marks on every step.
5. If the HTTP step is red, click into it to see the error response.

### 7f. Turn it on

Once the manual test succeeds, the flow is already turned on (scheduled
flows are on by default after creation). You should see the next run
appear in the **28-day run history** at the top of the flow page.

---

## Part 8 — Go to production

You have been running against the test Slack channel. Now promote.

1. In Azure Portal → Function App → **Settings → Environment variables**:
   change `SLACK_INCIDENT_CHANNEL` from `#support-incidents-test` to the
   real on-call channel (e.g. `#support-incidents`). Click **Apply**.
2. Update the Slack webhook URL if your production channel uses a
   different webhook (follow Part 3b against the real channel and update
   `SLACK_INCIDENT_WEBHOOK_URL`).
3. In Power Automate, change the HTTP body `alertPriorities` if you want
   to start P2 only or stay with P1+P2.
4. Watch the flow for 48 hours. Check:
   - The `#support-incidents` channel for the classifications — are
     they correct?
   - Application Insights on the Function App — are there any 500s?
   - The shared support mailbox — are messages being marked as read?

If the classifier is over-flagging, change the rubric in
`src/lib/incident-agent.ts` (the `SYSTEM_PROMPT` constant), redeploy by
re-running `npm run package && func azure functionapp publish …`, and
keep watching. The Power Automate flow does **not** need to change — the
classifier logic lives in the code.

---

## Troubleshooting

### "401 Unauthorized" when calling the function from Power Automate

- The `x-functions-key` header is wrong or missing. Copy the **default**
  key from Azure portal → Functions → incidentTriage → Function Keys.

### "Microsoft Graph token request failed (401)"

- IT did not grant admin consent on the `Mail.Read` and `Mail.ReadWrite`
  Application permissions.
- Or: the client secret has expired (they only last 12 or 24 months).
  Ask IT to rotate it and update `MS_GRAPH_CLIENT_SECRET` in Azure
  Environment variables.

### "Microsoft Graph messages request failed (403)"

- The mailbox address in `MS_GRAPH_MAILBOX` is wrong.
- Or: the app registration has consent for `Mail.Read` but not
  **Application** permission — this is a common mistake. It must be
  Application, not Delegated.

### Slack webhook says "invalid_token" or similar

- Re-generate the webhook (Part 3b) and update
  `SLACK_INCIDENT_WEBHOOK_URL`.
- Make sure the channel still exists and the webhook wasn't revoked.

### The function is slow / times out

- The classifier takes ~3 seconds per email. A batch of 25 emails takes
  ~75 seconds.
- Consumption plan has a 5-minute request timeout by default, which is
  plenty. If you still time out, reduce the `limit` in the Power
  Automate body.

### I pushed a code change, but the function still shows old behaviour

- Did you run `npm run package && func azure functionapp publish …`
  after editing? Editing files on your laptop does nothing until you
  publish.

### Power Automate flow keeps retrying on every run

- Check the HTTP step's status code. If it is 207, that means the agent
  partially succeeded — PA treats 207 as success. Normal behaviour.
- If it is 500, inspect Application Insights for the actual error.

---

## Glossary

- **Azure Function** — a small chunk of code that runs in Microsoft's
  cloud when triggered (by an HTTP request, a timer, a queue message,
  etc.).
- **Function Key** — a long random string that acts as a password for
  calling an Azure Function's HTTP endpoint.
- **Azure AD App Registration** — a record in Azure Active Directory
  that represents your application. It has an ID and a secret, and it's
  what authenticates to Microsoft Graph.
- **Microsoft Graph** — the REST API Microsoft exposes for 365 (mail,
  calendar, Teams, etc.).
- **Application permission** (vs Delegated) — a permission that lets an
  app act on its own, not on behalf of a signed-in user. Required for
  unattended background jobs like this one.
- **Incoming Webhook** — a Slack URL you POST JSON to, and it shows up
  as a message in a channel.
- **Power Automate** — Microsoft's no-code workflow tool; in the family
  of Azure Logic Apps but lives in the Microsoft 365 plane.
- **Consumption plan** — a pay-per-invocation hosting plan for Azure
  Functions. You pay nothing when the function is idle.
- **Application Insights** — Microsoft's telemetry product. Collects
  logs and metrics from your Function App.

---

## When to ask for help

If you get stuck for more than 30 minutes on one step, stop and ask. Most
deployment issues are environmental (permissions, spelling, expired
secrets) and another set of eyes resolves them quickly. Include:

1. Which step you are on.
2. The exact command you ran.
3. The exact error message (copy-paste, don't re-type).
4. Whether any part previously worked.
