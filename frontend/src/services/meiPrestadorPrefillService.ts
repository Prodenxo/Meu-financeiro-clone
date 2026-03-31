import type { NfsePrestadorPrefillDto } from '../lib/nfsePrestadorPrefillDto';
import { createSupabaseBrowserWithJwt, isSupabaseBrowserConfigured } from '../lib/supabaseBrowser';

const TOKEN_STORAGE_KEY = 'financas-pessoais-auth-token';

function readStoredAccessToken(): string | null {
  const tokenData = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (!tokenData) return null;
  try {
    const parsed = JSON.parse(tokenData);
    return parsed.access_token || parsed.session?.access_token || null;
  } catch {
    return tokenData || null;
  }
}

const emptyPrefill = (): NfsePrestadorPrefillDto => ({
  prestadorCpfCnpj: null,
  prestadorRazaoSocial: null,
  prestadorEmail: null,
  prestadorInscricaoMunicipal: null,
  prestadorEndereco: null,
  sourceRowId: null,
});

/**
 * Prefill NFSe via Edge `mei-prestador-prefill` (Story 2.1). Paridade mobile.
 */
export async function fetchNfsePrestadorPrefill(): Promise<NfsePrestadorPrefillDto> {
  if (!isSupabaseBrowserConfigured) {
    return emptyPrefill();
  }
  const accessToken = readStoredAccessToken();
  if (!accessToken?.trim()) {
    return emptyPrefill();
  }

  const supabase = createSupabaseBrowserWithJwt(accessToken.trim());
  const { data, error } = await supabase.functions.invoke<{
    prefill?: NfsePrestadorPrefillDto;
    error?: string;
  }>('mei-prestador-prefill', { body: {} });

  if (error) {
    throw new Error(error.message || 'Não foi possível carregar dados do prestador');
  }
  if (data && typeof data === 'object' && 'error' in data && typeof data.error === 'string') {
    throw new Error(data.error);
  }
  return data?.prefill ?? emptyPrefill();
}
