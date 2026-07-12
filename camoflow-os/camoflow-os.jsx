import { useState, useEffect, useRef, useMemo } from "react";
import {
  LayoutDashboard, Users, KanbanSquare, FolderKanban, CheckSquare, Receipt,
  Timer, Package, Sparkles, Inbox, ScrollText, Settings, Play, Square,
  Maximize2, X, Plus, ChevronRight, Star, Send, ShieldCheck, Trash2,
  ArrowRight, Circle, CircleDot, CheckCircle2, AlertTriangle, Download
} from "lucide-react";

/* ============================== BRAND ============================== */
const C = {
  ink: "#0f1419", panel: "#151c23", panel2: "#1a232c", line: "#243039",
  text: "#e6ecef", mute: "#8b98a5", dim: "#5c6a75",
  teal: "#3db8c4", tealDim: "#1f4d52", sage: "#7a9e7e", sageDim: "#2c3b2e",
  amber: "#d9a05b", red: "#c96a5d",
};
const MONO = "'Space Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
const SANS = "'Inter', system-ui, -apple-system, sans-serif";

/* ============================== CONSTANTS ============================== */
const STAGES = ["Inquiry", "Qualified", "Proposal", "Negotiation", "Won", "Lost"];
const HATS = ["Lead", "Client", "Crew", "Vendor", "Team"];
const STORE_KEY = "camoflowos:v1";
const uid = () => Math.random().toString(36).slice(2, 9);
const now = () => Date.now();
const days = (ms) => Math.floor((now() - ms) / 86400000);

function seed() {
  return {
    settings: { studio: "CamoDevOps", currency: "ZAR", rate: 1500 },
    contacts: [
      { id: uid(), name: "Cameron De Vries", email: "devries.cameron20@gmail.com", hats: ["Team"], star: true, ts: now() },
      { id: uid(), name: "Timothy Shaw", email: "timmy0723244265@gmail.com", hats: ["Crew"], star: false, ts: now() },
      { id: uid(), name: "William Hankey", email: "wchankey15@gmail.com", hats: ["Crew"], star: false, ts: now() },
    ],
    deals: [], projects: [], tasks: [], invoices: [], gear: [], sessions: [],
    queue: [], activity: [], chat: [], agentApi: [],
    clock: { running: false, projectId: null, startedAt: null },
  };
}

/* ============================== AGENT TOOL REGISTRY (MCP-shaped) ============================== */
const TOOLS = [
  { name: "get_snapshot", description: "Read a compact JSON snapshot of the whole business: contacts, deals, projects, tasks, invoices, gear, pending approvals, and key totals. Always call this before answering questions about current state.", input_schema: { type: "object", properties: {} } },
  { name: "create_contact", description: "Create a person in the CRM. Queues for human approval.", input_schema: { type: "object", properties: { name: { type: "string" }, email: { type: "string" }, hat: { type: "string", enum: HATS } }, required: ["name"] } },
  { name: "create_deal", description: "Open a deal in the pipeline for a contact. Queues for human approval.", input_schema: { type: "object", properties: { contact_name: { type: "string" }, title: { type: "string" }, value: { type: "number" }, stage: { type: "string", enum: STAGES } }, required: ["title", "value"] } },
  { name: "move_deal", description: "Move a deal to another pipeline stage (moving to Won auto-creates a project). Queues for human approval.", input_schema: { type: "object", properties: { deal_title: { type: "string" }, stage: { type: "string", enum: STAGES } }, required: ["deal_title", "stage"] } },
  { name: "create_project", description: "Open a booked project with starter tasks. Queues for human approval.", input_schema: { type: "object", properties: { title: { type: "string" }, client_name: { type: "string" } }, required: ["title"] } },
  { name: "create_task", description: "Add a task to a project. Queues for human approval.", input_schema: { type: "object", properties: { project_title: { type: "string" }, title: { type: "string" }, due: { type: "string", description: "YYYY-MM-DD" }, assignee: { type: "string" } }, required: ["title"] } },
  { name: "draft_invoice", description: "Draft an invoice on a project with line items. Queues for human approval.", input_schema: { type: "object", properties: { project_title: { type: "string" }, items: { type: "array", items: { type: "object", properties: { desc: { type: "string" }, qty: { type: "number" }, unit_price: { type: "number" } }, required: ["desc", "qty", "unit_price"] } } }, required: ["project_title", "items"] } },
];
const WRITE_TOOLS = new Set(TOOLS.map(t => t.name).filter(n => n !== "get_snapshot"));

/* ============================== SMALL UI ============================== */
const Label = ({ children, style }) => (
  <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.18em", color: C.dim, textTransform: "uppercase", ...style }}>{children}</div>
);
const Btn = ({ children, onClick, tone = "ghost", small, style, disabled }) => {
  const tones = {
    ghost: { background: "transparent", border: `1px solid ${C.line}`, color: C.mute },
    teal: { background: C.tealDim, border: `1px solid ${C.teal}`, color: C.teal },
    sage: { background: C.sageDim, border: `1px solid ${C.sage}`, color: C.sage },
    red: { background: "transparent", border: `1px solid ${C.red}`, color: C.red },
  };
  return (
    <button onClick={onClick} disabled={disabled} className="flex items-center gap-1" style={{
      fontFamily: MONO, fontSize: small ? 10 : 11, letterSpacing: "0.08em", textTransform: "uppercase",
      padding: small ? "4px 8px" : "7px 12px", borderRadius: 3, cursor: disabled ? "default" : "pointer",
      opacity: disabled ? 0.4 : 1, ...tones[tone], ...style,
    }}>{children}</button>
  );
};
const Field = ({ value, onChange, placeholder, type = "text", style, onKeyDown }) => (
  <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} onKeyDown={onKeyDown}
    style={{ background: C.ink, border: `1px solid ${C.line}`, color: C.text, fontFamily: SANS, fontSize: 13, padding: "7px 10px", borderRadius: 3, outline: "none", width: "100%", ...style }} />
);
const Sel = ({ value, onChange, options, style }) => (
  <select value={value} onChange={e => onChange(e.target.value)}
    style={{ background: C.ink, border: `1px solid ${C.line}`, color: C.text, fontFamily: MONO, fontSize: 11, padding: "7px 8px", borderRadius: 3, outline: "none", ...style }}>
    {options.map(o => <option key={o} value={o}>{o}</option>)}
  </select>
);
const Empty = ({ icon: Icon, text, hint }) => (
  <div className="flex flex-col items-center justify-center py-16 gap-2" style={{ color: C.dim }}>
    <Icon size={22} strokeWidth={1.4} />
    <div style={{ fontFamily: SANS, fontSize: 13 }}>{text}</div>
    {hint && <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.1em", color: C.dim }}>{hint}</div>}
  </div>
);
const Chip = ({ children, color = C.mute }) => (
  <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color, border: `1px solid ${color}44`, padding: "2px 6px", borderRadius: 2 }}>{children}</span>
);

