/**
 * Interpreta a resposta de `GET /mei-notas/setup/emissao-fiscal/empresa` (corpo já extraído pelo apiClient).
 * O backend devolve o payload bruto do Plugnotas em `consultarEmpresaPlugNotas` — tipicamente `{ message?, data?: { nfe?, nfce?, ... } }`.
 * Caminhos alternativos cobrem variações observadas em testes/fixtures.
 */

export type PlugnotasModalityState = 'active' | 'inactive' | 'unknown';

export type ParsedPlugnotasEmpresaCapabilities = {
  nfe: PlugnotasModalityState;
  nfce: PlugnotasModalityState;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

/** Extrai o objeto “empresa” onde costumam estar `nfe` / `nfce`. */
export function extractPlugnotasEmpresaBody(apiResponse: unknown): Record<string, unknown> | null {
  if (!isRecord(apiResponse)) return null;
  const inner = apiResponse.data;
  if (isRecord(inner)) return inner;
  return apiResponse;
}

function readModalityState(body: Record<string, unknown> | null, key: 'nfe' | 'nfce'): PlugnotasModalityState {
  if (!body) return 'unknown';
  const block = body[key];
  if (!isRecord(block)) return 'unknown';
  const ativo = block.ativo;
  if (ativo === true) return 'active';
  if (ativo === false) return 'inactive';
  return 'unknown';
}

/**
 * `inactive` apenas quando existe o bloco `nfe`/`nfce` com `ativo === false` (caso típico MEI “apenas NFS-e”).
 * `unknown` não bloqueia a UI (evita falso-positivo se o payload mudar).
 */
export function parsePlugnotasEmpresaCapabilities(apiResponse: unknown): ParsedPlugnotasEmpresaCapabilities {
  const body = extractPlugnotasEmpresaBody(apiResponse);
  return {
    nfe: readModalityState(body, 'nfe'),
    nfce: readModalityState(body, 'nfce')
  };
}

export function isNfeLikeEmissionBlockedByCapabilities(
  documentType: 'NFE' | 'NFCE',
  caps: ParsedPlugnotasEmpresaCapabilities | null
): boolean {
  if (!caps) return false;
  if (documentType === 'NFE') return caps.nfe === 'inactive';
  return caps.nfce === 'inactive';
}
