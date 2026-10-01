import Link from 'next/link';
import { Card, EmptyState } from '@/components/ui';
import t from '@/components/transactions/transactions.module.css';
import s from './acessos.module.css';

/** Acesso negado das telas administrativas de Configurações (o papel já foi conferido no servidor). */
export function AccessDeniedCard({
  screen = 'Gerenciar acessos',
  text = 'Só administradores e o super admin podem gerenciar usuários, convites e empresas.',
}) {
  return (
    <div className={s.page}>
      <header className={t.header}>
        <div>
          <p className={t.crumb}>Meu espaço / Configurações / {screen}</p>
          <h1 className={t.title}>{screen}</h1>
        </div>
      </header>
      <Card>
        <EmptyState
          icon="shield-check"
          title="Acesso restrito"
          text={text}
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
