import Link from 'next/link';
import { Card, EmptyState } from '@/components/ui';
import s from './tutoriais.module.css';

export function AccessDenied() {
  return (
    <div className={s.page}>
      <Card>
        <EmptyState
          icon="shield-check"
          title="Acesso negado"
          text="Só o super admin pode cadastrar, editar, publicar ou excluir tutoriais."
          action={(
            <Link className={s.linkBtnGhost} href="/tutoriais">
              Voltar para a central
            </Link>
          )}
        />
      </Card>
    </div>
  );
}
