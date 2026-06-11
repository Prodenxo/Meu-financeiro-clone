export interface BrasilApiCnpjResponse {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  municipio: string | null;
  uf: string | null;
  cep: string | null;
  email: string | null;
  ddd_telefone_1?: string | null;
  /** Código TOM/SIAFI (4 díg.) — NÃO é o IBGE. Não usar como `codigoCidade` do Plugnotas. */
  codigo_municipio: string | number | null;
  /** Código IBGE de 7 dígitos — correto para `endereco.codigoCidade` do Plugnotas. Normalizar com `normalizeIbgeMunicipioCodigo`. */
  codigo_municipio_ibge: string | number | null;
  simples: { optante_simples_nacional: boolean } | null;
}

export type CnpjLookupResult = {
  cpfCnpj: string;
  razaoSocial: string | null;
  nomeFantasia: string | null;
  email: string | null;
  telefone: { ddd: string; numero: string } | null;
  inscricaoMunicipal: string | null;
  inscricaoEstadual: string | null;
  endereco: {
    logradouro: string | null;
    numero: string | null;
    complemento: string | null;
    bairro: string | null;
    codigoCidade: string | null;
    descricaoCidade: string | null;
    estado: string | null;
    cep: string | null;
  };
  situacaoCadastral?: string | null;
  porte?: string | null;
  opcaoSimples?: boolean | null;
};

const parseBrasilApiTelefone = (raw?: string | null): { ddd: string; numero: string } | null => {
  if (!raw) return null;
  const digits = String(raw).replace(/\D/g, '');
  if (digits.length < 3) return null;
  return { ddd: digits.slice(0, 2), numero: digits.slice(2) };
};

export function mapBrasilApiToCnpjLookupResult (
  data: BrasilApiCnpjResponse,
  fallbackCnpj: string
): CnpjLookupResult {
  const codigoIbge = data.codigo_municipio_ibge ?? data.codigo_municipio;
  return {
    cpfCnpj: data.cnpj || fallbackCnpj,
    razaoSocial: data.razao_social ?? null,
    nomeFantasia: data.nome_fantasia ?? null,
    email: data.email ?? null,
    telefone: parseBrasilApiTelefone(data.ddd_telefone_1),
    inscricaoMunicipal: null,
    inscricaoEstadual: null,
    endereco: {
      logradouro: data.logradouro ?? null,
      numero: data.numero ?? null,
      complemento: data.complemento ?? null,
      bairro: data.bairro ?? null,
      codigoCidade: codigoIbge != null ? String(codigoIbge) : null,
      descricaoCidade: data.municipio ?? null,
      estado: data.uf ?? null,
      cep: data.cep ? String(data.cep).replace(/\D/g, '') : null
    },
    situacaoCadastral: null,
    porte: null,
    opcaoSimples: data.simples?.optante_simples_nacional ?? null
  };
}

/**
 * Busca dados de uma empresa na API Brasil pelo CNPJ.
 * Apenas executa se o CNPJ tiver exatamente 14 dígitos.
 * Lança erro com mensagem acionável em caso de falha.
 */
export async function fetchBrasilApiCnpj(cnpj: string): Promise<BrasilApiCnpjResponse> {
  const digits = cnpj.replace(/\D/g, '');
  if (digits.length !== 14) {
    throw new Error('CNPJ deve ter 14 dígitos.');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(
      `https://brasilapi.com.br/api/cnpj/v1/${digits}`,
      { signal: controller.signal }
    );
    if (response.status === 404) {
      throw new Error('CNPJ não encontrado na Receita Federal.');
    }
    if (response.status === 400) {
      const text = await response.text().catch(() => '');
      try {
        const json = JSON.parse(text) as { message?: string };
        if (json?.message && /inválido/i.test(json.message)) {
          throw new Error('CNPJ inválido. Verifique os dígitos informados.');
        }
        if (json?.message) throw new Error(json.message);
      } catch (parseErr) {
        if (parseErr instanceof Error && parseErr.message.includes('CNPJ')) throw parseErr;
      }
      throw new Error('CNPJ inválido. Verifique os dígitos informados.');
    }
    if (response.status === 403) {
      throw new Error('Consulta de CNPJ temporariamente indisponível. Tente novamente em instantes.');
    }
    if (response.status === 429) {
      throw new Error('Muitas consultas. Tente novamente em instantes.');
    }
    if (!response.ok) {
      throw new Error(`Erro ao consultar CNPJ (${response.status}).`);
    }
    return (await response.json()) as BrasilApiCnpjResponse;
  } catch (error) {
    if ((error as { name?: string }).name === 'AbortError') {
      throw new Error('Consulta de CNPJ excedeu o tempo limite.');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
