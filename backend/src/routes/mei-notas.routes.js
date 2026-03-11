import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { requireMeiEnabled } from '../middlewares/requireMei.js';
import * as controller from '../controllers/mei-notas.controller.js';

const router = Router();

router.post('/webhook', controller.webhook);
router.post('/emitir', requireAuth, requireMeiEnabled, controller.emitir);
router.get('/', requireAuth, requireMeiEnabled, controller.listar);
router.get('/:id/pdf', requireAuth, requireMeiEnabled, controller.downloadPdf);
router.get('/:id/xml', requireAuth, requireMeiEnabled, controller.downloadXml);
router.get('/:id', requireAuth, requireMeiEnabled, controller.detalhar);

export default router;
