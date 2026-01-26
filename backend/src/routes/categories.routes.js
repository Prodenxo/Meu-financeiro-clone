import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import * as controller from '../controllers/categories.controller.js';

const router = Router();

router.get('/', requireAuth, controller.listCategories);
router.get('/budgets/summary', requireAuth, controller.listCategoryBudgetsSummary);
router.get('/budgets', requireAuth, controller.listCategoryBudgets);
router.post('/', requireAuth, controller.createCategory);
router.post('/budgets', requireAuth, controller.upsertCategoryBudget);
router.put('/', requireAuth, controller.updateCategory);
router.delete('/', requireAuth, controller.deleteCategory);

export default router;
