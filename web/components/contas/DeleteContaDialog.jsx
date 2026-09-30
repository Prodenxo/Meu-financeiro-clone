'use client';

import { useEffect, useRef } from 'react';
import { Alert, Button } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import m from '@/components/dashboard/modal.module.css';
import t from '@/components/transactions/transactions.module.css';

/** Confirmação de exclusão de conta — mesmo texto do app atual. */
export function DeleteContaDialog({ conta, pending, error, onConfirm, onClose }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const el = dialogRef.current;
    if (el && !el.open) el.showModal();
  }, []);

  const close = () => {
    if (!pending) onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      className={m.dialog}
      aria-labelledby="del-conta-title"
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
          <h2 className={m.title} id="del-conta-title">
            Excluir conta
          </h2>
          <button type="button" className={m.close} onClick={close} aria-label="Fechar" disabled={pending}>
            <Icon name="x" size={18} />
          </button>
        </header>

        <p className={t.dialogText}>
          Remover “{conta.nome}”? Lançamentos vinculados ficarão sem conta. Esta ação não pode ser desfeita.
        </p>

        {error ? (
          <div style={{ marginTop: 16 }}>
            <Alert tone="error">{error}</Alert>
          </div>
        ) : null}

        <footer className={m.foot} style={{ marginTop: 20 }}>
          <Button variant="outline" onClick={close} disabled={pending}>
            Cancelar
          </Button>
          <Button onClick={onConfirm} disabled={pending} aria-busy={pending} className={t.dangerBtn}>
            {pending ? 'Excluindo…' : 'Excluir'}
          </Button>
        </footer>
      </div>
    </dialog>
  );
}
