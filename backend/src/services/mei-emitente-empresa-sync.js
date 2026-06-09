import { normalizeDocDigits } from '../utils/cpf-cnpj.js';
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
 * GET /empresa devolve envelope `{ message, data: { ... } }`; POST/PATCH usam objeto plano.
 * @param {unknown} empresaJson
 * @returns {Record<string, unknown>|null}
 */
const isEmpresaLikeRecord = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const row = /** @type {Record<string, unknown>} */ (value);
  return Boolean(
    row.endereco
    || row.cpfCnpj
    || row.cpf_cnpj
    || row.cnpj
    || row.razaoSocial
    || row.razao_social
    || row.logradouro
    || row.codigoCidade
    || row.codigo_cidade,
  );
};

export function unwrapPlugnotasEmpresaRecord(empresaJson) {
  if (!empresaJson || typeof empresaJson !== 'object' || Array.isArray(empresaJson)) {
    return null;
  }
  const root = /** @type {Record<string, unknown>} */ (empresaJson);
  if (isEmpresaLikeRecord(root)) return root;

  const data = root.data;
  if (Array.isArray(data)) {
    const match = data.find((item) => isEmpresaLikeRecord(item));
    if (match && typeof match === 'object' && !Array.isArray(match)) {
      return /** @type {Record<string, unknown>} */ (match);
    }
  }
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const inner = /** @type {Record<string, unknown>} */ (data);
    if (isEmpresaLikeRecord(inner)) return inner;
    const nested = inner.empresa;
    if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
      return /** @type {Record<string, unknown>} */ (nested);
    }
  }

  const empresa = root.empresa;
  if (empresa && typeof empresa === 'object' && !Array.isArray(empresa)) {
    return /** @type {Record<string, unknown>} */ (empresa);
  }

  return root;
}

const resolveEmpresaEnderecoRecord = (empresa) => {
  if (!empresa || typeof empresa !== 'object' || Array.isArray(empresa)) return null;
  const end = empresa.endereco;
  if (end && typeof end === 'object' && !Array.isArray(end)) {
    return /** @type {Record<string, unknown>} */ (end);
  }
  const hasFlatAddress = [
    'logradouro',
    'numero',
    'codigoCidade',
    'codigo_cidade',
    'cep',
    'bairro',
    'descricaoCidade',
    'descricao_cidade',
    'estado',
    'uf',
  ].some((key) => {
    const value = empresa[key];
    return value !== undefined && value !== null && String(value).trim() !== '';
  });
  if (!hasFlatAddress) return null;
  return /** @type {Record<string, unknown>} */ (empresa);
};

/**
 * Extrai campos do emitente NFS-e a partir do JSON da empresa Plugnotas (GET ou payload de cadastro).
 * @param {unknown} empresaJson
 * @returns {Record<string, unknown>|null}
 */
export function empresaJsonToEmitentePartial(empresaJson) {
  const empresa = unwrapPlugnotasEmpresaRecord(empresaJson);
  if (!empresa) return null;
  const end = resolveEmpresaEnderecoRecord(empresa);
  if (!end) return null;

  const partial = {
    razaoSocial: firstNonEmpty(empresa.razaoSocial, empresa.razao_social),
    nomeFantasia: firstNonEmpty(empresa.nomeFantasia, empresa.nome_fantasia),
    email: firstNonEmpty(empresa.email, empresa.fiscal_email),
    inscricaoMunicipal: firstNonEmpty(
      empresa.inscricaoMunicipal,
      empresa.inscricao_municipal,
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

  const empresa = unwrapPlugnotasEmpresaRecord(empresaJson);
  const cnpj = normalizeDocDigits(
    empresa?.cpfCnpj ?? empresa?.cpf_cnpj ?? empresa?.cnpj ?? '',
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
