import { badRequest } from '../utils/errors.js';
import { expandBrazilMobilePhoneVariants } from '../utils/whatsapp-phone.js';

/**
 * Tenta bater com o que está em `n8n_link.user_number` (pode estar com ou sem 55).
 * @param {string} digits
 * @returns {string[]}
 */
export const buildPhoneLookupCandidates = (digits) => {
  const out = new Set();
  for (const v of expandBrazilMobilePhoneVariants(digits)) {
    out.add(v);
    if (v.startsWith('55') && v.length > 11) {
      out.add(v.slice(2));
    }
    if (!v.startsWith('55') && v.length >= 10 && v.length <= 11) {
      out.add(`55${v}`);
    }
  }
  return [...out];
};

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

/**
 * Atribui o WhatsApp à conta actual e remove o mesmo número de outras contas.
 * Usado quando o utilizador guarda o telefone no perfil (site/app).
 * @param {import('@supabase/supabase-js').SupabaseClient} admin
 * @param {string} userId
 * @param {string} userNumber — formato canónico (ex.: 5521996185328)
 */
export const assignN8nPhoneToUser = async (admin, userId, userNumber) => {
  const lookupCandidates = buildPhoneLookupCandidates(userNumber);

  for (const num of lookupCandidates) {
    const { error: deleteError } = await admin
      .from('n8n_link')
      .delete()
      .eq('user_number', num)
      .neq('user_id', userId);

    if (deleteError) throw badRequest(deleteError.message);
  }

  const { error } = await admin
    .from('n8n_link')
    .upsert(
      { user_id: userId, user_number: userNumber },
      { onConflict: 'user_id' },
    );

  if (error) throw badRequest(error.message);
};
