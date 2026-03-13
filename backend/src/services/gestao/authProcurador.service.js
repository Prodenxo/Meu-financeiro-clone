import { env } from '../../config/env.js';
import { badRequest } from '../../utils/errors.js';
import { requestWithMtls } from '../../utils/http-mtls.js';

const procuradorTokenCache = new Map();
const tokenCache = new Map();
const defaultFetchClient = (...args) => fetch(...args);
const defaultMtlsClient = (url, options) => requestWithMtls(url, options);
let fetchClient = defaultFetchClient;
let mtlsClient = defaultMtlsClient;
let noMtlsOverrideForTests = null;

const normalizeDoc = (value) => String(value || '').replace(/\D/g, '');

const getDocTypeNumber = (numero) => {
  const digits = normalizeDoc(numero);
  if (digits.length === 11) return 1;
  if (digits.length === 14) return 2;
  return null;
};

const getDocTypeLabel = (numero) => {
  const type = getDocTypeNumber(numero);
  if (type === 1) return 'PF';
  if (type === 2) return 'PJ';
  return null;
};

const isNoMtlsEnabled = () => {
  if (typeof noMtlsOverrideForTests === 'boolean') {
    return noMtlsOverrideForTests;
  }
  return String(env.SERPRO_OAUTH_TOKEN_NO_MTLS || '').toLowerCase() === 'true';
};
const isAutenticaProcuradorMtlsEnabled = () => String(env.SERPRO_AUTENTICA_PROCURADOR_USE_MTLS || '').toLowerCase() === 'true';
const OAUTH_CERT_ERROR_PATTERNS = [
  /certificado\s+digital\s+v[aá]lido/i,
  /identificar\s+um\s+certificado/i
];

const loadEnvPfx = () => {
  if (!env.SERPRO_CERT_PFX_BASE64) {
    return { pfx: null, passphrase: undefined };
  }
  const buffer = Buffer.from(env.SERPRO_CERT_PFX_BASE64, 'base64');
  return { pfx: buffer, passphrase: env.SERPRO_CERT_PFX_PASS || undefined };
};

const getSerproTlsConfig = () => {
  const { pfx, passphrase } = loadEnvPfx();
  if (!pfx) return null;
  return { pfx, passphrase };
};

const requestWithOptionalMtls = async (url, options, tlsConfig) => {
  if (tlsConfig?.pfx) {
    return mtlsClient(url, { ...options, ...tlsConfig });
  }
  return fetchClient(url, options);
};

const parseErrorMessage = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const payload = await response.json();
    return payload?.message || payload?.error || response.statusText;
  }
  const text = await response.text();
  return text || response.statusText;
};

const ensureTokenConfigured = () => {
  if (!env.SERPRO_OAUTH_TOKEN_URL) {
    throw badRequest('Endpoint Serpro OAuth não configurado');
  }
  if (!env.SERPRO_CONSUMER_KEY || !env.SERPRO_CONSUMER_SECRET) {
    throw badRequest('Credenciais Serpro não configuradas');
  }
};

