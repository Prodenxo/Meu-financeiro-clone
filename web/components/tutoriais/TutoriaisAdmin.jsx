'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { deleteTutorialAction, setTutorialPublishedAction } from '@/app/(app)/tutoriais/actions';
import { Alert, Card, EmptyState, Pill } from '@/components/ui';
import t from '@/components/transactions/transactions.module.css';
import { DeleteTutorialDialog } from './DeleteTutorialDialog';
import s from './tutoriais.module.css';

export function TutoriaisAdmin({ tutorials, notice, unavailable = false }) {
  const [items, setItems] = useState(tutorials);
  const [toast, setToast] = useState(notice || '');
  const [error, setError] = useState('');
  const [pendingId, setPendingId] = useState('');
  const [toDelete, setToDelete] = useState(null);
  const [isPending, startTransition] = useTransition();

  const publish = (tutorial, published) => {
    setError('');
    setPendingId(tutorial.id);
    startTransition(async () => {
      const result = await setTutorialPublishedAction(tutorial.id, published);
      setPendingId('');
      if (!result.ok) {
        setError(result.error || 'Não foi possível atualizar.');
        return;
      }
      setItems((current) => current.map((item) => {
        if (item.id === tutorial.id) {
          return { ...item, publicado: published, destaque: published ? item.destaque : false };
        }
        if (published && tutorial.destaque) return { ...item, destaque: false };
        return item;
      }));
      setToast(published ? 'Tutorial publicado.' : 'Tutorial despublicado. Ele não aparece mais para os outros usuários.');
    });
  };

  const confirmDelete = () => {
    if (!toDelete) return;
    setError('');
    startTransition(async () => {
      const result = await deleteTutorialAction(toDelete.id);
      if (!result.ok) {
        setError(result.error || 'Não foi possível excluir.');
        return;
      }
      setItems((current) => current.filter((item) => item.id !== toDelete.id));
      setToDelete(null);
      setToast('Tutorial excluído.');
    });
  };

  return (
    <div className={s.page}>
      <header className={t.header}>
        <div>
          <p className={t.crumb}>Meu espaço / Tutoriais</p>
          <h1 className={t.title}>Gerenciar tutoriais</h1>
          <p className={t.subtitle}>Rascunhos ficam só com o super admin.</p>
        </div>
        <div className={s.headerActions}>
          <Link className={s.linkBtn} href="/tutoriais/gerenciar/novo">+ Novo tutorial</Link>
          <Link className={s.linkBtnGhost} href="/tutoriais">Ver central</Link>
        </div>
      </header>

      {toast ? <Alert tone="success">{toast}</Alert> : null}
      {error ? <Alert tone="error">{error}</Alert> : null}
      {unavailable ? <Alert tone="info">A central de tutoriais ainda não está disponível neste ambiente.</Alert> : null}

      {unavailable ? null : items.length === 0 ? (
        <Card>
          <EmptyState icon="book-open" title="Nenhum tutorial cadastrado" text="Crie o primeiro quando quiser publicar um guia." />
        </Card>
      ) : (
        <div className={s.adminList}>
          {items.map((tutorial) => (
            <article key={tutorial.id} className={s.adminRow}>
              <div>
                <h2 className={s.adminTitle}>{tutorial.titulo}</h2>
                {tutorial.destaque ? <Pill tone="primary">Destaque</Pill> : null}
              </div>
              <span>{tutorial.moduloLabel}</span>
              <span>{tutorial.tipoLabel}</span>
              <span>{tutorial.publicado ? 'Publicado' : 'Rascunho'}</span>
              <div className={s.adminActions}>
                <Link className={s.textBtn} href={`/tutoriais/gerenciar/${tutorial.id}`}>Editar</Link>
                {tutorial.publicado ? (
                  <button type="button" className={s.textBtn} disabled={isPending && pendingId === tutorial.id} onClick={() => publish(tutorial, false)}>
                    Despublicar
                  </button>
                ) : (
                  <button type="button" className={s.textBtn} disabled={isPending && pendingId === tutorial.id} onClick={() => publish(tutorial, true)}>
                    Publicar
                  </button>
                )}
                <button type="button" className={s.textBtn} onClick={() => { setError(''); setToDelete(tutorial); }}>
                  Excluir
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {toDelete ? (
        <DeleteTutorialDialog
          tutorial={toDelete}
          pending={isPending}
          error={error}
          onConfirm={confirmDelete}
          onClose={() => setToDelete(null)}
        />
      ) : null}
    </div>
  );
}
