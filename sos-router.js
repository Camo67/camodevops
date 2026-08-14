/**
 * Entry worker for the camodevops site.
 *
 * Routes:
 * - /app* - CamoFlow OS dashboard (requires sos_auth cookie)
 * - /bot/app - Telegram Mini App launcher
 * - /webhook/telegram/* - Telegram bot webhook endpoint
 * - /* - Static assets from output/ directory
 *
 * Static assets serve assets-first; this code only runs for requests with no
 * matching asset, plus the zone routes declared in wrangler.jsonc.
 */

// Telegram bot integration
async function handleTelegramUpdate(update, env) {
  const message = update.message || update.callback_query?.message;
  const chat = message?.chat;
  const userId = update.message?.from?.id || update.callback_query?.from?.id;

  if (!chat || !userId) {
    return new Response('OK', { status: 200 });
  }

  const chatId = chat.id;
  const text = update.message?.text || '';

  // Handle /start command
  if (text === '/start') {
    return await sendTelegramMessage(
      env.TELEGRAM_BOT_TOKEN,
      chatId,
      'Welcome to CamoFlow! Launch the command center to manage your operations.',
      {
        inline_keyboard: [[
          {
            text: '🚀 Launch Command Center',
            web_app: { url: 'https://sos.camodevops.online/bot/app' }
          }
        ]]
      }
    );
  }

  // Handle /help command
  if (text === '/help') {
    return await sendTelegramMessage(
      env.TELEGRAM_BOT_TOKEN,
      chatId,
      `CamoFlow Commands:
/start - Launch the command center
/status - Check system status
/help - Show this message

Or tap the button above to open the Mini App!`
    );
  }

  // Handle /status command
  if (text === '/status') {
    return await sendTelegramMessage(
      env.TELEGRAM_BOT_TOKEN,
      chatId,
      '✓ All systems online\n⚡ CPU: 68%\n💾 Memory: 42%\n🚀 3 services running'
    );
  }

  return new Response('OK', { status: 200 });
}

