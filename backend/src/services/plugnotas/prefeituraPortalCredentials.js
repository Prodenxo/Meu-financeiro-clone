/**
 * FR-NATEX P0 — o fluxo MEI nacional-first não aceita `nfse.config.prefeitura.login` / `.senha`.
 * Se essas chaves chegarem ao BFF, o bloqueio é explícito e anterior a qualquer chamada canónica ao PlugNotas.
 */

import { badRequest } from '../../utils/errors.js';

export const PREFEITURA_LOGIN_REQUIRED_BLOCKED_CODE = 'prefeitura_login_required_blocked';
export const PREFEITURA_LOGIN_REQUIRED_BLOCKED_MESSAGE =
  'Este fluxo usa NFS-e Nacional como padrão e não aceita credenciais do portal da prefeitura. '
  + 'Quando o emissor exigir login municipal, o caso deve ser tratado fora deste percurso.';

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

export const isPrefeituraLoginRequiredUpstreamMessage = (message) => {
  const text = String(message || '').toLowerCase();
  if (!text) return false;
  const mentionsField = (
    text.includes('fields.nfse.config.prefeitura.login')
    || text.includes('fields.nfse.config.prefeitura.senha')
    || text.includes('nfse.config.prefeitura.login')
    || text.includes('nfse.config.prefeitura.senha')
  );
  const mentionsRequired = (
    text.includes('obrigat')
    || text.includes('required')
    || text.includes('preenchimento obrigatório')
  );
  return mentionsField && mentionsRequired;
};

/**
 * Bloqueia explicitamente qualquer tentativa de enviar `login` / `senha` de prefeitura neste fluxo.
 *
 * @param {Record<string, unknown>} payload — mutado in-place
 */
export function applyPrefeituraPortalCredentialsPolicy(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return;

  const nfse = payload.nfse;
  if (!nfse || typeof nfse !== 'object' || Array.isArray(nfse)) return;

  const config = nfse.config;
  if (!config || typeof config !== 'object' || Array.isArray(config)) return;

  const prefeitura = config.prefeitura;
  if (prefeitura === undefined || prefeitura === null) return;

  if (typeof prefeitura !== 'object' || Array.isArray(prefeitura)) {
    return;
  }

  const hasLoginKey = hasOwn(prefeitura, 'login');
  const hasSenhaKey = hasOwn(prefeitura, 'senha');
  if (!hasLoginKey && !hasSenhaKey) return;

  throw badRequest(PREFEITURA_LOGIN_REQUIRED_BLOCKED_MESSAGE, {
    plugnotasCode: PREFEITURA_LOGIN_REQUIRED_BLOCKED_CODE
  });
}
