import { env } from '../config/env.js';
import { env } from '../config/env.js';
import { sendSuccess } from '../utils/response.js';
import * as zapiInbound from '../services/zapi-inbound.service.js';

export const getZapiMonitor = (_req, res) => {
  return res.json({
    ok: true,
    service: 'zapi-inbound-bridge',
    relayConfigured: Boolean((env.OPENCLAW_ZAPI_RELAY_URL || '').trim()),
    webhookTokenConfigured: Boolean((env.ZAPI_WEBHOOK_TOKEN || '').trim()),
  });
};

export const postInbound = async (req, res, next) => {
  try {
    const parsed = zapiInbound.parseZapiInbound(req.body);
    if (parsed.ignored) {
      return sendSuccess(
        res,
        { ignored: true, reason: parsed.reason },
        'ignorado',
      );
    }

    void zapiInbound.relayZapiInbound(parsed).catch(() => {});

    return sendSuccess(
      res,
      {
        accepted: true,
        phone: parsed.phone,
        relayScheduled: Boolean((env.OPENCLAW_ZAPI_RELAY_URL || '').trim()),
      },
      'aceite',
    );
  } catch (error) {
    return next(error);
  }
};
