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

/**
 * Salva ou atualiza o certificado do usuário (upsert por user_id).
 */
export const saveCertificate = async (userId, { pfxBase64, passphraseEnc, passphraseIv, certDocument }) => {
  if (!userId) throw badRequest('Usuário não identificado');
  const supabase = getSupabase();
  const row = {
    user_id: userId,
    pfx_base64: pfxBase64,
    passphrase_enc: passphraseEnc,
    passphrase_iv: passphraseIv,
    cert_document: certDocument || null,
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
    .select('pfx_base64, passphrase_enc, passphrase_iv, cert_document')
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
    certDocument: data.cert_document ?? null
  };
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
