import React, { useEffect, useRef, useState } from 'react';
import type { NfseCatalogProduto } from '../services/meiNotasService';
import { criarCatalogoNfseProduto, atualizarCatalogoNfseProduto } from '../services/meiNotasService';
import {
  formatMoneyDigitsPtBr,
  moneyDigitsFromNumber,
  parseMoneyInputToNumber
} from '../lib/formatMoneyPtBr';
import {
  MEI_CATALOGO_DELETE_PRODUTO_DANGER_CTA,
  MEI_CATALOGO_DELETE_PRODUTO_DANGER_HEADING,
  MEI_CATALOGO_DELETE_PRODUTO_DANGER_HINT
} from '../copy/meiCatalogoProdutoDelete';
import UserFacingErrorBlock from './UserFacingErrorBlock';
import { mapMeiCatalogApiErrorToUserFacing } from '../lib/mapMeiCatalogApiErrorToUserFacing';
import { MeiCodigoServicoCombobox } from './MeiCodigoServicoCombobox';

export interface MeiCatalogoProdutoModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: (kind: 'create' | 'edit') => void;
  editing: NfseCatalogProduto | null;
  /** Modo edição: abre o diálogo de confirmação de exclusão (controlado pelo pai). */
  onRequestDelete?: () => void;
}

type FieldKey = 'discriminacao' | 'codigo' | 'cnae' | 'aliquota' | 'valor_sugerido';

function parseAliquotaInput(raw: string): number | null {
  const t = raw.trim().replace(',', '.');
  if (!t) return null;
  const n = Number(t);
  if (Number.isNaN(n) || n < 0) return Number.NaN;
  return n;
}

function formatAliquotaForInput(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '';
  return String(n).replace('.', ',');
}

