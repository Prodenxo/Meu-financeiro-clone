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

const formatNfseStatusLabel = (status) => {
  const normalized = String(status || '').trim().toLowerCase();
  if (normalized.includes('concluid') || normalized.includes('autoriz')) return 'autorizada';
  if (normalized.includes('process')) return 'em processamento';
  if (normalized.includes('rejeit')) return 'rejeitada';
  if (normalized.includes('cancel')) return 'cancelada';
  return normalized || 'processando';
};

/**
 * Resumo humano de notas recentes — sem UUIDs técnicos.
 * @param {Array<{ status?: string, valorServico?: number | null }>} notas
 * @param {{ pdfSent?: boolean }} [opts]
 */
export const formatOpenclawNfseNotasListMessage = (notas = [], opts = {}) => {
  const list = Array.isArray(notas) ? notas : [];
  if (!list.length) {
    return 'Não encontrei notas NFS-e recentes. Se acabou de pedir emissão, aguarde cerca de 1 minuto.';
  }

  const latest = list[0];
  const statusLabel = formatNfseStatusLabel(latest.status);
  const valor = latest.valorServico != null ? formatValorBr(latest.valorServico) : null;
  const lines = [
    '*Última nota NFS-e:*',
    `• Situação: *${statusLabel}*`,
  ];
  if (valor) lines.push(`• Valor: *${valor}*`);

  if (statusLabel === 'autorizada') {
    lines.push(
      opts.pdfSent
        ? '• PDF enviado neste WhatsApp.'
        : '• O PDF será enviado neste chat em instantes.',
    );
  } else if (statusLabel === 'em processamento') {
    lines.push('• Ainda em processamento na Prefeitura — o PDF chega quando autorizar.');
  }

  if (list.length > 1) {
    lines.push(
      '',
      `_${list.length} notas recentes no total. Detalhes no app Meu Financeiro → MEI → Notas._`,
    );
  }
  return lines.join('\n');
};

/** Instrução só para o agente ao listar notas. */
export const BOT_NF_LIST_NOTAS_INSTRUCTION =
  'Repita APENAS o campo message. PROIBIDO listar UUID, ID técnico ou JSON. '
  + 'Se a nota estiver autorizada e o PDF ainda não foi enviado, informe que o PDF chega em instantes.';
export const BOT_NF_CONFIRM_INSTRUCTION =
  'INSTRUÇÃO INTERNA: se o utilizador responder sim/confirmo/pode emitir/ok, chame emit_nfse ou emit_nfe '
  + 'com os MESMOS dados do preview e "confirm":true no JSON do mf-curl. '
  + 'PROIBIDO pedir payload, confirm:true ou comandos técnicos ao utilizador. '
  + 'AGUARDE o exec terminar antes de responder — nunca repita o preview enquanto o exec corre.';

/** Evita loop preview → sim → preview quando o utilizador já confirmou. */
export const BOT_NF_PREVIEW_LOOP_GUARD =
  'Se o utilizador JÁ disse sim/confirmo nesta conversa, PROIBIDO repetir este resumo — '
  + 'chame emit_nfse (ou emit_nfe) com confirm:true e os MESMOS dados.';

/** Após falha na emissão (não voltar ao preview). */
export const BOT_NF_EMIT_FAILED_INSTRUCTION =
  'Emissão falhou ou o exec ainda está a correr — PlugNotas pode demorar até 2–3 minutos. '
  + 'PROIBIDO chamar emit_nfse de novo em paralelo ou por timeout / "No session found". '
  + 'Primeiro use list_nfse_notas (limit 5) para ver se a nota já foi criada; se existir, informe o utilizador. '
  + 'Só repita emit_nfse se o utilizador pedir explicitamente *tentar de novo* e não houver nota igual recente. '
  + 'Repita APENAS message ao utilizador (motivo em português curto).';

/** Uma chamada emit_nfse por pedido — exec lento no OpenClaw. */
export const BOT_NF_EMIT_SLOW_EXEC_INSTRUCTION =
  'emit_nfse pode demorar até 2–3 minutos. Faça UMA chamada e aguarde o exec terminar. '
  + 'PROIBIDO emitir de novo no mesmo turno. Se o exec parecer travado, use list_nfse_notas antes de qualquer retry.';

/**
 * Mensagem amigável para erros técnicos de emissão NFS-e (WhatsApp).
 * @param {string} rawMessage
 */
export const formatNfseEmitErrorForUser = (rawMessage = '') => {
  const msg = String(rawMessage || '').trim();
  if (/alinhar a numeração|operation was aborted|aborted/i.test(msg)) {
    return (
      'Não consegui concluir a emissão agora — a PlugNotas demorou a responder '
      + '(sincronização da numeração). Aguarde cerca de 1 minuto e diga *tentar de novo*, '
      + 'ou emita pelo app Meu Financeiro → MEI → Notas.'
    );
  }
  if (/certificado|plugnotas/i.test(msg)) {
    return (
      'Não foi possível emitir a nota. Verifique certificado A1 e dados fiscais '
      + 'no app Meu Financeiro → MEI → Notas.'
    );
  }
  return msg || 'Não foi possível emitir a nota fiscal agora. Tente de novo em instantes.';
};

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

