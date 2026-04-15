import {
  MEI_GUIDE_SERPRO_UNAVAILABLE,
  MEI_GUIDE_VALIDATE_CONS_C_TITLE
} from './mapMeiGuideValidateErrorToUserMessage';

/**
 * US-MEI-NAT-04 (FR-N05) + FR-NAT-ERR-01: heurística para oferecer copy/link quando o Plugnotas recusa
 * cadastro ou emissão ligados à NFS-e Nacional (município/credenciamento/indisponibilidade), incluindo
 * exigência de IM/prefeitura sem a palavra «nacional» no texto (painel retry âmbar + `GuiaMeiEmpresaCadastroErrorPanel`).
 *
 * Mapeamento documentado também em `docs/operacao-mei-nfse.md` — âncora operacional
 * `NFSE_NACIONAL_OPERACAO_DOC_ANCHOR` (par `#plugnotas-nfse-nacional-spike-nat01` na mesma secção),
 * tabela de disparos em `#plugnotas-nfse-nacional-erros-mensagens`, contexto nacional vs municipal em
 * `#nfse-nacional-vs-municipal-cadastro`.
 * **FR-CONS-P1:** erros de validação guia / Serpro (CONS-C) não disparam dica NFS-e Nacional — ver `isMeiGuideSerproConsCUserFacingText` e `MEI_GUIDE_SERPRO_UNAVAILABLE`.
 *
 * **FR-PREF-HINT-01 / PREF-L1:** `isPlugnotasNfseConfigPrefeituraRequirementMessage`, `getPlugnotasEmpresaCadastroErrorUxVariant`
 * — ver `docs/operacao-mei-nfse.md` (#nfse-config-prefeitura-cadastro-pref).
 *
 * **FR-PLOGIN / PLOGIN-UX-L1:** `isPlugnotasPrefeituraLoginRequiredMessage`, variante **`prefeitura-login-required`**
 * — `ux-spec-400-nfse-prefeitura-login-obrigatorio-plugnotas-2026-04-09.md` secção 5 (distinto de TIBGE e de PREF só com `codigoIbge`/config genérica).
 *
 * **DP-PLOGIN-02:** o identificador estável `prefeitura_ibge_apenas_insuficiente_dp02` (bloqueio BFF antes do emissor) e a copy
 * ao utilizador estão em `mapMeiFiscalErrorToCopy` (`frontend/src/lib/fiscalUserError.ts`). Este ficheiro re-exporta a constante
 * (`PLUGNOTAS_CODE_PREFEITURA_IBGE_APENAS_INSUFICIENTE_DP02`) para rastreio; testes de desambiguação com TIBGE-L1 / PREF-L1 em `nfseNacionalPlugnotasErrorHints.test.ts`.
 *
 * **FR-CID-UX-02 / CID-L1; FR-TIBGE-UX-01 / TIBGE-L1:** `isPlugnotasEmpresaIbgeCidadeMessage` — spec UX
 * `ux-spec-plugnotas-empresa-codigo-cidade-ibge-2026-04-08.md` §3.2;
 * `ux-spec-correcao-ibge-tabela-plugnotas-400-get-404-2026-04-09.md` §3.1 (campo `codigoIBGECidade` na mensagem do emissor).
 * PRD: `PRD-correcao-ibge-tabela-plugnotas-400-get-404-2026-04-09.md` (**NFR-TIBGE-02:** payload continua só `endereco.codigoCidade`).
 */

/** Spec UX §4.2 — prestador / cidade de prestação (linha curta). */
export const MEI_IBGE_CIDADE_PRESTACAO_PRESTADOR_FIELD_HINT = 'Sete dígitos, conforme IBGE.';

/** Spec UX §6.2 — linha secundária no alerta fiscal quando CID-L1 (FR-CID-UX-02). */
export const MEI_IBGE_CIDADE_ALERT_SECONDARY_HINT =
  'Se o erro citar código IBGE ou tabela de cidades, confira se o município e o código de 7 dígitos batem com o endereço do CNPJ ou com a consulta oficial do IBGE.';

/** Âncora principal em `docs/operacao-mei-nfse.md` (troubleshoot município/credenciamento). */
export const NFSE_NACIONAL_OPERACAO_DOC_ANCHOR = 'emissor-nfse-nacional-spike-nat01';

/** Prefixo quando consulta GET empresa falha com “não encontrado” após falha recente no POST empresa (FR-PREF-UX-01 §5.4). */
export const PLUGNOTAS_EMPRESA_CONSULT_PENDENTE_CADASTRO_PREFIX =
  'O cadastro ainda não foi concluído no emissor. Se você acabou de enviar os dados e viu um erro, resolva o erro acima e tente registrar de novo.';

