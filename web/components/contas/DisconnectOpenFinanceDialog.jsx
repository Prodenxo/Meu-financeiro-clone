'use client';

import { useEffect, useRef } from 'react';
import { Alert, Button } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import m from '@/components/dashboard/modal.module.css';
import t from '@/components/transactions/transactions.module.css';

/** Confirma desconexão Open Finance (consentimento na Pluggy). */
export function DisconnectOpenFinanceDialog({ conta, pending, error, onConfirm, onClose }) {
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
      aria-labelledby="of-disconnect-title"
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
          <h2 className={m.title} id="of-disconnect-title">
            Desligar sincronização automática
          </h2>
          <button type="button" className={m.close} onClick={close} aria-label="Fechar" disabled={pending}>
            <Icon name="x" size={18} />
          </button>
        </header>
        <p className={t.dialogText}>
          A conta <strong>{conta?.nome}</strong> deixa de receber extrato automático do banco. Os lançamentos que já
          entraram permanecem. Se o mesmo login tiver outras contas importadas juntas, todas serão desvinculadas — use
          &quot;Conectar meu banco&quot; de novo para autorizar outra vez.
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
            {pending ? 'Desconectando…' : 'Desconectar'}
          </Button>
        </footer>
      </div>
    </dialog>
  );
}
