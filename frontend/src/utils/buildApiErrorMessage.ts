/** Payload de erro JSON do backend (`success: false`). Testável sem instanciar ApiClient. */
export type ApiErrorPayload = {
  message?: string;
  /** Anexado com newline se não estiver já contido em `message`. */
  details?: string;
  errors?: {
    /** Código estável BFF (ex.: indisponibilidade Serpro no validate do guia MEI). */
    code?: string;
    /** Código estável de negócio (ex.: US-MEI-FISC-02). */
    plugnotasCode?: string;
    plugnotasRequest?: { method?: string; path?: string };
    plugnotasUpdateAttempts?: Array<{
      method?: string;
      path?: string;
      status?: number | null;
      message?: string;
    }>;
  };
};

/**
 * Monta a string lançada em `throw new Error(...)` para respostas JSON de erro.
 * Inclui método/path do emissor e tentativas quando presentes em `errors`.
 */
export function buildApiErrorMessage(payload: ApiErrorPayload | null | undefined): string {
  const base = payload?.message || 'Erro na requisição';
  const det = typeof payload?.details === 'string' ? payload.details.trim() : '';
  let text = base;
  if (det && !base.includes(det)) {
    text = `${base}\n${det}`;
  }
  const pr = payload?.errors?.plugnotasRequest;
  if (pr && typeof pr.method === 'string' && typeof pr.path === 'string') {
    return `${text} (${pr.method} ${pr.path} no emissor fiscal)`;
  }
  const attempts = payload?.errors?.plugnotasUpdateAttempts;
  if (Array.isArray(attempts) && attempts.length > 0) {
    const summary = attempts
      .map((a) => {
        const m = typeof a.method === 'string' ? a.method : '?';
        const p = typeof a.path === 'string' ? a.path : '?';
        const st = a.status != null ? String(a.status) : '?';
        return `${m} ${p} → HTTP ${st}`;
      })
      .join('; ');
    return `${text} [Tentativas do emissor: ${summary}]`;
  }
  return text;
}
