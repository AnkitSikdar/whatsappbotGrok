// ─────────────────────────────────────────────────────────────
//  models/Conversation.js  – MongoDB Conversation Schema
// ─────────────────────────────────────────────────────────────

const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
  requestId:        { type: String, required: true, unique: true, index: true },
  sessionId:        { type: String, required: true, index: true },

  userMessage:      { type: String, required: true },
  aiMessage:        { type: String, required: true },

  intent: {
    type: String,
    enum: ['order_status', 'return_policy', 'refund_request', 'escalate', 'general', 'greeting'],
    default: 'general',
    index: true
  },
  sentiment: {
    type: String,
    enum: ['positive', 'neutral', 'negative'],
    default: 'neutral'
  },
  action: {
    type: String,
    enum: ['lookup_order', 'provide_policy', 'escalate', 'respond', 'collect_info'],
    default: 'respond'
  },

  escalate:         { type: Boolean, default: false, index: true },
  priority:         { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
  extractedOrderId: { type: String, default: null },
  durationMs:       { type: Number, default: null }

}, {
  timestamps: true
});

// Index for fast session lookups
ConversationSchema.index({ sessionId: 1, createdAt: -1 });

module.exports = mongoose.model('Conversation', ConversationSchema);