/**
 * Variante de copy para erros de cadastro empresa Plugnotas.
 *
 * Mapeamento com a spec UX §3.2 (`ux-spec-plugnotas-nfse-config-prefeitura-payload-2026-04-08.md`):
 * - **PLOGIN-UX-L1** → `'prefeitura-login-required'` (login/senha do portal municipal obrigatórios no JSON — ver spec PLOGIN).
 * - **PREF-L1** → `'prefeitura-config'` (copy §5.1 — `nfse.config.prefeitura` / config prefeitura no NFS-e sem subcaso login).
 * - **PREF-L2** → `'municipal-generic'` (só IM / municipal sem gatilho L1; copy NAT §5.2).
 * - **Demais** (sem heurística municipal) → `'generic'` (equivalente a não mostrar bloco municipal especializado).
 *
 * Prioridade na função {@link getPlugnotasEmpresaCadastroErrorUxVariant}: PLOGIN-L1 > PREF-L1 > L2 > generic.
 */
export type PlugnotasEmpresaCadastroErrorUxVariant =
  | 'generic'
  | 'municipal-generic'
  | 'prefeitura-config'
  | 'prefeitura-login-required';

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

/**
 * PLOGIN-UX-L1 (spec UX §5.1): emissor exige **login** e/ou **senha** do portal municipal em `nfse.config.prefeitura`.
 * **Não** cobre o aviso BFF de credenciais desactivadas (DP-PLOGIN-01 — manter `prefeitura-config`).
 *
 * FR-ALNFB / UX §7.3: abrir o formulário de credenciais na Guia MEI depende de `runtimeDecision` + feature flag —
 * estas heurísticas de texto **não** substituem essa classificação.
 */
export function isPlugnotasPrefeituraLoginRequiredMessage(message: string): boolean {
  const m = normalizeForMatch(message);
  if (!m.trim()) return false;

  if (m.includes('nfce') && !m.includes('nfse')) return false;

  if (m.includes('prefeitura_login_required_blocked')) return true;

  const hasPathLoginOrSenha =
    m.includes('prefeitura.login') ||
    m.includes('prefeitura.senha') ||
    m.includes('config.prefeitura.login') ||
    m.includes('config.prefeitura.senha') ||
    m.includes('nfse.config.prefeitura.login') ||
    m.includes('nfse.config.prefeitura.senha');

  const mandatory =
    m.includes('obrigator') ||
    m.includes('required') ||
    m.includes('preenchiment') ||
    m.includes('nao informad') ||
    m.includes('não informad');

  const hasPrefeitura = m.includes('prefeitura');
  const nfseOrConfigContext =
    m.includes('nfse') ||
    m.includes('config') ||
    m.includes('fields.') ||
    m.includes('empresa') ||
    m.includes('cadastro') ||
    m.includes('plugnotas') ||
    m.includes('json');

  const loginPlusMandatory =
    hasPrefeitura &&
    m.includes('login') &&
    mandatory &&
    nfseOrConfigContext;

  const senhaPlusMandatory =
    hasPrefeitura &&
    m.includes('senha') &&
    mandatory &&
    nfseOrConfigContext;

  return Boolean(hasPathLoginOrSenha || loginPlusMandatory || senhaPlusMandatory);
}

/**
 * CID-L1 / **TIBGE-L1** (spec UX §3.1–3.2): mensagem indica falha no código IBGE do município / tabela de cidades do emissor.
 * Inclui citações a **`fields.endereco.codigoIBGECidade`** no texto Plugnotas (após `normalizeForMatch`: `codigoibgecidade`).
 * **NFR-TIBGE-02:** o JSON enviado pela app mantém apenas **`endereco.codigoCidade`** — não duplicar `codigoIBGECidade` no payload.
 * **Não** corresponde a mensagem só PREF-L1 (`nfse.config.prefeitura`) sem estes sinais — ver FR-CID P1 / FR-TIBGE P1.
 */
