import { useEffect, useRef, useState, type ReactNode } from 'react';
import { formatCpfCnpjPtBr } from '../../lib/formatCpfCnpjPtBr';
import {
  createEmptyMeiNfeLikeItem,
  type MeiNfeLikeFormState,
  type MeiNfeLikeItemFormState
} from '../../utils/meiNfeLikeFormState';
import { mapCatalogProdutoToNfeItemRow } from '../../utils/mapCatalogProdutoToNfeItem';
import { parseMeiDecimalInput } from '../../utils/meiNfeLikePayloadBuilder';
import { MeiNfeLikeCatalogProdutoPickerModal } from './MeiNfeLikeCatalogProdutoPickerModal';
import {
  DESTINATARIO_IE_OPTIONS,
  DESTINATARIO_IE_SECTION_HINT,
} from '../../utils/meiNfeDestinatarioIe';

function formatItemLineTotalBrl(quantidade: string, valorUnitario: string): string | null {
  const q = parseMeiDecimalInput(quantidade);
  const vu = parseMeiDecimalInput(valorUnitario);
  if (q === null || vu === null || q <= 0 || vu <= 0) return null;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(q * vu);
}

function NfeLikeCollapsible(props: {
  section: string;
  title: string;
  open: boolean;
  onToggle: () => void;
  /** Desactiva inputs dentro do painel (cabeçalho do acordeão continua clicável). */
  fieldsDisabled?: boolean;
  children: ReactNode;
}) {
  const panelId = `mei-nfe-like-panel-${props.section}`;
  const headingId = `mei-nfe-like-heading-${props.section}`;
  return (
    <div className="rounded-lg border border-slate-200/80 p-3 dark:border-slate-700/80">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 rounded-md py-1 text-left text-sm font-semibold text-slate-700 dark:text-gray-200"
        aria-expanded={props.open}
        aria-controls={panelId}
        id={headingId}
        onClick={props.onToggle}
      >
        <span>{props.title}</span>
        <span className="shrink-0 text-xs font-normal text-slate-500 dark:text-slate-400" aria-hidden>
          {props.open ? '▼' : '▶'}
        </span>
      </button>
      {props.open ? (
        <fieldset
          disabled={props.fieldsDisabled}
          className="mt-3 min-w-0 border-0 p-0 [&:disabled]:opacity-60"
        >
          <div id={panelId} className="space-y-3" role="region" aria-labelledby={headingId}>
            {props.children}
          </div>
        </fieldset>
      ) : null}
    </div>
  );
}

export type MeiNfeLikeEmitFormProps = {
  documentLabel: 'NF-e' | 'NFC-e';
  value: MeiNfeLikeFormState;
  onChange: (next: MeiNfeLikeFormState) => void;
  errors: Record<string, string>;
  /** Abre a secção quando a validação cliente falha. */
  flashOpenSection?: 'emitente' | 'destinatario' | 'itens' | null;
  onFlashOpenConsumed?: () => void;
  /** FR-GUIA-FISC-07: bloqueio de capacidade no emissor integrado. */
  fieldsDisabled?: boolean;
  /** FR-GUIA-FISC-12: catálogo → linha (só NF-e / NFC-e). */
  nfLikeCatalogDocumentType?: 'NFE' | 'NFCE';
  /** Abre cadastro do emitente (ex.: secção empresa na guia MEI). */
  onEditEmitenteCadastro?: () => void;
};

