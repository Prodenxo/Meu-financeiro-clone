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

  return createClient(env.SUPABASE_URL, key, {
    global: {
      headers
    }
  });
};
