import { createSupabaseClient } from '../config/supabase.js';
import { badRequest } from '../utils/errors.js';

export const syncPhone = async (userId, phone) => {
  if (!phone) throw badRequest('Telefone é obrigatório');
  const cleanedPhone = phone.startsWith('+') ? phone.substring(1) : phone;

  const dbClient = createSupabaseClient({ useServiceRole: true });
  const { error } = await dbClient
    .from('n8n_link')
    .upsert(
      { user_id: userId, user_number: cleanedPhone },
      { onConflict: 'user_id' }
    );

  if (error) throw badRequest(error.message);
  return { success: true, phone: cleanedPhone };
};
