'use client';

import { useActionState, useEffect, useMemo, useRef, useState } from 'react';
import { createTransactionAction } from '@/app/(app)/visao-geral/actions';
import { Alert, Button, Field, Input, Segmented, Select } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { formatBrl } from '@/lib/finance/format';
import m from './modal.module.css';

/**
 * Nova transação (mesma gravação do app: `lancamentos_id`).
 * Modal acessível: <dialog> nativo com foco preso, Esc fecha, título ligado por aria.
 */
export function NewTransactionModal({ initialTipo, categories, contas, todayKey, onClose }) {
  const dialogRef = useRef(null);
  const [tipo, setTipo] = useState(initialTipo || 'saida');
  const [state, formAction, pending] = useActionState(createTransactionAction, null);

  useEffect(() => {
    const el = dialogRef.current;
    if (el && !el.open) el.showModal();
  }, []);

  useEffect(() => {
    if (state?.ok) {
      const t = setTimeout(onClose, 1400);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [state, onClose]);

  const categoriasDoTipo = useMemo(
    () => categories.filter((c) => c.tipo === tipo).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
    [categories, tipo],
  );

  const errors = state?.errors || {};

  return (
    <dialog
      ref={dialogRef}
      className={m.dialog}
      aria-labelledby="ntx-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
    >
      <div className={m.body}>
        <header className={m.head}>
          <h2 className={m.title} id="ntx-title">
            Nova transação
          </h2>
          <button type="button" className={m.close} onClick={onClose} aria-label="Fechar">
            <Icon name="x" size={18} />
          </button>
        </header>

        {state?.ok ? (
          <Alert tone="success">
            {state.tipo === 'entrada' ? 'Entrada' : 'Saída'} de {formatBrl(state.valor)} salva com sucesso.
          </Alert>
        ) : (
          <form action={formAction} className={m.form} noValidate>
            <input type="hidden" name="tipo" value={tipo} />

            <Segmented
              ariaLabel="Tipo de lançamento"
              value={tipo}
              onChange={setTipo}
              options={[
                { value: 'saida', label: 'Saída' },
                { value: 'entrada', label: 'Entrada' },
              ]}
            />

            <div className={m.row}>
              <Field label="Valor (R$)" htmlFor="ntx-valor" error={errors.valor}>
                <Input id="ntx-valor" name="valor" inputMode="decimal" placeholder="0,00" required invalid={Boolean(errors.valor)} autoFocus />
              </Field>
              <Field label="Data" htmlFor="ntx-data" error={errors.data}>
                <Input id="ntx-data" name="data" type="date" defaultValue={todayKey} required invalid={Boolean(errors.data)} />
              </Field>
            </div>

            <Field label="Categoria" htmlFor="ntx-cat" error={errors.classificacao}>
              {categoriasDoTipo.length > 0 ? (
                <Select id="ntx-cat" name="classificacao" required defaultValue="">
                  <option value="" disabled>
                    Escolha uma categoria
                  </option>
                  {categoriasDoTipo.map((c) => (
                    <option key={c.id} value={c.nome}>
                      {c.nome}
                    </option>
                  ))}
                </Select>
              ) : (
                <Input id="ntx-cat" name="classificacao" placeholder="Nome da categoria" required />
              )}
            </Field>

            {contas.length > 0 ? (
              <Field label="Conta" htmlFor="ntx-conta">
                <Select id="ntx-conta" name="conta_id" defaultValue="">
                  <option value="">Sem conta vinculada</option>
                  {contas.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </Select>
              </Field>
            ) : null}

            <Field label="Observação (opcional)" htmlFor="ntx-obs">
              <Input id="ntx-obs" name="obs" maxLength={200} placeholder="Ex.: conta de luz de setembro" />
            </Field>

            <label className={m.check}>
              <input type="checkbox" name="realizado" defaultChecked />
              <span>{tipo === 'entrada' ? 'Já recebi este valor' : 'Já paguei este valor'}</span>
            </label>

            {errors.form ? <Alert tone="error">{errors.form}</Alert> : null}

            <footer className={m.foot}>
              <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
                Cancelar
              </Button>
              <Button type="submit" disabled={pending} aria-busy={pending}>
                {pending ? 'Salvando…' : 'Salvar'}
              </Button>
            </footer>
          </form>
        )}
      </div>
    </dialog>
  );
}
