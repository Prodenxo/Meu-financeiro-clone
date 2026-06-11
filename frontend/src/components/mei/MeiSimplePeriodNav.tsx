type Props = {
  label: string
  onPrevious: () => void
  onNext: () => void
  className?: string
}

export function MeiSimplePeriodNav ({
  label,
  onPrevious,
  onNext,
  className = ''
}: Props) {
  return (
    <div className={`mei-period-nav ${className}`.trim()}>
      <button
        type="button"
        className="mei-period-nav-btn"
        onClick={onPrevious}
        aria-label="Mês anterior"
      >
        ‹
      </button>
      <span className="mei-period-nav-label">{label}</span>
      <button
        type="button"
        className="mei-period-nav-btn"
        onClick={onNext}
        aria-label="Próximo mês"
      >
        ›
      </button>
    </div>
  )
}
