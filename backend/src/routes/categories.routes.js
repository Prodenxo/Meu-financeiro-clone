import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import * as controller from '../controllers/categories.controller.js';

const router = Router();

router.get('/', requireAuth, controller.listCategories);
router.post('/', requireAuth, controller.createCategory);
router.put('/', requireAuth, controller.updateCategory);
router.delete('/', requireAuth, controller.deleteCategory);

export default router;
