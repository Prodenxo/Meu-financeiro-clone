import { env } from '../config/env.js';
import { badRequest, forbidden, notFound, unauthorized } from '../utils/errors.js';
import { requestWithMtls } from '../utils/http-mtls.js';
import { createRequire } from 'module';
import { consultarServico } from './gestao/consultar.service.js';
import { emitirServico } from './gestao/emitir.service.js';
import {
  encryptPassphrase,
  decryptPassphrase,
  saveCertificate,
  loadCertificate,
  deleteCertificate,
  getCertificateDocument
} from './mei-certificate-store.js';

const require = createRequire(import.meta.url);
const { SignedXml } = require('xml-crypto');
const { DOMParser } = require('@xmldom/xmldom');
const forge = require('node-forge');

const normalizeBaseUrl = (value) => value.replace(/\/$/, '');

const ensureConfigured = () => {
  if (!env.SERPRO_API_BASE_URL || !env.SERPRO_OAUTH_TOKEN_URL) {
    throw badRequest('Integração MEI não configurada');
  }
  if (!env.SERPRO_CONSUMER_KEY || !env.SERPRO_CONSUMER_SECRET) {
    throw badRequest('Credenciais Serpro não configuradas');
  }
  if (!isNoMtlsEnabled() && !env.SERPRO_CERT_PFX_BASE64) {
    throw badRequest('Certificado Serpro não configurado');
  }
};

const ensureTokenConfigured = () => {
  if (!env.SERPRO_API_BASE_URL || !env.SERPRO_OAUTH_TOKEN_URL) {
    throw badRequest('Integração MEI não configurada');
  }
  if (!env.SERPRO_CONSUMER_KEY || !env.SERPRO_CONSUMER_SECRET) {
    throw badRequest('Credenciais Serpro não configuradas');
  }
};

const isNoMtlsEnabled = () => String(env.SERPRO_OAUTH_TOKEN_NO_MTLS || '').toLowerCase() === 'true';

const normalizeCnpj = (value) => String(value || '').replace(/\D/g, '');

const validateCnpj = (cnpj) => {
  if (!cnpj) return false;
  const digits = normalizeCnpj(cnpj);
  return digits.length === 14;
};

const validateCompetencia = (mes, ano) => {
  const month = Number(mes);
  const year = Number(ano);
  if (!Number.isInteger(month) || !Number.isInteger(year)) return false;
  if (month < 1 || month > 12) return false;
  if (year < 2000 || year > 2100) return false;
  return true;
};

const normalizeDoc = (value) => String(value || '').replace(/\D/g, '');

const getDocType = (value) => {
  const digits = normalizeDoc(value);
  if (digits.length === 11) return 1;
  if (digits.length === 14) return 2;
  return null;
};

const validateDoc = (value) => {
  const digits = normalizeDoc(value);
  return digits.length === 11 || digits.length === 14;
};

const getDocTypeLabel = (value) => {
  if (value === 1 || value === 2) return value === 1 ? 'PF' : 'PJ';
  const text = String(value || '').toUpperCase();
  if (text === '1') return 'PF';
  if (text === '2') return 'PJ';
  if (text === 'PF' || text === 'PJ') return text;
  const type = getDocType(value);
  if (type === 1) return 'PF';
  if (type === 2) return 'PJ';
  return null;
};

const normalizeDocTypeNumber = (tipo, docNumero) => {
  const numeric = Number(tipo);
  if (numeric === 1 || numeric === 2) return numeric;

  const text = String(tipo || '').toUpperCase();
  if (text === 'PF') return 1;
  if (text === 'PJ') return 2;

  return getDocType(docNumero);
};

const SAN_OID_CNPJ = '2.16.76.1.3.3';
const SAN_OID_CPF = '2.16.76.1.3.1';

const collectStringCandidates = (value, candidates) => {
  if (!value) return;
  if (typeof value === 'string') {
    candidates.push(value);
    return;
  }
  if (Buffer.isBuffer(value)) {
    candidates.push(value.toString('utf8'));
    candidates.push(value.toString('binary'));
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectStringCandidates(item, candidates));
    return;
  }
  if (typeof value === 'object') {
    if (typeof value.getBytes === 'function') {
      candidates.push(value.getBytes());
      return;
    }
    if (value.value !== undefined) {
      collectStringCandidates(value.value, candidates);
    }
    if (value.bytes !== undefined) {
      collectStringCandidates(value.bytes, candidates);
    }
  }
};

const extractDocFromCandidates = (candidates, length) => {
  const pattern = new RegExp(`\\d{${length}}`);
  for (const candidate of candidates) {
    const match = String(candidate).match(pattern);
    if (match) return match[0];
  }
  return null;
};

const toDerBytes = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (Buffer.isBuffer(value)) return value.toString('binary');
  if (value instanceof Uint8Array) return Buffer.from(value).toString('binary');
  if (typeof value.getBytes === 'function') return value.getBytes();
  if (typeof value.value === 'string') return value.value;
  return null;
};

const extractDocFromOtherNameValue = (value, length) => {
  const candidates = [];
  collectStringCandidates(value, candidates);
  const direct = extractDocFromCandidates(candidates, length);
  if (direct) return direct;

  const derBytes = toDerBytes(value);
  if (!derBytes) return null;
  try {
    const asn1 = forge.asn1.fromDer(derBytes);
    const fromDer = [];
    collectStringCandidates(asn1, fromDer);
    return extractDocFromCandidates(fromDer, length);
  } catch {
    return null;
  }
};

