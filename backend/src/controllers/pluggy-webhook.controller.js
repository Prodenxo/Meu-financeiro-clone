import { processPluggyWebhookPayload } from '../services/pluggyWebhook.service.js';

/** Webhook Pluggy — https://docs.pluggy.ai/docs/webhooks */

/** Alguns validadores (dashboard Pluggy) fazem GET/HEAD na URL antes de salvar. */
export const getPluggyWebhook = (_req, res) => {
  res.status(200).json({ ok: true, endpoint: 'pluggy-webhook' });
};

export const postPluggyWebhook = (req, res) => {
  res.status(200).json({ received: true });

  const payload = req.body;
  if (!payload || typeof payload !== 'object') return;

  setImmediate(() => {
    processPluggyWebhookPayload(payload)
      .then((out) => {
        if (out?.ok) {
          // eslint-disable-next-line no-console
          console.log('[pluggy-webhook] sync ok', {
            event: out.event,
            itemId: out.itemId,
            transactionsCreated: out.result?.transactionsCreated,
          });
        }
      })
      .catch((err) => {
        console.error('[pluggy-webhook] falha', err instanceof Error ? err.message : err);
      });
  });
};
