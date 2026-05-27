import { env } from '../config/env.js';
import { sendSuccess } from '../utils/response.js';
import * as zapiInbound from '../services/zapi-inbound.service.js';
import { handleAccessRequestWhatsappInbound } from '../services/access-request-whatsapp-inbound.service.js';
import { shouldSkipOpenclawRelay } from '../services/zapi-slash-commands.service.js';
import {
  getWhatsappAudioTranscriptionStatus,
  transcribeZapiInboundAudio,
} from '../services/whatsapp-audio-transcription.service.js';

export const getZapiMonitor = (_req, res) => {
  return res.json({
    ok: true,
    service: 'zapi-inbound-bridge',
    relayConfigured: Boolean((env.OPENCLAW_ZAPI_RELAY_URL || '').trim()),
    webhookTokenConfigured: Boolean((env.ZAPI_WEBHOOK_TOKEN || '').trim()),
    audioTranscription: getWhatsappAudioTranscriptionStatus(),
  });
};

export const postInbound = async (req, res, next) => {
  try {
    let parsed = zapiInbound.parseZapiInbound(req.body);
    if (parsed.ignored) {
      return sendSuccess(
        res,
        { ignored: true, reason: parsed.reason },
        'ignorado',
      );
    }

    let transcriptionSource = null;
    if (!parsed.text && parsed.hasAudio) {
      const transcription = await transcribeZapiInboundAudio(req.body);
      if (transcription) {
        parsed = { ...parsed, text: transcription, hasAudio: true };
        transcriptionSource = 'zapi_audio_stt';
      }
    }

    if (!parsed.text?.trim()) {
      return sendSuccess(
        res,
        {
          accepted: true,
          phone: parsed.phone,
          ignoredReason: parsed.hasAudio ? 'audio_transcription_failed' : 'empty_text',
          relayConfigured: Boolean((env.OPENCLAW_ZAPI_RELAY_URL || '').trim()),
        },
        'sem texto',
      );
    }

    let accessRequestHandled = false;
    try {
      const inbound = await handleAccessRequestWhatsappInbound({
        phone: parsed.phone,
        text: parsed.text,
      });
      accessRequestHandled = Boolean(inbound.handled);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // eslint-disable-next-line no-console
      console.warn('[ZAPI] access-request inbound:', msg);
    }

    const skipOpenclawRelay = shouldSkipOpenclawRelay(parsed.text, accessRequestHandled);
    const relayUrl = (env.OPENCLAW_ZAPI_RELAY_URL || '').trim();
    if (relayUrl && !skipOpenclawRelay) {
      await zapiInbound.relayZapiInbound(parsed);
    }

    return sendSuccess(
      res,
      {
        accepted: true,
        phone: parsed.phone,
        relayed: Boolean(relayUrl) && !skipOpenclawRelay,
        accessRequestHandled,
        openclawSkipped: skipOpenclawRelay && !accessRequestHandled,
        transcriptionSource,
      },
      'aceite',
    );
  } catch (error) {
    return next(error);
  }
};
