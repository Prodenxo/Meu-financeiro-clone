import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { requireSuperAdmin } from '../middlewares/requireSuperAdmin.js';
import * as controller from '../controllers/users.controller.js';

const router = Router();

router.get('/', requireAuth, controller.listUsers);
router.get('/empresas', requireAuth, controller.listEmpresas);
router.get('/empresas/current', requireAuth, requireSuperAdmin, controller.getEmpresa);
router.get('/empresas/:empresaId', requireAuth, requireSuperAdmin, controller.getEmpresaById);
router.post('/empresas', requireAuth, requireSuperAdmin, controller.createEmpresa);
router.put('/empresas/:empresaId', requireAuth, requireSuperAdmin, controller.updateEmpresa);
router.post('/sync-phone', requireAuth, controller.syncPhone);
router.post('/:userId/ban', requireAuth, controller.banUser);
router.post('/:userId/unban', requireAuth, controller.unbanUser);
router.post('/:userId/reset-password', requireAuth, controller.resetUserPassword);
router.put('/:userId', requireAuth, controller.updateUser);
router.delete('/:userId', requireAuth, controller.deleteUser);
router.post('/', requireAuth, controller.createUser);

export default router;
