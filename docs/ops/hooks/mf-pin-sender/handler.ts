import fs from 'node:fs';
import path from 'node:path';

const workspaceDir = (): string =>
  (process.env.OPENCLAW_WORKSPACE || '/home/node/.openclaw/workspace').trim();

const digitsOnly = (value: unknown): string => String(value ?? '').replace(/\D/g, '');

const parseChannelPhone = (raw: unknown): string => {
  const s = String(raw ?? '').trim();
  if (!s) return '';
  const direct = s.match(/whatsapp:direct:\+?(\d{10,15})/i);
  if (direct) return digitsOnly(direct[1]);
  const plus = s.match(/\+(\d{10,15})/);
  if (plus) return digitsOnly(plus[1]);
  const d = digitsOnly(s);
  return d.length >= 10 ? d : '';
};

const resolveInboundDigits = (context: Record<string, unknown>): string => {
  const meta =
    context.metadata && typeof context.metadata === 'object'
      ? (context.metadata as Record<string, unknown>)
      : {};

  const candidates = [
    meta.senderE164,
    meta.senderId,
    context.from,
    meta.from,
    context.channel,
    context.channelId,
    meta.channel,
    meta.sessionChannel,
  ];

  for (const raw of candidates) {
    const fromChannel = parseChannelPhone(raw);
    if (fromChannel.length >= 10) return fromChannel;
    const d = digitsOnly(raw);
    if (d.length >= 10) return d;
  }
  return '';
};

const handler = async (event: {
  type?: string;
  action?: string;
  context?: Record<string, unknown>;
}) => {
  if (event.type !== 'message' || event.action !== 'received') return;

  const phone = resolveInboundDigits(event.context || {});
  if (!phone) return;

  const ws = workspaceDir();
  fs.mkdirSync(ws, { recursive: true });
  const pinPath = path.join(ws, '.mf-inbound-sender');
  fs.writeFileSync(pinPath, phone, 'utf8');
};

export default handler;
