import { createSupabaseClient } from '../config/supabase.js';
import { badRequest, notFound } from '../utils/errors.js';
import { normalizeWhatsappPhoneDigits } from '../utils/whatsapp-phone.js';
import * as transactionsService from './transactions.service.js';
import * as categoriesService from './categories.service.js';
import * as rbacCatalogService from './rbac-catalog.service.js';
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
  const n = String(role).trim().toLowerCase().replace(/\s+/g, '');
  if (n === 'user') return 'usuario';
  return n;
};

/**
 * Vínculos activos empresa × role + `profiles.role` (igual fallback de `getRequesterContext` na app).
 * Superadmin pode existir só em `profiles.role` sem linha activa coerente em `role_x_user_x_empresa`.
 *
 * @param {string} userId
 * @returns {Promise<{
 *   memberships: Array<{ linkId: string, role: string | null, empresaId: string | null, empresaNome: string | null, mei: boolean | null }>,
 *   hasActiveMembership: boolean,
 *   profileRole: string | null,
 *   hasSuperadminCapability: boolean
 * }>}
 */
export const resolveActorMembershipsForUser = async (userId) => {
  const admin = createSupabaseClient({ useServiceRole: true });

  const [{ data: links, error }, { data: profileRow, error: profileErr }] = await Promise.all([
    admin
      .from('role_x_user_x_empresa')
      .select('id, empresas_id, roles_id, mei')
      .eq('user_id', userId)
      .eq('status', true),
    admin.from('profiles').select('role').eq('id', userId).maybeSingle(),
  ]);

  if (error) throw badRequest(error.message);
  if (profileErr) throw badRequest(profileErr.message);

  const profileRole = normalizeOpenclawRoleLabel(profileRow?.role);

  if (!links?.length) {
    return {
      memberships: [],
      hasActiveMembership: false,
      profileRole,
      hasSuperadminCapability: profileRole === 'superadmin',
    };
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

  const hasSuperadminCapability =
    profileRole === 'superadmin' || memberships.some((m) => m.role === 'superadmin');

  return { memberships, hasActiveMembership: true, profileRole, hasSuperadminCapability };
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

  if (action === 'list_roles') {
    const includeDb =
      payload?.includeDatabase === true ||
      String(payload?.includeDatabase || '').toLowerCase() === 'true';
    let databaseRoles = [];
    if (includeDb) {
      try {
        databaseRoles = await rbacCatalogService.listRolesFromDatabase();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        databaseRoles = { error: msg };
      }
    }
    const base = {
      catalog: rbacCatalogService.listRolesCatalog(),
      databaseRoles,
    };
    const phoneDigits = phone ? normalizeWhatsappPhoneDigits(phone) : '';
    if (!phoneDigits) {
      return {
        ok: true,
        message: 'Catálogo de cargos (OpenClaw autorizado)',
        data: { ...base, actorContext: null },
      };
    }
    try {
      const resolved = await resolveUserIdByPhoneDetailed(phone);
      const { userId, matchedUserNumber, lookupCandidates } = resolved;
      const linkDebug = {
        phoneDigits: resolved.phoneDigits,
        matchedUserNumber,
        lookupCandidates,
      };
      if (!userId) {
        return {
          ok: true,
          message:
            'Catálogo de cargos. Telefone ainda sem utilizador na app (n8n_link).',
          data: { ...base, ...linkDebug, actorContext: null },
        };
      }
      let actorContext = {
        memberships: [],
        hasActiveMembership: false,
        profileRole: null,
        hasSuperadminCapability: false,
      };
      try {
        actorContext = await resolveActorMembershipsForUser(userId);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[OpenClaw] actorContext list_roles:', msg);
      }
      return {
        ok: true,
        message: 'Catálogo de cargos e cargo do utilizador',
        data: { ...base, userId, actorContext, ...linkDebug },
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        ok: true,
        message: 'Catálogo de cargos',
        data: { ...base, actorContext: null, resolveNote: msg },
      };
    }
  }

  const resolved = await resolveUserIdByPhoneDetailed(phone);
  const { userId, phoneDigits, matchedUserNumber, lookupCandidates } = resolved;
  if (!userId) {
    throw notFound(
      'Nenhum utilizador ligado a este telefone. Abre o app, mete o telefone no perfil e guarda.',
    );
  }

  const linkDebug = { phoneDigits, matchedUserNumber, lookupCandidates };

  /** Nunca bloquear Midas/OpenClaw se memberships falharem (schema, rede, Supabase). */
  let actorContext = {
    memberships: [],
    hasActiveMembership: false,
    profileRole: null,
    hasSuperadminCapability: false,
  };
  try {
    actorContext = await resolveActorMembershipsForUser(userId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[OpenClaw] actorContext ignorado (action continua):', msg);
  }

  if (action === 'resolve_user') {
    return {
      ok: true,
      message: 'Utilizador encontrado',
      data: { userId, actorContext, ...linkDebug },
    };
  }

  if (action === 'get_permissions') {
    const roleRaw = payload?.role ?? payload?.cargo;
    const data = roleRaw
      ? rbacCatalogService.getPermissionsForRole(String(roleRaw))
      : rbacCatalogService.resolveEffectivePermissionsForActor(actorContext);
    return {
      ok: true,
      message: roleRaw ? 'Permissões do cargo' : 'Permissões efectivas do utilizador',
      data: { ...data, userId, actorContext, ...linkDebug },
    };
  }

  if (action === 'check_permission') {
    const permission = payload?.permission ?? payload?.key;
    if (!permission) {
      throw badRequest('payload.permission (ou key) é obrigatório');
    }
    const check = rbacCatalogService.checkActorPermission(actorContext, String(permission));
    return {
      ok: true,
      message: check.allowed ? 'Permitido' : 'Não permitido',
      data: { ...check, userId, actorContext, ...linkDebug },
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

  if (action === 'list_categories') {
    const tipoRaw = payload?.tipo ?? payload?.type;
    const tipo =
      tipoRaw !== undefined && tipoRaw !== null && String(tipoRaw).trim() !== ''
        ? String(tipoRaw).trim()
        : undefined;
    const minimal =
      payload?.minimal === true ||
      String(payload?.minimal || '').toLowerCase() === 'true' ||
      payload?.minimal === 1 ||
      String(payload?.minimal || '').toLowerCase() === '1';

    const rows = await categoriesService.listCategories(userId, tipo);
    const categories = minimal
      ? categoriesService.mapCategoriesToMinimalRows(rows)
      : rows;

    return {
      ok: true,
      message: `Lista de categorias (${categories.length}).`,
      data: { categories, userId, actorContext, ...linkDebug },
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
    `Ação desconhecida: "${action}". Use: ping, resolve_user, list_roles, get_permissions, check_permission, list_categories, list_transactions, create_transaction, delete_transaction, get_das_current.`,
  );
};
