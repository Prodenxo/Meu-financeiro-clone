/**
 * US-MEI-NAT-04 (FR-N05): heurística para oferecer copy/link quando o Plugnotas recusa
 * cadastro ou emissão ligados à NFS-e Nacional (município/credenciamento/indisponibilidade).
 *
 * Mapeamento documentado também em `docs/operacao-mei-nfse.md` (#plugnotas-nfse-nacional-erros-mensagens).
 * Ajustar os dois sítios em conjunto quando surgirem mensagens reais novas.
 */

/** Âncora principal em `docs/operacao-mei-nfse.md` (troubleshoot município/credenciamento). */
export const NFSE_NACIONAL_OPERACAO_DOC_ANCHOR = 'emissor-nfse-nacional-spike-nat01';

/**
 * Padrões que disparam a dica (substring após normalização: minúsculas, sem acentos).
 * Ordem não importa para o match — ver implementação em `shouldOfferNfseNacionalOperacaoDocHint`.
 */
export const NFSE_NACIONAL_PLUGNOTAS_HINT_PATTERNS_DOC = [
  'nfse.nacional',
  'nfs-e nacional | nfse nacional | nfs e nacional',
  'emissao nacional (emissão nacional após normalização)',
  'ambiente nacional',
  'nota nacional (com nfse ou servico no texto)',
  'nacional + (municipio | prefeitura | credenci | aderiu | adesao)',
  'nacional + (indispon | nao dispon | nao suport)',
  'plugnotas + nacional + (nfse | nfs)'
] as const;

const meiOperacaoNfseDocUrl =
  typeof import.meta.env.VITE_MEI_OPERACAO_NFSE_DOC_URL === 'string'
    ? import.meta.env.VITE_MEI_OPERACAO_NFSE_DOC_URL.trim()
    : '';

function normalizeForMatch(s: string): string {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function getNfseNacionalOperacaoHelpHref(): string {
  if (meiOperacaoNfseDocUrl) {
    const base = meiOperacaoNfseDocUrl.replace(/#.*$/, '');
    return `${base}#${NFSE_NACIONAL_OPERACAO_DOC_ANCHOR}`;
  }
  return `/guia-mei-nfse-nacional.html#${NFSE_NACIONAL_OPERACAO_DOC_ANCHOR}`;
}

export function shouldOfferNfseNacionalOperacaoDocHint(message: string): boolean {
  const m = normalizeForMatch(message);
  if (!m.trim()) return false;

  if (m.includes('nfse.nacional')) return true;
  if (m.includes('nfs-e nacional') || m.includes('nfse nacional') || m.includes('nfs e nacional')) return true;
  if (m.includes('emissao nacional')) return true;
  if (m.includes('ambiente nacional')) return true;
  if (
    m.includes('nota nacional') &&
    (m.includes('nfse') || m.includes('servico') || m.includes('nota de servico'))
  ) {
    return true;
  }

  if (m.includes('nacional')) {
    if (m.includes('municipio') || m.includes('prefeitura')) return true;
    if (m.includes('credenci')) return true;
    if (m.includes('aderiu') || m.includes('adesao')) return true;
    if (m.includes('indispon') || m.includes('nao dispon') || m.includes('nao suport')) return true;
  }

  if (m.includes('plugnotas') && m.includes('nacional') && (m.includes('nfse') || m.includes('nfs'))) {
    return true;
  }

  return false;
}
