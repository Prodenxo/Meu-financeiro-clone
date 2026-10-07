import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import * as controller from '../controllers/contas-financeiras.controller.js';

const router = Router();

router.get('/', requireAuth, controller.listContasFinanceiras);

export default router;
