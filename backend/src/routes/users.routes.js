import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import * as controller from '../controllers/users.controller.js';

const router = Router();

router.get('/', requireAuth, controller.listUsers);
router.get('/empresas', requireAuth, controller.listEmpresas);
router.post('/:userId/ban', requireAuth, controller.banUser);
router.put('/:userId', requireAuth, controller.updateUser);
router.delete('/:userId', requireAuth, controller.deleteUser);
router.post('/', requireAuth, controller.createUser);
router.post('/sync-phone', requireAuth, controller.syncPhone);

export default router;
