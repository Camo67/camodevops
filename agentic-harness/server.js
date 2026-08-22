/**
 * Agentic Harness — WhatsApp + Telegram AI backend
 *
 * Receives forwarded messages from the camodevops web server:
 *   POST /webhook          — WhatsApp Business Cloud API payloads (from server.js's HARNESS_URL forward)
 *   POST /telegram/webhook — Telegram Bot API updates
 *
 * Routes each message through Ollama first (local, free, runs on whatever
 * GPU/CPU this box has), falling back through cloud providers in order if
 * Ollama is unreachable or errors. Whichever one answers, the reply goes
 * back out over the same channel the message came in on.
 *
 * Memory is per-chat, file-based, under MEMORY_DIR (mounted as a Docker
 * volume in docker-compose.yml so it survives container restarts) — just
 * the last N turns, enough for a coherent conversation without needing a
 * database for what is, for now, a single-box deployment.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'hermes3:8b';
const MEMORY_DIR = process.env.MEMORY_DIR || path.join(__dirname, 'memory');
const MAX_TURNS = 20; // per chat, user+assistant messages combined

const WHATSAPP_PHONE_NUMBER = process.env.WHATSAPP_PHONE_NUMBER || '';
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || '';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

const SYSTEM_PROMPT = `You are Kyra, an AI assistant for CamodevOps / CamoFlow. You're reachable over
WhatsApp and Telegram to help with quick questions, status checks, and coordinating work.
Keep replies short and direct — this is a chat interface, not email. If someone asks you to
do something consequential (spend money, send something externally, change infrastructure),
say you'll flag it for review rather than just doing it.`;

fs.mkdirSync(MEMORY_DIR, { recursive: true });

// ─── Memory ──────────────────────────────────────────────────────────────

function loadMemory(chatKey) {
  const file = path.join(MEMORY_DIR, `${chatKey}.json`);
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return [];
  }
}

function saveMemory(chatKey, turns) {
  const file = path.join(MEMORY_DIR, `${chatKey}.json`);
  const trimmed = turns.slice(-MAX_TURNS);
  fs.writeFileSync(file, JSON.stringify(trimmed, null, 2));
}

// ─── LLM routing: Ollama first, then whichever cloud keys are configured ──

async function askOllama(messages) {
  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: OLLAMA_MODEL, messages, stream: false }),
  });
  if (!res.ok) throw new Error(`Ollama ${res.status}`);
  const data = await res.json();
  const text = data.message?.content;
  if (!text) throw new Error('Ollama returned no content');
  return text;
}

async function askGroq(messages) {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error('GROQ_API_KEY not set');
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages, max_tokens: 1024 }),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}`);
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('Groq returned no content');
  return text;
}

async function askOpenRouter(messages) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error('OPENROUTER_API_KEY not set');
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: 'meta-llama/llama-3.3-70b-instruct', messages, max_tokens: 1024 }),
  });
  if (!res.ok) throw new Error(`OpenRouter ${res.status}`);
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('OpenRouter returned no content');
  return text;
}

async function askGoogle(messages) {
  const key = process.env.GOOGLE_AI_API_KEY;
  if (!key) throw new Error('GOOGLE_AI_API_KEY not set');
  // Gemini doesn't take OpenAI-style role arrays — fold history into one turn.
  const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n');
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }] }),
    }
  );
  if (!res.ok) throw new Error(`Google AI ${res.status}`);
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Google AI returned no content');
  return text;
}

// Providers are tried in this order until one succeeds. Ollama is first
// because it's free and local; the rest only fire if it's down or errors.
const PROVIDERS = [askOllama, askGroq, askOpenRouter, askGoogle];

async function ask(chatKey, userText) {
  const history = loadMemory(chatKey);
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history,
    { role: 'user', content: userText },
  ];

  let reply = null;
  let lastError = null;
  for (const provider of PROVIDERS) {
    try {
      reply = await provider(messages);
      break;
    } catch (err) {
      lastError = err;
      console.error(`[harness] ${provider.name} failed:`, err.message);
    }
  }

  if (!reply) {
    reply = "I'm having trouble reaching any model right now — try again in a bit.";
    console.error('[harness] all providers failed, last error:', lastError?.message);
  }

  saveMemory(chatKey, [
    ...history,
    { role: 'user', content: userText },
    { role: 'assistant', content: reply },
  ]);

  return reply;
}

// ─── WhatsApp ────────────────────────────────────────────────────────────

async function sendWhatsApp(to, text) {
  if (!WHATSAPP_PHONE_NUMBER || !WHATSAPP_ACCESS_TOKEN) {
    console.log('[whatsapp] not configured, would have sent:', text);
    return;
  }
  await fetch(`https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_NUMBER}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({ messaging_product: 'whatsapp', to, text: { body: text } }),
  });
}

async function handleWhatsApp(payload) {
  const message = payload?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  if (!message || message.type !== 'text') return; // ignore statuses, media, etc. for now

  const from = message.from;
  const text = message.text?.body || '';
  if (!from || !text) return;

  const reply = await ask(`whatsapp-${from}`, text);
  await sendWhatsApp(from, reply);
}

// ─── Telegram ────────────────────────────────────────────────────────────

async function sendTelegram(chatId, text) {
  if (!TELEGRAM_BOT_TOKEN) {
    console.log('[telegram] not configured, would have sent:', text);
    return;
  }
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}

async function handleTelegram(update) {
  const message = update?.message;
  const chatId = message?.chat?.id;
  const text = message?.text;
  if (!chatId || !text) return; // ignore non-text updates for now

  if (text === '/start') {
    await sendTelegram(chatId, "Hi, I'm Kyra. Ask me anything.");
    return;
  }

  const reply = await ask(`telegram-${chatId}`, text);
  await sendTelegram(chatId, reply);
}

// ─── HTTP server ─────────────────────────────────────────────────────────

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  try {
    if (url.pathname === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'healthy', service: 'agentic-harness', model: OLLAMA_MODEL }));
      return;
    }

    if (url.pathname === '/webhook' && req.method === 'POST') {
      const body = await readBody(req);
      let payload;
      try {
        payload = JSON.parse(body);
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'invalid JSON' }));
        return;
      }
      // Ack immediately — WhatsApp expects a fast 200, and retries on timeout.
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
      handleWhatsApp(payload).catch(err => console.error('[whatsapp] handling error:', err));
      return;
    }

    if (url.pathname === '/telegram/webhook' && req.method === 'POST') {
      const body = await readBody(req);
      let update;
      try {
        update = JSON.parse(body);
      } catch {
        res.writeHead(200, { 'Content-Type': 'application/json' }); // always 200 for Telegram
        res.end(JSON.stringify({ ok: true }));
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
      handleTelegram(update).catch(err => console.error('[telegram] handling error:', err));
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'not found' }));
  } catch (err) {
    console.error('[harness] server error:', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'internal error' }));
  }
});

server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════╗
║   Agentic Harness — WhatsApp + Telegram  ║
╚══════════════════════════════════════════╝

   Port:    ${PORT}
   Ollama:  ${OLLAMA_URL} (${OLLAMA_MODEL})
   Memory:  ${MEMORY_DIR}
   WhatsApp: ${WHATSAPP_PHONE_NUMBER ? 'configured' : 'not configured'}
   Telegram: ${TELEGRAM_BOT_TOKEN ? 'configured' : 'not configured'}
  `);
});

module.exports = server;
