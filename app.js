require('dotenv').config();
const express = require('express');
const morgan  = require('morgan');
const path    = require('path');

const { connectDB }    = require('./src/config/database');
const chatRoutes       = require('./src/routes/chatRoutes');
const adminRoutes      = require('./src/routes/adminRoutes');
const { requestLogger } = require('./src/middleware/logger');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── View Engine ──────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/views'));

// ── Static Assets ────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'src/public')));

// ── Body Parsing ─────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── HTTP Logging ─────────────────────────────────────────────
app.use(morgan('dev'));
app.use(requestLogger);

// ── Routes ───────────────────────────────────────────────────
app.use('/', chatRoutes);
app.use('/admin', adminRoutes);

// ── 404 ──────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).render('partials/error', {
    title: '404 - Not Found',
    message: 'The page you requested does not exist.',
    code: 404
  });
});

// ── Global Error Handler ─────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.stack);
  const status = err.status || 500;
  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.status(status).json({ success: false, error: err.message || 'Server error' });
  }
  res.status(status).render('partials/error', {
    title: 'Server Error',
    message: err.message || 'An unexpected error occurred.',
    code: status
  });
});

// ── Bootstrap: connect MongoDB then start server ─────────────
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🤖 WhatsApp AI Support Bot`);
    console.log(`   Chat UI  → http://localhost:${PORT}`);
    console.log(`   Admin    → http://localhost:${PORT}/admin`);
    console.log(`   MongoDB  → ${process.env.MONGO_URI || 'mongodb://localhost:27017/whatsapp-bot'}`);
    console.log(`   Env      → ${process.env.NODE_ENV || 'development'}\n`);
    console.log(`   💡 Tip: Run "npm run seed" to populate sample orders\n`);
  });
});

module.exports = app;
