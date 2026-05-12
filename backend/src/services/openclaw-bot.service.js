import { createSupabaseClient } from '../config/supabase.js';
import { badRequest, notFound } from '../utils/errors.js';
import { normalizeWhatsappPhoneDigits } from '../utils/whatsapp-phone.js';
import * as transactionsService from './transactions.service.js';

const MAX_LIST = 40;

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

  if (action === 'resolve_user') {
    return {
      ok: true,
      message: 'Utilizador encontrado',
      data: { userId, ...linkDebug },
    };
  }

  if (action === 'list_transactions') {
    const rows = await transactionsService.listTransactions(userId);
    const sliced = (rows || []).slice(0, MAX_LIST);
    return {
      ok: true,
      message: `Últimas ${sliced.length} transações (máx. ${MAX_LIST}).`,
      data: { transactions: sliced, userId, ...linkDebug },
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
        ...linkDebug,
      },
    };
  }

  if (action === 'delete_transaction') {
    await transactionsService.deleteTransaction(userId, payload, { id: payload?.id });
    return { ok: true, message: 'Transação removida', data: { success: true } };
  }

  throw badRequest(
    `Ação desconhecida: "${action}". Use: ping, resolve_user, list_transactions, create_transaction, delete_transaction.`,
  );
};
