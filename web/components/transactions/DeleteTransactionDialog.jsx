'use client';

import { useEffect, useRef } from 'react';
import { Alert, Button } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import m from '@/components/dashboard/modal.module.css';
import s from './transactions.module.css';

const SCOPES = [
  { id: 'this', icon: 'file-text', title: 'Apenas este lançamento', hint: 'Outros meses (passados e futuros) continuam.' },
  { id: 'future', icon: 'arrow-right', title: 'Este e os futuros', hint: 'Remove esta data em diante e desativa a recorrência.' },
  { id: 'all', icon: 'trash', title: 'Toda a recorrência', hint: 'Apaga todos os lançamentos vinculados e a recorrência.' },
];

/**
 * Confirmação de exclusão — mesmas opções do Expo. Lançamento recorrente pergunta o
 * escopo; os demais (ou vários selecionados) pedem só confirmação.
 */
export function DeleteTransactionDialog({ target, pending, error, onConfirm, onClose }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const el = dialogRef.current;
    if (el && !el.open) el.showModal();
  }, []);

  const close = () => {
    if (!pending) onClose();
  };

  const single = target.rows.length === 1 ? target.rows[0] : null;
  const recurring = Boolean(single?.isRecurring);
  const title = recurring ? 'Excluir lançamento recorrente' : single ? 'Excluir transação' : `Excluir ${target.rows.length} transações`;

  return (
    <dialog
      ref={dialogRef}
      className={m.dialog}
      aria-labelledby="del-title"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current) close();
      }}
    >
      <div className={m.body}>
        <header className={m.head}>
          <h2 className={m.title} id="del-title">
            {title}
          </h2>
          <button type="button" className={m.close} onClick={close} aria-label="Fechar" disabled={pending}>
            <Icon name="x" size={18} />
          </button>
        </header>

        {recurring ? (
          <>
            <p className={s.dialogText}>Esta transação faz parte de uma recorrência. O que deseja excluir?</p>
            <div className={s.scopeList}>
              {SCOPES.map((scope) => (
                <button key={scope.id} type="button" className={s.scopeOption} onClick={() => onConfirm(scope.id)} disabled={pending}>
                  <Icon name={scope.icon} size={18} />
                  <span>
                    <span className={s.scopeTitle}>{scope.title}</span>
                    <span className={s.scopeHint}>{scope.hint}</span>
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <p className={s.dialogText}>
            {single ? `Excluir “${single.title}”?` : 'As transações selecionadas serão excluídas.'} Esta ação não pode ser desfeita.
          </p>
        )}

        {error ? (
          <div style={{ marginTop: 16 }}>
            <Alert tone="error">{error}</Alert>
          </div>
        ) : null}

        <footer className={m.foot} style={{ marginTop: 20 }}>
          <Button variant="outline" onClick={close} disabled={pending}>
            Cancelar
          </Button>
          {recurring ? null : (
            <Button onClick={() => onConfirm('this')} disabled={pending} aria-busy={pending} className={s.dangerBtn}>
              {pending ? 'Excluindo…' : 'Excluir'}
            </Button>
          )}
        </footer>
      </div>
    </dialog>
  );
}
