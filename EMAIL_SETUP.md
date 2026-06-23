# Email Setup — `camodevops.online`

A runbook for standing up business email on the `camodevops.online` domain.

> **Why this doc exists:** the website already *points* at these addresses
> (footer + the audit page "direct lines"), but mail does not flow until the
> steps below are completed. The provisioning happens in your own Cloudflare /
> Zoho / DNS accounts — it can't be automated from the project repo.

## Addresses & purpose

| Address | Purpose | Where it appears on the site |
| --- | --- | --- |
| `info@camodevops.online` | General enquiries | Footer (every page) + audit page |
| `sales@camodevops.online` | Quotes & new builds | Audit page direct lines |
| `support@camodevops.online` | Existing clients | Audit page direct lines |
| `camo@camodevops.online` | Personal / main | (not published — personal) |

## Chosen approach: Zoho Mail (free)

Real mailboxes with **native send + receive** — no SMTP relay needed, which makes
"send as" clean. The free **Forever Free Plan** covers 5 users × 5 GB, one domain,
IMAP/POP, and webmail/mobile apps.

> ⚠️ Zoho **replaces** Cloudflare Email Routing. A domain's MX can only point at
> one mail host, so do **not** run both. If Cloudflare Email Routing was enabled
> earlier on this domain, disable it first (Cloudflare dashboard → Email →
> Email Routing → Settings → Disable).

### Prerequisite
`camodevops.online` must be on a DNS provider you control (Cloudflare DNS if the
domain is a Cloudflare zone). You need to be able to add TXT/MX records.

### Steps

1. **Sign up** — <https://www.zoho.com/mail/> → **Forever Free Plan** → "Sign up
   with a domain you already own" → enter `camodevops.online`.
2. **Verify domain ownership** — Zoho shows a **TXT** (or CNAME) record. Add it in
   your DNS, then click **Verify** in Zoho.
3. **Create the addresses** — one primary mailbox, then add the others as **users**
   (≤5 on the free plan) or as free **aliases**: `info@`, `sales@`, `support@`,
   `camo@`.
4. **Point MX at Zoho** — replace any existing MX records (see table below).
5. **Add SPF** — single root TXT record (see table). Replace the old Cloudflare
   SPF; keep only **one** SPF record.
6. **Enable DKIM** — Zoho admin → **Email Configuration → DKIM** → enable → add the
   selector TXT it generates → **Verify**.
7. **DMARC (optional but recommended)** — add the `_dmarc` TXT (see table). Start
   at `p=none` and tighten to `quarantine`/`reject` once you confirm mail
   authenticates.
8. **Use it** — webmail at <https://mail.zoho.com>, the Zoho Mail app, or connect
   over IMAP. To keep working inside Gmail, see "Send as from Gmail" below.

### DNS records

> Use the **exact values Zoho shows you** — if signup lands you on a non-US data
> centre (`.eu`, `.in`, `.com.au`, …) the hostnames differ. The values below are
> the common US (`zoho.com`) data centre for reference.

| Type | Name (host) | Value | Notes |
| --- | --- | --- | --- |
| TXT | `@` | `zoho-verification=zb………zmverify.zoho.com` | Domain-ownership check (from Zoho) |
| MX | `@` | `mx.zoho.com` | Priority **10** |
| MX | `@` | `mx2.zoho.com` | Priority **20** |
| MX | `@` | `mx3.zoho.com` | Priority **50** |
| TXT | `@` | `v=spf1 include:zohomail.com ~all` | SPF — only one SPF record allowed |
| TXT | `<selector>._domainkey` | (DKIM key from Zoho) | Selector provided by Zoho |
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:info@camodevops.online` | Optional; start at `p=none` |

### Send as from Gmail (optional)

If you'd rather send/reply from inside Gmail instead of Zoho's webmail:

- Gmail → **Settings → Accounts and Import → "Send mail as" → Add another email
  address**.
- Untick **"Treat as an alias"** so replies come *from* the alias.
- **SMTP server:** `smtp.zoho.com` · **Port 465 (SSL)** (or `587` TLS) · username +
  password = your Zoho mailbox login (use an **app-specific password** if you have
  2FA on Zoho).
- Confirm the verification email Gmail sends to the address. Repeat per address.

## Verification checklist

- [ ] Domain verified in Zoho
- [ ] `info@` / `sales@` / `support@` / `camo@` created
- [ ] MX records point to Zoho (old/Cloudflare MX removed)
- [ ] Single SPF record present and correct
- [ ] DKIM enabled and verified
- [ ] DMARC record added (`p=none` to start)
- [ ] Cloudflare Email Routing disabled (if it was on)
- [ ] Test: send **to** each address → lands in the mailbox
- [ ] Test: send **from** each address → arrives, passes SPF/DKIM (check headers)

---

### Alternative considered: Cloudflare Email Routing + SMTP relay

Free forwarding-only aliases via Cloudflare Email Routing (receive into an existing
inbox), plus a free SMTP relay (SMTP2GO / Brevo) + Gmail "Send mail as" for sending.
Keeps mail on Cloudflare but adds moving parts, and transactional relays aren't
really meant for human reply mail. Zoho (above) was chosen as the cleaner
send + receive option. If you switch to this route instead, the receiving MX/SPF
come from Cloudflare (`route1/2/3.mx.cloudflare.net`, `include:_spf.mx.cloudflare.net`)
and the relay supplies its own SPF/DKIM to merge in.
