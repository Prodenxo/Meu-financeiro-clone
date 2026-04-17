/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** `true` para encaminhar `error_shown` a `gtag` (se existir). */
  readonly VITE_ENABLE_USER_ERROR_ANALYTICS?: string;
  /** DP-PLOGIN-01 — UI credenciais portal prefeitura (alinhar ao backend). */
  readonly VITE_PLUGNOTAS_NFSE_PREFEITURA_CREDENCIAIS_ENABLED?: string;
  /** FR-GUIA-FISC-14 D2 — *wizard* «Configurar emissão» no callout de capacidade (default desligado). */
  readonly VITE_MEI_FISCAL_D2_MODALIDADES_ENABLED?: string;
  /** FR-GUIA-FISC-16 D3 — mostrar NF-e/NFC-e no seletor; só `true` liga (build-time). */
  readonly VITE_MEI_NFE_NFCE_EMIT_ENABLED?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
