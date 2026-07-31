"use client";

import { useState, useRef, useEffect } from "react";

type TaskHint = "chat" | "image" | "reason" | "form" | "plan";
type Message = { role: "user" | "eve"; text: string; meta?: string };

const HINTS: { value: TaskHint; label: string; desc: string }[] = [
  { value: "chat", label: "Quick chat", desc: "Fast answer via Groq" },
  { value: "image", label: "Generate image", desc: "Gemini image generation" },
  { value: "reason", label: "Deep reason", desc: "DeepSeek R1 via Groq" },
  { value: "form", label: "Fill form", desc: "Gemini structured extraction" },
  { value: "plan", label: "Plan", desc: "Strategic planning via DeepSeek R1" },
];

export default function EveChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [hint, setHint] = useState<TaskHint>("chat");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setBusy(true);
    setMessages(m => [...m, { role: "user", text }]);
    try {
      const res = await fetch("/api/eve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, task_hint: hint }),
      });
      const data = await res.json();
      const meta = data.model_used ? `${data.provider} · ${data.model_used}${data.fallback ? " (fallback)" : ""}` : undefined;
      setMessages(m => [...m, { role: "eve", text: data.response ?? data.error ?? "No response", meta }]);
    } catch (e) {
      setMessages(m => [...m, { role: "eve", text: `Error: ${e instanceof Error ? e.message : "unknown"}` }]);
    }
    setBusy(false);
  }

  return (
    <>
      {/* Trigger bubble */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Open Eve AI"
        style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 50,
          width: 52, height: 52, borderRadius: "50%",
          background: "linear-gradient(135deg, #3db8c4, #7a9e7e)",
          border: "none", cursor: "pointer", boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22,
        }}
      >
        {open ? "✕" : "✦"}
      </button>

      {/* Panel */}
      {open && (
        <div style={{
          position: "fixed", bottom: 88, right: 24, zIndex: 50,
          width: 360, height: 520, borderRadius: 12,
          background: "#151c23", border: "1px solid #243039",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          display: "flex", flexDirection: "column", overflow: "hidden",
          fontFamily: "'Inter', system-ui, sans-serif",
        }}>
          {/* Header */}
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #243039", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18 }}>✦</span>
            <span style={{ color: "#e6ecef", fontWeight: 600, fontSize: 14 }}>Eve</span>
            <span style={{ color: "#5c6a75", fontSize: 12, marginLeft: 2 }}>AI assistant</span>
          </div>

          {/* Mode selector */}
          <div style={{ padding: "8px 12px", borderBottom: "1px solid #1a232c", display: "flex", gap: 6, flexWrap: "wrap" }}>
            {HINTS.map(h => (
              <button
                key={h.value}
                onClick={() => setHint(h.value)}
                title={h.desc}
                style={{
                  fontSize: 11, padding: "3px 8px", borderRadius: 4, cursor: "pointer",
                  fontFamily: "'Space Mono', monospace", textTransform: "uppercase", letterSpacing: "0.06em",
                  background: hint === h.value ? "#1f4d52" : "transparent",
                  border: `1px solid ${hint === h.value ? "#3db8c4" : "#243039"}`,
                  color: hint === h.value ? "#3db8c4" : "#5c6a75",
                }}
              >
                {h.label}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
            {messages.length === 0 && (
              <div style={{ color: "#5c6a75", fontSize: 13, textAlign: "center", marginTop: 40 }}>
                Ask Eve anything — pick a mode above to route to the right AI.
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "85%", padding: "8px 12px", borderRadius: 8, fontSize: 13, lineHeight: 1.5,
                  background: m.role === "user" ? "#1f4d52" : "#1a232c",
                  color: m.role === "user" ? "#3db8c4" : "#e6ecef",
                  border: `1px solid ${m.role === "user" ? "#3db8c4" : "#243039"}`,
                  whiteSpace: "pre-wrap",
                }}>
                  {m.text}
                </div>
                {m.meta && <div style={{ fontSize: 10, color: "#5c6a75", marginTop: 3, fontFamily: "monospace" }}>{m.meta}</div>}
              </div>
            ))}
            {busy && (
              <div style={{ color: "#5c6a75", fontSize: 13, fontStyle: "italic" }}>Eve is thinking…</div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: "10px 12px", borderTop: "1px solid #243039", display: "flex", gap: 8 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
              placeholder="Ask Eve..."
              disabled={busy}
              style={{
                flex: 1, background: "#0f1419", border: "1px solid #243039", color: "#e6ecef",
                fontFamily: "'Inter', sans-serif", fontSize: 13, padding: "8px 10px", borderRadius: 6, outline: "none",
              }}
            />
            <button
              onClick={send}
              disabled={busy || !input.trim()}
              style={{
                background: busy ? "#1a232c" : "#1f4d52", border: "1px solid #3db8c4",
                color: "#3db8c4", padding: "8px 14px", borderRadius: 6, cursor: busy ? "default" : "pointer",
                fontSize: 16, opacity: busy || !input.trim() ? 0.4 : 1,
              }}
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}
