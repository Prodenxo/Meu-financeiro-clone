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
  codigo_municipio: string | null;
  simples: { optante_simples_nacional: boolean } | null;
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
