import type { NfEmissionCompanyForm } from '../../utils/nfEmissionCompany'

export type MeiRpsNumeracaoPanelProps = {
  id?: string
  rpsLote: number
  rpsNumero: number
  rpsSerie: string
  onChange: (patch: Partial<Pick<NfEmissionCompanyForm, 'rpsLote' | 'rpsNumero' | 'rpsSerie'>>) => void
  /** Destaque na aba NFS-e (card com ação de salvar). */
  variant?: 'default' | 'nfse-workspace'
  showSaveAction?: boolean
  onSave?: () => void
  saveLoading?: boolean
  saveLabel?: string
}

export function MeiRpsNumeracaoPanel({
  id = 'mei-rps-config',
  rpsLote,
  rpsNumero,
  rpsSerie,
  onChange,
  variant = 'default',
  showSaveAction = false,
  onSave,
  saveLoading = false,
  saveLabel = 'Salvar numeração no emissor'
}: MeiRpsNumeracaoPanelProps) {
  const isNfseWorkspace = variant === 'nfse-workspace'

  return (
    <div
      id={id}
      className={
        isNfseWorkspace
          ? 'rounded-lg border border-violet-200/80 bg-violet-50/70 p-4 dark:border-violet-900/50 dark:bg-violet-950/30'
          : 'mt-3 rounded-lg border ui-border-section bg-slate-50/80 p-3 dark:bg-slate-900/40'
      }
      role="group"
      aria-labelledby={`${id}-title`}
    >
      <div className={showSaveAction ? 'flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between' : undefined}>
        <div className="min-w-0 flex-1">
          <p
            id={`${id}-title`}
            className={
              isNfseWorkspace
                ? 'text-sm font-semibold text-violet-950 dark:text-violet-100'
                : 'text-sm font-semibold text-slate-900 dark:text-slate-100'
            }
          >
            Numeração RPS (emissor)
          </p>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            {isNfseWorkspace
              ? 'Sem lote, número e série cadastrados no emissor, a NFS-e pode falhar com «Nenhuma série cadastrada». Use os valores padrão (1 / 1 / «1») ou o que seu contador indicar, depois salve.'
              : 'Lote, número e série iniciais enviados ao emissor no cadastro ou atualização. Ajuste só se o seu contador ou o município indicar valores diferentes dos padrão (1 / 1 / «1»).'}
          </p>
        </div>
        {showSaveAction && onSave ? (
          <button
            type="button"
            className="planner-button shrink-0 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onSave}
            disabled={saveLoading}
          >
            {saveLoading ? 'Salvando...' : saveLabel}
          </button>
        ) : null}
      </div>
      <div className="mt-3 grid gap-2 md:grid-cols-3">
        <div>
          <label htmlFor={`${id}-lote`} className="mb-1 block text-xs text-slate-600 dark:text-slate-400">
            Lote inicial
          </label>
          <input
            id={`${id}-lote`}
            className="planner-input-compact w-full"
            type="number"
            min={1}
            step={1}
            value={rpsLote}
            onChange={(event) => {
              const v = Number.parseInt(event.target.value, 10)
              onChange({
                rpsLote: Number.isFinite(v) && v >= 1 ? v : 1
              })
            }}
          />
        </div>
        <div>
          <label htmlFor={`${id}-numero`} className="mb-1 block text-xs text-slate-600 dark:text-slate-400">
            Número inicial RPS
          </label>
          <input
            id={`${id}-numero`}
            className="planner-input-compact w-full"
            type="number"
            min={1}
            step={1}
            value={rpsNumero}
            onChange={(event) => {
              const v = Number.parseInt(event.target.value, 10)
              onChange({
                rpsNumero: Number.isFinite(v) && v >= 1 ? v : 1
              })
            }}
          />
        </div>
        <div>
          <label htmlFor={`${id}-serie`} className="mb-1 block text-xs text-slate-600 dark:text-slate-400">
            Série
          </label>
          <input
            id={`${id}-serie`}
            className="planner-input-compact w-full"
            type="text"
            inputMode="text"
            value={rpsSerie}
            onChange={(event) => onChange({ rpsSerie: event.target.value })}
            placeholder="ex.: 1"
          />
        </div>
      </div>
    </div>
  )
}
