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
import {
  buildCatalogMetadataWithCodigoNbs,
  isValidCodigoNbs,
  normalizeCodigoNbsInput,
  pickCodigoNbsFromCatalogMetadata
} from '../lib/nfseCodigoNbs';
import type { CodigoServicoReferencia } from '../services/meiNotasService';
import type { DocumentType } from '../services/meiNotasService';
import {
  buildNfeCatalogProdutoMetadata,
  emptyNfeCatalogProdutoFormFields,
  isNfeLikeCatalogDocumentType,
  nfeCatalogProdutoFormFieldsFromMetadata,
  validateNfeCatalogProdutoFormFields,
  type NfeCatalogProdutoFormFields,
} from '../utils/nfeCatalogProdutoMetadata';

export interface MeiCatalogoProdutoModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: (kind: 'create' | 'edit') => void;
  editing: NfseCatalogProduto | null;
  /** Modo edição: abre o diálogo de confirmação de exclusão (controlado pelo pai). */
  onRequestDelete?: () => void;
}

type FieldKey =
  | 'discriminacao'
  | 'codigo'
  | 'cnae'
  | 'codigoNbs'
  | 'aliquota'
  | 'valor_sugerido'
  | 'ncm'
  | 'cfop'
  | 'unidade'
  | 'icmsCsosn'
  | 'pisCst'
  | 'cofinsCst';

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
  const [codigoNbs, setCodigoNbs] = useState('');
  const [aliquotaStr, setAliquotaStr] = useState('');
  const [valorCentDigits, setValorCentDigits] = useState('');
  const [documentType, setDocumentType] = useState<DocumentType>('NFSE');
  const [nfeFields, setNfeFields] = useState<NfeCatalogProdutoFormFields>(() =>
    emptyNfeCatalogProdutoFormFields()
  );
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [apiError, setApiError] = useState<unknown | null>(null);
  const [saving, setSaving] = useState(false);

  const discRef = useRef<HTMLTextAreaElement>(null);
  const codigoRef = useRef<HTMLInputElement>(null);
  const cnaeRef = useRef<HTMLInputElement>(null);
  const codigoNbsRef = useRef<HTMLInputElement>(null);
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
      setCodigoNbs(pickCodigoNbsFromCatalogMetadata(editing.metadata_json));
      setAliquotaStr(formatAliquotaForInput(editing.aliquota ?? null));
      setValorCentDigits(moneyDigitsFromNumber(editing.valor_sugerido ?? null));
      setDocumentType((editing.document_type as DocumentType) || 'NFSE');
      setNfeFields(nfeCatalogProdutoFormFieldsFromMetadata(editing.metadata_json));
    } else {
      setDiscriminacao('');
      setCodigo('');
      setCnae('');
      setCodigoNbs('');
      setAliquotaStr('');
      setValorCentDigits('');
      setDocumentType('NFSE');
      setNfeFields(emptyNfeCatalogProdutoFormFields());
    }
  }, [open, editing]);

  const focusFirstError = (keys: FieldKey[]) => {
    const order: FieldKey[] = ['discriminacao', 'codigo', 'cnae', 'codigoNbs', 'aliquota', 'valor_sugerido'];
    const first = order.find((k) => keys.includes(k));
    if (first === 'discriminacao') discRef.current?.focus();
    else if (first === 'codigo') codigoRef.current?.focus();
    else if (first === 'cnae') cnaeRef.current?.focus();
    else if (first === 'codigoNbs') codigoNbsRef.current?.focus();
    else if (first === 'aliquota') aliquotaRef.current?.focus();
    else if (first === 'valor_sugerido') valorRef.current?.focus();
  };

  const validate = (): boolean => {
    const next: Partial<Record<FieldKey, string>> = {};
    if (!discriminacao.trim()) {
      next.discriminacao = isNfeLikeCatalogDocumentType(documentType)
        ? 'Informe a descrição do produto.'
        : 'Informe a discriminação do serviço ou produto.';
    }
    if (isNfeLikeCatalogDocumentType(documentType)) {
      if (!codigo.trim()) next.codigo = 'Informe o código/SKU do produto.';
      const nfeErr = validateNfeCatalogProdutoFormFields(nfeFields);
      if (nfeErr) {
        if (nfeErr.includes('NCM')) next.ncm = nfeErr;
        else if (nfeErr.includes('CFOP')) next.cfop = nfeErr;
        else if (nfeErr.includes('unidade')) next.unidade = nfeErr;
        else if (nfeErr.includes('CSOSN')) next.icmsCsosn = nfeErr;
        else if (nfeErr.includes('PIS')) next.pisCst = nfeErr;
        else if (nfeErr.includes('COFINS')) next.cofinsCst = nfeErr;
      }
    } else {
      if (codigoNbs.trim() && !isValidCodigoNbs(codigoNbs)) {
        next.codigoNbs = 'NBS inválido — use 9 dígitos (ex.: 114061100).';
      }
      const alParsed = parseAliquotaInput(aliquotaStr);
      if (aliquotaStr.trim() && Number.isNaN(alParsed as number)) {
        next.aliquota = 'Alíquota inválida (use número, ex.: 5 ou 5,5).';
      }
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

    const metadataJson = isNfeLikeCatalogDocumentType(documentType)
      ? buildNfeCatalogProdutoMetadata(editing?.metadata_json, nfeFields)
      : buildCatalogMetadataWithCodigoNbs(editing?.metadata_json, codigoNbs);

    try {
      if (isEdit && editing) {
        await atualizarCatalogoNfseProduto(editing.id, {
          discriminacao: discriminacao.trim(),
          codigo: codigo.trim(),
          cnae: isNfeLikeCatalogDocumentType(documentType) ? '' : cnae.trim(),
          aliquota: isNfeLikeCatalogDocumentType(documentType) ? null : aliquotaVal,
          valor_sugerido: valorNum,
          metadata_json: metadataJson
        });
      } else {
        await criarCatalogoNfseProduto({
          discriminacao: discriminacao.trim(),
          codigo: codigo.trim() || undefined,
          cnae: isNfeLikeCatalogDocumentType(documentType) ? undefined : cnae.trim() || undefined,
          ...(aliquotaVal !== null && !isNfeLikeCatalogDocumentType(documentType)
            ? { aliquota: aliquotaVal }
            : {}),
          ...(valorNum !== null ? { valor_sugerido: valorNum } : {}),
          ...(metadataJson ? { metadata_json: metadataJson } : {}),
          documentType
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
          Itens reutilizáveis na emissão de NFS-e ou NF-e (cadastre tributos do produto uma vez).
        </p>

        <div className="mb-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Tipo de documento</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Tipo de documento fiscal">
            {(['NFSE', 'NFE', 'NFCE'] as DocumentType[]).map((dt) => {
              const selected = documentType === dt;
              return (
                <button
                  key={dt}
                  type="button"
                  className={selected ? 'planner-button-primary-compact' : 'planner-button-secondary-compact'}
                  aria-pressed={selected}
                  disabled={isEdit}
                  onClick={() => {
                    if (isEdit) return;
                    setDocumentType(dt);
                    if (isNfeLikeCatalogDocumentType(dt)) {
                      setNfeFields(emptyNfeCatalogProdutoFormFields());
                    }
                  }}
                >
                  {dt}
                </button>
              );
            })}
          </div>
          {isEdit ? (
            <p className="mt-1 text-xs text-slate-500">O tipo não pode ser alterado após criar o item.</p>
          ) : null}
        </div>

        {isNfeLikeCatalogDocumentType(documentType) ? (
          <div
            className="mb-4 rounded-lg border border-violet-200/80 bg-violet-50/80 p-3 text-sm text-slate-700 dark:border-violet-900/50 dark:bg-violet-950/30 dark:text-slate-200"
            role="note"
          >
            Cadastre NCM, CFOP e tributos aqui. Na emissão de {documentType === 'NFE' ? 'NF-e' : 'NFC-e'}, escolha este
            produto no catálogo — os campos fiscais vêm preenchidos.
          </div>
        ) : (
        <div
          className="mb-4 rounded-lg border border-amber-200/80 bg-amber-50/90 p-3 text-sm text-slate-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-slate-200"
          role="note"
        >
          <p className="font-medium">Código do serviço e CNAE são coisas diferentes</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs sm:text-sm">
            <li>
              <strong>Código (LC 116):</strong> item da lista da <strong>prefeitura</strong> para a NFS-e
              (ex.: 14.01.01). Pesquisa abaixo na lista nacional de referência.
            </li>
            <li>
              <strong>CNAE:</strong> atividade da empresa na <strong>Receita Federal</strong>, 7 dígitos
              (ex.: 4211102). Não repita o mesmo valor no código municipal.
            </li>
          </ul>
        </div>
        )}

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
              {isNfeLikeCatalogDocumentType(documentType) ? 'Descrição do produto' : 'Discriminação'}{' '}
              <span className="text-red-600">*</span>
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

          {isNfeLikeCatalogDocumentType(documentType) ? (
            <>
              <div>
                <label htmlFor="mei-cat-prod-cod" className="mb-1 block font-medium dark:text-gray-200">
                  Código / SKU <span className="text-red-600">*</span>
                </label>
                <input
                  ref={codigoRef}
                  id="mei-cat-prod-cod"
                  className="planner-input-compact w-full"
                  value={codigo}
                  onChange={(ev) => setCodigo(ev.target.value)}
                  aria-invalid={Boolean(fieldErrors.codigo)}
                />
                {fieldErrors.codigo ? (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                    {fieldErrors.codigo}
                  </p>
                ) : null}
              </div>
              <div>
                <label htmlFor="mei-cat-prod-ncm" className="mb-1 block font-medium dark:text-gray-200">
                  NCM (8 dígitos) <span className="text-red-600">*</span>
                </label>
                <input
                  id="mei-cat-prod-ncm"
                  className="planner-input-compact w-full tabular-nums"
                  value={nfeFields.ncm}
                  onChange={(ev) =>
                    setNfeFields((f) => ({ ...f, ncm: ev.target.value.replace(/\D/g, '').slice(0, 8) }))
                  }
                  inputMode="numeric"
                  aria-invalid={Boolean(fieldErrors.ncm)}
                />
                {fieldErrors.ncm ? (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                    {fieldErrors.ncm}
                  </p>
                ) : null}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="mei-cat-prod-cfop" className="mb-1 block font-medium dark:text-gray-200">
                    CFOP <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="mei-cat-prod-cfop"
                    className="planner-input-compact w-full tabular-nums"
                    value={nfeFields.cfop}
                    onChange={(ev) =>
                      setNfeFields((f) => ({ ...f, cfop: ev.target.value.replace(/\D/g, '').slice(0, 4) }))
                    }
                    inputMode="numeric"
                  />
                </div>
                <div>
                  <label htmlFor="mei-cat-prod-un" className="mb-1 block font-medium dark:text-gray-200">
                    Unidade <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="mei-cat-prod-un"
                    className="planner-input-compact w-full"
                    value={nfeFields.unidade}
                    onChange={(ev) => setNfeFields((f) => ({ ...f, unidade: ev.target.value }))}
                  />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label htmlFor="mei-cat-prod-csosn" className="mb-1 block text-sm font-medium dark:text-gray-200">
                    CSOSN <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="mei-cat-prod-csosn"
                    className="planner-input-compact w-full tabular-nums"
                    value={nfeFields.icmsCsosn}
                    onChange={(ev) =>
                      setNfeFields((f) => ({
                        ...f,
                        icmsCsosn: ev.target.value.replace(/\D/g, '').slice(0, 3),
                      }))
                    }
                    placeholder="102"
                  />
                </div>
                <div>
                  <label htmlFor="mei-cat-prod-pis" className="mb-1 block text-sm font-medium dark:text-gray-200">
                    CST PIS <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="mei-cat-prod-pis"
                    className="planner-input-compact w-full tabular-nums"
                    value={nfeFields.pisCst}
                    onChange={(ev) =>
                      setNfeFields((f) => ({ ...f, pisCst: ev.target.value.replace(/\D/g, '').slice(0, 2) }))
                    }
                    placeholder="49"
                  />
                </div>
                <div>
                  <label htmlFor="mei-cat-prod-cofins" className="mb-1 block text-sm font-medium dark:text-gray-200">
                    CST COFINS <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="mei-cat-prod-cofins"
                    className="planner-input-compact w-full tabular-nums"
                    value={nfeFields.cofinsCst}
                    onChange={(ev) =>
                      setNfeFields((f) => ({
                        ...f,
                        cofinsCst: ev.target.value.replace(/\D/g, '').slice(0, 2),
                      }))
                    }
                    placeholder="49"
                  />
                </div>
              </div>
            </>
          ) : (
          <>
          <div>
            <label htmlFor="mei-cat-prod-cod" className="mb-1 block font-medium dark:text-gray-200">
              Código do serviço — LC 116 / prefeitura
              <span className="text-slate-400"> (opcional no catálogo)</span>
            </label>
            <p id="mei-cat-prod-cod-help" className="mb-2 text-xs text-slate-500 dark:text-slate-400">
              Item da tabela municipal de serviços. Mín. 6 caracteres sem máscara. Não é o CNAE.
            </p>
            <MeiCodigoServicoCombobox
              ref={codigoRef}
              id="mei-cat-prod-cod"
              value={codigo}
              onChange={setCodigo}
              onSelectReferencia={(row: CodigoServicoReferencia) => {
                if (row.codigo_nbs) {
                  setCodigoNbs(normalizeCodigoNbsInput(row.codigo_nbs));
                }
              }}
              aria-invalid={Boolean(fieldErrors.codigo)}
              aria-describedby={
                fieldErrors.codigo ? 'mei-cat-prod-cod-err mei-cat-prod-cod-help' : 'mei-cat-prod-cod-help'
              }
            />
            {fieldErrors.codigo ? (
              <p id="mei-cat-prod-cod-err" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                {fieldErrors.codigo}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="mei-cat-prod-cnae" className="mb-1 block font-medium dark:text-gray-200">
              CNAE — atividade económica
              <span className="text-slate-400"> (opcional no catálogo)</span>
            </label>
            <p id="mei-cat-prod-cnae-help" className="mb-2 text-xs text-slate-500 dark:text-slate-400">
              7 dígitos da atividade (Receita Federal). Ex.: 4211102 ou 4211-1/02.
            </p>
            <input
              ref={cnaeRef}
              id="mei-cat-prod-cnae"
              className="planner-input-compact w-full"
              value={cnae}
              onChange={(ev) => setCnae(ev.target.value)}
              placeholder="Ex.: 4211102"
              inputMode="numeric"
              aria-invalid={Boolean(fieldErrors.cnae)}
              aria-describedby={
                fieldErrors.cnae ? 'mei-cat-prod-cnae-err mei-cat-prod-cnae-help' : 'mei-cat-prod-cnae-help'
              }
              autoComplete="off"
            />
            {fieldErrors.cnae ? (
              <p id="mei-cat-prod-cnae-err" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                {fieldErrors.cnae}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="mei-cat-prod-nbs" className="mb-1 block font-medium dark:text-gray-200">
              Código NBS
              <span className="text-slate-400"> (recomendado — NFS-e Nacional)</span>
            </label>
            <p id="mei-cat-prod-nbs-help" className="mb-2 text-xs text-slate-500 dark:text-slate-400">
              9 dígitos exigidos pelo Emissor Nacional. Sugerido ao escolher o código LC 116; pode ajustar manualmente.
            </p>
            <input
              ref={codigoNbsRef}
              id="mei-cat-prod-nbs"
              className="planner-input-compact w-full tabular-nums"
              value={codigoNbs}
              onChange={(ev) => setCodigoNbs(normalizeCodigoNbsInput(ev.target.value))}
              placeholder="Ex.: 114061100"
              inputMode="numeric"
              maxLength={9}
              aria-invalid={Boolean(fieldErrors.codigoNbs)}
              aria-describedby={
                fieldErrors.codigoNbs ? 'mei-cat-prod-nbs-err mei-cat-prod-nbs-help' : 'mei-cat-prod-nbs-help'
              }
              autoComplete="off"
            />
            {fieldErrors.codigoNbs ? (
              <p id="mei-cat-prod-nbs-err" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                {fieldErrors.codigoNbs}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="mei-cat-prod-alq" className="mb-2 block font-medium dark:text-gray-200">
              Alíquota (%) <span className="text-slate-400">(opcional — MEI/Simples não informa ISS)</span>
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
          </>
          )}

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
