import {
  isPlugnotasGatewayUpstreamCode,
  PLUGNOTAS_CODE_CERTIFICADO_409_SEM_ID,
} from '../utils/plugnotasApiErrorCode';

/** DP-PLOGIN-02 — BFF bloqueia cadastro só com IBGE em município da lista (`prefeituraIbgeOnlyBlock.js`). */
export const PLUGNOTAS_CODE_PREFEITURA_IBGE_APENAS_INSUFICIENTE_DP02 =
  'prefeitura_ibge_apenas_insuficiente_dp02';
import { getPlugnotasCodeFromUnknownError, getHttpStatusFromUnknownError } from '../utils/apiClientError';

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
}): MeiFiscalUserCopy {
  const code = input.plugnotasCode?.trim() || null;
  const raw = (input.rawMessage || '').trim();
  const lower = raw.toLowerCase();

  if (
    isMeiFiscalGatewayUpstreamError({
      rawMessage: raw,
      plugnotasCode: code,
      httpStatus: input.httpStatus,
    })
  ) {
    return {
      title: 'Emissor fiscal temporariamente indisponível',
      description: MEI_FISCAL_GATEWAY_UPSTREAM_DESCRIPTION,
      gatewayUpstream: true,
    };
  }

  if (code === PLUGNOTAS_CODE_PREFEITURA_IBGE_APENAS_INSUFICIENTE_DP02) {
    return {
      title: 'Limite do serviço — prefeitura no NFS-e',
      description:
        'Nem todos os municípios ficam disponíveis neste fluxo sem dados adicionais da prefeitura no emissor fiscal. '
        + 'Para o seu município, o cadastro costuma exigir configuração além do código IBGE. '
        + 'Isto não é um erro das suas credenciais MEI — contacte o suporte ou consulte a documentação do emissor.',
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
        'Já existe um registo com estes dados (por exemplo, o mesmo CPF/CNPJ no catálogo). Altere o documento ou edite o registo existente.',
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
    lower.includes('rota')
    && (lower.includes('não existe') || lower.includes('nao existe'))
    && (lower.includes('serviço') || lower.includes('servico'))
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
  httpStatus?: number | null
): string {
  const copy = mapMeiFiscalErrorToCopy({
    rawMessage,
    plugnotasCode: plugnotasCode ?? null,
    httpStatus: httpStatus ?? null,
  });
  return formatMeiFiscalMappedForAlert(copy);
}

export function mapMeiFiscalErrorFromUnknown(err: unknown, fallbackMessage: string): MeiFiscalUserCopy {
  const raw = err instanceof Error ? err.message : fallbackMessage;
  return mapMeiFiscalErrorToCopy({
    rawMessage: raw || fallbackMessage,
    plugnotasCode: getPlugnotasCodeFromUnknownError(err),
    httpStatus: getHttpStatusFromUnknownError(err),
  });
}