export const getSerproTokens = async ({ forceRefresh = false } = {}) => {
  ensureTokenConfigured();
  const cacheKey = 'env';
  const now = Date.now();
  if (!forceRefresh) {
    const cached = tokenCache.get(cacheKey);
    if (cached?.accessToken && cached?.expiresAt > now + 60000) {
      return { accessToken: cached.accessToken, jwtToken: cached.jwtToken };
    }
  } else {
    tokenCache.delete(cacheKey);
  }

  const rawConsumerKey = String(env.SERPRO_CONSUMER_KEY || '');
  const rawConsumerSecret = String(env.SERPRO_CONSUMER_SECRET || '');
  const consumerKey = rawConsumerKey.trim();
  const consumerSecret = rawConsumerSecret.trim();

  if (!consumerKey || !consumerSecret) {
    throw badRequest('Credenciais Serpro não configuradas');
  }

  const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
  const body = new URLSearchParams({ grant_type: 'client_credentials' }).toString();
  const roleTypeHeaders = env.SERPRO_ROLE_TYPE ? { 'Role-Type': env.SERPRO_ROLE_TYPE } : {};
  const requestOptions = {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      ...roleTypeHeaders
    },
    body
  };
  let host = '';
  try {
    host = new URL(env.SERPRO_OAUTH_TOKEN_URL).host;
  } catch {
    host = '';
  }

  const attemptOauthToken = async (useMtls) => {
    const tlsConfig = useMtls ? getSerproTlsConfig() : null;
    const response = await requestWithOptionalMtls(env.SERPRO_OAUTH_TOKEN_URL, requestOptions, tlsConfig);
    if (response.ok) {
      return { ok: true, payload: await response.json(), useMtls };
    }
    const message = await parseErrorMessage(response);
    return {
      ok: false,
      useMtls,
      status: response.status,
      contentType: response.headers.get('content-type') || '',
      message
    };
  };

  const logOauthFailure = (result, stage) => {
    console.warn('[auth-procurador] falha OAuth Serpro', {
      status: result.status,
      contentType: result.contentType,
      host,
      roleTypeSet: Boolean(env.SERPRO_ROLE_TYPE),
      noMtls: isNoMtlsEnabled(),
      attemptedMtls: result.useMtls,
      stage,
      consumerKeyLength: consumerKey.length,
      consumerKeyTrimmed: rawConsumerKey.length !== consumerKey.length,
      consumerSecretLength: consumerSecret.length,
      consumerSecretTrimmed: rawConsumerSecret.length !== consumerSecret.length
    });
  };

  const primaryUseMtls = !isNoMtlsEnabled();
  let result = await attemptOauthToken(primaryUseMtls);

  if (!result.ok) {
    logOauthFailure(result, 'primary');
    const originalError = badRequest(result.message || 'Erro ao autenticar com a Serpro');
    const hasCertError = OAUTH_CERT_ERROR_PATTERNS.some((pattern) => pattern.test(String(result.message || '')));
    const hasPfxForFallback = Boolean(getSerproTlsConfig()?.pfx);
    const shouldRetryWithMtls = (
      isNoMtlsEnabled()
      && !result.useMtls
      && hasCertError
      && hasPfxForFallback
    );

    if (!shouldRetryWithMtls) {
      throw originalError;
    }

    console.warn('[auth-procurador] fallback OAuth no-mTLS -> mTLS por erro de certificado');
    const fallbackResult = await attemptOauthToken(true);
    if (!fallbackResult.ok) {
      logOauthFailure(fallbackResult, 'fallback_mtls');
      // Mantém o erro original do fluxo principal para preservar diagnóstico.
      throw originalError;
    }
    result = fallbackResult;
  }

  const payload = result.payload;
  const accessToken = payload?.access_token || null;
  const jwtToken = payload?.jwt_token || null;
  const expiresIn = Number(payload?.expires_in || 0);

  if (!accessToken) {
    throw badRequest('Token Serpro não retornado');
  }

  if (env.NODE_ENV !== 'production') {
    console.info('[auth-procurador] Token Serpro via mTLS', {
      hasAccessToken: Boolean(accessToken),
      hasJwtToken: Boolean(jwtToken),
      expiresIn
    });
  }

  tokenCache.set(cacheKey, {
    accessToken,
    jwtToken,
    expiresAt: now + (expiresIn * 1000)
  });

  return { accessToken, jwtToken };
};

export const __setHttpClientsForTests = ({ fetchFn, mtlsFn, noMtls } = {}) => {
  fetchClient = typeof fetchFn === 'function' ? fetchFn : defaultFetchClient;
  mtlsClient = typeof mtlsFn === 'function' ? mtlsFn : defaultMtlsClient;
  noMtlsOverrideForTests = typeof noMtls === 'boolean' ? noMtls : null;
};

export const __resetAuthProcuradorStateForTests = () => {
  tokenCache.clear();
  procuradorTokenCache.clear();
  fetchClient = defaultFetchClient;
  mtlsClient = defaultMtlsClient;
  noMtlsOverrideForTests = null;
};

const getAutenticaProcuradorUrl = () => {
  if (env.SERPRO_AUTENTICA_PROCURADOR_URL) return env.SERPRO_AUTENTICA_PROCURADOR_URL;
  if (env.SERPRO_AUTENTICA_PROCURADOR_PATH && env.SERPRO_API_BASE_URL) {
    return `${String(env.SERPRO_API_BASE_URL).replace(/\/$/, '')}${env.SERPRO_AUTENTICA_PROCURADOR_PATH}`;
  }
  return '';
};

