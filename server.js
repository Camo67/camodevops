/**
 * Camodevops.online — Standalone Server
 * Serves static site + handles WhatsApp/Telegram webhooks
 * Alternative to Cloudflare Workers for Docker deployment
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const HARNESS_URL = process.env.HARNESS_URL || 'http://localhost:8080/webhook';
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'agentic-harness-verify';

// MIME types
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const OUTPUT_DIR = path.join(__dirname, 'output');

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Hub-Signature-256');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    // Health check
    if (url.pathname === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        status: 'healthy', 
        service: 'camodevops',
        version: '1.0.0',
        timestamp: new Date().toISOString()
      }));
      return;
    }

    // WhatsApp webhook verification (GET)
    if (url.pathname === '/webhook' && req.method === 'GET') {
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');

      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('[Webhook] Verification successful');
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(challenge);
        return;
      }
      console.log('[Webhook] Verification failed');
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('Forbidden');
      return;
    }

    // WhatsApp incoming messages (POST)
    if (url.pathname === '/webhook' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        try {
          console.log('[Webhook] Received message, forwarding to harness...');
          
          const harnessResp = await fetch(HARNESS_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Hub-Signature-256': req.headers['x-hub-signature-256'] || '',
            },
            body: body,
          });

          const result = await harnessResp.text();
          res.writeHead(harnessResp.status, { 'Content-Type': 'application/json' });
          res.end(result);
        } catch (e) {
          console.error('[Webhook] Harness error:', e.message);
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Harness unreachable', detail: e.message }));
        }
      });
      return;
    }

    // Telegram webhook (POST)
    if (url.pathname === '/telegram/webhook' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        try {
          console.log('[Telegram] Received update, processing...');
          
          const update = JSON.parse(body);
          const { getBridge } = require('./integrations/telegram/bridge.py');
          // This would need to be called via Python subprocess or HTTP
          // For now, log and acknowledge
          console.log('[Telegram] Update received:', JSON.stringify(update).substring(0, 200));
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true }));
        } catch (e) {
          console.error('[Telegram] Error:', e.message);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true })); // Always return 200 to Telegram
        }
      });
      return;
    }

    // API endpoints
    if (url.pathname.startsWith('/api/')) {
      const apiResponse = handleAPI(url, req.method);
      res.writeHead(apiResponse.status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(apiResponse.body));
      return;
    }

    // Static file serving
    let filePath = path.join(OUTPUT_DIR, url.pathname);
    
    // Handle directory index
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
    
    // Handle .html extension
    if (!fs.existsSync(filePath) && !path.extname(filePath)) {
      filePath = filePath + '.html';
    }

    if (fs.existsSync(filePath)) {
      const ext = path.extname(filePath);
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      
      const content = fs.readFileSync(filePath);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    } else {
      // 404
      const notFoundPath = path.join(OUTPUT_DIR, '404.html');
      if (fs.existsSync(notFoundPath)) {
        const content = fs.readFileSync(notFoundPath);
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end(content);
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
      }
    }
  } catch (err) {
    console.error('Server error:', err);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }
});

function handleAPI(url, method) {
  // API routes
  const routes = {
    'GET /api/health': () => ({ status: 'healthy', uptime: process.uptime() }),
    'GET /api/status': () => ({ 
      service: 'camodevops',
      harness: process.env.HARNESS_URL || 'not configured',
      telegram: process.env.TELEGRAM_BOT_TOKEN ? 'configured' : 'not configured'
    }),
  };

  const key = `${method} ${url.pathname}`;
  if (routes[key]) {
    return { status: 200, body: routes[key]() };
  }

  return { status: 404, body: { error: 'Not found' } };
}

server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════╗
║   Camodevops.online — Docker Server      ║
╚══════════════════════════════════════════╝

   Port: ${PORT}
   Static: ${OUTPUT_DIR}
   Webhook: http://localhost:${PORT}/webhook
   Health: http://localhost:${PORT}/health

   Routes:
     GET  /webhook        → WhatsApp verification
     POST /webhook        → WhatsApp messages
     POST /telegram/webhook → Telegram updates
     GET  /health         → Health check
     *                    → Static site
  `);
});

module.exports = server;
