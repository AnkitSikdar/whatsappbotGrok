// ─────────────────────────────────────────────────────────────
//  services/orderService.js  – Order business logic (MongoDB)
// ─────────────────────────────────────────────────────────────

const Order = require('../models/Order');

// ── Find order by ID (case-insensitive) ───────────────────────
async function findOrderById(orderId) {
  return await Order.findOne({
    orderId: orderId.toUpperCase().trim()
  }).lean({ virtuals: true });
}

// ── Find orders by customer phone ─────────────────────────────
async function findOrdersByPhone(phone) {
  return await Order.find({ phone }).sort({ placedAt: -1 }).lean({ virtuals: true });
}

// ── Get all orders ────────────────────────────────────────────
async function getAllOrders() {
  return await Order.find({}).sort({ placedAt: -1 }).lean({ virtuals: true });
}

// ── Format order for AI context ──────────────────────────────
async function formatOrderForAI(orderId) {
  const order = await findOrderById(orderId);
  if (!order) return null;

  return {
    orderId:           order.orderId,
    customer:          order.customer,
    status:            order.statusLabel,
    statusEmoji:       order.statusEmoji,
    items:             order.itemsSummary,
    total:             `PKR ${order.total.toLocaleString()}`,
    courier:           order.courier   || 'Not yet assigned',
    trackingId:        order.trackingId || 'Not yet available',
    placedAt:          order.placedAt
                         ? new Date(order.placedAt).toLocaleDateString() : 'N/A',
    estimatedDelivery: order.estimatedDelivery
                         ? new Date(order.estimatedDelivery).toLocaleDateString() : 'TBD',
    paymentMethod:     order.paymentMethod,
    isEligibleForReturn: order.isEligibleForReturn,
    isRefundable:      order.isRefundable,
    refundStatus:      order.refundStatus || null
  };
}

module.exports = { findOrderById, findOrdersByPhone, getAllOrders, formatOrderForAI };
