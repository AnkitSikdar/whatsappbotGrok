const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/adminController');

router.get('/',                              ctrl.renderDashboard);
router.get('/api/conversations',             ctrl.getConversationsApi);
router.get('/api/escalations',               ctrl.getEscalationsApi);
router.post('/api/escalations/:id/resolve',  ctrl.resolveTicket);
router.get('/api/orders',                    ctrl.getOrdersApi);
router.get('/api/logs',                      ctrl.getLogsApi);
router.get('/api/stats',                     ctrl.getStatsApi);

module.exports = router;
