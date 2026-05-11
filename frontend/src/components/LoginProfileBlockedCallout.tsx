import { ShieldOff, UserRound } from 'lucide-react'

/**
 * Aviso quando o vínculo empresa ↔ usuário está com `status: false` (bloqueado).
 */
export function LoginProfileBlockedCallout() {
  return (
    <div
      role="alert"
      aria-live="polite"
      className="rounded-2xl border border-slate-200/90 bg-white/70 px-4 py-4 text-left shadow-[0_8px_30px_rgb(0,0,0,0.06)] backdrop-blur-sm dark:border-slate-600/80 dark:bg-slate-900/55 dark:shadow-[0_8px_30px_rgb(0,0,0,0.25)]"
    >
      <div className="flex gap-3">
        <span
          className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300"
          aria-hidden
        >
          <ShieldOff className="h-5 w-5" strokeWidth={2} />
        </span>
        <div className="min-w-0 space-y-2">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            Conta bloqueada nesta empresa
          </h2>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Seu acesso ao Meu Financeiro foi <strong className="font-semibold text-slate-800 dark:text-slate-100">bloqueado</strong> pelo administrador
            desta empresa. Enquanto o bloqueio estiver ativo, não é possível entrar na plataforma.
          </p>
          <p className="flex items-start gap-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-violet-600 dark:text-violet-400" aria-hidden />
            <span>
              <strong className="font-semibold text-slate-800 dark:text-slate-100">O que fazer:</strong> entre em contato com o{' '}
              <strong>administrador da sua empresa</strong> ou com o suporte do Meu Financeiro e peça a{' '}
              <strong>reativação</strong> do seu acesso.
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}
