/**
 * Regras da tela "Solicitações de acesso" — porta da `AccessApprovalsScreen` do app atual, em JS puro.
 * Os dados vêm da Edge Function `manage-access-requests` (pendentes, aprovar, negar) e do relatório
 * `GET /api/admin/access-requests/report` (histórico). Só o superadmin chega até aqui.
 */

export const SOLICITACOES_TABS = ['pendentes', 'historico'];

/** Mesmo limite que o app atual pede ao relatório (`fetchAccessReport(100)`). */
export const HISTORY_LIMIT = 100;

/** Rótulos do histórico — o relatório só conhece pedidos enviados e aprovados (negados são excluídos). */
export const HISTORY_EVENTS = {
  submitted: { label: 'Aguardando aprovação', tone: 'warning' },
  approved: { label: 'Aprovado', tone: 'success' },
};

export const canReviewAccessRequests = (role) => role === 'superadmin';

export function parseSolicitacoesParams(sp) {
  const aba = String(sp?.aba || '').trim();
  return { aba: SOLICITACOES_TABS.includes(aba) ? aba : 'pendentes' };
}

export function buildSolicitacoesHref({ aba } = {}) {
  return aba && aba !== 'pendentes' ? `/configuracoes/solicitacoes?aba=${aba}` : '/configuracoes/solicitacoes';
}

const str = (v) => {
  if (v == null) return null;
  const s = String(v).trim();
  return s || null;
};

/** CPF (11 dígitos) ou CNPJ (14) formatados; outro valor volta como veio. */
export function formatEmpresaDoc(value) {
  if (!value) return '—';
  const d = String(value).replace(/\D/g, '');
  if (d.length === 14) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
  if (d.length === 11) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  return String(value);
}

export function empresaDocLabel(value) {
  return String(value || '').replace(/\D/g, '').length === 11 ? 'CPF' : 'CNPJ';
}

const time = (iso) => {
  const t = new Date(iso || 0).getTime();
  return Number.isNaN(t) ? 0 : t;
};

/** Item de `action: 'list'` com campos garantidos (o backend pode omitir os opcionais). */
export function normalizePendingRequest(raw) {
  const emp = raw?.empresa || {};
  return {
    userId: String(raw?.userId || ''),
    email: str(raw?.email),
    fullName: str(raw?.fullName),
    phone: str(raw?.phone),
    observacao: str(raw?.observacao),
    requestedAt: str(raw?.requestedAt),
    empresa: {
      nome: str(emp.nome),
      cnpj: str(emp.cnpj),
      razaoSocial: str(emp.razaoSocial),
      nomeFantasia: str(emp.nomeFantasia),
      endereco: str(emp.endereco),
      cep: str(emp.cep),
      telefone: str(emp.telefone),
      email: str(emp.email),
    },
  };
}

/** Mais recentes primeiro; empate por e-mail e id para a ordem não "pular" a cada atualização. */
export function sortPendingRequests(list) {
  return [...list].sort(
    (a, b) =>
      time(b.requestedAt) - time(a.requestedAt) ||
      String(a.email || '').localeCompare(String(b.email || ''), 'pt-BR') ||
      a.userId.localeCompare(b.userId),
  );
}

export function normalizePendingList(raw) {
  const list = Array.isArray(raw) ? raw : [];
  return sortPendingRequests(list.map(normalizePendingRequest).filter((r) => r.userId));
}

export function normalizeHistoryEntry(raw) {
  const eventType = raw?.eventType === 'approved' ? 'approved' : 'submitted';
  return {
    id: String(raw?.id || `${raw?.subjectUserId || ''}-${raw?.occurredAt || ''}`),
    eventType,
    email: str(raw?.email),
    fullName: str(raw?.fullName),
    empresaNome: str(raw?.empresaNome),
    cnpj: str(raw?.cnpj),
    observacao: str(raw?.observacao),
    actorEmail: eventType === 'approved' ? str(raw?.actorEmail) : null,
    occurredAt: str(raw?.occurredAt),
    requestedAt: str(raw?.requestedAt),
    approvedAt: eventType === 'approved' ? str(raw?.approvedAt) : null,
  };
}

/** O relatório já vem do mais recente para o mais antigo; reforça com desempate estável. */
export function normalizeHistory(raw) {
  const list = Array.isArray(raw) ? raw : [];
  return list
    .map(normalizeHistoryEntry)
    .sort((a, b) => time(b.occurredAt) - time(a.occurredAt) || a.id.localeCompare(b.id));
}

export function requesterName(req) {
  return req?.fullName || req?.email || 'Sem nome';
}

export function empresaName(empresa) {
  return empresa?.nome || empresa?.razaoSocial || empresa?.nomeFantasia || null;
}

export function formatDate(value) {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}

export function formatDateTime(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  });
}

/** Texto amigável para os erros que a Edge Function / backend devolvem. */
export function formatAccessRequestError(message) {
  const text = String(message || '').trim();
  if (/já processada|nao encontrada|não encontrada/i.test(text)) {
    return 'Esta solicitação já foi analisada ou não existe mais. A lista foi atualizada.';
  }
  if (/apenas superadmin|forbidden|sem permiss|403/i.test(text)) {
    return 'Só o superadmin pode analisar solicitações de acesso.';
  }
  if (/não autenticado|nao autenticado|sessão expirada|401/i.test(text)) {
    return 'Sua sessão expirou. Entre novamente.';
  }
  if (/fetch failed|ECONNREFUSED|network/i.test(text)) {
    return 'Não foi possível falar com o servidor. Tente de novo em instantes.';
  }
  return text || 'Não foi possível concluir a operação.';
}

/** Erro de "pedido já tratado" → a tela recarrega para não mostrar um pedido que sumiu. */
export const isStaleRequestError = (message) => /já processada|não encontrada|nao encontrada/i.test(String(message || ''));
