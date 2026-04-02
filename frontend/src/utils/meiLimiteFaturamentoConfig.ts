/**
 * Configuração do limite de referência MEI (valor por ano civil).
 * NFR-LIM-05: alterações ao teto concentradas neste ficheiro.
 * Valores são referência administrativa para a UI; conferir legislação vigente com o PO.
 */

/** Tetos de referência em R$ por ano civil (exemplo; ajustar quando o PO fechar). */
export const MEI_LIMITE_REFERENCIA_REAIS_BY_YEAR: Readonly<Record<number, number>> =
  Object.freeze({
    2024: 81_000,
    2025: 81_000,
    2026: 81_000
  });

/** Rótulo curto de vigência para UI (FR-LIM-03); pode ser substituído por string vinda de env no futuro. */
export const MEI_LIMITE_VIGENCIA_LABEL_BY_YEAR: Readonly<Record<number, string>> =
  Object.freeze({
    2024: 'Referência 2024',
    2025: 'Referência 2025',
    2026: 'Referência 2026'
  });

export interface MeiLimiteThresholds {
  /** Inclusive — abaixo disto: banda seguro (se também abaixo de criticoMinPercent). */
  atencaoMinPercent: number;
  /** Inclusive — a partir deste valor: banda critico. */
  criticoMinPercent: number;
}

/** Limiares por defeito (PRD / UX — valores finais fecháveis com PO). */
export const DEFAULT_MEI_LIMITE_THRESHOLDS: MeiLimiteThresholds = Object.freeze({
  atencaoMinPercent: 80,
  criticoMinPercent: 95
});

export function getLimiteReferenciaReaisParaAno(anoCivil: number): number | null {
  const v = MEI_LIMITE_REFERENCIA_REAIS_BY_YEAR[anoCivil];
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null;
}

export function getVigenciaLabelParaAno(anoCivil: number): string | null {
  const label = MEI_LIMITE_VIGENCIA_LABEL_BY_YEAR[anoCivil];
  return typeof label === 'string' && label.trim() ? label.trim() : null;
}
