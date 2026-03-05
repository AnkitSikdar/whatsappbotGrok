// ─────────────────────────────────────────────────────────────
//  models/Order.js  – MongoDB Order Schema
// ─────────────────────────────────────────────────────────────

const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  name:  { type: String, required: true },
  qty:   { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 }
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  customer: { type: String, required: true, trim: true },
  phone:    { type: String, trim: true, index: true },
  email:    { type: String, trim: true, lowercase: true },

  status: {
    type: String,
    enum: ['processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned', 'refunded'],
    default: 'processing',
    index: true
  },

  items:   { type: [OrderItemSchema], required: true },
  total:   { type: Number, required: true, min: 0 },

  courier:           { type: String, default: null },
  trackingId:        { type: String, default: null },
  paymentMethod:     { type: String, enum: ['Card', 'COD', 'Bank Transfer'], default: 'COD' },

  placedAt:          { type: Date, default: Date.now },
  estimatedDelivery: { type: Date, default: null },
  deliveredAt:       { type: Date, default: null },
  cancelledAt:       { type: Date, default: null },
  cancelReason:      { type: String, default: null },
  refundStatus:      { type: String, enum: ['pending', 'processed', 'rejected', null], default: null }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ── Virtual: status label ─────────────────────────────────────
const STATUS_LABELS = {
  processing:       'Processing',
  shipped:          'Shipped',
  out_for_delivery: 'Out for Delivery',
  delivered:        'Delivered',
  cancelled:        'Cancelled',
  returned:         'Returned',
  refunded:         'Refunded'
};
const STATUS_EMOJI = {
  processing: '⏳', shipped: '🚚', out_for_delivery: '🛵',
  delivered: '✅', cancelled: '❌', returned: '↩️', refunded: '💰'
};

OrderSchema.virtual('statusLabel').get(function () {
  return STATUS_LABELS[this.status] || this.status;
});
OrderSchema.virtual('statusEmoji').get(function () {
  return STATUS_EMOJI[this.status] || '📦';
});
OrderSchema.virtual('itemsSummary').get(function () {
  return this.items.map(i => `${i.qty}× ${i.name}`).join(', ');
});
OrderSchema.virtual('isEligibleForReturn').get(function () {
  if (this.status !== 'delivered' || !this.deliveredAt) return false;
  const days = (Date.now() - new Date(this.deliveredAt).getTime()) / 86400000;
  const isElec = this.items.some(i =>
    ['headphones','keyboard','watch','laptop','phone','hub','earbuds'].some(k =>
      i.name.toLowerCase().includes(k)
    )
  );
  return days <= (isElec ? 3 : 7);
});
OrderSchema.virtual('isRefundable').get(function () {
  return ['cancelled', 'returned'].includes(this.status) ||
         (this.status === 'delivered' && this.isEligibleForReturn);
});

module.exports = mongoose.model('Order', OrderSchema);
