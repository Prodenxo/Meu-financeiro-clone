'use client';

import { useActionState, useEffect, useMemo, useRef, useState } from 'react';
import { saveTransactionAction } from '@/app/(app)/transacoes/actions';
import { Alert, Button, Field, Input, Segmented, Select } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { formatBrl } from '@/lib/finance/format';
import { normalizarTipo } from '@/lib/finance/normalize';
import { isRealizedLancamentoStatus } from '@/lib/finance/status';
import { toMoneyInput } from '@/lib/finance/money';
import m from './modal.module.css';

const TITLES = {
  create: 'Nova transação',
  edit: 'Editar transação',
  duplicate: 'Duplicar transação',
  materialize: 'Lançar recorrência',
};

/**
 * Formulário de lançamento (mesma gravação do app: `lancamentos_id`).
 * `mode`: create | edit (usa `draft.id`) | duplicate | materialize (projeção de recorrência).
 * Modal acessível: <dialog> nativo com foco preso, Esc fecha, título ligado por aria.
 */
export function NewTransactionModal({ initialTipo, mode = 'create', draft = null, categories, contas, todayKey, onClose }) {
  const dialogRef = useRef(null);
  const [tipo, setTipo] = useState(draft ? normalizarTipo(draft.tipo) : initialTipo || 'saida');
  const [state, formAction, pending] = useActionState(saveTransactionAction, null);

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

  const draftTipo = draft ? normalizarTipo(draft.tipo) : null;
  const draftCategoria = draft && draftTipo === tipo ? String(draft.classificacao || '') : '';

  const categoriasDoTipo = useMemo(() => {
    const list = categories.filter((c) => c.tipo === tipo).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    if (draftCategoria && !list.some((c) => c.nome === draftCategoria)) {
      list.unshift({ id: `draft-${draftCategoria}`, nome: draftCategoria });
    }
    return list;
  }, [categories, tipo, draftCategoria]);

  const errors = state?.errors || {};
  const isEdit = mode === 'edit' && draft?.id;
  const realizadoDefault = draft ? isRealizedLancamentoStatus(draft.status) : true;

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
            {TITLES[mode] || TITLES.create}
          </h2>
          <button type="button" className={m.close} onClick={onClose} aria-label="Fechar">
            <Icon name="x" size={18} />
          </button>
        </header>

        {state?.ok ? (
          <Alert tone="success">
            {state.tipo === 'entrada' ? 'Entrada' : 'Saída'} de {formatBrl(state.valor)} {state.edited ? 'atualizada' : 'salva'} com
            sucesso.
          </Alert>
        ) : (
          <form action={formAction} className={m.form} noValidate>
            <input type="hidden" name="tipo" value={tipo} />
            {isEdit ? <input type="hidden" name="id" value={draft.id} /> : null}
            {mode === 'materialize' && draft?.recorrencia_id ? (
              <>
                <input type="hidden" name="recorrencia_id" value={draft.recorrencia_id} />
                <input type="hidden" name="recorrencia_ano_mes" value={draft.recorrencia_ano_mes || ''} />
              </>
            ) : null}

            {mode === 'materialize' ? (
              <Alert tone="info">Este lançamento vem de uma recorrência. Ao salvar, ele passa a valer de verdade neste mês.</Alert>
            ) : null}

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
                <Input
                  id="ntx-valor"
                  name="valor"
                  inputMode="decimal"
                  placeholder="0,00"
                  defaultValue={Number(draft?.valor) > 0 ? toMoneyInput(draft.valor) : ''}
                  required
                  invalid={Boolean(errors.valor)}
                  autoFocus
                />
              </Field>
              <Field label="Data" htmlFor="ntx-data" error={errors.data}>
                <Input
                  id="ntx-data"
                  name="data"
                  type="date"
                  defaultValue={draft?.data ? String(draft.data).slice(0, 10) : todayKey}
                  required
                  invalid={Boolean(errors.data)}
                />
              </Field>
            </div>

            <Field label="Categoria" htmlFor="ntx-cat" error={errors.classificacao}>
              {categoriasDoTipo.length > 0 ? (
                <Select key={tipo} id="ntx-cat" name="classificacao" required defaultValue={draftCategoria}>
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
                <Input id="ntx-cat" name="classificacao" placeholder="Nome da categoria" defaultValue={draftCategoria} required />
              )}
            </Field>

            {contas.length > 0 ? (
              <Field label="Conta" htmlFor="ntx-conta">
                <Select id="ntx-conta" name="conta_id" defaultValue={draft?.conta_id || ''}>
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
              <Input id="ntx-obs" name="obs" maxLength={200} defaultValue={draft?.obs || ''} placeholder="Ex.: conta de luz de setembro" />
            </Field>

            <label className={m.check}>
              <input type="checkbox" name="realizado" defaultChecked={realizadoDefault} />
              <span>{tipo === 'entrada' ? 'Já recebi este valor' : 'Já paguei este valor'}</span>
            </label>

            {errors.form ? <Alert tone="error">{errors.form}</Alert> : null}

            <footer className={m.foot}>
              <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
                Cancelar
              </Button>
              <Button type="submit" disabled={pending} aria-busy={pending}>
                {pending ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Salvar'}
              </Button>
            </footer>
          </form>
        )}
      </div>
    </dialog>
  );
}
