import { createSupabaseClient } from '../config/supabase.js';
import { badRequest, notFound } from '../utils/errors.js';
import { normalizeWhatsappPhoneDigits } from '../utils/whatsapp-phone.js';
import * as transactionsService from './transactions.service.js';
import { getDasBase64 } from './mei-guide-das-base64.service.js';

const MAX_LIST = 40;

/**
 * Competência no formato MM/YYYY (ex.: 05/2026). Mês pode ter 1 ou 2 dígitos.
 * @param {string} raw
 * @returns {{ display: string, periodoDigits: string } | null}
 */
export const parseMesCompetenciaMmYyyy = (raw) => {
  const s = String(raw || '').trim();
  if (!s) return null;
  const m = /^(\d{1,2})\/(\d{4})$/.exec(s);
  if (!m) return null;
  const month = Number(m[1]);
  const year = Number(m[2]);
  if (!Number.isInteger(month) || !Number.isInteger(year)) return null;
  if (month < 1 || month > 12) return null;
  const display = `${String(month).padStart(2, '0')}/${year}`;
  const periodoDigits = `${year}${String(month).padStart(2, '0')}`;
  return { display, periodoDigits };
};

/** Competência actual (UTC) em MM/YYYY + dígitos YYYYMM para a tabela DAS_mei. */
export const mesCompetenciaAtualUtc = () => {
  const now = new Date();
  const month = now.getUTCMonth() + 1;
  const year = now.getUTCFullYear();
  const display = `${String(month).padStart(2, '0')}/${year}`;
  const periodoDigits = `${year}${String(month).padStart(2, '0')}`;
  return { display, periodoDigits };
};

/**
 * Tenta bater com o que está em `n8n_link.user_number` (pode estar com ou sem 55).
 */
export const buildPhoneLookupCandidates = (digits) => {
  const out = [];
  const d = String(digits || '').replace(/\D/g, '');
  if (!d) return out;
  out.push(d);
  if (d.startsWith('55') && d.length > 11) {
    out.push(d.slice(2));
  }
  if (!d.startsWith('55') && d.length >= 10 && d.length <= 11) {
    out.push(`55${d}`);
  }
  return [...new Set(out)];
};

/**
 * Resolve telefone → user_id e devolve metadados para diagnóstico (OpenClaw / n8n).
 * @returns {{ userId: string | null, phoneDigits: string, matchedUserNumber: string | null, lookupCandidates: string[] }}
 */
export const resolveUserIdByPhoneDetailed = async (rawPhone) => {
  const phoneDigits = normalizeWhatsappPhoneDigits(rawPhone);
  if (!phoneDigits) {
    throw badRequest('Telefone ausente ou inválido');
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw badRequest('SUPABASE_SERVICE_ROLE_KEY não configurada');
  }
  const admin = createSupabaseClient({ useServiceRole: true });
  const lookupCandidates = buildPhoneLookupCandidates(phoneDigits);
  for (const num of lookupCandidates) {
    const { data, error } = await admin
      .from('n8n_link')
      .select('user_id')
      .eq('user_number', num)
      .maybeSingle();
    if (error) throw badRequest(error.message);
    if (data?.user_id) {
      return {
        userId: String(data.user_id),
        phoneDigits,
        matchedUserNumber: num,
        lookupCandidates,
      };
    }
  }
  return {
    userId: null,
    phoneDigits,
    matchedUserNumber: null,
    lookupCandidates,
  };
};

export const resolveUserIdByPhone = async (rawPhone) => {
  const r = await resolveUserIdByPhoneDetailed(rawPhone);
  return r.userId;
};

const normalizeOpenclawRoleLabel = (role) => {
  if (!role) return null;
  const n = String(role).trim().toLowerCase();
  if (n === 'user') return 'usuario';
  return n;
};

/**
 * Vínculos activos empresa × role (mesma fonte que o auth da app).
 * O Midas/OpenClaw identifica o utilizador pelo telefone (`n8n_link`); isto expõe **cargos**
 * para a IA e para diagnóstico, sem bypass de RLS (usa service role só no servidor).
 *
 * @param {string} userId
 * @returns {Promise<{ memberships: Array<{ linkId: string, role: string | null, empresaId: string | null, empresaNome: string | null, mei: boolean | null }>, hasActiveMembership: boolean }>}
 */
