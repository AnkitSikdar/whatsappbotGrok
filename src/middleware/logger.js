// ─────────────────────────────────────────────────────────────
//  middleware/logger.js  – HTTP request logger (MongoDB)
// ─────────────────────────────────────────────────────────────

const Log = require('../models/Log');

function requestLogger(req, res, next) {
  if (req.path.startsWith('/css') || req.path.startsWith('/js') || req.path.startsWith('/images')) {
    return next();
  }
  Log.create({
    type:      'http_request',
    method:    req.method,
    path:      req.path,
    ip:        req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent') || 'unknown',
    body:      req.method === 'POST' ? sanitizeBody(req.body) : null
  }).catch(err => console.warn('[Logger] Failed to save log:', err.message));
  next();
}

function sanitizeBody(body) {
  if (!body) return null;
  const s = { ...body };
  delete s.password; delete s.token;
  return s;
}

module.exports = { requestLogger };
