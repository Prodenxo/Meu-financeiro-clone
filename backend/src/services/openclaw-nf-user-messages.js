/** Mensagens para o utilizador final (WhatsApp) — sem payload, action nem JSON. */

export const formatValorBr = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value ?? '').trim() || '—';
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const tipoNotaLabel = (documentType) => {
  const dt = String(documentType || '').toUpperCase();
  if (dt === 'NFE') return 'NF-e (produto)';
  if (dt === 'NFCE') return 'NFC-e (varejo)';
  return 'NFS-e (serviço)';
};

/**
 * Pedido de confirmação antes de emitir.
 * @param {{ documentType?: string, tomadorRazaoSocial?: string, destinatarioRazaoSocial?: string, discriminacao?: string, produtoDescricao?: string, valorServico?: number, valorTotal?: number }} preview
 */
export const buildNfConfirmRequestUserMessage = (preview = {}) => {
  const cliente = String(
    preview.tomadorRazaoSocial || preview.destinatarioRazaoSocial || 'Cliente',
  ).trim();
  const item = String(
    preview.discriminacao || preview.produtoDescricao || preview.codigoServico || 'Item',
  ).trim();
  const valor = formatValorBr(preview.valorServico ?? preview.valorTotal);
  const tipo = tipoNotaLabel(preview.documentType);

  return [
    'Resumo da nota fiscal:',
    `• Tipo: ${tipo}`,
    `• Cliente: ${cliente}`,
    `• ${preview.documentType === 'NFE' || preview.documentType === 'NFCE' ? 'Produto' : 'Serviço'}: ${item}`,
    `• Valor: ${valor}`,
    '',
    'Posso emitir? Responda *sim* ou *confirmo* que eu envio a nota.',
  ].join('\n');
};

/**
 * @param {object} preview
 * @param {{ status?: string, pdfSent?: boolean, pdfPending?: boolean }} opts
 */
export const buildNfEmittedUserMessage = (preview = {}, opts = {}) => {
  const cliente = String(
    preview.tomadorRazaoSocial || preview.destinatarioRazaoSocial || 'Cliente',
  ).trim();
  const item = String(
    preview.discriminacao || preview.produtoDescricao || preview.codigoServico || 'Item',
  ).trim();
  const valor = formatValorBr(preview.valorServico ?? preview.valorTotal);
  const tipo = tipoNotaLabel(preview.documentType);
  const status = String(opts.status || 'processando').trim();

  let footer = '';
  if (opts.pdfSent) {
    footer = 'Enviei o PDF da nota aqui no WhatsApp.';
  } else if (opts.pdfPending !== false) {
    footer = 'Assim que a nota for autorizada, envio o PDF neste chat.';
  }

  const lines = [
    'Nota fiscal enviada para emissão.',
    `• Tipo: ${tipo}`,
    `• Cliente: ${cliente}`,
    `• ${preview.documentType === 'NFE' || preview.documentType === 'NFCE' ? 'Produto' : 'Serviço'}: ${item}`,
    `• Valor: ${valor}`,
    `• Situação: ${status}`,
  ];
  if (footer) lines.push('', footer);
  return lines.join('\n');
};

/** Instrução só para o agente (não mostrar ao utilizador). */
export const BOT_NF_CONFIRM_INSTRUCTION =
  'INSTRUÇÃO INTERNA: se o utilizador responder sim/confirmo/pode emitir/ok, chame emit_nfse ou emit_nfe '
  + 'com os MESMOS dados do preview e "confirm":true no JSON do mf-curl. '
  + 'PROIBIDO pedir payload, confirm:true ou comandos técnicos ao utilizador.';

const CONFIRM_WORDS = new Set([
  'sim',
  'confirmo',
  'confirmado',
  'ok',
  'manda',
  'emite',
  'pode',
  'pode emitir',
]);

/** Aceita confirm:true ou texto de confirmação do utilizador no campo confirm/confirmar. */
export const isNfEmitConfirmed = (payload = {}) => {
  if (payload?.confirm === true || payload?.confirmar === true) return true;
  const raw = String(payload?.confirm ?? payload?.confirmar ?? '').trim().toLowerCase();
  if (!raw) return false;
  if (raw === 'true') return true;
  return CONFIRM_WORDS.has(raw);
};
