import { env } from '../config/env.js';
import { sendSuccess } from '../utils/response.js';
import * as zapiInbound from '../services/zapi-inbound.service.js';
import {
  handleAccessRequestWhatsappInbound,
  sendMfCommandDiagnosticReply,
} from '../services/access-request-whatsapp-inbound.service.js';
import { isMfAccessCommandMessage } from '../services/access-request-command-text.service.js';
import { isWhatsappOutboundConfigured } from '../services/whatsapp-outbound.service.js';
import {
  getOpenclawRelaySkipDecision,
  ZAPI_INBOUND_BRIDGE_VERSION,
} from '../services/zapi-slash-commands.service.js';
import { isAccessRequestWhatsappNotifyEnabled } from '../services/access-request-whatsapp.service.js';
import {
  getWhatsappAudioTranscriptionStatus,
  transcribeZapiInboundAudio,
} from '../services/whatsapp-audio-transcription.service.js';

export const getZapiMonitor = (_req, res) => {
  return res.json({
    ok: true,
    service: 'zapi-inbound-bridge',
    inboundBridgeVersion: ZAPI_INBOUND_BRIDGE_VERSION,
    features: [
      'mf_access_commands',
      'slash_skip_relay',
      'access_command_skip_relay',
      'access_whatsapp_inbound',
    ],
    preferredAccessCommand: 'mf pendentes',
    accessRequestWhatsapp: isAccessRequestWhatsappNotifyEnabled(),
    whatsappOutboundConfigured: isWhatsappOutboundConfigured(),
    relayConfigured: Boolean((env.OPENCLAW_ZAPI_RELAY_URL || '').trim()),
    webhookTokenConfigured: Boolean((env.ZAPI_WEBHOOK_TOKEN || '').trim()),
    inboundWebhookPath: '/api/webhooks/zapi/inbound',
    zapiInboundReady:
      Boolean((env.ZAPI_WEBHOOK_TOKEN || '').trim())
      && isWhatsappOutboundConfigured()
      && isAccessRequestWhatsappNotifyEnabled(),
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

  // eslint-disable-next-line no-console
    console.info('[ZAPI] inbound texto:', parsed.phone, String(parsed.text || '').slice(0, 100));

    let accessRequestHandled = false;
    let accessRequestReason = null;
    try {
      const inbound = await handleAccessRequestWhatsappInbound({
        phone: parsed.phone,
        text: parsed.text,
      });
      accessRequestHandled = Boolean(inbound.handled);
      accessRequestReason = inbound.reason ?? null;

      if (isMfAccessCommandMessage(parsed.text) && !accessRequestHandled) {
        await sendMfCommandDiagnosticReply(parsed.phone, accessRequestReason);
        accessRequestHandled = true;
        accessRequestReason = `diagnostic_${accessRequestReason || 'unknown'}`;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // eslint-disable-next-line no-console
      console.warn('[ZAPI] access-request inbound:', msg);
      if (isMfAccessCommandMessage(parsed.text)) {
        try {
          await sendMfCommandDiagnosticReply(parsed.phone, 'error');
        } catch {
          /* ignore */
        }
        accessRequestHandled = true;
        accessRequestReason = 'error';
      }
    }

    const relayDecision = getOpenclawRelaySkipDecision(parsed.text, accessRequestHandled);
    const skipOpenclawRelay = relayDecision.skip;
    if (skipOpenclawRelay) {
      // eslint-disable-next-line no-console
      console.info(
        '[ZAPI] openclaw relay ignorado:',
        relayDecision.reason,
        'text=',
        String(parsed.text || '').slice(0, 80),
      );
    }

    const relayUrl = (env.OPENCLAW_ZAPI_RELAY_URL || '').trim();
    if (relayUrl && !skipOpenclawRelay) {
      await zapiInbound.relayZapiInbound(parsed);
    }

    return sendSuccess(
      res,
      {
        accepted: true,
        phone: parsed.phone,
        textPreview: String(parsed.text || '').slice(0, 120),
        relayed: Boolean(relayUrl) && !skipOpenclawRelay,
        accessRequestHandled,
        accessRequestReason,
        openclawSkipped: skipOpenclawRelay,
        openclawSkipReason: relayDecision.reason,
        inboundBridgeVersion: ZAPI_INBOUND_BRIDGE_VERSION,
        transcriptionSource,
      },
      'aceite',
    );
  } catch (error) {
    return next(error);
  }
};
