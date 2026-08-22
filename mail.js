/**
 * Mail engine for the camodevops Command Center.
 *
 * Inbound: Cloudflare Email Routing delivers messages to this Worker's
 * `email()` export (configured per-domain in the Cloudflare dashboard —
 * see EMAIL_SETUP.md). Each message is parsed and stored in D1 so every
 * mailbox on every configured domain lands in one unified inbox.
 *
 * Outbound: sendMail() calls the Resend API. Any address on a verified
 * domain can be used as the From — including the agent's own address
 * (kyra@camodevops.online) — so agent-sent and user-sent mail both show
 * up in the same thread history.
 *
 * AI drafts: after storing an inbound message, draftReply() asks Claude
 * (Kyra's voice) to write a suggested reply. The draft is stored
 * alongside the message and never sent automatically — sending always
 * goes through the approve-or-edit step in the inbox UI, matching the
 * Policy Gate pattern used elsewhere in CamoFlow OS.
 */

import PostalMime from 'postal-mime';

const KYRA_SYSTEM_PROMPT = `You are Kyra, the AI operator for CamoFlow / CamodevOps. You draft email replies
on behalf of Camo (the founder). Tone: direct, warm, competent — no corporate filler,
no "I hope this email finds you well." Keep replies tight. Sign off as "Kyra" and
note in the body that you're the AI assistant if the reply is substantive (not for
quick acknowledgements). Never commit to prices, deadlines, or contractual terms —
flag those for Camo to confirm instead of inventing specifics.`;

// ─── Inbound: Cloudflare Email Routing handler ─────────────────────────────

export async function handleInboundEmail(message, env, ctx) {
  const parsed = await PostalMime.parse(message.raw);
  const domain = (message.to.split('@')[1] || '').toLowerCase();
  const id = crypto.randomUUID();
  const threadId = extractThreadId(parsed) || id;

  await env.MAIL_DB.prepare(
    `INSERT INTO messages
      (id, domain, direction, mailbox, to_address, from_address, from_name,
       subject, body_text, body_html, thread_id, in_reply_to, raw_size)
     VALUES (?, ?, 'inbound', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id,
    domain,
    message.to.toLowerCase(),
    message.to,
    message.from,
    parsed.from?.name || null,
    parsed.subject || '(no subject)',
    parsed.text || null,
    parsed.html || null,
    threadId,
    parsed.inReplyTo || null,
    message.rawSize ?? null
  ).run();

  // Draft a suggested reply in the background — don't hold up mail acceptance on it.
  ctx.waitUntil(
    draftReply(env, id, parsed).catch((err) => console.error('draftReply failed:', id, err))
  );

  // Always accept the mail into our own store. Optionally also forward a copy
  // to a personal address if MAIL_FORWARD_TO is configured, so nothing is
  // missed while the inbox UI is still new.
  if (env.MAIL_FORWARD_TO) {
    try {
      await message.forward(env.MAIL_FORWARD_TO);
    } catch (err) {
      console.error('forward failed:', err);
    }
  }
}

function extractThreadId(parsed) {
  // Prefer References (first id in the chain) so a whole thread groups together;
  // fall back to In-Reply-To for a direct reply.
  const refs = parsed.references;
  if (refs) {
    const first = String(refs).trim().split(/\s+/)[0];
    if (first) return first.replace(/[<>]/g, '');
  }
  if (parsed.inReplyTo) return String(parsed.inReplyTo).replace(/[<>]/g, '');
  return null;
}

// ─── AI suggested replies ───────────────────────────────────────────────────

async function draftReply(env, messageId, parsed) {
  if (!env.ANTHROPIC_API_KEY) return; // no key configured yet — skip quietly

  const body = (parsed.text || stripHtml(parsed.html || '')).slice(0, 6000);
  const prompt = `Incoming email:\nFrom: ${parsed.from?.address || 'unknown'}${parsed.from?.name ? ` (${parsed.from.name})` : ''}\nSubject: ${parsed.subject || '(no subject)'}\n\n${body}\n\n---\nDraft a reply.`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-5',
      max_tokens: 600,
      system: KYRA_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    console.error('Anthropic draft request failed:', res.status, await res.text());
    return;
  }

  const data = await res.json();
  const draft = data.content?.[0]?.text;
  if (!draft) return;

  await env.MAIL_DB.prepare(
    `UPDATE messages SET ai_draft_reply = ?, ai_draft_generated_at = datetime('now') WHERE id = ?`
  ).bind(draft, messageId).run();
}

function stripHtml(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

// ─── Outbound: Resend ────────────────────────────────────────────────────────

export async function sendMail(env, { from, to, subject, text, html, inReplyTo, references }) {
  if (!env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not configured');
  }

  const headers = {};
  if (inReplyTo) headers['In-Reply-To'] = inReplyTo;
  if (references) headers['References'] = references;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      text,
      html,
      headers: Object.keys(headers).length ? headers : undefined,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Resend send failed: ${res.status} ${data?.message || JSON.stringify(data)}`);
  }
  return data; // { id: "..." }
}

