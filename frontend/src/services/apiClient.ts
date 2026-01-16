const API_URL = import.meta.env.VITE_API_URL
  || (import.meta.env.DEV ? 'https://meu-financeiro-backend.vercel.app' : '');
const TOKEN_STORAGE_KEY = 'financas-pessoais-auth-token';

if (!API_URL) {
  console.warn('[API Client] VITE_API_URL não está configurada');
}

class ApiClient {
  baseUrl: string;

  constructor() {
    const trimmed = (API_URL || '').replace(/\/$/, '');
    this.baseUrl = `${trimmed}/api`;
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

    console.error('[API Client] Erro de requisição', {
      ...details,
      body: normalizedBody
    });
  }

  private getAuthToken(): string | null {
    const tokenData = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!tokenData) return null;
    try {
      const parsed = JSON.parse(tokenData);
      return parsed.access_token || null;
    } catch {
      return null;
    }
  }

  setAuthToken(tokenData: {
    access_token: string;
    refresh_token?: string;
    expires_at?: number;
    user?: any;
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

  get<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'GET' });
  }

  post<T>(path: string, body?: any): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      body: JSON.stringify(body || {})
    });
  }

  put<T>(path: string, body?: any): Promise<T> {
    return this.request<T>(path, {
      method: 'PUT',
      body: JSON.stringify(body || {})
    });
  }

  delete<T>(path: string, body?: any): Promise<T> {
    return this.request<T>(path, {
      method: 'DELETE',
      body: JSON.stringify(body || {})
    });
  }
}

export const apiClient = new ApiClient();
