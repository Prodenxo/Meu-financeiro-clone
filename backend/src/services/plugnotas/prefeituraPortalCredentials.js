/**
 * DP-PLOGIN-01 — credenciais do portal municipal em `nfse.config.prefeitura` (login/senha).
 * Activado só com `PLUGNOTAS_NFSE_PREFEITURA_CREDENCIAIS_ENABLED=true` (padrão: desligado até decisão PO / rollout).
 *
 * @see docs/stories/story-fr-plogin-backlog-dp01-credenciais-portal-prefeitura.md
 * @see docs/adr/ADR-plugnotas-empresa-payload-apenas-nfse.md
 */

import { badRequest } from '../../utils/errors.js';

export const PREFEITURA_PORTAL_LOGIN_MAX_LEN = 128;
export const PREFEITURA_PORTAL_SENHA_MAX_LEN = 256;

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

export const isPrefeituraPortalCredentialsEnabled = () =>
  process.env.PLUGNOTAS_NFSE_PREFEITURA_CREDENCIAIS_ENABLED === 'true';

/**
 * Valida / normaliza `nfse.config.prefeitura.login` e `.senha`; preserva `codigoIbge` e outros campos não sensíveis.
 * Com flag desligada, rejeita qualquer tentativa de envio de credenciais (400 claro).
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
  const loginStr = hasLoginKey && prefeitura.login != null ? String(prefeitura.login).trim() : '';
  const senhaStr = hasSenhaKey && prefeitura.senha != null ? String(prefeitura.senha).trim() : '';

  const sentCredentialKeys = hasLoginKey || hasSenhaKey;

  if (!isPrefeituraPortalCredentialsEnabled()) {
    if (sentCredentialKeys || loginStr.length > 0 || senhaStr.length > 0) {
      throw badRequest(
        'Envio de credenciais do portal da prefeitura (login/senha em nfse.config.prefeitura) não está activo neste ambiente.',
        { plugnotasCode: 'prefeitura_portal_credenciais_disabled' }
      );
    }
    return;
  }

  if (!sentCredentialKeys) {
    return;
  }

  if ((loginStr && !senhaStr) || (!loginStr && senhaStr)) {
    throw badRequest(
      'Informe utilizador e senha do portal da prefeitura em conjunto (ou omita ambos os campos).',
      { plugnotasCode: 'prefeitura_portal_credenciais_incomplete' }
    );
  }

  if (!loginStr && !senhaStr) {
    if (hasLoginKey) delete prefeitura.login;
    if (hasSenhaKey) delete prefeitura.senha;
    return;
  }

  if (loginStr.length > PREFEITURA_PORTAL_LOGIN_MAX_LEN) {
    throw badRequest(
      `Utilizador do portal da prefeitura: máximo de ${PREFEITURA_PORTAL_LOGIN_MAX_LEN} caracteres.`,
      { plugnotasCode: 'prefeitura_portal_login_length' }
    );
  }
  if (senhaStr.length > PREFEITURA_PORTAL_SENHA_MAX_LEN) {
    throw badRequest(
      `Senha do portal da prefeitura: máximo de ${PREFEITURA_PORTAL_SENHA_MAX_LEN} caracteres.`,
      { plugnotasCode: 'prefeitura_portal_senha_length' }
    );
  }

  prefeitura.login = loginStr;
  prefeitura.senha = senhaStr;
  config.prefeitura = prefeitura;
  nfse.config = config;
  payload.nfse = nfse;
}
