import { createSupabaseClient } from '../config/supabase.js';
import { unauthorized, badRequest } from '../utils/errors.js';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const requireAuth = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization || '';

    if (!authHeader.startsWith('Bearer ')) {
      return next(unauthorized('Token ausente'));
    }

    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    // 🔑 1. Tenta validar como API_SECRET (n8n / automação / OpenClaw)
    const apiSecret = (process.env.API_SECRET || '').trim();
    if (apiSecret && token === apiSecret) {
      const raw =
        (req.headers['x-meufinanceiro-user-id'] ||
          req.query?.userId ||
          '')
          .toString()
          .trim();
      if (!raw || !UUID_RE.test(raw)) {
        return next(
          badRequest(
            'Com Bearer API_SECRET envie o UUID do utilizador no header X-MeuFinanceiro-User-Id (ou query userId).',
          ),
        );
      }
      req.authType = 'api_key';
      req.user = { id: raw };
      req.accessToken = null;
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