const extractDocFromSubjectAltName = (cert) => {
  const extension = (cert.extensions || [])
    .find((item) => item.name === 'subjectAltName' || item.id === '2.5.29.17');
  if (!extension?.altNames?.length) return null;

  const extractByOid = (oid, length) => {
    for (const altName of extension.altNames) {
      if (altName.type !== 0 || altName.oid !== oid) continue;
      const doc = extractDocFromOtherNameValue(altName.value, length);
      if (doc) return doc;
    }
    return null;
  };

  return extractByOid(SAN_OID_CNPJ, 14) || extractByOid(SAN_OID_CPF, 11);
};

const extractCertInfo = (cert) => {
  const subjectAttrs = cert.subject?.attributes || [];
  const subjectValues = subjectAttrs
    .map((attr) => String(attr.value || ''))
    .filter(Boolean);
  const cnpjMatches = subjectValues
    .flatMap((value) => value.match(/\d{14}/g) || []);
  const cnValue = subjectAttrs.find((attr) => attr.shortName === 'CN')?.value || '';
  const cnCnpj = String(cnValue).match(/:(\d{14})/)?.[1] || null;
  const cnpjFromSan = extractDocFromSubjectAltName(cert);
  const cnpjFromSubject = Array.from(new Set(cnpjMatches));
  const doc = cnpjFromSan || cnCnpj || cnpjFromSubject[0] || null;
  const docSource = cnpjFromSan ? 'san' : (cnCnpj ? 'cn' : (cnpjFromSubject[0] ? 'subject' : null));

  return {
    doc,
    docSource,
    cnpjFromSan,
    cnpjFromSubject,
    cnpjFromCN: cnCnpj,
    subject: subjectAttrs,
    serialNumber: cert.serialNumber
  };
};

const escapeXmlAttr = (value) => {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

const formatDateYYYYMMDD = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
};

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};
const normalizePeriodoApuracao = (periodo, mes, ano) => {
  if (periodo) {
    const value = String(periodo).replace(/\D/g, '');
    if (value.length === 6) return value;
  }

  if (validateCompetencia(mes, ano)) {
    return `${Number(ano)}${String(Number(mes)).padStart(2, '0')}`;
  }

  return null;
};

const tokenCache = new Map();
const procuradorTokenCache = new Map();
const certInfoCache = new Map();
const userCertCache = new Map();
const USER_CERT_TTL_MS = 2 * 60 * 60 * 1000;

const getUserCacheKey = (userId) => `user:${userId}`;

const getUserCert = (userId) => {
  if (!userId) return null;
  const cacheKey = getUserCacheKey(userId);
  const cached = userCertCache.get(cacheKey);
  if (!cached) return null;
  if (cached.expiresAt && cached.expiresAt <= Date.now()) {
    userCertCache.delete(cacheKey);
    return null;
  }
  return { ...cached, cacheKey };
};

const setUserCert = (userId, cert) => {
  if (!userId || !cert?.pfx) return null;
  const cacheKey = getUserCacheKey(userId);
  userCertCache.set(cacheKey, {
    ...cert,
    expiresAt: Date.now() + USER_CERT_TTL_MS
  });
  return cacheKey;
};

const getUserCertDocument = (userId) => {
  const cert = getUserCert(userId);
  const doc = cert?.certInfo?.doc || null;
  return doc ? normalizeDoc(doc) : null;
};

const clearUserCaches = (userId) => {
  if (!userId) {
    tokenCache.clear();
    procuradorTokenCache.clear();
    certInfoCache.clear();
    userCertCache.clear();
    return;
  }
  const cacheKey = getUserCacheKey(userId);
  tokenCache.delete(cacheKey);
  certInfoCache.delete(cacheKey);
  userCertCache.delete(cacheKey);
  procuradorTokenCache.clear();
};

const hasUserCertificate = (userId) => Boolean(getUserCert(userId));

/** Carrega certificado do banco para o cache quando não está em memória. */
const ensureUserCertLoaded = async (userId) => {
  if (getUserCert(userId)) return;
  if (!env.MEI_CERT_ENCRYPTION_KEY) return;
  let loaded;
  try {
    loaded = await loadCertificate(userId);
  } catch {
    return;
  }
  if (!loaded) return;
  const pfx = Buffer.from(loaded.pfxBase64, 'base64');
  let passphrase;
  try {
    passphrase = decryptPassphrase(loaded.passphraseEnc, loaded.passphraseIv);
  } catch {
    return;
  }
  let certInfo;
  try {
    certInfo = extractPfxKeyAndCert(pfx, passphrase).certInfo;
  } catch {
    return;
  }
  setUserCert(userId, { pfx, passphrase, certInfo });
};

const ensureClientCertificate = async (userId) => {
  await ensureUserCertLoaded(userId);
  if (!getUserCert(userId)) {
    throw badRequest('Certificado do cliente não configurado');
  }
};

const getOauthContext = () => {
  if (env.SERPRO_CERT_PFX_BASE64) {
    return { source: 'env', cacheKey: 'env', cert: null };
  }
  return { source: 'none', cacheKey: 'env', cert: null };
};

const getProcuradorContext = (userId) => {
  const userCert = getUserCert(userId);
  if (userCert) {
    return { source: 'user', cacheKey: userCert.cacheKey, cert: userCert };
  }
  return { source: 'none', cacheKey: getUserCacheKey(userId), cert: null };
};

const loadEnvPfx = () => {
  if (!env.SERPRO_CERT_PFX_BASE64) {
    return { pfx: null, passphrase: undefined };
  }
  const buffer = Buffer.from(env.SERPRO_CERT_PFX_BASE64, 'base64');
  return { pfx: buffer, passphrase: env.SERPRO_CERT_PFX_PASS || undefined };
};

