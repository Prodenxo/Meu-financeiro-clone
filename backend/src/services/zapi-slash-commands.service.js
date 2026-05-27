import { normalizeInboundCommandText } from './zapi-inbound-text.service.js';

/** Versão do bridge inbound (monitor / diagnóstico de deploy). */
export const ZAPI_INBOUND_BRIDGE_VERSION = 2;

const ACCESS_COMMAND_RE = /^(APROVAR|REJEITAR|PENDENTES|LISTAR|AJUDA|HELP)\b/i;

/**
 * Mensagens que começam com `/` são reservadas ao backend (Z-API inbound).
 * Não devem ser reencaminhadas ao OpenClaw — evita o bot confundir com transações.
 */

/**
 * @param {string} text
 */
export const isSlashReservedMessage = (text) => {
  const t = normalizeInboundCommandText(text);
  return t.startsWith('/');
};

/**
 * Comandos de cadastro (com ou sem `/`) — não confundir com DAS/transações no OpenClaw.
 * @param {string} text
 */
export const isAccessManagementCommandMessage = (text) => {
  const normalized = normalizeInboundCommandText(text);
  if (!normalized) return false;
  const plain = normalized.startsWith('/')
    ? normalized.slice(1).trim()
    : normalized;
  if (/^pendentes$/i.test(plain) || /^listar$/i.test(plain)) return true;
  if (/^ajuda(?:-acesso)?$/i.test(plain) || /^help(?:-access)?$/i.test(plain)) {
    return true;
  }
  if (/^aprovar\b/i.test(plain) || /^rejeitar\b/i.test(plain)) return true;
  return ACCESS_COMMAND_RE.test(normalized);
};

/**
 * Converte `/pendentes`, `/aprovar email@x.com` → comandos internos sem barra.
 * @param {string} text
 */
export const normalizeSlashCommandText = (text) => {
  const raw = normalizeInboundCommandText(text);
  if (!raw.startsWith('/')) return raw;

  let t = raw.slice(1).trim();
  if (!t) return raw;

  const approve = /^aprovar[-\s]+(.+)$/i.exec(t);
  if (approve) return `APROVAR ${approve[1].trim()}`;

  const reject = /^rejeitar[-\s]+(.+)$/i.exec(t);
  if (reject) return `REJEITAR ${reject[1].trim()}`;

  if (/^pendentes$/i.test(t) || /^listar$/i.test(t)) return 'PENDENTES';

  if (/^ajuda(?:-acesso)?$/i.test(t) || /^help(?:-access)?$/i.test(t)) {
    return 'AJUDA';
  }

  const first = t.split(/\s+/)[0] || '';
  const rest = t.slice(first.length).trim();
  return rest ? `${first.toUpperCase()} ${rest}` : first.toUpperCase();
};

/**
 * @param {string} text
 * @param {boolean} accessRequestHandled
 * @returns {{ skip: boolean, reason: string | null }}
 */
export const getOpenclawRelaySkipDecision = (text, accessRequestHandled = false) => {
  if (accessRequestHandled) {
    return { skip: true, reason: 'access_request_handled' };
  }
  if (isSlashReservedMessage(text)) {
    return { skip: true, reason: 'slash_reserved' };
  }
  if (isAccessManagementCommandMessage(text)) {
    return { skip: true, reason: 'access_management_command' };
  }
  return { skip: false, reason: null };
};

/**
 * @param {string} text
 * @param {boolean} accessRequestHandled
 */
export const shouldSkipOpenclawRelay = (text, accessRequestHandled = false) => {
  return getOpenclawRelaySkipDecision(text, accessRequestHandled).skip;
};
