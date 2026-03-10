import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import * as controller from '../controllers/users.controller.js';

const router = Router();

router.get('/', requireAuth, controller.listUsers);
router.get('/empresas', requireAuth, controller.listEmpresas);
router.post('/empresas', requireAuth, controller.createEmpresa);
router.put('/empresas/:empresaId', requireAuth, controller.updateEmpresa);
router.post('/:userId/ban', requireAuth, controller.banUser);
router.post('/:userId/unban', requireAuth, controller.unbanUser);
router.put('/:userId', requireAuth, controller.updateUser);
router.post('/:userId/reset-password', requireAuth, controller.resetUserPassword);
router.delete('/:userId', requireAuth, controller.deleteUser);
router.post('/', requireAuth, controller.createUser);
router.post('/sync-phone', requireAuth, controller.syncPhone);

export default router;
