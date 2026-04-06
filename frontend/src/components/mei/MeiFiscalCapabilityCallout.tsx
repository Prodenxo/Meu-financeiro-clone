export type MeiFiscalCapabilityCalloutProps = {
  documentLabel: 'NF-e' | 'NFC-e';
  mode: 'loading' | 'fetch_error' | 'blocked';
  errorMessage?: string;
  onRevisarConfiguracao?: () => void;
};

/**
 * FR-GUIA-FISC-07 / UX §9.2 — bloqueio quando NF-e/NFC-e não está activo no emissor integrado.
 */
export function MeiFiscalCapabilityCallout({
  documentLabel,
  mode,
  errorMessage,
  onRevisarConfiguracao
}: MeiFiscalCapabilityCalloutProps) {
  if (mode === 'loading') {
    return (
      <div
        className="rounded-lg border border-slate-200/90 bg-slate-50/90 px-4 py-3 text-sm text-slate-700 dark:border-slate-600/90 dark:bg-slate-900/50 dark:text-slate-200"
        role="status"
        aria-live="polite"
        data-mei-fiscal-capability="loading"
      >
        <p className="flex items-center gap-2">
          <span
            className="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600 dark:border-slate-600 dark:border-t-slate-300"
            aria-hidden
          />
          A verificar configuração da empresa no emissor fiscal integrado…
        </p>
      </div>
    );
  }

  if (mode === 'fetch_error') {
    return (
      <div
        className="rounded-lg border border-amber-200/90 bg-amber-50/95 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100"
        role="alert"
        data-mei-fiscal-capability="error"
      >
        <p className="font-semibold">Não foi possível confirmar a emissão de {documentLabel}</p>
        <p className="mt-2 text-xs leading-relaxed opacity-95">
          {errorMessage?.trim() ||
            'Tente novamente mais tarde ou confirme os dados na aba Certificado e DAS. Se o problema continuar, contacte o suporte.'}
        </p>
        {onRevisarConfiguracao ? (
          <button
            type="button"
            className="mt-3 text-xs font-medium text-amber-900 underline hover:no-underline dark:text-amber-200"
            onClick={onRevisarConfiguracao}
          >
            Rever configuração
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className="rounded-lg border border-amber-200/90 bg-amber-50/95 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100"
      role="alert"
      data-mei-fiscal-capability="blocked"
    >
      <p className="font-semibold">Emissão de {documentLabel} não disponível</p>
      <p className="mt-2 text-xs leading-relaxed opacity-95">
        A sua empresa ainda não está configurada para emitir este tipo de nota no emissor fiscal integrado.
      </p>
      <ul className="mt-3 list-inside list-disc space-y-1 text-xs leading-relaxed">
        <li>Certificado A1 válido associado à empresa</li>
        <li>Dados da empresa actualizados na aba Certificado e DAS</li>
        <li>Para NFC-e: CSC e token junto à SEFAZ (quando aplicável)</li>
      </ul>
      {onRevisarConfiguracao ? (
        <button
          type="button"
          className="mt-3 text-xs font-medium text-amber-900 underline hover:no-underline dark:text-amber-200"
          onClick={onRevisarConfiguracao}
        >
          Rever configuração
        </button>
      ) : null}
    </div>
  );
}