/* ============================== APP ============================== */
export default function App() {
  const [data, setData] = useState(null);
  const [view, setView] = useState("dashboard");
  const [openProject, setOpenProject] = useState(null);
  const [present, setPresent] = useState(false);
  const [kyraOpen, setKyraOpen] = useState(false);
  const [kyraBusy, setKyraBusy] = useState(false);
  const [kyraInput, setKyraInput] = useState("");
  const [tick, setTick] = useState(0);
  const dataRef = useRef(null);
  const saveTimer = useRef(null);
  const chatEnd = useRef(null);
  /* per-view form state — must stay above the !data early return so the hook order never changes */
  const [nc, setNc] = useState({ name: "", email: "", hat: "Lead" });
  const [dragId, setDragId] = useState(null);
  const [nd, setNd] = useState({ title: "", value: "" });
  const [np, setNp] = useState("");
  const [clockProj, setClockProj] = useState("");
  const [ng, setNg] = useState("");
  const [gearProj, setGearProj] = useState({});

  /* ---- load ---- */
  useEffect(() => {
    (async () => {
      let loaded = null;
      try { const r = await window.storage.get(STORE_KEY); if (r?.value) loaded = JSON.parse(r.value); } catch (e) { /* first run */ }
      setData(loaded || seed());
    })();
  }, []);
  useEffect(() => { dataRef.current = data; }, [data]);

  /* ---- persist (debounced) ---- */
  useEffect(() => {
    if (!data) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try { await window.storage.set(STORE_KEY, JSON.stringify(data)); } catch (e) { console.error("save failed", e); }
    }, 700);
  }, [data]);

  /* ---- clock tick ---- */
  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [data?.chat, kyraBusy]);

  if (!data) return <div className="flex items-center justify-center h-screen" style={{ background: C.ink, color: C.dim, fontFamily: MONO, fontSize: 11, letterSpacing: "0.2em" }}>LOADING CAMOFLOW OS…</div>;

  /* ---- core mutation helper + audit ---- */
  const up = (fn, log) => setData(d => {
    const n = structuredClone(d);
    fn(n);
    if (log) n.activity.unshift({ id: uid(), ts: now(), ...log });
    n.activity = n.activity.slice(0, 250);
    return n;
  });

  const fmt = (v) => { try { return new Intl.NumberFormat("en-ZA", { style: "currency", currency: data.settings.currency, maximumFractionDigits: 0 }).format(v || 0); } catch { return `${data.settings.currency} ${Math.round(v || 0)}`; } };
  const fmtT = (s) => `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  /* ============================== EXECUTOR (used by UI + approved proposals) ============================== */
  function starterTasks(n, projectId, base) {
    ["Kickoff call", "Scope + contract", "Schedule the work"].forEach((t, i) =>
      n.tasks.push({ id: uid(), projectId, title: t, status: "todo", due: new Date(base + (i + 2) * 86400000).toISOString().slice(0, 10), assignee: "", ts: now() }));
  }
  function execTool(n, tool, input, who) {
    const find = (arr, key, q) => q ? arr.find(x => (x[key] || "").toLowerCase().includes(q.toLowerCase())) : undefined;
    if (tool === "create_contact") {
      n.contacts.push({ id: uid(), name: input.name, email: input.email || "", hats: [input.hat || "Lead"], star: false, ts: now() });
      return `Contact "${input.name}" created`;
    }
    if (tool === "create_deal") {
      let c = find(n.contacts, "name", input.contact_name);
      if (!c && input.contact_name) { c = { id: uid(), name: input.contact_name, email: "", hats: ["Lead"], star: false, ts: now() }; n.contacts.push(c); }
      n.deals.push({ id: uid(), title: input.title, contactId: c?.id || null, value: input.value || 0, stage: STAGES.includes(input.stage) ? input.stage : "Inquiry", ts: now(), touched: now() });
      return `Deal "${input.title}" (${fmt(input.value)}) opened`;
    }
    if (tool === "move_deal") {
      const d = find(n.deals, "title", input.deal_title);
      if (!d) return `No deal matching "${input.deal_title}"`;
      d.stage = input.stage; d.touched = now();
      if (input.stage === "Won" && !d.projectId) {
        const p = { id: uid(), title: d.title, contactId: d.contactId, status: "Active", ts: now() };
        n.projects.push(p); d.projectId = p.id; starterTasks(n, p.id, now());
        return `"${d.title}" won → project + starter tasks created`;
      }
      return `"${d.title}" → ${input.stage}`;
    }
    if (tool === "create_project") {
      let c = input.client_name ? find(n.contacts, "name", input.client_name) : null;
      if (!c && input.client_name) { c = { id: uid(), name: input.client_name, email: "", hats: ["Client"], star: false, ts: now() }; n.contacts.push(c); }
      const p = { id: uid(), title: input.title, contactId: c?.id || null, status: "Active", ts: now() };
      n.projects.push(p); starterTasks(n, p.id, now());
      return `Project "${input.title}" opened with starter tasks`;
    }
    if (tool === "create_task") {
      const p = input.project_title ? find(n.projects, "title", input.project_title) : null;
      n.tasks.push({ id: uid(), projectId: p?.id || null, title: input.title, status: "todo", due: input.due || "", assignee: input.assignee || "", ts: now() });
      return `Task "${input.title}" added${p ? ` to ${p.title}` : ""}`;
    }
    if (tool === "draft_invoice") {
      const p = find(n.projects, "title", input.project_title);
      const items = (input.items || []).map(i => ({ id: uid(), desc: i.desc, qty: i.qty || 1, price: i.unit_price || 0 }));
      n.invoices.push({ id: uid(), projectId: p?.id || null, kind: "invoice", status: "draft", items, ts: now(), num: `INV-${String(n.invoices.length + 1).padStart(3, "0")}` });
      return `Invoice drafted on ${p ? p.title : "unassigned"}`;
    }
    return "Unknown tool";
  }

  /* ============================== KYRA HARNESS ============================== */
  const snapshot = () => {
    const d = dataRef.current;
    return {
      studio: d.settings.studio, currency: d.settings.currency, rate: d.settings.rate,
      totals: {
        open_pipeline: d.deals.filter(x => !["Won", "Lost"].includes(x.stage)).reduce((a, b) => a + b.value, 0),
        unpaid_invoices: d.invoices.filter(i => i.kind === "invoice" && i.status !== "paid").reduce((a, i) => a + i.items.reduce((s, it) => s + it.qty * it.price, 0), 0),
        pending_approvals: d.queue.filter(q => q.status === "pending").length,
      },
      contacts: d.contacts.map(c => ({ name: c.name, hats: c.hats, email: c.email })).slice(0, 40),
      deals: d.deals.map(x => ({ title: x.title, stage: x.stage, value: x.value, days_idle: days(x.touched) })).slice(0, 40),
      projects: d.projects.map(p => ({ title: p.title, status: p.status, open_tasks: d.tasks.filter(t => t.projectId === p.id && t.status !== "done").length })).slice(0, 30),
      tasks_overdue: d.tasks.filter(t => t.status !== "done" && t.due && t.due < new Date().toISOString().slice(0, 10)).map(t => t.title).slice(0, 20),
      invoices: d.invoices.map(i => ({ num: i.num, kind: i.kind, status: i.status, total: i.items.reduce((s, it) => s + it.qty * it.price, 0) })).slice(0, 30),
      gear_out: d.gear.filter(g => g.status === "field").map(g => g.name),
    };
  };

  async function runKyra(text) {
    if (!text.trim() || kyraBusy) return;
    setKyraInput("");
    setKyraBusy(true);
    up(n => { n.chat.push({ id: uid(), role: "user", text }); n.agentApi.push({ role: "user", content: text }); });
    await new Promise(r => setTimeout(r, 30));
    let msgs = [...dataRef.current.agentApi].slice(-20);
    const system = `You are Kyra, the operations agent inside CamoFlow OS — the one-stack business command for ${dataRef.current.settings.studio} (Cape Town). The whole app follows one journey: Inquiry → Deal → Booked Project → Deliver → Paid. Rules: (1) call get_snapshot before answering anything about current state; (2) write tools NEVER execute directly — they queue a proposal in the human Review Queue (the Policy Gate). After queueing, tell the human exactly what is waiting for approval. (3) Be terse, action-first, zero filler. Currency: ${dataRef.current.settings.currency}.`;
    try {
      for (let i = 0; i < 6; i++) {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1000, system, messages: msgs, tools: TOOLS }),
        });
        const out = await res.json();
        if (out.error) { up(n => n.chat.push({ id: uid(), role: "kyra", text: `API error: ${out.error.message || "unknown"}`, err: true })); break; }
        msgs.push({ role: "assistant", content: out.content });
        const textOut = (out.content || []).filter(b => b.type === "text").map(b => b.text).join("\n").trim();
        const toolUses = (out.content || []).filter(b => b.type === "tool_use");
        if (textOut) up(n => n.chat.push({ id: uid(), role: "kyra", text: textOut }));
        if (out.stop_reason !== "tool_use" || !toolUses.length) break;
        const results = toolUses.map(tu => {
          if (tu.name === "get_snapshot") {
            up(n => n.chat.push({ id: uid(), role: "tool", text: "read · get_snapshot" }));
            return { type: "tool_result", tool_use_id: tu.id, content: JSON.stringify(snapshot()) };
          }
          const pid = uid();
          up(n => {
            n.queue.unshift({ id: pid, tool: tu.name, input: tu.input, status: "pending", ts: now(), by: "kyra" });
            n.chat.push({ id: uid(), role: "tool", text: `gated · ${tu.name} → Review Queue`, gate: true });
          }, { who: "kyra", action: "proposed", detail: tu.name });
          return { type: "tool_result", tool_use_id: tu.id, content: `Queued as proposal ${pid}. It will only execute once a human approves it in the Review Queue.` };
        });
        msgs.push({ role: "user", content: results });
      }
    } catch (e) {
      up(n => n.chat.push({ id: uid(), role: "kyra", text: `Network error: ${e.message}`, err: true }));
    }
    up(n => { n.agentApi = msgs.slice(-20); });
    setKyraBusy(false);
  }

  /* ============================== DERIVED ============================== */
  const pendingCount = data.queue.filter(q => q.status === "pending").length;
  const today = new Date().toISOString().slice(0, 10);
  const overdue = data.tasks.filter(t => t.status !== "done" && t.due && t.due < today);
  const stalled = data.deals.filter(d => ["Proposal", "Negotiation"].includes(d.stage) && days(d.touched) >= 7);
  const unpaid = data.invoices.filter(i => i.kind === "invoice" && i.status === "sent");
  const invTotal = (i) => i.items.reduce((s, it) => s + it.qty * it.price, 0);
  const openPipe = data.deals.filter(x => !["Won", "Lost"].includes(x.stage)).reduce((a, b) => a + b.value, 0);
  const unpaidTotal = data.invoices.filter(i => i.kind === "invoice" && i.status !== "paid").reduce((a, i) => a + invTotal(i), 0);
  const clockSecs = data.clock.running ? Math.floor((now() - data.clock.startedAt) / 1000) : 0;
  const contactName = (id) => data.contacts.find(c => c.id === id)?.name || "—";
  const projectName = (id) => data.projects.find(p => p.id === id)?.title || "—";

  /* ============================== NAV ============================== */
  const NAV = [
    { g: "Overview", items: [["dashboard", "Dashboard", LayoutDashboard], ["activity", "Activity", ScrollText]] },
    { g: "CRM", items: [["contacts", "Contacts", Users], ["pipeline", "Pipeline", KanbanSquare]] },
    { g: "Work", items: [["projects", "Projects", FolderKanban], ["tasks", "Tasks", CheckSquare], ["clock", "Studio Clock", Timer], ["gear", "Gear Cage", Package]] },
    { g: "Money", items: [["billing", "Billing", Receipt]] },
    { g: "Agent", items: [["queue", "Review Queue", Inbox]] },
    { g: "Admin", items: [["settings", "Settings", Settings]] },
  ];

  /* ============================== VIEWS ============================== */
  const Dashboard = () => (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-4 gap-3">
        {[
          ["Open pipeline", fmt(openPipe), C.teal],
          ["Unpaid invoices", fmt(unpaidTotal), C.amber],
          ["Active projects", data.projects.filter(p => p.status === "Active").length, C.sage],
          ["Awaiting approval", pendingCount, pendingCount ? C.red : C.mute],
        ].map(([l, v, col]) => (
          <div key={l} style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 4, padding: 16 }}>
            <Label>{l}</Label>
            <div style={{ fontFamily: MONO, fontSize: 26, color: col, marginTop: 8 }}>{v}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 4, padding: 16 }}>
          <Label style={{ marginBottom: 12 }}>Needs attention now</Label>
          {(overdue.length + stalled.length + unpaid.length + pendingCount) === 0
            ? <div style={{ fontFamily: SANS, fontSize: 13, color: C.dim, padding: "20px 0" }}>Clear board. Nothing is on fire.</div>
            : <div className="flex flex-col gap-2">
              {pendingCount > 0 && <AttRow icon={ShieldCheck} col={C.teal} text={`${pendingCount} agent proposal${pendingCount > 1 ? "s" : ""} waiting at the gate`} go={() => setView("queue")} />}
              {overdue.map(t => <AttRow key={t.id} icon={AlertTriangle} col={C.red} text={`Overdue: ${t.title} (${projectName(t.projectId)})`} go={() => setView("tasks")} />)}
              {stalled.map(d => <AttRow key={d.id} icon={Circle} col={C.amber} text={`Stalled ${days(d.touched)}d: ${d.title} in ${d.stage}`} go={() => setView("pipeline")} />)}
              {unpaid.map(i => <AttRow key={i.id} icon={Receipt} col={C.amber} text={`Unpaid: ${i.num} · ${fmt(invTotal(i))}`} go={() => setView("billing")} />)}
            </div>}
        </div>
        <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 4, padding: 16 }}>
          <Label style={{ marginBottom: 12 }}>Pipeline funnel</Label>
          {STAGES.slice(0, 4).concat(["Won"]).map(s => {
            const arr = data.deals.filter(d => d.stage === s);
            const val = arr.reduce((a, b) => a + b.value, 0);
            const max = Math.max(1, ...STAGES.map(x => data.deals.filter(d => d.stage === x).reduce((a, b) => a + b.value, 0)));
            return (
              <div key={s} className="flex items-center gap-3 mb-2">
                <div style={{ fontFamily: MONO, fontSize: 10, width: 90, color: C.mute, textTransform: "uppercase", letterSpacing: "0.1em" }}>{s}</div>
                <div className="flex-1" style={{ height: 8, background: C.ink, borderRadius: 2 }}>
                  <div style={{ height: 8, width: `${(val / max) * 100}%`, background: s === "Won" ? C.sage : C.teal, borderRadius: 2, minWidth: arr.length ? 4 : 0 }} />
                </div>
                <div style={{ fontFamily: MONO, fontSize: 10, color: C.dim, width: 90, textAlign: "right" }}>{arr.length} · {fmt(val)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
  const AttRow = ({ icon: Icon, col, text, go }) => (
    <button onClick={go} className="flex items-center gap-2 text-left w-full" style={{ background: C.ink, border: `1px solid ${C.line}`, borderRadius: 3, padding: "8px 10px", cursor: "pointer" }}>
      <Icon size={13} color={col} />
      <span className="flex-1" style={{ fontFamily: SANS, fontSize: 12, color: C.text }}>{text}</span>
      <ChevronRight size={13} color={C.dim} />
    </button>
  );

  /* ---- Contacts ---- */
  const Contacts = () => (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 items-center" style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 4, padding: 12 }}>
        <Field value={nc.name} onChange={v => setNc({ ...nc, name: v })} placeholder="Name" style={{ width: 200 }} />
        <Field value={nc.email} onChange={v => setNc({ ...nc, email: v })} placeholder="Email" style={{ width: 220 }} />
        <Sel value={nc.hat} onChange={v => setNc({ ...nc, hat: v })} options={HATS} />
        <Btn tone="teal" onClick={() => { if (!nc.name.trim()) return; up(n => execTool(n, "create_contact", { name: nc.name, email: nc.email, hat: nc.hat }, "you"), { who: "you", action: "created contact", detail: nc.name }); setNc({ name: "", email: "", hat: "Lead" }); }}><Plus size={12} />Add</Btn>
      </div>
      {data.contacts.length === 0 ? <Empty icon={Users} text="No contacts yet." hint="add one above — or tell kyra" /> :
        <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 4 }}>
          {data.contacts.map((c, i) => (
            <div key={c.id} className="flex items-center gap-3" style={{ padding: "10px 14px", borderTop: i ? `1px solid ${C.line}` : "none" }}>
              <button onClick={() => up(n => { n.contacts.find(x => x.id === c.id).star = !c.star; })} style={{ cursor: "pointer", background: "none", border: "none" }}>
                <Star size={13} color={c.star ? C.amber : C.dim} fill={c.star ? C.amber : "none"} />
              </button>
              <div style={{ fontFamily: SANS, fontSize: 13, color: C.text, width: 200 }}>{c.name}</div>
              <div style={{ fontFamily: MONO, fontSize: 11, color: C.mute, flex: 1 }}>{c.email || "—"}</div>
              <div className="flex gap-1">{c.hats.map(h => <Chip key={h} color={h === "Client" ? C.sage : h === "Lead" ? C.teal : C.mute}>{h}</Chip>)}</div>
              <Btn small onClick={() => up(n => execTool(n, "create_deal", { contact_name: c.name, title: `${c.name} — new job`, value: 0 }, "you"), { who: "you", action: "opened deal for", detail: c.name })}>+ deal</Btn>
            </div>
          ))}
        </div>}
    </div>
  );

  /* ---- Pipeline ---- */
  const Pipeline = () => (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex gap-2 items-center" style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 4, padding: 12 }}>
        <Field value={nd.title} onChange={v => setNd({ ...nd, title: v })} placeholder="Deal title" style={{ width: 260 }} />
        <Field value={nd.value} onChange={v => setNd({ ...nd, value: v })} placeholder="Value" type="number" style={{ width: 120 }} />
        <Btn tone="teal" onClick={() => { if (!nd.title.trim()) return; up(n => execTool(n, "create_deal", { title: nd.title, value: Number(nd.value) || 0 }, "you"), { who: "you", action: "opened deal", detail: nd.title }); setNd({ title: "", value: "" }); }}><Plus size={12} />Open deal</Btn>
        <div className="flex-1" />
        <div style={{ fontFamily: MONO, fontSize: 11, color: C.mute }}>Open: <span style={{ color: C.teal }}>{fmt(openPipe)}</span></div>
      </div>
      <div className="flex gap-3 flex-1 overflow-x-auto pb-2">
        {STAGES.map(s => (
          <div key={s} onDragOver={e => e.preventDefault()} onDrop={() => { if (!dragId) return; up(n => { const d = n.deals.find(x => x.id === dragId); if (d) { const msg = execTool(n, "move_deal", { deal_title: d.title, stage: s }, "you"); } }, { who: "you", action: "moved deal to", detail: s }); setDragId(null); }}
            className="flex flex-col gap-2" style={{ minWidth: 210, flex: 1, background: C.panel, border: `1px solid ${C.line}`, borderRadius: 4, padding: 10 }}>
            <div className="flex items-center justify-between">
              <Label style={{ color: s === "Won" ? C.sage : s === "Lost" ? C.red : C.dim }}>{s}</Label>
              <span style={{ fontFamily: MONO, fontSize: 10, color: C.dim }}>{data.deals.filter(d => d.stage === s).length}</span>
            </div>
            {data.deals.filter(d => d.stage === s).map(d => (
              <div key={d.id} draggable onDragStart={() => setDragId(d.id)}
                style={{ background: C.ink, border: `1px solid ${dragId === d.id ? C.teal : C.line}`, borderRadius: 3, padding: 10, cursor: "grab" }}>
                <div style={{ fontFamily: SANS, fontSize: 12.5, color: C.text }}>{d.title}</div>
                <div className="flex justify-between items-center mt-1">
                  <span style={{ fontFamily: MONO, fontSize: 11, color: C.teal }}>{fmt(d.value)}</span>
                  <span style={{ fontFamily: MONO, fontSize: 9, color: days(d.touched) >= 7 && ["Proposal", "Negotiation"].includes(d.stage) ? C.amber : C.dim }}>{days(d.touched)}d</span>
                </div>
                <div style={{ fontFamily: MONO, fontSize: 9, color: C.dim, marginTop: 2 }}>{contactName(d.contactId)}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  /* ---- Projects ---- */
  const proj = data.projects.find(p => p.id === openProject);
  const Projects = () => proj ? <ProjectDetail p={proj} /> : (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2" style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 4, padding: 12 }}>
        <Field value={np} onChange={setNp} placeholder="Project title" style={{ width: 300 }} />
        <Btn tone="teal" onClick={() => { if (!np.trim()) return; up(n => execTool(n, "create_project", { title: np }, "you"), { who: "you", action: "opened project", detail: np }); setNp(""); }}><Plus size={12} />Open project</Btn>
      </div>
      {data.projects.length === 0 ? <Empty icon={FolderKanban} text="No projects yet." hint="win a deal — or open one directly" /> :
        <div className="grid grid-cols-3 gap-3">
          {data.projects.map(p => {
            const open = data.tasks.filter(t => t.projectId === p.id && t.status !== "done").length;
            const done = data.tasks.filter(t => t.projectId === p.id && t.status === "done").length;
            const billed = data.invoices.filter(i => i.projectId === p.id).reduce((a, i) => a + invTotal(i), 0);
            return (
              <button key={p.id} onClick={() => setOpenProject(p.id)} className="text-left" style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 4, padding: 14, cursor: "pointer" }}>
                <div className="flex justify-between items-start">
                  <div style={{ fontFamily: SANS, fontSize: 14, color: C.text, fontWeight: 600 }}>{p.title}</div>
                  <Chip color={p.status === "Active" ? C.sage : C.mute}>{p.status}</Chip>
                </div>
                <div style={{ fontFamily: MONO, fontSize: 10, color: C.dim, marginTop: 4 }}>{contactName(p.contactId)}</div>
                <div className="flex gap-4 mt-3" style={{ fontFamily: MONO, fontSize: 10, color: C.mute }}>
                  <span>{open} open · {done} done</span>
                  <span style={{ color: C.sage }}>{fmt(billed)}</span>
                </div>
              </button>
            );
          })}
        </div>}
    </div>
  );

  const ProjectDetail = ({ p }) => {
    const [tab, setTab] = useState("tasks");
    const [nt, setNt] = useState("");
    const pTasks = data.tasks.filter(t => t.projectId === p.id);
    const pInv = data.invoices.filter(i => i.projectId === p.id);
    const pSess = data.sessions.filter(s => s.projectId === p.id);
    const pGear = data.gear.filter(g => g.projectId === p.id && g.status === "field");
    const unbilled = pSess.filter(s => !s.billed);
    const unbilledVal = unbilled.reduce((a, s) => a + s.value, 0);
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Btn small onClick={() => setOpenProject(null)}>← all projects</Btn>
          <div style={{ fontFamily: SANS, fontSize: 17, fontWeight: 700, color: C.text }}>{p.title}</div>
          <Chip color={C.sage}>{p.status}</Chip>
          <div className="flex-1" />
          <Btn small onClick={() => up(n => { const x = n.projects.find(z => z.id === p.id); x.status = x.status === "Active" ? "Delivered" : "Active"; }, { who: "you", action: "set project status", detail: p.title })}>{p.status === "Active" ? "mark delivered" : "reopen"}</Btn>
        </div>
        <div className="flex gap-2">
          {["tasks", "billing", "time", "gear"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", padding: "6px 12px", borderRadius: 3, cursor: "pointer", background: tab === t ? C.tealDim : "transparent", border: `1px solid ${tab === t ? C.teal : C.line}`, color: tab === t ? C.teal : C.mute }}>{t}</button>
          ))}
        </div>
        {tab === "tasks" && (
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <Field value={nt} onChange={setNt} placeholder="New task" style={{ width: 300 }} onKeyDown={e => { if (e.key === "Enter" && nt.trim()) { up(n => execTool(n, "create_task", { project_title: p.title, title: nt }, "you"), { who: "you", action: "added task", detail: nt }); setNt(""); } }} />
              <Btn tone="teal" small onClick={() => { if (!nt.trim()) return; up(n => execTool(n, "create_task", { project_title: p.title, title: nt }, "you"), { who: "you", action: "added task", detail: nt }); setNt(""); }}><Plus size={11} />Add</Btn>
            </div>
            <TaskList tasks={pTasks} />
          </div>
        )}
        {tab === "billing" && (
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <Btn tone="teal" small onClick={() => up(n => { n.invoices.push({ id: uid(), projectId: p.id, kind: "quote", status: "draft", items: [{ id: uid(), desc: "Line item", qty: 1, price: data.settings.rate }], ts: now(), num: `Q-${String(n.invoices.length + 1).padStart(3, "0")}` }); }, { who: "you", action: "drafted quote on", detail: p.title })}><Plus size={11} />New quote</Btn>
              <Btn tone="sage" small disabled={!unbilled.length} onClick={() => up(n => { unbilled.forEach(s => { n.sessions.find(x => x.id === s.id).billed = true; }); n.invoices.push({ id: uid(), projectId: p.id, kind: "invoice", status: "draft", items: [{ id: uid(), desc: `Billable time · ${unbilled.length} session(s)`, qty: 1, price: unbilledVal }], ts: now(), num: `INV-${String(n.invoices.length + 1).padStart(3, "0")}` }); }, { who: "you", action: "invoiced time on", detail: p.title })}>Invoice unbilled time ({fmt(unbilledVal)})</Btn>
            </div>
            {pInv.length === 0 ? <Empty icon={Receipt} text="Nothing billed yet." /> : pInv.map(i => <InvoiceCard key={i.id} inv={i} />)}
          </div>
        )}
        {tab === "time" && (
          <div className="flex flex-col gap-3">
            <div className="flex gap-2 items-center">
              {!data.clock.running && <Btn tone="teal" small onClick={() => up(n => { n.clock = { running: true, projectId: p.id, startedAt: now() }; }, { who: "you", action: "started clock on", detail: p.title })}><Play size={11} />Start clock here</Btn>}
              {data.clock.running && data.clock.projectId === p.id && <Btn tone="red" small onClick={stopClock}><Square size={11} />Stop · {fmtT(clockSecs)}</Btn>}
            </div>
            {pSess.length === 0 ? <Empty icon={Timer} text="No sessions logged." /> :
              <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 4 }}>
                {pSess.map((s, i) => (
                  <div key={s.id} className="flex items-center gap-4" style={{ padding: "9px 14px", borderTop: i ? `1px solid ${C.line}` : "none", fontFamily: MONO, fontSize: 11 }}>
                    <span style={{ color: C.text }}>{fmtT(s.seconds)}</span>
                    <span style={{ color: C.sage }}>{fmt(s.value)}</span>
                    <span style={{ color: C.dim }}>{new Date(s.ts).toLocaleDateString()}</span>
                    <div className="flex-1" />
                    <Chip color={s.billed ? C.sage : C.amber}>{s.billed ? "billed" : "unbilled"}</Chip>
                  </div>
                ))}
              </div>}
          </div>
        )}
        {tab === "gear" && (
          <div className="flex flex-col gap-2">
            {pGear.length === 0 ? <Empty icon={Package} text="No gear checked out to this job." hint="check gear out from the gear cage" /> :
              pGear.map(g => (
                <div key={g.id} className="flex items-center gap-3" style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 3, padding: "9px 14px" }}>
                  <span style={{ fontFamily: SANS, fontSize: 13, color: C.text, flex: 1 }}>{g.name}</span>
                  <Btn small onClick={() => up(n => { const x = n.gear.find(z => z.id === g.id); x.status = "cage"; x.projectId = null; }, { who: "you", action: "returned gear", detail: g.name })}>return to cage</Btn>
                </div>
              ))}
          </div>
        )}
      </div>
    );
  };

  /* ---- Tasks ---- */
  const TaskList = ({ tasks }) => tasks.length === 0 ? <Empty icon={CheckSquare} text="No tasks yet." /> : (
    <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 4 }}>
      {tasks.map((t, i) => {
        const Ico = t.status === "done" ? CheckCircle2 : t.status === "doing" ? CircleDot : Circle;
        const late = t.status !== "done" && t.due && t.due < today;
        return (
          <div key={t.id} className="flex items-center gap-3" style={{ padding: "9px 14px", borderTop: i ? `1px solid ${C.line}` : "none" }}>
            <button onClick={() => up(n => { const x = n.tasks.find(z => z.id === t.id); x.status = x.status === "todo" ? "doing" : x.status === "doing" ? "done" : "todo"; }, { who: "you", action: "moved task", detail: t.title })} style={{ background: "none", border: "none", cursor: "pointer" }}>
              <Ico size={15} color={t.status === "done" ? C.sage : t.status === "doing" ? C.teal : C.dim} />
            </button>
            <span className="flex-1" style={{ fontFamily: SANS, fontSize: 13, color: t.status === "done" ? C.dim : C.text, textDecoration: t.status === "done" ? "line-through" : "none" }}>{t.title}</span>
            {t.assignee && <Chip>{t.assignee}</Chip>}
            {t.due && <span style={{ fontFamily: MONO, fontSize: 10, color: late ? C.red : C.dim }}>{t.due}</span>}
            <span style={{ fontFamily: MONO, fontSize: 9, color: C.dim, width: 130, textAlign: "right" }}>{projectName(t.projectId)}</span>
            <button onClick={() => up(n => { n.tasks = n.tasks.filter(z => z.id !== t.id); }, { who: "you", action: "deleted task", detail: t.title })} style={{ background: "none", border: "none", cursor: "pointer" }}><Trash2 size={12} color={C.dim} /></button>
          </div>
        );
      })}
    </div>
  );
  const TasksView = () => <TaskList tasks={[...data.tasks].sort((a, b) => (a.status === "done") - (b.status === "done"))} />;

  /* ---- Billing ---- */
  const InvoiceCard = ({ inv }) => (
    <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 4, padding: 14 }}>
      <div className="flex items-center gap-3 mb-2">
        <span style={{ fontFamily: MONO, fontSize: 12, color: C.text }}>{inv.num}</span>
        <Chip color={inv.kind === "quote" ? C.teal : C.sage}>{inv.kind}</Chip>
        <Chip color={inv.status === "paid" ? C.sage : inv.status === "sent" ? C.amber : C.mute}>{inv.status}</Chip>
        <span style={{ fontFamily: MONO, fontSize: 10, color: C.dim }}>{projectName(inv.projectId)}</span>
        <div className="flex-1" />
        <span style={{ fontFamily: MONO, fontSize: 14, color: C.sage }}>{fmt(invTotal(inv))}</span>
      </div>
      {inv.items.map(it => (
        <div key={it.id} className="flex items-center gap-2 mb-1">
          <Field value={it.desc} onChange={v => up(n => { n.invoices.find(x => x.id === inv.id).items.find(y => y.id === it.id).desc = v; })} style={{ flex: 1, padding: "5px 8px", fontSize: 12 }} />
          <Field type="number" value={it.qty} onChange={v => up(n => { n.invoices.find(x => x.id === inv.id).items.find(y => y.id === it.id).qty = Number(v); })} style={{ width: 60, padding: "5px 8px", fontSize: 12 }} />
          <Field type="number" value={it.price} onChange={v => up(n => { n.invoices.find(x => x.id === inv.id).items.find(y => y.id === it.id).price = Number(v); })} style={{ width: 110, padding: "5px 8px", fontSize: 12 }} />
          <button onClick={() => up(n => { const x = n.invoices.find(z => z.id === inv.id); x.items = x.items.filter(y => y.id !== it.id); })} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={12} color={C.dim} /></button>
        </div>
      ))}
      <div className="flex gap-2 mt-2">
        <Btn small onClick={() => up(n => { n.invoices.find(x => x.id === inv.id).items.push({ id: uid(), desc: "Line item", qty: 1, price: 0 }); })}><Plus size={10} />line</Btn>
        {inv.kind === "quote" && <Btn small tone="teal" onClick={() => up(n => { const x = n.invoices.find(z => z.id === inv.id); x.kind = "invoice"; x.num = x.num.replace("Q-", "INV-"); }, { who: "you", action: "converted quote", detail: inv.num })}><ArrowRight size={10} />convert to invoice</Btn>}
        {inv.kind === "invoice" && inv.status === "draft" && <Btn small tone="teal" onClick={() => up(n => { n.invoices.find(x => x.id === inv.id).status = "sent"; }, { who: "you", action: "sent", detail: inv.num })}><Send size={10} />mark sent</Btn>}
        {inv.kind === "invoice" && inv.status === "sent" && <Btn small tone="sage" onClick={() => up(n => { n.invoices.find(x => x.id === inv.id).status = "paid"; }, { who: "you", action: "marked paid", detail: inv.num })}><CheckCircle2 size={10} />mark paid</Btn>}
      </div>
    </div>
  );
  const Billing = () => (
    <div className="flex flex-col gap-3">
      {data.invoices.length === 0 ? <Empty icon={Receipt} text="No quotes or invoices yet." hint="open a project → billing → new quote" /> :
        [...data.invoices].reverse().map(i => <InvoiceCard key={i.id} inv={i} />)}
    </div>
  );

  /* ---- Studio Clock ---- */
  function stopClock() {
    const secs = Math.floor((now() - dataRef.current.clock.startedAt) / 1000);
    const val = (secs / 3600) * dataRef.current.settings.rate;
    up(n => {
      n.sessions.unshift({ id: uid(), projectId: n.clock.projectId, seconds: secs, rate: n.settings.rate, value: Math.round(val), ts: now(), billed: false });
      n.clock = { running: false, projectId: null, startedAt: null };
    }, { who: "you", action: "logged session", detail: fmtT(secs) });
    setPresent(false);
  }
  const Clock = () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-4" style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 4, padding: 36 }}>
        <Label>live billable time</Label>
        <div style={{ fontFamily: MONO, fontSize: 64, color: data.clock.running ? C.teal : C.dim, letterSpacing: "0.04em" }}>{fmtT(clockSecs)}</div>
        <div style={{ fontFamily: MONO, fontSize: 22, color: C.sage }}>{fmt((clockSecs / 3600) * data.settings.rate)}</div>
        <div style={{ fontFamily: MONO, fontSize: 11, color: C.dim }}>{fmt(data.settings.rate)}/hr{data.clock.running ? ` · ${projectName(data.clock.projectId)}` : ""}</div>
        <div className="flex gap-2 items-center">
          {!data.clock.running && <>
            <Sel value={clockProj} onChange={setClockProj} options={["— pick project —", ...data.projects.map(p => p.title)]} />
            <Btn tone="teal" onClick={() => { const p = data.projects.find(x => x.title === clockProj); up(n => { n.clock = { running: true, projectId: p?.id || null, startedAt: now() }; }, { who: "you", action: "started clock", detail: clockProj || "unassigned" }); }}><Play size={12} />Start</Btn>
          </>}
          {data.clock.running && <>
            <Btn tone="red" onClick={stopClock}><Square size={12} />Stop + log</Btn>
            <Btn onClick={() => setPresent(true)}><Maximize2 size={12} />Present to client</Btn>
          </>}
        </div>
      </div>
      <Label>logged sessions</Label>
      {data.sessions.length === 0 ? <Empty icon={Timer} text="No sessions logged yet." /> :
        <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 4 }}>
          {data.sessions.map((s, i) => (
            <div key={s.id} className="flex items-center gap-4" style={{ padding: "9px 14px", borderTop: i ? `1px solid ${C.line}` : "none", fontFamily: MONO, fontSize: 11 }}>
              <span style={{ color: C.text }}>{fmtT(s.seconds)}</span>
              <span style={{ color: C.sage }}>{fmt(s.value)}</span>
              <span style={{ color: C.mute, flex: 1 }}>{projectName(s.projectId)}</span>
              <span style={{ color: C.dim }}>{new Date(s.ts).toLocaleString()}</span>
              <Chip color={s.billed ? C.sage : C.amber}>{s.billed ? "billed" : "unbilled"}</Chip>
            </div>
          ))}
        </div>}
    </div>
  );

  /* ---- Gear ---- */
  const Gear = () => (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2" style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 4, padding: 12 }}>
        <Field value={ng} onChange={setNg} placeholder="Add gear (e.g. Sony FX3 · A-cam)" style={{ width: 320 }} />
        <Btn tone="teal" onClick={() => { if (!ng.trim()) return; up(n => { n.gear.push({ id: uid(), name: ng, status: "cage", projectId: null }); }, { who: "you", action: "added gear", detail: ng }); setNg(""); }}><Plus size={12} />Add</Btn>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[["cage", "In the cage"], ["field", "Out in the field"]].map(([st, lab]) => (
          <div key={st} style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 4, padding: 12 }}>
            <Label style={{ marginBottom: 10 }}>{lab} · {data.gear.filter(g => g.status === st).length}</Label>
            {data.gear.filter(g => g.status === st).length === 0 ? <div style={{ fontFamily: SANS, fontSize: 12, color: C.dim }}>{st === "cage" ? "No gear yet — add your first item." : "Everything's in the cage."}</div> :
              data.gear.filter(g => g.status === st).map(g => (
                <div key={g.id} className="flex items-center gap-2 mb-2">
                  <span className="flex-1" style={{ fontFamily: SANS, fontSize: 12.5, color: C.text }}>{g.name}{g.projectId ? <span style={{ fontFamily: MONO, fontSize: 9, color: C.dim }}> · {projectName(g.projectId)}</span> : null}</span>
                  {st === "cage" ? <>
                    <Sel value={gearProj[g.id] || "—"} onChange={v => setGearProj({ ...gearProj, [g.id]: v })} options={["—", ...data.projects.map(p => p.title)]} style={{ padding: "4px 6px", fontSize: 10 }} />
                    <Btn small onClick={() => { const p = data.projects.find(x => x.title === gearProj[g.id]); up(n => { const x = n.gear.find(z => z.id === g.id); x.status = "field"; x.projectId = p?.id || null; }, { who: "you", action: "checked out", detail: g.name }); }}>check out</Btn>
                  </> : <Btn small onClick={() => up(n => { const x = n.gear.find(z => z.id === g.id); x.status = "cage"; x.projectId = null; }, { who: "you", action: "returned", detail: g.name })}>return</Btn>}
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );

  /* ---- Review Queue (the Policy Gate) ---- */
  const Queue = () => (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2" style={{ background: C.panel, border: `1px solid ${C.teal}55`, borderRadius: 4, padding: "10px 14px" }}>
        <ShieldCheck size={15} color={C.teal} />
        <span style={{ fontFamily: SANS, fontSize: 12.5, color: C.mute }}>The Policy Gate. Kyra proposes; nothing executes until you approve it here. Every decision lands in the Activity log.</span>
      </div>
      {data.queue.length === 0 ? <Empty icon={Inbox} text="Queue is clear." hint="ask kyra to do something — it lands here first" /> :
        data.queue.map(q => (
          <div key={q.id} style={{ background: C.panel, border: `1px solid ${q.status === "pending" ? C.teal + "66" : C.line}`, borderRadius: 4, padding: 14, opacity: q.status === "pending" ? 1 : 0.55 }}>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={13} color={C.teal} />
              <span style={{ fontFamily: MONO, fontSize: 12, color: C.text, letterSpacing: "0.05em" }}>{q.tool}</span>
              <Chip color={q.status === "pending" ? C.amber : q.status === "approved" ? C.sage : C.dim}>{q.status}</Chip>
              <div className="flex-1" />
              <span style={{ fontFamily: MONO, fontSize: 9, color: C.dim }}>{new Date(q.ts).toLocaleTimeString()}</span>
            </div>
            <pre style={{ fontFamily: MONO, fontSize: 11, color: C.mute, background: C.ink, border: `1px solid ${C.line}`, borderRadius: 3, padding: 10, whiteSpace: "pre-wrap", margin: 0 }}>{JSON.stringify(q.input, null, 2)}</pre>
            {q.result && <div style={{ fontFamily: MONO, fontSize: 10, color: C.sage, marginTop: 6 }}>→ {q.result}</div>}
            {q.status === "pending" && (
              <div className="flex gap-2 mt-3">
                <Btn tone="sage" small onClick={() => up(n => { const x = n.queue.find(z => z.id === q.id); x.status = "approved"; x.result = execTool(n, q.tool, q.input, "kyra"); }, { who: "you", action: "approved", detail: q.tool })}><CheckCircle2 size={11} />Approve + execute</Btn>
                <Btn tone="red" small onClick={() => up(n => { n.queue.find(z => z.id === q.id).status = "dismissed"; }, { who: "you", action: "dismissed", detail: q.tool })}><X size={11} />Dismiss</Btn>
              </div>
            )}
          </div>
        ))}
    </div>
  );

  /* ---- Activity ---- */
  const Activity = () => data.activity.length === 0 ? <Empty icon={ScrollText} text="Nothing logged yet." hint="every action — yours and kyra's — lands here" /> : (
    <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 4 }}>
      {data.activity.map((a, i) => (
        <div key={a.id} className="flex items-center gap-3" style={{ padding: "8px 14px", borderTop: i ? `1px solid ${C.line}` : "none" }}>
          <span style={{ fontFamily: MONO, fontSize: 9, color: a.who === "kyra" ? C.teal : C.dim, width: 40, textTransform: "uppercase", letterSpacing: "0.1em" }}>{a.who}</span>
          <span style={{ fontFamily: SANS, fontSize: 12, color: C.text, flex: 1 }}>{a.action} <span style={{ color: C.mute }}>{a.detail}</span></span>
          <span style={{ fontFamily: MONO, fontSize: 9, color: C.dim }}>{new Date(a.ts).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );

  /* ---- Settings ---- */
  const SettingsView = () => (
    <div className="flex flex-col gap-4" style={{ maxWidth: 460 }}>
      {[["Studio name", "studio", "text"], ["Currency (ISO)", "currency", "text"], ["Hourly rate", "rate", "number"]].map(([lab, key, type]) => (
        <div key={key}>
          <Label style={{ marginBottom: 6 }}>{lab}</Label>
          <Field type={type} value={data.settings[key]} onChange={v => up(n => { n.settings[key] = type === "number" ? Number(v) : v; })} />
        </div>
      ))}
      <div>
        <Label style={{ marginBottom: 6 }}>Your data · zero lock-in</Label>
        <Btn onClick={() => {
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
          const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "camoflow-os-export.json"; a.click();
        }}><Download size={12} />Export everything as JSON</Btn>
        <div style={{ fontFamily: SANS, fontSize: 11, color: C.dim, marginTop: 8 }}>Stored in your private Claude storage under <span style={{ fontFamily: MONO }}>{STORE_KEY}</span>. Export any time — POPIA-friendly, portable, yours.</div>
      </div>
    </div>
  );

  const VIEWS = { dashboard: Dashboard, contacts: Contacts, pipeline: Pipeline, projects: Projects, tasks: TasksView, billing: Billing, clock: Clock, gear: Gear, queue: Queue, activity: Activity, settings: SettingsView };
  const Active = VIEWS[view];
  const title = NAV.flatMap(g => g.items).find(i => i[0] === view)?.[1] || "";

  /* ============================== RENDER ============================== */
  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ background: C.ink, color: C.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Inter:wght@400;500;600;700&display=swap');
        ::-webkit-scrollbar{width:8px;height:8px} ::-webkit-scrollbar-thumb{background:${C.line};border-radius:4px}
        input::placeholder{color:${C.dim}} select option{background:${C.panel}}
        @media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}
      `}</style>

      {/* ---- Sidebar ---- */}
      <div className="flex flex-col" style={{ width: 210, background: C.panel, borderRight: `1px solid ${C.line}`, padding: "18px 12px" }}>
        <div style={{ fontFamily: MONO, fontSize: 14, fontWeight: 700, letterSpacing: "0.14em", color: C.text }}>CAMOFLOW<span style={{ color: C.teal }}>·OS</span></div>
        <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.16em", color: C.dim, marginTop: 3, textTransform: "uppercase" }}>{data.settings.studio} · one stack</div>
        <div className="flex-1 overflow-y-auto mt-5">
          {NAV.map(g => (
            <div key={g.g} className="mb-4">
              <Label style={{ marginBottom: 6, paddingLeft: 8 }}>{g.g}</Label>
              {g.items.map(([id, lab, Icon]) => (
                <button key={id} onClick={() => { setView(id); setOpenProject(null); }} className="flex items-center gap-2 w-full text-left" style={{
                  padding: "7px 8px", borderRadius: 3, cursor: "pointer", border: "none",
                  background: view === id ? C.tealDim : "transparent",
                  color: view === id ? C.teal : C.mute, fontFamily: SANS, fontSize: 12.5,
                }}>
                  <Icon size={14} strokeWidth={1.8} />
                  <span className="flex-1">{lab}</span>
                  {id === "queue" && pendingCount > 0 && <span style={{ fontFamily: MONO, fontSize: 9, background: C.red, color: C.ink, borderRadius: 8, padding: "1px 6px" }}>{pendingCount}</span>}
                </button>
              ))}
            </div>
          ))}
        </div>
        <button onClick={() => setKyraOpen(o => !o)} className="flex items-center gap-2" style={{ background: C.tealDim, border: `1px solid ${C.teal}`, borderRadius: 3, padding: "9px 10px", cursor: "pointer", color: C.teal, fontFamily: MONO, fontSize: 11, letterSpacing: "0.1em" }}>
          <Sparkles size={13} /> KYRA {kyraBusy ? "· WORKING" : ""}
        </button>
      </div>

      {/* ---- Main ---- */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center gap-3" style={{ padding: "14px 22px", borderBottom: `1px solid ${C.line}` }}>
          <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", color: C.text }}>{title}</div>
          <div className="flex-1" />
          {data.clock.running && <button onClick={() => setView("clock")} style={{ background: "none", border: `1px solid ${C.teal}55`, borderRadius: 3, padding: "4px 10px", cursor: "pointer", fontFamily: MONO, fontSize: 11, color: C.teal }}>● {fmtT(clockSecs)}</button>}
          <button onClick={() => setView("queue")} className="flex items-center gap-1" style={{ background: "none", border: `1px solid ${pendingCount ? C.amber : C.line}`, borderRadius: 3, padding: "4px 10px", cursor: "pointer", fontFamily: MONO, fontSize: 10, letterSpacing: "0.1em", color: pendingCount ? C.amber : C.dim }}>
            <ShieldCheck size={12} /> GATE · {pendingCount}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto" style={{ padding: 22 }}><Active /></div>
      </div>

      {/* ---- Kyra drawer ---- */}
      {kyraOpen && (
        <div className="flex flex-col" style={{ width: 330, background: C.panel, borderLeft: `1px solid ${C.line}` }}>
          <div className="flex items-center gap-2" style={{ padding: "14px 16px", borderBottom: `1px solid ${C.line}` }}>
            <Sparkles size={14} color={C.teal} />
            <div>
              <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: "0.14em", color: C.text }}>KYRA</div>
              <div style={{ fontFamily: SANS, fontSize: 10, color: C.dim }}>proposes → you approve at the gate</div>
            </div>
            <div className="flex-1" />
            <button onClick={() => setKyraOpen(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={14} color={C.dim} /></button>
          </div>
          <div className="flex-1 overflow-y-auto flex flex-col gap-2" style={{ padding: 12 }}>
            {data.chat.length === 0 && <div style={{ fontFamily: SANS, fontSize: 12, color: C.dim, padding: 8 }}>Try: "New lead — Woolworths Trust, brand film, R85k, proposal stage" or "What needs my attention?"</div>}
            {data.chat.map(m => m.role === "tool" ? (
              <div key={m.id} className="flex items-center gap-1" style={{ fontFamily: MONO, fontSize: 9.5, color: m.gate ? C.amber : C.dim, letterSpacing: "0.08em", padding: "0 4px" }}>
                {m.gate ? <ShieldCheck size={10} /> : <Circle size={8} />} {m.text}
              </div>
            ) : (
              <div key={m.id} style={{
                alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "88%",
                background: m.role === "user" ? C.tealDim : C.ink, border: `1px solid ${m.err ? C.red : C.line}`,
                borderRadius: 4, padding: "8px 11px", fontFamily: SANS, fontSize: 12.5, color: m.err ? C.red : C.text, whiteSpace: "pre-wrap",
              }}>{m.text}</div>
            ))}
            {kyraBusy && <div style={{ fontFamily: MONO, fontSize: 10, color: C.teal, letterSpacing: "0.14em" }}>KYRA IS WORKING…</div>}
            <div ref={chatEnd} />
          </div>
          <div className="flex gap-2" style={{ padding: 12, borderTop: `1px solid ${C.line}` }}>
            <Field value={kyraInput} onChange={setKyraInput} placeholder="Tell Kyra what happened…" onKeyDown={e => { if (e.key === "Enter") runKyra(kyraInput); }} />
            <Btn tone="teal" onClick={() => runKyra(kyraInput)} disabled={kyraBusy}><Send size={12} /></Btn>
          </div>
        </div>
      )}

      {/* ---- Present mode ---- */}
      {present && (
        <div className="fixed inset-0 flex flex-col items-center justify-center gap-6" style={{ background: C.ink, zIndex: 50 }}>
          <Label style={{ fontSize: 12 }}>{data.settings.studio} · live billable time</Label>
          <div style={{ fontFamily: MONO, fontSize: 120, color: C.teal, letterSpacing: "0.02em" }}>{fmtT(clockSecs)}</div>
          <div style={{ fontFamily: MONO, fontSize: 44, color: C.sage }}>{fmt((clockSecs / 3600) * data.settings.rate)}</div>
          <div style={{ fontFamily: MONO, fontSize: 13, color: C.dim }}>{fmt(data.settings.rate)}/hr · {projectName(data.clock.projectId)}</div>
          <div className="flex gap-3 mt-4">
            <Btn onClick={() => setPresent(false)}>exit present</Btn>
            <Btn tone="red" onClick={stopClock}><Square size={12} />stop + log</Btn>
          </div>
        </div>
      )}
    </div>
  );
}
