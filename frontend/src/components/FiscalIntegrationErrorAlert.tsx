import { useId, useState } from 'react';

import {
  isLikelyLocalOnlyGuiaMeiEmpresaCertError,
  shouldOfferNfceCadastroDocHint
} from '../utils/nfceEmpresaCadastroErrorHints';
import { isPlugnotasRpsSerieNotRegisteredMessage } from '../utils/nfEmissionCompany';
import {
  getNfseNacionalOperacaoHelpHref,
  getPlugnotasEmpresaCadastroErrorUxVariant,
  isMeiGuideSerproConsCUserFacingText,
  isPlugnotasEmpresaIbgeCidadeMessage,
  isPlugnotasEmpresaMunicipalRequirementMessage,
  MEI_IBGE_CIDADE_ALERT_SECONDARY_HINT,
  shouldOfferNfseNacionalOperacaoDocHint
} from '../utils/nfseNacionalPlugnotasErrorHints';
import { MEI_GUIDE_SERPRO_UNAVAILABLE } from '../utils/mapMeiGuideValidateErrorToUserMessage';
import {
  getGuiaMeiConnectivityHelpHref,
  GUIMEI_CONNECTIVITY_CERTIFICATE_MESSAGE
} from '../utils/guiaMeiConnectivityUserMessage';
import {
  CERTIFICADO_EMISSOR_409_SEM_ID_DOC_ANCHOR,
  FISCAL_ERROR_LONG_THRESHOLD,
  isMeiFiscalGatewayUpstreamError,
  mapMeiFiscalErrorToCopy
} from '../lib/fiscalUserError';
import { meiFiscalUserCopyToUserFacing } from '../lib/meiFiscalUserCopyToUserFacing';
import type { PlugnotasRequestMeta } from '../utils/apiClientError';
import UserFacingErrorBlock from './UserFacingErrorBlock';
import {
  PlugnotasMunicipalRequirementOperacaoBody,
  PlugnotasPrefeituraConfigNfseOperacaoBody,
  PlugnotasPrefeituraConfigNfseOperacaoTitle,
  PlugnotasPrefeituraLoginRequiredNfseOperacaoBody,
  PlugnotasPrefeituraLoginRequiredNfseOperacaoTitle
} from './PlugnotasMunicipalRequirementOperacaoCopy';
import { PLUGNOTAS_CODE_CERTIFICADO_409_SEM_ID } from '../utils/plugnotasApiErrorCode';

const meiOperacaoNfseDocUrl =
  typeof import.meta.env.VITE_MEI_OPERACAO_NFSE_DOC_URL === 'string'
    ? import.meta.env.VITE_MEI_OPERACAO_NFSE_DOC_URL.trim()
    : '';

