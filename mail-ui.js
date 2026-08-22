/**
 * Inbox UI for the CamoFlow Command Center — served at /app/inbox.
 *
 * Unified view across every mailbox on every configured domain. Each row
 * shows the AI-drafted reply (if Kyra has generated one) so approving and
 * sending is a single click; editing the draft before sending is also
 * one click away. Nothing sends without this explicit approve/edit step —
 * same Policy Gate pattern as the rest of CamoFlow OS.
 */
export function getInboxHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Inbox — CamoFlow</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  :root {
    --ink: #0f1419; --teal: #3db8c4; --sage: #7a9e7e;
    --bg: #0a0d11; --surface: #13171e; --border: #1a1f28;
    --text-primary: #e8eef2; --text-secondary: #a0aab8;
    --success: #4ade80; --warning: #facc15; --error: #ef4444;
  }
  html, body { height: 100%; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, sans-serif;
    background: var(--bg); color: var(--text-primary);
    display: flex; flex-direction: column;
  }
  header {
    padding: 14px 20px; background: var(--surface); border-bottom: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;
  }
  header h1 { font-size: 16px; font-weight: 700; letter-spacing: -0.3px; }
  header .actions { display: flex; gap: 8px; align-items: center; }
  select, button {
    font-family: inherit; font-size: 12px; font-weight: 600;
    background: var(--border); color: var(--text-primary); border: 1px solid var(--border);
    border-radius: 6px; padding: 7px 10px; cursor: pointer;
  }
  select:focus, button:focus { outline: 1px solid var(--teal); }
  button.primary { background: var(--teal); color: var(--ink); border-color: var(--teal); }
  button.primary:hover { opacity: 0.9; }
  button:disabled { opacity: 0.4; cursor: not-allowed; }
  main { flex: 1; display: flex; overflow: hidden; }
  .list {
    width: 360px; flex-shrink: 0; overflow-y: auto; border-right: 1px solid var(--border);
    background: var(--bg);
  }
  .row {
    padding: 12px 16px; border-bottom: 1px solid var(--border); cursor: pointer;
    transition: background 0.15s;
  }
  .row:hover { background: var(--surface); }
  .row.active { background: var(--surface); border-left: 3px solid var(--teal); }
  .row.unread .row-subject { font-weight: 700; }
  .row.unread .row-from::before { content: '●'; color: var(--teal); margin-right: 6px; font-size: 8px; }
  .row-top { display: flex; justify-content: space-between; gap: 8px; margin-bottom: 4px; }
  .row-from { font-size: 12px; color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .row-time { font-size: 10px; color: var(--text-secondary); flex-shrink: 0; font-family: 'Space Mono', monospace; }
  .row-subject { font-size: 13px; margin-bottom: 3px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .row-preview { font-size: 11px; color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .row-badges { display: flex; gap: 4px; margin-top: 6px; }
  .badge {
    font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
    padding: 2px 6px; border-radius: 3px;
  }
  .badge.mailbox { background: rgba(122,158,126,0.15); color: var(--sage); border: 1px solid var(--sage); }
  .badge.draft { background: rgba(61,184,196,0.15); color: var(--teal); border: 1px solid var(--teal); }
  .badge.replied { background: rgba(74,222,128,0.15); color: var(--success); border: 1px solid var(--success); }
  .detail { flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 16px; }
  .empty { flex: 1; display: flex; align-items: center; justify-content: center; color: var(--text-secondary); font-size: 13px; }
  .detail-header { border-bottom: 1px solid var(--border); padding-bottom: 16px; }
  .detail-subject { font-size: 18px; font-weight: 700; margin-bottom: 8px; }
  .detail-meta { font-size: 12px; color: var(--text-secondary); line-height: 1.6; }
  .detail-meta b { color: var(--text-primary); }
  .detail-body {
    font-size: 13px; line-height: 1.6; white-space: pre-wrap; word-break: break-word;
    background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 16px;
  }
  .draft-panel {
    border: 1px solid var(--teal); border-radius: 8px; background: rgba(61,184,196,0.05); padding: 16px;
  }
  .draft-panel h3 {
    font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: var(--teal); margin-bottom: 10px;
    display: flex; align-items: center; gap: 6px;
  }
  .draft-panel textarea {
    width: 100%; min-height: 140px; background: var(--ink); color: var(--text-primary);
    border: 1px solid var(--border); border-radius: 6px; padding: 10px; font-family: inherit;
    font-size: 13px; line-height: 1.5; resize: vertical;
  }
  .draft-panel textarea:focus { outline: 1px solid var(--teal); }
  .draft-actions { display: flex; gap: 8px; margin-top: 10px; }
  .no-draft { color: var(--text-secondary); font-size: 12px; font-style: italic; }
  .compose-panel { display: flex; flex-direction: column; gap: 8px; }
  .compose-panel input, .compose-panel textarea {
    background: var(--ink); color: var(--text-primary); border: 1px solid var(--border);
    border-radius: 6px; padding: 9px 10px; font-family: inherit; font-size: 13px;
  }
  .compose-panel textarea { min-height: 160px; resize: vertical; }
  .toast {
    position: fixed; bottom: 20px; right: 20px; background: var(--surface); border: 1px solid var(--teal);
    border-radius: 8px; padding: 12px 16px; font-size: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.4);
    display: none; z-index: 50;
  }
  .toast.show { display: block; }
  .toast.error { border-color: var(--error); color: var(--error); }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
</style>
</head>
<body>
  <header>
    <h1>📬 Inbox</h1>
    <div class="actions">
      <select id="mailboxFilter"><option value="">All mailboxes</option></select>
      <button id="refreshBtn">↻ Refresh</button>
      <button class="primary" id="composeBtn">✎ Compose</button>
    </div>
  </header>
  <main>
    <div class="list" id="list"></div>
    <div class="detail" id="detail"><div class="empty">Select a message</div></div>
  </main>
  <div class="toast" id="toast"></div>

<script>
  const state = { messages: [], activeId: null, mailbox: '' };

  async function api(path, opts) {
    const res = await fetch(path, { credentials: 'include', headers: { 'Content-Type': 'application/json' }, ...opts });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || res.statusText);
    return data;
  }

  function toast(msg, isError) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.className = 'toast show' + (isError ? ' error' : '');
    setTimeout(() => el.classList.remove('show'), 3500);
  }

  function fmtTime(iso) {
    const d = new Date(iso + 'Z');
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    return sameDay
      ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  function escapeHtml(s) {
    return (s || '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  }

  async function loadMessages() {
    const q = state.mailbox ? '?mailbox=' + encodeURIComponent(state.mailbox) : '';
    const { messages } = await api('/api/mail/messages' + q);
    state.messages = messages;
    renderList();
    // populate mailbox filter from what we've actually seen, once
    const sel = document.getElementById('mailboxFilter');
    if (sel.options.length <= 1) {
      const boxes = [...new Set(messages.map(m => m.mailbox))];
      boxes.forEach(b => {
        const opt = document.createElement('option');
        opt.value = b; opt.textContent = b;
        sel.appendChild(opt);
      });
    }
  }

  function renderList() {
    const list = document.getElementById('list');
    if (!state.messages.length) {
      list.innerHTML = '<div class="empty" style="padding:24px;">No messages yet</div>';
      return;
    }
    list.innerHTML = state.messages.map(m => \`
      <div class="row \${m.is_read ? '' : 'unread'} \${m.id === state.activeId ? 'active' : ''}" data-id="\${m.id}">
        <div class="row-top">
          <div class="row-from">\${escapeHtml(m.direction === 'inbound' ? (m.from_name || m.from_address) : 'to ' + m.to_address)}</div>
          <div class="row-time">\${fmtTime(m.received_at)}</div>
        </div>
        <div class="row-subject">\${escapeHtml(m.subject || '(no subject)')}</div>
        <div class="row-preview">\${escapeHtml((m.body_text || '').slice(0, 80))}</div>
        <div class="row-badges">
          <span class="badge mailbox">\${escapeHtml(m.mailbox)}</span>
          \${m.ai_draft_reply && !m.is_replied ? '<span class="badge draft">Draft ready</span>' : ''}
          \${m.is_replied ? '<span class="badge replied">Replied</span>' : ''}
        </div>
      </div>
    \`).join('');
    list.querySelectorAll('.row').forEach(row => {
      row.addEventListener('click', () => openMessage(row.dataset.id));
    });
  }

  async function openMessage(id) {
    state.activeId = id;
    renderList();
    const { message: m } = await api('/api/mail/messages/' + id);
    const detail = document.getElementById('detail');
    detail.innerHTML = \`
      <div class="detail-header">
        <div class="detail-subject">\${escapeHtml(m.subject || '(no subject)')}</div>
        <div class="detail-meta">
          <div><b>From:</b> \${escapeHtml(m.from_name ? m.from_name + ' <' + m.from_address + '>' : m.from_address)}</div>
          <div><b>To:</b> \${escapeHtml(m.to_address)}</div>
          <div><b>Received:</b> \${new Date(m.received_at + 'Z').toLocaleString()}</div>
        </div>
      </div>
      <div class="detail-body">\${escapeHtml(m.body_text || '(no text body)')}</div>
      \${m.direction === 'inbound' ? renderDraftPanel(m) : ''}
    \`;
    if (m.direction === 'inbound') wireDraftPanel(m);
  }

  function renderDraftPanel(m) {
    if (m.is_replied) {
      return '<div class="draft-panel"><h3>✓ Replied</h3></div>';
    }
    if (!m.ai_draft_reply) {
      return '<div class="draft-panel"><h3>🤖 Kyra\\'s draft</h3><div class="no-draft">Kyra hasn\\'t drafted a reply yet — this can take a few seconds after a message arrives, or ANTHROPIC_API_KEY may not be configured.</div></div>';
    }
    return \`
      <div class="draft-panel">
        <h3>🤖 Kyra's draft reply — review before sending</h3>
        <textarea id="draftText">\${escapeHtml(m.ai_draft_reply)}</textarea>
        <div class="draft-actions">
          <button class="primary" id="sendDraftBtn">Approve &amp; Send</button>
          <button id="regenBtn">Regenerate</button>
        </div>
      </div>
    \`;
  }

  function wireDraftPanel(m) {
    const sendBtn = document.getElementById('sendDraftBtn');
    if (sendBtn) sendBtn.addEventListener('click', async () => {
      sendBtn.disabled = true;
      try {
        const text = document.getElementById('draftText').value;
        await api('/api/mail/messages/' + m.id + '/reply', { method: 'POST', body: JSON.stringify({ text }) });
        toast('Reply sent from ' + m.to_address);
        await loadMessages();
        openMessage(m.id);
      } catch (e) {
        toast(e.message, true);
        sendBtn.disabled = false;
      }
    });
  }

  document.getElementById('refreshBtn').addEventListener('click', loadMessages);
  document.getElementById('mailboxFilter').addEventListener('change', (e) => {
    state.mailbox = e.target.value;
    loadMessages();
  });

  document.getElementById('composeBtn').addEventListener('click', () => {
    state.activeId = null;
    renderList();
    document.getElementById('detail').innerHTML = \`
      <div class="compose-panel">
        <input id="cFrom" placeholder="From (e.g. kyra@camodevops.online)" value="kyra@camodevops.online">
        <input id="cTo" placeholder="To">
        <input id="cSubject" placeholder="Subject">
        <textarea id="cBody" placeholder="Message"></textarea>
        <div class="draft-actions">
          <button class="primary" id="cSendBtn">Send</button>
        </div>
      </div>
    \`;
    document.getElementById('cSendBtn').addEventListener('click', async (e) => {
      e.target.disabled = true;
      try {
        await api('/api/mail/send', { method: 'POST', body: JSON.stringify({
          from: document.getElementById('cFrom').value,
          to: document.getElementById('cTo').value,
          subject: document.getElementById('cSubject').value,
          text: document.getElementById('cBody').value,
        })});
        toast('Sent');
        await loadMessages();
      } catch (err) {
        toast(err.message, true);
        e.target.disabled = false;
      }
    });
  });

  loadMessages().catch(e => toast(e.message, true));
  setInterval(() => loadMessages().catch(() => {}), 30000);
</script>
</body>
</html>`;
}
