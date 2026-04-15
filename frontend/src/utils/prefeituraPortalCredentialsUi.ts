import { normalizeIbgeMunicipioCodigo } from './ibgeMunicipioCodigo';
import {
  PLUGNOTAS_NFSE_CONFIG_CONSULTA_NACIONAL_KEY,
  PLUGNOTAS_NFSE_CONFIG_NACIONAL_KEY
} from './nfEmissionCompany';

/**
 * Alinhado a `PLUGNOTAS_NFSE_PREFEITURA_CREDENCIAIS_ENABLED` no backend (DP-PLOGIN-01).
 */
export const isPrefeituraPortalCredentialsUiEnabled = (): boolean =>
  import.meta.env.VITE_PLUGNOTAS_NFSE_PREFEITURA_CREDENCIAIS_ENABLED === 'true';

/** Validação conjunta login+senha (UX §6.5) — mensagem única ou null. */
export function getPrefeituraPortalCredentialsValidationMessage(
  login: string,
  senha: string
): string | null {
  const l = String(login ?? '').trim();
  const s = String(senha ?? '').trim();
  if (!l && !s) return 'Informe o login e a senha do portal da prefeitura.';
  if (!l) return 'Informe o login do portal da prefeitura.';
  if (!s) return 'Informe a senha do portal da prefeitura.';
  return null;
}

/**
 * Segundo passo municipal (FR-ALNFB): ajusta `nfse.config` para modo municipal com credenciais.
 * Não altera `nfEmissionCompany.ts` — cola de integração até consolidação na story 1.3.
 */
export function mergePrefeituraPortalCredentialsIntoEmpresaPayload(
  base: Record<string, unknown>,
  input: { login: string; senha: string; codigoIbgeDigits: string }
): Record<string, unknown> {
  const login = String(input.login ?? '').trim();
  const senha = String(input.senha ?? '').trim();
  const codigoIbge = normalizeIbgeMunicipioCodigo(input.codigoIbgeDigits);
  const nfse = base.nfse;
  if (!nfse || typeof nfse !== 'object' || Array.isArray(nfse)) return base;
  const prev = nfse as Record<string, unknown>;
  const config: Record<string, unknown> = {
    producao: true,
    [PLUGNOTAS_NFSE_CONFIG_NACIONAL_KEY]: false,
    [PLUGNOTAS_NFSE_CONFIG_CONSULTA_NACIONAL_KEY]: false,
    prefeitura: {
      codigoIbge,
      login,
      senha
    }
  };
  return {
    ...base,
    nfse: {
      ...prev,
      ativo: true,
      tipoContrato: typeof prev.tipoContrato === 'number' ? prev.tipoContrato : 0,
      config
    }
  };
}
