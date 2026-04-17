import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

export const createSupabaseClient = ({
  accessToken,
  useServiceRole = false
} = {}) => {
  const key = useServiceRole && env.SUPABASE_SERVICE_ROLE_KEY
    ? env.SUPABASE_SERVICE_ROLE_KEY
    : env.SUPABASE_ANON_KEY;

  const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};

  const authOptions = useServiceRole
    ? { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    : {};

  return createClient(env.SUPABASE_URL, key, {
    auth: authOptions,
    global: { headers }
  });
};

let _serviceRoleClient = null;

export const getServiceRoleClient = () => {
  if (!_serviceRoleClient) {
    if (!env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY não configurado');
    }
    _serviceRoleClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    });
  }
  return _serviceRoleClient;
};
