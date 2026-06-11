import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchBrasilApiCnpj, mapBrasilApiToCnpjLookupResult } from './brasilApi';

const VALID_CNPJ = '11222333000181';
const MOCK_RESPONSE = {
  cnpj: VALID_CNPJ,
  razao_social: 'EMPRESA TESTE LTDA',
  nome_fantasia: 'Empresa Teste',
  logradouro: 'RUA DAS FLORES',
  numero: '100',
  complemento: 'SALA 1',
  bairro: 'CENTRO',
  municipio: 'SAO PAULO',
  uf: 'SP',
  cep: '01310-100',
  email: 'contato@empresa.com',
  codigo_municipio: '7107', // TOM/SIAFI (São Paulo) — NÃO é o IBGE
  codigo_municipio_ibge: '3550308', // IBGE (São Paulo) — correto para codigoCidade
  simples: { optante_simples_nacional: true },
};

describe('fetchBrasilApiCnpj', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('rejeita se CNPJ tiver menos de 14 dígitos', async () => {
    await expect(fetchBrasilApiCnpj('123')).rejects.toThrow('14 dígitos');
  });

  it('rejeita se CNPJ tiver mais de 14 dígitos', async () => {
    await expect(fetchBrasilApiCnpj('123456789012345')).rejects.toThrow('14 dígitos');
  });

  it('aceita CNPJ com máscara e normaliza', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => MOCK_RESPONSE,
    } as Response);

    const result = await fetchBrasilApiCnpj('11.222.333/0001-81');
    expect(result.razao_social).toBe('EMPRESA TESTE LTDA');
  });

  it('retorna dados quando resposta é 200', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => MOCK_RESPONSE,
    } as Response);

    const result = await fetchBrasilApiCnpj(VALID_CNPJ);
    expect(result.razao_social).toBe('EMPRESA TESTE LTDA');
    expect(result.simples?.optante_simples_nacional).toBe(true);
  });

  it('lança erro legível quando CNPJ não encontrado (404)', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({}),
    } as Response);

    await expect(fetchBrasilApiCnpj(VALID_CNPJ)).rejects.toThrow('não encontrado');
  });

  it('lança erro legível quando CNPJ inválido (400)', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ message: 'CNPJ 22.873.938/0001-95 inválido.' }),
    } as Response);

    await expect(fetchBrasilApiCnpj(VALID_CNPJ)).rejects.toThrow('CNPJ inválido');
  });

  it('lança erro legível quando bloqueio temporário (403)', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({}),
    } as Response);

    await expect(fetchBrasilApiCnpj(VALID_CNPJ)).rejects.toThrow('temporariamente indisponível');
  });

  it('lança erro legível quando rate limit (429)', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: async () => ({}),
    } as Response);

    await expect(fetchBrasilApiCnpj(VALID_CNPJ)).rejects.toThrow('Muitas consultas');
  });

  it('lança erro de timeout quando AbortError', async () => {
    const abortError = new DOMException('Aborted', 'AbortError');
    vi.mocked(fetch).mockRejectedValueOnce(abortError);

    await expect(fetchBrasilApiCnpj(VALID_CNPJ)).rejects.toThrow('tempo limite');
  });
});

describe('mapBrasilApiToCnpjLookupResult', () => {
  it('prefere codigo_municipio_ibge para codigoCidade', () => {
    const mapped = mapBrasilApiToCnpjLookupResult(MOCK_RESPONSE, VALID_CNPJ);
    expect(mapped.endereco.codigoCidade).toBe('3550308');
    expect(mapped.razaoSocial).toBe('EMPRESA TESTE LTDA');
  });
});
