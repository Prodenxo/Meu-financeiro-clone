import 'server-only';

/** Base da API Express (`MEI_API_URL`), só no servidor. Rotas ficam em `/api/*`. */
export function getBackendApiBase() {
  const url = process.env.MEI_API_URL?.trim().replace(/\/$/, '');
  return url ? `${url}/api` : null;
}

/** Chamada à API Express. Resposta padrão `{ success, data, message }`. */
export async function backendFetch(path, { method = 'GET', body, token } = {}) {
  const base = getBackendApiBase();
  if (!base) throw new Error('API do Meu Financeiro não configurada (MEI_API_URL).');

  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });

  const contentType = res.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await res.json() : null;
  if (!res.ok || payload?.success === false) {
    throw new Error(payload?.message || payload?.error || `Falha na API (${res.status}).`);
  }
  return payload?.data ?? payload;
}
