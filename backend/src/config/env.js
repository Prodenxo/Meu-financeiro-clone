import dotenv from 'dotenv';

dotenv.config();

const required = (key) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Variável de ambiente ausente: ${key}`);
  }
  return value;
};

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || '3333',
  CORS_ORIGIN: process.env.CORS_ORIGIN
    || (process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000,http://localhost:3002'
      : (process.env.FRONTEND_URL || 'https://meu-financeiro-frontend.vercel.app')),
  SUPABASE_URL: required('SUPABASE_URL'),
  SUPABASE_ANON_KEY: required('SUPABASE_ANON_KEY'),
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  FRONTEND_URL: process.env.FRONTEND_URL || '',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
  GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI || ''
};
