import { createSupabaseClient } from '../config/supabase.js';
import { badRequest, forbidden } from '../utils/errors.js';
import { getRequesterContext } from './users.service.js';
import { isValidCnpj, normalizeDocDigits } from '../utils/cpf-cnpj.js';

const ONLY_DIGITS = (s) => normalizeDocDigits(s);

export const isValidEmpresaCnpj = (cnpj) => isValidCnpj(cnpj);

/** Documento cadastral aceito: CNPJ (PJ) ou CPF (PF). Ambos dispensam o gate de onboarding. */
export const hasEmpresaDocumentoCadastral = (doc) => {
  const digits = ONLY_DIGITS(doc);
  if (digits.length === 14) return isValidCnpj(digits);
  // PF: presença de 11 dígitos libera o app (MEI/NFSe pedem CNPJ depois).
  // Não exige checksum aqui para não prender cadastros legados.
  if (digits.length === 11) return true;
  return false;
};

const EMPRESA_ONBOARDING_FIELDS = [
  'empresa',
  'cnpj',
  'razao_social',
  'nome_fantasia',
  'inscricao_estadual',
  'regime_tributario',
  'logradouro',
  'numero',
  'complemento',
  'bairro',
  'cidade',
  'estado',
  'cep',
  'telefone',
  'email',
];

const normalizeEmpresaText = (value) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const normalized = String(value).trim();
  return normalized || null;
};

const buildOnboardingPayload = (input = {}, { requireEmail = false } = {}) => {
  const payload = {};
  for (const field of EMPRESA_ONBOARDING_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(input, field)) continue;
    payload[field] =
      field === 'cnpj'
        ? ONLY_DIGITS(input[field])
        : normalizeEmpresaText(input[field]);
  }

  const cnpj = payload.cnpj;
  if (!cnpj || cnpj.length !== 14) {
    throw badRequest('CNPJ deve ter 14 dígitos');
  }

  payload.empresa =
    normalizeEmpresaText(input?.empresa)
    || normalizeEmpresaText(input?.razao_social)
    || normalizeEmpresaText(input?.nome_fantasia);
  if (!payload.empresa) {
    throw badRequest('Informe a razão social ou nome da empresa');
  }

  payload.razao_social = payload.razao_social || payload.empresa;

  if (requireEmail) {
    const email = normalizeEmpresaText(input?.email);
    if (!email || !String(email).includes('@')) {
      throw badRequest('E-mail da empresa é obrigatório');
    }
    payload.email = email;
  }

  return payload;
};

/**
 * Admin da empresa sem CNPJ válido precisa concluir cadastro uma vez.
 */
export const getEmpresaCnpjOnboardingStatus = async (accessToken) => {
  const { role, empresaId } = await getRequesterContext(accessToken);
  if (role !== 'admin') {
    return { required: false, empresa: null };
  }
  if (!empresaId) {
    throw badRequest('Empresa não vinculada ao administrador');
  }

  const adminClient = createSupabaseClient({ useServiceRole: true });
  const { data, error } = await adminClient
    .from('empresas')
    .select(EMPRESA_ONBOARDING_FIELDS.join(', '))
    .eq('id', empresaId)
    .maybeSingle();

  if (error) throw badRequest(error.message);
  if (!data?.id) throw badRequest('Empresa não encontrada');

  return {
    required: !hasEmpresaDocumentoCadastral(data.cnpj),
    empresa: data,
  };
};

/**
 * Grava CNPJ + dados cadastrais (uma única vez, quando ainda não há CNPJ).
 */
export const completeEmpresaCnpjOnboarding = async (accessToken, input = {}) => {
  const { role, empresaId } = await getRequesterContext(accessToken);
  if (role !== 'admin') throw forbidden('Apenas o administrador da empresa pode concluir este cadastro');
  if (!empresaId) throw badRequest('Empresa não vinculada ao administrador');

  if (input?.confirmed !== true) {
    throw badRequest('Confirme que os dados da empresa estão corretos');
  }

  const adminClient = createSupabaseClient({ useServiceRole: true });
  const { data: existing, error: loadErr } = await adminClient
    .from('empresas')
    .select('id, cnpj')
    .eq('id', empresaId)
    .maybeSingle();

  if (loadErr) throw badRequest(loadErr.message);
  if (!existing?.id) throw badRequest('Empresa não encontrada');

  if (hasEmpresaDocumentoCadastral(existing.cnpj) && isValidEmpresaCnpj(existing.cnpj)) {
    const { data: empresaAtual, error: reloadErr } = await adminClient
      .from('empresas')
      .select(EMPRESA_ONBOARDING_FIELDS.join(', '))
      .eq('id', empresaId)
      .maybeSingle();

    if (reloadErr) throw badRequest(reloadErr.message);
    if (!empresaAtual?.id) throw badRequest('Empresa não encontrada');

    return { empresa: empresaAtual, required: false, alreadyCompleted: true };
  }

  const updates = buildOnboardingPayload(input, { requireEmail: true });

  const { data, error } = await adminClient
    .from('empresas')
    .update(updates)
    .eq('id', empresaId)
    .select(EMPRESA_ONBOARDING_FIELDS.join(', '))
    .maybeSingle();

  if (error) throw badRequest(error.message || 'Erro ao salvar dados da empresa');
  if (!data?.id) throw badRequest('Empresa não encontrada');

  return { empresa: data, required: false };
};
