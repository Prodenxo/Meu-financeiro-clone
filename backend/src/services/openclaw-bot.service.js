import { createSupabaseClient } from '../config/supabase.js';
import { env } from '../config/env.js';
import { badRequest, forbidden, notFound } from '../utils/errors.js';
import { normalizeWhatsappPhoneDigits } from '../utils/whatsapp-phone.js';
import * as transactionsService from './transactions.service.js';
import * as categoriesService from './categories.service.js';
import * as rbacCatalogService from './rbac-catalog.service.js';
import {
  deleteDasBase64,
  upsertDasBase64,
} from './mei-guide-das-base64.service.js';
import * as meiGuideService from './mei-guide.service.js';
import { isPeriodoIndisponivelSerproError } from './mei-guide-serpro-period-guard.js';
import * as calendarEventsService from './calendar-events.service.js';
import {
  isWhatsappOutboundConfigured,
  sendWhatsappMessage,
} from './whatsapp-outbound.service.js';
import {
  buildDasPaymentStatusMessage,
  getDasPaymentStatusForUser,
} from './mei-das.service.js';
import {
  consultOpenclawNfse,
  emitOpenclawNfse,
  fetchOpenclawNfsePdfBase64,
  getOpenclawNfseSetupStatus,
  isNfsePdfReadyStatus,
  listOpenclawNfseClientes,
  listOpenclawNfseNotas,
  previewOpenclawNfseEmit,
  rethrowNfseErrorForBot,
} from './openclaw-nfse.service.js';
import {
  deliverOpenclawNfseWhatsappPdf,
  getOpenclawNfseWhatsappDeliveryState,
  isOpenclawNfseAutoWhatsappEnabled,
  markOpenclawNfseWhatsappSent,
  registerOpenclawNfseWhatsappDelivery,
  scheduleOpenclawNfseWhatsappDeliveryRetries,
} from './nfse-whatsapp-delivery.service.js';
import {
  openclawApproveAccessRequest,
  openclawListAccessRequests,
  openclawRejectAccessRequest,
} from './openclaw-access-requests.service.js';

const MAX_LIST = 40;

/** Erros de DAS com texto claro para o agente WhatsApp (não pedir CNPJ/certificado no chat). */
const rethrowDasFetchErrorForBot = (err, display) => {
  if (isPeriodoIndisponivelSerproError(err)) {
    throw badRequest(err.message, {
      code: 'MEI_DAS_PERIODO_INDISPONIVEL',
      mes: display,
      botHint:
        'Não há DAS neste mês (ex.: empresa abriu em março → jan/fev sem guia). Não peça CNPJ nem certificado.',
    });
  }
  const code = err?.errors?.code;
  if (code === 'MEI_CERT_MISSING' || code === 'MEI_CERT_LOAD_FAILED') {
    throw badRequest(err.message, {
      code,
      mes: display,
      botHint:
        'Oriente cadastro do certificado A1 na app Meu Financeiro. Proibido pedir certificado ou CNPJ pelo WhatsApp.',
    });
  }
  const msg = String(err?.message || '');
  if (/certificado|CNPJ do MEI/i.test(msg)) {
    throw badRequest(
      `DAS ${display}: conta identificada pelo telefone WhatsApp — não peça certificado nem CNPJ. Se o mês for anterior à abertura do MEI, explique que não existe DAS nesse período.`,
      {
        code: 'MEI_DAS_USE_APP_OR_PERIOD',
        mes: display,
        botHint: 'Repita a message da API; use mf-das-send.sh com o telefone do remetente.',
      }
    );
  }
  throw err;
};

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

/** Telefone destino WhatsApp (55 + dígitos) a partir do lookup OpenClaw. */
export const resolveOpenclawWhatsappPhone = (phoneDigits, matchedUserNumber) => {
  const raw = String(matchedUserNumber || phoneDigits || '').replace(/\D/g, '');
  if (!raw) return '';
  if (raw.startsWith('55')) return raw;
  return `55${raw}`;
};

/**
 * Envia PDF via Z-API / n8n. Não lança: devolve status para resposta curta ao agente.
 * @returns {Promise<{ whatsappStatus: string, whatsappError?: string, hint?: string }>}
 */
