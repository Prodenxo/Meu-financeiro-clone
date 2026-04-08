import crypto from 'node:crypto';
import { createSupabaseClient } from '../config/supabase.js';
import { env } from '../config/env.js';
import { badRequest } from '../utils/errors.js';

const TABLE = 'user_mei_certificates';
const ALGO = 'aes-256-gcm';
const IV_LEN = 12;
const KEY_LEN = 32;
const TAG_LEN = 16;

const getEncryptionKey = () => {
  const raw = env.MEI_CERT_ENCRYPTION_KEY;
  if (!raw) {
    throw badRequest('MEI_CERT_ENCRYPTION_KEY não configurada');
  }
  const buf = raw.length === 44 && /^[A-Za-z0-9+/]+=*$/.test(raw)
    ? Buffer.from(raw, 'base64')
    : Buffer.from(raw, 'utf8');
  if (buf.length < KEY_LEN) {
    throw badRequest('MEI_CERT_ENCRYPTION_KEY deve ter 32 bytes (ou 44 em base64)');
  }
  return buf.subarray(0, KEY_LEN);
};

/**
 * Criptografa a senha do certificado (AES-256-GCM).
 * @returns {{ passphraseEnc: string, passphraseIv: string }}
 */
export const encryptPassphrase = (passphrase) => {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([
    cipher.update(String(passphrase), 'utf8'),
    cipher.final()
  ]);
  const tag = cipher.getAuthTag();
  const combined = Buffer.concat([enc, tag]);
  return {
    passphraseEnc: combined.toString('base64'),
    passphraseIv: iv.toString('base64')
  };
};

/**
 * Descriptografa a senha do certificado.
 */
export const decryptPassphrase = (passphraseEnc, passphraseIv) => {
  const key = getEncryptionKey();
  const iv = Buffer.from(passphraseIv, 'base64');
  const combined = Buffer.from(passphraseEnc, 'base64');
  if (combined.length < TAG_LEN) {
    throw badRequest('Dados de senha inválidos');
  }
  const enc = combined.subarray(0, combined.length - TAG_LEN);
  const tag = combined.subarray(combined.length - TAG_LEN);
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
};

const getSupabase = () => {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw badRequest('Supabase não configurado para persistência de certificado');
  }
  return createSupabaseClient({ useServiceRole: true });
};

const digitsOnly = (value) => String(value || '').replace(/\D/g, '');

/**
 * Normaliza campos de emitente NFS-e (camelCase ou snake) para colunas Supabase.
 * Omite chaves vazias quando omitEmpty=true (updates parciais).
 * @param {Record<string, unknown>} raw
 * @param {{ omitEmpty?: boolean }} [opts]
 */
