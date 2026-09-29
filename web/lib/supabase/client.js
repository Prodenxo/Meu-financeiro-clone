'use client';

import { createBrowserClient } from '@supabase/ssr';
import { assertSupabaseEnv } from './env.js';

let browserClient = null;

/** Cliente Supabase no browser (singleton) — usado só onde precisa de interação direta (Edge Functions). */
export function getSupabaseBrowserClient() {
  if (browserClient) return browserClient;
  const { url, anonKey } = assertSupabaseEnv();
  browserClient = createBrowserClient(url, anonKey);
  return browserClient;
}
