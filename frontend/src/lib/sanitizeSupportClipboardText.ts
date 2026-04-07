/**
 * NFR-ERR-03 — remove padrões sensíveis antes de copiar texto para suporte.
 * Defensivo: mesmo que o detalhe técnico venha mal formatado, evita propagar tokens.
 */
export function sanitizeSupportClipboardText(input: string): string {
  let t = input;

  t = t.replace(/\bBearer\s+[A-Za-z0-9\-._~+/]+=*\b/gi, '[redacted]');

  t = t.replace(/\beyJ[A-Za-z0-9_-]*\.eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]+\b/g, '[redacted]');

  t = t.replace(/token=[^\s&"'<>]+/gi, 'token=[redacted]');

  t = t.replace(/\b(?:Authorization|X-Api-Key)\s*:\s*[^\n\r]+/gi, '[redacted]');

  return t;
}