export const normalizeEmitenteRowFragment = (raw, opts = {}) => {
  const omitEmpty = Boolean(opts.omitEmpty);
  const get = (camel, snake) => {
    const v = raw[camel] !== undefined ? raw[camel] : raw[snake];
    return v;
  };
  const out = {};

  const razao = get('razaoSocial', 'razao_social');
  if (razao !== undefined && razao !== null) {
    const t = String(razao).trim();
    if (t || !omitEmpty) out.razao_social = t || null;
  }

  const nf = get('nomeFantasia', 'nome_fantasia');
  if (nf !== undefined && nf !== null) {
    const t = String(nf).trim();
    if (t || !omitEmpty) out.nome_fantasia = t || null;
  }

  const fe = get('fiscalEmail', 'fiscal_email') ?? get('email', 'email');
  if (fe !== undefined && fe !== null) {
    const t = String(fe).trim();
    if (t || !omitEmpty) out.fiscal_email = t || null;
  }

  const im = get('inscricaoMunicipal', 'inscricao_municipal');
  if (im !== undefined && im !== null) {
    const t = String(im).trim();
    if (t || !omitEmpty) out.inscricao_municipal = t || null;
  }

  const rt = get('regimeTributario', 'regime_tributario');
  if (rt !== undefined && rt !== null) {
    const t = String(rt).trim();
    if (t || !omitEmpty) out.regime_tributario = t || null;
  }

  const cepVal = get('cep', 'cep');
  if (cepVal !== undefined && cepVal !== null) {
    const d = digitsOnly(cepVal).slice(0, 8);
    if (d || !omitEmpty) out.cep = d || null;
  }

  const tipoL = get('tipoLogradouro', 'tipo_logradouro');
  if (tipoL !== undefined && tipoL !== null) {
    const t = String(tipoL).trim();
    if (t || !omitEmpty) out.tipo_logradouro = t || null;
  }

  const log = get('logradouro', 'logradouro');
  if (log !== undefined && log !== null) {
    const t = String(log).trim();
    if (t || !omitEmpty) out.logradouro = t || null;
  }

  const num = get('numero', 'numero');
  if (num !== undefined && num !== null) {
    const t = String(num).trim();
    if (t || !omitEmpty) out.numero = t || null;
  }

  const comp = get('complemento', 'complemento');
  if (comp !== undefined && comp !== null) {
    const t = String(comp).trim();
    if (t || !omitEmpty) out.complemento = t || null;
  }

  const bairro = get('bairro', 'bairro');
  if (bairro !== undefined && bairro !== null) {
    const t = String(bairro).trim();
    if (t || !omitEmpty) out.bairro = t || null;
  }

  const ibge = get('ibgeMunicipio', 'ibge_municipio') ?? get('codigoCidade', 'codigo_cidade');
  if (ibge !== undefined && ibge !== null) {
    const t = String(ibge).replace(/\D/g, '').trim() || String(ibge).trim();
    if (t || !omitEmpty) out.ibge_municipio = t || null;
  }

  const cidade = get('cidade', 'cidade') ?? get('descricaoCidade', 'descricao_cidade');
  if (cidade !== undefined && cidade !== null) {
    const t = String(cidade).trim();
    if (t || !omitEmpty) out.cidade = t || null;
  }

  const uf = get('uf', 'uf') ?? get('estado', 'estado');
  if (uf !== undefined && uf !== null) {
    const u = String(uf).trim().toUpperCase().slice(0, 2);
    if (u || !omitEmpty) out.uf = u || null;
  }

  const opt = get('optanteSimplesNacional', 'optante_simples_nacional')
    ?? get('simplesNacional', 'simples_nacional');
  if (opt !== undefined && opt !== null) {
    if (typeof opt === 'boolean') {
      out.optante_simples_nacional = opt;
    } else {
      const s = String(opt).trim().toLowerCase();
      if (['1', 'true', 'yes', 'sim', 'on'].includes(s)) out.optante_simples_nacional = true;
      else if (['0', 'false', 'no', 'nao', 'não', 'off'].includes(s)) out.optante_simples_nacional = false;
      else if (!omitEmpty) out.optante_simples_nacional = null;
    }
  }

  return out;
};

/**
 * Contrato estável de `nfseEmitente` em `GET /mei-guide/certificate/status` e respostas de upload/patch.
 * Espelha colunas de `user_mei_certificates` para autopreenchimento do prestador (PRD autopreenchimento 2026-03-31).
 *
 * @typedef {object} NfseEmitenteApiSnapshot
 * @property {string} razaoSocial — `razao_social`
 * @property {string} nomeFantasia — `nome_fantasia`
 * @property {string} email — `fiscal_email`
 * @property {string} [inscricaoMunicipal] — `inscricao_municipal`, opcional
 * @property {string} regimeTributario
 * @property {boolean} simplesNacional — `optante_simples_nacional`
 * @property {string} cep — só dígitos (até 8)
 * @property {string} tipoLogradouro — `tipo_logradouro`
 * @property {string} logradouro
 * @property {string} numero
 * @property {string} complemento
 * @property {string} bairro
 * @property {string} codigoCidade — `ibge_municipio` (normalizado para dígitos quando aplicável)
 * @property {string} descricaoCidade — `cidade`
 * @property {string} estado — `uf`, 2 letras maiúsculas
 * @property {string} [certDocument] — `cert_document`, só dígitos (CNPJ/CPF gravado); opcional quando vazio
 */

/**
 * Indica se a linha do `select` de emitente tem algum dado útil para o cliente (inclui só CNPJ/CPF em `cert_document`).
 * @param {Record<string, unknown>|null|undefined} data
 */
export const emitenteDbRowHasNfseData = (data) => {
  if (!data || typeof data !== 'object') return false;
  const docDigits = digitsOnly(data.cert_document);
  if (docDigits.length >= 11) return true;
  /** Só `optante_simples_nacional` não caracteriza snapshot útil (evita objeto “pobre” no status). */
  return Object.entries(data).some(([key, v]) => {
    if (key === 'cert_document' || key === 'optante_simples_nacional') return false;
    if (v === null || v === undefined) return false;
    if (typeof v === 'boolean') return false;
    return String(v).trim() !== '';
  });
};

