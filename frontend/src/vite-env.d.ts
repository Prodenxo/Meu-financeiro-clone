/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** `true` para encaminhar `error_shown` a `gtag` (se existir). */
  readonly VITE_ENABLE_USER_ERROR_ANALYTICS?: string;
  /** DP-PLOGIN-01 — UI credenciais portal prefeitura (alinhar ao backend). */
  readonly VITE_PLUGNOTAS_NFSE_PREFEITURA_CREDENCIAIS_ENABLED?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
