/** Âncora em `docs/operacao-mei-nfse.md` (US-CONN-MEI-01). */
export const GUIMEI_CONNECTIVITY_DOC_ANCHOR = 'guia-mei-conectividade-local';

/**
 * Mensagem curta quando o envio do certificado falha por conectividade (sem resposta HTTP utilizável).
 * Sem URLs nem stack (NFR-01).
 */
export const GUIMEI_CONNECTIVITY_CERTIFICATE_MESSAGE =
  'Não foi possível contatar o servidor deste aplicativo. Verifique sua conexão e se o serviço está em execução. '
  + 'Isso não significa que o provedor de emissão fiscal recusou o certificado.';

/** Fallback em `public/` quando `VITE_MEI_OPERACAO_NFSE_DOC_URL` não está definido. */
export const GUIMEI_CONNECTIVITY_STATIC_HELP_PATH = '/guia-mei-conectividade-local.html';

/**
 * URL para a seção de conectividade local (repositório ou guia estático).
 */
export function getGuiaMeiConnectivityHelpHref(): string {
  const raw = typeof import.meta.env.VITE_MEI_OPERACAO_NFSE_DOC_URL === 'string'
    ? import.meta.env.VITE_MEI_OPERACAO_NFSE_DOC_URL.trim()
    : '';
  if (raw) {
    const base = raw.replace(/#.*$/, '');
    return `${base}#${GUIMEI_CONNECTIVITY_DOC_ANCHOR}`;
  }
  return `${GUIMEI_CONNECTIVITY_STATIC_HELP_PATH}#${GUIMEI_CONNECTIVITY_DOC_ANCHOR}`;
}
