import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import * as controller from '../controllers/billing.controller.js';
import * as asaasWebhook from '../controllers/asaas-webhook.controller.js';

const router = Router();

router.get('/open-finance/plans', requireAuth, controller.getOpenFinancePlans);
router.post('/open-finance/checkout', requireAuth, controller.postOpenFinanceCheckout);
router.post('/asaas/webhook', asaasWebhook.postAsaasWebhook);

export default router;
