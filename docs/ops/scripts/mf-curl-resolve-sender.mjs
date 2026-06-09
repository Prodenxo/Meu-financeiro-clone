#!/usr/bin/env node
/**
 * Resolve remetente WhatsApp para mf-curl.sh.
 * Prioridade: 1º arg válido (>=10 dígitos) > env canal > pin > env fallback.
 * Número completo no 1º arg actualiza o pin (mudança de chat no painel OpenClaw).
 */
import fs from 'node:fs';
import path from 'node:path';

const digits = (value) => String(value ?? '').replace(/\D/g, '');

const isValidSender = (value) => {
  const d = digits(value);
  return d.length >= 10;
};

const parseChannelPhone = (raw) => {
  const s = String(raw ?? '').trim();
  if (!s) return '';
  const direct = s.match(/whatsapp:direct:\+?(\d{10,15})/i);
  if (direct) return digits(direct[1]);
  const plus = s.match(/\+(\d{10,15})/);
  if (plus) return digits(plus[1]);
  const d = digits(s);
  return d.length >= 10 ? d : '';
};

const workspaceDir = process.argv[2] || process.env.OPENCLAW_WORKSPACE || '/home/node/.openclaw/workspace';
const agentArg = process.argv[3] || '';
const pinPath = path.join(workspaceDir, '.mf-inbound-sender');

const agent = digits(agentArg);
let pin = '';
if (fs.existsSync(pinPath)) {
  try {
    pin = digits(fs.readFileSync(pinPath, 'utf8'));
  } catch {
    pin = '';
  }
}

const envCandidates = [
  process.env.OPENCLAW_INBOUND_PHONE,
  process.env.REMETENTE_WHATSAPP,
  process.env.MF_MANDATORY_SENDER,
  parseChannelPhone(process.env.OPENCLAW_CHANNEL),
  parseChannelPhone(process.env.OPENCLAW_SESSION_CHANNEL),
  parseChannelPhone(process.env.OPENCLAW_SESSION_FROM),
];

let sender = '';
let source = '';

if (isValidSender(agent)) {
  sender = agent;
  source = 'agent';
  if (sender !== pin) {
    try {
      fs.mkdirSync(workspaceDir, { recursive: true });
      fs.writeFileSync(pinPath, sender, 'utf8');
      if (pin && pin !== sender) {
        console.error(`mf-curl: pin actualizado ${pin} → ${sender} (canal deste chat)`);
      }
    } catch (err) {
      console.error(`mf-curl: aviso — não foi possível gravar pin: ${err?.message || err}`);
    }
  }
} else {
  for (const raw of envCandidates) {
    const d = typeof raw === 'string' && raw.includes('whatsapp:')
      ? parseChannelPhone(raw)
      : digits(raw);
    if (isValidSender(d)) {
      sender = d;
      source = 'env';
      break;
    }
  }
  if (!sender && isValidSender(pin)) {
    sender = pin;
    source = 'pin';
    if (agent && agent !== pin) {
      console.error(
        `mf-curl: agente (${agentArg}) inválido (<10 dígitos); usa pin ${pin}. `
        + 'Se mudaste de chat no painel, passa o número COMPLETO no 1º arg (ex.: 5521983992146) '
        + 'ou: echo -n "5521983992146" > .mf-inbound-sender',
      );
    }
  }
}

if (!isValidSender(sender)) {
  console.error(
    'mf-curl: remetente inválido. '
    + 'Passa o telefone COMPLETO com DDI no 1º arg (ex.: 5521983992146), '
    + 'não só "55". Dropdown do painel: whatsapp:direct:+5521983992146 → 5521983992146.',
  );
  process.exit(1);
}

if (source === 'pin' && agent.length > 0 && agent.length < 10) {
  console.error(
    `mf-curl: ATENÇÃO — pin ${sender} pode ser de OUTRO chat (última msg WhatsApp real). `
    + 'Confirma o dropdown do painel e repete com número completo no 1º arg.',
  );
}

process.stdout.write(sender);
