'use client';

import { useActionState, useEffect, useMemo, useRef, useState } from 'react';
import { saveContaAction } from '@/app/(app)/contas/actions';
import { Alert, Button, Field, Input, cx } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { CUSTOM_BANK_ID, bankInitials, filterBanksByQuery, findBankById } from '@/lib/finance/bankCatalog';
import { CONTA_COR_PRESETS, CONTA_TIPO_OPTIONS, DEFAULT_CONTA_NOME } from '@/lib/finance/contasPage';
import { toMoneyInput } from '@/lib/finance/money';
import m from '@/components/dashboard/modal.module.css';
import s from './contas.module.css';

function BankTileLogo({ bank }) {
  return (
    <span className={s.bankTileLogo} style={{ background: bank.cor }}>
      {bank.libraryNome ? (
        // eslint-disable-next-line @next/next/no-img-element -- SVG gerado no servidor, sem otimização
        <img src={`/api/bank-icon/${bank.libraryNome}?size=48`} alt="" width={32} height={32} loading="lazy" />
      ) : (
        <span aria-hidden="true">{bankInitials(bank.nome)}</span>
      )}
    </span>
  );
}

function initialState(conta) {
  if (!conta) {
    return { mode: null, bankId: '', nome: '', tipo: 'corrente', cor: CONTA_COR_PRESETS[0] };
  }
  const bank = findBankById(conta.instituicao_id);
  return {
    mode: bank ? 'catalog' : 'custom',
    bankId: bank ? bank.id : '',
    nome: conta.nome,
    tipo: conta.tipo,
    cor: conta.cor || CONTA_COR_PRESETS[0],
  };
}

/**
 * Cadastro/edição de conta — mesmas regras do `ContaModal` do app atual: escolher banco do
 * catálogo (nome/cor/tipo preenchidos) ou "Outra conta"; tipo; saldo inicial; limite,
 * fechamento e vencimento só para cartão; cor. Gravação em `contas_financeiras`.
 */
