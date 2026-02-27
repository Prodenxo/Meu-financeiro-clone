import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import * as controller from '../controllers/mei-notas.controller.js';

const router = Router();

router.post('/webhook', controller.webhook);
router.post('/emitir', requireAuth, controller.emitir);
router.get('/', requireAuth, controller.listar);
router.get('/:id/pdf', requireAuth, controller.downloadPdf);
router.get('/:id/xml', requireAuth, controller.downloadXml);
router.get('/:id', requireAuth, controller.detalhar);

export default router;