export const trySendWhatsappPdfOutbound = async ({
  phone,
  pdfBase64,
  fileName,
  message,
  extraPayload = {},
}) => {
  if (!isWhatsappOutboundConfigured()) {
    return {
      whatsappStatus: 'skipped_no_whatsapp',
      hint:
        'Configure ZAPI no backend ou use mf-nfse-send.sh / mf-das-send.sh no OpenClaw (openclaw message send).',
    };
  }
  if (!phone) {
    return { whatsappStatus: 'skipped_no_phone' };
  }
  if (!pdfBase64) {
    return { whatsappStatus: 'skipped_no_pdf' };
  }
  try {
    await sendWhatsappMessage({
      phone,
      fileName,
      pdfBase64,
      message,
      source: 'openclaw_bot',
      ...extraPayload,
    });
    return { whatsappStatus: 'sent' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { whatsappStatus: 'failed', whatsappError: msg };
  }
};

/** Envia DAS via webhook n8n/Z-API. */
export const trySendDasWhatsappWebhook = async ({
  userId,
  phone,
  display,
  periodoDigits,
  pdfBase64,
  fileName,
}) => {
  const year = periodoDigits.slice(0, 4);
  const month = periodoDigits.slice(4, 6);
  return trySendWhatsappPdfOutbound({
    phone,
    pdfBase64,
    fileName,
    message: `Segue o DAS MEI da competência ${display}.`,
    extraPayload: {
      userId,
      competencia: `${year}-${month}`,
      periodoApuracao: periodoDigits,
    },
  });
};

const buildNfseSendExecCommand = (destinationPhone, notaId) => {
  if (!destinationPhone || !notaId) return null;
  return `/home/node/.openclaw/workspace/mf-nfse-send.sh ${destinationPhone} ${notaId}`;
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

/**
 * Nome/empresa para o agente confirmar que o DAS é da conta certa (não confundir utilizadores).
 * @param {string} userId
 */
export const fetchOpenclawAccountSummary = async (userId) => {
  const admin = createSupabaseClient({ useServiceRole: true });

  let email = null;
  let displayName = null;
  try {
    const { data: authData, error: authErr } = await admin.auth.admin.getUserById(userId);
    if (!authErr && authData?.user) {
      email = authData.user.email ?? null;
      const meta = authData.user.user_metadata || {};
      displayName = meta.display_name || meta.full_name || email || null;
    }
  } catch {
    /* auth opcional */
  }

  let empresaNome = null;
  try {
    const actorCtx = await resolveActorMembershipsForUser(userId);
    empresaNome =
      actorCtx.memberships?.find((m) => m.empresaNome)?.empresaNome ?? null;
  } catch {
    /* memberships opcional */
  }

  return {
    userId,
    displayName: String(displayName || '').trim() || 'Utilizador',
    empresaNome,
    email,
  };
};

/**
 * Admin/superadmin pode ver DAS de outro telefone; utilizador comum só a própria conta.
 */
export const assertActorCanAccessDasForUser = async ({
  actorUserId,
  actorContext,
  targetUserId,
}) => {
  if (actorUserId === targetUserId) return;

  const isSuperadmin = Boolean(actorContext?.hasSuperadminCapability);
  const isAdmin =
    actorContext?.profileRole === 'admin' ||
    (actorContext?.memberships || []).some((m) => m.role === 'admin');

  if (isSuperadmin) return;

  if (!isAdmin) {
    throw forbidden(
      'Só podes consultar ou enviar o DAS da tua própria conta. Usa no JSON o telefone WhatsApp de quem está a escrever (remetente do chat), não de outra pessoa.',
    );
  }

  let targetCtx;
  try {
    targetCtx = await resolveActorMembershipsForUser(targetUserId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw forbidden(`Não foi possível validar o colaborador: ${msg}`);
  }

  const adminEmpresaIds = new Set(
    (actorContext?.memberships || [])
      .filter((m) => m.role === 'admin' && m.empresaId)
      .map((m) => String(m.empresaId)),
  );
  const shared = (targetCtx?.memberships || []).some(
    (m) => m.empresaId && adminEmpresaIds.has(String(m.empresaId)),
  );
  if (!shared) {
    throw forbidden(
      'Como administrador, só podes aceder ao DAS de colaboradores da mesma empresa. Usa subjectPhone só após confirmar empresa.',
    );
  }
};

/**
 * Quem pediu o DAS (phone no body) vs de quem é o PDF (subjectPhone opcional).
 * @returns {Promise<{ dataUserId: string, account: object, dataLinkDebug: object, accessedAsSelf: boolean }>}
 */
export const resolveDasDataSubject = async ({
  actorUserId,
  actorContext,
  actorLinkDebug,
  payload,
}) => {
  const subjectRaw =
    payload?.subjectPhone ?? payload?.targetPhone ?? payload?.phoneAlvo ?? null;
  const subjectTrim = subjectRaw === null || subjectRaw === undefined
    ? ''
    : String(subjectRaw).trim();

  if (!subjectTrim) {
    const account = await fetchOpenclawAccountSummary(actorUserId);
    return {
      dataUserId: actorUserId,
      account,
      dataLinkDebug: actorLinkDebug,
      accessedAsSelf: true,
    };
  }

  const subResolved = await resolveUserIdByPhoneDetailed(subjectTrim);
  if (!subResolved.userId) {
    throw notFound(
      'Telefone indicado (subjectPhone) sem utilizador na app. O colaborador deve guardar o telefone no perfil.',
    );
  }

  await assertActorCanAccessDasForUser({
    actorUserId,
    actorContext,
    targetUserId: subResolved.userId,
  });

  const account = await fetchOpenclawAccountSummary(subResolved.userId);
  return {
    dataUserId: subResolved.userId,
    account,
    dataLinkDebug: {
      subjectPhoneDigits: subResolved.phoneDigits,
      subjectMatchedUserNumber: subResolved.matchedUserNumber,
      actorPhoneDigits: actorLinkDebug.phoneDigits,
      actorMatchedUserNumber: actorLinkDebug.matchedUserNumber,
    },
    accessedAsSelf: false,
  };
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
    const account = await fetchOpenclawAccountSummary(userId);
    return {
      ok: true,
      message: `Conta ligada a este telefone: ${account.displayName}${account.empresaNome ? ` (${account.empresaNome})` : ''}.`,
      data: { userId, account, actorContext, ...linkDebug },
    };
  }

  if (action === 'list_access_requests') {
    const result = await openclawListAccessRequests(userId, actorContext);
    return { ...result, data: { ...result.data, actorContext, ...linkDebug } };
  }

  if (action === 'approve_access_request') {
    const result = await openclawApproveAccessRequest(userId, actorContext, payload);
    return { ...result, data: { ...result.data, actorContext, ...linkDebug } };
  }

  if (action === 'reject_access_request') {
    const result = await openclawRejectAccessRequest(actorContext, payload);
    return { ...result, data: { ...result.data, actorContext, ...linkDebug } };
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
    const tipo = String(payload?.tipo || '').trim();
    const tipoNorm = tipo === 'saída' ? 'saida' : tipo;
    const statusNorm = transactionsService.normalizeTransactionStatus(
      tipoNorm,
      payload?.status,
    );
    const created = await transactionsService.createTransaction(userId, {
      ...payload,
      tipo: tipoNorm,
      status: statusNorm,
    });
    const statusLabel =
      statusNorm === 'recebido' || statusNorm === 'pago' ? ' (já contabiliza no saldo)' : '';
    return {
      ok: true,
      message: `Transação criada${statusLabel}`,
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

  if (action === 'list_calendar_events') {
    const rawDate = payload?.data ?? payload?.date;
    const calendar = await calendarEventsService.listCalendarEventsForUser(userId, {
      date: rawDate,
      data: rawDate,
    });
    return {
      ok: true,
      message: calendar.message,
      data: {
        ...calendar,
        userId,
        actorContext,
        ...linkDebug,
      },
    };
  }

  if (action === 'create_calendar_event') {
    const created = await calendarEventsService.createCalendarEventForUser(userId, payload);
    if (!created.ok) {
      const hint = created.notLinked
        ? ' Peça para conectar o Google Calendar em Configurações na app.'
        : '';
      return {
        ok: false,
        message: `${created.message || 'Não foi possível criar o compromisso.'}${hint}`,
        data: {
          ...created,
          userId,
          actorContext,
          ...linkDebug,
        },
      };
    }
    return {
      ok: true,
      message: created.message,
      data: {
        ...created,
        userId,
        actorContext,
        ...linkDebug,
      },
    };
  }

  const resolveDasCompetencia = () => {
    const rawMes = payload?.mes;
    if (rawMes === undefined || rawMes === null || String(rawMes).trim() === '') {
      return mesCompetenciaAtualUtc();
    }
    const competencia = parseMesCompetenciaMmYyyy(rawMes);
    if (!competencia) {
      throw badRequest('mes inválido; use MM/YYYY, ex.: 05/2026');
    }
    return competencia;
  };

  const buildDasOwnerLabel = (account) => {
    const name = account?.displayName || 'Utilizador';
    const emp = account?.empresaNome ? ` — ${account.empresaNome}` : '';
    return `${name}${emp}`;
  };

  const resolveDasSubjectIfNeeded = async () => {
    if (
      action !== 'get_das_current' &&
      action !== 'get_das_payment_status' &&
      action !== 'send_das_whatsapp' &&
      action !== 'refresh_das_pdf'
    ) {
      return null;
    }
    return resolveDasDataSubject({
      actorUserId: userId,
      actorContext,
      actorLinkDebug: linkDebug,
      payload,
    });
  };

  const dasSubject = await resolveDasSubjectIfNeeded();
  const dasUserId = dasSubject?.dataUserId ?? userId;

  if (action === 'get_das_current') {
    const { display, periodoDigits } = resolveDasCompetencia();
    let pdfResult;
    try {
      pdfResult = await meiGuideService.fetchDasPdfBase64ForUser(dasUserId, {
        periodoApuracao: periodoDigits,
        cnpj: payload?.cnpj,
        contribuinte: payload?.contribuinte,
      });
    } catch (err) {
      rethrowDasFetchErrorForBot(err, display);
    }
    const pdfBase64 = pdfResult.pdfBase64;
    const fileName = pdfResult.fileName || `DAS-${display.replace('/', '-')}.pdf`;
    const destinationPhone = resolveOpenclawWhatsappPhone(phoneDigits, matchedUserNumber);
    const includeBase64 =
      payload?.includeBase64 === true ||
      String(payload?.includeBase64 || '').toLowerCase() === 'true' ||
      payload?.includeBase64 === 1;

    if (!includeBase64) {
      const deliverWhatsapp =
        payload?.deliverWhatsapp === true ||
        String(payload?.deliverWhatsapp || '').toLowerCase() === 'true';
      let whatsapp = { whatsappStatus: 'not_requested' };
      if (deliverWhatsapp) {
        whatsapp = await trySendDasWhatsappWebhook({
          userId: dasUserId,
          phone: destinationPhone,
          display,
          periodoDigits,
          pdfBase64,
          fileName,
        });
      }
      const sent = whatsapp.whatsappStatus === 'sent';
      const owner = dasSubject ? buildDasOwnerLabel(dasSubject.account) : null;
      return {
        ok: true,
        message: sent
          ? `PDF DAS ${display} enviado no WhatsApp (${owner}).`
          : `DAS ${display} de ${owner}. Para enviar no WhatsApp use mf-send-das.sh com o telefone do remetente do chat.`,
        data: {
          fileName,
          mes: display,
          mimeType: 'application/pdf',
          includeBase64: false,
          whatsappStatus: whatsapp.whatsappStatus,
          whatsappError: whatsapp.whatsappError ?? null,
          hint: whatsapp.hint ?? null,
          dasAccount: dasSubject?.account ?? null,
          accessedAsSelf: dasSubject?.accessedAsSelf ?? true,
          execCommand: destinationPhone
            ? `/home/node/.openclaw/workspace/mf-das-send.sh ${destinationPhone} ${display}`
            : null,
          actorContext,
          ...(dasSubject?.dataLinkDebug ?? linkDebug),
        },
      };
    }

    const owner = dasSubject ? buildDasOwnerLabel(dasSubject.account) : null;
    return {
      ok: true,
      message: `DAS encontrado (${owner}).`,
      data: {
        fileName,
        mimeType: 'application/pdf',
        base64: pdfBase64,
        mes: display,
        dasAccount: dasSubject?.account ?? null,
        accessedAsSelf: dasSubject?.accessedAsSelf ?? true,
        actorContext,
        ...(dasSubject?.dataLinkDebug ?? linkDebug),
      },
    };
  }

  if (action === 'get_das_payment_status') {
    const { display, periodoDigits } = resolveDasCompetencia();
    const competenciaIso = `${periodoDigits.slice(0, 4)}-${periodoDigits.slice(4, 6)}`;
    const refreshFromSerpro =
      payload?.refreshFromSerpro === true ||
      String(payload?.refreshFromSerpro || '').toLowerCase() === 'true';
    const statusInfo = await getDasPaymentStatusForUser({
      userId: dasUserId,
      competencia: competenciaIso,
      refreshFromSerpro,
    });
    const owner = dasSubject ? buildDasOwnerLabel(dasSubject.account) : '';
    const replyMessage = `${buildDasPaymentStatusMessage({
      status: statusInfo.status,
      display,
      hasPdf: statusInfo.hasPdf,
    })} Conta: ${owner}.`;
    return {
      ok: true,
      message: replyMessage,
      data: {
        mes: display,
        competencia: statusInfo.competencia,
        status: statusInfo.status,
        statusLabel: statusInfo.statusLabel,
        hasPdf: statusInfo.hasPdf,
        statusSource: statusInfo.statusSource,
        updatedAt: statusInfo.updatedAt,
        isPaid: statusInfo.status === 'pago',
        isPending: statusInfo.status === 'pendente',
        dasAccount: dasSubject?.account ?? null,
        accessedAsSelf: dasSubject?.accessedAsSelf ?? true,
        actorContext,
        ...(dasSubject?.dataLinkDebug ?? linkDebug),
      },
    };
  }

  if (action === 'send_das_whatsapp') {
    const { display, periodoDigits } = resolveDasCompetencia();
    let pdfResult;
    try {
      pdfResult = await meiGuideService.fetchDasPdfBase64ForUser(dasUserId, {
        periodoApuracao: periodoDigits,
        cnpj: payload?.cnpj,
        contribuinte: payload?.contribuinte,
      });
    } catch (err) {
      rethrowDasFetchErrorForBot(err, display);
    }
    const pdfBase64 = pdfResult.pdfBase64;
    const fileName = pdfResult.fileName || `DAS-${display.replace('/', '-')}.pdf`;
    const destinationPhone = resolveOpenclawWhatsappPhone(phoneDigits, matchedUserNumber);
    const whatsapp = await trySendDasWhatsappWebhook({
      userId: dasUserId,
      phone: destinationPhone,
      display,
      periodoDigits,
      pdfBase64,
      fileName,
    });
    const sent = whatsapp.whatsappStatus === 'sent';
    const owner = dasSubject ? buildDasOwnerLabel(dasSubject.account) : '';
    return {
      ok: true,
      message: sent
        ? `PDF DAS ${display} enviado no WhatsApp (conta: ${owner}).`
        : `DAS ${display} de ${owner}; envio WhatsApp: ${whatsapp.whatsappStatus}.`,
      data: {
        mes: display,
        fileName,
        whatsappStatus: whatsapp.whatsappStatus,
        whatsappError: whatsapp.whatsappError ?? null,
        hint: whatsapp.hint ?? null,
        dasAccount: dasSubject?.account ?? null,
        accessedAsSelf: dasSubject?.accessedAsSelf ?? true,
        useOpenclawScript: sent
          ? null
          : `/home/node/.openclaw/workspace/mf-das-send.sh ${destinationPhone} ${display}`,
        actorContext,
        ...(dasSubject?.dataLinkDebug ?? linkDebug),
      },
    };
  }

  if (action === 'get_nfse_setup_status') {
    const setup = await getOpenclawNfseSetupStatus(userId);
    return {
      ok: true,
      message: setup.ready
        ? 'Conta pronta para emitir NFSe pelo WhatsApp.'
        : `Cadastro incompleto para NFSe: ${setup.missing.join(', ')}. Complete na app MEI → Notas.`,
      data: { setup, userId, actorContext, ...linkDebug },
    };
  }

  if (action === 'list_nfse_clientes') {
    const q = String(payload?.q ?? payload?.nome ?? payload?.busca ?? '').trim();
    const limit = payload?.limit;
    const clientes = await listOpenclawNfseClientes(userId, { q, limit });
    return {
      ok: true,
      message: `${clientes.length} cliente(s) no catálogo NFSe.`,
      data: { clientes, userId, actorContext, ...linkDebug },
    };
  }

  if (action === 'preview_nfse') {
    try {
      const preview = await previewOpenclawNfseEmit(userId, payload);
      return {
        ok: true,
        message: `Pré-visualização: NFSe de R$ ${preview.valorServico} para ${preview.tomadorRazaoSocial} (${preview.tomadorCpfCnpj}). Confirme com emit_nfse e confirm:true.`,
        data: { preview, requiresConfirm: true, userId, actorContext, ...linkDebug },
      };
    } catch (err) {
      rethrowNfseErrorForBot(err);
    }
  }

  if (action === 'emit_nfse') {
    try {
      const result = await emitOpenclawNfse(userId, payload);
      if (result.requiresConfirm) {
        return {
          ok: true,
          message: `Confirme a emissão: R$ ${result.preview.valorServico} — ${result.preview.tomadorRazaoSocial}. Repita com "confirm":true no payload.`,
          data: {
            preview: result.preview,
            requiresConfirm: true,
            notEmitted: true,
            userId,
            actorContext,
            ...linkDebug,
          },
        };
      }
      const nota = result.nota;
      const status = nota?.status || 'processando';
      const tomador = nota?.cnpj_tomador || result.preview?.tomadorCpfCnpj;
      const destinationPhone = resolveOpenclawWhatsappPhone(phoneDigits, matchedUserNumber);
      const pdfReady = isNfsePdfReadyStatus(status);
      const autoEnabled = isOpenclawNfseAutoWhatsappEnabled();
      let autoWhatsapp = null;

      if (autoEnabled && destinationPhone && nota?.id) {
        await registerOpenclawNfseWhatsappDelivery(userId, nota.id, destinationPhone);
        if (pdfReady) {
          autoWhatsapp = await deliverOpenclawNfseWhatsappPdf(
            userId,
            nota.id,
            destinationPhone,
          );
        }
      }

      const autoSent = autoWhatsapp?.whatsappStatus === 'sent';
      const autoFailed = ['failed', 'skipped_no_whatsapp'].includes(
        autoWhatsapp?.whatsappStatus || '',
      );
      if (autoEnabled && nota?.id && !autoSent) {
        scheduleOpenclawNfseWhatsappDeliveryRetries(userId, nota.id);
      }
      const useOpenclawScriptFallback = !autoSent && (!autoEnabled || autoFailed);
      const execCommand =
        useOpenclawScriptFallback && pdfReady && destinationPhone && nota?.id
          ? buildNfseSendExecCommand(destinationPhone, nota.id)
          : null;

      let statusHint = '';
      if (autoSent) {
        statusHint = ' PDF enviado automaticamente no WhatsApp.';
      } else if (autoEnabled) {
        statusHint = pdfReady
          ? ' Envio automático do PDF falhou — use mf-nfse-send.sh se necessário.'
          : ' O PDF será enviado automaticamente quando a nota concluir (não precisa pedir de novo).';
      } else if (pdfReady) {
        statusHint = ' PDF pronto — pode enviar com mf-nfse-send.sh.';
      } else {
        statusHint = ' Quando status for concluido, envie o PDF com mf-nfse-send.sh TELEFONE UUID.';
      }

      return {
        ok: true,
        message: `NFSe enviada para emissão (status: ${status}). Tomador: ${tomador || '—'}.${statusHint}`,
        data: {
          nota: {
            id: nota?.id,
            status: nota?.status,
            plugnotas_id: nota?.plugnotas_id,
            id_integracao: nota?.id_integracao,
            pdf_url: nota?.pdf_url,
            pdfReady,
          },
          execCommand,
          autoWhatsappEnabled: autoEnabled,
          autoWhatsapp: autoWhatsapp
            ? {
              status: autoWhatsapp.whatsappStatus,
              error: autoWhatsapp.whatsappError ?? null,
            }
            : null,
          pdfWhatsappAlreadySent: autoSent,
          doNotRunNfseSendScript: autoSent || (autoEnabled && !autoFailed),
          userId,
          actorContext,
          ...linkDebug,
        },
      };
    } catch (err) {
      rethrowNfseErrorForBot(err);
    }
  }

  if (action === 'list_nfse_notas') {
    const limit = payload?.limit;
    const notas = await listOpenclawNfseNotas(userId, { limit });
    return {
      ok: true,
      message: `${notas.length} nota(s) NFSe recente(s).`,
      data: { notas, userId, actorContext, ...linkDebug },
    };
  }

  if (action === 'consult_nfse') {
    try {
      const sync =
        payload?.sync !== false
        && String(payload?.sync || '').toLowerCase() !== 'false';
      const nota = await consultOpenclawNfse(userId, { id: payload?.id, sync });
      const delivery = await getOpenclawNfseWhatsappDeliveryState(userId, nota.id);
      const destinationPhone = resolveOpenclawWhatsappPhone(phoneDigits, matchedUserNumber);
      const autoEnabled = isOpenclawNfseAutoWhatsappEnabled();
      const execCommand =
        nota.pdfReady && !delivery.alreadySent && !autoEnabled
          ? buildNfseSendExecCommand(destinationPhone, nota.id)
          : null;
      let sendHint = '';
      if (delivery.alreadySent) {
        sendHint = ' PDF já enviado no WhatsApp.';
      } else if (autoEnabled) {
        sendHint = ' Envio automático activo — não use mf-nfse-send.sh.';
      } else if (nota.pdfReady) {
        sendHint = ' Para enviar no WhatsApp use mf-nfse-send.sh com o telefone do remetente.';
      }
      return {
        ok: true,
        message: `Nota ${nota.id}: status ${nota.status || '—'}.${nota.pdfReady ? ' PDF pronto.' : ''}${sendHint}`,
        data: {
          nota,
          execCommand,
          whatsappDelivery: delivery,
          doNotRunNfseSendScript: delivery.alreadySent || autoEnabled,
          userId,
          actorContext,
          ...linkDebug,
        },
      };
    } catch (err) {
      rethrowNfseErrorForBot(err);
    }
  }

  if (action === 'get_nfse_pdf') {
    try {
      const sync =
        payload?.sync !== false
        && String(payload?.sync || '').toLowerCase() !== 'false';
      const pdfResult = await fetchOpenclawNfsePdfBase64(userId, {
        id: payload?.id,
        sync,
      });
      const destinationPhone = resolveOpenclawWhatsappPhone(phoneDigits, matchedUserNumber);
      const includeBase64 =
        payload?.includeBase64 === true
        || String(payload?.includeBase64 || '').toLowerCase() === 'true'
        || payload?.includeBase64 === 1;

      if (!includeBase64) {
        return {
          ok: true,
          message: `PDF NFSe pronto (${pdfResult.nota.status}). Para enviar no WhatsApp use mf-nfse-send.sh.`,
          data: {
            fileName: pdfResult.fileName,
            mimeType: pdfResult.mimeType,
            includeBase64: false,
            nota: pdfResult.nota,
            execCommand: buildNfseSendExecCommand(destinationPhone, pdfResult.nota.id),
            actorContext,
            ...linkDebug,
          },
        };
      }

      return {
        ok: true,
        message: `PDF NFSe obtido (status ${pdfResult.nota.status}).`,
        data: {
          fileName: pdfResult.fileName,
          mimeType: pdfResult.mimeType,
          base64: pdfResult.base64,
          nota: pdfResult.nota,
          actorContext,
          ...linkDebug,
        },
      };
    } catch (err) {
      rethrowNfseErrorForBot(err);
    }
  }

  if (action === 'send_nfse_whatsapp') {
    try {
      const notaId = String(payload?.id || '').trim();
      const priorDelivery = await getOpenclawNfseWhatsappDeliveryState(userId, notaId);
      if (priorDelivery.alreadySent) {
        return {
          ok: true,
          message: 'PDF desta NFSe já foi enviado no WhatsApp (sem duplicar).',
          data: {
            notaId,
            whatsappStatus: 'already_sent',
            whatsappDelivery: priorDelivery,
            execCommand: null,
            userId,
            actorContext,
            ...linkDebug,
          },
        };
      }

      const sync =
        payload?.sync !== false
        && String(payload?.sync || '').toLowerCase() !== 'false';
      const pdfResult = await fetchOpenclawNfsePdfBase64(userId, {
        id: notaId,
        sync,
      });
      const destinationPhone = resolveOpenclawWhatsappPhone(phoneDigits, matchedUserNumber);
      const whatsapp = await trySendWhatsappPdfOutbound({
        phone: destinationPhone,
        pdfBase64: pdfResult.base64,
        fileName: pdfResult.fileName,
        message: String(payload?.message || '').trim() || 'Segue a NFSe emitida.',
        extraPayload: { notaId: pdfResult.nota.id, userId },
      });
      const sent = whatsapp.whatsappStatus === 'sent';
      if (sent) {
        await markOpenclawNfseWhatsappSent(userId, pdfResult.nota.id);
      }
      return {
        ok: true,
        message: sent
          ? `PDF NFSe enviado no WhatsApp (nota ${pdfResult.nota.id}).`
          : `PDF obtido; envio WhatsApp: ${whatsapp.whatsappStatus}. Use mf-nfse-send.sh no OpenClaw.`,
        data: {
          nota: pdfResult.nota,
          fileName: pdfResult.fileName,
          whatsappStatus: whatsapp.whatsappStatus,
          whatsappError: whatsapp.whatsappError ?? null,
          hint: whatsapp.hint ?? null,
          execCommand: sent
            ? null
            : buildNfseSendExecCommand(destinationPhone, pdfResult.nota.id),
          actorContext,
          ...linkDebug,
        },
      };
    } catch (err) {
      rethrowNfseErrorForBot(err);
    }
  }

  if (action === 'refresh_das_pdf') {
    const { display, periodoDigits } = resolveDasCompetencia();
    try {
      await deleteDasBase64({ userId: dasUserId, periodoApuracao: periodoDigits });
    } catch {
      /* linha pode não existir */
    }
    const guide = await meiGuideService.createGuide(dasUserId, {
      cnpj: payload?.cnpj,
      periodoApuracao: periodoDigits,
      contribuinte: payload?.contribuinte,
    });
    if (!guide?.pdfBase64) {
      throw notFound(`SERPRO não devolveu PDF para ${display}.`);
    }
    await upsertDasBase64({
      userId: dasUserId,
      periodoApuracao: periodoDigits,
      pdfBase64: guide.pdfBase64,
    });
    const owner = dasSubject ? buildDasOwnerLabel(dasSubject.account) : '';
    return {
      ok: true,
      message: `DAS ${display} regenerado na Receita e guardado (${owner}). Agora use mf-das-send.sh.`,
      data: {
        mes: display,
        refreshed: true,
        dasAccount: dasSubject?.account ?? null,
        execCommand: destinationPhone
          ? `/home/node/.openclaw/workspace/mf-das-send.sh ${destinationPhone} ${display}`
          : null,
        ...(dasSubject?.dataLinkDebug ?? linkDebug),
      },
    };
  }

  throw badRequest(
    `Ação desconhecida: "${action}". Use: ping, resolve_user, list_roles, get_permissions, check_permission, list_access_requests, approve_access_request, reject_access_request, list_categories, list_transactions, list_calendar_events, create_calendar_event, create_transaction, delete_transaction, get_nfse_setup_status, list_nfse_clientes, preview_nfse, emit_nfse, list_nfse_notas, consult_nfse, get_nfse_pdf, send_nfse_whatsapp, get_das_payment_status, get_das_current, send_das_whatsapp, refresh_das_pdf.`,
  );
};
