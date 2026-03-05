// ─────────────────────────────────────────────────────────────
//  services/escalationService.js  – Escalation mgmt (MongoDB)
// ─────────────────────────────────────────────────────────────

const Escalation = require('../models/Escalation');

// ── Generate ticket number: ESC-YYYYMMDD-XXXX ────────────────
function generateTicketNumber() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ESC-${date}-${rand}`;
}

// ── Create escalation ticket ──────────────────────────────────
async function createEscalation({ sessionId, userMessage, aiResponse, priority, orderId = null }) {
  const ticket = await Escalation.create({
    ticketNumber: generateTicketNumber(),
    sessionId,
    orderId,
    issue:        userMessage,
    aiSummary:    aiResponse.message,
    intent:       aiResponse.intent,
    priority,
    status:       'open'
  });
  console.log(`[ESCALATION] Ticket ${ticket.ticketNumber} created — Priority: ${priority.toUpperCase()}`);
  return ticket;
}

// ── Get all tickets with optional filters ─────────────────────
async function getEscalations(filter = {}) {
  const query = {};
  if (filter.status)   query.status   = filter.status;
  if (filter.priority) query.priority = filter.priority;
  return await Escalation.find(query).sort({ createdAt: -1 });
}

// ── Resolve a ticket by MongoDB _id ──────────────────────────
async function closeEscalation(id) {
  return await Escalation.findByIdAndUpdate(
    id,
    { status: 'resolved', resolvedAt: new Date() },
    { new: true }
  );
}

module.exports = { createEscalation, getEscalations, closeEscalation };
