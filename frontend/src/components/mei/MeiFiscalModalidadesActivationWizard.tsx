import { useEffect, useId, useRef, useState } from 'react';
import {
  atualizarEmpresaEmissaoNf,
  consultarEmpresaEmissaoNf
} from '../../services/meiNotasService';
import { getPlugnotasCodeFromUnknownError } from '../../utils/apiClientError';
import { formatPlugnotasIntegrationError } from '../../utils/plugnotasIntegrationErrorMessage';
import {
  buildDocumentosAtivosSolicitacaoModalidade,
  getDocumentosAtivosValidationMessage
} from '../../utils/plugnotasEmpresaDocumentosAtivos';

export type MeiFiscalModalidadesActivationWizardProps = {
  open: boolean;
  onClose: () => void;
  cnpjDigits: string;
  target: 'NFE' | 'NFCE';
  /** Após PATCH bem-sucedido (refetch capacidade no pai). */
  onSuccess: () => void;
};

type WizardStep = 0 | 1 | 2 | 3;

const docLabel = (t: 'NFE' | 'NFCE') => (t === 'NFE' ? 'NF-e' : 'NFC-e');

/**
 * FR-GUIA-FISC-14 D2 — *wizard* multi-passo (UX §6.2): intro → checklist → confirmação → resultado.
 * Backend: `PATCH /mei-notas/setup/emissao-fiscal/empresa` com `documentosAtivos` (política já existente).
 */
