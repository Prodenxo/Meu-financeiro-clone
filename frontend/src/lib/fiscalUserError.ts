import {
  isPlugnotasGatewayUpstreamCode,
  PLUGNOTAS_CODE_CERTIFICADO_409_SEM_ID,
} from '../utils/plugnotasApiErrorCode';

/** DP-PLOGIN-02 — BFF bloqueia cadastro só com IBGE em município da lista (`prefeituraIbgeOnlyBlock.js`). */
export const PLUGNOTAS_CODE_PREFEITURA_IBGE_APENAS_INSUFICIENTE_DP02 =
  'prefeitura_ibge_apenas_insuficiente_dp02';
export const PLUGNOTAS_CODE_PREFEITURA_LOGIN_REQUIRED_BLOCKED =
  'prefeitura_login_required_blocked';
/** BFF classificação FR-ALNFB — segundo passo municipal disponível (credenciais). */
export const PLUGNOTAS_CODE_PREFEITURA_LOGIN_REQUIRED_FALLBACK_AVAILABLE =
  'prefeitura_login_required_fallback_available';
import {
  getPlugnotasCodeFromUnknownError,
  getHttpStatusFromUnknownError,
  getRuntimeDecisionFromUnknownError,
  type PlugnotasRequestMeta
} from '../utils/apiClientError';
import type { EmpresaCadastroRuntimeDecision } from '../types/empresaCadastroRuntimeDecision';

/** Alinhado à Story 6.3 / Guia MEI: acima disto, mensagem longa exige expansão ou área rolável. */
export const FISCAL_ERROR_LONG_THRESHOLD = 300;

/** Fallback global (spec UX-GLOBAL-06 / FR-UX-GLOBAL-B06) — sem corpo técnico ao utilizador. */
export const MEI_FISCAL_ERROR_FALLBACK_DESCRIPTION =
  'Não foi possível concluir o pedido. Tenta de novo. Se persistir, contacta o suporte.';

export type MeiFiscalUserCopy = {
  title: string;
  description: string;
  actionLabel?: string;
  href?: string;
  /** Gateway upstream Plugnotas (502–504): UI suprime HTML bruto e ajusta rodapé. */
  gatewayUpstream?: boolean;
};

export type MeiFiscalScenario =
  | 'success_nacional'
  | 'ambiente_configuracao'
  | 'payload_contrato'
  | 'fallback_sync'
  | 'prefeitura_ibge_apenas_insuficiente_dp02'
  | 'prefeitura_login_required_blocked'
  | 'prefeitura_login_required_fallback_available'
  | 'empresa_nao_cadastrada';

function normalizePlugnotasRequestMeta(
  value: PlugnotasRequestMeta | null | undefined
): PlugnotasRequestMeta | null {
  if (!value) return null;
  const method = String(value.method || '').trim().toUpperCase();
  const path = String(value.path || '').trim();
  if (!method || !path) return null;
  return { method, path };
}

export function stripPlugnotasRequestSuffix(
  rawMessage: string,
  plugnotasRequest?: PlugnotasRequestMeta | null
): string {
  const normalized = normalizePlugnotasRequestMeta(plugnotasRequest);
  const raw = String(rawMessage || '').trim();
  if (!raw || !normalized) return raw;
  const escapedMethod = normalized.method.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedPath = normalized.path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const suffix = new RegExp(`\\s*\\(${escapedMethod}\\s+${escapedPath}\\s+no emissor fiscal\\)$`, 'i');
  return raw.replace(suffix, '').trim();
}

/** Paridade com `PLUGNOTAS_GATEWAY_UPSTREAM_PUBLIC_MESSAGE_PT` no backend. */
export const MEI_FISCAL_GATEWAY_UPSTREAM_DESCRIPTION =
  'O emissor fiscal não está a responder neste momento (erro temporário no servidor). '
  + 'Tente de novo dentro de alguns minutos. Se o problema continuar, confirme no servidor a URL e a chave '
  + 'de API do emissor, ou contacte o suporte do emissor fiscal.';

export const MEI_FISCAL_GATEWAY_SOURCE_FOOTNOTE =
  'Esta mensagem refere-se ao serviço de emissão de notas (emissor fiscal). Neste caso indica indisponibilidade '
  + 'temporária, não rejeição do seu certificado ou dos dados preenchidos.';

