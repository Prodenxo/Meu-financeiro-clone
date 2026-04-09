import dotenv from 'dotenv';

dotenv.config();

const required = (key) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Variável de ambiente ausente: ${key}`);
  }
  return value;
};

const requiredInProduction = (key, fallback = '') => {
  const value = process.env[key];
  if (process.env.NODE_ENV === 'production' && !value) {
    throw new Error(`Variável de ambiente obrigatória em produção: ${key}`);
  }
  return value || fallback;
};

const DEFAULT_DEV_CORS_ORIGINS = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'];
const DEFAULT_PROD_CORS_ORIGIN = process.env.FRONTEND_URL || 'https://meu-financeiro-frontend.vercel.app';
const DEFAULT_CORS_ORIGINS = process.env.NODE_ENV === 'development'
  ? DEFAULT_DEV_CORS_ORIGINS
  : [DEFAULT_PROD_CORS_ORIGIN, ...DEFAULT_DEV_CORS_ORIGINS];

/** Origens típicas do Expo Web para o app mobile em desenvolvimento no navegador. */
const EXPO_WEB_ORIGINS = ['http://localhost:8081', 'http://localhost:19006'];

const normalizeOrigin = (s) => (s || '').trim().replace(/\/$/, '');
const baseOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(normalizeOrigin)
  : DEFAULT_CORS_ORIGINS;
const mergedCorsOrigin = [...new Set([...baseOrigins, ...EXPO_WEB_ORIGINS])].filter(Boolean).join(',');

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || '3333',
  CORS_ORIGIN: mergedCorsOrigin,
  SUPABASE_URL: required('SUPABASE_URL'),
  SUPABASE_ANON_KEY: required('SUPABASE_ANON_KEY'),
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  SUPABASE_DB_URL: process.env.SUPABASE_DB_URL || process.env.DATABASE_URL || '',
  DB_BOOTSTRAP_AUTO_SCHEMA: process.env.DB_BOOTSTRAP_AUTO_SCHEMA || '',
  DB_BOOTSTRAP_FAIL_FAST: process.env.DB_BOOTSTRAP_FAIL_FAST || '',
  DB_BOOTSTRAP_SSL: process.env.DB_BOOTSTRAP_SSL || '',
  FRONTEND_URL: process.env.FRONTEND_URL || 'https://meu-financeiro-frontend.vercel.app',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
  GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI || '',
  SERPRO_OAUTH_TOKEN_URL: process.env.SERPRO_OAUTH_TOKEN_URL || '',
  SERPRO_OAUTH_TOKEN_NO_MTLS: process.env.SERPRO_OAUTH_TOKEN_NO_MTLS || 'false',
  SERPRO_API_BASE_URL: process.env.SERPRO_API_BASE_URL || '',
  SERPRO_CONSUMER_KEY: process.env.SERPRO_CONSUMER_KEY || '',
  SERPRO_CONSUMER_SECRET: process.env.SERPRO_CONSUMER_SECRET || '',
  SERPRO_ROLE_TYPE: process.env.SERPRO_ROLE_TYPE || 'TERCEIROS',
  SERPRO_CERT_PFX_PATH: process.env.SERPRO_CERT_PFX_PATH || '',
  SERPRO_CERT_PFX_PASS: process.env.SERPRO_CERT_PFX_PASS || '',
  SERPRO_CERT_PFX_BASE64: process.env.SERPRO_CERT_PFX_BASE64 || '',
  SERPRO_AUTENTICA_PROCURADOR_URL: process.env.SERPRO_AUTENTICA_PROCURADOR_URL || '',
  SERPRO_AUTENTICA_PROCURADOR_PATH: process.env.SERPRO_AUTENTICA_PROCURADOR_PATH || '',
  SERPRO_AUTENTICA_PROCURADOR_SIGN_URL: process.env.SERPRO_AUTENTICA_PROCURADOR_SIGN_URL || '',
  SERPRO_AUTENTICA_PROCURADOR_USE_MTLS: process.env.SERPRO_AUTENTICA_PROCURADOR_USE_MTLS || 'false',
  SERPRO_AUTENTICA_PROCURADOR_ROLE_TYPE: process.env.SERPRO_AUTENTICA_PROCURADOR_ROLE_TYPE || '',
  SERPRO_AUTENTICA_PROCURADOR_BODY_KEY: process.env.SERPRO_AUTENTICA_PROCURADOR_BODY_KEY || 'termoAutorizacao',
  SERPRO_AUTENTICA_PROCURADOR_XML_TEMPLATE: process.env.SERPRO_AUTENTICA_PROCURADOR_XML_TEMPLATE || '',
  SERPRO_CONTRATANTE_NUMERO: process.env.SERPRO_CONTRATANTE_NUMERO || '',
  SERPRO_CONTRATANTE_TIPO: process.env.SERPRO_CONTRATANTE_TIPO || '2',
  SERPRO_DESTINATARIO_NUMERO: process.env.SERPRO_DESTINATARIO_NUMERO || '',
  SERPRO_DESTINATARIO_NOME: process.env.SERPRO_DESTINATARIO_NOME || '',
  SERPRO_DESTINATARIO_TIPO: process.env.SERPRO_DESTINATARIO_TIPO || 'PJ',
  SERPRO_ASSINADO_POR_NOME: process.env.SERPRO_ASSINADO_POR_NOME || '',
  SERPRO_AUTOR_NUMERO: process.env.SERPRO_AUTOR_NUMERO || '',
  SERPRO_AUTOR_TIPO: process.env.SERPRO_AUTOR_TIPO || '',
  SERPRO_AUTORIZACAO_VIGENCIA: process.env.SERPRO_AUTORIZACAO_VIGENCIA || '',
  SERPRO_AUTORIZACAO_VIGENCIA_DIAS: process.env.SERPRO_AUTORIZACAO_VIGENCIA_DIAS || '180',
  MEI_API_BASE_URL: process.env.MEI_API_BASE_URL || '',
  MEI_API_TOKEN: process.env.MEI_API_TOKEN || '',
  MEI_API_CREATE_PATH: process.env.MEI_API_CREATE_PATH || '/Consultar',
  MEI_API_DOWNLOAD_PATH: process.env.MEI_API_DOWNLOAD_PATH || '/mei-guide/{id}/download',
  MEI_API_PERIODS_PATH: process.env.MEI_API_PERIODS_PATH || '',
  MEI_API_TIMEOUT_MS: process.env.MEI_API_TIMEOUT_MS || '15000',
  MEI_CERT_ENCRYPTION_KEY: process.env.MEI_CERT_ENCRYPTION_KEY || '',
  PLUGNOTAS_API_BASE_URL: process.env.PLUGNOTAS_API_BASE_URL || '',
  /** Prefixo opcional antes do path (ex.: `/api`). Ver docs Plugnotas e docs/operacao-mei-nfse.md. */
  PLUGNOTAS_API_PATH_PREFIX: process.env.PLUGNOTAS_API_PATH_PREFIX || '',
  PLUGNOTAS_API_KEY: process.env.PLUGNOTAS_API_KEY || '',
  /** `true`: logs extras de diagnóstico Plugnotas (ex.: payload redigido em 400 de cadastro empresa). Ver `docs/operacao-mei-nfse.md`. */
  PLUGNOTAS_DEBUG: process.env.PLUGNOTAS_DEBUG || '',
  /**
   * Diagnóstico da cadeia GET após POST /certificado 409 (`resolverCertificadoIdAposConflito409`): off | error | warn | info | debug.
   * Padrão `warn`. Use `off` se o volume de linhas `[plugnotas] certificado 409 resolve` incomodar.
   */
  PLUGNOTAS_CERT_409_RESOLVE_LOG_LEVEL: process.env.PLUGNOTAS_CERT_409_RESOLVE_LOG_LEVEL || 'warn',
  PLUGNOTAS_TIMEOUT_MS: process.env.PLUGNOTAS_TIMEOUT_MS || '15000',
  /**
   * Trilho B (P0): `true` — BFF preenche `nfse.config.prefeitura.codigoIbge` a partir de `endereco.codigoCidade`
   * (7 dígitos) quando `nfse` está activo. **Desligado por defeito** (NFR-P0-REG-01). Ver ADR apenas-NFS-e e `nfsePrefeituraPayload.js`.
   */
  PLUGNOTAS_NFSE_PREFEITURA_DERIVE_IBGE: process.env.PLUGNOTAS_NFSE_PREFEITURA_DERIVE_IBGE || 'false',
  /**
   * DP-PLOGIN-01: `true` — BFF aceita e valida `nfse.config.prefeitura.login` / `senha` no POST/PATCH empresa.
   * **Desligado por defeito** até decisão PO / rollout. O frontend deve usar o mesmo critério via `VITE_*`.
   */
  PLUGNOTAS_NFSE_PREFEITURA_CREDENCIAIS_ENABLED:
    process.env.PLUGNOTAS_NFSE_PREFEITURA_CREDENCIAIS_ENABLED || 'false',
  /**
   * DP-PLOGIN-02: `true` — BFF pode bloquear POST/PATCH empresa antes do Plugnotas quando `nfse.config.prefeitura`
   * ficar só com `codigoIbge` e o IBGE estiver em `PLUGNOTAS_NFSE_PREFEITURA_IBGE_ONLY_BLOCK_CODES`.
   * **Desligado por defeito.** Lista vazia ⇒ sem bloqueios (evita falsos positivos globais).
   */
  PLUGNOTAS_NFSE_PREFEITURA_IBGE_ONLY_BLOCK_ENABLED:
    process.env.PLUGNOTAS_NFSE_PREFEITURA_IBGE_ONLY_BLOCK_ENABLED || 'false',
  /** Códigos IBGE (7 dígitos), separados por vírgula — usado só com a flag acima `true`. */
  PLUGNOTAS_NFSE_PREFEITURA_IBGE_ONLY_BLOCK_CODES:
    process.env.PLUGNOTAS_NFSE_PREFEITURA_IBGE_ONLY_BLOCK_CODES || '',
  /** Nível de log para diagnóstico HTTP 400 em emissão (requestJson): `error` (padrão) ou `warn`. */
  PLUGNOTAS_EMIT_400_LOG_LEVEL: process.env.PLUGNOTAS_EMIT_400_LOG_LEVEL || 'error',
  PLUGNOTAS_WEBHOOK_TOKEN: requiredInProduction('PLUGNOTAS_WEBHOOK_TOKEN'),
  PLUGNOTAS_WEBHOOK_REQUIRE_TOKEN: process.env.PLUGNOTAS_WEBHOOK_REQUIRE_TOKEN
    || (process.env.NODE_ENV === 'development' ? 'false' : 'true'),
  PLUGNOTAS_WEBHOOK_ALLOW_QUERY_TOKEN: process.env.PLUGNOTAS_WEBHOOK_ALLOW_QUERY_TOKEN || 'false',
  PLUGNOTAS_NFSE_CANCEL_PATH: process.env.PLUGNOTAS_NFSE_CANCEL_PATH || '/nfse/:id/cancelar',
  PLUGNOTAS_NFE_CANCEL_PATH: process.env.PLUGNOTAS_NFE_CANCEL_PATH || '/nfe/:id/cancelamento',
  PLUGNOTAS_NFCE_CANCEL_PATH: process.env.PLUGNOTAS_NFCE_CANCEL_PATH || '/nfce/:id/cancelamento',
  N8N_WHATSAPP_WEBHOOK_URL: process.env.N8N_WHATSAPP_WEBHOOK_URL || '',
  N8N_WHATSAPP_WEBHOOK_SECRET: process.env.N8N_WHATSAPP_WEBHOOK_SECRET || '',
  /**
   * URL pública do frontend usada em links de convite (`/register?convite=`).
   * Se vazio, usa `FRONTEND_URL` ou header `Origin` da requisição (fallback dev `http://localhost:3000`).
   */
  INVITE_APP_BASE_URL: (process.env.INVITE_APP_BASE_URL || '').trim(),
  /**
   * Limite por IP por minuto para `GET|POST /invites/validate` (NFR-02 US-INV-02).
   * Padrão 120 em desenvolvimento e 60 caso contrário.
   */
  INVITE_VALIDATE_MAX_PER_MINUTE: process.env.INVITE_VALIDATE_MAX_PER_MINUTE
    || (process.env.NODE_ENV === 'development' ? '120' : '60')
};
