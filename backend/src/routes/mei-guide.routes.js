import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../middlewares/auth.js';
import { requireMeiEnabled } from '../middlewares/requireMei.js';
import * as controller from '../controllers/mei-guide.controller.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.post('/', requireAuth, requireMeiEnabled, controller.createGuide);
router.post('/certificate', requireAuth, requireMeiEnabled, upload.single('certificate'), controller.uploadCertificate);
router.delete('/certificate', requireAuth, requireMeiEnabled, controller.removeCertificate);
router.get('/certificate/status', requireAuth, requireMeiEnabled, controller.getCertificateStatus);
router.post('/validate', requireAuth, requireMeiEnabled, controller.validateGuide);
router.get('/periods', requireAuth, requireMeiEnabled, controller.listPeriods);
router.get('/periods-by-cnpj', requireAuth, requireMeiEnabled, controller.listPeriodsByCnpj);
router.get('/:id/download', requireAuth, requireMeiEnabled, controller.downloadGuide);

export default router;
