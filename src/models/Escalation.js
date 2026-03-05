// ─────────────────────────────────────────────────────────────
//  models/Escalation.js  – MongoDB Escalation/Ticket Schema
// ─────────────────────────────────────────────────────────────

const mongoose = require('mongoose');

const EscalationSchema = new mongoose.Schema({
  ticketNumber: { type: String, required: true, unique: true, index: true },
  sessionId:    { type: String, required: true, index: true },
  orderId:      { type: String, default: null, index: true },

  issue:        { type: String, required: true },
  aiSummary:    { type: String, default: '' },

  intent: {
    type: String,
    enum: ['order_status', 'return_policy', 'refund_request', 'escalate', 'general', 'greeting'],
    default: 'general'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
    index: true
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open',
    index: true
  },

  assignedTo:   { type: String, default: null },
  resolvedAt:   { type: Date,   default: null },
  notes:        [{ type: String }]

}, {
  timestamps: true
});

module.exports = mongoose.model('Escalation', EscalationSchema);