// ─── HTTP API (gated by sos_auth cookie in sos-router.js) ──────────────────

export async function apiListMessages(request, env) {
  const url = new URL(request.url);
  const mailbox = url.searchParams.get('mailbox'); // optional filter, e.g. kyra@camodevops.online
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 200);

  const query = mailbox
    ? env.MAIL_DB.prepare(
        `SELECT * FROM messages WHERE mailbox = ? AND is_archived = 0 ORDER BY received_at DESC LIMIT ?`
      ).bind(mailbox, limit)
    : env.MAIL_DB.prepare(
        `SELECT * FROM messages WHERE is_archived = 0 ORDER BY received_at DESC LIMIT ?`
      ).bind(limit);

  const { results } = await query.all();
  return json({ messages: results });
}

export async function apiGetMessage(request, env, id) {
  const row = await env.MAIL_DB.prepare(`SELECT * FROM messages WHERE id = ?`).bind(id).first();
  if (!row) return json({ error: 'not found' }, 404);
  if (!row.is_read) {
    await env.MAIL_DB.prepare(`UPDATE messages SET is_read = 1 WHERE id = ?`).bind(id).run();
  }
  return json({ message: row });
}

export async function apiSendNew(request, env) {
  const body = await request.json();
  const { from, to, subject, text, html } = body;
  if (!from || !to || !subject || (!text && !html)) {
    return json({ error: 'from, to, subject, and text or html are required' }, 400);
  }

  const result = await sendMail(env, { from, to, subject, text, html });

  const id = crypto.randomUUID();
  const domain = (from.split('@')[1] || '').toLowerCase();
  await env.MAIL_DB.prepare(
    `INSERT INTO messages
      (id, domain, direction, mailbox, to_address, from_address, subject, body_text, body_html, thread_id, is_read)
     VALUES (?, ?, 'outbound', ?, ?, ?, ?, ?, ?, ?, 1)`
  ).bind(id, domain, from.toLowerCase(), Array.isArray(to) ? to.join(', ') : to, from, subject, text || null, html || null, id).run();

  return json({ sent: true, id: result.id, message_id: id });
}

export async function apiSendReply(request, env, id) {
  const original = await env.MAIL_DB.prepare(`SELECT * FROM messages WHERE id = ?`).bind(id).first();
  if (!original) return json({ error: 'not found' }, 404);

  const body = await request.json();
  const text = body.text ?? original.ai_draft_reply;
  if (!text) return json({ error: 'no reply text provided and no AI draft available' }, 400);

  const from = body.from || original.to_address; // reply from the address it was sent to
  const result = await sendMail(env, {
    from,
    to: original.from_address,
    subject: original.subject?.startsWith('Re:') ? original.subject : `Re: ${original.subject || ''}`,
    text,
    inReplyTo: id,
    references: original.thread_id,
  });

  await env.MAIL_DB.prepare(`UPDATE messages SET is_replied = 1 WHERE id = ?`).bind(id).run();

  const replyId = crypto.randomUUID();
  await env.MAIL_DB.prepare(
    `INSERT INTO messages
      (id, domain, direction, mailbox, to_address, from_address, subject, body_text, thread_id, in_reply_to, is_read)
     VALUES (?, ?, 'outbound', ?, ?, ?, ?, ?, ?, ?, 1)`
  ).bind(
    replyId,
    (from.split('@')[1] || '').toLowerCase(),
    from.toLowerCase(),
    original.from_address,
    from,
    `Re: ${original.subject || ''}`,
    text,
    original.thread_id,
    id
  ).run();

  return json({ sent: true, id: result.id, message_id: replyId });
}

export async function apiArchive(request, env, id) {
  await env.MAIL_DB.prepare(`UPDATE messages SET is_archived = 1 WHERE id = ?`).bind(id).run();
  return json({ archived: true });
}

export async function apiListDomains(request, env) {
  const { results } = await env.MAIL_DB.prepare(`SELECT * FROM domains WHERE active = 1`).all();
  return json({ domains: results });
}

export async function apiAddDomain(request, env) {
  const { domain } = await request.json();
  if (!domain) return json({ error: 'domain is required' }, 400);
  await env.MAIL_DB.prepare(`INSERT OR IGNORE INTO domains (domain) VALUES (?)`).bind(domain.toLowerCase()).run();
  return json({ added: domain.toLowerCase() });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
