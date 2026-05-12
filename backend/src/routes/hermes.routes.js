import { Router } from 'express';
import { requireHermesSecret } from '../middlewares/hermesWebhook.js';
import * as controller from '../controllers/hermes-bot.controller.js';

const router = Router();

router.post('/hermes/action', requireHermesSecret, controller.postHermesAction);

export default router;
