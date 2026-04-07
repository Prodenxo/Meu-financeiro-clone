/**
 * Cache sessionStorage para GET empresa (NFR-UPD-DOC-01) — chave userId + CNPJ, TTL 3 min.
 * @see docs/stories/story-fr-upd-doc-p0-frontend-hidratacao-cache-patch.md
 */

const STORAGE_PREFIX = 'mei:empresaGet:v1:';

/** 3 min — meio do intervalo 2–5 min da arquitetura */
export const MEI_EMPRESA_GET_CACHE_TTL_MS = 3 * 60 * 1000;

const inFlight = new Map<string, Promise<unknown>>();

export function meiEmpresaGetCacheStorageKey(userId: string | null, cnpjDigits: string): string {
  const uid = userId?.trim() || 'anon';
  return `${STORAGE_PREFIX}${uid}:${cnpjDigits}`;
}

export function invalidateMeiEmpresaGetCache(userId: string | null, cnpjDigits: string): void {
  try {
    sessionStorage.removeItem(meiEmpresaGetCacheStorageKey(userId, cnpjDigits));
  } catch {
    /* quota / privado */
  }
}

type CachedEnvelope = { t: number; payload: unknown };

function readValidCachedPayload(key: string): unknown | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedEnvelope;
    if (typeof parsed?.t !== 'number' || !('payload' in parsed)) return null;
    if (Date.now() - parsed.t > MEI_EMPRESA_GET_CACHE_TTL_MS) {
      sessionStorage.removeItem(key);
      return null;
    }
    return parsed.payload;
  } catch {
    return null;
  }
}

/**
 * Uma sequência GET empresa por chave: dedupe em voo + TTL em sessionStorage.
 */
export async function fetchEmpresaJsonWithMeiCache(options: {
  userId: string | null;
  cnpjDigits: string;
  fetcher: () => Promise<unknown>;
}): Promise<unknown> {
  const { userId, cnpjDigits, fetcher } = options;
  const key = meiEmpresaGetCacheStorageKey(userId, cnpjDigits);

  const cached = readValidCachedPayload(key);
  if (cached !== null) {
    return cached;
  }

  const existing = inFlight.get(key);
  if (existing) {
    return existing;
  }

  const p = (async () => {
    const payload = await fetcher();
    try {
      const env: CachedEnvelope = { t: Date.now(), payload };
      sessionStorage.setItem(key, JSON.stringify(env));
    } catch {
      /* quota */
    }
    return payload;
  })();

  inFlight.set(key, p);
  try {
    return await p;
  } finally {
    inFlight.delete(key);
  }
}
