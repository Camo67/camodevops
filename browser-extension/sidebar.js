const messagesEl = document.getElementById("messages");
const inputEl = document.getElementById("input");
const sendBtn = document.getElementById("send");
const modeButtons = document.querySelectorAll(".mode-btn");
const settingsPanel = document.getElementById("settings");
const openSettingsBtn = document.getElementById("open-settings");
const backBtn = document.getElementById("back-btn");
const saveBtn = document.getElementById("save-btn");
const saveStatus = document.getElementById("save-status");

let currentMode = "chat";
let busy = false;

// Mode selector
modeButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    modeButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentMode = btn.dataset.mode;
  });
});

// Settings
openSettingsBtn.addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "GET_SETTINGS" }, (keys) => {
    document.getElementById("key-google").value = keys.GOOGLE_AI_API_KEY || "";
    document.getElementById("key-groq").value = keys.GROQ_API_KEY || "";
    document.getElementById("key-worker").value = keys.CAMODEVOPS_WORKER_URL || "";
    settingsPanel.classList.add("visible");
  });
});

backBtn.addEventListener("click", () => settingsPanel.classList.remove("visible"));

saveBtn.addEventListener("click", () => {
  const payload = {
    GOOGLE_AI_API_KEY: document.getElementById("key-google").value.trim(),
    GROQ_API_KEY: document.getElementById("key-groq").value.trim(),
    CAMODEVOPS_WORKER_URL: document.getElementById("key-worker").value.trim(),
  };
  chrome.runtime.sendMessage({ type: "SAVE_SETTINGS", payload }, () => {
    saveStatus.textContent = "Saved ✓";
    setTimeout(() => { saveStatus.textContent = ""; }, 2000);
  });
});

// Auto-resize textarea
inputEl.addEventListener("input", () => {
  inputEl.style.height = "auto";
  inputEl.style.height = Math.min(inputEl.scrollHeight, 120) + "px";
});

inputEl.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
});
sendBtn.addEventListener("click", send);

function appendMessage(role, text, meta) {
  const empty = messagesEl.querySelector(".empty");
  if (empty) empty.remove();

  const wrapper = document.createElement("div");
  wrapper.style.display = "flex";
  wrapper.style.flexDirection = "column";
  wrapper.style.alignItems = role === "user" ? "flex-end" : "flex-start";

  const bubble = document.createElement("div");
  bubble.className = `msg ${role}`;
  bubble.textContent = text;
  wrapper.appendChild(bubble);

  if (meta) {
    const m = document.createElement("div");
    m.className = "meta";
    m.textContent = meta;
    wrapper.appendChild(m);
  }

  messagesEl.appendChild(wrapper);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return bubble;
}

function setThinking(on) {
  const existing = messagesEl.querySelector(".thinking");
  if (on && !existing) {
    const el = document.createElement("div");
    el.className = "thinking";
    el.textContent = "Routing to best available AI…";
    messagesEl.appendChild(el);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  } else if (!on && existing) {
    existing.remove();
  }
}

async function send() {
  const text = inputEl.value.trim();
  if (!text || busy) return;
  inputEl.value = "";
  inputEl.style.height = "auto";
  setBusy(true);
  appendMessage("user", text);
  setThinking(true);

  chrome.runtime.sendMessage({ type: "AI_QUERY", payload: text, mode: currentMode }, (result) => {
    setThinking(false);
    setBusy(false);
    if (chrome.runtime.lastError) {
      appendMessage("err", `Extension error: ${chrome.runtime.lastError.message}`);
      return;
    }
    const meta = result.model_used ? `${result.provider} · ${result.model_used}` : null;
    appendMessage("ai", result.response || "No response", meta);
  });
}

function setBusy(on) {
  busy = on;
  sendBtn.disabled = on;
  inputEl.disabled = on;
}
