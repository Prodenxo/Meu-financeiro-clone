const MONTH_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

export function formatMeiPeriodLabel (month: string, year: number): string {
  const idx = Math.max(0, Math.min(11, parseInt(month, 10) - 1))
  return `${MONTH_PT[idx]} de ${year}`
}

export function shiftMeiPeriod (
  month: string,
  year: number,
  delta: number
): { month: string; year: number } {
  let m = parseInt(month, 10) - 1
  let y = year
  m += delta
  while (m < 0) {
    m += 12
    y -= 1
  }
  while (m > 11) {
    m -= 12
    y += 1
  }
  return { month: String(m + 1).padStart(2, '0'), year: y }
}
