/**
 * US-MEI-NAT-04 (FR-N05) + FR-NAT-ERR-01: heurística para oferecer copy/link quando o Plugnotas recusa
 * cadastro ou emissão ligados à NFS-e Nacional (município/credenciamento/indisponibilidade), incluindo
 * exigência de IM/prefeitura sem a palavra «nacional» no texto (painel retry âmbar + `GuiaMeiEmpresaCadastroErrorPanel`).
 *
 * Mapeamento documentado também em `docs/operacao-mei-nfse.md` — âncora operacional
 * `NFSE_NACIONAL_OPERACAO_DOC_ANCHOR` (par `#plugnotas-nfse-nacional-spike-nat01` na mesma secção),
 * tabela de disparos em `#plugnotas-nfse-nacional-erros-mensagens`, contexto nacional vs municipal em
 * `#nfse-nacional-vs-municipal-cadastro`.
 * **FR-PREF-HINT-01 / PREF-L1:** `isPlugnotasNfseConfigPrefeituraRequirementMessage`, `getPlugnotasEmpresaCadastroErrorUxVariant`
 * — ver `docs/operacao-mei-nfse.md` (#nfse-config-prefeitura-cadastro-pref).
 */

/** Âncora principal em `docs/operacao-mei-nfse.md` (troubleshoot município/credenciamento). */
export const NFSE_NACIONAL_OPERACAO_DOC_ANCHOR = 'emissor-nfse-nacional-spike-nat01';

/** Prefixo quando consulta GET empresa falha com “não encontrado” após falha recente no POST empresa (FR-PREF-UX-01 §5.4). */
export const PLUGNOTAS_EMPRESA_CONSULT_PENDENTE_CADASTRO_PREFIX =
  'O cadastro ainda não foi concluído no emissor. Se você acabou de enviar os dados e viu um erro, resolva o erro acima e tente registrar de novo.';

/**
 * Variante de copy para erros de cadastro empresa Plugnotas.
 *
 * Mapeamento com a spec UX §3.2 (`ux-spec-plugnotas-nfse-config-prefeitura-payload-2026-04-08.md`):
 * - **PREF-L1** → `'prefeitura-config'` (copy §5.1 — `nfse.config.prefeitura` / config prefeitura no NFS-e).
 * - **PREF-L2** → `'municipal-generic'` (só IM / municipal sem gatilho L1; copy NAT §5.2).
 * - **Demais** (sem heurística municipal) → `'generic'` (equivalente a não mostrar bloco municipal especializado).
 *
 * Prioridade na função {@link getPlugnotasEmpresaCadastroErrorUxVariant}: L1 > L2 > generic.
 */
export type PlugnotasEmpresaCadastroErrorUxVariant =
  | 'generic'
  | 'municipal-generic'
  | 'prefeitura-config';

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

/**
 * PREF-L1: erro cita explicitamente **prefeitura na configuração NFS-e** (`nfse.config.prefeitura`), não só IM na raiz.
 * Subconjunto testado de `isPlugnotasEmpresaMunicipalRequirementMessage` quando ambos aplicam.
 */
export function isPlugnotasNfseConfigPrefeituraRequirementMessage(message: string): boolean {
  const m = normalizeForMatch(message);
  if (!m.trim()) return false;

  if (m.includes('nfce') && !m.includes('nfse')) return false;

  if (
    m.includes('nfse.config.prefeitura')
    || m.includes('fields.nfse.config.prefeitura')
    || m.includes('config.prefeitura')
  ) {
    return true;
  }

  if (!m.includes('prefeitura')) return false;

  const hasMandatory =
    m.includes('obrigator') ||
    m.includes('preenchimento') ||
    m.includes('required') ||
    m.includes('nao informad') ||
    m.includes('não informad');

  const configOrNfseContext =
    m.includes('nfse') ||
    m.includes('config') ||
    m.includes('validacao') ||
    m.includes('validação') ||
    m.includes('json') ||
    m.includes('empresa') ||
    m.includes('cadastro') ||
    m.includes('plugnotas');

  return hasMandatory && configOrNfseContext;
}

/** @see PlugnotasEmpresaCadastroErrorUxVariant — prioridade spec UX PREF-L1 > PREF-L2 > generic. */
export function getPlugnotasEmpresaCadastroErrorUxVariant(
  message: string
): PlugnotasEmpresaCadastroErrorUxVariant {
  if (isPlugnotasNfseConfigPrefeituraRequirementMessage(message)) return 'prefeitura-config';
  if (isPlugnotasEmpresaMunicipalRequirementMessage(message)) return 'municipal-generic';
  return 'generic';
}

/** Consulta GET empresa: resposta sugere ausência de cadastro (404 / não localizado / mensagens BFF típicas). */
export function isPlugnotasEmpresaConsultNotFoundMessage(message: string): boolean {
  const m = normalizeForMatch(message);
  if (!m.trim()) return false;
  if (/\b404\b/.test(m)) return true;
  if (m.includes('not found')) return true;
  if (m.includes('nao encontrad') || m.includes('não encontrad')) return true;
  if (m.includes('nao localizamos') && m.includes('empresa')) return true;
  if (m.includes('nao ha cadastro desta empresa') || m.includes('não há cadastro desta empresa')) return true;
  return false;
}

/**
 * UX §5.4: após falha recente no POST empresa (`plugnotasPendingRetry`), uma consulta GET que pareça
 * “cadastro inexistente” deve ganhar contexto — não deixar só “CNPJ não encontrado”.
 *
 * Função pura para testes de regressão (evita depender de RTL em `GuidesMei.tsx`).
 */
export function withPlugnotasEmpresaConsultPendingCadastroPrefixIfApplicable(
  formattedMessage: string,
  plugnotasPendingRetry: boolean
): string {
  if (plugnotasPendingRetry && isPlugnotasEmpresaConsultNotFoundMessage(formattedMessage)) {
    return `${PLUGNOTAS_EMPRESA_CONSULT_PENDENTE_CADASTRO_PREFIX}\n\n${formattedMessage}`;
  }
  return formattedMessage;
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