export function ContaModal({ conta = null, onClose }) {
  const dialogRef = useRef(null);
  const [form, setForm] = useState(() => initialState(conta));
  const [query, setQuery] = useState('');
  const [state, formAction, pending] = useActionState(saveContaAction, null);
  const isEdit = Boolean(conta?.id);

  useEffect(() => {
    const el = dialogRef.current;
    if (el && !el.open) el.showModal();
  }, []);

  useEffect(() => {
    if (state?.ok) {
      const t = setTimeout(onClose, 1200);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [state, onClose]);

  const banks = useMemo(() => filterBanksByQuery(query), [query]);
  const selectedBank = form.mode === 'catalog' ? findBankById(form.bankId) : null;
  const isCartao = form.tipo === 'cartao_credito';
  const errors = state?.errors || {};
  const patch = (p) => setForm((f) => ({ ...f, ...p }));

  const applyBank = (bank) => patch({ mode: 'catalog', bankId: bank.id, nome: bank.nome, cor: bank.cor, tipo: bank.defaultTipo || 'corrente' });
  const applyCustom = () => patch({ mode: 'custom', bankId: '', nome: form.mode === 'custom' ? form.nome : DEFAULT_CONTA_NOME, tipo: 'dinheiro' });

  return (
    <dialog
      ref={dialogRef}
      className={m.dialog}
      aria-labelledby="conta-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
    >
      <div className={m.body}>
        <header className={m.head}>
          <h2 className={m.title} id="conta-title">
            {isEdit ? 'Editar conta' : 'Nova conta'}
          </h2>
          <button type="button" className={m.close} onClick={onClose} aria-label="Fechar">
            <Icon name="x" size={18} />
          </button>
        </header>

        {state?.ok ? (
          <Alert tone="success">Conta {state.mode === 'edit' ? 'atualizada' : 'cadastrada'} com sucesso.</Alert>
        ) : (
          <form action={formAction} className={m.form} noValidate>
            {isEdit ? <input type="hidden" name="id" value={conta.id} /> : null}
            <input type="hidden" name="bank_mode" value={form.mode || ''} />
            <input type="hidden" name="instituicao_id" value={form.bankId} />
            <input type="hidden" name="tipo" value={form.tipo} />
            <input type="hidden" name="cor" value={form.cor} />

            {/* Banco */}
            {selectedBank ? (
              <div className={s.selectedBank}>
                <BankTileLogo bank={selectedBank} />
                <span className={s.selectedBankName}>{selectedBank.nome}</span>
                <Button variant="ghost" size="sm" onClick={() => patch({ mode: null, bankId: '' })}>
                  Trocar
                </Button>
              </div>
            ) : (
              <Field label="Banco ou instituição" htmlFor="conta-busca" error={errors.bank}>
                <div className={s.bankSearch}>
                  <Input id="conta-busca" placeholder="Buscar banco…" value={query} onChange={(e) => setQuery(e.target.value)} autoFocus={!isEdit} />
                </div>
                <div className={s.bankGrid} role="listbox" aria-label="Bancos">
                  {banks.map((bank) => (
                    <button
                      key={bank.id}
                      type="button"
                      role="option"
                      aria-selected={form.bankId === bank.id}
                      className={cx(s.bankTile, form.bankId === bank.id && s.bankTileActive)}
                      onClick={() => applyBank(bank)}
                    >
                      <BankTileLogo bank={bank} />
                      <span>{bank.nome}</span>
                    </button>
                  ))}
                  {banks.length === 0 ? <p className={s.fieldHint}>Nenhum banco encontrado. Use “Outra conta”.</p> : null}
                </div>
                <button type="button" className={cx(s.customTile, form.mode === 'custom' && s.customTileActive)} onClick={applyCustom} data-bank={CUSTOM_BANK_ID}>
                  <Icon name="wallet" size={18} />
                  <span className={s.customTileText}>
                    <span className={s.customTileTitle}>Outra conta</span>
                    <span className={s.customTileHint}>Nome personalizado, carteira, cofre…</span>
                  </span>
                  {form.mode === 'custom' ? <Icon name="check" size={16} /> : null}
                </button>
              </Field>
            )}

            {form.mode === 'custom' ? (
              <Field label="Nome" htmlFor="conta-nome" error={errors.nome}>
                <Input id="conta-nome" name="nome" value={form.nome} onChange={(e) => patch({ nome: e.target.value })} maxLength={60} required invalid={Boolean(errors.nome)} />
              </Field>
            ) : (
              <input type="hidden" name="nome" value={form.nome} />
            )}

            {form.mode ? (
              <>
                <Field label="Tipo" htmlFor="conta-tipo" error={errors.tipo}>
                  <div className={s.chips} id="conta-tipo" role="radiogroup" aria-label="Tipo da conta">
                    {CONTA_TIPO_OPTIONS.map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        role="radio"
                        aria-checked={form.tipo === opt.key}
                        className={cx(s.chip, form.tipo === opt.key && s.chipActive)}
                        onClick={() => patch({ tipo: opt.key })}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label={isCartao ? 'Fatura atual / saldo (R$)' : 'Saldo inicial (R$)'} htmlFor="conta-saldo" error={errors.saldo_inicial}>
                  <Input
                    id="conta-saldo"
                    name="saldo_inicial"
                    inputMode="decimal"
                    placeholder="0,00"
                    defaultValue={conta ? toMoneyInput(conta.saldo_inicial) : ''}
                    required
                    invalid={Boolean(errors.saldo_inicial)}
                  />
                  <p className={s.fieldHint}>{isCartao ? 'Use valor negativo se a fatura estiver em aberto.' : 'Valor no dia em que você passou a usar o app.'}</p>
                </Field>

                {isCartao ? (
                  <div className={s.row3}>
                    <Field label="Limite (opcional)" htmlFor="conta-limite" error={errors.limite_credito}>
                      <Input id="conta-limite" name="limite_credito" inputMode="decimal" placeholder="0,00" defaultValue={conta?.limite_credito != null ? toMoneyInput(conta.limite_credito) : ''} />
                    </Field>
                    <Field label="Fechamento (dia)" htmlFor="conta-fech" error={errors.dia_fechamento}>
                      <Input id="conta-fech" name="dia_fechamento" type="number" min={1} max={31} inputMode="numeric" placeholder="Ex.: 5" defaultValue={conta?.dia_fechamento ?? ''} />
                    </Field>
                    <Field label="Vencimento (dia)" htmlFor="conta-venc" error={errors.dia_vencimento}>
                      <Input id="conta-venc" name="dia_vencimento" type="number" min={1} max={31} inputMode="numeric" placeholder="Ex.: 12" defaultValue={conta?.dia_vencimento ?? ''} />
                    </Field>
                  </div>
                ) : null}

                <Field label="Cor" htmlFor="conta-cor" error={errors.cor}>
                  <div className={s.colors} id="conta-cor" role="radiogroup" aria-label="Cor da conta">
                    {[...new Set([form.cor, ...CONTA_COR_PRESETS].filter(Boolean))].map((cor) => (
                      <button
                        key={cor}
                        type="button"
                        role="radio"
                        aria-checked={form.cor === cor}
                        aria-label={`Cor ${cor}`}
                        className={cx(s.colorDot, form.cor === cor && s.colorDotActive)}
                        style={{ background: cor }}
                        onClick={() => patch({ cor })}
                      />
                    ))}
                  </div>
                </Field>
              </>
            ) : null}

            {errors.form ? <Alert tone="error">{errors.form}</Alert> : null}

            <footer className={m.foot}>
              <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
                Cancelar
              </Button>
              <Button type="submit" disabled={pending || !form.mode} aria-busy={pending}>
                {pending ? 'Salvando…' : 'Salvar conta'}
              </Button>
            </footer>
          </form>
        )}
      </div>
    </dialog>
  );
}