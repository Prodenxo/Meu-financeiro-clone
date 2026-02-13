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

export default router;