function getCertificado409SemIdHelpHref(): string {
  const hash = `#${CERTIFICADO_EMISSOR_409_SEM_ID_DOC_ANCHOR}`;
  if (meiOperacaoNfseDocUrl) {
    const base = meiOperacaoNfseDocUrl.replace(/#.*$/, '');
    return `${base}${hash}`;
  }
  return `/guia-mei-certificado-409-sem-id.html${hash}`;
}

/** Alinhado a `docs/operacao-mei-nfse.md` (#cadastro-empresa-nfce-qrcode-sefaz). */
const MEI_EMPRESA_PLUGNOTAS_DOC_ANCHOR = 'cadastro-empresa-nfce-qrcode-sefaz';

function getMeiEmpresaPlugnotasCadastroHelpHref(): string {
  if (meiOperacaoNfseDocUrl) {
    const base = meiOperacaoNfseDocUrl.replace(/#.*$/, '');
    return `${base}#${MEI_EMPRESA_PLUGNOTAS_DOC_ANCHOR}`;
  }
  return `/guia-mei-nfce-cadastro.html#${MEI_EMPRESA_PLUGNOTAS_DOC_ANCHOR}`;
}

export type LongFiscalErrorTone = 'danger' | 'rose' | 'warning';

type LongMessageProps = {
  message: string;
  tone: LongFiscalErrorTone;
};

function linkClassForTone(tone: LongFiscalErrorTone): string {
  if (tone === 'danger') {
    return 'text-sm font-medium text-rose-900 underline decoration-rose-700/80 hover:decoration-rose-900 dark:text-rose-100 dark:decoration-rose-300/80';
  }
  if (tone === 'rose') {
    return 'text-sm font-medium text-rose-800 underline dark:text-rose-200';
  }
  return 'text-sm font-medium text-amber-900 underline decoration-amber-700/80 hover:decoration-amber-900 dark:text-amber-100 dark:decoration-amber-300/80';
}

function scrollPanelClass(tone: LongFiscalErrorTone): string {
  const base = 'max-h-48 overflow-y-auto rounded-md p-3 text-sm shadow-inner';
  if (tone === 'warning') {
    return `${base} border border-amber-200/90 bg-white/60 dark:border-amber-900/50 dark:bg-slate-950/30`;
  }
  return `${base} border border-rose-200/90 bg-white/60 dark:border-rose-900/60 dark:bg-slate-950/40`;
}

function longHintClass(tone: LongFiscalErrorTone): string {
  if (tone === 'warning') {
    return 'text-xs text-amber-900/85 dark:text-amber-200/90';
  }
  return 'text-xs text-rose-800/80 dark:text-rose-300/90';
}

/** Texto de erro potencialmente longo: expansível após limiar (Guia MEI validação local ou alertas fiscais). */
export function LongFiscalErrorMessage({ message, tone }: LongMessageProps) {
  const regionId = useId();
  const [expanded, setExpanded] = useState(false);
  const isLong = message.length > FISCAL_ERROR_LONG_THRESHOLD;
  const linkClass = linkClassForTone(tone);

  if (!isLong) {
    return (
      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message}</p>
    );
  }

  const previewChars = 280;
  const fullRegionId = `${regionId}-full`;

  if (!expanded) {
    return (
      <div className="space-y-2">
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed" id={`${regionId}-preview`}>
          {message.slice(0, previewChars)}
          <span aria-hidden="true">…</span>
        </p>
        {/*
          Sem aria-controls no estado recolhido: o id da região completa só existe após expandir (WCAG).
          aria-expanded basta para leitores de tela identificarem o disclosure.
        */}
        <button
          type="button"
          className={linkClass}
          onClick={() => setExpanded(true)}
          aria-expanded="false"
        >
          Ver detalhes completos
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        id={fullRegionId}
        className={scrollPanelClass(tone)}
        role="region"
        tabIndex={0}
        aria-label="Mensagem completa"
      >
        <p className="whitespace-pre-wrap break-words leading-relaxed">{message}</p>
      </div>
      <p className={longHintClass(tone)}>
        Mensagem longa — role a caixa acima ou use a tecla Tab e as setas para ler tudo.
      </p>
      <button
        type="button"
        className={linkClass}
        onClick={() => setExpanded(false)}
        aria-expanded="true"
        aria-controls={fullRegionId}
      >
        Ocultar detalhes
      </button>
    </div>
  );
}

const providerHintClass = 'text-xs leading-snug text-rose-800/90 dark:text-rose-300/90';

const ibgeCidadeAlertHintClass =
  'text-sm leading-snug text-rose-800/80 dark:text-rose-300/85';

/** FR-CID-UX-02: linha secundária quando a mensagem cita tabela IBGE / codigoCidade (spec UX §6.2). */
function PlugnotasIbgeCidadeOperacaoHint({ message }: { message: string }) {
  if (!isPlugnotasEmpresaIbgeCidadeMessage(message)) return null;
  return (
    <p className={ibgeCidadeAlertHintClass} role="note">
      {MEI_IBGE_CIDADE_ALERT_SECONDARY_HINT}
    </p>
  );
}

type EmissaoFiscalErrorAlertProps = {
  documentTypeLabel: string;
  message: string;
  plugnotasCode?: string | null;
  httpStatus?: number | null;
  plugnotasRequest?: PlugnotasRequestMeta | null;
  /** FR-GUIA-FISC-13: novo POST (novo `idIntegracao` no servidor) — só para erros classificados como transitórios. */
  onRetry?: () => void;
  /** Rola até o painel de numeração RPS na aba NFS-e. */
  onConfigureRps?: () => void;
};

type NfseNacionalDocHintLinkTone = Extract<LongFiscalErrorTone, 'danger' | 'rose'>;

type NfseNacionalOperacaoDocHintProps = {
  message: string;
  /** `rose` alinha o link ao painel compacto do modal admin (pós-QA NAT-04). */
  linkTone?: NfseNacionalDocHintLinkTone;
};

/** US-MEI-NAT-04 + FR-NAT-ERR-01: dica quando o texto sugere rejeição NFS-e Nacional ou exigência municipal no emissor. */
function NfseNacionalOperacaoDocHint({ message, linkTone = 'danger' }: NfseNacionalOperacaoDocHintProps) {
  const href = getNfseNacionalOperacaoHelpHref();
  const linkClass = linkClassForTone(linkTone);
  const linkLabel = meiOperacaoNfseDocUrl
    ? 'Ver documentação de operação (NFS-e Nacional)'
    : 'Ver guia rápido (NFS-e Nacional)';

  if (isPlugnotasEmpresaMunicipalRequirementMessage(message)) {
    const uxVariant = getPlugnotasEmpresaCadastroErrorUxVariant(message);
    if (uxVariant === 'prefeitura-login-required') {
      return (
        <div
          className="text-xs leading-snug text-rose-800/90 dark:text-rose-300/90"
          role="region"
          aria-label="Acesso ao portal da prefeitura no NFS-e"
        >
          <p className="mb-1 font-semibold text-rose-900 dark:text-rose-100">
            <PlugnotasPrefeituraLoginRequiredNfseOperacaoTitle />
          </p>
          <p>
            <PlugnotasPrefeituraLoginRequiredNfseOperacaoBody />{' '}
            <a href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>
              {linkLabel}
            </a>
            <span className="text-rose-800/85 dark:text-rose-300/85"> (abre em nova aba).</span>
          </p>
        </div>
      );
    }
    if (uxVariant === 'prefeitura-config') {
      return (
        <div
          className="text-xs leading-snug text-rose-800/90 dark:text-rose-300/90"
          role="region"
          aria-label="Configuração de prefeitura no NFS-e"
        >
          <p className="mb-1 font-semibold text-rose-900 dark:text-rose-100">
            <PlugnotasPrefeituraConfigNfseOperacaoTitle />
          </p>
          <p>
            <PlugnotasPrefeituraConfigNfseOperacaoBody />{' '}
            <a href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>
              {linkLabel}
            </a>
            <span className="text-rose-800/85 dark:text-rose-300/85"> (abre em nova aba).</span>
          </p>
        </div>
      );
    }
    return (
      <p className="text-xs leading-snug text-rose-800/90 dark:text-rose-300/90">
        <PlugnotasMunicipalRequirementOperacaoBody />{' '}
        <a href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>
          {linkLabel}
        </a>
        <span className="text-rose-800/85 dark:text-rose-300/85"> (abre em nova aba).</span>
      </p>
    );
  }

  return (
    <p className="text-xs leading-snug text-rose-800/90 dark:text-rose-300/90">
      Se a mensagem citar <strong className="font-semibold">NFS-e Nacional</strong>,{' '}
      <strong className="font-semibold">município</strong>, <strong className="font-semibold">credenciamento</strong> ou{' '}
      <strong className="font-semibold">ambiente nacional</strong>, a recusa pode refletir regras do provedor ou da adesão
      municipal — não necessariamente um erro genérico só deste aplicativo.{' '}
      <a href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>
        {linkLabel}
      </a>
      <span className="text-rose-800/85 dark:text-rose-300/85"> (abre em nova aba).</span>
    </p>
  );
}

/** Erro no fluxo de emissão: tipo de documento visível + {@link UserFacingErrorBlock} (provedor fiscal) + dicas. */
export function EmissaoFiscalErrorAlert({
  documentTypeLabel,
  message,
  plugnotasCode = null,
  httpStatus = null,
  plugnotasRequest = null,
  onRetry,
  onConfigureRps
}: EmissaoFiscalErrorAlertProps) {
  const copy = mapMeiFiscalErrorToCopy({ rawMessage: message, plugnotasCode, httpStatus, plugnotasRequest });
  const facing = meiFiscalUserCopyToUserFacing(copy, {
    variant: 'inline',
    rawMessage: message,
    plugnotasCode
  });
  const showNacionalHint = shouldOfferNfseNacionalOperacaoDocHint(message);
  const showRpsSerieHint = isPlugnotasRpsSerieNotRegisteredMessage(message);
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-rose-900 dark:text-rose-100">
        Falha ao emitir{' '}
        <span className="normal-case tracking-normal">{documentTypeLabel}</span>
      </p>
      <UserFacingErrorBlock {...facing} />
      <PlugnotasIbgeCidadeOperacaoHint message={message} />
      {showRpsSerieHint && onConfigureRps ? (
        <div
          className="rounded-lg border border-violet-200/90 bg-violet-50/90 px-3 py-2 text-xs text-violet-950 dark:border-violet-900/60 dark:bg-violet-950/40 dark:text-violet-100"
          role="region"
          aria-label="Configurar numeração RPS"
        >
          <p className="font-semibold">Série RPS não cadastrada no emissor</p>
          <p className="mt-1 leading-relaxed opacity-95">
            Informe lote, número e série na seção «Antes de emitir» e salve no emissor antes de tentar de novo.
          </p>
          <button
            type="button"
            className="mt-2 text-xs font-medium text-violet-900 underline hover:no-underline dark:text-violet-200"
            onClick={onConfigureRps}
          >
            Configurar numeração RPS
          </button>
        </div>
      ) : null}
      {showNacionalHint ? <NfseNacionalOperacaoDocHint message={message} /> : null}
      {onRetry ? (
        <button type="button" className="planner-button-secondary-compact mt-1" onClick={onRetry}>
          Tentar novamente
        </button>
      ) : null}
    </div>
  );
}

type PlugnotasIntegrationErrorAlertProps = {
  message: string;
  title?: string;
  plugnotasCode?: string | null;
  httpStatus?: number | null;
  plugnotasRequest?: PlugnotasRequestMeta | null;
};

/** Outras operações (lista, download, cancelamento): bloco unificado + dica NFS-e Nacional quando aplicável. */
export function PlugnotasIntegrationErrorAlert({
  message,
  title,
  plugnotasCode = null,
  httpStatus = null,
  plugnotasRequest = null
}: PlugnotasIntegrationErrorAlertProps) {
  const copy = mapMeiFiscalErrorToCopy({ rawMessage: message, plugnotasCode, httpStatus, plugnotasRequest });
  const facing = meiFiscalUserCopyToUserFacing(copy, {
    variant: 'inline',
    rawMessage: message,
    plugnotasCode
  });
  const showNacionalHint = shouldOfferNfseNacionalOperacaoDocHint(message);
  return (
    <div className="space-y-2">
      {title ? (
        <p className="text-xs font-semibold text-rose-900 dark:text-rose-100">{title}</p>
      ) : null}
      <UserFacingErrorBlock {...facing} />
      <PlugnotasIbgeCidadeOperacaoHint message={message} />
      {showNacionalHint ? <NfseNacionalOperacaoDocHint message={message} /> : null}
    </div>
  );
}

/** Variante compacta para modais admin (mesmo mapeamento fiscal + {@link UserFacingErrorBlock} `modal_body`). */
export function EmissaoFiscalErrorAlertModal({
  documentTypeLabel,
  message,
  plugnotasCode = null,
  httpStatus = null,
  plugnotasRequest = null,
  onRetry
}: EmissaoFiscalErrorAlertProps) {
  const copy = mapMeiFiscalErrorToCopy({ rawMessage: message, plugnotasCode, httpStatus, plugnotasRequest });
  const facing = meiFiscalUserCopyToUserFacing(copy, {
    variant: 'modal_body',
    rawMessage: message,
    plugnotasCode,
    className: 'mt-0 border-0 bg-transparent p-0 shadow-none dark:bg-transparent'
  });
  const showNacionalHint = shouldOfferNfseNacionalOperacaoDocHint(message);
  return (
    <div className="mt-3 space-y-2 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 dark:border-rose-800 dark:bg-rose-950/40">
      <p className="text-xs font-semibold text-rose-900 dark:text-rose-100">
        Falha ao emitir {documentTypeLabel}
      </p>
      <UserFacingErrorBlock {...facing} />
      <PlugnotasIbgeCidadeOperacaoHint message={message} />
      {showNacionalHint ? <NfseNacionalOperacaoDocHint message={message} linkTone="rose" /> : null}
      {onRetry ? (
        <button type="button" className="planner-button-secondary-compact mt-2" onClick={onRetry}>
          Tentar novamente
        </button>
      ) : null}
    </div>
  );
}

/** Falha de rede ao enviar certificado na Guia MEI: não confundir com rejeição do provedor fiscal (US-CONN-MEI-03). */
export function GuiaMeiCertificateConnectivityPanel() {
  const href = getGuiaMeiConnectivityHelpHref();
  const linkClass = linkClassForTone('warning');

  return (
    <div className="admin-alert-warning space-y-2" role="alert">
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-900 dark:text-amber-100">
        Servidor ou conexão indisponível
      </p>
      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-amber-950 dark:text-amber-50">
        {GUIMEI_CONNECTIVITY_CERTIFICATE_MESSAGE}
      </p>
      <p className="text-xs leading-snug text-amber-900/90 dark:text-amber-100/90">
        <a href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>
          Saiba mais
        </a>
        <span className="text-amber-900/85 dark:text-amber-100/85">
          {' '}
          (checklist de conectividade local; abre em nova aba).
        </span>
      </p>
    </div>
  );
}

/** Checklist e link quando o backend retorna `certificado_409_sem_id` (US-MEI-FISC-03; copy alinhada ao brief). */
export function GuiaMeiCertificado409SemIdChecklist() {
  const linkClass = linkClassForTone('danger');
  const href = getCertificado409SemIdHelpHref();

  return (
    <div className="rounded-md border border-rose-200/90 bg-white/80 px-3 py-2 dark:border-rose-800/70 dark:bg-slate-950/30">
      <p className="text-xs font-semibold text-rose-900 dark:text-rose-100">
        Certificado já no provedor fiscal — não foi possível obter o ID automaticamente
      </p>
      <p className="mt-1 text-xs leading-snug text-rose-800/95 dark:text-rose-300/95">
        O aplicativo recebeu confirmação de que o certificado existe na conta do emissor, mas não conseguiu recuperar o
        identificador técnico (ID) pelas consultas automáticas. Confira na ordem:
      </p>
      <ul className="mt-2 list-inside list-disc space-y-1 text-xs leading-snug text-rose-800/95 dark:text-rose-300/95">
        <li>
          <strong className="font-semibold">CNPJ no formulário</strong> — 14 dígitos, o mesmo do certificado e do cadastro
          no provedor fiscal.
        </li>
        <li>
          <strong className="font-semibold">Conta no provedor fiscal</strong> — acesse o painel do provedor
          e use a <strong className="font-semibold">mesma conta</strong> ligada à chave de API configurada no servidor do
          app; confira se o certificado aparece para esse CNPJ.
        </li>
        <li>
          <strong className="font-semibold">Ambiente da API</strong> — URL base e chave de API do provedor fiscal devem ser do{' '}
          <strong className="font-semibold">mesmo ambiente</strong> (por exemplo, sandbox com sandbox, produção com
          produção). Evite misturar painel de uma conta e requisições com credenciais de outra.
        </li>
        <li>
          <strong className="font-semibold">Empresa no provedor</strong> — se a empresa ainda não existir na conta, pode
          faltar vínculo para localizar o certificado; siga o que o painel do provedor fiscal permitir cadastrar ou revisar.
        </li>
      </ul>
      <p className="mt-2 text-xs leading-snug text-rose-800/90 dark:text-rose-300/90">
        <a href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>
          Saiba mais
        </a>
        <span className="text-rose-800/85 dark:text-rose-300/85">
          {' '}
          (instruções completas de operação; abre em nova aba).
        </span>
      </p>
    </div>
  );
}

type GuiaMeiEmpresaCadastroErrorPanelProps = {
  message: string;
  /** Definido quando a API retorna `errors.plugnotasCode` (ex.: US-MEI-FISC-02 / gateway upstream). */
  fiscalErrorCode?: string | null;
  /** `errors.code` BFF quando disponível (ex.: FR-CONS Serpro — suprime hints NFS-e Nacional). */
  fiscalApiErrorCode?: string | null;
  /** Status HTTP da resposta JSON de erro, quando disponível (ex.: `ApiClientError.httpStatus`). */
  fiscalHttpStatus?: number | null;
  plugnotasRequest?: PlugnotasRequestMeta | null;
};

/**
 * Cadastro certificado/empresa na Guia MEI: mensagem completa (quebras + textos longos) + tom de provedor (US-NFCE-EMP-03).
 */
export function GuiaMeiEmpresaCadastroErrorPanel({
  message,
  fiscalErrorCode = null,
  fiscalApiErrorCode = null,
  fiscalHttpStatus = null,
  plugnotasRequest = null
}: GuiaMeiEmpresaCadastroErrorPanelProps) {
  const showNfceHint = shouldOfferNfceCadastroDocHint(message);
  const showNacionalHint = shouldOfferNfseNacionalOperacaoDocHint(message, fiscalApiErrorCode);
  const linkClass = linkClassForTone('danger');
  const isLocalOnly = isLikelyLocalOnlyGuiaMeiEmpresaCertError(message);
  const showCert409 = fiscalErrorCode === PLUGNOTAS_CODE_CERTIFICADO_409_SEM_ID;
  const isGatewayUpstream = isMeiFiscalGatewayUpstreamError({
    rawMessage: message,
    plugnotasCode: fiscalErrorCode,
    httpStatus: fiscalHttpStatus,
  });
  const meiEmpresaDocHref = getMeiEmpresaPlugnotasCadastroHelpHref();
  const meiEmpresaDocLinkLabel = meiOperacaoNfseDocUrl
    ? 'abra a documentação de operação'
    : 'abra o guia rápido de cadastro';

  const copy = mapMeiFiscalErrorToCopy({
    rawMessage: message,
    plugnotasCode: fiscalErrorCode,
    httpStatus: fiscalHttpStatus,
    plugnotasRequest,
  });
  const facing = meiFiscalUserCopyToUserFacing(copy, {
    variant: 'inline',
    rawMessage: message,
    plugnotasCode: fiscalErrorCode,
    embedRawAsTechnicalDetail: false
  });
  const suppressIbgeCidadeHintForSerproCons =
    fiscalApiErrorCode === MEI_GUIDE_SERPRO_UNAVAILABLE || isMeiGuideSerproConsCUserFacingText(message);

  return (
    <div className="admin-alert-danger space-y-2">
      <UserFacingErrorBlock {...facing} />
      {isGatewayUpstream ? null : <LongFiscalErrorMessage message={message} tone="danger" />}
      {suppressIbgeCidadeHintForSerproCons ? null : <PlugnotasIbgeCidadeOperacaoHint message={message} />}
      {showCert409 ? <GuiaMeiCertificado409SemIdChecklist /> : null}
      {showNfceHint ? (
        <p className="text-xs leading-snug text-rose-800/90 dark:text-rose-300/90">
          A Guia MEI só emite <strong className="font-semibold">NFS-e</strong> na interface; se o texto citar{' '}
          <strong className="font-semibold">NFC-e</strong>, <code className="rounded bg-rose-100/90 px-1 py-0.5 text-[0.65rem] dark:bg-rose-950/70">versaoQrCode</code> ou{' '}
          <code className="rounded bg-rose-100/90 px-1 py-0.5 text-[0.65rem] dark:bg-rose-950/70">sefaz</code>, costuma ser validação do{' '}
          <strong className="font-semibold">cadastro da empresa</strong> no provedor fiscal (não emissão de NFC-e por esta tela). Para orientação,{' '}
          <a href={meiEmpresaDocHref} target="_blank" rel="noopener noreferrer" className={linkClass}>
            {meiEmpresaDocLinkLabel}
          </a>
          {meiOperacaoNfseDocUrl ? null : (
            <>
              {' '}
              <span className="text-rose-800/85 dark:text-rose-300/85">
                (versão resumida; a documentação completa está em{' '}
                <code className="rounded bg-rose-100/90 px-1 py-0.5 text-[0.65rem] dark:bg-rose-950/70">
                  docs/operacao-mei-nfse.md
                </code>
                ).
              </span>
            </>
          )}
        </p>
      ) : null}
      {showNacionalHint ? <NfseNacionalOperacaoDocHint message={message} /> : null}
      {showCert409 ? (
        <p className={providerHintClass}>
          Depois de ajustar conta, ambiente ou CNPJ conforme o checklist, tente enviar o certificado de novo.
        </p>
      ) : isLocalOnly ? (
        <p className={providerHintClass}>Corrija os dados no formulário conforme a mensagem acima e tente de novo.</p>
      ) : isGatewayUpstream ? (
        <p className={providerHintClass}>
          Trata-se de indisponibilidade temporária do <strong className="font-semibold">emissor fiscal</strong>, não de
          rejeição do certificado ou dos dados do formulário. Aguarde alguns minutos e tente de novo; se persistir,
          confirme no servidor a URL base e a chave de API do emissor no mesmo ambiente (sandbox/produção).
        </p>
      ) : (
        <p className={providerHintClass}>
          Quando a mensagem citar validação de JSON, campos fiscais ou integração fiscal, quem recusou o
          cadastro costuma ser o <strong className="font-semibold">provedor de emissão fiscal</strong>, não este
          aplicativo. Use o texto acima como referência e tente de novo.
        </p>
      )}
    </div>
  );
}