/**
 * Converte linha DB em objeto camelCase para o frontend (`NfEmissionCompanyForm` + opcional `certDocument`).
 * @param {Record<string, unknown>} row
 * @returns {NfseEmitenteApiSnapshot|null}
 */
export const emitenteRowToApiShape = (row) => {
  if (!row || typeof row !== 'object') return null;
  const cepDigits = digitsOnly(row.cep).slice(0, 8);
  const ufRaw = row.uf != null ? String(row.uf).trim().toUpperCase().slice(0, 2) : '';
  const ibgeRaw = row.ibge_municipio != null ? String(row.ibge_municipio) : '';
  const codigoCidadeDigits = digitsOnly(ibgeRaw) || ibgeRaw.trim();
  const base = {
    razaoSocial: row.razao_social != null ? String(row.razao_social) : '',
    nomeFantasia: row.nome_fantasia != null ? String(row.nome_fantasia) : '',
    email: row.fiscal_email != null ? String(row.fiscal_email) : '',
    inscricaoMunicipal:
      row.inscricao_municipal != null ? String(row.inscricao_municipal).trim() : '',
    regimeTributario: row.regime_tributario ? String(row.regime_tributario) : '1',
    simplesNacional: row.optante_simples_nacional !== false,
    cep: cepDigits,
    tipoLogradouro: (() => {
      const t = row.tipo_logradouro != null ? String(row.tipo_logradouro).trim() : '';
      return t || 'Rua';
    })(),
    logradouro: row.logradouro != null ? String(row.logradouro) : '',
    numero: row.numero != null ? String(row.numero) : '',
    complemento: row.complemento != null ? String(row.complemento) : '',
    bairro: row.bairro != null ? String(row.bairro) : '',
    codigoCidade: codigoCidadeDigits,
    descricaoCidade: row.cidade != null ? String(row.cidade) : '',
    estado: ufRaw
  };
  const cd = row.cert_document;
  if (cd != null && String(cd).trim() !== '') {
    const d = digitsOnly(cd).slice(0, 14);
    if (d.length >= 11) {
      return { ...base, certDocument: d };
    }
  }
  return base;
};

/**
 * Atualiza apenas dados fiscais/endereço NFS-e (sem exigir novo .pfx).
 */
export const patchEmitenteNfseFields = async (userId, partial) => {
  if (!userId) throw badRequest('Usuário não identificado');
  const fragment = normalizeEmitenteRowFragment(partial, { omitEmpty: true });
  if (Object.keys(fragment).length === 0) {
    throw badRequest('Nenhum campo de emitente para atualizar');
  }
  const supabase = getSupabase();
  const { data: existing, error: selErr } = await supabase
    .from(TABLE)
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();
  if (selErr) {
    throw badRequest(selErr.message || 'Falha ao consultar certificado');
  }
  if (!existing?.id) {
    throw badRequest('Nenhum registro de certificado encontrado. Envie o certificado no MEI primeiro.');
  }
  const payload = {
    ...fragment,
    updated_at: new Date().toISOString()
  };
  const { error } = await supabase
    .from(TABLE)
    .update(payload)
    .eq('user_id', userId);
  if (error) {
    throw badRequest(error.message || 'Falha ao atualizar dados fiscais');
  }
};

/**
 * Lê apenas colunas de emitente NFS-e (não exige pfx preenchido).
 * @param {string} userId
 * @returns {Promise<NfseEmitenteApiSnapshot|null>}
 */
export const getEmitenteNfseSnapshot = async (userId) => {
  if (!userId) return null;
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLE)
    .select(`
      cert_document,
      razao_social,
      nome_fantasia,
      fiscal_email,
      regime_tributario,
      inscricao_municipal,
      cep,
      tipo_logradouro,
      logradouro,
      numero,
      complemento,
      bairro,
      ibge_municipio,
      cidade,
      uf,
      optante_simples_nacional
    `)
    .eq('user_id', userId)
    .maybeSingle();
  if (error || !data) return null;
  if (!emitenteDbRowHasNfseData(data)) return null;
  return emitenteRowToApiShape(data);
};

/**
 * Salva ou atualiza o certificado do usuário (upsert por user_id).
 * @param {object} opts - certValidFrom e certValidTo em ISO string (opcional).
 * @param {Record<string, unknown>} [opts.emitente] — dados mínimos NFS-e (opcional).
 */
