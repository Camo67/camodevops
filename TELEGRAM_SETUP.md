# CamoFlow Telegram Bot & Mini App Deployment

This guide covers deploying the CamoFlow AI Command Center as a Telegram Mini App with bot integration.

## Architecture Overview

- **Telegram Bot**: Handles `/start`, `/help`, `/status` commands and launches the Mini App
- **Mini App Handler**: Serves the AI_Command_Center.dc.html at `/bot/app`
- **Webhook Endpoint**: Receives Telegram bot updates at `/webhook/telegram/{token}`
- **Integration**: Runs alongside the CamoFlow OS app on `sos.camodevops.online`

## Prerequisites

1. **Telegram Bot**: Create a bot via [@BotFather](https://t.me/botfather)
   - Get your bot token (starts with `123456:ABC...`)
   - Note: Save this securely

2. **Cloudflare Setup**:
   - Domain: `sos.camodevops.online` (already configured)
   - Worker: `camodevops` (already deployed)

## Setup Steps

### 1. Create Telegram Bot

1. Open Telegram and chat with [@BotFather](https://t.me/botfather)
2. Send `/newbot`
3. Follow prompts to name your bot (e.g., "CamoFlow Command Center")
4. Save the token provided (format: `123456:ABC...`)
5. Send `/setcommands` to @BotFather and provide:
   ```
   start - Launch the command center
   help - Show available commands
   status - Check system status
   ```

### 2. Set Bot Webhook

Store the bot token as a Cloudflare Worker secret:

```bash
# Terminal: Set the bot token as a secret
wrangler secret put TELEGRAM_BOT_TOKEN
# Paste your token when prompted

# Optional: Set webhook secret for validation
wrangler secret put TELEGRAM_BOT_WEBHOOK_SECRET
# Use a random string, e.g., `openssl rand -hex 32`
```

Configure the webhook URL with Telegram:

```bash
curl -X POST "https://api.telegram.org/bot{YOUR_TOKEN}/setWebhook" \
  -d "url=https://sos.camodevops.online/webhook/telegram/{YOUR_TOKEN}" \
  -d "allowed_updates=[\"message\",\"callback_query\"]"
```

Replace `{YOUR_TOKEN}` with your actual bot token.

### 3. Deploy to Cloudflare

```bash
# Deploy the updated worker
wrangler deploy

# Verify the bot is responding
curl "https://sos.camodevops.online/bot/health"
# Should return: {"status":"ok","bot":"camoflow"}
```

### 4. Test the Bot

1. Find your bot on Telegram (search by name or @username)
2. Send `/start` - Should show the Mini App launch button
3. Tap "🚀 Launch Command Center" - Opens the Mini App
4. Send `/status` - Should return system status
5. Send `/help` - Should show available commands

## Mini App Features

The AI Command Center Mini App provides:

- **Cockpit Tab**: System status, recent activity, quick commands
- **Dispatch Tab**: Task dispatch, agent management
- **Leads Tab**: Lead queue, priority ranking
- **Chat Tab**: Conversation with Kyra agent
- **Logs Tab**: Activity history and system logs

### Telegram Integration

- **Haptic Feedback**: Vibration on button taps (requires supported device)
- **Back Button**: Close the app with Telegram's back button
- **Main Button**: Send reports or execute actions
- **Header Color**: Matches CamoFlow brand (#13171e)

## Environment Variables

The worker uses these environment variables (set via `wrangler secret`):

| Variable | Description | Required |
|----------|-------------|----------|
| `TELEGRAM_BOT_TOKEN` | Bot API token from @BotFather | ✓ |
| `TELEGRAM_BOT_WEBHOOK_SECRET` | Optional webhook validation secret | |

## API Endpoints

### Bot Management

- `GET /bot/health` - Health check
  - Returns: `{"status":"ok","bot":"camoflow"}`

- `GET /bot/app` - Serve the Mini App
  - Returns: HTML page with Telegram WebApp integration
  - Accessible via bot's `/start` button

### Telegram Webhook

- `POST /webhook/telegram/{token}` - Receive bot updates
  - Handles `/start`, `/help`, `/status` commands
  - Integrates with MCP tool registry

## Commands Reference

| Command | Description |
|---------|-------------|
| `/start` | Launch the CamoFlow command center Mini App |
| `/help` | Show available commands |
| `/status` | Display current system status (CPU, Memory, Services) |

## Updating the Mini App

The Mini App HTML is embedded in `sos-router.js`. To update it:

1. Edit the `getTelegramMiniAppHtml()` function
2. Modify styles or add new sections
3. Deploy: `wrangler deploy`
4. Restart your Telegram client or close/reopen the Mini App

Alternatively, for larger changes:
- Create a separate HTML file
- Serve it from a different endpoint
- Update the `/start` command to link to the new location

## Troubleshooting

### Bot not responding to commands

1. Check webhook is set correctly:
   ```bash
   curl "https://api.telegram.org/bot{TOKEN}/getWebhookInfo"
   ```

2. Verify worker has the secret:
   ```bash
   wrangler secret list
   ```

3. Check worker logs:
   ```bash
   wrangler tail --env production
   ```

### Mini App not loading

1. Verify the worker is deployed: `wrangler status`
2. Check domain is accessible: `curl https://sos.camodevops.online/bot/app`
3. Ensure Telegram WebApp.js is loaded (browser console should show no errors)

### Webhook not receiving updates

1. Verify the URL format:
   - Must be: `https://sos.camodevops.online/webhook/telegram/{token}`
   - Replace `{token}` with actual token

2. Check bot hasn't been banned or suspended

3. Wait a few seconds after setting webhook (Telegram has delays)

## Security Considerations

1. **Bot Token**: Treat as a secret - never commit to git
2. **Webhook Secret**: Optional but recommended for validation
3. **Session**: Mini App checks for `sos_auth` cookie (inherited from CamoFlow OS)
4. **CORS**: Mini App runs in Telegram's WebView (no CORS needed)

## Integration with Kyra Agent

The Mini App Chat tab can integrate with the Kyra agent:

1. Connect to agent service at `:8090`
2. Send prompts via the chat interface
3. Receive agent responses in real-time
4. Store conversation history in browser localStorage

To enable:
- Ensure agent service is running
- Update the chat handler in the Mini App
- Handle CORS (use CORS proxy or agent service relay)

## Future Enhancements

- [ ] Real-time metrics updates via WebSocket
- [ ] Inline keyboards for quick actions
- [ ] Animation and transitions
- [ ] Photo/media support in chat
- [ ] Scheduled notifications
- [ ] Integration with ERPNext/Frappe for lead data
- [ ] Audio messages support

## References

- [Telegram Bot API Docs](https://core.telegram.org/bots/api)
- [Telegram Mini Apps](https://core.telegram.org/bots/webapps)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [CamoFlow OS Documentation](./CAMOFLOW.md)