export function isPlugnotasEmpresaIbgeCidadeMessage(message: string): boolean {
  const m = normalizeForMatch(message);
  if (!m.trim()) return false;

  const hasEnderecoCodigoCidade =
    m.includes('endereco.codigocidade') ||
    m.includes('fields.endereco.codigocidade');

  // Evitar `municip` (casa com «inscricaoMunicipal» / «municipal» sem ser município IBGE) — follow-up QA FR-CID P1.
  const hasTabelaIbge =
    m.includes('ibge') &&
    m.includes('tabela') &&
    (m.includes('cidades') ||
      m.includes('cidade') ||
      m.includes('municipio') ||
      m.includes('municipios'));

  /** Inclui **TIBGE-L1**: `codigoIBGECidade` / `fields.endereco.codigoIBGECidade` (substring `codigoibgecidade` após normalizar). */
  const hasCodigoIbgeMunicipio =
    m.includes('ibge') &&
    (m.includes('codigocidade') ||
      m.includes('codigo ibge') ||
      m.includes('codigo do municipio') ||
      m.includes('codigoibgecidade'));

  return hasEnderecoCodigoCidade || hasTabelaIbge || hasCodigoIbgeMunicipio;
}

/** @see PlugnotasEmpresaCadastroErrorUxVariant — prioridade PLOGIN-UX-L1 > PREF-L1 > PREF-L2 > generic. */
export function getPlugnotasEmpresaCadastroErrorUxVariant(
  message: string
): PlugnotasEmpresaCadastroErrorUxVariant {
  if (isPlugnotasPrefeituraLoginRequiredMessage(message)) return 'prefeitura-login-required';
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

/** Contexto CONS-B: painel retry visível e/ou marcador de sessão SOL-P1 (POST fase 2 falhou). */
export type PlugnotasEmpresaConsultConsBContext = {
  pendingRetryPanel: boolean;
  sessionPostFailedFlag: boolean;
};

/**
 * UX §5.4 + FR-CONS-P1: após falha no POST empresa, consulta GET “não encontrada” deve ganhar contexto —
 * não só quando o painel âmbar está visível, mas também quando a flag de sessão SOL-P1 está activa.
 *
 * Função pura para testes de regressão (evita depender de RTL em `GuidesMei.tsx`).
 */
export function withPlugnotasEmpresaConsultPendingCadastroPrefixIfApplicable(
  formattedMessage: string,
  context: PlugnotasEmpresaConsultConsBContext | boolean
): string {
  const pendingRetryPanel = typeof context === 'boolean' ? context : context.pendingRetryPanel;
  const sessionPostFailedFlag =
    typeof context === 'boolean' ? false : context.sessionPostFailedFlag;
  if (
    (pendingRetryPanel || sessionPostFailedFlag) &&
    isPlugnotasEmpresaConsultNotFoundMessage(formattedMessage)
  ) {
    return `${PLUGNOTAS_EMPRESA_CONSULT_PENDENTE_CADASTRO_PREFIX}\n\n${formattedMessage}`;
  }
  return formattedMessage;
}

/** Texto visível alinhado à copy CONS-C / Serpro (validação guia) — não misturar com hints Plugnotas. */
export function isMeiGuideSerproConsCUserFacingText(message: string): boolean {
  const m = normalizeForMatch(message);
  if (!m.trim()) return false;
  if (m.includes(normalizeForMatch(MEI_GUIDE_VALIDATE_CONS_C_TITLE))) return true;
  if (m.includes('nao foi possivel validar o cnpj com a receita federal')) return true;
  if (m.includes(normalizeForMatch(MEI_GUIDE_SERPRO_UNAVAILABLE))) return true;
  if (m.includes('validacao do guia') && m.includes('receita federal')) return true;
  return false;
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

/**
 * Inclui padrões «NFS-e Nacional» e exigência municipal (IM/prefeitura) sem «nacional» no texto.
 * @param fiscalApiErrorCode — quando `MEI_GUIDE_SERPRO_UNAVAILABLE`, não oferecer dica (FR-CONS-P1).
 */
export function shouldOfferNfseNacionalOperacaoDocHint(
  message: string,
  fiscalApiErrorCode?: string | null
): boolean {
  if (fiscalApiErrorCode === MEI_GUIDE_SERPRO_UNAVAILABLE) return false;
  if (isMeiGuideSerproConsCUserFacingText(message)) return false;
  return (
    isPlugnotasPrefeituraLoginRequiredMessage(message) ||
    shouldOfferNfseNacionalOperacaoDocHintNacionalPatterns(message) ||
    isPlugnotasEmpresaMunicipalRequirementMessage(message)
  );
}

/** DP-PLOGIN-02 — mesmo valor que `errors.plugnotasCode` no BFF; copy canónica em `mapMeiFiscalErrorToCopy` (`fiscalUserError.ts`). */
export {
  PLUGNOTAS_CODE_PREFEITURA_IBGE_APENAS_INSUFICIENTE_DP02,
  PLUGNOTAS_CODE_PREFEITURA_LOGIN_REQUIRED_BLOCKED
} from '../lib/fiscalUserError';
