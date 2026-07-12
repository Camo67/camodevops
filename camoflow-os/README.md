# CamoFlow OS — one-stack business command

Single-file React artifact. Runs live in Claude with persistent storage — your data survives across sessions under key `camoflowos:v1`. CamoFlow brand throughout: `#0f1419` ink / `#3db8c4` teal / `#7a9e7e` sage, Space Mono + Inter.

## The journey it runs
**Inquiry → Deal → Booked Project → Deliver → Paid** — same spine as the Studio OS doc you clipped, rebuilt in your lane.

| Module | What it does |
|---|---|
| Dashboard | Needs-attention feed (overdue tasks, deals stalled ≥7d, unpaid invoices, gated proposals) + pipeline funnel |
| Contacts | One rolodex, many hats (Lead/Client/Crew/Vendor/Team). Seeded with you, Timothy, William |
| Pipeline | Drag kanban. **Won auto-creates the project + starter tasks** |
| Projects | Tabs: Tasks · Billing · Time · Gear per job |
| Tasks | todo → doing → done cycle, due dates, overdue flags |
| Billing | Quotes → convert to invoice → sent → paid. **"Invoice unbilled time"** pulls logged sessions into a line item |
| Studio Clock | Live meter at your rate (ZAR default) + full-screen **Present mode** so the client watches the meter run |
| Gear Cage | In the cage / out in the field, checked out per project |
| Review Queue | **The Policy Gate** — see below |
| Activity | Full audit log: every action, yours and Kyra's. This is the in-app observability layer |
| Settings | Studio name, currency, rate, **Export everything as JSON** (zero lock-in, POPIA-portable) |

## The agent harness (the part that matters)
**Kyra** runs a real Anthropic tool-use loop, not a chatbox:

1. `TOOLS[]` registry — Anthropic/MCP tool shape (`name`, `description`, `input_schema`). Seven tools: `get_snapshot` + six writes (`create_contact`, `create_deal`, `move_deal`, `create_project`, `create_task`, `draft_invoice`).
2. `runKyra()` — multi-turn loop against `claude-sonnet-4-6` via `/v1/messages`, follows `tool_use` blocks, feeds `tool_result` back, max 6 hops.
3. **Policy Gate** — reads execute instantly; **writes never execute**. They enqueue a proposal card in the Review Queue, Kyra gets told "queued pending human approval," and tells you. Approve → `execTool()` runs the same dispatcher the UI buttons use, result logged to Activity. Dismiss → dropped. Same RED-data-never-crosses pattern as your CamoFlow railway, applied to actions instead of data.

Try: *"New lead — Woolworths Trust, brand film, R85k, proposal stage"* → Kyra queues `create_contact` + `create_deal`, you approve at the gate.

## Porting the harness to your local stack (the ai-tools-setup piece)
The `TOOLS[]` array is lift-and-shift into your Hermes Web MCP server / ollama-mcp-bridge — the schema is already MCP tool shape. Executor logic lives in one function (`execTool`) with no React dependency: move it behind an MCP server and point Claude Desktop or hermes3:8b at it. Desktop wiring when you're on the camo box:

```json
{
  "mcpServers": {
    "camoflow-os": {
      "command": "node",
      "args": ["/home/camo/CamoFlow/production/mcp/camoflow-os-server.js"],
      "env": { "CFOS_DATA": "/home/camo/CamoFlow/production/vaults/CamoFlowOS/cfos.json" }
    }
  }
}
```
Back up `claude_desktop_config.json` to `.bak` before editing, validate JSON after, restart Claude Desktop, confirm the tools list. The full repair flow in `/desktop-commander:ai-tools-setup` needs Desktop Commander connected — run it from the desktop app, not web.

## Skill notes from this build
- **/brand-guidelines** is Anthropic's palette — skipped for a product you sell; built in your documented CamoFlow brand instead.
- **/datadog:ddtoolsets** requires `plugin:datadog:mcp`, not set up in this session — run `/ddsetup` in a Desktop session first. Until then, the Activity log is the observability layer, and it's tenant-local.

## Extend path (when this becomes a CamodevOps product)
Same data model ports straight to your standard stack: Cloudflare Workers + D1 (tables mirror the state keys: contacts/deals/projects/tasks/invoices/sessions/gear/queue/activity), token links for client-facing views (`/bid/`, `/d/`, `/call/` equivalents), Stripe/Payfast on invoices, multi-tenant "acting as" on top. The gate + audit log are already the POPIA story.