export function MeiNfeLikeEmitForm({
  documentLabel,
  value,
  onChange,
  errors,
  flashOpenSection,
  onFlashOpenConsumed,
  fieldsDisabled = false,
  nfLikeCatalogDocumentType,
  onEditEmitenteCadastro
}: MeiNfeLikeEmitFormProps) {
  const catalogAddBtnRef = useRef<HTMLButtonElement>(null);
  const [catalogPickerOpen, setCatalogPickerOpen] = useState(false);
  const [open, setOpen] = useState({
    emitente: true,
    destinatario: true,
    itens: true
  });

  useEffect(() => {
    if (!flashOpenSection) return;
    setOpen((prev) => ({ ...prev, [flashOpenSection]: true }));
    onFlashOpenConsumed?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- consumir flash uma vez por valor
  }, [flashOpenSection]);

  const toggle = (key: keyof typeof open) => {
    setOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const patch = (partial: Partial<MeiNfeLikeFormState>) => {
    onChange({ ...value, ...partial });
  };

  const patchItem = (index: number, partial: Partial<MeiNfeLikeItemFormState>) => {
    const itens = value.itens.map((row, i) => (i === index ? { ...row, ...partial } : row));
    onChange({ ...value, itens });
  };

  const addItem = () => {
    onChange({ ...value, itens: [...value.itens, createEmptyMeiNfeLikeItem()] });
  };

  const closeCatalogPicker = () => {
    setCatalogPickerOpen(false);
    requestAnimationFrame(() => catalogAddBtnRef.current?.focus());
  };

  const appendItemFromCatalog = (row: MeiNfeLikeItemFormState) => {
    onChange({ ...value, itens: [...value.itens, row] });
  };

  const removeItem = (index: number) => {
    onChange({ ...value, itens: value.itens.filter((_, i) => i !== index) });
  };

  const err = (id: string) => errors[id];

  return (
    <div
      className="space-y-3"
      aria-disabled={fieldsDisabled || undefined}
      data-mei-nfe-like-locked={fieldsDisabled ? 'true' : undefined}
    >
      <NfeLikeCollapsible
        section="emitente"
        title="Emitente"
        open={open.emitente}
        onToggle={() => toggle('emitente')}
        fieldsDisabled={fieldsDisabled}
      >
        <p className="text-xs text-slate-500 dark:text-slate-400">Normalmente o CNPJ do seu MEI.</p>
        <div className="admin-toolbar grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400" htmlFor="mei-nfe-emitente-cnpj">
              CNPJ do emitente
              <span className="admin-required-mark">*</span>
            </label>
            <input
              id="mei-nfe-emitente-cnpj"
              className="planner-input-compact w-full"
              type="text"
              inputMode="numeric"
              value={value.emitenteCnpj}
              aria-invalid={Boolean(err('mei-nfe-emitente-cnpj'))}
              aria-describedby={err('mei-nfe-emitente-cnpj') ? 'mei-nfe-emitente-cnpj-err' : undefined}
              onChange={(e) => patch({ emitenteCnpj: formatCpfCnpjPtBr(e.target.value) })}
              placeholder="00.000.000/0001-00"
            />
            {err('mei-nfe-emitente-cnpj') ? (
              <p id="mei-nfe-emitente-cnpj-err" className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                {err('mei-nfe-emitente-cnpj')}
              </p>
            ) : null}
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400" htmlFor="mei-nfe-emitente-razao">
              Razão social do emitente
            </label>
            <input
              id="mei-nfe-emitente-razao"
              className="planner-input-compact w-full"
              type="text"
              value={value.emitenteRazao}
              onChange={(e) => patch({ emitenteRazao: e.target.value })}
              placeholder="Razão social"
            />
          </div>
          <div className="md:col-span-2">
            <label
              className="mb-1 block text-xs text-slate-500 dark:text-slate-400"
              htmlFor="mei-nfe-emitente-ie"
            >
              Inscrição Estadual do emitente (opcional)
            </label>
            <input
              id="mei-nfe-emitente-ie"
              className="planner-input-compact w-full"
              type="text"
              value={value.emitenteInscricaoEstadual}
              onChange={(e) => patch({ emitenteInscricaoEstadual: e.target.value })}
              placeholder="Somente números ou ISENTO"
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              IE da sua empresa MEI no XML do emitente. Não confunda com a IE do cliente (destinatário).
            </p>
            {onEditEmitenteCadastro ? (
              <button
                type="button"
                className="mt-2 text-xs font-medium text-violet-700 underline decoration-violet-700/70 underline-offset-2 hover:text-violet-900 dark:text-violet-300"
                onClick={onEditEmitenteCadastro}
              >
                Alterar no cadastro da empresa
              </button>
            ) : null}
          </div>
        </div>
      </NfeLikeCollapsible>

      <NfeLikeCollapsible
        section="destinatario"
        title="Destinatário"
        open={open.destinatario}
        onToggle={() => toggle('destinatario')}
        fieldsDisabled={fieldsDisabled}
      >
        <div className="admin-toolbar grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400" htmlFor="mei-nfe-dest-doc">
              CPF/CNPJ do destinatário
              <span className="admin-required-mark">*</span>
            </label>
            <input
              id="mei-nfe-dest-doc"
              className="planner-input-compact w-full"
              type="text"
              inputMode="numeric"
              value={value.destinatarioDoc}
              aria-invalid={Boolean(err('mei-nfe-dest-doc'))}
              aria-describedby={err('mei-nfe-dest-doc') ? 'mei-nfe-dest-doc-err' : undefined}
              onChange={(e) => patch({ destinatarioDoc: formatCpfCnpjPtBr(e.target.value) })}
              placeholder="CPF ou CNPJ"
            />
            {err('mei-nfe-dest-doc') ? (
              <p id="mei-nfe-dest-doc-err" className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                {err('mei-nfe-dest-doc')}
              </p>
            ) : null}
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400" htmlFor="mei-nfe-dest-razao">
              Razão social / nome
              <span className="admin-required-mark">*</span>
            </label>
            <input
              id="mei-nfe-dest-razao"
              className="planner-input-compact w-full"
              type="text"
              value={value.destinatarioRazao}
              aria-invalid={Boolean(err('mei-nfe-dest-razao'))}
              aria-describedby={err('mei-nfe-dest-razao') ? 'mei-nfe-dest-razao-err' : undefined}
              onChange={(e) => patch({ destinatarioRazao: e.target.value })}
              placeholder="Nome ou razão social"
            />
            {err('mei-nfe-dest-razao') ? (
              <p id="mei-nfe-dest-razao-err" className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                {err('mei-nfe-dest-razao')}
              </p>
            ) : null}
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400" htmlFor="mei-nfe-dest-email">
              Email (opcional)
            </label>
            <input
              id="mei-nfe-dest-email"
              className="planner-input-compact w-full"
              type="email"
              value={value.destinatarioEmail}
              onChange={(e) => patch({ destinatarioEmail: e.target.value })}
              placeholder="email@exemplo.com"
            />
          </div>
          <div className="md:col-span-2">
            <p className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-300">
              Situação de IE do destinatário
              <span className="admin-required-mark">*</span>
            </p>
            <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
              {DESTINATARIO_IE_SECTION_HINT}
            </p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Situação de IE do destinatário">
              {DESTINATARIO_IE_OPTIONS.map((opt) => {
                const selected = value.destinatarioIndIEDest === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    className={
                      selected
                        ? 'planner-button-primary-compact'
                        : 'planner-button-secondary-compact'
                    }
                    disabled={fieldsDisabled}
                    aria-pressed={selected}
                    title={opt.hint}
                    onClick={() =>
                      patch({
                        destinatarioIndIEDest: opt.value,
                        ...(opt.value !== '1' ? { destinatarioInscricaoEstadual: '' } : {}),
                      })
                    }
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
          {value.destinatarioIndIEDest === '1' ? (
            <div className="md:col-span-2">
              <label
                className="mb-1 block text-xs text-slate-500 dark:text-slate-400"
                htmlFor="mei-nfe-dest-ie"
              >
                Inscrição Estadual do destinatário (cliente)
                <span className="admin-required-mark">*</span>
              </label>
              <input
                id="mei-nfe-dest-ie"
                className="planner-input-compact w-full"
                type="text"
                inputMode="numeric"
                value={value.destinatarioInscricaoEstadual}
                onChange={(e) =>
                  patch({ destinatarioInscricaoEstadual: e.target.value.replace(/\D/g, '') })
                }
                placeholder="Somente números — não use a IE do seu MEI"
              />
            </div>
          ) : null}
          {documentLabel === 'NF-e' ? (
            <div className="md:col-span-2 space-y-3 rounded-md border border-slate-200/80 p-3 dark:border-slate-600/80">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Endereço do destinatário
                <span className="admin-required-mark">*</span>
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-slate-500" htmlFor="mei-nfe-dest-cep">
                    CEP
                  </label>
                  <input
                    id="mei-nfe-dest-cep"
                    className="planner-input-compact w-full"
                    inputMode="numeric"
                    value={value.destinatarioEndereco.cep}
                    onChange={(e) =>
                      patch({
                        destinatarioEndereco: {
                          ...value.destinatarioEndereco,
                          cep: e.target.value.replace(/\D/g, '').slice(0, 8),
                        },
                      })
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500" htmlFor="mei-nfe-dest-log">
                    Logradouro
                  </label>
                  <input
                    id="mei-nfe-dest-log"
                    className="planner-input-compact w-full"
                    value={value.destinatarioEndereco.logradouro}
                    onChange={(e) =>
                      patch({
                        destinatarioEndereco: { ...value.destinatarioEndereco, logradouro: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500" htmlFor="mei-nfe-dest-num">
                    Número
                  </label>
                  <input
                    id="mei-nfe-dest-num"
                    className="planner-input-compact w-full"
                    value={value.destinatarioEndereco.numero}
                    onChange={(e) =>
                      patch({
                        destinatarioEndereco: { ...value.destinatarioEndereco, numero: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500" htmlFor="mei-nfe-dest-bairro">
                    Bairro
                  </label>
                  <input
                    id="mei-nfe-dest-bairro"
                    className="planner-input-compact w-full"
                    value={value.destinatarioEndereco.bairro}
                    onChange={(e) =>
                      patch({
                        destinatarioEndereco: { ...value.destinatarioEndereco, bairro: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500" htmlFor="mei-nfe-dest-ibge">
                    Código IBGE (7 dígitos)
                  </label>
                  <input
                    id="mei-nfe-dest-ibge"
                    className="planner-input-compact w-full"
                    inputMode="numeric"
                    value={value.destinatarioEndereco.codigoCidade}
                    onChange={(e) =>
                      patch({
                        destinatarioEndereco: {
                          ...value.destinatarioEndereco,
                          codigoCidade: e.target.value.replace(/\D/g, '').slice(0, 7),
                        },
                      })
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500" htmlFor="mei-nfe-dest-cidade">
                    Cidade
                  </label>
                  <input
                    id="mei-nfe-dest-cidade"
                    className="planner-input-compact w-full"
                    value={value.destinatarioEndereco.descricaoCidade}
                    onChange={(e) =>
                      patch({
                        destinatarioEndereco: {
                          ...value.destinatarioEndereco,
                          descricaoCidade: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500" htmlFor="mei-nfe-dest-uf">
                    UF
                  </label>
                  <input
                    id="mei-nfe-dest-uf"
                    className="planner-input-compact w-full"
                    maxLength={2}
                    value={value.destinatarioEndereco.estado}
                    onChange={(e) =>
                      patch({
                        destinatarioEndereco: {
                          ...value.destinatarioEndereco,
                          estado: e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 2),
                        },
                      })
                    }
                  />
                </div>
              </div>
              {err('mei-nfe-dest-endereco') ? (
                <p className="text-xs text-amber-700 dark:text-amber-300">{err('mei-nfe-dest-endereco')}</p>
              ) : null}
            </div>
          ) : null}
        </div>
      </NfeLikeCollapsible>

      <NfeLikeCollapsible
        section="itens"
        title="Itens"
        open={open.itens}
        onToggle={() => toggle('itens')}
        fieldsDisabled={fieldsDisabled}
      >
        {err('mei-nfe-itens') ? (
          <p id="mei-nfe-itens-err" className="text-xs text-amber-700 dark:text-amber-300" role="status">
            {err('mei-nfe-itens')}
          </p>
        ) : null}
        {value.itens.length === 0 ? (
          <div className="rounded-md border border-dashed border-slate-300/80 p-4 text-center dark:border-slate-600/80">
            <p className="text-sm text-slate-600 dark:text-slate-300">Adicione pelo menos um item à nota.</p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                className="planner-button-secondary-compact"
                disabled={fieldsDisabled}
                onClick={addItem}
              >
                Adicionar item
              </button>
              {nfLikeCatalogDocumentType ? (
                <button
                  ref={catalogAddBtnRef}
                  type="button"
                  className="planner-button-secondary-compact"
                  disabled={fieldsDisabled}
                  onClick={() => setCatalogPickerOpen(true)}
                >
                  Adicionar do catálogo
                </button>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {value.itens.map((item, index) => (
              <div
                key={index}
                className="rounded-lg border border-slate-200/70 bg-slate-50/50 p-3 dark:border-slate-700/70 dark:bg-slate-900/30"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Item {index + 1} — {documentLabel}
                  </span>
                  <button
                    type="button"
                    className="text-xs text-rose-600 underline disabled:cursor-not-allowed disabled:opacity-50 dark:text-rose-400"
                    disabled={fieldsDisabled}
                    onClick={() => removeItem(index)}
                  >
                    Remover linha
                  </button>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label
                      className="mb-1 block text-xs text-slate-500 dark:text-slate-400"
                      htmlFor={`mei-nfe-item-${index}-codigo`}
                    >
                      Código / SKU <span className="admin-required-mark">*</span>
                    </label>
                    <input
                      id={`mei-nfe-item-${index}-codigo`}
                      className="planner-input-compact w-full"
                      value={item.codigo}
                      aria-invalid={Boolean(err(`mei-nfe-item-${index}-codigo`))}
                      aria-describedby={
                        err(`mei-nfe-item-${index}-codigo`) ? `mei-nfe-item-${index}-codigo-err` : undefined
                      }
                      onChange={(e) => patchItem(index, { codigo: e.target.value })}
                    />
                    {err(`mei-nfe-item-${index}-codigo`) ? (
                      <p id={`mei-nfe-item-${index}-codigo-err`} className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                        {err(`mei-nfe-item-${index}-codigo`)}
                      </p>
                    ) : null}
                  </div>
                  <div>
                    <label
                      className="mb-1 block text-xs text-slate-500 dark:text-slate-400"
                      htmlFor={`mei-nfe-item-${index}-ncm`}
                    >
                      NCM (8 dígitos) <span className="admin-required-mark">*</span>
                    </label>
                    <input
                      id={`mei-nfe-item-${index}-ncm`}
                      className="planner-input-compact w-full"
                      inputMode="numeric"
                      placeholder="01012100"
                      value={item.ncm}
                      aria-invalid={Boolean(err(`mei-nfe-item-${index}-ncm`))}
                      aria-describedby={err(`mei-nfe-item-${index}-ncm`) ? `mei-nfe-item-${index}-ncm-err` : undefined}
                      onChange={(e) =>
                        patchItem(index, { ncm: e.target.value.replace(/\D/g, '').slice(0, 8) })
                      }
                    />
                    {err(`mei-nfe-item-${index}-ncm`) ? (
                      <p id={`mei-nfe-item-${index}-ncm-err`} className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                        {err(`mei-nfe-item-${index}-ncm`)}
                      </p>
                    ) : null}
                  </div>
                  <div className="md:col-span-2">
                    <label
                      className="mb-1 block text-xs text-slate-500 dark:text-slate-400"
                      htmlFor={`mei-nfe-item-${index}-desc`}
                    >
                      Descrição <span className="admin-required-mark">*</span>
                    </label>
                    <input
                      id={`mei-nfe-item-${index}-descricao`}
                      className="planner-input-compact w-full"
                      value={item.descricao}
                      aria-invalid={Boolean(err(`mei-nfe-item-${index}-descricao`))}
                      aria-describedby={
                        err(`mei-nfe-item-${index}-descricao`) ? `mei-nfe-item-${index}-descricao-err` : undefined
                      }
                      onChange={(e) => patchItem(index, { descricao: e.target.value })}
                    />
                    {err(`mei-nfe-item-${index}-descricao`) ? (
                      <p
                        id={`mei-nfe-item-${index}-descricao-err`}
                        className="mt-1 text-xs text-amber-700 dark:text-amber-300"
                      >
                        {err(`mei-nfe-item-${index}-descricao`)}
                      </p>
                    ) : null}
                  </div>
                  <div>
                    <label
                      className="mb-1 block text-xs text-slate-500 dark:text-slate-400"
                      htmlFor={`mei-nfe-item-${index}-cfop`}
                    >
                      CFOP (4 dígitos) <span className="admin-required-mark">*</span>
                    </label>
                    <input
                      id={`mei-nfe-item-${index}-cfop`}
                      className="planner-input-compact w-full"
                      inputMode="numeric"
                      value={item.cfop}
                      aria-invalid={Boolean(err(`mei-nfe-item-${index}-cfop`))}
                      aria-describedby={err(`mei-nfe-item-${index}-cfop`) ? `mei-nfe-item-${index}-cfop-err` : undefined}
                      onChange={(e) =>
                        patchItem(index, { cfop: e.target.value.replace(/\D/g, '').slice(0, 4) })
                      }
                    />
                    {err(`mei-nfe-item-${index}-cfop`) ? (
                      <p id={`mei-nfe-item-${index}-cfop-err`} className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                        {err(`mei-nfe-item-${index}-cfop`)}
                      </p>
                    ) : null}
                  </div>
                  <div>
                    <label
                      className="mb-1 block text-xs text-slate-500 dark:text-slate-400"
                      htmlFor={`mei-nfe-item-${index}-un`}
                    >
                      Unidade <span className="admin-required-mark">*</span>
                    </label>
                    <input
                      id={`mei-nfe-item-${index}-un`}
                      className="planner-input-compact w-full"
                      value={item.unidade}
                      aria-invalid={Boolean(err(`mei-nfe-item-${index}-unidade`))}
                      aria-describedby={
                        err(`mei-nfe-item-${index}-unidade`) ? `mei-nfe-item-${index}-un-err` : undefined
                      }
                      onChange={(e) => patchItem(index, { unidade: e.target.value })}
                      placeholder="UN"
                    />
                    {err(`mei-nfe-item-${index}-unidade`) ? (
                      <p id={`mei-nfe-item-${index}-un-err`} className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                        {err(`mei-nfe-item-${index}-unidade`)}
                      </p>
                    ) : null}
                  </div>
                  <div>
                    <label
                      className="mb-1 block text-xs text-slate-500 dark:text-slate-400"
                      htmlFor={`mei-nfe-item-${index}-qtd`}
                    >
                      Quantidade <span className="admin-required-mark">*</span>
                    </label>
                    <input
                      id={`mei-nfe-item-${index}-qtd`}
                      className="planner-input-compact w-full"
                      inputMode="decimal"
                      value={item.quantidade}
                      aria-invalid={Boolean(err(`mei-nfe-item-${index}-qtd`))}
                      aria-describedby={err(`mei-nfe-item-${index}-qtd`) ? `mei-nfe-item-${index}-qtd-err` : undefined}
                      onChange={(e) => patchItem(index, { quantidade: e.target.value })}
                    />
                    {err(`mei-nfe-item-${index}-qtd`) ? (
                      <p id={`mei-nfe-item-${index}-qtd-err`} className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                        {err(`mei-nfe-item-${index}-qtd`)}
                      </p>
                    ) : null}
                  </div>
                  <div>
                    <label
                      className="mb-1 block text-xs text-slate-500 dark:text-slate-400"
                      htmlFor={`mei-nfe-item-${index}-vu`}
                    >
                      Valor unitário <span className="admin-required-mark">*</span>
                    </label>
                    <input
                      id={`mei-nfe-item-${index}-vu`}
                      className="planner-input-compact w-full"
                      inputMode="decimal"
                      value={item.valorUnitario}
                      aria-invalid={Boolean(err(`mei-nfe-item-${index}-vu`))}
                      aria-describedby={err(`mei-nfe-item-${index}-vu`) ? `mei-nfe-item-${index}-vu-err` : undefined}
                      onChange={(e) => patchItem(index, { valorUnitario: e.target.value })}
                      placeholder="0,00"
                    />
                    {err(`mei-nfe-item-${index}-vu`) ? (
                      <p id={`mei-nfe-item-${index}-vu-err`} className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                        {err(`mei-nfe-item-${index}-vu`)}
                      </p>
                    ) : null}
                    <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                      <span className="font-semibold text-slate-700 dark:text-slate-200">
                        Valor total do item:{' '}
                        {formatItemLineTotalBrl(item.quantidade, item.valorUnitario) ?? '—'}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-slate-500 dark:text-slate-500">
                        Calculado automaticamente (quantidade × unitário).
                      </span>
                    </p>
                  </div>
                  <div className="md:col-span-2 rounded-md border border-slate-200/60 p-2 dark:border-slate-700/60">
                    <p className="mb-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                      Tributos do item (vêm do cadastro do produto; editáveis aqui)
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <label className="mb-1 block text-[11px] text-slate-500" htmlFor={`mei-nfe-item-${index}-icms-cst`}>
                          ICMS CST
                        </label>
                        <input
                          id={`mei-nfe-item-${index}-icms-cst`}
                          className="planner-input-compact w-full"
                          value={item.icmsCst}
                          onChange={(e) => patchItem(index, { icmsCst: e.target.value })}
                          placeholder="ex.: 00"
                        />
                      </div>
                      <div>
                        <label
                          className="mb-1 block text-[11px] text-slate-500"
                          htmlFor={`mei-nfe-item-${index}-icms-csosn`}
                        >
                          ICMS CSOSN
                        </label>
                        <input
                          id={`mei-nfe-item-${index}-icms-csosn`}
                          className="planner-input-compact w-full"
                          value={item.icmsCsosn}
                          aria-invalid={Boolean(err(`mei-nfe-item-${index}-icms`))}
                          aria-describedby={
                            err(`mei-nfe-item-${index}-icms`) ? `mei-nfe-item-${index}-icms-err` : undefined
                          }
                          onChange={(e) => patchItem(index, { icmsCsosn: e.target.value })}
                          placeholder="102"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] text-slate-500" htmlFor={`mei-nfe-item-${index}-pis`}>
                          PIS CST <span className="admin-required-mark">*</span>
                        </label>
                        <input
                          id={`mei-nfe-item-${index}-pis`}
                          className="planner-input-compact w-full"
                          value={item.pisCst}
                          aria-invalid={Boolean(err(`mei-nfe-item-${index}-pis`))}
                          aria-describedby={err(`mei-nfe-item-${index}-pis`) ? `mei-nfe-item-${index}-pis-err` : undefined}
                          onChange={(e) => patchItem(index, { pisCst: e.target.value })}
                          placeholder="49"
                        />
                        {err(`mei-nfe-item-${index}-pis`) ? (
                          <p id={`mei-nfe-item-${index}-pis-err`} className="mt-1 text-[11px] text-amber-700 dark:text-amber-300">
                            {err(`mei-nfe-item-${index}-pis`)}
                          </p>
                        ) : null}
                      </div>
                      <div>
                        <label
                          className="mb-1 block text-[11px] text-slate-500"
                          htmlFor={`mei-nfe-item-${index}-cofins`}
                        >
                          COFINS CST <span className="admin-required-mark">*</span>
                        </label>
                        <input
                          id={`mei-nfe-item-${index}-cofins`}
                          className="planner-input-compact w-full"
                          value={item.cofinsCst}
                          aria-invalid={Boolean(err(`mei-nfe-item-${index}-cofins`))}
                          aria-describedby={
                            err(`mei-nfe-item-${index}-cofins`) ? `mei-nfe-item-${index}-cofins-err` : undefined
                          }
                          onChange={(e) => patchItem(index, { cofinsCst: e.target.value })}
                          placeholder="49"
                        />
                        {err(`mei-nfe-item-${index}-cofins`) ? (
                          <p
                            id={`mei-nfe-item-${index}-cofins-err`}
                            className="mt-1 text-[11px] text-amber-700 dark:text-amber-300"
                          >
                            {err(`mei-nfe-item-${index}-cofins`)}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    {err(`mei-nfe-item-${index}-icms`) ? (
                      <p id={`mei-nfe-item-${index}-icms-err`} className="mt-2 text-xs text-amber-700 dark:text-amber-300">
                        {err(`mei-nfe-item-${index}-icms`)}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="planner-button-secondary-compact"
                disabled={fieldsDisabled}
                onClick={addItem}
              >
                Adicionar item
              </button>
              {nfLikeCatalogDocumentType ? (
                <button
                  ref={catalogAddBtnRef}
                  type="button"
                  className="planner-button-secondary-compact"
                  disabled={fieldsDisabled}
                  onClick={() => setCatalogPickerOpen(true)}
                >
                  Adicionar do catálogo
                </button>
              ) : null}
            </div>
          </div>
        )}
      </NfeLikeCollapsible>

      {nfLikeCatalogDocumentType ? (
        <MeiNfeLikeCatalogProdutoPickerModal
          open={catalogPickerOpen}
          onClose={closeCatalogPicker}
          documentType={nfLikeCatalogDocumentType}
          documentLabel={documentLabel}
          onSelectProduct={(p) => appendItemFromCatalog(mapCatalogProdutoToNfeItemRow(p))}
        />
      ) : null}

      <div>
        <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400" htmlFor="mei-nfe-info-comp">
          Informações complementares (opcional)
        </label>
        <textarea
          id="mei-nfe-info-comp"
          className="planner-input-compact min-h-[72px] w-full disabled:cursor-not-allowed disabled:opacity-60"
          value={value.informacoesComplementares}
          disabled={fieldsDisabled}
          onChange={(e) => patch({ informacoesComplementares: e.target.value })}
        />
      </div>
    </div>
  );
}
