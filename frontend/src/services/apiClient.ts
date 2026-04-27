import { buildApiErrorMessage } from '../utils/buildApiErrorMessage';
import { apiClientErrorFromPayload } from '../utils/apiClientError';

const isLocalhostUrl = (value?: string) => {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  } catch {
    return false;
  }
};

/** Garante que a URL seja absoluta (https:// ou http://). URLs relativas ou sem protocolo causam 405/404. */
const ensureAbsoluteApiUrl = (value: string | undefined, fallback: string): string => {
  if (!value || typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) return trimmed.replace(/\/$/, '');
  console.warn('[API Client] VITE_API_URL deve ser absoluta (https://...). Usando fallback:', fallback);
  return fallback;
};

const configuredApiUrl = import.meta.env.VITE_API_URL;
const DEFAULT_DEV_API_URL = 'http://localhost:3333';
// Removido fallback fixo da Vercel para evitar erros de deploy em novos ambientes
const fallbackUrl = import.meta.env.DEV ? DEFAULT_DEV_API_URL : '';
const API_URL = ensureAbsoluteApiUrl(configuredApiUrl, fallbackUrl);
const TOKEN_STORAGE_KEY = 'financas-pessoais-auth-token';

if (!API_URL) {
  console.warn('[API Client] VITE_API_URL não está configurada');
}

const shouldUseProxyInDev = import.meta.env.DEV
  && (!configuredApiUrl || !isLocalhostUrl(configuredApiUrl));

if (import.meta.env.DEV && configuredApiUrl && !isLocalhostUrl(configuredApiUrl)) {
  console.warn('[API Client] VITE_API_URL aponta para ambiente remoto em DEV. Usando proxy local /api.');
}

/** US-INV-05 pós-QA: não logar query `token` em falhas sobre validate público. */
export function redactInviteValidateTokenInUrlForLogs(url: string): string {
  if (!url.includes('/invites/validate')) return url;
  return url.replace(/([?&])token=[^&]*/gi, '$1token=[redacted]');
}

/** FR-ALNFB / NFR-ALNFB-01: não expor credenciais do portal em `console.error` do cliente HTTP. */
function redactPrefeituraCredentialsInObject(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(redactPrefeituraCredentialsInObject);
  if (typeof value !== 'object') return value;
  const o = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) {
    if (k === 'prefeitura' && v !== null && typeof v === 'object' && !Array.isArray(v)) {
      const p = v as Record<string, unknown>;
      out[k] = {
        ...p,
        ...(Object.prototype.hasOwnProperty.call(p, 'login') ? { login: '[redacted]' } : {}),
        ...(Object.prototype.hasOwnProperty.call(p, 'senha') ? { senha: '[redacted]' } : {})
      };
    } else {
      out[k] = redactPrefeituraCredentialsInObject(v);
    }
  }
  return out;
}

export function redactPrefeituraCredentialsForLogs(body: unknown): unknown {
  if (body === null || body === undefined) return body;
  if (typeof body === 'string') {
    const trimmed = body.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const parsed: unknown = JSON.parse(body);
        const redacted = redactPrefeituraCredentialsInObject(parsed);
        const s = JSON.stringify(redacted);
        return s.length > 1000 ? `${s.slice(0, 997)}…` : s;
      } catch {
        return body.length > 1000 ? `${body.slice(0, 997)}…` : body;
      }
    }
    return body.length > 1000 ? `${body.slice(0, 997)}…` : body;
  }
  return redactPrefeituraCredentialsInObject(body);
}

class ApiClient {
  baseUrl: string;

  constructor() {
    // Em DEV, prioriza o proxy local /api para evitar chamadas ao backend remoto.
    const base = shouldUseProxyInDev ? '' : (API_URL || '').replace(/\/$/, '');
    this.baseUrl = `${base}/api`;
  }

  private sanitizeHeaders(headers?: HeadersInit): Record<string, string> | undefined {
    if (!headers) return undefined;
    const sensitiveKeys = new Set(['authorization', 'x-api-key', 'cookie', 'set-cookie']);
    const parsed = new Headers(headers);
    const sanitized: Record<string, string> = {};

    parsed.forEach((value, key) => {
      sanitized[key] = sensitiveKeys.has(key.toLowerCase()) ? '[redacted]' : value;
    });

    return sanitized;
  }

  private logRequestFailure(details: {
    url: string;
    method: string;
    status?: number;
    statusText?: string;
    contentType?: string;
    headers?: HeadersInit;
    body?: unknown;
    error?: unknown;
  }): void {
    const normalizedBody = redactPrefeituraCredentialsForLogs(details.body);
    const headers = this.sanitizeHeaders(details.headers);
    const url = redactInviteValidateTokenInUrlForLogs(details.url);

    console.error('[API Client] Erro de requisição', {
      ...details,
      url,
      headers,
      body: normalizedBody
    });
  }

