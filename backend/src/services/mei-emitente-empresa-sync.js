import { normalizeDoc } from '../utils/cpf-cnpj.js';
import {
  patchEmitenteNfseFields,
  saveCertificateDocument,
} from './mei-certificate-store.js';

const firstNonEmpty = (...values) => {
  for (const v of values) {
    const s = v !== undefined && v !== null ? String(v).trim() : '';
    if (s) return s;
  }
  return '';
};

/**
 * Extrai campos do emitente NFS-e a partir do JSON da empresa Plugnotas (GET ou payload de cadastro).
 * @param {unknown} empresaJson
 * @returns {Record<string, unknown>|null}
 */
export function empresaJsonToEmitentePartial(empresaJson) {
  if (!empresaJson || typeof empresaJson !== 'object' || Array.isArray(empresaJson)) {
    return null;
  }
  const end = empresaJson.endereco;
  if (!end || typeof end !== 'object' || Array.isArray(end)) return null;

  const partial = {
    razaoSocial: firstNonEmpty(empresaJson.razaoSocial, empresaJson.razao_social),
    nomeFantasia: firstNonEmpty(empresaJson.nomeFantasia, empresaJson.nome_fantasia),
    email: firstNonEmpty(empresaJson.email, empresaJson.fiscal_email),
    inscricaoMunicipal: firstNonEmpty(
      empresaJson.inscricaoMunicipal,
      empresaJson.inscricao_municipal,
    ),
    tipoLogradouro: firstNonEmpty(end.tipoLogradouro, end.tipo_logradouro) || 'Rua',
    logradouro: firstNonEmpty(end.logradouro),
    numero: firstNonEmpty(end.numero),
    complemento: firstNonEmpty(end.complemento),
    bairro: firstNonEmpty(end.bairro),
    codigoCidade: firstNonEmpty(end.codigoCidade, end.codigo_cidade, end.ibge_municipio),
    descricaoCidade: firstNonEmpty(end.descricaoCidade, end.descricao_cidade, end.cidade),
    estado: firstNonEmpty(end.estado, end.uf),
    cep: firstNonEmpty(end.cep),
  };

  const hasAddress =
    partial.logradouro
    || partial.numero
    || partial.codigoCidade
    || partial.cep;
  if (!hasAddress) return null;

  const filtered = Object.fromEntries(
    Object.entries(partial).filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== ''),
  );
  return Object.keys(filtered).length ? filtered : null;
}

/**
 * Completa snapshot do emitente com campos da empresa Plugnotas (sem sobrescrever o que já existe).
 * @param {import('./mei-certificate-store.js').NfseEmitenteApiSnapshot|null|undefined} emitente
 * @param {Record<string, unknown>|null} partial
 */
export function mergeEmitenteWithEmpresaPartial(emitente, partial) {
  if (!partial) return emitente || null;
  const base = emitente && typeof emitente === 'object' ? emitente : {};
  const pick = (current, key) => {
    const cur = current != null ? String(current).trim() : '';
    if (cur) return cur;
    const next = partial[key];
    return next != null ? String(next).trim() : '';
  };
  return {
    ...base,
    razaoSocial: pick(base.razaoSocial, 'razaoSocial'),
    nomeFantasia: pick(base.nomeFantasia, 'nomeFantasia'),
    email: pick(base.email, 'email'),
    inscricaoMunicipal: pick(base.inscricaoMunicipal, 'inscricaoMunicipal'),
    tipoLogradouro: pick(base.tipoLogradouro, 'tipoLogradouro') || 'Rua',
    logradouro: pick(base.logradouro, 'logradouro'),
    numero: pick(base.numero, 'numero'),
    complemento: pick(base.complemento, 'complemento'),
    bairro: pick(base.bairro, 'bairro'),
    codigoCidade: pick(base.codigoCidade, 'codigoCidade'),
    descricaoCidade: pick(base.descricaoCidade, 'descricaoCidade'),
    estado: pick(base.estado, 'estado'),
    cep: pick(base.cep, 'cep'),
    certDocument: base.certDocument || '',
    regimeTributario: base.regimeTributario || '1',
    simplesNacional: base.simplesNacional !== false,
    rpsLote: base.rpsLote ?? 1,
    rpsNumero: base.rpsNumero ?? 1,
    rpsSerie: base.rpsSerie ?? '1',
  };
}

/**
 * Espelha endereço/dados fiscais da empresa Plugnotas em `user_mei_certificates` (best-effort).
 * @param {string|undefined} userId
 * @param {unknown} empresaJson
 */
export async function reconcileEmitenteMirrorFromEmpresaJson(userId, empresaJson) {
  if (!userId) return;
  const partial = empresaJsonToEmitentePartial(empresaJson);
  if (!partial) return;

  const cnpj = normalizeDoc(
    empresaJson?.cpfCnpj ?? empresaJson?.cpf_cnpj ?? empresaJson?.cnpj ?? '',
  );

  try {
    await patchEmitenteNfseFields(userId, partial);
    return;
  } catch {
    if (cnpj.length !== 14) return;
    try {
      await saveCertificateDocument(userId, cnpj);
      await patchEmitenteNfseFields(userId, partial);
    } catch {
      // deploy parcial / sem linha UMC — não bloquear fluxo fiscal
    }
  }
}
