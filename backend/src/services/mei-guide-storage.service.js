import { createSupabaseClient } from '../config/supabase.js';
import { env } from '../config/env.js';
import { badRequest } from '../utils/errors.js';

const STORAGE_BUCKET = 'mei-das-pdfs';
const DEFAULT_EXPIRATION_SECONDS = 60 * 60;
let bucketEnsured = false;

const ensureStorageBucket = async () => {
  if (bucketEnsured) return;
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw badRequest('Supabase não configurado para armazenamento do DAS');
  }
  const supabase = createSupabaseClient({ useServiceRole: true });
  const { error } = await supabase.storage.createBucket(STORAGE_BUCKET, {
    public: false,
    fileSizeLimit: 10 * 1024 * 1024,
    allowedMimeTypes: ['application/pdf']
  });
  if (error && !String(error.message || '').toLowerCase().includes('already exists')) {
    throw badRequest(error.message || 'Falha ao criar bucket de PDFs');
  }
  bucketEnsured = true;
};

const normalizePeriodo = (value) => String(value || '').replace(/\D/g, '');

export const uploadAdminMeiGuidePdf = async ({ userId, periodoApuracao, pdfBuffer }) => {
  if (!userId) {
    throw badRequest('Usuário não informado para upload do PDF');
  }
  if (!pdfBuffer) {
    throw badRequest('PDF não informado para upload');
  }
  const periodo = normalizePeriodo(periodoApuracao);
  if (!periodo) {
    throw badRequest('Período de apuração inválido para upload');
  }
  await ensureStorageBucket();
  const supabase = createSupabaseClient({ useServiceRole: true });
  const path = `${userId}/mei-guide/${periodo}.pdf`;
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, pdfBuffer, {
      upsert: true,
      contentType: 'application/pdf'
    });
  if (error) {
    throw badRequest(error.message || 'Falha ao armazenar PDF do DAS');
  }
  return { bucket: STORAGE_BUCKET, path };
};

export const createSignedPdfUrl = async ({ bucket = STORAGE_BUCKET, path, expiresIn = DEFAULT_EXPIRATION_SECONDS }) => {
  if (!bucket || !path) {
    throw badRequest('Bucket ou caminho inválidos para URL assinada');
  }
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw badRequest('Supabase não configurado para assinar URL do PDF');
  }
  const supabase = createSupabaseClient({ useServiceRole: true });
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error) {
    throw badRequest(error.message || 'Falha ao gerar URL assinada');
  }
  if (!data?.signedUrl) {
    throw badRequest('URL assinada não retornada');
  }
  return data.signedUrl;
};
