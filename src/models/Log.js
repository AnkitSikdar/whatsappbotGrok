// ─────────────────────────────────────────────────────────────
//  models/Log.js  – MongoDB Log Schema (HTTP + AI logs)
// ─────────────────────────────────────────────────────────────

const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['http_request', 'ai_request', 'error', 'system'],
    required: true,
    index: true
  },
  sessionId:  { type: String, default: null, index: true },
  requestId:  { type: String, default: null },

  // HTTP request fields
  method:     { type: String, default: null },
  path:       { type: String, default: null },
  ip:         { type: String, default: null },
  userAgent:  { type: String, default: null },
  body:       { type: mongoose.Schema.Types.Mixed, default: null },

  // AI request fields
  prompt: {
    system:   { type: String, default: null },
    messages: { type: mongoose.Schema.Types.Mixed, default: null },
    model:    { type: String, default: null }
  },
  response: {
    raw:    { type: String, default: null },
    parsed: { type: mongoose.Schema.Types.Mixed, default: null },
    usage:  { type: mongoose.Schema.Types.Mixed, default: null }
  },

  durationMs: { type: Number, default: null },
  error:      { type: String, default: null }

}, {
  timestamps: true,
  // Auto-expire logs after 30 days (TTL index)
  expires: 60 * 60 * 24 * 30
});

// TTL index — MongoDB auto-deletes logs older than 30 days
LogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

module.exports = mongoose.model('Log', LogSchema);
