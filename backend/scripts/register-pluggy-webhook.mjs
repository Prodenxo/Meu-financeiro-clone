/**
 * Registra webhook na Pluggy via API (mostra erro real se o dashboard só diz "Falha").
 *
 * Uso (na pasta backend/, com .env preenchido):
 *   node scripts/register-pluggy-webhook.mjs
 *   node scripts/register-pluggy-webhook.mjs --url=https://seu-back/api/webhooks/pluggy --event=item/updated
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const clientId = process.env.PLUGGY_CLIENT_ID?.trim();
const clientSecret = process.env.PLUGGY_CLIENT_SECRET?.trim();
const base = (process.env.PLUGGY_API_BASE_URL || 'https://api.pluggy.ai').replace(/\/$/, '');

const urlArg = process.argv.find((a) => a.startsWith('--url='));
const eventArg = process.argv.find((a) => a.startsWith('--event='));
const webhookUrl =
  urlArg?.slice('--url='.length)?.trim() ||
  process.env.PLUGGY_WEBHOOK_URL?.trim() ||
  '';
const event = eventArg?.slice('--event='.length)?.trim() || 'all';

if (!clientId || !clientSecret) {
  console.error('Defina PLUGGY_CLIENT_ID e PLUGGY_CLIENT_SECRET no backend/.env');
  process.exit(1);
}
if (!webhookUrl) {
  console.error('Passe --url=... ou defina PLUGGY_WEBHOOK_URL no .env');
  process.exit(1);
}

async function main() {
  const authRes = await fetch(`${base}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ clientId, clientSecret }),
  });
  const authJson = await authRes.json().catch(() => ({}));
  if (!authRes.ok) {
    console.error('Auth Pluggy falhou:', authRes.status, authJson);
    process.exit(1);
  }
  const apiKey = authJson.apiKey;
  if (!apiKey) {
    console.error('Pluggy não devolveu apiKey');
    process.exit(1);
  }

  const res = await fetch(`${base}/webhooks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-API-KEY': apiKey,
    },
    body: JSON.stringify({ url: webhookUrl, event }),
  });
  const text = await res.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = { raw: text };
  }

  if (!res.ok) {
    console.error('Criar webhook falhou:', res.status, payload);
    process.exit(1);
  }

  console.log('Webhook criado:', JSON.stringify(payload, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
