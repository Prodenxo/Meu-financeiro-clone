/**
 * Indica se um valor parece ser um objeto `Response` ou encapsulamento com status HTTP utilizável.
 * Usado para não classificar erros “enriquecidos” (ex.: biblioteca que anexa `response`) como falha de rede pura.
 */
/**
 * Status HTTP “utilizável” em libs que anexam `response`: número finito ou string só com dígitos (ex. Axios em alguns ambientes).
 */
function responseHasLikelyHttpStatus(status: unknown): boolean {
  if (typeof status === 'number' && Number.isFinite(status)) return true;
  if (typeof status === 'string') {
    const t = status.trim();
    if (/^\d{1,3}$/.test(t)) {
      const n = Number(t);
      return Number.isFinite(n) && n >= 100 && n <= 599;
    }
  }
  return false;
}

function hasAttachedHttpStatus(error: unknown, seen: WeakSet<object>): boolean {
  if (error == null || typeof error !== 'object') return false;
  if (seen.has(error)) return false;
  seen.add(error);

  const record = error as Record<string, unknown>;
  const response = record.response;
  if (response != null && typeof response === 'object' && 'status' in response) {
    const status = (response as { status?: unknown }).status;
    if (responseHasLikelyHttpStatus(status)) return true;
  }

  const cause = record.cause;
  return hasAttachedHttpStatus(cause, seen);
}

/**
 * Padrões de mensagem/nome típicos quando `fetch` não obtém resposta HTTP utilizável (rede, CORS opaco, host inacessível).
 * Evita depender só de uma substring: combina com `TypeError` / `DOMException` quando aplicável.
 */
function isKnownFetchTransportMessage(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes('failed to fetch')
    || m.includes('load failed')
    || m.includes('networkerror when attempting to fetch')
    || m.includes('network request failed')
  );
}

/**
 * Retorna `true` quando o erro capturado no `catch` de `fetch` é **provavelmente** indisponibilidade de rede /
 * conexão (sem `Response` com status anexado à cadeia do erro).
 *
 * **Não** use para inferir sucesso HTTP: 4xx/5xx tratados pelo `apiClient` viram `Error` com mensagem de negócio
 * e, se no futuro forem enriquecidos com `response`, este util retorna `false`.
 *
 * **Não** classifica `AbortError` (cancelamento/timeout controlado) como conectividade.
 *
 * Padrões de mensagem de transporte aplicam-se a {@link TypeError} (e `DOMException` com nome `NetworkError`),
 * não a {@link Error} genérico — evita falso positivo se outra camada propagar texto igual ao do `fetch`.
 *
 * @param error Valor lançado ou rejeitado — ex.: do `catch` em torno de `fetch`.
 * @returns `true` se a falha parece transporte/rede; caso contrário `false`.
 */
export function isFetchConnectivityFailure(error: unknown): boolean {
  if (error == null) return false;
  if (hasAttachedHttpStatus(error, new WeakSet())) return false;

  if (typeof error !== 'object' && typeof error !== 'function') return false;

  const name = error instanceof Error ? error.name : (error as { name?: unknown }).name;
  if (name === 'AbortError') return false;

  if (typeof DOMException !== 'undefined' && error instanceof DOMException) {
    if (error.name === 'NetworkError') return true;
  }

  if (error instanceof TypeError) {
    return typeof error.message === 'string' && isKnownFetchTransportMessage(error.message);
  }

  return false;
}
