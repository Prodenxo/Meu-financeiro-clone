import { createSupabaseClient } from '../config/supabase.js';
import { unauthorized } from '../utils/errors.js';

export const requireAuth = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization || '';

    if (!authHeader.startsWith('Bearer ')) {
      return next(unauthorized('Token ausente'));
    }

    const token = authHeader.replace(/^Bearer\s+/i, '');

    // 🔑 1. Tenta validar como API_SECRET (n8n / automação)
    if (token === process.env.API_SECRET) {
      req.authType = 'api_key';
      return next();
    }

    // 🔐 2. Tenta validar como JWT do Supabase (usuário real)
    const supabase = createSupabaseClient({ accessToken: token });
    const { data, error } = await supabase.auth.getUser();

    if (!error && data?.user) {
      req.user = data.user;
      req.accessToken = token;
      req.authType = 'user';
      return next();
    }

    // ❌ 3. Se não passou em nenhum
    return next(unauthorized('Não autenticado'));

  } catch (error) {
    return next(error);
  }
};