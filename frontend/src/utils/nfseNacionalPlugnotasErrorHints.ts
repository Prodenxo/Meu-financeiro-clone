/**
 * US-MEI-NAT-04 (FR-N05) + FR-NAT-ERR-01: heurística para oferecer copy/link quando o Plugnotas recusa
 * cadastro ou emissão ligados à NFS-e Nacional (município/credenciamento/indisponibilidade), incluindo
 * exigência de IM/prefeitura sem a palavra «nacional» no texto (painel retry âmbar + `GuiaMeiEmpresaCadastroErrorPanel`).
 *
 * Mapeamento documentado também em `docs/operacao-mei-nfse.md` — âncora operacional
 * `NFSE_NACIONAL_OPERACAO_DOC_ANCHOR` (par `#plugnotas-nfse-nacional-spike-nat01` na mesma secção),
 * tabela de disparos em `#plugnotas-nfse-nacional-erros-mensagens`, contexto nacional vs municipal em
 * `#nfse-nacional-vs-municipal-cadastro`.
 */

/** Âncora principal em `docs/operacao-mei-nfse.md` (troubleshoot município/credenciamento). */
export const NFSE_NACIONAL_OPERACAO_DOC_ANCHOR = 'emissor-nfse-nacional-spike-nat01';

/**
 * Padrões que disparam a dica (substring após normalização: minúsculas, sem acentos).
 * Ordem não importa para o match — ver `shouldOfferNfseNacionalOperacaoDocHint` e
 * `isPlugnotasEmpresaMunicipalRequirementMessage`.
 */
export const NFSE_NACIONAL_PLUGNOTAS_HINT_PATTERNS_DOC = [
  'nfse.nacional',
  'nfs-e nacional | nfse nacional | nfs e nacional',
  'emissao nacional (emissão nacional após normalização)',
  'ambiente nacional',
  'nota nacional (com nfse ou servico no texto)',
  'nacional + (municipio | prefeitura | credenci | aderiu | adesao)',
  'nacional + (indispon | nao dispon | nao suport)',
  'plugnotas + nacional + (nfse | nfs)',
  'inscricaomunicipal | inscricao + municipal',
  'prefeitura + contexto empresa/nfse (emitente | empresa | cadastro | plugnotas | nfse.config | config.prefeitura); nao nfce-only sem nfse'
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

/**
 * Mensagem do emissor sugere obrigatoriedade de **cadastro municipal** (IM ou prefeitura) no contexto de empresa/NFS-e.
 * Usar a mesma regra no painel âmbar de retry e em `GuiaMeiEmpresaCadastroErrorPanel` (arquitetura §4.2).
 */
export function isPlugnotasEmpresaMunicipalRequirementMessage(message: string): boolean {
  const m = normalizeForMatch(message);
  if (!m.trim()) return false;

  if (m.includes('inscricaomunicipal')) return true;
  if (m.includes('inscricao municipal')) return true;
  if (m.includes('inscricao') && m.includes('municipal')) return true;

  const hasPrefeitura = m.includes('prefeitura');
  if (!hasPrefeitura) return false;

  if (m.includes('nfce') && !m.includes('nfse')) return false;

  const empresaFiscalContext =
    m.includes('nfse') ||
    m.includes('emitente') ||
    m.includes('empresa') ||
    m.includes('cadastro') ||
    m.includes('plugnotas') ||
    m.includes('nfse.config') ||
    m.includes('config.prefeitura');

  return empresaFiscalContext;
}

export function getNfseNacionalOperacaoHelpHref(): string {
  if (meiOperacaoNfseDocUrl) {
    const base = meiOperacaoNfseDocUrl.replace(/#.*$/, '');
    return `${base}#${NFSE_NACIONAL_OPERACAO_DOC_ANCHOR}`;
  }
  return `/guia-mei-nfse-nacional.html#${NFSE_NACIONAL_OPERACAO_DOC_ANCHOR}`;
}

function shouldOfferNfseNacionalOperacaoDocHintNacionalPatterns(message: string): boolean {
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

/** Inclui padrões «NFS-e Nacional» e exigência municipal (IM/prefeitura) sem «nacional» no texto. */
export function shouldOfferNfseNacionalOperacaoDocHint(message: string): boolean {
  return (
    shouldOfferNfseNacionalOperacaoDocHintNacionalPatterns(message) ||
    isPlugnotasEmpresaMunicipalRequirementMessage(message)
  );
}
