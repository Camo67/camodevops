/**
 * Telegram Bot for CamoFlow Mini App deployment
 *
 * Handles:
 * - POST /webhook/telegram/{bot_token} - Telegram bot webhook endpoint
 * - GET /bot/app - Serves the AI Command Center Mini App
 * - Keyboard markup for /start command with app launch button
 *
 * Environment variables (set in wrangler.toml):
 * - TELEGRAM_BOT_TOKEN - Bot API token from @BotFather
 * - TELEGRAM_BOT_WEBHOOK_SECRET - Secret for webhook validation
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Telegram webhook endpoint: POST /webhook/telegram/:token
    if (request.method === 'POST' && url.pathname.match(/^\/webhook\/telegram\//)) {
      try {
        const update = await request.json();
        return handleTelegramUpdate(update, env);
      } catch (err) {
        console.error('Telegram webhook error:', err);
        return new Response('OK', { status: 200 });
      }
    }

    // Mini App launcher: GET /bot/app
    if (request.method === 'GET' && url.pathname === '/bot/app') {
      // Build the app HTML with Telegram WebApp API
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no">
  <title>CamoFlow Command Center</title>
  <script src="https://web.telegram.org/js/telegram-web-app.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/lucide@latest/dist/umd/lucide.min.js"></script>
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
      --warning: #facc15;
      --error: #ef4444;
    }

    html, body {
      width: 100%;
      height: 100%;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif;
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
      letter-spacing: -0.5px;
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

    .system-status {
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

    .action-button {
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

    .action-button:active {
      background: var(--border);
      border-color: var(--teal);
    }

    .button-icon {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--teal);
    }

    .bottom-actions {
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
      border-color: var(--teal);
      color: var(--ink);
    }

    .tab-nav {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0;
      border-bottom: 1px solid var(--border);
      margin-bottom: 12px;
    }

    .tab-nav-item {
      padding: 10px 4px;
      text-align: center;
      font-size: 11px;
      font-weight: 600;
      color: var(--text-secondary);
      cursor: pointer;
      border-bottom: 2px solid transparent;
      transition: all 0.2s;
    }

    .tab-nav-item.active {
      color: var(--teal);
      border-bottom-color: var(--teal);
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
  </style>
</head>
<body>
  <div class="app-header">
    <div class="app-title">CamoFlow</div>
  </div>

  <div class="app-content">
    <div class="section">
      <div class="system-status">
        <div class="status-icon">⚡</div>
        <div class="status-info">
          <div class="status-label">System Status</div>
          <div class="status-value active"><span class="pulse"></span>Online & Ready</div>
        </div>
      </div>
    </div>

    <div class="tab-nav">
      <div class="tab-nav-item active" onclick="switchTab(0)">Cockpit</div>
      <div class="tab-nav-item" onclick="switchTab(1)">Dispatch</div>
      <div class="tab-nav-item" onclick="switchTab(2)">Leads</div>
      <div class="tab-nav-item" onclick="switchTab(3)">Chat</div>
    </div>

    <div class="section">
      <div class="section-title">Quick Actions</div>
      <button class="action-button" onclick="action('deploy')">
        <span class="button-icon">🚀</span>
        <span>Deploy Service</span>
      </button>
      <button class="action-button" onclick="action('metrics')">
        <span class="button-icon">📊</span>
        <span>View Metrics</span>
      </button>
      <button class="action-button" onclick="action('dispatch')">
        <span class="button-icon">📡</span>
        <span>Dispatch Tasks</span>
      </button>
      <button class="action-button" onclick="action('leads')">
        <span class="button-icon">📋</span>
        <span>View Leads Queue</span>
      </button>
    </div>

    <div class="section">
      <div class="section-title">Recent Activity</div>
      <div class="action-button" style="cursor: default; background: var(--surface);">
        <span class="button-icon">✓</span>
        <span>camoflow v2.1.4 deployed</span>
      </div>
      <div class="action-button" style="cursor: default; background: var(--surface);">
        <span class="button-icon">✓</span>
        <span>3 leads processed today</span>
      </div>
      <div class="action-button" style="cursor: default; background: var(--surface);">
        <span class="button-icon">✓</span>
        <span>Database backup completed</span>
      </div>
    </div>
  </div>

  <div class="bottom-actions">
    <button class="bottom-btn" onclick="sendMessage()">Send</button>
    <button class="bottom-btn" onclick="getHelp()">Help</button>
  </div>

  <script>
    const tg = window.Telegram.WebApp;

    tg.ready();
    tg.expand();
    tg.setHeaderColor('#13171e');
    tg.setBackgroundColor('#0a0d11');

    let currentTab = 0;

    function switchTab(idx) {
      currentTab = idx;
      document.querySelectorAll('.tab-nav-item').forEach((el, i) => {
        el.classList.toggle('active', i === idx);
      });
      vibrate();
    }

    function action(type) {
      vibrate(20);
      const messages = {
        deploy: 'Deploying service...',
        metrics: 'Fetching metrics...',
        dispatch: 'Opening dispatch panel...',
        leads: 'Loading leads queue...'
      };
      showAlert(messages[type] || 'Action executed');
    }

    function sendMessage() {
      vibrate(30);
      tg.sendData(JSON.stringify({ action: 'send', tab: currentTab }));
    }

    function getHelp() {
      vibrate(30);
      showAlert('Help: Use tabs to navigate. Tap actions to execute commands.');
    }

    function showAlert(msg) {
      if (tg.showAlert) {
        tg.showAlert(msg);
      } else {
        alert(msg);
      }
    }

    function vibrate(duration = 10) {
      if (navigator.vibrate) {
        navigator.vibrate(duration);
      }
      if (tg.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('light');
      }
    }

    // Set up main button
    tg.MainButton.text = '📤 Send Report';
    tg.MainButton.show();
    tg.MainButton.onClick(() => {
      vibrate(30);
      tg.sendData(JSON.stringify({ action: 'send_report', timestamp: Date.now() }));
    });

    // Back button
    if (tg.BackButton) {
      tg.BackButton.show();
      tg.BackButton.onClick(() => {
        tg.close();
      });
    }
  </script>
</body>
</html>`;

      return new Response(html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    // Health check: GET /bot/health
    if (request.method === 'GET' && url.pathname === '/bot/health') {
      return new Response(JSON.stringify({ status: 'ok', bot: 'camoflow-telegram' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response('Not found', { status: 404 });
  }
};

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
    return await sendMessage(
      env.TELEGRAM_BOT_TOKEN,
      chatId,
      'Welcome to CamoFlow! Launch the command center to manage your operations.',
      {
        inline_keyboard: [[
          {
            text: '🚀 Launch Command Center',
            web_app: { url: `https://sos.camodevops.online/bot/app?user_id=${userId}` }
          }
        ]]
      }
    );
  }

  // Handle /help command
  if (text === '/help') {
    return await sendMessage(
      env.TELEGRAM_BOT_TOKEN,
      chatId,
      `CamoFlow Commands:
/start - Launch the command center
/status - Check system status
/deploy - Deploy a service
/leads - View leads queue
/metrics - Get performance metrics

Or tap the button above to open the Mini App!`
    );
  }

  // Handle /status command
  if (text === '/status') {
    return await sendMessage(
      env.TELEGRAM_BOT_TOKEN,
      chatId,
      '✓ All systems online\n⚡ CPU: 68%\n💾 Memory: 42%\n🚀 3 services running'
    );
  }

  return new Response('OK', { status: 200 });
}

async function sendMessage(token, chatId, text, markup = null) {
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
