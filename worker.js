/**
 * Cloudflare Worker — serves the static site AND handles WhatsApp webhook.
 * Routes:
 *   GET  /webhook  → WhatsApp verification (hub.mode=subscribe)
 *   POST /webhook  → Incoming WhatsApp messages → forwards to harness
 *   GET  /health   → Health check
 *   *              → Static assets
 */

const VERIFY_TOKEN = "agentic-harness-verify";
const HARNESS_URL = "http://152.110.239.104:8080/webhook";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Health check
    if (url.pathname === "/health") {
      return new Response(JSON.stringify({ status: "healthy", service: "camodevops" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // WhatsApp webhook verification (GET)
    if (url.pathname === "/webhook" && request.method === "GET") {
      const mode = url.searchParams.get("hub.mode");
      const token = url.searchParams.get("hub.verify_token");
      const challenge = url.searchParams.get("hub.challenge");

      if (mode === "subscribe" && token === VERIFY_TOKEN) {
        return new Response(challenge, { status: 200 });
      }
      return new Response("Forbidden", { status: 403 });
    }

    // WhatsApp incoming messages (POST)
    if (url.pathname === "/webhook" && request.method === "POST") {
      try {
        const body = await request.text();

        // Forward to local harness
        const harnessResp = await fetch(HARNESS_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Hub-Signature-256": request.headers.get("X-Hub-Signature-256") || "",
          },
          body: body,
        });

        const result = await harnessResp.text();
        return new Response(result, {
          status: harnessResp.status,
          headers: { "Content-Type": "application/json" },
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: "Harness unreachable", detail: e.message }), {
          status: 502,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Default: serve static assets
    return env.ASSETS.fetch(request);
  },
};
