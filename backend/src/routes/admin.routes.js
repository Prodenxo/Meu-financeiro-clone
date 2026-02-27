import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { requireAdmin } from '../middlewares/requireAdmin.js';
import * as controller from '../controllers/admin.controller.js';

const router = Router();

router.get('/users/:userId/transactions', requireAuth, requireAdmin, controller.listUserTransactions);
router.get('/users/:userId/categories', requireAuth, requireAdmin, controller.listUserCategories);
router.get('/users/:userId/budgets/summary', requireAuth, requireAdmin, controller.listUserBudgetsSummary);
router.get('/users/:userId/budgets/yearly', requireAuth, requireAdmin, controller.listUserBudgetsYearly);
router.get('/users/:userId/balance', requireAuth, requireAdmin, controller.getUserBalance);
router.get('/das/status', requireAuth, requireAdmin, controller.listDasStatus);
router.get('/das/pending', requireAuth, requireAdmin, controller.listPendingDas);
router.post('/das/reprocess', requireAuth, requireAdmin, controller.reprocessDas);
router.get('/mei-guide/:userId/certificate/status', requireAuth, requireAdmin, controller.getAdminMeiCertificateStatus);
router.get('/mei-guide/:userId/periods', requireAuth, requireAdmin, controller.listAdminMeiPeriods);
router.get('/mei-guide/:userId/periods-by-cnpj', requireAuth, requireAdmin, controller.listAdminMeiPeriodsByCnpj);
router.get('/mei-guide/:userId/download/:periodoApuracao', requireAuth, requireAdmin, controller.downloadAdminMeiGuide);
router.post('/mei-guide/:userId/send-whatsapp', requireAuth, requireAdmin, controller.sendAdminMeiWhatsapp);

export default router;
