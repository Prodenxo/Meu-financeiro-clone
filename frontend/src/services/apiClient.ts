const isLocalhostUrl = (value?: string) => {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  } catch {
    return false;
  }
};

const configuredApiUrl = import.meta.env.VITE_API_URL;
const DEFAULT_DEV_API_URL = 'http://localhost:3333';
const DEFAULT_PROD_API_URL = 'https://meu-financeiro-backend.vercel.app';
const API_URL = configuredApiUrl || (import.meta.env.DEV ? DEFAULT_DEV_API_URL : DEFAULT_PROD_API_URL);
const TOKEN_STORAGE_KEY = 'financas-pessoais-auth-token';

if (!API_URL) {
  console.warn('[API Client] VITE_API_URL não está configurada');
}

if (import.meta.env.DEV && configuredApiUrl && !isLocalhostUrl(configuredApiUrl)) {
  console.warn('[API Client] VITE_API_URL aponta para ambiente remoto em DEV');
}

class ApiClient {
  baseUrl: string;

  constructor() {
    const trimmed = (API_URL || '').replace(/\/$/, '');
    this.baseUrl = `${trimmed}/api`;
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
    const normalizedBody = typeof details.body === 'string'
      ? details.body.slice(0, 1000)
      : details.body;
    const headers = this.sanitizeHeaders(details.headers);

    console.error('[API Client] Erro de requisição', {
      ...details,
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
      throw new Error(payload?.message || 'Erro na requisição');
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
      throw new Error(payload?.message || 'Erro na requisição');
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
      throw error;
    }

    if (!response.ok) {
      const contentType = response.headers.get('content-type') || '';
      let errorMessage = response.statusText;

      if (contentType.includes('application/json')) {
        const payload = await response.json();
        errorMessage = payload?.message || response.statusText;
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