export function MeiFiscalModalidadesActivationWizard({
  open,
  onClose,
  cnpjDigits,
  target,
  onSuccess
}: MeiFiscalModalidadesActivationWizardProps) {
  const titleId = useId();
  const errId = useId();
  const chkCertId = useId();
  const chkCadastroId = useId();
  const chkNfceId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);

  const [step, setStep] = useState<WizardStep>(0);
  const [chkCert, setChkCert] = useState(false);
  const [chkCadastro, setChkCadastro] = useState(false);
  const [chkNfceExtra, setChkNfceExtra] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resultOk, setResultOk] = useState<boolean | null>(null);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [checklistError, setChecklistError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setChkCert(false);
    setChkCadastro(false);
    setChkNfceExtra(false);
    setSubmitting(false);
    setResultOk(null);
    setResultMessage(null);
    setChecklistError(null);
  }, [open, target]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => headingRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open, step]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose, submitting]);

  if (!open) return null;

  const label = docLabel(target);
  const nfceChecklistNeeded = target === 'NFCE';

  const goNextFromChecklist = () => {
    const needNfce = nfceChecklistNeeded && !chkNfceExtra;
    if (!chkCert || !chkCadastro || needNfce) {
      setChecklistError('Confirme todos os itens da lista antes de continuar.');
      return;
    }
    setChecklistError(null);
    setStep(2);
  };

  const handleSolicitar = async () => {
    if (cnpjDigits.length !== 14) {
      setResultOk(false);
      setResultMessage('CNPJ inválido para enviar o pedido.');
      setStep(3);
      return;
    }
    setSubmitting(true);
    setResultMessage(null);
    try {
      const consulta = await consultarEmpresaEmissaoNf(cnpjDigits);
      const documentosAtivos = buildDocumentosAtivosSolicitacaoModalidade(consulta, target);
      const docMsg = getDocumentosAtivosValidationMessage(documentosAtivos);
      if (docMsg) {
        setResultOk(false);
        setResultMessage(docMsg);
        setStep(3);
        return;
      }
      await atualizarEmpresaEmissaoNf({
        cpfCnpj: cnpjDigits,
        documentosAtivos
      });
      setResultOk(true);
      setResultMessage(
        'Pedido enviado ao emissor fiscal integrado. A verificar a configuração…'
      );
      setStep(3);
      onSuccess();
    } catch (error: unknown) {
      setResultOk(false);
      setResultMessage(
        formatPlugnotasIntegrationError(
          error instanceof Error ? error.message : 'Não foi possível solicitar a activação.',
          getPlugnotasCodeFromUnknownError(error)
        )
      );
      setStep(3);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[85] flex items-center justify-center bg-black/50 p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={step === 1 && checklistError ? errId : undefined}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900"
      >
        <h2
          ref={headingRef}
          id={titleId}
          tabIndex={-1}
          className="text-base font-semibold text-slate-900 outline-none dark:text-slate-100"
        >
          {step === 0 && 'Configurar emissão no emissor'}
          {step === 1 && 'Antes de solicitar'}
          {step === 2 && 'Confirmar pedido'}
          {step === 3 && (resultOk ? 'Pedido enviado' : 'Não foi possível concluir')}
        </h2>

        {step === 0 ? (
          <div className="mt-3 space-y-3 text-sm text-slate-600 dark:text-slate-300">
            <p>
              Este assistente envia ao emissor fiscal integrado (Plugnotas) um pedido para activar a modalidade{' '}
              <strong>{label}</strong> para o CNPJ indicado no formulário, mantendo as outras modalidades conforme o
              cadastro actual.
            </p>
            <p className="text-xs opacity-90">Tempo estimado: cerca de 2 minutos, se os pré-requisitos estiverem prontos.</p>
            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="planner-button-secondary-compact w-full sm:w-auto"
                onClick={onClose}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="planner-button w-full sm:w-auto"
                onClick={() => setStep(1)}
              >
                Seguinte
              </button>
            </div>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            <p className="mb-3">
              Confirme que reuniu os requisitos abaixo (lista informativa). Se algo faltar, use{' '}
              <strong>Rever configuração</strong> no callout e volte depois.
            </p>
            <ul className="space-y-3">
              <li className="flex gap-2">
                <input
                  id={chkCertId}
                  type="checkbox"
                  className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300"
                  checked={chkCert}
                  onChange={(e) => setChkCert(e.target.checked)}
                  aria-describedby={`${chkCertId}-hint`}
                />
                <label htmlFor={chkCertId} className="cursor-pointer">
                  Certificado A1 válido associado à empresa no emissor fiscal.
                  <span id={`${chkCertId}-hint`} className="sr-only">
                    Obrigatório para continuar.
                  </span>
                </label>
              </li>
              <li className="flex gap-2">
                <input
                  id={chkCadastroId}
                  type="checkbox"
                  className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300"
                  checked={chkCadastro}
                  onChange={(e) => setChkCadastro(e.target.checked)}
                />
                <label htmlFor={chkCadastroId} className="cursor-pointer">
                  Dados cadastrais da empresa actualizados (aba Certificado e DAS).
                </label>
              </li>
              {nfceChecklistNeeded ? (
                <li className="flex gap-2">
                  <input
                    id={chkNfceId}
                    type="checkbox"
                    className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300"
                    checked={chkNfceExtra}
                    onChange={(e) => setChkNfceExtra(e.target.checked)}
                  />
                  <label htmlFor={chkNfceId} className="cursor-pointer">
                    Para NFC-e: CSC e token junto à SEFAZ disponíveis ou tratados no painel do emissor (quando aplicável).
                  </label>
                </li>
              ) : null}
            </ul>
            {checklistError ? (
              <p id={errId} role="alert" className="mt-3 text-xs font-medium text-amber-800 dark:text-amber-200">
                {checklistError}
              </p>
            ) : null}
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="planner-button-secondary-compact w-full sm:w-auto"
                onClick={() => setStep(0)}
              >
                Voltar
              </button>
              <button type="button" className="planner-button w-full sm:w-auto" onClick={goNextFromChecklist}>
                Seguinte
              </button>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            <p>
              Ao confirmar, enviamos ao emissor fiscal integrado um pedido para activar <strong>{label}</strong> no
              cadastro da empresa, mantendo as outras modalidades conforme o estado actual. O emissor pode ainda
              validar CSC, certificado ou outros dados; se rejeitar, verá a mensagem no passo seguinte.
            </p>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="planner-button-secondary-compact w-full sm:w-auto"
                disabled={submitting}
                onClick={() => setStep(1)}
              >
                Voltar
              </button>
              <button
                type="button"
                className="planner-button w-full sm:w-auto"
                disabled={submitting}
                onClick={() => void handleSolicitar()}
              >
                {submitting ? 'A enviar…' : 'Solicitar activação'}
              </button>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            <p role={resultOk ? 'status' : 'alert'} className={resultOk ? '' : 'text-amber-900 dark:text-amber-100'}>
              {resultMessage}
            </p>
            {resultOk === false ? (
              <p className="mt-2 text-xs opacity-95">
                Se precisar de ajuda, contacte o suporte ou corrija os dados na aba Certificado e DAS e tente novamente.
              </p>
            ) : null}
            <div className="mt-5 flex justify-end">
              <button type="button" className="planner-button w-full sm:w-auto" onClick={onClose}>
                Concluir
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
