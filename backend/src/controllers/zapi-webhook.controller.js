import { env } from '../config/env.js';
import { sendSuccess } from '../utils/response.js';
import * as zapiInbound from '../services/zapi-inbound.service.js';
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

    const relayUrl = (env.OPENCLAW_ZAPI_RELAY_URL || '').trim();
    if (relayUrl) {
      await zapiInbound.relayZapiInbound(parsed);
    }

    return sendSuccess(
      res,
      {
        accepted: true,
        phone: parsed.phone,
        relayed: Boolean(relayUrl),
        transcriptionSource,
      },
      'aceite',
    );
  } catch (error) {
    return next(error);
  }
};
