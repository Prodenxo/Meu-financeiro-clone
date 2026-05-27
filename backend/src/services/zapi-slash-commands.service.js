/**
 * Mensagens que começam com `/` são reservadas ao backend (Z-API inbound).
 * Não devem ser reencaminhadas ao OpenClaw — evita o bot confundir com transações.
 */

/**
 * @param {string} text
 */
export const isSlashReservedMessage = (text) => {
  const t = String(text || '').trim();
  return t.startsWith('/');
};

/**
 * Converte `/pendentes`, `/aprovar email@x.com` → comandos internos sem barra.
 * @param {string} text
 */
export const normalizeSlashCommandText = (text) => {
  const raw = String(text || '').trim();
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
 */
export const shouldSkipOpenclawRelay = (text, accessRequestHandled = false) => {
  if (accessRequestHandled) return true;
  return isSlashReservedMessage(text);
};
