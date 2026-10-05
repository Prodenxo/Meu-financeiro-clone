export function getSupabasePublicEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '';
  return { url, anonKey, configured: Boolean(url && anonKey) };
}

export function assertSupabaseEnv() {
  const env = getSupabasePublicEnv();
  if (!env.configured) {
    throw new Error(
      'Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY (local: web/.env.local; Easypanel: Ambiente + build args do Docker).',
    );
  }
  return env;
}
