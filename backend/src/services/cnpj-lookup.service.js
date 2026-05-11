import { badRequest } from '../utils/errors.js';

const BRASILAPI_URL = 'https://brasilapi.com.br/api/cnpj/v1';

const normalizeDoc = (value) => String(value || '').replace(/\D/g, '');

const padZeros = (value, length) => {
  const str = String(value || '').replace(/\D/g, '');
  return str.padStart(length, '0').slice(-length);
};

/**
 * Consulta dados cadastrais de um CNPJ via BrasilAPI (público, gratuito).
 * Retorna payload normalizado pronto para preencher formulário de empresa fiscal.
 *
 * @param {string} cnpjInput - CNPJ com ou sem máscara
 * @returns {Promise<object>} Dados normalizados (razao_social, nome_fantasia, endereco, telefone, email)
 */
export const lookupCnpjBrasilApi = async (cnpjInput) => {
  const cnpj = normalizeDoc(cnpjInput);
  if (cnpj.length !== 14) {
    throw badRequest('CNPJ inválido. Informe 14 dígitos.');
  }

  const url = `${BRASILAPI_URL}/${cnpj}`;
  let response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' }
    });
  } catch (err) {
    throw badRequest('Falha ao consultar BrasilAPI. Verifique sua conexão.');
  }

  if (response.status === 404) {
    throw badRequest('CNPJ não encontrado na base da Receita Federal.');
  }
  if (!response.ok) {
    throw badRequest(`BrasilAPI retornou status ${response.status}.`);
  }

  const raw = await response.json();

  // Normalização para o formato do PlugNotasCompanyForm
  const ddd = padZeros(raw?.ddd_telefone_1, 2);
  const numero = String(raw?.ddd_telefone_1 || '').replace(/\D/g, '').slice(2);

  const data = {
    cpfCnpj: cnpj,
    razaoSocial: raw?.razao_social || null,
    nomeFantasia: raw?.nome_fantasia || null,
    email: raw?.email || null,
    telefone: ddd && numero ? { ddd, numero } : null,
    inscricaoMunicipal: null, // BrasilAPI não traz IM
    inscricaoEstadual: null, // BrasilAPI não traz IE
    endereco: {
      logradouro: raw?.logradouro || null,
      numero: raw?.numero || null,
      complemento: raw?.complemento || null,
      bairro: raw?.bairro || null,
      codigoCidade: raw?.codigo_municipio_ibge ? String(raw.codigo_municipio_ibge) : null,
      descricaoCidade: raw?.municipio || null,
      estado: raw?.uf || null,
      cep: raw?.cep ? String(raw.cep).replace(/\D/g, '') : null
    },
    situacaoCadastral: raw?.descricao_situacao_cadastral || null,
    porte: raw?.porte || null,
    capitalSocial: raw?.capital_social || null,
    opcaoSimples: raw?.opcao_pelo_simples || null,
    opcaoMei: raw?.opcao_pelo_mei || null,
    cnaePrincipal: raw?.cnae_fiscal
      ? { codigo: String(raw.cnae_fiscal), descricao: raw?.cnae_fiscal_descricao || null }
      : null,
    raw // mantém payload original caso o front precise de algo extra
  };

  return data;
};
