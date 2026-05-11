/**
 * Formata a parte "calendário" de um instante ISO como no `<input type="date">` + `toISOString().slice(0, 10)`:
 * o valor costuma ser meia-noite **UTC** desse dia. `toLocaleDateString('pt-BR')` sem `timeZone` usa o fuso
 * local e pode mostrar o **dia anterior** (ex.: Brasil UTC−3).
 */
export function formatIsoDateUtcCalendarPtBr(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
}