const getOauthTlsConfig = () => {
  const context = getOauthContext();
  if (context.source === 'none') {
    return null;
  }

  const loaded = loadEnvPfx();
  if (!loaded.pfx) {
    return null;
  }

  return { pfx: loaded.pfx, passphrase: loaded.passphrase };
};

const requestWithOptionalMtls = async (url, options, tlsConfig) => {
  if (tlsConfig?.pfx) {
    return requestWithMtls(url, { ...options, ...tlsConfig });
  }
  return fetch(url, options);
};

const getSerproToken = async (_userId) => {
  if (String(env.SERPRO_OAUTH_TOKEN_NO_MTLS).toLowerCase() === 'true') {
    return await getSerproTokenWithoutCert();
  }
  ensureConfigured();
  const context = getOauthContext();

  const now = Date.now();
  const cached = tokenCache.get(context.cacheKey);
  if (cached?.accessToken && cached?.jwtToken && cached?.expiresAt > now + 60000) {
    return { accessToken: cached.accessToken, jwtToken: cached.jwtToken };
  }

  const credentials = Buffer.from(`${env.SERPRO_CONSUMER_KEY}:${env.SERPRO_CONSUMER_SECRET}`).toString('base64');
  const body = new URLSearchParams({ grant_type: 'client_credentials' }).toString();
  const tlsConfig = getOauthTlsConfig();

  const response = await requestWithOptionalMtls(env.SERPRO_OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Role-Type': env.SERPRO_ROLE_TYPE
    },
    body
  }, tlsConfig);

  if (!response.ok) {
    const message = await parseErrorMessage(response);
    console.warn('[mei-guide] Serpro auth error', {
      status: response.status,
      url: env.SERPRO_OAUTH_TOKEN_URL,
      message
    });
    throw badRequest(message || 'Erro ao autenticar com a Serpro');
  }

  const payload = await response.json();
  console.info('[mei-guide] Serpro token ok', {
    hasAccessToken: Boolean(payload?.access_token),
    hasJwtToken: Boolean(payload?.jwt_token),
    expiresIn: payload?.expires_in
  });
  const expiresIn = Number(payload?.expires_in || 0);
  const accessToken = payload?.access_token || null;
  const jwtToken = payload?.jwt_token || null;

  tokenCache.set(context.cacheKey, {
    accessToken,
    jwtToken,
    expiresAt: now + (expiresIn * 1000)
  });

  if (!accessToken) {
    throw badRequest('Token Serpro não retornado');
  }

  return { accessToken, jwtToken };
};

const getAutenticaProcuradorUrl = () => {
  if (env.SERPRO_AUTENTICA_PROCURADOR_URL) return env.SERPRO_AUTENTICA_PROCURADOR_URL;
  if (env.SERPRO_AUTENTICA_PROCURADOR_PATH) {
    return `${getBaseUrl()}${env.SERPRO_AUTENTICA_PROCURADOR_PATH}`;
  }
  return '';
};

const getAutenticaProcuradorCacheKey = (userId, authContext) => {
  const autor = authContext?.autorPedidoDados || {};
  const contribuinte = authContext?.contribuinte || {};
  const autorTipo = normalizeDocTypeNumber(autor.tipo, autor.numero);
  const contribTipo = normalizeDocTypeNumber(contribuinte.tipo, contribuinte.numero);
  return [
    `autor:${normalizeDoc(autor.numero || '')}:${autorTipo || ''}`,
    `contribuinte:${normalizeDoc(contribuinte.numero || '')}:${contribTipo || ''}`,
    `destinatario:${env.SERPRO_DESTINATARIO_NUMERO || ''}:${env.SERPRO_DESTINATARIO_TIPO || ''}`
  ].join('|');
};

const getNextMidnight = () => {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setDate(now.getDate() + 1);
  midnight.setHours(0, 0, 0, 0);
  return midnight.getTime();
};

const AUTORIZACAO_TERMO = 'Autorizo a empresa CONTRATANTE, identificada neste termo de autorização como DESTINATÁRIO, a executar as requisições dos serviços web disponibilizados pela API INTEGRA CONTADOR, onde terei o papel de AUTOR PEDIDO DE DADOS no corpo da mensagem enviada na requisição do serviço web. Esse termo de autorização está assinado digitalmente com o certificado digital do PROCURADOR ou OUTORGADO DO CONTRIBUINTE responsável, identificado como AUTOR DO PEDIDO DE DADOS.';
const AUTORIZACAO_AVISO = 'O acesso a estas informações foi autorizado pelo próprio PROCURADOR ou OUTORGADO DO CONTRIBUINTE, responsável pela informação, via assinatura digital. É dever do destinatário da autorização e consumidor deste acesso observar a adoção de base legal para o tratamento dos dados recebidos conforme artigos 7º ou 11º da LGPD (Lei n.º 13.709, de 14 de agosto de 2018), aos direitos do titular dos dados (art. 9º, 17 e 18, da LGPD) e aos princípios que norteiam todos os tratamentos de dados no Brasil (art. 6º, da LGPD).';
const AUTORIZACAO_FINALIDADE = 'A finalidade única e exclusiva desse TERMO DE AUTORIZAÇÃO, é garantir que o CONTRATANTE apresente a API INTEGRA CONTADOR esse consentimento do PROCURADOR ou OUTORGADO DO CONTRIBUINTE assinado digitalmente, para que possa realizar as requisições dos serviços web da API INTEGRA CONTADOR em nome do AUTOR PEDIDO DE DADOS (PROCURADOR ou OUTORGADO DO CONTRIBUINTE).';

