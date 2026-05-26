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
 * Por defeito responde **202** logo (cron-job.org limita espera a 30s). `?sync=1` aguarda o lote.
 */
router.get('/agenda-lembretes', requireCronSecret, async (req, res, next) => {
  try {
    const rawSlot = String(req.query.slot || 'manha').trim().toLowerCase();
    const slot = rawSlot === 'noite' ? 'noite' : 'manha';
    const dateIso = req.query.date ? String(req.query.date).trim() : undefined;
    const sync =
      String(req.query.sync || '').toLowerCase() === '1'
      || String(req.query.sync || '').toLowerCase() === 'true';

    if (sync) {
      const summary = await runAgendaWhatsappReminders({ slot, dateIso });
      return res.json({ ok: true, summary });
    }

    const startedAt = new Date().toISOString();
    void runAgendaWhatsappReminders({ slot, dateIso })
      .then((summary) => {
        // eslint-disable-next-line no-console
        console.info('[agenda-reminders] background concluído', {
          slot,
          total: summary.total,
          sent: summary.sent,
          skippedEmpty: summary.skippedEmpty,
        });
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error(
          '[agenda-reminders] background falhou',
          err instanceof Error ? err.message : err,
        );
      });

    return res.status(202).json({
      ok: true,
      accepted: true,
      slot,
      dateIso,
      startedAt,
      message:
        'Lembretes em processamento em background. Para aguardar o lote completo, use ?sync=1.',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
