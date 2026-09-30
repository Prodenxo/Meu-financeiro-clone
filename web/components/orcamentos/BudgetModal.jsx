'use client';

import { useActionState, useEffect, useMemo, useRef, useState } from 'react';
import { saveBudgetAction } from '@/app/(app)/orcamentos/actions';
import { Alert, Button, Field, Input, cx } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { formatBrl } from '@/lib/finance/format';
import { getCategoryIconName } from '@/lib/finance/categoryIcons';
import { getCategorySliceColorForId } from '@/lib/finance/categoryColors';
import { toMoneyInput } from '@/lib/finance/money';
import m from '@/components/dashboard/modal.module.css';
import s from './orcamentos.module.css';

function normalize(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function CatIcon({ id, nome }) {
  const color = getCategorySliceColorForId(id);
  return (
    <span className={s.tableCatIcon} style={{ background: `${color}1f`, color }}>
      <Icon name={getCategoryIconName(nome)} size={14} />
    </span>
  );
}

/**
 * Novo/editar orçamento — mesmas regras do `BudgetModal` do app atual: escolher a
 * categoria (fixa ao editar) e informar o valor orçado do mês. Grava em `orçamentos`.
 */
export function BudgetModal({ item = null, categories, hasCategories = true, mes, monthLabel, onClose }) {
  const dialogRef = useRef(null);
  const [categoriaId, setCategoriaId] = useState(item ? item.categorias_id : '');
  const [query, setQuery] = useState('');
  const [state, formAction, pending] = useActionState(saveBudgetAction, null);
  const isEdit = Boolean(item);

  useEffect(() => {
    const el = dialogRef.current;
    if (el && !el.open) el.showModal();
  }, []);

  useEffect(() => {
    if (state?.ok) {
      const tm = setTimeout(onClose, 1200);
      return () => clearTimeout(tm);
    }
    return undefined;
  }, [state, onClose]);

  const options = useMemo(() => {
    const q = normalize(query);
    return categories.filter((c) => !q || normalize(c.nome).includes(q)).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }, [categories, query]);

  const errors = state?.errors || {};

  return (
    <dialog
      ref={dialogRef}
      className={m.dialog}
      aria-labelledby="budget-modal-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
    >
      <div className={m.body}>
        <header className={m.head}>
          <h2 className={m.title} id="budget-modal-title">
            {isEdit ? 'Editar orçamento' : 'Novo orçamento'}
          </h2>
          <button type="button" className={m.close} onClick={onClose} aria-label="Fechar">
            <Icon name="x" size={18} />
          </button>
        </header>

        {state?.ok ? (
          <Alert tone="success">Orçamento de {formatBrl(state.valor)} salvo para {monthLabel}.</Alert>
        ) : (
          <form action={formAction} className={m.form} noValidate>
            <input type="hidden" name="mes" value={mes} />
            <input type="hidden" name="categorias_id" value={categoriaId} />

            <Field label={`Categoria · ${monthLabel}`} htmlFor="budget-cat" error={errors.categorias_id}>
              {isEdit ? (
                <div className={s.selectedCat} id="budget-cat">
                  <CatIcon id={item.categorias_id} nome={item.nome} />
                  <span>{item.nome}</span>
                </div>
              ) : categories.length === 0 ? (
                <Alert tone="info">
                  {hasCategories
                    ? 'Todas as suas categorias já têm orçamento neste mês.'
                    : 'Você ainda não tem categorias cadastradas. Cadastre uma categoria para definir o limite.'}
                </Alert>
              ) : (
                <>
                  <Input id="budget-cat" placeholder="Buscar categoria…" value={query} onChange={(e) => setQuery(e.target.value)} autoFocus />
                  <div className={s.catPicker} role="listbox" aria-label="Categorias" style={{ marginTop: 8 }}>
                    {options.map((c) => {
                      const active = categoriaId === String(c.id);
                      return (
                        <button key={c.id} type="button" role="option" aria-selected={active} className={cx(s.catOption, active && s.catOptionActive)} onClick={() => setCategoriaId(String(c.id))}>
                          <CatIcon id={c.id} nome={c.nome} />
                          <span className={s.catOptionName}>{c.nome}</span>
                          <span className={s.catOptionType}>{c.tipo === 'entrada' ? 'Receita' : 'Despesa'}</span>
                          {active ? <Icon name="check" size={16} /> : null}
                        </button>
                      );
                    })}
                    {options.length === 0 ? <p className={s.fieldHint}>Nenhuma categoria encontrada.</p> : null}
                  </div>
                </>
              )}
            </Field>

            <Field label="Valor orçado (R$)" htmlFor="budget-valor" error={errors.valor_orcado}>
              <Input id="budget-valor" name="valor_orcado" inputMode="decimal" placeholder="Ex.: 1.500,00" defaultValue={item ? toMoneyInput(item.orcado) : ''} required invalid={Boolean(errors.valor_orcado)} autoFocus={isEdit} />
              <p className={s.fieldHint}>Limite para o mês. Os lançamentos da categoria são comparados com este valor.</p>
            </Field>

            {errors.form ? <Alert tone="error">{errors.form}</Alert> : null}

            <footer className={m.foot}>
              <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
                Cancelar
              </Button>
              <Button type="submit" disabled={pending || !categoriaId} aria-busy={pending}>
                {pending ? 'Salvando…' : 'Salvar orçamento'}
              </Button>
            </footer>
          </form>
        )}
      </div>
    </dialog>
  );
}
