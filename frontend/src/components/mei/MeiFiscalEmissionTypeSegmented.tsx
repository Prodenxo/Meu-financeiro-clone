export type MeiFiscalEmissionDocumentType = 'NFSE' | 'NFE' | 'NFCE';

const OPTIONS: { value: MeiFiscalEmissionDocumentType; label: string }[] = [
  { value: 'NFSE', label: 'NFS-e' },
  { value: 'NFE', label: 'NF-e' },
  { value: 'NFCE', label: 'NFC-e' }
];

export type MeiFiscalEmissionTypeSegmentedProps = {
  value: MeiFiscalEmissionDocumentType;
  onChange: (next: MeiFiscalEmissionDocumentType) => void;
  disabled?: boolean;
  idPrefix?: string;
  /** FR-GUIA-FISC-16 — `false`: apenas NFS-e (sem buracos no layout). Defeito: triplo. */
  nfeNfceEmitEnabled?: boolean;
};

/**
 * Seletor de tipo de nota a emitir (radiogroup estilizado — UX §4, sem `role="tablist"`).
 */
export function MeiFiscalEmissionTypeSegmented({
  value,
  onChange,
  disabled = false,
  idPrefix = 'mei-fiscal-emission-type',
  nfeNfceEmitEnabled = true
}: MeiFiscalEmissionTypeSegmentedProps) {
  const groupName = `${idPrefix}-group`;
  const visibleOptions = nfeNfceEmitEnabled ? OPTIONS : OPTIONS.filter((o) => o.value === 'NFSE');
  const displayValue = visibleOptions.some((o) => o.value === value) ? value : 'NFSE';

  return (
    <fieldset className="min-w-0 border-0 p-0">
      <legend className="sr-only">Tipo de nota fiscal a emitir</legend>
      <div className="flex w-full rounded-lg border border-slate-200/90 bg-slate-100/90 p-1 dark:border-slate-700/90 dark:bg-slate-900/60">
        {visibleOptions.map((opt) => {
          const checked = displayValue === opt.value;
          const inputId = `${idPrefix}-${opt.value}`;
          return (
            <label
              key={opt.value}
              htmlFor={inputId}
              className={
                checked
                  ? 'flex-1 cursor-pointer rounded-md bg-white px-2 py-2 text-center text-xs font-semibold text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-100 sm:text-sm'
                  : 'flex-1 cursor-pointer rounded-md px-2 py-2 text-center text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 sm:text-sm'
              }
            >
              <input
                id={inputId}
                type="radio"
                name={groupName}
                value={opt.value}
                className="sr-only"
                checked={checked}
                disabled={disabled}
                onChange={() => onChange(opt.value)}
              />
              {opt.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function meiFiscalEmissionHelpLine(type: MeiFiscalEmissionDocumentType): string {
  if (type === 'NFCE') {
    return 'Para venda de mercadorias ao consumidor final (cupom fiscal eletrónico).';
  }
  if (type === 'NFE') {
    return 'Para operações de mercadorias que exigem nota modelo 55 (ex.: B2B), conforme orientação do seu contador.';
  }
  return 'Para prestação de serviços sujeita a NFS-e municipal.';
}