const buildAutorizacaoXml = (authContext) => {
  const autor = authContext?.autorPedidoDados || {};
  const autorNumero = normalizeDoc(
    autor.numero || env.SERPRO_AUTOR_NUMERO || env.SERPRO_CONTRATANTE_NUMERO
  );
  const autorTipo = getDocTypeLabel(
    autor.tipo || env.SERPRO_AUTOR_TIPO || env.SERPRO_CONTRATANTE_TIPO || autorNumero
  );

  const destinatarioNumero = normalizeDoc(env.SERPRO_DESTINATARIO_NUMERO);
  const destinatarioNome = env.SERPRO_DESTINATARIO_NOME || '';
  const destinatarioTipo = env.SERPRO_DESTINATARIO_TIPO || 'PJ';
  const assinadoPorNome = env.SERPRO_ASSINADO_POR_NOME || '';

  if (!destinatarioNumero || !destinatarioNome) {
    throw badRequest('Destinatário não configurado para autenticação do procurador');
  }
  if (!assinadoPorNome) {
    throw badRequest('Nome do assinante não configurado para autenticação do procurador');
  }
  if (!autorNumero || !autorTipo) {
    throw badRequest('Autor do pedido não configurado');
  }
  const dataAssinatura = formatDateYYYYMMDD(new Date());
  const vigencia = env.SERPRO_AUTORIZACAO_VIGENCIA
    ? String(env.SERPRO_AUTORIZACAO_VIGENCIA)
    : formatDateYYYYMMDD(addDays(new Date(), Number(env.SERPRO_AUTORIZACAO_VIGENCIA_DIAS || 180)));

  if (env.SERPRO_AUTENTICA_PROCURADOR_XML_TEMPLATE) {
    return env.SERPRO_AUTENTICA_PROCURADOR_XML_TEMPLATE
      .replace(/\{\{DESTINATARIO_NUMERO\}\}/g, destinatarioNumero)
      .replace(/\{\{DESTINATARIO_NOME\}\}/g, escapeXmlAttr(destinatarioNome))
      .replace(/\{\{DESTINATARIO_TIPO\}\}/g, destinatarioTipo)
      .replace(/\{\{AUTOR_NUMERO\}\}/g, autorNumero)
      .replace(/\{\{AUTOR_TIPO\}\}/g, autorTipo)
      .replace(/\{\{ASSINADO_POR_NOME\}\}/g, escapeXmlAttr(assinadoPorNome))
      .replace(/\{\{DATA_ASSINATURA\}\}/g, dataAssinatura)
      .replace(/\{\{VIGENCIA\}\}/g, vigencia)
      .replace(/\{\{TERMO\}\}/g, escapeXmlAttr(AUTORIZACAO_TERMO))
      .replace(/\{\{AVISO\}\}/g, escapeXmlAttr(AUTORIZACAO_AVISO))
      .replace(/\{\{FINALIDADE\}\}/g, escapeXmlAttr(AUTORIZACAO_FINALIDADE));
  }

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<termoDeAutorizacao>',
    '  <dados>',
    '    <sistema id="API Integra Contador" />',
    `    <termo texto="${escapeXmlAttr(AUTORIZACAO_TERMO)}" />`,
    `    <avisoLegal texto="${escapeXmlAttr(AUTORIZACAO_AVISO)}" />`,
    `    <finalidade texto="${escapeXmlAttr(AUTORIZACAO_FINALIDADE)}" />`,
    `    <dataAssinatura data="${dataAssinatura}"/>`,
    `    <vigencia data="${vigencia}"/>`,
    `    <destinatario numero="${destinatarioNumero}" nome="${escapeXmlAttr(destinatarioNome)}" tipo="${destinatarioTipo}" papel="contratante"/>`,
    `    <assinadoPor numero="${autorNumero}" nome="${escapeXmlAttr(assinadoPorNome)}" tipo="${autorTipo}" papel="autor pedido de dados"/>`,
    '  </dados>',
    '</termoDeAutorizacao>'
  ].join('');
};

const extractPfxKeyAndCert = (pfxBuffer, passphrase) => {
  const pfxDer = forge.util.createBuffer(pfxBuffer.toString('binary'));
  const pfxAsn1 = forge.asn1.fromDer(pfxDer);
  const pfx = forge.pkcs12.pkcs12FromAsn1(pfxAsn1, passphrase || '');
  const keyBags = pfx.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
  const keyBagsPlain = pfx.getBags({ bagType: forge.pki.oids.keyBag });
  const certBags = pfx.getBags({ bagType: forge.pki.oids.certBag });
  const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0]
    || keyBagsPlain[forge.pki.oids.keyBag]?.[0];
  const certBag = certBags[forge.pki.oids.certBag]?.[0];
  if (!keyBag?.key || !certBag?.cert) {
    throw badRequest('Não foi possível extrair chave/certificado do PFX');
  }
  const certInfo = extractCertInfo(certBag.cert);
  if (env.NODE_ENV !== 'production') {
    console.info('[mei-guide] Cert subject/serial', {
      subject: certInfo.subject,
      serialNumber: certInfo.serialNumber,
      cnpjFromSan: certInfo.cnpjFromSan,
      cnpjFromSubject: certInfo.cnpjFromSubject,
      cnpjFromCN: certInfo.cnpjFromCN,
      docSource: certInfo.docSource
    });
  }
  return {
    privateKeyPem: forge.pki.privateKeyToPem(keyBag.key),
    certificatePem: forge.pki.certificateToPem(certBag.cert),
    certInfo
  };
};

