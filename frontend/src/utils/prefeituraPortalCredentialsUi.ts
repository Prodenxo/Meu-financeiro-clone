/**
 * Alinhado a `PLUGNOTAS_NFSE_PREFEITURA_CREDENCIAIS_ENABLED` no backend (DP-PLOGIN-01).
 */
export const isPrefeituraPortalCredentialsUiEnabled = (): boolean =>
  import.meta.env.VITE_PLUGNOTAS_NFSE_PREFEITURA_CREDENCIAIS_ENABLED === 'true';