function isGatewayHttpStatus(status: number | null | undefined): boolean {
  const s = Number(status);
  return s === 502 || s === 503 || s === 504;
}

/** Heurística para respostas HTML de proxy (legado antes da normalização BFF). */
export function isLikelyPlugnotasGatewayRawMessage(raw: string): boolean {
  const t = raw.trim();
  if (!t) return false;
  const lower = t.toLowerCase();
  if (lower.includes('<html') && (lower.includes('502') || lower.includes('bad gateway'))) return true;
  if (lower.includes('502 bad gateway')) return true;
  if (lower.includes('503 service unavailable')) return true;
  if (lower.includes('504 gateway timeout')) return true;
  return false;
}

export function isMeiFiscalGatewayUpstreamError(input: {
  rawMessage: string;
  plugnotasCode?: string | null;
  httpStatus?: number | null;
}): boolean {
  if (isPlugnotasGatewayUpstreamCode(input.plugnotasCode)) return true;
  if (isGatewayHttpStatus(input.httpStatus)) return true;
  return isLikelyPlugnotasGatewayRawMessage(input.rawMessage);
}

export function resolveMeiFiscalScenario(input: {
  rawMessage: string;
  plugnotasCode?: string | null;
  httpStatus?: number | null;
  plugnotasRequest?: PlugnotasRequestMeta | null;
  operation?: string | null;
  /** Precedência sobre heurísticas de código — arquitetura §9.5 (FR-ALNFB). */
  runtimeDecision?: EmpresaCadastroRuntimeDecision | null;
}): MeiFiscalScenario | null {
  const rd = input.runtimeDecision;
  const rdScenario = typeof rd?.scenario === 'string' ? rd.scenario.trim() : '';
  if (rdScenario === 'prefeitura_login_required_fallback_available') {
    return 'prefeitura_login_required_fallback_available';
  }
  if (rdScenario === 'prefeitura_login_required_blocked') {
    return 'prefeitura_login_required_blocked';
  }

  const code = input.plugnotasCode?.trim() || null;
  const request = normalizePlugnotasRequestMeta(input.plugnotasRequest);
  const raw = stripPlugnotasRequestSuffix(input.rawMessage || '', request);
  const lower = raw.toLowerCase();
  const operation = String(input.operation || '').trim().toLowerCase();

  if (code === PLUGNOTAS_CODE_PREFEITURA_IBGE_APENAS_INSUFICIENTE_DP02) {
    return 'prefeitura_ibge_apenas_insuficiente_dp02';
  }
  if (code === PLUGNOTAS_CODE_PREFEITURA_LOGIN_REQUIRED_BLOCKED) {
    return 'prefeitura_login_required_blocked';
  }
  if (code === PLUGNOTAS_CODE_PREFEITURA_LOGIN_REQUIRED_FALLBACK_AVAILABLE) {
    return 'prefeitura_login_required_fallback_available';
  }
  if (
    code === 'ambiente_configuracao'
    || isMeiFiscalGatewayUpstreamError({
      rawMessage: raw,
      plugnotasCode: code,
      httpStatus: input.httpStatus,
    })
    || /\b401\b/.test(raw)
    || /\b403\b/.test(raw)
    || lower.includes('unauthorized')
    || lower.includes('forbidden')
    || lower.includes('token inválido')
    || lower.includes('token invalido')
    || lower.includes('url base')
    || lower.includes('ambiente incorreto')
    || lower.includes('a chamada')
      && lower.includes('url base')
  ) {
    return 'ambiente_configuracao';
  }
  if (operation === 'updated' || operation === 'existing') {
    return 'fallback_sync';
  }
  if (
    code === 'payload_contrato'
    || (
      request?.method === 'POST'
      && request.path === '/empresa'
      && Number(input.httpStatus) === 400
    )
  ) {
    return 'payload_contrato';
  }
  if (
    code === 'empresa_nao_cadastrada'
    || (
      request?.method === 'GET'
      && request.path.startsWith('/empresa/')
      && (
        lower.includes('não localizamos')
        || lower.includes('nao localizamos')
        || lower.includes('não encontrou cadastro')
        || lower.includes('nao encontrou cadastro')
        || lower.includes('não há cadastro desta empresa no emissor fiscal')
        || lower.includes('nao ha cadastro desta empresa no emissor fiscal')
      )
    )
  ) {
    return 'empresa_nao_cadastrada';
  }
  if (operation === 'created') {
    return 'success_nacional';
  }
  return null;
}

