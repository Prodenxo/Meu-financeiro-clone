import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import * as controller from '../controllers/users.controller.js';

const router = Router();

router.get('/', requireAuth, controller.listUsers);
router.get('/empresas', requireAuth, controller.listEmpresas);
router.put('/:userId', requireAuth, controller.updateUser);
router.post('/', requireAuth, controller.createUser);
router.post('/sync-phone', requireAuth, controller.syncPhone);

export default router;
