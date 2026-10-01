import { stopImpersonatingAction } from '@/app/(app)/configuracoes/acessos/actions';
import { Icon } from '@/components/ui/Icon';
import s from './shell.module.css';

/**
 * Aviso fixo enquanto um admin está "acessando como" outro usuário — porta do banner do app atual.
 * O botão restaura a sessão do administrador guardada no servidor.
 */
export function ImpersonationBanner({ info }) {
  return (
    <div className={s.impersonation} role="status">
      <Icon name="log-in" size={16} />
      <span className={s.impersonationText}>
        Você está vendo o app como <strong>{info.targetName || 'outro usuário'}</strong>
        {info.adminName ? <> (conta de admin: {info.adminName})</> : null}.
      </span>
      <form action={stopImpersonatingAction}>
        <button type="submit" className={s.impersonationBtn}>
          Voltar à minha conta
        </button>
      </form>
    </div>
  );
}
