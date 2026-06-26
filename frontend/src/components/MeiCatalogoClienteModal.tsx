import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { NfseCatalogCliente } from '../services/meiNotasService';
import {
  criarCatalogoNfseCliente,
  atualizarCatalogoNfseCliente,
  lookupNfseEnderecoPorCep,
} from '../services/meiNotasService';
import {
  createAdminMeiCatalogoCliente,
  updateAdminMeiCatalogoCliente
} from '../services/adminUserDataService';
import { formatCpfCnpjPtBr, onlyDigits } from '../lib/formatCpfCnpjPtBr';
import {
  MEI_CATALOGO_DELETE_CLIENTE_DANGER_CTA,
  MEI_CATALOGO_DELETE_CLIENTE_DANGER_HEADING,
  MEI_CATALOGO_DELETE_CLIENTE_DANGER_HINT
} from '../copy/meiCatalogoClienteDelete';
import UserFacingErrorBlock from './UserFacingErrorBlock';
import { mapMeiCatalogApiErrorToUserFacing } from '../lib/mapMeiCatalogApiErrorToUserFacing';
import {
  buildCatalogoClienteMetadataJson,
  catalogoClienteEnderecoFromMetadata,
  emptyCatalogoClienteEndereco,
  formatCepPtBrInput,
  mergeCatalogoEnderecoFromCepLookup,
  validateCatalogoClienteEndereco,
  type CatalogoClienteEnderecoForm,
} from '../utils/catalogoClienteEndereco';

const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface MeiCatalogoClienteModalProps {
  open: boolean;
  onClose: () => void;
  /** Após sucesso (lista e toast fora). */
  onSaved: (kind: 'create' | 'edit') => void;
  editing: NfseCatalogCliente | null;
  /** Modo edição: abre o diálogo de confirmação de exclusão (controlado pelo pai). */
  onRequestDelete?: () => void;
  /** Quando definido, grava no catálogo do utilizador alvo (rotas admin). */
  catalogAdminUserId?: string | null;
  /** z-index acima do drawer admin “Gerir clientes”. */
  elevatedStack?: boolean;
}

type FieldKey =
  | 'nome'
  | 'documento'
  | 'email'
  | 'cep'
  | 'logradouro'
  | 'numero'
  | 'bairro'
  | 'codigoCidade'
  | 'descricaoCidade'
  | 'estado'
  | 'endereco';