export const saveCertificate = async (userId, {
  pfxBase64,
  passphraseEnc,
  passphraseIv,
  certDocument,
  certValidFrom = null,
  certValidTo = null,
  emitente = null
}) => {
  if (!userId) throw badRequest('Usuário não identificado');
  const supabase = getSupabase();
  const emitenteRow = emitente ? normalizeEmitenteRowFragment(emitente, { omitEmpty: false }) : {};
  const row = {
    user_id: userId,
    pfx_base64: pfxBase64,
    passphrase_enc: passphraseEnc,
    passphrase_iv: passphraseIv,
    cert_document: certDocument || null,
    cert_valid_from: certValidFrom || null,
    cert_valid_to: certValidTo || null,
    ...emitenteRow,
    updated_at: new Date().toISOString()
  };
  const { error } = await supabase
    .from(TABLE)
    .upsert(row, { onConflict: 'user_id' });
  if (error) {
    throw badRequest(error.message || 'Falha ao salvar certificado');
  }
};

/**
 * Salva/atualiza apenas o documento (CPF/CNPJ) do usuário.
 */
export const saveCertificateDocument = async (userId, certDocument) => {
  if (!userId) throw badRequest('Usuário não identificado');
  const normalized = String(certDocument || '').replace(/\D/g, '');
  if (!normalized) return;
  const supabase = getSupabase();
  const { data, error: selectError } = await supabase
    .from(TABLE)
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();
  if (selectError) {
    throw badRequest(selectError.message || 'Falha ao consultar certificado');
  }
  const payload = {
    user_id: userId,
    cert_document: normalized,
    updated_at: new Date().toISOString()
  };
  if (data?.id) {
    const { error } = await supabase
      .from(TABLE)
      .update(payload)
      .eq('user_id', userId);
    if (error) {
      throw badRequest(error.message || 'Falha ao atualizar documento MEI');
    }
    return;
  }
  const { error } = await supabase.from(TABLE).insert(payload);
  if (error) {
    throw badRequest(error.message || 'Falha ao salvar documento MEI');
  }
};

/**
 * Carrega o certificado do usuário (pfx_base64 e senha criptografada).
 * @returns {{ pfxBase64: string, passphraseEnc: string, passphraseIv: string, certDocument: string | null } | null}
 */
export const loadCertificate = async (userId) => {
  if (!userId) return null;
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLE)
    .select('pfx_base64, passphrase_enc, passphrase_iv, cert_document, cert_valid_from, cert_valid_to')
    .eq('user_id', userId)
    .maybeSingle();
  if (error || !data) return null;
  if (!data.pfx_base64 || !data.passphrase_enc || !data.passphrase_iv) {
    return null;
  }
  return {
    pfxBase64: data.pfx_base64,
    passphraseEnc: data.passphrase_enc,
    passphraseIv: data.passphrase_iv,
    certDocument: data.cert_document ?? null,
    certValidFrom: data.cert_valid_from ?? null,
    certValidTo: data.cert_valid_to ?? null
  };
};

const toBoolMirror = (value) => {
  if (typeof value === 'boolean') return value;
  if (value === undefined || value === null) return false;
  if (typeof value === 'number') return value !== 0;
  const t = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'sim'].includes(t)) return true;
  if (['0', 'false', 'no', 'nao', 'não'].includes(t)) return false;
  return false;
};

/**
 * Lê jsonb `documentos_ativos` para o cliente (GET certificate/status).
 * @param {unknown} raw
 * @returns {{ nfse: boolean, nfe: boolean, nfce: boolean } | null}
 */
export const parseDocumentosAtivosMirrorValue = (raw) => {
  if (raw == null) return null;
  if (typeof raw !== 'object' || Array.isArray(raw)) return null;
  const o = /** @type {Record<string, unknown>} */ (raw);
  const sel = {
    nfse: toBoolMirror(o.nfse),
    nfe: toBoolMirror(o.nfe),
    nfce: toBoolMirror(o.nfce)
  };
  if (!sel.nfse && !sel.nfe && !sel.nfce) return null;
  return sel;
};

/**
 * FR-UPD-DOC-09 — aviso estruturado sem PII desnecessária (sem payload Plugnotas / sem tri-boolean no log).
 * @param {{ userId: string, reason: string, detail?: string }} ctx
 */
