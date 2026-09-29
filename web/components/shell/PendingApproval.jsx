import { signOutAction } from '@/lib/auth/actions';
import { Button, EmptyState } from '@/components/ui';
import s from './pending.module.css';

export function PendingApproval({ reason }) {
  const expired = reason === 'Seu acesso expirou';
  return (
    <main className={s.page}>
      <div className={s.card}>
        <EmptyState
          icon={expired ? 'alert-circle' : 'clock'}
          title={expired ? 'Seu acesso expirou' : 'Cadastro em análise'}
          text={
            expired
              ? 'Fale com o administrador da sua empresa para renovar o acesso.'
              : 'Seu acesso ainda não foi liberado pelo administrador. Você receberá um aviso assim que for aprovado.'
          }
          action={
            <form action={signOutAction}>
              <Button type="submit" variant="outline" icon="log-out">
                Sair
              </Button>
            </form>
          }
        />
      </div>
    </main>
  );
}
