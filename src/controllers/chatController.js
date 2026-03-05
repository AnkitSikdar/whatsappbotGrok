// ─────────────────────────────────────────────────────────────
//  controllers/chatController.js  – Chat (MongoDB version)
// ─────────────────────────────────────────────────────────────

const { processMessage, extractOrderId } = require('../services/aiService');
const { formatOrderForAI, findOrderById } = require('../services/orderService');
const { createEscalation }               = require('../services/escalationService');
const Conversation                       = require('../models/Conversation');
const { v4: uuidv4 }                     = require('uuid');

// ── GET / – Chat UI ───────────────────────────────────────────
function renderChat(req, res) {
  res.render('chat/index', {
    title: 'AI Support Bot',
    sessionId: uuidv4()
  });
}

// ── POST /api/chat ────────────────────────────────────────────
async function handleChat(req, res, next) {
  try {
    const { message, sessionId, phone } = req.body;
    if (!message?.trim()) {
      return res.status(422).json({ success: false, error: 'Message is required.' });
    }

    const activeSession = sessionId || uuidv4();

    // Step 1: Extract order ID
    const extractedOrderId = extractOrderId(message);

    // Step 2: Fetch order context from MongoDB
    let orderContext = null;
    if (extractedOrderId) {
      orderContext = await formatOrderForAI(extractedOrderId);
    }

    // Step 3: Build conversation history from MongoDB
    const history = await Conversation.find({ sessionId: activeSession })
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();
    const conversationHistory = history.reverse().flatMap(h => [
      { role: 'user',      content: h.userMessage },
      { role: 'assistant', content: h.aiMessage   }
    ]);

    // Step 4: Call Grok AI
    const result = await processMessage({
      userMessage: message,
      sessionId:   activeSession,
      orderContext,
      conversationHistory
    });

    const aiData = result.data;

    // Step 5: Handle escalation
    let escalationTicket = null;
    if (aiData.escalate) {
      escalationTicket = await createEscalation({
        sessionId:   activeSession,
        userMessage: message,
        aiResponse:  aiData,
        priority:    aiData.priority,
        orderId:     extractedOrderId
      });
    }

    return res.json({
      success:   true,
      sessionId: activeSession,
      reply: {
        message:          aiData.message,
        intent:           aiData.intent,
        sentiment:        aiData.sentiment,
        escalated:        aiData.escalate,
        priority:         aiData.priority,
        followUpQuestion: aiData.followUpQuestion,
        orderFound:       orderContext !== null,
        orderDetails:     orderContext,
        ticketNumber:     escalationTicket?.ticketNumber || null
      },
      meta: {
        requestId: result.requestId,
        durationMs: result.durationMs,
        aiError: !result.success ? result.error : null
      }
    });

  } catch (err) {
    next(err);
  }
}

// ── POST /api/order-lookup ────────────────────────────────────
async function lookupOrder(req, res, next) {
  try {
    const { orderId } = req.body;
    if (!orderId?.trim()) {
      return res.status(422).json({ success: false, error: 'Order ID is required.' });
    }
    const order = await findOrderById(orderId.trim());
    if (!order) {
      return res.status(404).json({ success: false, error: `Order ${orderId} not found.` });
    }
    return res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
}

module.exports = { renderChat, handleChat, lookupOrder };
