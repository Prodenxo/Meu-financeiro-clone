import { Router } from 'express';
import { requireCronSecret } from '../middlewares/requireCronSecret.js';
import { runMonthlyAutomaticDasDownload } from '../services/mei-das.service.js';

const router = Router();

router.get('/das-mensal', requireCronSecret, async (_req, res, next) => {
  try {
    const summary = await runMonthlyAutomaticDasDownload();
    res.json({ ok: true, summary });
  } catch (error) {
    next(error);
  }
});

export default router;
