import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export const isSupabaseBrowserConfigured = Boolean(supabaseUrl && supabaseAnonKey);

const placeholderUrl = 'https://placeholder.supabase.co';
const placeholderKey = 'placeholder-anon-key';

/**
 * Cliente Supabase para browser (Edge Functions com JWT do utilizador).
 * Sem credenciais válidas: client placeholder para não quebrar imports; não invocar `functions.invoke` nesse caso.
 */
export const supabaseBrowser: SupabaseClient = createClient(
  isSupabaseBrowserConfigured ? supabaseUrl : placeholderUrl,
  isSupabaseBrowserConfigured ? supabaseAnonKey : placeholderKey
);

/** Cliente com Authorization explícita (access token da sessão app). */
export function createSupabaseBrowserWithJwt(accessToken: string): SupabaseClient {
  const url = isSupabaseBrowserConfigured ? supabaseUrl : placeholderUrl;
  const key = isSupabaseBrowserConfigured ? supabaseAnonKey : placeholderKey;
  return createClient(url, key, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}
