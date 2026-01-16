import { createSupabaseClient } from '../config/supabase.js';
import { unauthorized } from '../utils/errors.js';

export const requireAuth = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');

    if (!token) {
      return next(unauthorized('Token ausente'));
    }

    const supabase = createSupabaseClient({ accessToken: token });
    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) {
      return next(unauthorized('Não autenticado'));
    }

    req.user = data.user;
    req.accessToken = token;
    return next();
  } catch (error) {
    return next(error);
  }
};