const getTokenFromEtag = (etagValue) => {
  if (!etagValue) return null;
  const cleaned = String(etagValue).replace(/"/g, '');
  if (cleaned.startsWith('autenticar_procurador_token:')) {
    return cleaned.split(':')[1] || null;
  }
  return null;
};

const extractTokenFromPayload = (payload) => {
  const direct = payload?.autenticar_procurador_token
    || payload?.autenticarProcuradorToken
    || payload?.token
    || payload?.access_token
    || null;
  if (direct) return direct;

  const rawDados = payload?.dados || payload?.data || null;
  if (!rawDados) return null;
  if (typeof rawDados === 'object') {
    return rawDados?.autenticar_procurador_token
      || rawDados?.autenticarProcuradorToken
      || rawDados?.token
      || null;
  }
  try {
    const parsed = JSON.parse(String(rawDados));
    return parsed?.autenticar_procurador_token
      || parsed?.autenticarProcuradorToken
      || parsed?.token
      || null;
  } catch {
    return null;
  }
};

const ensureAssinaturaConfigurada = () => {
  if (!env.SERPRO_AUTENTICA_PROCURADOR_SIGN_URL) {
    throw badRequest('Endpoint da API intermediária não configurado');
  }
  if (!env.SERPRO_CERT_PFX_BASE64 || !env.SERPRO_CERT_PFX_PASS) {
    throw badRequest('Certificado Serpro não configurado');
  }
};

const gerarCertificadoAssinado = async (cnpjAssinante, nomeAssinante) => {
  ensureAssinaturaConfigurada();
  if (!cnpjAssinante) {
    throw badRequest('CNPJ do assinante é obrigatório');
  }
  if (!nomeAssinante) {
    throw badRequest('Nome do assinante não configurado');
  }

  const numeroLimpo = normalizeDoc(cnpjAssinante);
  const tipo = getDocTypeLabel(numeroLimpo);
  if (!tipo) {
    throw badRequest('Documento do assinante inválido');
  }

  const payload = {
    certificado_base64: env.SERPRO_CERT_PFX_BASE64,
    senha_certificado: env.SERPRO_CERT_PFX_PASS,
    assinante: {
      numero: numeroLimpo,
      nome: nomeAssinante,
      tipo,
      papel: 'autor pedido de dados'
    }
  };

  const response = await fetch(env.SERPRO_AUTENTICA_PROCURADOR_SIGN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const message = await parseErrorMessage(response);
    throw badRequest(message || 'Erro ao gerar XML assinado');
  }

  const data = await response.json();
  const xmlBase64 = data?.xml_base64 || data?.xml_assinado_base64 || data?.xml || null;
  if (!xmlBase64) {
    throw badRequest('Resposta da API intermediária não contém XML assinado');
  }

  return xmlBase64;
};

export const obterTokenProcurador = (cnpjAutorPedido) => {
  const key = `procurador_token_${normalizeDoc(cnpjAutorPedido)}`;
  return procuradorTokenCache.get(key) || null;
};

export const armazenarTokenNoCache = (chave, valor) => {
  if (!chave || !valor) return;
  procuradorTokenCache.set(chave, valor);
};

export const autenticarViaCertificado = async (
  contribuinteNumero,
  autorPedidoNumero,
  nomeAssinante,
  contratanteNumero = env.SERPRO_CONTRATANTE_NUMERO || autorPedidoNumero
) => {
  const url = getAutenticaProcuradorUrl();
  if (!url) {
    throw badRequest('Endpoint Autentica Procurador não configurado');
  }

  const contribuinteLimpo = normalizeDoc(contribuinteNumero);
  const autorLimpo = normalizeDoc(autorPedidoNumero);
  const contratanteLimpo = normalizeDoc(contratanteNumero);

  if (!contribuinteLimpo) {
    throw badRequest('Contribuinte inválido');
  }
  if (!autorLimpo) {
    throw badRequest('Autor do pedido inválido');
  }
  if (!contratanteLimpo) {
    throw badRequest('Contratante inválido');
  }

  const certificadoAssinado = await gerarCertificadoAssinado(autorLimpo, nomeAssinante);
  const { accessToken, jwtToken } = await getSerproTokens();

  const payload = {
    contratante: { numero: contratanteLimpo, tipo: getDocTypeNumber(contratanteLimpo) || 2 },
    autorPedidoDados: { numero: autorLimpo, tipo: getDocTypeNumber(autorLimpo) || 2 },
    contribuinte: { numero: contribuinteLimpo, tipo: getDocTypeNumber(contribuinteLimpo) || 2 },
    pedidoDados: {
      idSistema: 'AUTENTICAPROCURADOR',
      idServico: 'ENVIOXMLASSINADO81',
      versaoSistema: '1.0',
      dados: JSON.stringify({ xml: certificadoAssinado })
    }
  };

  if (env.NODE_ENV !== 'production' && isAutenticaProcuradorMtlsEnabled()) {
    console.info('[auth-procurador] mTLS ativo na autenticação');
  }

  const useMtls = isAutenticaProcuradorMtlsEnabled();
  const tlsConfig = useMtls ? getSerproTlsConfig() : null;
  const response = await requestWithOptionalMtls(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(jwtToken ? { jwt_token: jwtToken } : {}),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  }, tlsConfig);

  if (response.status === 304) {
    const etag = response.headers.get('etag');
    const token = getTokenFromEtag(etag) || obterTokenProcurador(autorLimpo);
    if (!token) {
      if (env.NODE_ENV !== 'production') {
        console.warn('[auth-procurador] 304 sem token', {
          url,
          etag,
          contratante: contratanteLimpo,
          autor: autorLimpo,
          contribuinte: contribuinteLimpo
        });
      }
      throw badRequest('Token do procurador não retornado');
    }
    armazenarTokenNoCache(`procurador_token_${autorLimpo}`, token);
    return token;
  }

  if (!response.ok) {
    const message = await parseErrorMessage(response);
    if (env.NODE_ENV !== 'production') {
      console.warn('[auth-procurador] erro ao autenticar', {
        status: response.status,
        url,
        message,
        contratante: contratanteLimpo,
        autor: autorLimpo,
        contribuinte: contribuinteLimpo
      });
    }
    throw badRequest(message || 'Erro ao autenticar procurador');
  }

  const data = await response.json();
  const tokenFromHeader = getTokenFromEtag(response.headers.get('etag'));
  const token = tokenFromHeader || extractTokenFromPayload(data);

  if (!token) {
    throw badRequest('Token do procurador não retornado');
  }

  armazenarTokenNoCache(`procurador_token_${autorLimpo}`, token);
  return token;
};
