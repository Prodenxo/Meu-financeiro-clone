import Link from 'next/link';
import { Card, EmptyState } from '@/components/ui';
import t from '@/components/transactions/transactions.module.css';
import s from './acessos.module.css';

/** Usuário comum / convidado: a tela existe, mas só admin e super admin gerenciam acessos. */
export function AccessDeniedCard() {
  return (
    <div className={s.page}>
      <header className={t.header}>
        <div>
          <p className={t.crumb}>Meu espaço / Configurações / Gerenciar acessos</p>
          <h1 className={t.title}>Gerenciar acessos</h1>
        </div>
      </header>
      <Card>
        <EmptyState
          icon="shield-check"
          title="Acesso restrito"
          text="Só administradores e o super admin podem gerenciar usuários, convites e empresas."
          action={(
            <div className={s.deniedActions}>
              <Link href="/configuracoes" className={s.copyBtn}>
                Voltar para Configurações
              </Link>
            </div>
          )}
        />
      </Card>
    </div>
  );
}