const signAutorizacaoXml = (xml, pfxBuffer, passphrase) => {
  const { privateKeyPem, certificatePem } = extractPfxKeyAndCert(pfxBuffer, passphrase);
  const sig = new SignedXml();
  sig.signatureAlgorithm = 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256';
  sig.canonicalizationAlgorithm = 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315';
  sig.addReference({
    xpath: "/*",
    transforms: [
      'http://www.w3.org/2000/09/xmldsig#enveloped-signature',
      'http://www.w3.org/TR/2001/REC-xml-c14n-20010315'
    ],
    digestAlgorithm: 'http://www.w3.org/2001/04/xmlenc#sha256'
  });
  sig.privateKey = privateKeyPem;
  sig.keyInfoProvider = {
    getKeyInfo: () => `<X509Data><X509Certificate>${certificatePem.replace(/-----(BEGIN|END) CERTIFICATE-----|\\s+/g, '')}</X509Certificate></X509Data>`
  };
  sig.computeSignature(xml, { location: { reference: "/*", action: 'append' } });
  return sig.getSignedXml();
};

const getAutenticaProcuradorToken = async (userId, authContext) => {
  const url = getAutenticaProcuradorUrl();
  if (!url) {
    throw badRequest('Endpoint Autentica Procurador não configurado');
  }

  const context = getProcuradorContext(userId);
  if (context.source !== 'user' || !context.cert?.pfx) {
    throw badRequest('Certificado do cliente não configurado para o procurador');
  }
  const contrib = authContext?.contribuinte || {};
  const resolvedAuthContext = {
    ...(authContext || {}),
    autorPedidoDados: contrib
  };

  const cacheKey = getAutenticaProcuradorCacheKey(userId, resolvedAuthContext);
  const cached = procuradorTokenCache.get(cacheKey);
  const now = Date.now();
  if (cached?.token && cached?.expiresAt > now + 60000) {
    return cached.token;
  }

  const pfx = context.cert.pfx;
  const passphrase = context.cert.passphrase;

  if (!pfx) {
    throw badRequest('Certificado Serpro não configurado para o procurador');
  }

  const xml = buildAutorizacaoXml(resolvedAuthContext);
  const signedXml = signAutorizacaoXml(xml, pfx, passphrase);
  const encoded = Buffer.from(signedXml, 'utf-8').toString('base64');

  const autor = resolvedAuthContext?.autorPedidoDados || {};
  const autorNumero = normalizeDoc(autor.numero);
  const contribNumero = normalizeDoc(contrib.numero);

  if (!validateDoc(autorNumero)) {
    throw badRequest('Autor do pedido inválido');
  }
  if (!validateDoc(contribNumero)) {
    throw badRequest('Contribuinte inválido');
  }

  const contratanteNumero = normalizeDoc(env.SERPRO_CONTRATANTE_NUMERO || contribNumero);
  const contratanteTipo = normalizeDocTypeNumber(env.SERPRO_CONTRATANTE_TIPO, contratanteNumero);
  const autorTipo = normalizeDocTypeNumber(autor.tipo, autorNumero);
  const contribTipo = normalizeDocTypeNumber(contrib.tipo, contribNumero);
  if (!contratanteTipo) {
    throw badRequest('Tipo do contratante inválido');
  }
  if (!autorTipo) {
    throw badRequest('Tipo do autor do pedido inválido');
  }
  if (!contribTipo) {
    throw badRequest('Tipo do contribuinte inválido');
  }
  const requestBody = {
    contratante: {
      numero: contratanteNumero,
      tipo: contratanteTipo
    },
    autorPedidoDados: {
      numero: autorNumero,
      tipo: autorTipo
    },
    contribuinte: {
      numero: contribNumero,
      tipo: contribTipo
    },
    pedidoDados: {
      idSistema: 'AUTENTICAPROCURADOR',
      idServico: 'ENVIOXMLASSINADO81',
      versaoSistema: '1.0',
      dados: JSON.stringify({ xml: encoded })
    }
  };

  if (env.NODE_ENV !== 'production') {
    console.info('[mei-guide] AutenticaProcurador payload', {
      contratante: requestBody.contratante,
      autorPedidoDados: requestBody.autorPedidoDados,
      contribuinte: requestBody.contribuinte,
      pedidoDados: {
        idSistema: requestBody.pedidoDados.idSistema,
        idServico: requestBody.pedidoDados.idServico,
        versaoSistema: requestBody.pedidoDados.versaoSistema,
        xmlSize: encoded.length
      }
    });
  }

  const headers = await buildHeaders(userId, null);
  const tlsConfig = isNoMtlsEnabled() ? null : getOauthTlsConfig();
  const response = await requestWithOptionalMtls(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody)
  }, tlsConfig);

  if (!response.ok) {
    const message = await parseErrorMessage(response);
    if (env.NODE_ENV !== 'production') {
      console.warn('[mei-guide] AutenticaProcurador error', {
        status: response.status,
        url,
        contentType: response.headers.get('content-type') || '',
        message
      });
    }
    logSerproError('autentica-procurador', {
      status: response.status,
      url,
      message
    });
    throw badRequest(message || 'Erro ao autenticar procurador');
  }

  const payload = await response.json();
  const parsedDados = (() => {
    if (!payload?.dados) return null;
    if (Array.isArray(payload.dados)) return payload.dados[0] || null;
    if (typeof payload.dados === 'object') return payload.dados;
    try {
      return JSON.parse(String(payload.dados));
    } catch {
      return null;
    }
  })();
  const token = parsedDados?.autenticar_procurador_token
    || parsedDados?.autenticarProcuradorToken
    || payload?.autenticar_procurador_token
    || payload?.autenticarProcuradorToken
    || payload?.token
    || payload?.access_token
    || null;

  if (!token) {
    throw badRequest('Token do procurador não retornado');
  }

  procuradorTokenCache.set(cacheKey, {
    token,
    expiresAt: getNextMidnight()
  });

  return token;
};