export default function MeiCatalogoClienteModal({
  open,
  onClose,
  onSaved,
  editing,
  onRequestDelete,
  catalogAdminUserId = null,
  elevatedStack = false
}: MeiCatalogoClienteModalProps) {
  const [nome, setNome] = useState('');
  const [documento, setDocumento] = useState('');
  const [email, setEmail] = useState('');
  const [endereco, setEndereco] = useState<CatalogoClienteEnderecoForm>(() => emptyCatalogoClienteEndereco());
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [apiError, setApiError] = useState<unknown | null>(null);
  const [saving, setSaving] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepLookupError, setCepLookupError] = useState<string | null>(null);

  const nomeRef = useRef<HTMLInputElement>(null);
  const documentoRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const cepRef = useRef<HTMLInputElement>(null);
  const logradouroRef = useRef<HTMLInputElement>(null);
  const numeroRef = useRef<HTMLInputElement>(null);

  const isEdit = Boolean(editing);
  const docDigits = onlyDigits(documento);
  const enderecoObrigatorio = docDigits.length === 14;

  useEffect(() => {
    if (!open) return;
    setFieldErrors({});
    setApiError(null);
    setCepLookupError(null);
    setCepLoading(false);
    if (editing) {
      setNome(editing.nome || '');
      setDocumento(formatCpfCnpjPtBr(editing.documento || ''));
      setEmail(editing.email || '');
      setEndereco(catalogoClienteEnderecoFromMetadata(editing.metadata_json));
    } else {
      setNome('');
      setDocumento('');
      setEmail('');
      setEndereco(emptyCatalogoClienteEndereco());
    }
  }, [open, editing]);

  const focusFirstError = (keys: FieldKey[]) => {
    const order: FieldKey[] = [
      'nome',
      'documento',
      'email',
      'cep',
      'logradouro',
      'numero',
      'bairro',
      'codigoCidade',
      'descricaoCidade',
      'estado',
      'endereco',
    ];
    const first = order.find((k) => keys.includes(k));
    if (first === 'nome') nomeRef.current?.focus();
    else if (first === 'documento') documentoRef.current?.focus();
    else if (first === 'email') emailRef.current?.focus();
    else if (first === 'cep') cepRef.current?.focus();
    else if (first === 'logradouro') logradouroRef.current?.focus();
    else if (first === 'numero') numeroRef.current?.focus();
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
    const docDigits = onlyDigits(documento);
    const enderecoObrigatorio = docDigits.length === 14;
    const enderecoMsg = validateCatalogoClienteEndereco(endereco, {
      obrigatorio: enderecoObrigatorio,
    });
    if (enderecoMsg) {
      next.endereco = enderecoMsg;
      if (enderecoMsg.includes('CEP')) next.cep = enderecoMsg;
      else if (enderecoMsg.includes('logradouro')) next.logradouro = enderecoMsg;
      else if (enderecoMsg.includes('bairro')) next.bairro = enderecoMsg;
      else if (enderecoMsg.includes('IBGE')) next.codigoCidade = enderecoMsg;
      else if (enderecoMsg.includes('cidade')) next.descricaoCidade = enderecoMsg;
      else if (enderecoMsg.includes('UF')) next.estado = enderecoMsg;
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

  const handleCepChange = (value: string) => {
    setCepLookupError(null);
    setEndereco((prev) => ({ ...prev, cep: formatCepPtBrInput(value) }));
  };

  const runCepLookup = useCallback(async (cepDigits: string) => {
    if (cepDigits.length !== 8) return;
    setCepLoading(true);
    setCepLookupError(null);
    try {
      const lookup = await lookupNfseEnderecoPorCep(cepDigits);
      setEndereco((prev) => mergeCatalogoEnderecoFromCepLookup(prev, {
        cep: lookup.cep ?? cepDigits,
        logradouro: lookup.logradouro ?? undefined,
        bairro: lookup.bairro ?? undefined,
        codigoCidade: lookup.codigoCidade ?? undefined,
        descricaoCidade: lookup.descricaoCidade ?? undefined,
        estado: lookup.estado ?? undefined,
        complemento: lookup.complemento ?? undefined,
      }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Não foi possível consultar o CEP.';
      setCepLookupError(msg);
    } finally {
      setCepLoading(false);
    }
  }, []);

  const handleCepBlur = () => {
    const cepDigits = onlyDigits(endereco.cep);
    if (cepDigits.length === 8) {
      void runCepLookup(cepDigits);
    }
  };

  const buildPayloadMetadata = () => {
    const metadata = buildCatalogoClienteMetadataJson(endereco);
    return metadata ?? undefined;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setApiError(null);
    setSaving(true);
    const metadata_json = buildPayloadMetadata();
    try {
      if (catalogAdminUserId) {
        if (isEdit && editing) {
          await updateAdminMeiCatalogoCliente(catalogAdminUserId, editing.id, {
            nome: nome.trim(),
            email: email.trim() ? email.trim() : null,
            metadata_json: metadata_json ?? null,
          });
        } else {
          await createAdminMeiCatalogoCliente(catalogAdminUserId, {
            nome: nome.trim(),
            documento,
            email: email.trim() ? email.trim() : undefined,
            documentType: 'NFSE',
            metadata_json,
          });
        }
      } else if (isEdit && editing) {
        await atualizarCatalogoNfseCliente(editing.id, {
          nome: nome.trim(),
          email: email.trim() ? email.trim() : null,
          metadata_json: metadata_json ?? null,
        });
      } else {
        await criarCatalogoNfseCliente({
          nome: nome.trim(),
          documento,
          email: email.trim() ? email.trim() : undefined,
          documentType: 'NFSE',
          metadata_json,
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

  const errId = 'mei-catalogo-cliente-api-err';

  const overlayZ = elevatedStack ? 'z-[70]' : 'z-50';

  return (
    <div
      className={`fixed inset-0 ${overlayZ} flex items-center justify-center bg-black/40`}
      onClick={onClose}
      role="presentation"
    >
      <div
        className="planner-card relative max-h-[90vh] w-full max-w-lg overflow-y-auto p-8"
        onClick={(ev) => ev.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mei-catalogo-cliente-title"
      >
        <button
          type="button"
          aria-label="Fechar"
          className="ui-modal-icon-dismiss absolute right-3 top-3"
          onClick={onClose}
        >
          ×
        </button>
        <h2 id="mei-catalogo-cliente-title" className="mb-4 text-xl font-bold dark:text-white">
          {isEdit ? 'Editar cliente' : 'Novo cliente'}
        </h2>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          Clientes usados como tomadores na NFS-e. Para CNPJ o endereço com CEP e IBGE é obrigatório;
          para CPF é opcional — se informar o CEP, preenchemos o restante automaticamente.
          O documento não pode ser alterado após criar o registo.
        </p>

        {apiError != null ? (
          <div id={errId} className="mb-4" role="alert">
            <UserFacingErrorBlock
              {...mapMeiCatalogApiErrorToUserFacing(apiError, 'Erro ao guardar.', 'mei_catalogo.clientes.modal')}
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

          <fieldset className="space-y-4 rounded-lg border border-slate-200/80 p-4 dark:border-slate-700/80">
            <legend className="px-1 text-sm font-semibold text-slate-800 dark:text-slate-200">
              {enderecoObrigatorio
                ? 'Endereço fiscal (obrigatório para CNPJ)'
                : 'Endereço fiscal (opcional para CPF)'}
            </legend>

            <div>
              <label htmlFor="mei-cat-cli-cep" className="mb-2 block font-medium dark:text-gray-200">
                CEP {enderecoObrigatorio ? <span className="text-red-600">*</span> : null}
              </label>
              <div className="flex items-center gap-2">
                <input
                  ref={cepRef}
                  id="mei-cat-cli-cep"
                  className="planner-input-compact w-full"
                  value={endereco.cep}
                  onChange={(ev) => handleCepChange(ev.target.value)}
                  onBlur={handleCepBlur}
                  inputMode="numeric"
                  autoComplete="postal-code"
                  placeholder="00000-000"
                  aria-invalid={Boolean(fieldErrors.cep || fieldErrors.endereco)}
                  aria-describedby="mei-cat-cli-cep-hint"
                  disabled={cepLoading || saving}
                />
                {cepLoading ? (
                  <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400" aria-live="polite">
                    Buscando…
                  </span>
                ) : null}
              </div>
              <p id="mei-cat-cli-cep-hint" className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {enderecoObrigatorio
                  ? 'Ao sair do campo, buscamos logradouro, cidade, UF e código IBGE.'
                  : 'Opcional. Se informar o CEP, preenchemos logradouro, cidade, UF e IBGE.'}
              </p>
              {cepLookupError ? (
                <p className="mt-1 text-sm text-amber-700 dark:text-amber-300" role="status">
                  {cepLookupError}
                </p>
              ) : null}
              {fieldErrors.cep ? (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                  {fieldErrors.cep}
                </p>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="mei-cat-cli-logradouro" className="mb-2 block text-sm font-medium dark:text-gray-200">
                  Logradouro
                </label>
                <input
                  ref={logradouroRef}
                  id="mei-cat-cli-logradouro"
                  className="planner-input-compact w-full"
                  value={endereco.logradouro}
                  onChange={(ev) => setEndereco((prev) => ({ ...prev, logradouro: ev.target.value }))}
                  autoComplete="street-address"
                />
              </div>
              <div>
                <label htmlFor="mei-cat-cli-numero" className="mb-2 block text-sm font-medium dark:text-gray-200">
                  Número <span className="text-slate-400">(opcional)</span>
                </label>
                <input
                  ref={numeroRef}
                  id="mei-cat-cli-numero"
                  className="planner-input-compact w-full"
                  value={endereco.numero}
                  onChange={(ev) => setEndereco((prev) => ({ ...prev, numero: ev.target.value }))}
                  placeholder="S/N"
                />
              </div>
              <div>
                <label htmlFor="mei-cat-cli-bairro" className="mb-2 block text-sm font-medium dark:text-gray-200">
                  Bairro
                </label>
                <input
                  id="mei-cat-cli-bairro"
                  className="planner-input-compact w-full"
                  value={endereco.bairro}
                  onChange={(ev) => setEndereco((prev) => ({ ...prev, bairro: ev.target.value }))}
                />
              </div>
              <div>
                <label htmlFor="mei-cat-cli-cidade" className="mb-2 block text-sm font-medium dark:text-gray-200">
                  Cidade
                </label>
                <input
                  id="mei-cat-cli-cidade"
                  className="planner-input-compact w-full"
                  value={endereco.descricaoCidade}
                  onChange={(ev) => setEndereco((prev) => ({ ...prev, descricaoCidade: ev.target.value }))}
                />
              </div>
              <div>
                <label htmlFor="mei-cat-cli-uf" className="mb-2 block text-sm font-medium dark:text-gray-200">
                  UF
                </label>
                <input
                  id="mei-cat-cli-uf"
                  className="planner-input-compact w-full uppercase"
                  value={endereco.estado}
                  onChange={(ev) => setEndereco((prev) => ({
                    ...prev,
                    estado: ev.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2),
                  }))}
                  maxLength={2}
                />
              </div>
              <div>
                <label htmlFor="mei-cat-cli-ibge" className="mb-2 block text-sm font-medium dark:text-gray-200">
                  Código IBGE {enderecoObrigatorio ? <span className="text-red-600">*</span> : null}
                </label>
                <input
                  id="mei-cat-cli-ibge"
                  className="planner-input-compact w-full"
                  value={endereco.codigoCidade}
                  onChange={(ev) => setEndereco((prev) => ({
                    ...prev,
                    codigoCidade: ev.target.value.replace(/\D/g, '').slice(0, 7),
                  }))}
                  inputMode="numeric"
                  readOnly
                  aria-readonly="true"
                />
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Preenchido automaticamente pelo CEP.
                </p>
              </div>
            </div>

            {fieldErrors.endereco && !fieldErrors.cep ? (
              <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                {fieldErrors.endereco}
              </p>
            ) : null}
          </fieldset>

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
            <button type="submit" className="planner-button" disabled={saving || cepLoading}>
              {saving ? 'A guardar…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
