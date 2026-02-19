import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../middlewares/auth.js';
import * as controller from '../controllers/mei-guide.controller.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.post('/', requireAuth, controller.createGuide);
router.post('/certificate', requireAuth, upload.single('certificate'), controller.uploadCertificate);
router.delete('/certificate', requireAuth, controller.removeCertificate);
router.get('/certificate/status', requireAuth, controller.getCertificateStatus);
router.post('/token', requireAuth, controller.getSerproToken);
router.post('/validate', requireAuth, controller.validateGuide);
router.get('/periods', requireAuth, controller.listPeriods);
router.get('/:id/download', requireAuth, controller.downloadGuide);

export default router;
