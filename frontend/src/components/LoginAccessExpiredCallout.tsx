import { CalendarClock, UserRound } from 'lucide-react'

/**
 * Aviso quando o vínculo empresa ↔ usuário expirou (data em `expires_at`).
 * Mostrado na página de login em vez de uma linha de erro genérica.
 */
export function LoginAccessExpiredCallout() {
  return (
    <div
      role="alert"
      aria-live="polite"
      className="rounded-2xl border border-amber-200/90 bg-amber-50/80 px-4 py-4 text-left shadow-[0_8px_30px_rgb(0,0,0,0.06)] backdrop-blur-sm dark:border-amber-500/25 dark:bg-amber-950/35 dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]"
    >
      <div className="flex gap-3">
        <span
          className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
          aria-hidden
        >
          <CalendarClock className="h-5 w-5" strokeWidth={2} />
        </span>
        <div className="min-w-0 space-y-2">
          <h2 className="text-sm font-semibold text-amber-950 dark:text-amber-50">
            Prazo de acesso encerrado
          </h2>
          <p className="text-sm leading-relaxed text-amber-900/90 dark:text-amber-100/85">
            O tempo de acesso da sua conta nesta empresa chegou ao fim. Quem define isso é o administrador — quando ele
            renovar ou prorrogar o prazo, você volta a conseguir entrar.
          </p>
          <p className="flex items-start gap-2 text-sm leading-relaxed text-amber-900/85 dark:text-amber-100/80">
            <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-400" aria-hidden />
            <span>
              <strong className="font-semibold text-amber-950 dark:text-amber-50">O que fazer:</strong> entre em contato com o{' '}
              <strong>administrador da sua empresa</strong> (ou com a contabilidade que cuida do Meu Financeiro) e peça
              que atualize a data de expiração do seu acesso.
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}