export const logDocumentosAtivosMirrorPersistWarn = (ctx) => {
  const { userId, reason, detail } = ctx;
  console.warn('[mei-certificate-store] documentos_ativos mirror', {
    reason,
    userId,
    ...(detail ? { detail } : {})
  });
};

/**
 * Persiste espelho local após POST/PATCH empresa Plugnotas (FR-CAD-DOC P1).
 * Só faz UPDATE se já existir linha em `user_mei_certificates` (evita INSERT sem .pfx).
 * Falhas de Supabase/rede ou ausência de linha UMC: no-op na resposta HTTP + `warn` estruturado (FR-UPD-DOC-09).
 *
 * @param {string} userId
 * @param {{ nfse: boolean, nfe: boolean, nfce: boolean }} selection
 * @param {object} [deps] — injeção para testes
 * @param {() => object} [deps.getSupabase] — cliente Supabase (service role)
 * @param {(ctx: { userId: string, reason: string, detail?: string }) => void} [deps.logWarn]
 */
export const saveDocumentosAtivosMirror = async (userId, selection, deps = {}) => {
  const logWarn = deps.logWarn ?? logDocumentosAtivosMirrorPersistWarn;
  const resolveSupabase = deps.getSupabase ?? getSupabase;

  if (!userId || !selection || typeof selection !== 'object') return;
  const json = {
    nfse: Boolean(selection.nfse),
    nfe: Boolean(selection.nfe),
    nfce: Boolean(selection.nfce)
  };
  if (!json.nfse && !json.nfe && !json.nfce) return;
  try {
    const supabase = resolveSupabase();
    const { data: existing, error: selErr } = await supabase
      .from(TABLE)
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    if (selErr) {
      logWarn({
        userId,
        reason: 'mirror_select_user_mei_certificates_failed',
        detail: selErr.message || String(selErr.code || 'unknown')
      });
      return;
    }
    if (!existing?.id) {
      logWarn({
        userId,
        reason: 'mirror_no_user_mei_certificate_row',
        detail: 'no_update_without_certificate_row'
      });
      return;
    }
    const { error } = await supabase
      .from(TABLE)
      .update({
        documentos_ativos: json,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);
    if (error) {
      logWarn({
        userId,
        reason: 'mirror_update_documentos_ativos_failed',
        detail: error.message || String(error.code || 'unknown')
      });
    }
  } catch (err) {
    logWarn({
      userId,
      reason: 'mirror_persist_unexpected_error',
      detail: err instanceof Error ? err.message : String(err)
    });
  }
};

/**
 * @param {string} userId
 * @returns {Promise<{ nfse: boolean, nfe: boolean, nfce: boolean } | null>}
 */
export const getDocumentosAtivosMirror = async (userId) => {
  if (!userId) return null;
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from(TABLE)
      .select('documentos_ativos')
      .eq('user_id', userId)
      .maybeSingle();
    if (error || !data) return null;
    return parseDocumentosAtivosMirrorValue(data.documentos_ativos);
  } catch {
    return null;
  }
};

/**
 * Remove o certificado do usuário.
 */
export const deleteCertificate = async (userId) => {
  if (!userId) return;
  const supabase = getSupabase();
  await supabase.from(TABLE).delete().eq('user_id', userId);
};

/**
 * Verifica se o usuário possui certificado persistido (sem carregar o blob).
 */
export const hasCertificate = async (userId) => {
  if (!userId) return false;
  const supabase = getSupabase();
  const { data } = await supabase
    .from(TABLE)
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();
  return Boolean(data?.id);
};

/**
 * Retorna apenas o documento (CPF/CNPJ) do certificado persistido, se existir.
 */
export const getCertificateDocument = async (userId) => {
  if (!userId) return null;
  const supabase = getSupabase();
  const { data } = await supabase
    .from(TABLE)
    .select('cert_document')
    .eq('user_id', userId)
    .maybeSingle();
  return data?.cert_document ?? null;
};

/**
 * Retorna apenas as datas de validade do certificado persistido (sem carregar o blob).
 * @returns {{ certValidFrom: string | null, certValidTo: string | null } | null}
 */
export const getCertificateValidity = async (userId) => {
  if (!userId) return null;
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLE)
    .select('cert_valid_from, cert_valid_to')
    .eq('user_id', userId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    certValidFrom: data.cert_valid_from ?? null,
    certValidTo: data.cert_valid_to ?? null
  };
};
