import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import * as controller from '../controllers/contas-financeiras.controller.js';

const router = Router();

router.get('/', requireAuth, controller.listContasFinanceiras);
router.post('/', requireAuth, controller.createContaFinanceira);
router.put('/:id', requireAuth, controller.updateContaFinanceira);
router.delete('/:id', requireAuth, controller.deleteContaFinanceira);

export default router;
