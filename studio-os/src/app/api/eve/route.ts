import { NextRequest, NextResponse } from "next/server";

type TaskHint = "chat" | "image" | "reason" | "form" | "plan" | "default";

interface RouteConfig {
  provider: "groq" | "google" | "ollama" | "anthropic";
  model: string;
  baseUrl: string;
}

function pickRoute(hint: TaskHint): RouteConfig {
  switch (hint) {
    case "image":
      return { provider: "google", model: "gemini-2.0-flash-exp", baseUrl: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent" };
    case "reason":
    case "plan":
      return { provider: "groq", model: "deepseek-r1-distill-llama-70b", baseUrl: "https://api.groq.com/openai/v1/chat/completions" };
    case "form":
      return { provider: "google", model: "gemini-2.0-flash", baseUrl: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent" };
    case "chat":
      return { provider: "groq", model: "llama-3.3-70b-versatile", baseUrl: "https://api.groq.com/openai/v1/chat/completions" };
    default:
      return { provider: "ollama", model: "llama3.2", baseUrl: "http://camodevops-ollama:11434/api/chat" };
  }
}

async function callProvider(route: RouteConfig, message: string): Promise<string> {
  const { provider, model, baseUrl } = route;

  if (provider === "ollama") {
    const res = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages: [{ role: "user", content: message }], stream: false }),
    });
    const data = await res.json();
    return data.message?.content ?? "No response from Ollama";
  }

  if (provider === "groq") {
    const key = process.env.GROQ_API_KEY;
    if (!key) throw new Error("GROQ_API_KEY not set");
    const res = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model, messages: [{ role: "user", content: message }], max_tokens: 1024 }),
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? data.error?.message ?? "No response";
  }

  if (provider === "google") {
    const key = process.env.GOOGLE_AI_API_KEY;
    if (!key) throw new Error("GOOGLE_AI_API_KEY not set");
    const res = await fetch(`${baseUrl}?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: message }] }] }),
    });
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "No response from Gemini";
  }

  if (provider === "anthropic") {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) throw new Error("ANTHROPIC_API_KEY not set");
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model, max_tokens: 1024, messages: [{ role: "user", content: message }] }),
    });
    const data = await res.json();
    return data.content?.[0]?.text ?? data.error?.message ?? "No response";
  }

  throw new Error(`Unknown provider: ${provider}`);
}

export async function POST(req: NextRequest) {
  const { message, task_hint = "default" } = await req.json();
  if (!message) return NextResponse.json({ error: "message required" }, { status: 400 });

  const route = pickRoute(task_hint as TaskHint);
  try {
    const response = await callProvider(route, message);
    return NextResponse.json({ response, model_used: route.model, provider: route.provider });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    // fallback: try Ollama if a cloud provider fails
    if (route.provider !== "ollama") {
      try {
        const ollamaRoute = pickRoute("default");
        const response = await callProvider(ollamaRoute, message);
        return NextResponse.json({ response, model_used: ollamaRoute.model, provider: ollamaRoute.provider, fallback: true });
      } catch { /* ignore fallback error */ }
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
