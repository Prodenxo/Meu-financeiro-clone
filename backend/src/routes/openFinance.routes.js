import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import * as controller from '../controllers/openFinance.controller.js';

const router = Router();

router.get('/pluggy/status', requireAuth, controller.getPluggyStatus);
router.get('/pluggy/connections', requireAuth, controller.getPluggyConnections);
router.post('/pluggy/connect-token', requireAuth, controller.postPluggyConnectToken);
router.post('/pluggy/sync', requireAuth, controller.postPluggySync);

export default router;
