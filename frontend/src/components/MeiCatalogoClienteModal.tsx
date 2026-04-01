import React, { useEffect, useRef, useState } from 'react';
import type { NfseCatalogCliente } from '../services/meiNotasService';
import {
  criarCatalogoNfseCliente,
  atualizarCatalogoNfseCliente
} from '../services/meiNotasService';
import { formatCpfCnpjPtBr, onlyDigits } from '../lib/formatCpfCnpjPtBr';
import {
  MEI_CATALOGO_DELETE_CLIENTE_DANGER_CTA,
  MEI_CATALOGO_DELETE_CLIENTE_DANGER_HEADING,
  MEI_CATALOGO_DELETE_CLIENTE_DANGER_HINT
} from '../copy/meiCatalogoClienteDelete';
import { formatMeiFiscalMappedForAlert, mapMeiFiscalErrorFromUnknown } from '../lib/fiscalUserError';

const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface MeiCatalogoClienteModalProps {
  open: boolean;
  onClose: () => void;
  /** Após sucesso (lista e toast fora). */
  onSaved: (kind: 'create' | 'edit') => void;
  editing: NfseCatalogCliente | null;
  /** Modo edição: abre o diálogo de confirmação de exclusão (controlado pelo pai). */
  onRequestDelete?: () => void;
}

type FieldKey = 'nome' | 'documento' | 'email';

export default function MeiCatalogoClienteModal({
  open,
  onClose,
  onSaved,
  editing,
  onRequestDelete
}: MeiCatalogoClienteModalProps) {
  const [nome, setNome] = useState('');
  const [documento, setDocumento] = useState('');
  const [email, setEmail] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const nomeRef = useRef<HTMLInputElement>(null);
  const documentoRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  const isEdit = Boolean(editing);

  useEffect(() => {
    if (!open) return;
    setFieldErrors({});
    setApiError(null);
    if (editing) {
      setNome(editing.nome || '');
      setDocumento(formatCpfCnpjPtBr(editing.documento || ''));
      setEmail(editing.email || '');
    } else {
      setNome('');
      setDocumento('');
      setEmail('');
    }
  }, [open, editing]);

  const focusFirstError = (keys: FieldKey[]) => {
    const order: FieldKey[] = ['nome', 'documento', 'email'];
    const first = order.find((k) => keys.includes(k));
    if (first === 'nome') nomeRef.current?.focus();
    else if (first === 'documento') documentoRef.current?.focus();
    else if (first === 'email') emailRef.current?.focus();
  };

  const validate = (): boolean => {
    const next: Partial<Record<FieldKey, string>> = {};
    if (!nome.trim()) {
      next.nome = 'Informe o nome ou razão social.';
    }
    if (!isEdit) {
      const d = onlyDigits(documento);
      if (d.length !== 11 && d.length !== 14) {
        next.documento = 'CPF deve ter 11 dígitos ou CNPJ 14 dígitos.';
      }
    }
    const emailTrim = email.trim();
    if (emailTrim && !EMAIL_OK.test(emailTrim)) {
      next.email = 'E-mail inválido.';
    }
    setFieldErrors(next);
    if (Object.keys(next).length > 0) {
      focusFirstError(Object.keys(next) as FieldKey[]);
      return false;
    }
    return true;
  };

  const handleDocumentoChange = (value: string) => {
    if (isEdit) return;
    setDocumento(formatCpfCnpjPtBr(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setApiError(null);
    setSaving(true);
    try {
      if (isEdit && editing) {
        await atualizarCatalogoNfseCliente(editing.id, {
          nome: nome.trim(),
          email: email.trim() ? email.trim() : null
        });
      } else {
        await criarCatalogoNfseCliente({
          nome: nome.trim(),
          documento,
          email: email.trim() ? email.trim() : undefined,
          documentType: 'NFSE'
        });
      }
      onSaved(isEdit ? 'edit' : 'create');
      onClose();
    } catch (err) {
      setApiError(
        formatMeiFiscalMappedForAlert(mapMeiFiscalErrorFromUnknown(err, 'Erro ao guardar.'))
      );
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const errId = 'mei-catalogo-cliente-api-err';

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
        aria-labelledby="mei-catalogo-cliente-title"
      >
        <button
          type="button"
          aria-label="Fechar"
          className="absolute right-3 top-3 text-slate-400 dark:text-slate-300"
          onClick={onClose}
        >
          ×
        </button>
        <h2 id="mei-catalogo-cliente-title" className="mb-4 text-xl font-bold dark:text-white">
          {isEdit ? 'Editar cliente' : 'Novo cliente'}
        </h2>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          Clientes usados como tomadores na NFS-e. O documento não pode ser alterado após criar o registo.
        </p>

        {apiError && (
          <div
            id={errId}
            className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
            role="alert"
          >
            <span className="whitespace-pre-wrap break-words">{apiError}</span>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
          noValidate
          {...(apiError ? { 'aria-describedby': errId } : {})}
        >
          <div>
            <label htmlFor="mei-cat-cli-nome" className="mb-2 block font-medium dark:text-gray-200">
              Nome ou razão social <span className="text-red-600">*</span>
            </label>
            <input
              ref={nomeRef}
              id="mei-cat-cli-nome"
              className="planner-input-compact w-full"
              value={nome}
              onChange={(ev) => setNome(ev.target.value)}
              aria-invalid={Boolean(fieldErrors.nome)}
              aria-describedby={fieldErrors.nome ? 'mei-cat-cli-nome-err' : undefined}
              autoComplete="organization"
            />
            {fieldErrors.nome ? (
              <p id="mei-cat-cli-nome-err" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                {fieldErrors.nome}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="mei-cat-cli-doc" className="mb-2 block font-medium dark:text-gray-200">
              CPF ou CNPJ {!isEdit && <span className="text-red-600">*</span>}
            </label>
            <input
              ref={documentoRef}
              id="mei-cat-cli-doc"
              className="planner-input-compact w-full disabled:opacity-70"
              value={documento}
              onChange={(ev) => handleDocumentoChange(ev.target.value)}
              disabled={isEdit}
              readOnly={isEdit}
              inputMode="numeric"
              autoComplete="off"
              aria-invalid={Boolean(fieldErrors.documento)}
              aria-describedby={fieldErrors.documento ? 'mei-cat-cli-doc-err' : undefined}
            />
            {fieldErrors.documento ? (
              <p id="mei-cat-cli-doc-err" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                {fieldErrors.documento}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="mei-cat-cli-email" className="mb-2 block font-medium dark:text-gray-200">
              E-mail <span className="text-slate-400">(opcional)</span>
            </label>
            <input
              ref={emailRef}
              id="mei-cat-cli-email"
              type="email"
              className="planner-input-compact w-full"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? 'mei-cat-cli-email-err' : undefined}
              autoComplete="email"
            />
            {fieldErrors.email ? (
              <p id="mei-cat-cli-email-err" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                {fieldErrors.email}
              </p>
            ) : null}
          </div>

          {isEdit && onRequestDelete ? (
            <div className="border-t border-slate-200 pt-4 dark:border-slate-700">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                {MEI_CATALOGO_DELETE_CLIENTE_DANGER_HEADING}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {MEI_CATALOGO_DELETE_CLIENTE_DANGER_HINT}
              </p>
              <button
                type="button"
                className="mt-3 inline-flex min-h-[44px] items-center rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                onClick={onRequestDelete}
                disabled={saving}
              >
                {MEI_CATALOGO_DELETE_CLIENTE_DANGER_CTA}
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
