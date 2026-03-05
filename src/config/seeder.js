// ─────────────────────────────────────────────────────────────
//  config/seeder.js  – Seed MongoDB with sample orders
//  Run:  npm run seed
// ─────────────────────────────────────────────────────────────

require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('../models/Order');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/whatsapp-bot';

const seedOrders = [
  {
    orderId: 'ORD-1001',
    customer: 'Ayesha Khan',
    phone: '+923001234567',
    email: 'ayesha@example.com',
    status: 'shipped',
    items: [{ name: 'Wireless Headphones', qty: 1, price: 4999 }],
    total: 4999,
    courier: 'TCS',
    trackingId: 'TCS-88291',
    paymentMethod: 'Card',
    placedAt: new Date('2026-02-28'),
    estimatedDelivery: new Date('2026-03-05')
  },
  {
    orderId: 'ORD-1002',
    customer: 'Bilal Ahmed',
    phone: '+923121234567',
    email: 'bilal@example.com',
    status: 'processing',
    items: [
      { name: 'Mechanical Keyboard', qty: 1, price: 8500 },
      { name: 'Mouse Pad XL',        qty: 1, price: 1200 }
    ],
    total: 9700,
    paymentMethod: 'COD',
    placedAt: new Date('2026-03-01'),
    estimatedDelivery: new Date('2026-03-06')
  },
  {
    orderId: 'ORD-1003',
    customer: 'Sara Malik',
    phone: '+923331234567',
    email: 'sara@example.com',
    status: 'delivered',
    items: [{ name: 'Smart Watch', qty: 1, price: 12000 }],
    total: 12000,
    courier: 'Leopard',
    trackingId: 'LEO-44822',
    paymentMethod: 'Card',
    placedAt: new Date('2026-02-20'),
    estimatedDelivery: new Date('2026-02-25'),
    deliveredAt: new Date('2026-02-24')
  },
  {
    orderId: 'ORD-1004',
    customer: 'Usman Tariq',
    phone: '+923451234567',
    email: 'usman@example.com',
    status: 'cancelled',
    items: [{ name: 'USB-C Hub', qty: 2, price: 3200 }],
    total: 6400,
    paymentMethod: 'Card',
    placedAt: new Date('2026-02-26'),
    cancelledAt: new Date('2026-02-27'),
    cancelReason: 'Customer request',
    refundStatus: 'pending'
  },
  {
    orderId: 'ORD-1005',
    customer: 'Fatima Noor',
    phone: '+923561234567',
    email: 'fatima@example.com',
    status: 'out_for_delivery',
    items: [{ name: 'Laptop Stand', qty: 1, price: 2800 }],
    total: 2800,
    courier: 'Swyft',
    trackingId: 'SWY-19923',
    paymentMethod: 'COD',
    placedAt: new Date('2026-03-02'),
    estimatedDelivery: new Date('2026-03-04')
  },
  {
    orderId: 'ORD-1006',
    customer: 'Hamza Raza',
    phone: '+923009876543',
    email: 'hamza@example.com',
    status: 'refunded',
    items: [{ name: 'Bluetooth Speaker', qty: 1, price: 5500 }],
    total: 5500,
    paymentMethod: 'Card',
    placedAt: new Date('2026-02-15'),
    deliveredAt: new Date('2026-02-18'),
    refundStatus: 'processed'
  }
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('[Seeder] Connected to MongoDB');

    // Clear existing orders
    const deleted = await Order.deleteMany({});
    console.log(`[Seeder] Cleared ${deleted.deletedCount} existing orders`);

    // Insert seed data
    const inserted = await Order.insertMany(seedOrders);
    console.log(`[Seeder] ✅ Inserted ${inserted.length} orders:`);
    inserted.forEach(o => console.log(`  • ${o.orderId} — ${o.customer} — ${o.status}`));

    await mongoose.connection.close();
    console.log('\n[Seeder] Done! Run "npm run dev" to start the server.');
    process.exit(0);
  } catch (err) {
    console.error('[Seeder] Error:', err.message);
    process.exit(1);
  }
}

seed();
