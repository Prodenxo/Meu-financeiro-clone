import { Router } from 'express';
import { requireCronSecret } from '../middlewares/requireCronSecret.js';
import {
  runMonthlyAutomaticDasDownload,
  runSingleUserAutomaticDasDownload
} from '../services/mei-das.service.js';
import { runAgendaWhatsappReminders } from '../services/agenda-reminders.service.js';
import { badRequest } from '../utils/errors.js';

const router = Router();

router.get('/das-mensal', requireCronSecret, async (_req, res, next) => {
  try {
    const summary = await runMonthlyAutomaticDasDownload();
    res.json({ ok: true, summary });
  } catch (error) {
    next(error);
  }
});

/** Mesmo secret do cron; processa só um `userId` (teste de DAS + WhatsApp automático). */
router.get('/das-mensal/usuario', requireCronSecret, async (req, res, next) => {
  try {
    const userId = String(req.query.userId || '').trim();
    if (!userId) {
      return next(badRequest('Informe userId na query (UUID do Supabase Auth)'));
    }
    const competencia = req.query.competencia
      ? String(req.query.competencia).trim()
      : undefined;
    const summary = await runSingleUserAutomaticDasDownload(userId, { competencia });
    res.json({ ok: summary.ok, summary });
  } catch (error) {
    next(error);
  }
});

/**
 * Lembretes de agenda (07h = slot manha, 21h = slot noite).
 * Só envia WhatsApp se houver compromissos hoje; agenda vazia = silêncio.
 * Query: `slot=manha|noite` (padrão manha).
 */
router.get('/agenda-lembretes', requireCronSecret, async (req, res, next) => {
  try {
    const rawSlot = String(req.query.slot || 'manha').trim().toLowerCase();
    const slot = rawSlot === 'noite' ? 'noite' : 'manha';
    const dateIso = req.query.date ? String(req.query.date).trim() : undefined;
    const summary = await runAgendaWhatsappReminders({ slot, dateIso });
    res.json({ ok: true, summary });
  } catch (error) {
    next(error);
  }
});

export default router;