export const resolveActorMembershipsForUser = async (userId) => {
  const admin = createSupabaseClient({ useServiceRole: true });
  const { data: links, error } = await admin
    .from('role_x_user_x_empresa')
    .select('id, empresas_id, roles_id, mei')
    .eq('user_id', userId)
    .eq('status', true);

  if (error) throw badRequest(error.message);
  if (!links?.length) {
    return { memberships: [], hasActiveMembership: false };
  }

  const roleIds = [...new Set(links.map((l) => l.roles_id).filter(Boolean))];
  const empresaIds = [...new Set(links.map((l) => l.empresas_id).filter(Boolean))];

  /** @type {Map<string, string | null>} */
  let roleMap = new Map();
  if (roleIds.length > 0) {
    const { data: rolesRows, error: rErr } = await admin
      .from('roles')
      .select('id, roles')
      .in('id', roleIds);
    if (rErr) throw badRequest(rErr.message);
    roleMap = new Map(
      (rolesRows || []).map((r) => [r.id, normalizeOpenclawRoleLabel(r.roles)]),
    );
  }

  /** @type {Map<string, string | null>} */
  let empresaMap = new Map();
  if (empresaIds.length > 0) {
    const { data: empRows, error: eErr } = await admin
      .from('empresas')
      .select('id, empresa')
      .in('id', empresaIds);
    if (eErr) throw badRequest(eErr.message);
    empresaMap = new Map((empRows || []).map((e) => [e.id, e.empresa ?? null]));
  }

  const memberships = links.map((link) => ({
    linkId: String(link.id),
    role: link.roles_id ? roleMap.get(link.roles_id) ?? null : null,
    empresaId: link.empresas_id ? String(link.empresas_id) : null,
    empresaNome: link.empresas_id ? empresaMap.get(link.empresas_id) ?? null : null,
    mei: typeof link.mei === 'boolean' ? link.mei : null,
  }));

  return { memberships, hasActiveMembership: true };
};

/**
 * @param {{ phone: string, action: string, payload?: object }} input
 */
export const runOpenclawAction = async (input) => {
  const phone = input?.phone;
  const action = String(input?.action || '').trim();
  const payload = input?.payload && typeof input.payload === 'object' ? input.payload : {};

  if (!action) throw badRequest('action é obrigatório');

  if (action === 'ping') {
    return { ok: true, message: 'OpenClaw online', data: { pong: true } };
  }

  const resolved = await resolveUserIdByPhoneDetailed(phone);
  const { userId, phoneDigits, matchedUserNumber, lookupCandidates } = resolved;
  if (!userId) {
    throw notFound(
      'Nenhum utilizador ligado a este telefone. Abre o app, mete o telefone no perfil e guarda.',
    );
  }

  const linkDebug = { phoneDigits, matchedUserNumber, lookupCandidates };
  const actorContext = await resolveActorMembershipsForUser(userId);

  if (action === 'resolve_user') {
    return {
      ok: true,
      message: 'Utilizador encontrado',
      data: { userId, actorContext, ...linkDebug },
    };
  }

  if (action === 'list_transactions') {
    const rows = await transactionsService.listTransactions(userId);
    const sliced = (rows || []).slice(0, MAX_LIST);
    return {
      ok: true,
      message: `Últimas ${sliced.length} transações (máx. ${MAX_LIST}).`,
      data: { transactions: sliced, userId, actorContext, ...linkDebug },
    };
  }

  if (action === 'create_transaction') {
    const created = await transactionsService.createTransaction(userId, payload);
    return {
      ok: true,
      message: 'Transação criada',
      data: {
        transaction: created,
        userId,
        actorContext,
        ...linkDebug,
      },
    };
  }

  if (action === 'delete_transaction') {
    await transactionsService.deleteTransaction(userId, payload, { id: payload?.id });
    return {
      ok: true,
      message: 'Transação removida',
      data: { success: true, actorContext },
    };
  }

  if (action === 'get_das_current') {
    const rawMes = payload?.mes;
    let competencia;
    if (rawMes === undefined || rawMes === null || String(rawMes).trim() === '') {
      competencia = mesCompetenciaAtualUtc();
    } else {
      competencia = parseMesCompetenciaMmYyyy(rawMes);
      if (!competencia) {
        throw badRequest('mes inválido; use MM/YYYY, ex.: 05/2026');
      }
    }
    const { display, periodoDigits } = competencia;
    const pdfBase64 = await getDasBase64({ userId, periodoApuracao: periodoDigits });
    if (!pdfBase64 || String(pdfBase64).trim() === '') {
      throw notFound(`Nenhum DAS encontrado para a competência ${display}.`);
    }
    const fileName = `DAS-${display.replace('/', '-')}.pdf`;
    return {
      ok: true,
      message: 'DAS encontrado',
      data: {
        fileName,
        mimeType: 'application/pdf',
        base64: pdfBase64,
        mes: display,
        actorContext,
        ...linkDebug,
      },
    };
  }

  throw badRequest(
    `Ação desconhecida: "${action}". Use: ping, resolve_user, list_transactions, create_transaction, delete_transaction, get_das_current.`,
  );
};
