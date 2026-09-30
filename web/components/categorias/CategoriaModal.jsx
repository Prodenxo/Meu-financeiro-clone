'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { saveCategoriaAction } from '@/app/(app)/categorias/actions';
import { Alert, Button, Field, Input, Segmented } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import m from '@/components/dashboard/modal.module.css';

const TIPO_OPTIONS = [
  { value: 'entrada', label: 'Entrada' },
  { value: 'saida', label: 'Saída' },
];

/**
 * Nova categoria / Editar categoria — mesmos campos do app atual (nome + tipo).
 * Gravação em `categorias_id` via server action.
 */
export function CategoriaModal({ categoria = null, defaultTipo = 'saida', onClose, onSaved }) {
  const dialogRef = useRef(null);
  const [tipo, setTipo] = useState(categoria?.tipo || defaultTipo);
  const [state, formAction, pending] = useActionState(saveCategoriaAction, null);
  const isEdit = Boolean(categoria?.id);

  useEffect(() => {
    const el = dialogRef.current;
    if (el && !el.open) el.showModal();
  }, []);

  useEffect(() => {
    if (state?.ok) {
      onSaved?.(state);
      const t = setTimeout(onClose, 900);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [state, onClose, onSaved]);

  const errors = state?.errors || {};

  return (
    <dialog
      ref={dialogRef}
      className={m.dialog}
      aria-labelledby="categoria-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
    >
      <div className={m.body}>
        <header className={m.head}>
          <h2 className={m.title} id="categoria-title">
            {isEdit ? 'Editar categoria' : 'Nova categoria'}
          </h2>
          <button type="button" className={m.close} onClick={onClose} aria-label="Fechar">
            <Icon name="x" size={18} />
          </button>
        </header>

        <form action={formAction} className={m.form}>
          {isEdit ? <input type="hidden" name="id" value={categoria.id} /> : null}
          <input type="hidden" name="tipo" value={tipo} />

          <Field label="Nome" htmlFor="cat-nome" error={errors.nome}>
            <Input id="cat-nome" name="nome" placeholder="Nome da categoria" defaultValue={categoria?.nome || ''} maxLength={60} required autoFocus invalid={Boolean(errors.nome)} />
          </Field>

          <Field label="Tipo">
            <Segmented ariaLabel="Tipo da categoria" value={tipo} onChange={setTipo} options={TIPO_OPTIONS} />
          </Field>

          {errors.form ? <Alert tone="error">{errors.form}</Alert> : null}
          {state?.ok ? <Alert tone="success">{isEdit ? 'Categoria atualizada.' : 'Categoria criada.'}</Alert> : null}

          <footer className={m.foot}>
            <Button variant="outline" type="button" onClick={onClose} disabled={pending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending} aria-busy={pending}>
              {pending ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Criar categoria'}
            </Button>
          </footer>
        </form>
      </div>
    </dialog>
  );
}