export default function MeiCatalogoProdutoModal({
  open,
  onClose,
  onSaved,
  editing,
  onRequestDelete
}: MeiCatalogoProdutoModalProps) {
  const [discriminacao, setDiscriminacao] = useState('');
  const [codigo, setCodigo] = useState('');
  const [cnae, setCnae] = useState('');
  const [aliquotaStr, setAliquotaStr] = useState('');
  const [valorCentDigits, setValorCentDigits] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [apiError, setApiError] = useState<unknown | null>(null);
  const [saving, setSaving] = useState(false);

  const discRef = useRef<HTMLTextAreaElement>(null);
  const codigoRef = useRef<HTMLInputElement>(null);
  const cnaeRef = useRef<HTMLInputElement>(null);
  const aliquotaRef = useRef<HTMLInputElement>(null);
  const valorRef = useRef<HTMLInputElement>(null);

  const isEdit = Boolean(editing);

  useEffect(() => {
    if (!open) return;
    setFieldErrors({});
    setApiError(null);
    if (editing) {
      setDiscriminacao(editing.discriminacao || '');
      setCodigo(editing.codigo || '');
      setCnae(editing.cnae || '');
      setAliquotaStr(formatAliquotaForInput(editing.aliquota ?? null));
      setValorCentDigits(moneyDigitsFromNumber(editing.valor_sugerido ?? null));
    } else {
      setDiscriminacao('');
      setCodigo('');
      setCnae('');
      setAliquotaStr('');
      setValorCentDigits('');
    }
  }, [open, editing]);

  const focusFirstError = (keys: FieldKey[]) => {
    const order: FieldKey[] = ['discriminacao', 'codigo', 'cnae', 'aliquota', 'valor_sugerido'];
    const first = order.find((k) => keys.includes(k));
    if (first === 'discriminacao') discRef.current?.focus();
    else if (first === 'codigo') codigoRef.current?.focus();
    else if (first === 'cnae') cnaeRef.current?.focus();
    else if (first === 'aliquota') aliquotaRef.current?.focus();
    else if (first === 'valor_sugerido') valorRef.current?.focus();
  };

  const validate = (): boolean => {
    const next: Partial<Record<FieldKey, string>> = {};
    if (!discriminacao.trim()) {
      next.discriminacao = 'Informe a discriminação do serviço ou produto.';
    }
    const alParsed = parseAliquotaInput(aliquotaStr);
    if (aliquotaStr.trim() && Number.isNaN(alParsed as number)) {
      next.aliquota = 'Alíquota inválida (use número, ex.: 5 ou 5,5).';
    }
    const valorNum = parseMoneyInputToNumber(formatMoneyDigitsPtBr(valorCentDigits));
    if (valorCentDigits && valorNum === null) {
      next.valor_sugerido = 'Valor sugerido inválido.';
    }
    setFieldErrors(next);
    if (Object.keys(next).length > 0) {
      focusFirstError(Object.keys(next) as FieldKey[]);
      return false;
    }
    return true;
  };

  const handleValorChange = (value: string) => {
    setValorCentDigits(value.replace(/\D/g, ''));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setApiError(null);
    setSaving(true);
    const alParsed = parseAliquotaInput(aliquotaStr);
    const aliquotaVal = aliquotaStr.trim() && !Number.isNaN(alParsed as number) ? alParsed : null;
    const valorNum = parseMoneyInputToNumber(formatMoneyDigitsPtBr(valorCentDigits));

    try {
      if (isEdit && editing) {
        await atualizarCatalogoNfseProduto(editing.id, {
          discriminacao: discriminacao.trim(),
          codigo: codigo.trim(),
          cnae: cnae.trim(),
          aliquota: aliquotaVal,
          valor_sugerido: valorNum
        });
      } else {
        await criarCatalogoNfseProduto({
          discriminacao: discriminacao.trim(),
          codigo: codigo.trim() || undefined,
          cnae: cnae.trim() || undefined,
          ...(aliquotaVal !== null ? { aliquota: aliquotaVal } : {}),
          ...(valorNum !== null ? { valor_sugerido: valorNum } : {}),
          documentType: 'NFSE'
        });
      }
      onSaved(isEdit ? 'edit' : 'create');
      onClose();
    } catch (err) {
      setApiError(err);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const errId = 'mei-catalogo-produto-api-err';
  const valorDisplay = formatMoneyDigitsPtBr(valorCentDigits);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="planner-card relative max-h-[90vh] w-full max-w-md overflow-y-auto p-8"
        onClick={(ev) => ev.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mei-catalogo-produto-title"
      >
        <button
          type="button"
          aria-label="Fechar"
          className="ui-modal-icon-dismiss absolute right-3 top-3"
          onClick={onClose}
        >
          ×
        </button>
        <h2 id="mei-catalogo-produto-title" className="mb-4 text-xl font-bold dark:text-white">
          {isEdit ? 'Editar serviço ou produto' : 'Novo serviço ou produto'}
        </h2>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          Itens reutilizáveis na emissão de NFS-e (discriminação, CNAE, valores sugeridos).
        </p>

        {apiError != null ? (
          <div id={errId} className="mb-4" role="alert">
            <UserFacingErrorBlock
              {...mapMeiCatalogApiErrorToUserFacing(apiError, 'Erro ao guardar.', 'mei_catalogo.produtos.modal')}
            />
          </div>
        ) : null}

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
          noValidate
          {...(apiError ? { 'aria-describedby': errId } : {})}
        >
          <div>
            <label htmlFor="mei-cat-prod-disc" className="mb-2 block font-medium dark:text-gray-200">
              Discriminação <span className="text-red-600">*</span>
            </label>
            <textarea
              ref={discRef}
              id="mei-cat-prod-disc"
              className="planner-input-compact min-h-[88px] w-full resize-y"
              value={discriminacao}
              onChange={(ev) => setDiscriminacao(ev.target.value)}
              aria-invalid={Boolean(fieldErrors.discriminacao)}
              aria-describedby={fieldErrors.discriminacao ? 'mei-cat-prod-disc-err' : undefined}
              autoComplete="off"
            />
            {fieldErrors.discriminacao ? (
              <p id="mei-cat-prod-disc-err" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                {fieldErrors.discriminacao}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="mei-cat-prod-cod" className="mb-2 block font-medium dark:text-gray-200">
              Código interno <span className="text-slate-400">(opcional)</span>
            </label>
            <MeiCodigoServicoCombobox
              ref={codigoRef}
              id="mei-cat-prod-cod"
              value={codigo}
              onChange={setCodigo}
              aria-invalid={Boolean(fieldErrors.codigo)}
              aria-describedby={
                fieldErrors.codigo ? 'mei-cat-prod-cod-err' : undefined
              }
            />
            {fieldErrors.codigo ? (
              <p id="mei-cat-prod-cod-err" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                {fieldErrors.codigo}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="mei-cat-prod-cnae" className="mb-2 block font-medium dark:text-gray-200">
              CNAE <span className="text-slate-400">(opcional)</span>
            </label>
            <input
              ref={cnaeRef}
              id="mei-cat-prod-cnae"
              className="planner-input-compact w-full"
              value={cnae}
              onChange={(ev) => setCnae(ev.target.value)}
              inputMode="numeric"
              aria-invalid={Boolean(fieldErrors.cnae)}
              aria-describedby={fieldErrors.cnae ? 'mei-cat-prod-cnae-err' : undefined}
              autoComplete="off"
            />
            {fieldErrors.cnae ? (
              <p id="mei-cat-prod-cnae-err" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                {fieldErrors.cnae}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="mei-cat-prod-alq" className="mb-2 block font-medium dark:text-gray-200">
              Alíquota (%) <span className="text-slate-400">(opcional)</span>
            </label>
            <input
              ref={aliquotaRef}
              id="mei-cat-prod-alq"
              className="planner-input-compact w-full"
              value={aliquotaStr}
              onChange={(ev) => setAliquotaStr(ev.target.value)}
              inputMode="decimal"
              aria-invalid={Boolean(fieldErrors.aliquota)}
              aria-describedby={fieldErrors.aliquota ? 'mei-cat-prod-alq-err' : undefined}
              autoComplete="off"
            />
            {fieldErrors.aliquota ? (
              <p id="mei-cat-prod-alq-err" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                {fieldErrors.aliquota}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="mei-cat-prod-valor" className="mb-2 block font-medium dark:text-gray-200">
              Valor sugerido (R$) <span className="text-slate-400">(opcional)</span>
            </label>
            <input
              ref={valorRef}
              id="mei-cat-prod-valor"
              className="planner-input-compact w-full tabular-nums"
              value={valorDisplay}
              onChange={(ev) => handleValorChange(ev.target.value)}
              inputMode="numeric"
              placeholder="0,00"
              aria-invalid={Boolean(fieldErrors.valor_sugerido)}
              aria-describedby={fieldErrors.valor_sugerido ? 'mei-cat-prod-valor-err' : undefined}
              autoComplete="off"
            />
            {fieldErrors.valor_sugerido ? (
              <p id="mei-cat-prod-valor-err" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                {fieldErrors.valor_sugerido}
              </p>
            ) : null}
          </div>

          {isEdit && onRequestDelete ? (
            <div className="border-t border-slate-200 pt-4 dark:border-slate-700">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                {MEI_CATALOGO_DELETE_PRODUTO_DANGER_HEADING}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {MEI_CATALOGO_DELETE_PRODUTO_DANGER_HINT}
              </p>
              <button
                type="button"
                className="mt-3 inline-flex min-h-[44px] items-center rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                onClick={onRequestDelete}
                disabled={saving}
              >
                {MEI_CATALOGO_DELETE_PRODUTO_DANGER_CTA}
              </button>
            </div>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="planner-button-secondary-compact" onClick={onClose} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="planner-button" disabled={saving}>
              {saving ? 'A guardar…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
