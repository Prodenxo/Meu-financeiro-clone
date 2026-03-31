import { useId, useState } from 'react';

import {
  isLikelyLocalOnlyGuiaMeiEmpresaCertError,
  shouldOfferNfceCadastroDocHint
} from '../utils/nfceEmpresaCadastroErrorHints';
import {
  getNfseNacionalOperacaoHelpHref,
  shouldOfferNfseNacionalOperacaoDocHint
} from '../utils/nfseNacionalPlugnotasErrorHints';
import {
  getGuiaMeiConnectivityHelpHref,
  GUIMEI_CONNECTIVITY_CERTIFICATE_MESSAGE
} from '../utils/guiaMeiConnectivityUserMessage';
import { PLUGNOTAS_CODE_CERTIFICADO_409_SEM_ID } from '../utils/plugnotasApiErrorCode';

const meiOperacaoNfseDocUrl =
  typeof import.meta.env.VITE_MEI_OPERACAO_NFSE_DOC_URL === 'string'
    ? import.meta.env.VITE_MEI_OPERACAO_NFSE_DOC_URL.trim()
    : '';

/** Âncora em `docs/operacao-mei-nfse.md` (US-MEI-FISC-03). */
const CERTIFICADO_409_SEM_ID_DOC_ANCHOR = 'certificado-plugnotas-409-sem-id';

function getCertificado409SemIdHelpHref(): string {
  if (meiOperacaoNfseDocUrl) {
    const base = meiOperacaoNfseDocUrl.replace(/#.*$/, '');
    return `${base}#${CERTIFICADO_409_SEM_ID_DOC_ANCHOR}`;
  }
  return '/guia-mei-certificado-409-sem-id.html';
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

/** Alinhado à Story 6.3: acima disso, exige ação explícita ou área rolável (sem truncar só com reticências). */
export const FISCAL_ERROR_LONG_THRESHOLD = 300;

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

type EmissaoFiscalErrorAlertProps = {
  documentTypeLabel: string;
  message: string;
};

type NfseNacionalDocHintLinkTone = Extract<LongFiscalErrorTone, 'danger' | 'rose'>;

type NfseNacionalOperacaoDocHintProps = {
  /** `rose` alinha o link ao painel compacto do modal admin (pós-QA NAT-04). */
  linkTone?: NfseNacionalDocHintLinkTone;
};

/** US-MEI-NAT-04: dica quando o texto sugere rejeição ligada à NFS-e Nacional (FR-N05). */
function NfseNacionalOperacaoDocHint({ linkTone = 'danger' }: NfseNacionalOperacaoDocHintProps) {
  const href = getNfseNacionalOperacaoHelpHref();
  const linkClass = linkClassForTone(linkTone);
  const linkLabel = meiOperacaoNfseDocUrl
    ? 'Ver documentação de operação (NFS-e Nacional)'
    : 'Ver guia rápido (NFS-e Nacional)';

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

/** Erro no fluxo de emissão: tipo de documento visível + mensagem completa + copy do provedor. */
export function EmissaoFiscalErrorAlert({ documentTypeLabel, message }: EmissaoFiscalErrorAlertProps) {
  const showNacionalHint = shouldOfferNfseNacionalOperacaoDocHint(message);
  return (
    <div className="admin-alert-danger space-y-2" role="alert">
      <p className="text-xs font-semibold uppercase tracking-wide text-rose-900 dark:text-rose-100">
        Falha ao emitir{' '}
        <span className="normal-case tracking-normal">{documentTypeLabel}</span>
      </p>
      <LongFiscalErrorMessage message={message} tone="danger" />
      <p className={providerHintClass}>
        A mensagem acima foi retornada pelo provedor de emissão fiscal, não pelo aplicativo em si.
        Ajuste os dados conforme o texto e envie novamente.
      </p>
      {showNacionalHint ? <NfseNacionalOperacaoDocHint /> : null}
    </div>
  );
}

type PlugnotasIntegrationErrorAlertProps = {
  message: string;
  title?: string;
};

/** Outras operações (lista, download, cancelamento): mensagem completa + mesma orientação sobre o provedor. */
export function PlugnotasIntegrationErrorAlert({ message, title }: PlugnotasIntegrationErrorAlertProps) {
  const showNacionalHint = shouldOfferNfseNacionalOperacaoDocHint(message);
  return (
    <div className="admin-alert-danger space-y-2" role="alert">
      {title ? (
        <p className="text-xs font-semibold text-rose-900 dark:text-rose-100">{title}</p>
      ) : null}
      <LongFiscalErrorMessage message={message} tone="danger" />
      <p className={providerHintClass}>
        Se a mensagem citar validação ou rejeição, ela costuma vir do provedor de emissão fiscal, não deste app.
      </p>
      {showNacionalHint ? <NfseNacionalOperacaoDocHint /> : null}
    </div>
  );
}

/** Variante compacta para modais admin (mesmas regras de texto longo). */
export function EmissaoFiscalErrorAlertModal({ documentTypeLabel, message }: EmissaoFiscalErrorAlertProps) {
  const showNacionalHint = shouldOfferNfseNacionalOperacaoDocHint(message);
  return (
    <div
      className="mt-3 space-y-2 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 dark:border-rose-800 dark:bg-rose-950/40"
      role="alert"
    >
      <p className="text-xs font-semibold text-rose-900 dark:text-rose-100">
        Falha ao emitir {documentTypeLabel}
      </p>
      <LongFiscalErrorMessage message={message} tone="rose" />
      <p className={providerHintClass}>
        Mensagem do provedor de emissão fiscal. Corrija os dados e tente de novo.
      </p>
      {showNacionalHint ? <NfseNacionalOperacaoDocHint linkTone="rose" /> : null}
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
  /** Definido quando a API retorna `errors.fiscalErrorCode` (ex.: US-MEI-FISC-02). */
  fiscalErrorCode?: string | null;
};

/**
 * Cadastro certificado/empresa na Guia MEI: mensagem completa (quebras + textos longos) + tom de provedor (US-NFCE-EMP-03).
 */
export function GuiaMeiEmpresaCadastroErrorPanel({ message, fiscalErrorCode = null }: GuiaMeiEmpresaCadastroErrorPanelProps) {
  const showNfceHint = shouldOfferNfceCadastroDocHint(message);
  const showNacionalHint = shouldOfferNfseNacionalOperacaoDocHint(message);
  const linkClass = linkClassForTone('danger');
  const isLocalOnly = isLikelyLocalOnlyGuiaMeiEmpresaCertError(message);
  const showCert409 = fiscalErrorCode === PLUGNOTAS_CODE_CERTIFICADO_409_SEM_ID;
  const meiEmpresaDocHref = getMeiEmpresaPlugnotasCadastroHelpHref();
  const meiEmpresaDocLinkLabel = meiOperacaoNfseDocUrl
    ? 'abra a documentação de operação'
    : 'abra o guia rápido de cadastro';

  return (
    <div className="admin-alert-danger space-y-2" role="alert">
      <LongFiscalErrorMessage message={message} tone="danger" />
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
      {showNacionalHint ? <NfseNacionalOperacaoDocHint /> : null}
      {showCert409 ? (
        <p className={providerHintClass}>
          Depois de ajustar conta, ambiente ou CNPJ conforme o checklist, tente enviar o certificado de novo.
        </p>
      ) : isLocalOnly ? (
        <p className={providerHintClass}>Corrija os dados no formulário conforme a mensagem acima e tente de novo.</p>
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