const getSerproTokenWithoutCert = async () => {
  ensureTokenConfigured();

  const credentials = Buffer.from(`${env.SERPRO_CONSUMER_KEY}:${env.SERPRO_CONSUMER_SECRET}`).toString('base64');
  const body = new URLSearchParams({ grant_type: 'client_credentials' }).toString();

  const response = await fetch(env.SERPRO_OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Role-Type': env.SERPRO_ROLE_TYPE
    },
    body
  });

  if (!response.ok) {
    const message = await parseErrorMessage(response);
    throw badRequest(message || 'Erro ao autenticar com a Serpro');
  }

  const payload = await response.json();
  const accessToken = payload?.access_token || null;
  const jwtToken = payload?.jwt_token || null;

  if (!accessToken) {
    throw badRequest('Token Serpro não retornado');
  }

  return { accessToken, jwtToken };
};

const buildHeaders = async (userId, authContext) => {
  const useNoMtls = isNoMtlsEnabled();
  const { accessToken, jwtToken } = useNoMtls
    ? await getSerproTokenWithoutCert()
    : await getSerproToken(userId);
  const procuradorToken = authContext
    ? await getAutenticaProcuradorToken(userId, authContext)
    : null;
  if (env.NODE_ENV !== 'production') {
    console.info('[mei-guide] SERPRO_ROLE_TYPE', env.SERPRO_ROLE_TYPE);
  }
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
    ...(jwtToken ? { jwt_token: jwtToken } : {}),
    ...(procuradorToken ? { autenticar_procurador_token: procuradorToken } : {}),
    'Role-Type': env.SERPRO_ROLE_TYPE
  };
};

const withTimeout = (ms) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  return { controller, timeout };
};

const getBaseUrl = () => normalizeBaseUrl(env.SERPRO_API_BASE_URL || '');

const buildCreateUrl = () => `${getBaseUrl()}${env.MEI_API_CREATE_PATH}`;

const buildDownloadUrl = (id) => {
  const path = env.MEI_API_DOWNLOAD_PATH.replace('{id}', encodeURIComponent(id));
  return `${getBaseUrl()}${path}`;
};

