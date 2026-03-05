// ─────────────────────────────────────────────────────────────
//  services/aiService.js  – Grok AI integration (MongoDB)
// ─────────────────────────────────────────────────────────────

const { createGrokClient, GROK_MODEL, MAX_TOKENS } = require('../config/ai');
const Conversation = require('../models/Conversation');
const Log          = require('../models/Log');
const { v4: uuidv4 } = require('uuid');

// ── System Prompt ─────────────────────────────────────────────
const SYSTEM_PROMPT = `You are an intelligent WhatsApp customer support assistant for an e-commerce store.
Your role is to help customers with:
1. Order status inquiries
2. Return and refund policy questions
3. General product or store queries
4. Escalating urgent or complex issues to human agents

RESPONSE FORMAT — You MUST always respond with valid JSON (no markdown, no extra text):
{
  "message": "<friendly, helpful response to the customer>",
  "intent": "<one of: order_status | return_policy | refund_request | escalate | general | greeting>",
  "escalate": <true if refund requested, rude language, high-value complaint, or legal threat — otherwise false>,
  "priority": "<low | medium | high>",
  "extractedOrderId": "<order ID matching pattern ORD-XXXX from user message, or null>",
  "action": "<one of: lookup_order | provide_policy | escalate | respond | collect_info>",
  "sentiment": "<positive | neutral | negative>",
  "followUpQuestion": "<optional clarifying question if needed, or null>"
}

RULES:
- Keep "message" under 200 words, conversational and warm
- Set escalate=true for: refund disputes, threats, repeated complaints, high-value orders >10000 PKR
- priority=high when escalate=true or customer is very frustrated
- Extract order IDs matching ORD-XXXX pattern from the user message
- Return ONLY the JSON object — no markdown, no extra text, no code blocks`;

const RETURN_POLICY = `
STORE RETURN POLICY:
- Returns accepted within 7 days of delivery
- Items must be unused, in original packaging
- Electronics: 3-day return window
- COD orders: refund issued as store credit within 3-5 days
- Card payments: refunded to card within 7-10 business days
- Damaged items: full refund + free replacement offered
- Process: Customer sends photos → Support approves → Pickup arranged
- Non-returnable: Hygiene items, custom orders, sale items marked final`;

// ── Core AI Chat Function ─────────────────────────────────────
async function processMessage({ userMessage, sessionId, orderContext = null, conversationHistory = [] }) {
  const requestId = uuidv4();
  const startTime = Date.now();

  let contextualMessage = userMessage;
  if (orderContext) {
    contextualMessage = `[ORDER CONTEXT: ${JSON.stringify(orderContext)}]\n\nCustomer message: ${userMessage}`;
  }

  // ── OpenAI-compatible format (works with Groq + xAI Grok) ───
  // System prompt goes INSIDE messages array as first entry
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT + '\n\n' + RETURN_POLICY },
    ...conversationHistory.slice(-6),
    { role: 'user', content: contextualMessage }
  ];

  const payload = {
    model:      GROK_MODEL,
    max_tokens: MAX_TOKENS,
    messages
  };

  try {
    const client   = createGrokClient();
    const response = await client.post('/chat/completions', payload);
    const raw      = response.data.choices?.[0]?.message?.content || '';
    const durationMs = Date.now() - startTime;

    // Parse structured JSON
    let parsed;
    try {
      parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
    } catch {
      console.warn('[AI] JSON parse failed, using fallback');
      parsed = buildFallback(userMessage, raw);
    }
    parsed = sanitize(parsed);

    // ── Persist conversation to MongoDB ──────────────────────
    await Conversation.create({
      requestId,
      sessionId,
      userMessage,
      aiMessage:        parsed.message,
      intent:           parsed.intent,
      escalate:         parsed.escalate,
      priority:         parsed.priority,
      sentiment:        parsed.sentiment,
      action:           parsed.action,
      extractedOrderId: parsed.extractedOrderId,
      durationMs
    });

    // ── Persist AI log to MongoDB ─────────────────────────────
    await Log.create({
      type: 'ai_request',
      requestId,
      sessionId,
      prompt: {
        system:   SYSTEM_PROMPT,
        messages: payload.messages,
        model:    GROK_MODEL
      },
      response: {
        raw,
        parsed,
        usage: response.data.usage || {}
      },
      durationMs
    });

    return { success: true, data: parsed, requestId, durationMs };

  } catch (err) {
    const durationMs = Date.now() - startTime;

    // Print full error to terminal for debugging
    console.error('[AI] API call failed:');
    console.error('  Status :', err.response?.status);
    console.error('  Message:', err.response?.data?.error?.message || err.message);

    // Log the error to MongoDB
    await Log.create({
      type: 'ai_request',
      requestId,
      sessionId,
      prompt: { model: GROK_MODEL, messages },
      durationMs,
      error: err.message
    }).catch(() => {}); // don't crash on log failure

    return {
      success: false,
      data: buildFallback(userMessage, null),
      requestId,
      durationMs,
      error: err.message
    };
  }
}

// ── Sanitise response fields ──────────────────────────────────
function sanitize(p) {
  return {
    message:          p.message          || "I'm here to help! Could you describe your issue?",
    intent:           p.intent           || 'general',
    escalate:         Boolean(p.escalate),
    priority:         ['low','medium','high'].includes(p.priority) ? p.priority : 'low',
    extractedOrderId: p.extractedOrderId || null,
    action:           p.action           || 'respond',
    sentiment:        p.sentiment        || 'neutral',
    followUpQuestion: p.followUpQuestion || null
  };
}

// ── Fallback when AI is unavailable ──────────────────────────
function buildFallback(userMessage, rawContent) {
  const lower   = userMessage.toLowerCase();
  const isRefund = lower.includes('refund') || lower.includes('money back');
  const isOrder  = lower.includes('order')  || /ord-\d+/i.test(userMessage);
  return {
    message: rawContent
      ? "I received your message but couldn't process it fully. A support agent will follow up shortly."
      : "I'm experiencing technical difficulties. Please try again or email support@yourstore.com.",
    intent:           isRefund ? 'refund_request' : isOrder ? 'order_status' : 'general',
    escalate:         isRefund,
    priority:         isRefund ? 'high' : 'medium',
    extractedOrderId: extractOrderId(userMessage),
    action:           'escalate',
    sentiment:        'neutral',
    followUpQuestion: null
  };
}

// ── Extract ORD-XXXX from free text ──────────────────────────
function extractOrderId(text) {
  const match = text.match(/ORD-\d+/i);
  return match ? match[0].toUpperCase() : null;
}

module.exports = { processMessage, extractOrderId };