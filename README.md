# camodevops

Source for [camo.devops.online](https://camo.devops.online) — a personal website and creative-studio tooling hub for Camo.

The repo has three layers:

| Layer | What it is |
|---|---|
| **Static site** | `generate_site.py` builds HTML pages into `output/` |
| **Serving layer** | Cloudflare Workers *or* a Docker stack (your choice) |
| **Sub-projects** | `camoflow-os/` and `studio-os/` — standalone studio apps |

---

## Repository layout

```
camodevops/
├── generate_site.py      # Python script that builds the static site into output/
├── output/               # Built HTML pages (index, about, services, architecture, …)
│   └── sos/              # SOS Command Center single-page app
├── worker.js             # Legacy Cloudflare Worker (static site + WhatsApp webhook)
├── sos-router.js         # Primary Cloudflare Worker entry point (replaces worker.js)
├── wrangler.jsonc        # Cloudflare Workers / Wrangler config
├── server.js             # Standalone Node.js server (Docker path — same routes)
├── Dockerfile            # Builds the Node server image; runs generate_site.py at build
├── docker-compose.yml    # Full stack: web + agentic harness + Ollama + Nginx
├── nginx.conf            # Nginx reverse proxy with SSL termination
├── deploy.sh             # Helper script: build / up / down / logs / restart / backup
├── .env.example          # Environment variable template — copy to .env
├── camoflow-os/          # CamoFlow OS — single-file React business command app
└── studio-os/            # Studio OS — Next.js 16 / PostgreSQL creative studio app (scaffolding)
```

---

## Static site

`generate_site.py` renders the site from templates/data into `output/`. Every page is plain HTML — no client-side framework.

Pages currently built:

| File | Route |
|---|---|
| `index.html` | `/` — home |
| `about.html` | `/about` |
| `services.html` | `/services` |
| `architecture.html` | `/architecture` |
| `platform.html` | `/platform` |
| `sovereignty.html` | `/sovereignty` |
| `audit.html` | `/audit` |
| `privacy.html` | `/privacy` |
| `terms.html` | `/terms` |
| `sos/index.html` | `/sos` — SOS Command Center (served at `sos.camodevops.online/app*` behind the `sos_auth` cookie gate) |

Build the site:

```bash
python3 generate_site.py
# → output/ is populated
```

---

## Deployment — Cloudflare Workers (primary)

The Workers path is the default. `sos-router.js` is the entry point declared in `wrangler.jsonc`. It:

- Serves static assets from `output/` via the `ASSETS` binding.
- Routes `sos.camodevops.online/app*` to `output/sos/index.html` behind a lightweight `sos_auth` cookie check (real session auth lives in the `sos-camodevops` worker that owns the rest of the domain).

```bash
# Install deps (only wrangler needed)
npm install

# Build + deploy in one step
npm run deploy          # → python3 generate_site.py && wrangler deploy

# Local preview
npm run dev             # → wrangler dev
```

**`wrangler.jsonc` highlights**

| Key | Value / notes |
|---|---|
| `main` | `sos-router.js` |
| `assets.directory` | `./output` |
| `assets.html_handling` | `auto-trailing-slash` — pretty URLs work without `.html` extension |
| `assets.not_found_handling` | `404-page` |
| `routes` | `sos.camodevops.online/app*` → this worker only; all other paths stay on the `sos-camodevops` worker |

---

## Deployment — Docker stack (self-hosted alternative)

Use this when you want to self-host, run the agentic harness, or wire up Ollama for local LLMs.

### Services

| Container | Port | Role |
|---|---|---|
| `web` (camodevops-web) | 8080 | Node.js server — static site + webhook receiver |
| `harness` (camodevops-harness) | 8081 | Agentic harness — WhatsApp + Telegram AI backend |
| `ollama` (camodevops-ollama) | 11434 | Local LLM engine (optional, GPU-accelerated) |
| `nginx` (camodevops-nginx) | 80 / 443 | Reverse proxy + SSL termination |

The `web` container runs `server.js`, which handles:

| Route | Method | Description |
|---|---|---|
| `/webhook` | GET | WhatsApp webhook verification (hub.mode=subscribe) |
| `/webhook` | POST | Incoming WhatsApp messages → forwarded to harness |
| `/telegram/webhook` | POST | Telegram updates |
| `/health` | GET | JSON health check |
| `/api/status` | GET | Service status (harness URL, Telegram config) |
| `*` | GET | Static file serving from `output/` |

### Quick start

```bash
# 1. Copy and fill in environment variables
cp .env.example .env
# Edit .env — see Environment variables section below

# 2. Build images
./deploy.sh build

# 3. Start all services
./deploy.sh up

# Useful commands
./deploy.sh logs      # tail all logs
./deploy.sh status    # show container states
./deploy.sh restart   # rolling restart
./deploy.sh down      # stop everything
./deploy.sh backup    # snapshot harness memory + Ollama models to ./backups/
```

After `up`, services are available at:

```
Site:      http://localhost:8080
Webhook:   http://localhost:8080/webhook
Health:    http://localhost:8080/health
Harness:   http://localhost:8081
Ollama:    http://localhost:11434
```

### SSL (Nginx)

Place your certificates at:

```
./ssl/fullchain.pem
./ssl/privkey.pem
```

Let's Encrypt with Certbot is the usual path. The Nginx config already has TLS 1.2/1.3, HSTS, and basic security headers wired up.

---

## Webhook integrations

### WhatsApp (via Meta Business Cloud API)

1. Set `WHATSAPP_PHONE_NUMBER`, `WHATSAPP_ACCESS_TOKEN`, and `WHATSAPP_VERIFY_TOKEN` in `.env`.
2. In the Meta developer console, set your webhook URL to `https://your-domain/webhook` and use the same verify token.
3. Incoming messages are forwarded to the agentic harness at `HARNESS_URL`.

### Telegram

1. Set `TELEGRAM_BOT_TOKEN` and `TELEGRAM_WEBHOOK_URL` in `.env`.
2. Register the webhook with Telegram: `POST https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://your-domain/telegram/webhook`
3. Updates arrive at `/telegram/webhook` and are handed to the harness.

---

## Environment variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable | Required | Description |
|---|---|---|
| `WHATSAPP_PHONE_NUMBER` | Docker | Your Meta Business phone number ID |
| `WHATSAPP_ACCESS_TOKEN` | Docker | Meta permanent / system user access token |
| `WHATSAPP_VERIFY_TOKEN` | Docker | Shared secret for webhook verification (default: `agentic-harness-verify`) |
| `TELEGRAM_BOT_TOKEN` | Docker | BotFather token for your Telegram bot |
| `TELEGRAM_WEBHOOK_URL` | Docker | Public HTTPS URL Telegram will POST updates to |
| `OPENROUTER_API_KEY` | Harness | OpenRouter key (multi-model LLM routing) |
| `GOOGLE_AI_API_KEY` | Harness | Google AI / Gemini key |
| `GROQ_API_KEY` | Harness | Groq key for fast inference |
| `NVIDIA_NIM_API_KEY` | Harness | NVIDIA NIM key |
| `DEEPINFRA_API_KEY` | Harness | DeepInfra key |

The Cloudflare Workers deployment does not use `.env` — configure secrets via `wrangler secret put <NAME>` or the Cloudflare dashboard.

---

## Sub-projects

### CamoFlow OS — `camoflow-os/`

A single-file React artifact that runs the full studio business journey end-to-end:

**Inquiry → Deal → Booked Project → Deliver → Paid**

Modules: Dashboard · Contacts (Hat system) · Pipeline (drag kanban, Won auto-creates project) · Projects · Tasks · Billing (quote → invoice → paid, "invoice unbilled time") · Studio Clock (live billable meter + full-screen present mode) · Gear Cage · Review Queue (Policy Gate) · Activity log · Settings (JSON export).

The standout piece is **Kyra** — a real Anthropic tool-use agent loop (not a chatbox):

- Seven MCP-shaped tools in a `TOOLS[]` registry (`get_snapshot` + six writes).
- `runKyra()` runs a multi-turn loop against `claude-sonnet-4-6`, following `tool_use` blocks for up to 6 hops.
- **Policy Gate**: reads execute instantly; writes enqueue a proposal in the Review Queue. You approve → tool runs + logs to Activity. Dismiss → dropped.

The `TOOLS[]` array and executor function (`execTool`) are lift-and-shift ready for your Cloudflare Workers + D1 backend or an MCP server. See [`camoflow-os/README.md`](camoflow-os/README.md) for the full module map, harness design, and porting guide.

---

### Studio OS — `studio-os/`

A multi-tenant studio management platform built on **Next.js 16 + TypeScript + Prisma/PostgreSQL**.

Covers the same studio journey as CamoFlow OS but as a proper web app:

- **CRM**: Contacts (Hat system), Pipeline (Kanban), Playbook
- **Work**: Projects, Tasks, Calendar, Gear Cage, Studio Clock, Graph View (React Flow — visualises Contact → Deal → Project → Crew relationships)
- **Commerce**: Store (services/rentals)
- **Admin**: Team, studio settings, billing
- **Eve AI assistant** — floating chat for drafts, summaries, and suggestions

Currently at scaffolding stage: `README.md`, `package.json`, lockfile, and `prisma.config.ts` are in place; app source and `prisma/schema.prisma` land as build-out continues.

See [`studio-os/README.md`](studio-os/README.md) for the full feature list, tech stack, and project structure.