async function sendTelegramMessage(token, chatId, text, markup = null) {
  const payload = {
    chat_id: chatId,
    text: text,
    parse_mode: 'HTML'
  };

  if (markup) {
    payload.reply_markup = markup;
  }

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.error('Failed to send Telegram message:', err);
  }

  return new Response('OK', { status: 200 });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Telegram webhook: POST /webhook/telegram/*
    if (request.method === 'POST' && url.pathname.match(/^\/webhook\/telegram\//)) {
      try {
        const update = await request.json();
        return await handleTelegramUpdate(update, env);
      } catch (err) {
        console.error('Telegram webhook error:', err);
        return new Response('OK', { status: 200 });
      }
    }

    // Telegram Mini App launcher: GET /bot/app
    if (request.method === 'GET' && url.pathname === '/bot/app') {
      return new Response(getTelegramMiniAppHtml(), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    // Telegram bot health check: GET /bot/health
    if (request.method === 'GET' && url.pathname === '/bot/health') {
      return new Response(JSON.stringify({ status: 'ok', bot: 'camoflow' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // CamoFlow OS app: /app* (requires authentication)
    if (url.hostname === "sos.camodevops.online" && (url.pathname === "/app" || url.pathname.startsWith("/app/"))) {
      const signedIn = /(?:^|;\s*)sos_auth=/.test(request.headers.get("Cookie") || "");
      if (!signedIn) return Response.redirect(new URL("/login", url).toString(), 302);
      return env.ASSETS.fetch(new URL("/sos/index.html", url));
    }

    // Static assets (default)
    return env.ASSETS.fetch(request);
  },
};

function getTelegramMiniAppHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no">
  <title>CamoFlow Command Center</title>
  <script src="https://web.telegram.org/js/telegram-web-app.js"><\/script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      -webkit-user-select: none;
      user-select: none;
    }

    :root {
      --ink: #0f1419;
      --teal: #3db8c4;
      --sage: #7a9e7e;
      --bg: #0a0d11;
      --surface: #13171e;
      --border: #1a1f28;
      --text-primary: #e8eef2;
      --text-secondary: #a0aab8;
      --success: #4ade80;
    }

    html, body {
      width: 100%;
      height: 100%;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: var(--bg);
      color: var(--text-primary);
    }

    body {
      display: flex;
      flex-direction: column;
      padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
    }

    .app-header {
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      padding: 12px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .app-title {
      font-size: 18px;
      font-weight: 700;
    }

    .app-content {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
    }

    .section {
      margin-bottom: 16px;
    }

    .section-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--text-secondary);
      margin-bottom: 8px;
    }

    .status-card {
      display: flex;
      gap: 12px;
      padding: 12px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      margin-bottom: 12px;
    }

    .status-icon {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(61, 184, 196, 0.1);
      border: 1px solid var(--teal);
      border-radius: 8px;
      font-size: 20px;
    }

    .status-info {
      flex: 1;
    }

    .status-label {
      font-size: 13px;
      font-weight: 600;
    }

    .status-value {
      font-size: 11px;
      color: var(--text-secondary);
      margin-top: 2px;
    }

    .status-value.active {
      color: var(--success);
    }

    .action-btn {
      width: 100%;
      padding: 12px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
      color: var(--text-primary);
      font-size: 13px;
      font-weight: 600;
    }

    .action-btn:active {
      background: var(--border);
      border-color: var(--teal);
    }

    .action-icon {
      width: 24px;
      color: var(--teal);
    }

    .pulse {
      display: inline-block;
      width: 4px;
      height: 4px;
      background: var(--success);
      border-radius: 50%;
      margin-right: 4px;
      animation: pulse-anim 2s infinite;
    }

    @keyframes pulse-anim {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .bottom-bar {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      padding: 12px;
      border-top: 1px solid var(--border);
      background: var(--surface);
    }

    .bottom-btn {
      padding: 10px;
      background: var(--border);
      border: 1px solid var(--border);
      border-radius: 8px;
      color: var(--text-primary);
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .bottom-btn:active {
      background: var(--teal);
      color: var(--ink);
    }
  </style>
</head>
<body>
  <div class="app-header">
    <div class="app-title">CamoFlow</div>
  </div>

  <div class="app-content">
    <div class="section">
      <div class="status-card">
        <div class="status-icon">⚡</div>
        <div class="status-info">
          <div class="status-label">System Status</div>
          <div class="status-value active"><span class="pulse"><\/span>Online & Ready</div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Quick Commands</div>
      <button class="action-btn" onclick="action('deploy')">
        <span class="action-icon">🚀<\/span>
        <span>Deploy Service<\/span>
      </button>
      <button class="action-btn" onclick="action('metrics')">
        <span class="action-icon">📊<\/span>
        <span>View Metrics<\/span>
      </button>
      <button class="action-btn" onclick="action('dispatch')">
        <span class="action-icon">📡<\/span>
        <span>Dispatch Tasks<\/span>
      </button>
      <button class="action-btn" onclick="action('leads')">
        <span class="action-icon">📋<\/span>
        <span>View Leads Queue<\/span>
      </button>
    </div>

    <div class="section">
      <div class="section-title">Recent Activity</div>
      <div class="action-btn" style="cursor: default; background: var(--surface);">
        <span class="action-icon">✓<\/span>
        <span>camoflow v2.1.4 deployed<\/span>
      </div>
      <div class="action-btn" style="cursor: default; background: var(--surface);">
        <span class="action-icon">✓<\/span>
        <span>3 leads processed today<\/span>
      </div>
      <div class="action-btn" style="cursor: default; background: var(--surface);">
        <span class="action-icon">✓<\/span>
        <span>Database backup completed<\/span>
      </div>
    </div>
  </div>

  <div class="bottom-bar">
    <button class="bottom-btn" onclick="send()">📤 Send<\/button>
    <button class="bottom-btn" onclick="help()">❓ Help<\/button>
  </div>

  <script>
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();
    tg.setHeaderColor('#13171e');
    tg.setBackgroundColor('#0a0d11');

    function action(type) {
      vibrate(20);
      const msgs = {
        deploy: 'Deploying...',
        metrics: 'Fetching metrics...',
        dispatch: 'Opening dispatch...',
        leads: 'Loading leads...'
      };
      if (tg.showAlert) {
        tg.showAlert(msgs[type] || 'Executing...');
      }
    }

    function send() {
      vibrate(30);
      tg.sendData(JSON.stringify({ action: 'send', time: Date.now() }));
    }

    function help() {
      vibrate(30);
      if (tg.showAlert) {
        tg.showAlert('CamoFlow Command Center - Tap buttons to execute actions');
      }
    }

    function vibrate(ms = 10) {
      if (navigator.vibrate) navigator.vibrate(ms);
      if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
    }

    tg.MainButton.text = '📤 Send Report';
    tg.MainButton.show();
    tg.MainButton.onClick(() => {
      vibrate(30);
      tg.sendData(JSON.stringify({ action: 'report', time: Date.now() }));
    });

    if (tg.BackButton) {
      tg.BackButton.show();
      tg.BackButton.onClick(() => tg.close());
    }
  </script>
</body>
</html>`;
}
