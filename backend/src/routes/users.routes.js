import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import * as controller from '../controllers/users.controller.js';

const router = Router();

router.get('/', requireAuth, controller.listUsers);
router.post('/', requireAuth, controller.createUser);
router.post('/sync-phone', requireAuth, controller.syncPhone);

export default router;
