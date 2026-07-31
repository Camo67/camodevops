// CamoDevOps AI — background service worker
// Routes tasks: window.ai (Gemini Nano) → Groq → Google Gemini → camodevops worker

chrome.action.onClicked.addListener((tab) => {
  if (chrome.sidePanel) {
    chrome.sidePanel.open({ tabId: tab.id });
  }
});

async function getKeys() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["GOOGLE_AI_API_KEY", "GROQ_API_KEY", "CAMODEVOPS_WORKER_URL"], resolve);
  });
}

function classifyTask(text) {
  const t = text.toLowerCase();
  if (/\b(image|picture|draw|generate|illustrat|photo|render|visual)\b/.test(t)) return "image";
  if (/\b(plan|strateg|reason|analyse|analyze|deep|fill.?out|application|form)\b/.test(t)) return "reason";
  if (t.length < 150) return "fast";
  return "default";
}

async function tryWindowAI(message) {
  if (typeof window === "undefined" || !window.ai?.languageModel) return null;
  try {
    const caps = await window.ai.languageModel.capabilities();
    if (caps.available === "no") return null;
    const session = await window.ai.languageModel.create();
    const result = await session.prompt(message);
    session.destroy();
    return { response: result, model_used: "gemini-nano", provider: "chrome-window-ai" };
  } catch {
    return null;
  }
}

async function callGroq(message, model, apiKey) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages: [{ role: "user", content: message }], max_tokens: 1024 }),
  });
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error(data.error?.message || "No response from Groq");
  return { response: text, model_used: model, provider: "groq" };
}

async function callGemini(message, model, apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: message }] }] }),
  });
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error(data.error?.message || "No response from Gemini");
  return { response: text, model_used: model, provider: "google" };
}

async function callWorker(message, workerUrl) {
  const res = await fetch(`${workerUrl}/api/eve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, task_hint: "chat" }),
  });
  const data = await res.json();
  if (!data.response) throw new Error(data.error || "No response from worker");
  return { ...data, provider: data.provider || "worker" };
}

async function route(message) {
  const keys = await getKeys();
  const task = classifyTask(message);

  // Image generation — Gemini only
  if (task === "image") {
    if (keys.GOOGLE_AI_API_KEY) {
      return callGemini(message, "gemini-2.0-flash-exp", keys.GOOGLE_AI_API_KEY);
    }
    return { response: "Image generation requires a Google AI API key. Add one in extension settings.", model_used: null, provider: null };
  }

  // Deep reasoning — Groq DeepSeek R1
  if (task === "reason") {
    if (keys.GROQ_API_KEY) {
      return callGroq(message, "deepseek-r1-distill-llama-70b", keys.GROQ_API_KEY);
    }
    // fallback to Gemini for reasoning
    if (keys.GOOGLE_AI_API_KEY) {
      return callGemini(message, "gemini-2.0-flash", keys.GOOGLE_AI_API_KEY);
    }
  }

  // Fast / short chat — try Chrome window.ai first (free, on-device)
  if (task === "fast") {
    const windowResult = await tryWindowAI(message);
    if (windowResult) return windowResult;
    // fallback to Groq Llama (fast + cheap)
    if (keys.GROQ_API_KEY) {
      return callGroq(message, "llama-3.3-70b-versatile", keys.GROQ_API_KEY);
    }
  }

  // Default path: Groq → Gemini → camodevops worker
  if (keys.GROQ_API_KEY) {
    return callGroq(message, "llama-3.3-70b-versatile", keys.GROQ_API_KEY);
  }
  if (keys.GOOGLE_AI_API_KEY) {
    return callGemini(message, "gemini-2.0-flash", keys.GOOGLE_AI_API_KEY);
  }
  if (keys.CAMODEVOPS_WORKER_URL) {
    return callWorker(message, keys.CAMODEVOPS_WORKER_URL);
  }

  return { response: "No AI provider configured. Open extension settings to add API keys.", model_used: null, provider: null };
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "AI_QUERY") {
    route(msg.payload).then(sendResponse).catch(err => sendResponse({ response: `Error: ${err.message}`, model_used: null, provider: null }));
    return true; // keep channel open for async response
  }
  if (msg.type === "SAVE_SETTINGS") {
    chrome.storage.local.set(msg.payload, () => sendResponse({ ok: true }));
    return true;
  }
  if (msg.type === "GET_SETTINGS") {
    chrome.storage.local.get(["GOOGLE_AI_API_KEY", "GROQ_API_KEY", "CAMODEVOPS_WORKER_URL"], sendResponse);
    return true;
  }
});
