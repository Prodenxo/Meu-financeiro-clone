'use client';

import { useActionState, useEffect, useMemo, useRef, useState } from 'react';
import { saveMoedaGlobalAction } from '@/app/(app)/conta-global/actions';
import { Alert, Button, Field, Input, cx } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { formatBrl } from '@/lib/finance/format';
import { parseMoney, toMoneyInput } from '@/lib/finance/money';
import { POPULAR_MOEDAS, filterCurrencyOptions, formatCotacaoBrl, getMoedaNomePt, normalizeMoedaCode } from '@/lib/finance/moedas';
import m from '@/components/dashboard/modal.module.css';
import s from './contaGlobal.module.css';
import { MoedaFlag } from './MoedaFlag';

/** Seletor de moeda: busca por código/nome, atalhos populares e lista do catálogo (como o `MoedaPickerField`). */
function MoedaPicker({ value, onChange, catalog, exclude, error }) {
  const [open, setOpen] = useState(!value);
  const [query, setQuery] = useState('');
  const options = useMemo(() => filterCurrencyOptions(catalog, query, { exclude }), [catalog, query, exclude]);
  const popular = useMemo(() => POPULAR_MOEDAS.filter((c) => catalog[c] && !exclude.includes(c)), [catalog, exclude]);
  const name = value ? catalog[value] || getMoedaNomePt(value) : '';

  const pick = (code) => {
    onChange(code);
    setOpen(false);
    setQuery('');
  };

  return (
    <Field label="Moeda" htmlFor="moeda-busca" error={error}>
      {value && !open ? (
        <div className={s.selected}>
          <MoedaFlag moeda={value} size={32} label={name} />
          <span className={s.selectedText}>
            <span className={s.selectedCode}>{value}</span>
            <span className={s.selectedName}>{name}</span>
          </span>
          <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
            Trocar
          </Button>
        </div>
      ) : (
        <>
          <div className={s.pickerSearch}>
            <span className={s.pickerSearchIcon}>
              <Icon name="search" size={15} />
            </span>
            <Input id="moeda-busca" placeholder="Buscar por código ou nome (ex.: USD, euro)" value={query} onChange={(e) => setQuery(e.target.value)} autoComplete="off" autoFocus />
          </div>
          {!query.trim() && popular.length > 0 ? (
            <div className={s.chips} aria-label="Moedas populares">
              {popular.map((code) => (
                <button key={code} type="button" className={cx(s.chip, value === code && s.chipActive)} onClick={() => pick(code)} aria-pressed={value === code}>
                  <MoedaFlag moeda={code} size={18} label={catalog[code]} />
                  {code}
                </button>
              ))}
            </div>
          ) : null}
          <div className={s.pickerList} role="listbox" aria-label="Moedas">
            {options.length === 0 ? (
              <p className={s.pickerEmpty}>Nenhuma moeda encontrada.</p>
            ) : (
              options.slice(0, 80).map((opt) => (
                <button key={opt.code} type="button" role="option" aria-selected={value === opt.code} className={cx(s.pickerItem, value === opt.code && s.pickerItemActive)} onClick={() => pick(opt.code)}>
                  <MoedaFlag moeda={opt.code} size={24} label={opt.name} />
                  <span className={s.pickerItemText}>
                    <span className={s.pickerItemCode}>{opt.code}</span>
                    <span className={s.pickerItemName}>{opt.name}</span>
                  </span>
                  {value === opt.code ? <Icon name="check" size={16} /> : null}
                </button>
              ))
            )}
          </div>
        </>
      )}
    </Field>
  );
}

/**
 * Cadastro/edição de moeda — mesmos campos do `ContaMoedaModal` do app atual (moeda, apelido
 * opcional, quanto você tem hoje). Grava em `contas_moeda_global` pela Server Action.
 */
export function MoedaModal({ conta = null, catalog, rates, usedCodes = [], onClose, onSaved }) {
  const dialogRef = useRef(null);
  const isEdit = Boolean(conta?.id);
  const [moeda, setMoeda] = useState(conta ? normalizeMoedaCode(conta.moeda) : '');
  const [valorStr, setValorStr] = useState(conta ? toMoneyInput(conta.valor) : '');
  const [state, formAction, pending] = useActionState(saveMoedaGlobalAction, null);

  useEffect(() => {
    const el = dialogRef.current;
    if (el && !el.open) el.showModal();
  }, []);

  useEffect(() => {
    if (state?.ok) {
      onSaved?.(state);
      const tm = setTimeout(onClose, 1100);
      return () => clearTimeout(tm);
    }
    return undefined;
  }, [state, onClose, onSaved]);

  const errors = state?.errors || {};
  // Em edição a própria moeda continua disponível; as outras já cadastradas ficam fora da lista.
  const exclude = useMemo(() => usedCodes.filter((c) => c !== normalizeMoedaCode(conta?.moeda)), [usedCodes, conta]);

  const rate = moeda && moeda !== 'BRL' ? rates?.[moeda] : null;
  const valorNum = parseMoney(valorStr);
  const preview = Number.isFinite(valorNum) && Number.isFinite(rate) && rate > 0 ? valorNum * rate : null;

  return (
    <dialog
      ref={dialogRef}
      className={m.dialog}
      aria-labelledby="moeda-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
    >
      <div className={m.body}>
        <header className={m.head}>
          <h2 className={m.title} id="moeda-title">
            {isEdit ? 'Editar moeda' : 'Adicionar moeda'}
          </h2>
          <button type="button" className={m.close} onClick={onClose} aria-label="Fechar">
            <Icon name="x" size={18} />
          </button>
        </header>

        {state?.ok ? (
          <Alert tone="success">Moeda {state.mode === 'edit' ? 'atualizada' : 'adicionada'} com sucesso.</Alert>
        ) : (
          <form action={formAction} className={m.form} noValidate>
            {isEdit ? <input type="hidden" name="id" value={conta.id} /> : null}
            <input type="hidden" name="moeda" value={moeda} />

            <MoedaPicker value={moeda} onChange={setMoeda} catalog={catalog} exclude={exclude} error={errors.moeda} />

            <Field label="Apelido (opcional)" htmlFor="moeda-nome" error={errors.nome}>
              <Input id="moeda-nome" name="nome" defaultValue={conta?.nome || ''} maxLength={80} placeholder="Ex.: Wise, PayPal, conta EUA…" />
            </Field>

            <Field label="Quanto você tem hoje" htmlFor="moeda-valor" error={errors.valor}>
              <Input id="moeda-valor" name="valor" inputMode="decimal" placeholder="0,00" value={valorStr} onChange={(e) => setValorStr(e.target.value)} required invalid={Boolean(errors.valor)} />
              <p className={s.fieldHint}>Informe o valor na moeda escolhida acima. O equivalente em reais é só referência.</p>
              {preview != null ? (
                <p className={s.preview}>
                  ≈ {formatBrl(preview)} · 1 {moeda} ≈ {formatCotacaoBrl(rate)}
                </p>
              ) : null}
            </Field>

            {errors.form ? <Alert tone="error">{errors.form}</Alert> : null}

            <footer className={m.foot}>
              <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
                Cancelar
              </Button>
              <Button type="submit" disabled={pending || !moeda} aria-busy={pending}>
                {pending ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Salvar moeda'}
              </Button>
            </footer>
          </form>
        )}
      </div>
    </dialog>
  );
}