const buildPeriodsUrl = (cnpj) => {
  if (!env.MEI_API_PERIODS_PATH) return null;
  const query = `cnpj=${encodeURIComponent(normalizeCnpj(cnpj))}`;
  return `${getBaseUrl()}${env.MEI_API_PERIODS_PATH}?${query}`;
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

const logSerproError = (context, { status, url, message }) => {
  if (env.NODE_ENV === 'production') return;
  console.warn('[mei-guide] Serpro error', {
    context,
    status,
    url,
    message
  });
};

const requestJson = async (url, body, userId, authContext) => {
  const timeoutMs = Number(env.MEI_API_TIMEOUT_MS || 15000);
  const { controller, timeout } = withTimeout(timeoutMs);

  try {
    const headers = await buildHeaders(userId, authContext);
    const tlsConfig = isNoMtlsEnabled() ? null : getOauthTlsConfig();
    const response = await requestWithOptionalMtls(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal
    }, tlsConfig);

    if (!response.ok) {
      const message = await parseErrorMessage(response);
      logSerproError('request-json', {
        status: response.status,
        url,
        message
      });
      if (response.status === 401) {
        throw unauthorized(message || 'Não autorizado pela Serpro');
      }
      if (response.status === 403) {
        throw forbidden(message || 'Acesso negado pela Serpro');
      }
      throw badRequest(message || 'Erro ao gerar guia MEI');
    }

    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
};

const requestGetJson = async (url, userId, authContext) => {
  const timeoutMs = Number(env.MEI_API_TIMEOUT_MS || 15000);
  const { controller, timeout } = withTimeout(timeoutMs);

  try {
    const headers = await buildHeaders(userId, authContext);
    const tlsConfig = isNoMtlsEnabled() ? null : getOauthTlsConfig();
    const response = await requestWithOptionalMtls(url, {
      method: 'GET',
      headers,
      signal: controller.signal
    }, tlsConfig);

    if (!response.ok) {
      const message = await parseErrorMessage(response);
      logSerproError('request-get-json', {
        status: response.status,
        url,
        message
      });
      if (response.status === 401) {
        throw unauthorized(message || 'Não autorizado pela Serpro');
      }
      if (response.status === 403) {
        throw forbidden(message || 'Acesso negado pela Serpro');
      }
      throw badRequest(message || 'Erro ao consultar períodos MEI');
    }

    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
};

const requestDownload = async (url, userId, authContext) => {
  const timeoutMs = Number(env.MEI_API_TIMEOUT_MS || 15000);
  const { controller, timeout } = withTimeout(timeoutMs);

  try {
    const headers = await buildHeaders(userId, authContext);
    const tlsConfig = isNoMtlsEnabled() ? null : getOauthTlsConfig();
    const response = await requestWithOptionalMtls(url, {
      method: 'GET',
      headers,
      signal: controller.signal
    }, tlsConfig);

    if (!response.ok) {
      const message = await parseErrorMessage(response);
      logSerproError('request-download', {
        status: response.status,
        url,
        message
      });
      if (response.status === 401) {
        throw unauthorized(message || 'Não autorizado pela Serpro');
      }
      if (response.status === 403) {
        throw forbidden(message || 'Acesso negado pela Serpro');
      }
      throw notFound(message || 'Guia MEI não encontrada');
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return await response.json();
    }

    const arrayBuffer = await response.arrayBuffer();
    return {
      buffer: Buffer.from(arrayBuffer),
      contentType: contentType || 'application/pdf',
      filename: `guia-mei-${Date.now()}.pdf`
    };
  } finally {
    clearTimeout(timeout);
  }
};

const ensureDownloadBuffer = async (payload, userId, authContext) => {
  if (payload?.buffer) {
    return payload;
  }

  if (payload?.pdfBase64) {
    return {
      buffer: Buffer.from(payload.pdfBase64, 'base64'),
      contentType: payload.contentType || 'application/pdf',
      filename: payload.filename || `guia-mei-${Date.now()}.pdf`
    };
  }

  if (payload?.downloadUrl) {
    return await requestDownload(payload.downloadUrl, userId, authContext);
  }

  throw notFound('Arquivo da guia MEI não disponível');
};

const parseSerproDados = (value) => {
  if (!value) return null;
  if (Array.isArray(value)) return value;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(String(value));
  } catch {
    return null;
  }
};

const normalizeStatus = (value) => {
  if (typeof value === 'boolean') {
    return value ? 'pago' : 'a_pagar';
  }
  const text = String(value || '').toLowerCase();
  if (text.includes('pago')) return 'pago';
  if (text.includes('paga')) return 'pago';
  if (text.includes('quitado')) return 'pago';
  return 'a_pagar';
};

const parseCompetencia = (value, fallbackMes, fallbackAno) => {
  if (fallbackMes && fallbackAno) {
    return `${Number(fallbackAno)}-${String(Number(fallbackMes)).padStart(2, '0')}`;
  }

  if (!value) return null;
  const text = String(value);

  const ymd = text.match(/^(\d{4})[-/](\d{1,2})$/);
  if (ymd) {
    return `${ymd[1]}-${String(ymd[2]).padStart(2, '0')}`;
  }

  const mdy = text.match(/^(\d{1,2})[/-](\d{4})$/);
  if (mdy) {
    return `${mdy[2]}-${String(mdy[1]).padStart(2, '0')}`;
  }

  return text;
};

const sortByCompetenciaDesc = (items) => {
  return items.slice().sort((a, b) => {
    const aKey = a.competencia || '';
    const bKey = b.competencia || '';
    const aDate = new Date(`${aKey}-01T00:00:00`);
    const bDate = new Date(`${bKey}-01T00:00:00`);
    if (Number.isNaN(aDate.getTime()) || Number.isNaN(bDate.getTime())) {
      return 0;
    }
    return bDate.getTime() - aDate.getTime();
  });
};

const resolveContribuinte = (userId, contrib, cnpj) => {
  const fromRequest = normalizeDoc(contrib?.numero || cnpj);
  const fromCert = getUserCertDocument(userId);
  const numero = fromRequest || fromCert;
  if (!numero) {
    throw badRequest('Documento do certificado não identificado');
  }
  if (!validateDoc(numero)) {
    throw badRequest('Contribuinte inválido');
  }
  const tipo = normalizeDocTypeNumber(contrib?.tipo, numero) || getDocType(numero);
  return { numero, tipo };
};

export const uploadCertificate = async (userId, payload) => {
  if (!userId) {
    throw badRequest('Usuário não identificado');
  }
  clearUserCaches(userId);
  const file = payload?.file;
  const password = String(payload?.password || '');
  if (!file?.buffer) {
    throw badRequest('Arquivo de certificado não informado');
  }
  if (!password) {
    throw badRequest('Senha do certificado é obrigatória');
  }
  let certInfo;
  try {
    const extracted = extractPfxKeyAndCert(file.buffer, password);
    certInfo = extracted?.certInfo || null;
  } catch (error) {
    throw badRequest('Certificado inválido ou senha incorreta');
  }

  if (env.MEI_CERT_ENCRYPTION_KEY) {
    try {
      const { passphraseEnc, passphraseIv } = encryptPassphrase(password);
      const certDocument = certInfo?.doc ? normalizeDoc(certInfo.doc) : null;
      await saveCertificate(userId, {
        pfxBase64: file.buffer.toString('base64'),
        passphraseEnc,
        passphraseIv,
        certDocument
      });
    } catch (err) {
      throw badRequest(err?.message || 'Falha ao salvar certificado');
    }
  }

  setUserCert(userId, {
    pfx: file.buffer,
    passphrase: password,
    certInfo
  });
  return getCertificateStatus(userId);
};

export const removeCertificate = async (userId) => {
  if (!userId) {
    throw badRequest('Usuário não identificado');
  }
  if (env.MEI_CERT_ENCRYPTION_KEY) {
    try {
      await deleteCertificate(userId);
    } catch {
      // ignora erro de banco ao remover
    }
  }
  clearUserCaches(userId);
  return getCertificateStatus(userId);
};

export const getCertificateStatus = async (userId) => {
  await ensureUserCertLoaded(userId);
  const hasCert = Boolean(getUserCert(userId));
  const docFromCache = getUserCertDocument(userId);
  const docFromDb = env.MEI_CERT_ENCRYPTION_KEY ? await getCertificateDocument(userId) : null;
  return {
    hasUserCertificate: hasCert,
    hasEnvCertificate: Boolean(env.SERPRO_CERT_PFX_BASE64),
    documento: docFromCache || docFromDb || null
  };
};

export const getSerproTokenForFrontend = async () => {
  const { accessToken, jwtToken } = await getSerproTokenWithoutCert();
  return {
    accessToken,
    jwtToken,
    roleType: env.SERPRO_ROLE_TYPE,
    apiBaseUrl: env.SERPRO_API_BASE_URL,
    createPath: env.MEI_API_CREATE_PATH,
    periodsPath: env.MEI_API_PERIODS_PATH
  };
};

/** Gera DAS MEI pelo CNPJ (fluxo contador/procurador), sem certificado do cliente. */
export const createGuideByCnpj = async (userId, payload) => {
  ensureConfigured();
  const { cnpj, periodoApuracao, mes, ano } = payload || {};
  const cnpjNumerico = normalizeDoc(cnpj);
  if (!cnpjNumerico || !validateDoc(cnpjNumerico)) {
    throw badRequest('CNPJ do MEI inválido');
  }
  const contratanteNumero = normalizeDoc(env.SERPRO_CONTRATANTE_NUMERO);
  if (!contratanteNumero) {
    throw badRequest('Contratante Serpro não configurado');
  }
  const period = normalizePeriodoApuracao(periodoApuracao, mes, ano);
  if (!period) {
    throw badRequest('Período de apuração inválido');
  }

  const response = await emitirServico({
    contratanteNumero,
    autorPedidoNumero: contratanteNumero,
    contribuinteNumero: cnpjNumerico,
    idSistema: 'PGMEI',
    idServico: 'GERARDASPDF21',
    dados: { periodoApuracao: period },
    versaoSistema: '1.0'
  });
  const dados = parseSerproDados(response?.dados);
  const das = Array.isArray(dados) ? dados[0] : dados;
  const pdfBase64 = das?.pdf;

  if (!pdfBase64) {
    throw notFound('PDF do DAS não retornado');
  }

  return {
    id: period,
    status: response?.status || 'gerado',
    pdfBase64,
    filename: `das-mei-${period}.pdf`,
    contentType: 'application/pdf'
  };
};

export const createGuide = async (userId, payload) => {
  ensureConfigured();
  await ensureClientCertificate(userId);
  const { cnpj, periodoApuracao, mes, ano, contribuinte } = payload || {};

  const contrib = resolveContribuinte(userId, contribuinte, cnpj);
  const autor = contrib;

  const autorNumero = normalizeDoc(autor?.numero);
  if (!validateDoc(autorNumero)) {
    throw badRequest('Autor do pedido inválido');
  }

  const period = normalizePeriodoApuracao(periodoApuracao, mes, ano);
  if (!period) {
    throw badRequest('Período de apuração inválido');
  }

  const cnpjNumerico = normalizeDoc(contrib.numero);
  const contratanteNumero = normalizeDoc(env.SERPRO_CONTRATANTE_NUMERO || cnpjNumerico);
  const response = await emitirServico({
    contratanteNumero,
    autorPedidoNumero: autorNumero,
    contribuinteNumero: cnpjNumerico,
    idSistema: 'PGMEI',
    idServico: 'GERARDASPDF21',
    dados: { periodoApuracao: period },
    versaoSistema: '1.0'
  });
  const dados = parseSerproDados(response?.dados);
  const das = Array.isArray(dados) ? dados[0] : dados;
  const pdfBase64 = das?.pdf;

  if (!pdfBase64) {
    throw notFound('PDF do DAS não retornado');
  }

  return {
    id: period,
    status: response?.status || 'gerado',
    pdfBase64,
    filename: `das-mei-${period}.pdf`,
    contentType: 'application/pdf'
  };
};

export const downloadGuide = async (payload) => {
  ensureConfigured();
  const { userId, cnpj, periodoApuracao, contribuinte } = payload || {};
  if (!periodoApuracao) throw badRequest('Período de apuração é obrigatório');

  const cnpjFromRequest = normalizeDoc(contribuinte?.numero || cnpj);
  const hasCert = userId ? hasUserCertificate(userId) : false;

  let guide;
  if (hasCert) {
    await ensureClientCertificate(userId);
    const contrib = resolveContribuinte(userId, contribuinte, cnpj);
    guide = await createGuide(userId, {
      cnpj,
      periodoApuracao,
      contribuinte: contrib
    });
    return await ensureDownloadBuffer(guide, userId, {
      autorPedidoDados: contrib,
      contribuinte: contrib
    });
  }

  if (cnpjFromRequest && validateDoc(cnpjFromRequest)) {
    guide = await createGuideByCnpj(userId, {
      cnpj: cnpjFromRequest,
      periodoApuracao
    });
    return await ensureDownloadBuffer(guide, userId, null);
  }

  throw badRequest('Envie o certificado do cliente ou informe o CNPJ do MEI para baixar a guia');
};

export const listPeriods = async (userId, payload) => {
  ensureConfigured();
  await ensureClientCertificate(userId);
  const { cnpj, contribuinte } = payload || {};
  const contrib = resolveContribuinte(userId, contribuinte, cnpj);
  const autor = contrib;

  const url = buildPeriodsUrl(contrib.numero);
  if (!url) {
    throw badRequest('Endpoint de períodos não configurado');
  }

  const response = await requestGetJson(url, userId, {
    autorPedidoDados: autor,
    contribuinte: contrib
  });
  const rawItems = response?.periods || response?.items || response?.data || response || [];
  const normalized = Array.isArray(rawItems) ? rawItems.map((item) => {
    const competencia = parseCompetencia(
      item?.competencia || item?.periodo || item?.period || item?.reference,
      item?.mes,
      item?.ano
    );
    return {
      competencia,
      status: normalizeStatus(item?.status || item?.situacao || item?.pago),
      guideId: item?.guideId || item?.guiaId || item?.downloadId || item?.id || item?.codigo || null
    };
  }) : [];

  const sorted = sortByCompetenciaDesc(normalized);
  return sorted.slice(0, 12);
};