  private getAuthToken(): string | null {
    const tokenData = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!tokenData) return null;
    try {
      const parsed = JSON.parse(tokenData);
      return parsed.access_token || parsed.session?.access_token || null;
    } catch {
      // Fallback: token salvo como string pura
      return tokenData || null;
    }
  }

  setAuthToken(tokenData: {
    access_token: string;
    refresh_token?: string;
    expires_at?: number;
    user?: Record<string, unknown>;
  }): void {
    localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokenData));
  }

  clearAuthToken(): void {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    if (!API_URL) {
      throw new Error('VITE_API_URL não configurada');
    }

    const token = this.getAuthToken();
    const method = (options.method || 'GET').toUpperCase();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    };

    const url = `${this.baseUrl}${path}`;
    let response: Response;
    try {
      response = await fetch(url, {
        ...options,
        headers
      });
    } catch (error) {
      this.logRequestFailure({
        url,
        method,
        headers,
        error
      });
      // Erros aqui vêm do `fetch` antes de `Response`; para classificar rede vs HTTP, use `isFetchConnectivityFailure` (utils).
      throw error;
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await response.text();
      if (!response.ok) {
        this.logRequestFailure({
          url,
          method,
          status: response.status,
          statusText: response.statusText,
          contentType,
          headers,
          body: text
        });
        throw new Error(text || response.statusText);
      }
      return text as T;
    }

    const payload = await response.json();
    if (!response.ok || payload?.success === false) {
      this.logRequestFailure({
        url,
        method,
        status: response.status,
        statusText: response.statusText,
        contentType,
        headers,
        body: payload
      });
      throw apiClientErrorFromPayload(payload, buildApiErrorMessage, { httpStatus: response.status });
    }

    return payload?.data as T;
  }

  private async requestForm<T>(path: string, options: RequestInit = {}): Promise<T> {
    if (!API_URL) {
      throw new Error('VITE_API_URL não configurada');
    }

    const token = this.getAuthToken();
    const method = (options.method || 'GET').toUpperCase();
    const headers: HeadersInit = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    };

    const url = `${this.baseUrl}${path}`;
    let response: Response;
    try {
      response = await fetch(url, {
        ...options,
        headers
      });
    } catch (error) {
      this.logRequestFailure({
        url,
        method,
        headers,
        error
      });
      // Idem `request`: falha pré-Response → `isFetchConnectivityFailure` quando necessário na UI.
      throw error;
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await response.text();
      if (!response.ok) {
        this.logRequestFailure({
          url,
          method,
          status: response.status,
          statusText: response.statusText,
          contentType,
          headers,
          body: text
        });
        throw new Error(text || response.statusText);
      }
      return text as T;
    }

    const payload = await response.json();
    if (!response.ok || payload?.success === false) {
      this.logRequestFailure({
        url,
        method,
        status: response.status,
        statusText: response.statusText,
        contentType,
        headers,
        body: payload
      });
      throw apiClientErrorFromPayload(payload, buildApiErrorMessage, { httpStatus: response.status });
    }

    return payload?.data as T;
  }

  private extractFilename(contentDisposition?: string | null): string | null {
    if (!contentDisposition) return null;
    const match = /filename\*=UTF-8''([^;]+)|filename="([^"]+)"|filename=([^;]+)/i.exec(contentDisposition);
    const filename = match?.[1] || match?.[2] || match?.[3];
    return filename ? decodeURIComponent(filename.trim()) : null;
  }

  async requestBlob(path: string, options: RequestInit = {}): Promise<{ blob: Blob; filename: string | null }> {
    if (!API_URL) {
      throw new Error('VITE_API_URL não configurada');
    }

    const token = this.getAuthToken();
    const method = (options.method || 'GET').toUpperCase();
    const headers: HeadersInit = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    };

    const url = `${this.baseUrl}${path}`;
    let response: Response;
    try {
      response = await fetch(url, {
        ...options,
        headers
      });
    } catch (error) {
      this.logRequestFailure({
        url,
        method,
        headers,
        error
      });
      // Idem: `fetch` threw → util `isFetchConnectivityFailure`.
      throw error;
    }

    if (!response.ok) {
      const contentType = response.headers.get('content-type') || '';
      let errorMessage = response.statusText;

      if (contentType.includes('application/json')) {
        const payload = await response.json();
        if (payload && typeof payload === 'object' && payload.success === false) {
          this.logRequestFailure({
            url,
            method,
            status: response.status,
            statusText: response.statusText,
            contentType,
            headers,
            body: payload
          });
          throw apiClientErrorFromPayload(
            payload as { message?: string; errors?: unknown },
            buildApiErrorMessage,
            { httpStatus: response.status }
          );
        }
        errorMessage = buildApiErrorMessage(payload) || response.statusText;
      } else {
        const text = await response.text();
        errorMessage = text || response.statusText;
      }

      this.logRequestFailure({
        url,
        method,
        status: response.status,
        statusText: response.statusText,
        contentType,
        headers,
        body: errorMessage
      });

      throw new Error(errorMessage || 'Erro na requisição');
    }

    const contentDisposition = response.headers.get('content-disposition');
    const filename = this.extractFilename(contentDisposition);
    const blob = await response.blob();
    return { blob, filename };
  }

  get<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'GET' });
  }

  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      body: JSON.stringify(body || {})
    });
  }

  put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'PUT',
      body: JSON.stringify(body || {})
    });
  }

  patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'PATCH',
      body: JSON.stringify(body || {})
    });
  }

  postForm<T>(path: string, formData: FormData): Promise<T> {
    return this.requestForm<T>(path, {
      method: 'POST',
      body: formData
    });
  }

  delete<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'DELETE',
      body: JSON.stringify(body || {})
    });
  }
}

export const apiClient = new ApiClient();

/**
 * URL para `GET /health` na raiz do backend (rota fora de `/api`).
 * Em DEV com proxy Vite (base da API = `/api`), retorna `/health` para o proxy dedicado em `vite.config.ts`.
 * Caso contrário, usa o mesmo host resolvido que a API (`API_URL`).
 */
export function getBackendHealthCheckUrl(): string {
  const origin = shouldUseProxyInDev ? '' : (API_URL || '').replace(/\/$/, '');
  return origin ? `${origin}/health` : '/health';
}
