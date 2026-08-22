# Email Setup — `camodevops.online`

Business email for `camodevops.online`, wired into the Command Center as a
unified inbox instead of a separate mail client.

> **Supersedes the earlier Zoho Mail plan.** That plan is not in use — if you
> started the Zoho signup, you can abandon it. Nothing below touches Zoho.

## Architecture

Two different jobs, two different tools — this is why the setup has two
halves:

| Job | Tool | Why |
| --- | --- | --- |
| **Inbound** — receive mail sent to `@camodevops.online` | **Cloudflare Email Routing** → this Worker's `email()` handler | Already on Cloudflare; routes straight into code with no separate mailbox host |
| **Outbound** — send mail (including AI-drafted replies) | **Resend** (`api.resend.com`) | Simple HTTP API, no SMTP relay, clean multi-address sending from one verified domain |

Both write to the same D1 database (`camodevops-mail`), so every mailbox on
every configured domain shows up in one inbox at **`/app/inbox`** — no
per-address mail client, no separate login.

Unlike the old Zoho plan, **inbound and outbound don't compete for MX** —
Cloudflare Email Routing owns MX, Resend sends over its API without touching
MX at all. They coexist fine.

## Addresses

| Address | Purpose |
| --- | --- |
| `camo@camodevops.online` | Personal / main — your own sent & received mail |
| `kyra@camodevops.online` | The agent's own address — AI-drafted replies send from here by default |
| `info@` / `sales@` / `support@` | Whatever the site already points at (footer, audit page) |

All of these are just **routes into the same Worker** and **verified senders
on the same Resend domain** — there's no per-address setup cost beyond adding
the routing rule and, if you want it to receive too, one line in the
`domains`/routing config.

## What's already done (in this repo)

- `mail.js` — inbound parsing (via `postal-mime`), D1 storage, Kyra's
  AI-drafted replies (Anthropic API), outbound send (Resend API)
- `mail-ui.js` — the inbox UI, served at `/app/inbox`
- `sos-router.js` — exports `email()` for Cloudflare Email Routing, and the
  `/api/mail/*` endpoints backing the inbox
- `wrangler.jsonc` — `MAIL_DB` (D1) binding and the `/api/mail*` route
- D1 database `camodevops-mail` — created, schema applied (`messages`,
  `domains` tables)

None of this is reachable by real mail yet — that needs the steps below,
which happen in your Cloudflare and Resend dashboards and can't be scripted
from inside this repo (no API token with zone/DNS-edit scope is available
here).

## Setup steps

### 1. Secrets (you provide, this session sets them)

```bash
wrangler secret put RESEND_API_KEY      # from resend.com/api-keys
wrangler secret put ANTHROPIC_API_KEY   # from console.anthropic.com — powers Kyra's drafts
```

If `ANTHROPIC_API_KEY` is left unset, mail still arrives and the inbox still
works — Kyra just won't have a draft waiting, and the inbox says so.

### 2. Resend — verify the sending domain

1. [resend.com](https://resend.com) → **Domains** → **Add Domain** → `camodevops.online`
2. Resend shows SPF, DKIM, and (optionally) DMARC **TXT** records. Add them in
   Cloudflare DNS for the zone (**DNS** → **Records** → **Add record**) —
   exactly as Resend displays them, TXT only, nothing touches MX here.
3. Back in Resend, click **Verify**. Usually resolves within minutes on
   Cloudflare DNS.

### 3. Cloudflare Email Routing — receive into the Worker

1. Cloudflare dashboard → your zone → **Email** → **Email Routing**.
2. **Enable Email Routing** if it isn't already (Cloudflare adds the
   receiving MX + SPF records for you here — don't add your own MX).
3. **Routing rules** → **Create address**:
   - Address: `kyra@camodevops.online` → Action: **Send to a Worker** →
     select `camodevops`.
   - Repeat for `camo@`, `info@`, `sales@`, `support@` — same Worker, one
     rule per address (or a **Catch-all** rule → `camodevops` if you'd rather
     route everything on the domain and let the Worker sort it by `To:`,
     which it already does).
4. Send a test email to one of the addresses. Check `/app/inbox` — it should
   appear within a few seconds, with a Kyra-drafted reply shortly after if
   `ANTHROPIC_API_KEY` is set.

### 4. Deploy

```bash
wrangler deploy
```

(`d1_databases`, routes, and everything else needed are already in
`wrangler.jsonc` — this just ships the code.)

## Adding more domains

The `domains` table exists for this — each additional domain (the
"worldwide" ones) needs:

1. The domain's DNS on Cloudflare (or a zone you can add records to).
2. Step 2 above repeated for that domain in Resend (separate domain
   verification per sending domain).
3. Step 3 above repeated — Email Routing is per-zone, so each domain gets its
   own routing rules pointed at the same `camodevops` Worker.
4. One row: `POST /api/mail/domains { "domain": "example.com" }` (or just
   tell Claude the domain name and this gets done for you).

Everything else — the inbox UI, the D1 schema, Kyra's drafting — already
works across every domain in that table with no code changes.

## Verification checklist

- [ ] `RESEND_API_KEY` set (`wrangler secret list` shows it)
- [ ] `ANTHROPIC_API_KEY` set (optional, but drafts need it)
- [ ] Resend domain `camodevops.online` shows **Verified**
- [ ] Cloudflare Email Routing **Enabled**, routing rules point at `camodevops` Worker
- [ ] Test inbound: send to `camo@camodevops.online` → appears in `/app/inbox`
- [ ] Test outbound: **Compose** in the inbox → arrives, passes SPF/DKIM (check headers)
- [ ] Test reply: open a message with a Kyra draft → **Approve & Send** → arrives threaded correctly