function meiOperacaoNfseDocBase(): string {
  const raw = typeof import.meta.env.VITE_MEI_OPERACAO_NFSE_DOC_URL === 'string'
    ? import.meta.env.VITE_MEI_OPERACAO_NFSE_DOC_URL.trim()
    : '';
  return raw ? raw.replace(/#.*$/, '') : '';
}

/** Âncora alinhada a `frontend/public/guia-mei-certificado-409-sem-id.html`. */
export const CERTIFICADO_EMISSOR_409_SEM_ID_DOC_ANCHOR = 'certificado-emissor-409-sem-id';

function hrefCertificado409SemId(): string {
  const base = meiOperacaoNfseDocBase();
  const hash = `#${CERTIFICADO_EMISSOR_409_SEM_ID_DOC_ANCHOR}`;
  if (base) return `${base}${hash}`;
  return `/guia-mei-certificado-409-sem-id.html${hash}`;
}

/** Texto que parece JSON de API — não mostrar como mensagem principal ao utilizador. */
export function looksLikeOpaqueApiPayload(text: string): boolean {
  const t = text.trim();
  if (t.length < 60) return false;
  if (t.startsWith('{') && t.includes('"') && (t.includes('"message"') || t.includes('"errors"'))) {
    return true;
  }
  if (t.startsWith('[') && t.includes('{')) return true;
  return false;
}

function normalizeMsg(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/** Pistas de validação fiscal / provedor — mensagens curtas com estes termos ainda são acionáveis (seg. QA POSQA-3). */
const FISCAL_PROVIDER_CONTENT_HINT =
  /\b(ncm|cfop|cst|icms|pis|cofins|sefaz|rejei[cç][aã]o|plugnotas|modelo\s*65|nf-?e|nfc-?e|itens?\s*\[|schema\s+xml)/i;

/**
 * Texto que parece mensagem útil do provedor (campos, rejeição SEFAZ), não JSON opaco nem stack interno.
 * Usado após `looksLikeOpaqueApiPayload` — não revalidar JSON aqui.
 */
export function isLikelyUserFacingFiscalValidationMessage(text: string): boolean {
  const t = text.trim();
  if (t.length > 8000) return false;
  const lower = t.toLowerCase();
  if (
    /unexpected token|syntaxerror|referenceerror|internal server error|econnrefused|etimedout|fetch failed|networkerror/i.test(
      lower
    )
  ) {
    return false;
  }
  if (/\bat\s+\w+\s*\([^)]*\.(ts|js|jsx|tsx):\d+\)/i.test(t)) return false;
  if (/^\s*err_[a-z0-9_]+\b/i.test(t) && t.length < 120) return false;
  const minLen = FISCAL_PROVIDER_CONTENT_HINT.test(t) ? 8 : 12;
  if (t.length < minLen) return false;
  return true;
}

/**
 * Mapeia `plugnotasCode` e/ou texto bruto da API para copy humana + próximo passo.
 * Ordem: código estável → padrões HTTP/rede → heurísticas do emissor/fornecedor → mensagem explícita conhecida → fallback global.
 */
export function mapMeiFiscalErrorToCopy(input: {
  rawMessage: string;
  plugnotasCode?: string | null;
  httpStatus?: number | null;
  plugnotasRequest?: PlugnotasRequestMeta | null;
  runtimeDecision?: EmpresaCadastroRuntimeDecision | null;
}): MeiFiscalUserCopy {
  const code = input.plugnotasCode?.trim() || null;
  const request = normalizePlugnotasRequestMeta(input.plugnotasRequest);
  const raw = stripPlugnotasRequestSuffix(input.rawMessage || '', request);
  const lower = raw.toLowerCase();
  const scenario = resolveMeiFiscalScenario({
    rawMessage: raw,
    plugnotasCode: code,
    httpStatus: input.httpStatus,
    plugnotasRequest: request,
    runtimeDecision: input.runtimeDecision ?? null,
  });

  if (scenario === 'ambiente_configuracao') {
    return {
      title: isMeiFiscalGatewayUpstreamError({
        rawMessage: raw,
        plugnotasCode: code,
        httpStatus: input.httpStatus,
      })
        ? 'Emissor fiscal temporariamente indisponível'
        : 'Configuração do emissor fiscal',
      description: isMeiFiscalGatewayUpstreamError({
        rawMessage: raw,
        plugnotasCode: code,
        httpStatus: input.httpStatus,
      })
        ? MEI_FISCAL_GATEWAY_UPSTREAM_DESCRIPTION
        : 'Não foi possível concluir a integração com o emissor fiscal neste ambiente. '
          + 'Quem gere o servidor deve confirmar URL base, token e ambiente (sandbox/produção) antes de tentar novamente.',
      gatewayUpstream: isMeiFiscalGatewayUpstreamError({
        rawMessage: raw,
        plugnotasCode: code,
        httpStatus: input.httpStatus,
      }),
    };
  }

  if (scenario === 'prefeitura_ibge_apenas_insuficiente_dp02') {
    return {
      title: 'Limite do serviço — prefeitura no NFS-e',
      description:
        'Nem todos os municípios ficam disponíveis neste fluxo sem dados adicionais da prefeitura no emissor fiscal. '
        + 'Para o seu município, o cadastro costuma exigir configuração além do código IBGE. '
        + 'Isto não é um erro das suas credenciais MEI — contacte o suporte ou consulte a documentação do emissor.',
    };
  }

  if (scenario === 'prefeitura_login_required_blocked') {
    return {
      title: 'Exceção municipal não suportada neste fluxo',
      description:
        'Este cadastro segue NFS-e Nacional como padrão. Quando o emissor exigir acesso ao portal da prefeitura, '
        + 'o caso fica fora deste fluxo e precisa de triagem operacional com suporte ou com o painel do emissor.',
    };
  }

  if (scenario === 'prefeitura_login_required_fallback_available') {
    return {
      title: 'Portal da prefeitura necessário para concluir',
      description:
        'O emissor indicou que este município exige autenticação no portal da prefeitura para seguir com o cadastro NFS-e. '
        + 'Quando a integração estiver disponível nesta jornada, poderá informar login e senha do portal abaixo para '
        + 'tentar o segundo passo — sem substituir o padrão nacional nas outras etapas.',
    };
  }

  if (scenario === 'payload_contrato') {
    return {
      title: 'Revise os dados do cadastro',
      description:
        'O emissor fiscal recusou os dados enviados para cadastrar a empresa. Revise CNPJ, endereço e demais campos obrigatórios e tente de novo.',
    };
  }

  if (code === PLUGNOTAS_CODE_CERTIFICADO_409_SEM_ID) {
    return {
      title: 'Certificado e conta no emissor',
      description:
        'O emissor fiscal reconheceu o certificado, mas não devolveu o identificador da empresa nesta conta. '
        + 'Confirme se o CNPJ, o ambiente (testes/produção) e a API key são da mesma conta do emissor onde a empresa está cadastrada. '
        + 'Depois volte a enviar o certificado ou peça apoio ao suporte do emissor.',
      actionLabel: 'Documentação',
      href: hrefCertificado409SemId(),
    };
  }

  if (
    /\b401\b/.test(raw)
    || lower.includes('unauthorized')
    || lower.includes('não autorizado')
    || lower.includes('nao autorizado')
    || lower.includes('token inválido')
    || lower.includes('token invalido')
  ) {
    return {
      title: 'Sessão ou permissão',
      description:
        'A sessão pode ter expirado ou o token não tem permissão para esta operação. Saia e entre de novo na conta e tente outra vez.',
    };
  }

  if (/\b403\b/.test(raw) || lower.includes('forbidden') || lower.includes('proibido')) {
    return {
      title: 'Acesso negado',
      description:
        'O servidor recusou esta operação. Verifique se a sua conta tem perfil adequado ou contacte o administrador da empresa.',
    };
  }

  if (
    /\b404\b/.test(raw)
    || lower.includes('not found')
    || lower.includes('não encontrad')
    || lower.includes('nao encontrad')
  ) {
    return {
      title: 'Registo não encontrado',
      description:
        'O item pedido já não existe ou o identificador está incorreto. Atualize a lista e confirme os dados.',
    };
  }

  if (
    lower.includes('e0014')
    || lower.includes('dps já existe')
    || lower.includes('dps ja existe')
    || lower.includes('numeração repetida')
    || lower.includes('numeracao repetida')
    || (lower.includes('conjunto de série') && lower.includes('já existe'))
    || (lower.includes('conjunto de serie') && lower.includes('ja existe'))
  ) {
    return {
      title: 'Numeração da nota já utilizada (E0014)',
      description:
        'A prefeitura recusou porque série + número desta nota já foram usados numa emissão anterior. '
        + 'Não é bloqueio por cliente nem por valor: pode emitir várias notas para a mesma pessoa, '
        + 'inclusive com valores iguais — emita de novo que o sistema usará o próximo número automaticamente.',
    };
  }

  if (
    lower.includes('rps')
    && (
      lower.includes('duplic')
      || lower.includes('já utiliz')
      || lower.includes('ja utiliz')
      || lower.includes('already')
      || lower.includes('em uso')
    )
  ) {
    return {
      title: 'Numeração RPS em conflito',
      description:
        'O número de RPS desta nota já foi utilizado. Aguarde a autorização da nota anterior ou ajuste lote, série e número em Certificado → Empresa.',
    };
  }

  if (
    (lower.includes('id_integracao') || lower.includes('idintegracao') || lower.includes('id integração'))
    && (lower.includes('duplic') || lower.includes('unique') || lower.includes('23505') || lower.includes('já foi registrad'))
  ) {
    return {
      title: 'Emissão já enviada',
      description:
        'Este pedido de emissão já foi registrado. Confira a lista de notas ou aguarde alguns segundos e tente novamente.',
    };
  }

  if (
    lower.includes('duplicate')
    || lower.includes('unique')
    || lower.includes('já existe')
    || lower.includes('ja existe')
    || lower.includes('already exists')
    || lower.includes('conflict')
    || lower.includes('23505')
  ) {
    return {
      title: 'Registo duplicado',
      description:
        'Já existe um registo com estes dados (catálogo, código de serviço ou identificador de emissão). Altere os dados ou edite o registo existente.',
    };
  }

  if (
    lower.includes('failed to fetch')
    || lower.includes('networkerror')
    || lower.includes('network request failed')
    || lower === 'load failed'
    || lower.includes('erro de rede')
  ) {
    return {
      title: 'Ligação à internet',
      description:
        'Não foi possível contactar o servidor. Verifique a Wi‑Fi ou os dados móveis e tente de novo.',
    };
  }

  if (looksLikeOpaqueApiPayload(raw)) {
    return {
      title: 'Erro no serviço',
      description: MEI_FISCAL_ERROR_FALLBACK_DESCRIPTION,
    };
  }

  if (scenario === 'empresa_nao_cadastrada') {
    return {
      title: 'Cadastro da empresa ainda não concluído',
      description:
        'A consulta não encontrou a empresa no emissor porque o cadastro ainda não foi concluído com sucesso. '
        + 'Corrija o erro anterior e tente registrar a empresa novamente antes de consultar de novo.',
    };
  }

  if (
    lower.includes('não há cadastro desta empresa no plugnotas')
    || lower.includes('nao ha cadastro desta empresa no plugnotas')
    || lower.includes('não há cadastro desta empresa no emissor fiscal')
    || lower.includes('nao ha cadastro desta empresa no emissor fiscal')
    || lower.includes('não há cadastro desta empresa no emissor')
    || lower.includes('nao ha cadastro desta empresa no emissor')
  ) {
    return {
      title: 'Cadastro no emissor',
      description: normalizeMsg(raw),
    };
  }

  if (
    (lower.includes('não localizamos') || lower.includes('nao localizamos'))
    && (lower.includes('empresa') || lower.includes('parâmetros') || lower.includes('parametros'))
  ) {
    return {
      title: 'Empresa não encontrada no emissor',
      description:
        'O emissor fiscal não encontrou cadastro desta empresa para o seu token. Cadastre primeiro o certificado (.pfx) e os dados na guia MEI; '
        + 'confirme também se ambiente (sandbox/produção) e token são da conta onde o CNPJ está registado.',
    };
  }

  if (
    (
      lower.includes('rota')
      && (lower.includes('não existe') || lower.includes('nao existe'))
      && (lower.includes('serviço') || lower.includes('servico'))
    )
    || (
      request?.path === '/empresa'
      && isMeiFiscalGatewayUpstreamError({
        rawMessage: raw,
        plugnotasCode: code,
        httpStatus: input.httpStatus,
      })
    )
  ) {
    return {
      title: 'Configuração do emissor fiscal',
      description:
        'O emissor fiscal recusou a chamada (URL base ou ambiente incorreto). Quem gere o servidor deve confirmar a URL base da API do emissor e a chave no mesmo ambiente.',
    };
  }

  /** Mensagens agregadas legíveis (provedor/SEFAZ) — POSQA / FR-POSQA-06: paridade com texto útil do fornecedor. */
  if (isLikelyUserFacingFiscalValidationMessage(raw)) {
    return {
      title: 'Validação ou rejeição no provedor',
      description: normalizeMsg(raw),
    };
  }

  if (!raw) {
    return { title: 'Operação fiscal', description: MEI_FISCAL_ERROR_FALLBACK_DESCRIPTION };
  }

  return { title: 'Operação fiscal', description: MEI_FISCAL_ERROR_FALLBACK_DESCRIPTION };
}

/** Texto único para painéis / `LongFiscalErrorMessage` (título + descrição). */
export function formatMeiFiscalMappedForAlert(copy: MeiFiscalUserCopy): string {
  const action =
    copy.href && copy.actionLabel
      ? `\n\n${copy.actionLabel}: ${copy.href}`
      : copy.href
        ? `\n\nMais informação: ${copy.href}`
        : '';
  return `${copy.title}\n\n${copy.description}${action}`;
}

/** Uma linha curta para toasts — sem JSON nem stack. */
export function meiFiscalToastMessage(err: unknown, fallback: string): string {
  const raw = err instanceof Error ? err.message : typeof err === 'string' ? err : fallback;
  const copy = mapMeiFiscalErrorToCopy({
    rawMessage: raw || fallback,
    plugnotasCode: getPlugnotasCodeFromUnknownError(err),
    httpStatus: getHttpStatusFromUnknownError(err),
    runtimeDecision: getRuntimeDecisionFromUnknownError(err),
  });
  const line = `${copy.title}: ${copy.description}`.replace(/\s+/g, ' ').trim();
  return line.length > 220 ? `${line.slice(0, 217)}…` : line;
}

/**
 * Entrada usada por `formatPlugnotasIntegrationError` (Guia MEI e integrações).
 */
export function formatMeiFiscalErrorForIntegrations(
  rawMessage: string,
  plugnotasCode?: string | null,
  httpStatus?: number | null,
  plugnotasRequest?: PlugnotasRequestMeta | null,
  runtimeDecision?: EmpresaCadastroRuntimeDecision | null
): string {
  const copy = mapMeiFiscalErrorToCopy({
    rawMessage,
    plugnotasCode: plugnotasCode ?? null,
    httpStatus: httpStatus ?? null,
    plugnotasRequest: plugnotasRequest ?? null,
    runtimeDecision: runtimeDecision ?? null,
  });
  return formatMeiFiscalMappedForAlert(copy);
}

export function mapMeiFiscalErrorFromUnknown(err: unknown, fallbackMessage: string): MeiFiscalUserCopy {
  const raw = err instanceof Error ? err.message : fallbackMessage;
  return mapMeiFiscalErrorToCopy({
    rawMessage: raw || fallbackMessage,
    plugnotasCode: getPlugnotasCodeFromUnknownError(err),
    httpStatus: getHttpStatusFromUnknownError(err),
    runtimeDecision: getRuntimeDecisionFromUnknownError(err),
  });
}
