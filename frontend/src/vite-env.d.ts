/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** `true` para encaminhar `error_shown` a `gtag` (se existir). */
  readonly VITE_ENABLE_USER_ERROR_ANALYTICS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
