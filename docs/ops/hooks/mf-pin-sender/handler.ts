import fs from 'node:fs';
import path from 'node:path';

const workspaceDir = (): string =>
  (process.env.OPENCLAW_WORKSPACE || '/home/node/.openclaw/workspace').trim();

const digitsOnly = (value: unknown): string => String(value ?? '').replace(/\D/g, '');

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
  ];

  for (const raw of candidates) {
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
