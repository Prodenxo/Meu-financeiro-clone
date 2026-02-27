import { env } from '../config/env.js';
import { badRequest, serviceUnavailable } from '../utils/errors.js';

const buildWebhookHeaders = () => {
  const headers = { 'Content-Type': 'application/json' };
  if (env.N8N_WHATSAPP_WEBHOOK_SECRET) {
    headers['x-webhook-secret'] = env.N8N_WHATSAPP_WEBHOOK_SECRET;
  }
  return headers;
};

const parseWebhookResponse = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return await response.json();
  }
  return await response.text();
};

export const sendWhatsappMessage = async (payload) => {
  const webhookUrl = env.N8N_WHATSAPP_WEBHOOK_URL;
  if (!webhookUrl) {
    throw badRequest('Webhook do WhatsApp não configurado');
  }
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: buildWebhookHeaders(),
    body: JSON.stringify(payload)
  });
  const body = await parseWebhookResponse(response);
  if (!response.ok) {
    const message = typeof body === 'string' ? body : body?.message;
    throw serviceUnavailable(message || 'Falha ao acionar webhook do WhatsApp');
  }
  return {
    status: response.status,
    body
  };
};
