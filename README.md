# 🤖 AI WhatsApp Support Bot — MongoDB Edition

Full-stack Express.js AI-powered customer support bot using **Grok AI (xAI)** + **MongoDB + Mongoose**, with a WhatsApp-style UI and admin dashboard.

---

## 📁 Full Folder Structure

```
whatsapp-bot/
├── app.js                          ← Express entry + MongoDB bootstrap
├── package.json
├── .env.example                    ← Environment template
├── README.md
└── src/
    ├── config/
    │   ├── database.js             ← Mongoose connection + events
    │   ├── ai.js                   ← Grok AI client config
    │   └── seeder.js               ← MongoDB seed script (npm run seed)
    │
    ├── models/                     ← Mongoose schemas
    │   ├── Order.js                ← Orders collection + virtuals
    │   ├── Conversation.js         ← Conversation logs collection
    │   ├── Escalation.js           ← Escalation tickets collection
    │   └── Log.js                  ← HTTP + AI logs (30-day TTL)
    │
    ├── controllers/
    │   ├── chatController.js       ← Chat UI + /api/chat handler
    │   └── adminController.js      ← Dashboard + all admin APIs
    │
    ├── services/
    │   ├── aiService.js            ← Grok AI calls, JSON parse, saves to MongoDB
    │   ├── orderService.js         ← Order lookups from MongoDB
    │   └── escalationService.js    ← Ticket creation + resolution
    │
    ├── middleware/
    │   ├── logger.js               ← Saves HTTP logs to MongoDB
    │   └── validation.js           ← express-validator rules
    │
    ├── routes/
    │   ├── chatRoutes.js           ← GET / · POST /api/chat
    │   └── adminRoutes.js          ← /admin + /admin/api/*
    │
    ├── views/
    │   ├── chat/index.ejs          ← WhatsApp-style dark chat UI
    │   ├── admin/index.ejs         ← Admin dashboard (5 tabs)
    │   └── partials/error.ejs      ← Error page
    │
    └── public/
        ├── css/main.css            ← Dark premium styling
        └── js/
            ├── chat.js             ← Chat bubbles + session management
            └── admin.js            ← Tabs, ticket resolution, log viewer
```

---

## 🚀 Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
```
Edit `.env`:
```env
MONGO_URI=mongodb://localhost:27017/whatsapp-bot
GROK_API_KEY=your_key_from_console.x.ai
```

### 3. Seed sample orders into MongoDB
```bash
npm run seed
```
This inserts 6 sample orders (ORD-1001 to ORD-1006) into your database.

### 4. Start server
```bash
npm run dev        # development with nodemon
npm start          # production
```

Open:
- **Chat** → http://localhost:3000
- **Admin** → http://localhost:3000/admin

---

## 🔑 Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `MONGO_URI` | ✅ Yes | `mongodb://localhost:27017/whatsapp-bot` | MongoDB connection string |
| `GROK_API_KEY` | ✅ Yes | — | xAI API key from console.x.ai |
| `GROK_MODEL` | No | `grok-2-latest` | Grok model |
| `GROK_BASE_URL` | No | `https://api.x.ai/v1` | xAI API base URL |
| `PORT` | No | `3000` | Server port |
| `MAX_TOKENS` | No | `1024` | AI max tokens |
| `ESCALATION_EMAIL` | No | — | Your support team email (for future email alerts) |

---

## 🗄️ MongoDB Collections

| Collection | Description | TTL |
|---|---|---|
| `orders` | Product orders with status, tracking, items | Permanent |
| `conversations` | Every AI chat message (user + AI reply) | Permanent |
| `escalations` | Escalation tickets with priority + status | Permanent |
| `logs` | HTTP requests + AI prompt/response logs | **Auto-deleted after 30 days** |

---

## 🧠 Structured AI JSON Output

```json
{
  "message": "Your order ORD-1001 was shipped via TCS (TCS-88291)...",
  "intent": "order_status",
  "escalate": false,
  "priority": "low",
  "extractedOrderId": "ORD-1001",
  "action": "lookup_order",
  "sentiment": "neutral",
  "followUpQuestion": "Is there anything else I can help with?"
}
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Chat UI |
| POST | `/api/chat` | Send message, get AI response |
| POST | `/api/order-lookup` | Direct order lookup |
| GET | `/admin` | Admin dashboard |
| GET | `/admin/api/conversations` | Paginated conversations |
| GET | `/admin/api/escalations` | Escalation tickets |
| POST | `/admin/api/escalations/:id/resolve` | Resolve a ticket |
| GET | `/admin/api/orders` | All orders |
| GET | `/admin/api/logs` | HTTP + AI logs |
| GET | `/admin/api/stats` | Live stats |

---

## 📦 Sample Orders (after `npm run seed`)

| Order ID | Customer | Status |
|---|---|---|
| ORD-1001 | Ayesha Khan | Shipped 🚚 |
| ORD-1002 | Bilal Ahmed | Processing ⏳ |
| ORD-1003 | Sara Malik | Delivered ✅ |
| ORD-1004 | Usman Tariq | Cancelled ❌ |
| ORD-1005 | Fatima Noor | Out for Delivery 🛵 |
| ORD-1006 | Hamza Raza | Refunded 💰 |

---

## 🛡️ Architecture

- **Separation of concerns**: AI logic in `aiService`, DB queries in models, HTTP in controllers
- **MongoDB TTL**: Logs auto-expire after 30 days — no manual cleanup needed
- **Virtuals**: `statusLabel`, `statusEmoji`, `isEligibleForReturn`, `isRefundable` computed on the Order model
- **Graceful errors**: AI failure returns a fallback response, never crashes the server
- **Pagination**: `/admin/api/conversations` supports `?page=1&limit=50`
