import { badRequest } from '../utils/errors.js';

/**
 * Vários registos com o mesmo `user_number` quebram `.maybeSingle()`.
 * @param {Array<{ user_id?: string | null }> | null | undefined} rows
 * @param {string} matchedNumber
 * @returns {string | null}
 */
export const pickUserIdFromN8nLinkRows = (rows, matchedNumber) => {
  const userIds = [
    ...new Set(
      (rows || [])
        .map((r) => (r?.user_id != null ? String(r.user_id).trim() : ''))
        .filter(Boolean),
    ),
  ];

  if (userIds.length === 0) return null;
  if (userIds.length === 1) return userIds[0];

  throw badRequest(
    `O telefone ${matchedNumber} está associado a ${userIds.length} contas no sistema. `
    + 'Peça ao suporte para corrigir o vínculo WhatsApp (tabela n8n_link) e tente de novo.',
    { code: 'PHONE_AMBIGUOUS', userIds, matchedNumber },
  );
};

/**
 * Impede que dois utilizadores partilhem o mesmo WhatsApp em `n8n_link`.
 * @param {import('@supabase/supabase-js').SupabaseClient} admin
 * @param {string} userId
 * @param {string} userNumber
 */
export const assertN8nPhoneNotLinkedToOtherUser = async (admin, userId, userNumber) => {
  const { data: rows, error } = await admin
    .from('n8n_link')
    .select('user_id')
    .eq('user_number', userNumber)
    .limit(20);

  if (error) throw badRequest(error.message);

  const otherIds = [
    ...new Set(
      (rows || [])
        .map((r) => (r?.user_id != null ? String(r.user_id).trim() : ''))
        .filter((id) => id && id !== userId),
    ),
  ];

  if (otherIds.length > 0) {
    throw badRequest(
      'Este número de WhatsApp já está ligado a outra conta Meu Financeiro.',
      { code: 'PHONE_ALREADY_LINKED', otherUserIds: otherIds },
    );
  }
};
