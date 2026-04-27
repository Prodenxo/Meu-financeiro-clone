import { Router } from 'express';
import * as controller from '../controllers/auth.controller.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

router.post('/signup', controller.signUp);
router.post('/signin', controller.signIn);
router.post('/reset-password', controller.resetPassword);
router.post('/process-recovery-hash', controller.processRecoveryHash);
router.post('/exchange-code-for-session', controller.exchangeCodeForSession);

router.post('/signout', requireAuth, controller.signOut);
router.get('/session', requireAuth, controller.getSession);
router.post('/update-password', requireAuth, controller.updatePassword);
router.post('/update-phone', requireAuth, controller.updatePhone);
router.post('/update-display-name', requireAuth, controller.updateDisplayName);
router.post('/update-role', requireAuth, controller.updateRole);
router.get('/last-seen-update', requireAuth, controller.getLastSeenUpdate);
router.post('/last-seen-update', requireAuth, controller.updateLastSeenUpdate);

export default router;
