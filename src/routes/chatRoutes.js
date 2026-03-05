// ─────────────────────────────────────────────────────────────
//  routes/chatRoutes.js
// ─────────────────────────────────────────────────────────────

const express = require('express');
const router  = express.Router();
const { renderChat, handleChat, lookupOrder } = require('../controllers/chatController');
const { validateChatMessage, handleValidationErrors } = require('../middleware/validation');

router.get('/',                    renderChat);
router.post('/api/chat',           validateChatMessage, handleValidationErrors, handleChat);
router.post('/api/order-lookup',   lookupOrder);

module.exports = router;
