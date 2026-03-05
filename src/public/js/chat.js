// ─────────────────────────────────────────────────────────────
//  public/js/chat.js  – WhatsApp Chat UI Logic
// ─────────────────────────────────────────────────────────────

const SESSION_KEY = 'wa_bot_session';

let sessionId = localStorage.getItem(SESSION_KEY) || generateUUID();
localStorage.setItem(SESSION_KEY, sessionId);

// ── DOM Refs ──────────────────────────────────────────────────
const messagesArea  = document.getElementById('messagesArea');
const messageInput  = document.getElementById('messageInput');
const sendBtn       = document.getElementById('sendBtn');
const sessionBadge  = document.getElementById('sessionBadge');

if (sessionBadge) sessionBadge.textContent = `Session: ${sessionId.slice(0,8)}…`;

// ── Quick replies ─────────────────────────────────────────────
document.querySelectorAll('.quick-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    messageInput.value = btn.dataset.msg;
    messageInput.focus();
    sendMessage();
  });
});

// ── Send on Enter (Shift+Enter for newline) ───────────────────
messageInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

sendBtn.addEventListener('click', sendMessage);

// ── Auto-resize textarea ──────────────────────────────────────
messageInput.addEventListener('input', () => {
  messageInput.style.height = 'auto';
  messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
});

// ── Core send function ────────────────────────────────────────
async function sendMessage() {
  const text = messageInput.value.trim();
  if (!text) return;

  messageInput.value = '';
  messageInput.style.height = 'auto';
  sendBtn.disabled = true;

  // Append user bubble
  appendBubble('user', text);

  // Show typing indicator
  const typingId = showTyping();

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, sessionId })
    });

    const data = await res.json();
    removeTyping(typingId);

    if (!res.ok || !data.success) {
      const errMsg = data.errors?.[0]?.message || data.error || 'Something went wrong.';
      appendBubble('bot', errMsg, null, true);
    } else {
      appendBotResponse(data.reply);
    }

  } catch (err) {
    removeTyping(typingId);
    appendBubble('bot', '⚠️ Connection error. Please try again.', null, true);
  } finally {
    sendBtn.disabled = false;
    messageInput.focus();
    scrollToBottom();
  }
}

// ── Append user / error bubble ────────────────────────────────
function appendBubble(role, text, extra = null, isError = false) {
  const row = document.createElement('div');
  row.className = `message-row ${role}`;

  const bubble = document.createElement('div');
  bubble.className = `bubble ${role === 'user' ? 'user' : 'bot'}`;
  if (isError) bubble.style.borderColor = 'rgba(255,71,87,0.3)';

  bubble.innerHTML = `
    <div class="bubble-text">${escapeHtml(text).replace(/\n/g, '<br>')}</div>
    <div class="bubble-time">${getTime()}</div>
  `;

  row.appendChild(bubble);
  messagesArea.appendChild(row);
  scrollToBottom();
  return row;
}

// ── Append full bot response with tags + order card ───────────
function appendBotResponse(reply) {
  const row = document.createElement('div');
  row.className = 'message-row bot';

  const bubble = document.createElement('div');
  bubble.className = 'bubble bot';

  // Main message text
  let html = `<div class="bubble-text">${escapeHtml(reply.message).replace(/\n/g, '<br>')}</div>`;

  // Follow-up question
  if (reply.followUpQuestion) {
    html += `<div style="margin-top:8px;color:var(--text-muted);font-size:0.78rem;">💬 ${escapeHtml(reply.followUpQuestion)}</div>`;
  }

  // Order details card
  if (reply.orderDetails) {
    const o = reply.orderDetails;
    html += `
      <div class="order-card">
        <div class="order-card-title">${o.statusEmoji || '📦'} Order ${o.orderId}</div>
        <div class="order-row"><span class="label">Status</span><span>${o.status}</span></div>
        <div class="order-row"><span class="label">Items</span><span>${escapeHtml(o.items)}</span></div>
        <div class="order-row"><span class="label">Total</span><span>${o.total}</span></div>
        <div class="order-row"><span class="label">Courier</span><span>${o.courier || 'Pending'}</span></div>
        ${o.trackingId ? `<div class="order-row"><span class="label">Tracking</span><span class="mono">${o.trackingId}</span></div>` : ''}
        <div class="order-row"><span class="label">Expected</span><span>${o.estimatedDelivery || 'TBD'}</span></div>
        <div class="order-row"><span class="label">Payment</span><span>${o.paymentMethod}</span></div>
      </div>`;
  }

  // Escalation ticket notice
  if (reply.escalated && reply.ticketNumber) {
    html += `
      <div style="margin-top:8px;padding:7px 10px;background:rgba(255,165,2,0.08);border:1px solid rgba(255,165,2,0.25);border-radius:8px;font-size:0.75rem;color:var(--amber);">
        🎫 Escalation ticket created: <strong class="mono">${reply.ticketNumber}</strong><br>
        A human agent will contact you shortly.
      </div>`;
  }

  // Meta tags
  html += `<div class="bubble-tags">`;
  if (reply.intent) {
    html += `<span class="tag tag-intent">${reply.intent.replace('_', ' ')}</span>`;
  }
  if (reply.sentiment === 'positive') {
    html += `<span class="tag tag-positive">😊 Positive</span>`;
  } else if (reply.sentiment === 'negative') {
    html += `<span class="tag tag-negative">😟 Negative</span>`;
  }
  if (reply.escalated) {
    html += `<span class="tag tag-escalated">🚨 Escalated</span>`;
  }
  html += `</div>`;

  html += `<div class="bubble-time">${getTime()}</div>`;

  bubble.innerHTML = html;
  row.appendChild(bubble);
  messagesArea.appendChild(row);
  scrollToBottom();
}

// ── Typing indicator ──────────────────────────────────────────
function showTyping() {
  const id = 'typing-' + Date.now();
  const row = document.createElement('div');
  row.id = id;
  row.className = 'message-row bot typing-indicator';
  row.innerHTML = `
    <div class="bubble bot">
      <div class="typing-dots">
        <span></span><span></span><span></span>
      </div>
    </div>`;
  messagesArea.appendChild(row);
  scrollToBottom();
  return id;
}

function removeTyping(id) {
  document.getElementById(id)?.remove();
}

// ── Helpers ───────────────────────────────────────────────────
function scrollToBottom() {
  messagesArea.scrollTop = messagesArea.scrollHeight;
}

function getTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(text || ''));
  return div.innerHTML;
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

// ── Initial greeting ──────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    const row = document.createElement('div');
    row.className = 'message-row system';
    row.innerHTML = '<div class="bubble system-msg">🔒 End-to-end encrypted • Powered by Grok AI</div>';
    messagesArea.prepend(row);
  }, 600);
});
