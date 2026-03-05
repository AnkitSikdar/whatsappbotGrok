// ─────────────────────────────────────────────────────────────
//  controllers/adminController.js  – Admin (MongoDB version)
// ─────────────────────────────────────────────────────────────

const Conversation = require('../models/Conversation');
const Escalation   = require('../models/Escalation');
const Order        = require('../models/Order');
const Log          = require('../models/Log');
const { getEscalations, closeEscalation } = require('../services/escalationService');

// ── GET /admin – Dashboard ────────────────────────────────────
async function renderDashboard(req, res, next) {
  try {
    const [totalConvos, escalations, openEscalations, totalOrders, recentConvos, intentAgg] =
      await Promise.all([
        Conversation.countDocuments(),
        Escalation.countDocuments(),
        Escalation.countDocuments({ status: 'open' }),
        Order.countDocuments(),
        Conversation.find().sort({ createdAt: -1 }).limit(20).lean(),
        Conversation.aggregate([
          { $group: { _id: '$intent', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ])
      ]);

    const intents = {};
    intentAgg.forEach(i => { if (i._id) intents[i._id] = i.count; });

    const allEscalations = await Escalation.find().sort({ createdAt: -1 }).lean();

    res.render('admin/index', {
      title: 'Admin Dashboard',
      stats: { totalConvos, escalations, openEscalations, totalOrders, intents },
      escalations: allEscalations,
      conversations: recentConvos,
      activeTab: req.query.tab || 'overview'
    });
  } catch (err) {
    next(err);
  }
}

// ── GET /admin/api/conversations ──────────────────────────────
async function getConversationsApi(req, res, next) {
  try {
    const page  = parseInt(req.query.page  || 1);
    const limit = parseInt(req.query.limit || 50);
    const skip  = (page - 1) * limit;
    const [data, total] = await Promise.all([
      Conversation.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Conversation.countDocuments()
    ]);
    res.json({ success: true, data, total, page, pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
}

// ── GET /admin/api/escalations ────────────────────────────────
async function getEscalationsApi(req, res, next) {
  try {
    const { status, priority } = req.query;
    const escalations = await getEscalations({ status, priority });
    res.json({ success: true, data: escalations, total: escalations.length });
  } catch (err) { next(err); }
}

// ── POST /admin/api/escalations/:id/resolve ───────────────────
async function resolveTicket(req, res, next) {
  try {
    const ticket = await closeEscalation(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, error: 'Ticket not found.' });
    res.json({ success: true, ticket });
  } catch (err) { next(err); }
}

// ── GET /admin/api/orders ─────────────────────────────────────
async function getOrdersApi(req, res, next) {
  try {
    const orders = await Order.find().sort({ placedAt: -1 }).lean({ virtuals: true });
    res.json({ success: true, data: orders, total: orders.length });
  } catch (err) { next(err); }
}

// ── GET /admin/api/logs ───────────────────────────────────────
async function getLogsApi(req, res, next) {
  try {
    const logs = await Log.find().sort({ createdAt: -1 }).limit(100).lean();
    res.json({ success: true, data: logs });
  } catch (err) { next(err); }
}

// ── GET /admin/api/stats ──────────────────────────────────────
async function getStatsApi(req, res, next) {
  try {
    const [totalConvos, escalations, openEscalations, totalOrders, intentAgg] =
      await Promise.all([
        Conversation.countDocuments(),
        Escalation.countDocuments(),
        Escalation.countDocuments({ status: 'open' }),
        Order.countDocuments(),
        Conversation.aggregate([
          { $group: { _id: '$intent', count: { $sum: 1 } } }
        ])
      ]);
    const intents = {};
    intentAgg.forEach(i => { if (i._id) intents[i._id] = i.count; });
    res.json({ success: true, data: { totalConvos, escalations, openEscalations, totalOrders, intents } });
  } catch (err) { next(err); }
}

module.exports = {
  renderDashboard,
  getConversationsApi,
  getEscalationsApi,
  resolveTicket,
  getOrdersApi,
  getLogsApi,
  getStatsApi
};