/** Só emite com confirm explícito — pedido completo vai para preview primeiro. */
export const isNfEmitConfirmed = (payload = {}) => {
  if (payload?.confirm === true || payload?.confirmar === true) return true;
  if (payload?.confirm === 1 || payload?.confirmar === 1) return true;

  if (payload?.confirm === false || payload?.confirmar === false) return false;
  if (payload?.confirm === 0 || payload?.confirmar === 0) return false;

  const raw = String(payload?.confirm ?? payload?.confirmar ?? '').trim().toLowerCase();
  if (!raw) return false;
  if (raw === 'true' || raw === '1') return true;
  if (CONFIRM_WORDS.has(raw)) return true;

  return false;
};

/**
 * Pedido explícito: cliente (número ou nome) + serviço + valor → preview antes de emitir.
 * @param {Record<string, unknown>} [payload]
 */
export const isCompleteNfseWhatsAppEmitOrder = (payload = {}) => {
  const valorRaw = payload?.valor ?? payload?.valorServico ?? payload?.valorReais;
  const valor = Number(typeof valorRaw === 'string' ? valorRaw.replace(',', '.') : valorRaw);
  if (!Number.isFinite(valor) || valor <= 0) return false;

  const hasServico = Boolean(
    payload?.servicoIndice
    || payload?.servicoNumero
    || payload?.servico
    || payload?.codigoServico
    || payload?.codigo,
  );
  if (!hasServico) return false;

  const hasCliente = Boolean(
    payload?.clienteIndice
    || payload?.tomadorIndice
    || payload?.clienteNumero
    || (typeof payload?.cliente === 'number' && payload.cliente >= 1)
    || (typeof payload?.cliente === 'string' && /^\d{1,2}$/.test(payload.cliente.trim()))
    || String(payload?.tomadorNome || payload?.tomadorRazaoSocial || '').trim()
    || payload?.tomadorCpfCnpj,
  );
  return hasCliente;
};

const VAGUE_NF_ITEM_REGEX = [
  /^notas?(\s+fiscal(is)?)?(\s+de)?(\s+servicos?)?$/i,
  /^prestacao\s+de\s+servicos?$/i,
  /^servicos?$/i,
  /^emissao\s+de\s+nota/i,
  /^emitir\s+nota/i,
  /^fazer\s+nota/i,
  /^tirar\s+nota/i,
  /^nota\s+para\b/i,
  /^cobranca$/i,
];

const normalizeNfItemLabel = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');

const VAGUE_NF_ITEM_EXACT = new Set([
  'nota',
  'notas',
  'nota fiscal',
  'nota fiscal de servico',
  'nota fiscal de servicos',
  'prestacao de servicos',
  'servico',
  'servicos',
  'emissao de nota',
  'emitir nota',
  'fazer nota',
  'tirar nota',
  'cobranca',
]);

/** Nome genérico vindo do áudio/LLM — não é item do catálogo. */
export const isVagueNfItemLabel = (value) => {
  const s = normalizeNfItemLabel(value);
  if (!s) return true;
  if (s.length <= 3) return true;
  if (VAGUE_NF_ITEM_EXACT.has(s)) return true;
  return VAGUE_NF_ITEM_REGEX.some((re) => re.test(s));
};

export const formatNfseCatalogChoiceMessage = (produtos = [], options = {}) => {
  const list = Array.isArray(produtos) ? produtos : [];
  if (!list.length) {
    return 'Você ainda não tem serviços cadastrados. Cadastre na app (MEI → Notas) e peça a nota de novo.';
  }
  const intro = String(options.prefix || '').trim()
    || 'Qual **serviço da nota fiscal** você quer? (Não é carteira/banco.) Responda com o número ou o nome exato:';
  const lines = list.map((p, i) => `${i + 1}. ${String(p.discriminacao || '—').trim()}`);
  return `${intro}\n${lines.join('\n')}`;
};

export const formatNfeCatalogChoiceMessage = (produtos = []) => {
  const list = Array.isArray(produtos) ? produtos : [];
  if (!list.length) {
    return 'Você ainda não tem produtos cadastrados. Cadastre na app (MEI → Notas) e peça a nota de novo.';
  }
  const lines = list.map((p, i) => `${i + 1}. ${String(p.discriminacao || '—').trim()}`);
  return `Qual produto você quer na nota? Responda com o número ou o nome exato:\n${lines.join('\n')}`;
};

export const formatNfCatalogAmbiguousMessage = (label, matches = [], documentType = 'NFSE') => {
  const tipo = documentType === 'NFE' ? 'produto' : 'serviço';
  const list = Array.isArray(matches) ? matches : [];
  const lines = list.map((p, i) => `${i + 1}. ${String(p.discriminacao || '—').trim()}`);
  return `Encontrei vários ${tipo}s parecidos com "${label}". Qual é?\n${lines.join('\n')}`;
};

export const formatNfCatalogNotFoundMessage = (label, catalog = [], documentType = 'NFSE') => {
  const tipo = documentType === 'NFE' ? 'produto' : 'serviço';
  const list = Array.isArray(catalog) ? catalog : [];
  if (!list.length) {
    return `Não encontrei o ${tipo} "${label}" e seu catálogo está vazio. Cadastre na app (MEI → Notas).`;
  }
  const lines = list.map((p, i) => `${i + 1}. ${String(p.discriminacao || '—').trim()}`);
  return `Não encontrei o ${tipo} "${label}". Escolha um do seu catálogo:\n${lines.join('\n')}`;
};
