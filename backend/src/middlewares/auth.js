import { createSupabaseClient } from '../config/supabase.js';
import { unauthorized, badRequest } from '../utils/errors.js';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const pathWithoutQuery = (originalUrl) => {
  const s = originalUrl || '';
  const q = s.indexOf('?');
  return (q === -1 ? s : s.slice(0, q)).replace(/\/+$/, '') || '';
};

/** Apenas listagem raiz: GET /api/categories (sem /budgets/…). */
const isGetCategoriesCollection = (req) => {
  if (req.method !== 'GET') return false;
  const fromOriginal = pathWithoutQuery(req.originalUrl || '');
  const merged = `${req.baseUrl || ''}${req.path || ''}`.replace(/\/+$/, '');
  return (
    fromOriginal === '/api/categories' ||
    merged === '/api/categories'
  );
};

const resolveAutomationUserId = (req) => {
  const raw =
    (req.headers['x-meufinanceiro-user-id'] ||
      req.query?.userId ||
      '')
      .toString()
      .trim();
  if (!raw || !UUID_RE.test(raw)) return null;
  return raw;
};

const attachAutomationUser = (req, userId) => {
  req.authType = 'api_key';
  req.user = { id: userId };
  req.accessToken = null;
};

export const requireAuth = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization || '';

    if (!authHeader.startsWith('Bearer ')) {
      return next(unauthorized('Token ausente'));
    }

    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    // 🔑 1a. API_SECRET (automação) + utilizador alvo
    const apiSecret = (process.env.API_SECRET || '').trim();
    if (apiSecret && token === apiSecret) {
      const userId = resolveAutomationUserId(req);
      if (!userId) {
        return next(
          badRequest(
            'Com Bearer API_SECRET envie o UUID do utilizador no header X-MeuFinanceiro-User-Id (ou query userId).',
          ),
        );
      }
      attachAutomationUser(req, userId);
      return next();
    }

    // 🔑 1b. Segundo segredo opcional (ex.: OpenClaw / n8n sem mexer no API_SECRET principal)
    const apiSecretOp = (process.env.API_SECRET_OP || '').trim();
    if (apiSecretOp && token === apiSecretOp) {
      const userId = resolveAutomationUserId(req);
      if (!userId) {
        return next(
          badRequest(
            'Com Bearer API_SECRET_OP envie o UUID do utilizador no header X-MeuFinanceiro-User-Id (ou query userId).',
          ),
        );
      }
      attachAutomationUser(req, userId);
      return next();
    }

    // 🔑 2. Mesmo Bearer do OpenClaw só para GET /api/categories (robô + lista minimal/full)
    const clawSecret = (
      process.env.OPENCLAW_WEBHOOK_SECRET ||
      process.env.HERMES_WEBHOOK_SECRET ||
      ''
    ).trim();
    if (
      clawSecret &&
      token === clawSecret &&
      isGetCategoriesCollection(req)
    ) {
      const userId = resolveAutomationUserId(req);
      if (!userId) {
        return next(
          badRequest(
            'Com Bearer OPENCLAW_WEBHOOK_SECRET neste GET envie X-MeuFinanceiro-User-Id (ou query userId) com UUID do utilizador.',
          ),
        );
      }
      attachAutomationUser(req, userId);
      return next();
    }

    // 🔐 3. JWT do Supabase (utilizador real)
    const supabase = createSupabaseClient({ accessToken: token });
    const { data, error } = await supabase.auth.getUser();

    if (!error && data?.user) {
      req.user = data.user;
      req.accessToken = token;
      req.authType = 'user';
      return next();
    }

    // ❌ 4. Se não passou em nenhum
    return next(unauthorized('Não autenticado'));

  } catch (error) {
    return next(error);
  }
};