'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  checkGoogleConnectedAction,
  googleAuthUrlForTransactionAction,
  saveTransactionAction,
  syncTransactionGoogleEventAction,
} from '@/app/(app)/transacoes/actions';
import { Alert, Button, Field, IconBubble, Input, Segmented, Select } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { REMINDER_OPTIONS } from '@/lib/finance/agenda';
import { formatBrl } from '@/lib/finance/format';
import { toMoneyInput } from '@/lib/finance/money';
import { normalizarTipo } from '@/lib/finance/normalize';
import { isRealizedLancamentoStatus } from '@/lib/finance/status';
import {
  RECURRENCE_PRESETS,
  buildTransactionEventTitle,
  parseRecurrenceQuantity,
  recurrenceTotalLabel,
} from '@/lib/finance/transactionModal';
import m from './modal.module.css';

const DRAFT_STORAGE_KEY = 'mf_ntx_draft_v1';

function readOAuthDraft() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(DRAFT_STORAGE_KEY);
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

const TITLES = {
  create: 'Nova transação',
  edit: 'Editar transação',
  duplicate: 'Duplicar transação',
  materialize: 'Lançar recorrência',
};

const SUBTITLES = {
  create: 'Registre uma entrada ou saída',
  edit: 'Atualize os dados deste lançamento',
  duplicate: 'Confira os dados antes de salvar a cópia',
  materialize: 'Este mês passará a valer como lançamento real',
};

function ToggleSwitch({ checked, onChange, id, disabled, label }) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`${m.switch} ${checked ? m.switchOn : ''}`}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
    >
      <span className={m.switchKnob} aria-hidden="true" />
    </button>
  );
}

function ExpandSection({ icon, title, hint, enabled, onToggle, disabled, children }) {
  return (
    <section className={`${m.expand} ${enabled ? m.expandOn : ''}`}>
      <div className={m.expandHead}>
        <div className={m.expandMeta}>
          <span className={`${m.expandIcon} ${enabled ? m.expandIconOn : ''}`}>
            <Icon name={icon} size={18} />
          </span>
          <div>
            <p className={m.expandTitle}>{title}</p>
            <p className={m.expandHint}>{hint}</p>
          </div>
        </div>
        <ToggleSwitch checked={enabled} onChange={onToggle} disabled={disabled} label={title} />
      </div>
      {enabled ? <div className={m.expandBody}>{children}</div> : null}
    </section>
  );
}

export function NewTransactionModal({ initialTipo, mode = 'create', draft = null, categories, contas, todayKey, onClose }) {
  const dialogRef = useRef(null);
  const submitLock = useRef(false);
  const [oauthDraft] = useState(readOAuthDraft);

  const [tipo, setTipo] = useState(
    () => oauthDraft?.tipo || (draft ? normalizarTipo(draft.tipo) : initialTipo || 'saida'),
  );
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(null);
  const [googleConnected, setGoogleConnected] = useState(null);
  const [googleBusy, setGoogleBusy] = useState(false);

  const [recorrente, setRecorrente] = useState(() => Boolean(oauthDraft?.recorrente));
  const [maxPreset, setMaxPreset] = useState(12);
  const [customQty, setCustomQty] = useState('');
  const [useCustomQty, setUseCustomQty] = useState(false);

  const [googleOn, setGoogleOn] = useState(() => Boolean(oauthDraft?.googleOn));
  const [googleAllDay, setGoogleAllDay] = useState(true);
  const [googleStart, setGoogleStart] = useState('09:00');
  const [googleEnd, setGoogleEnd] = useState('10:00');
  const [googleReminder, setGoogleReminder] = useState('30');
  const [savedEventId, setSavedEventId] = useState('');
  const [partialGoogle, setPartialGoogle] = useState(null);

  const isEdit = mode === 'edit' && draft?.id;
  const canRepeat = mode === 'create' || mode === 'duplicate';
  const canGoogle = mode !== 'edit';

  useEffect(() => {
    const el = dialogRef.current;
    if (el && !el.open) el.showModal();
  }, []);

  useEffect(() => {
    checkGoogleConnectedAction().then((res) => setGoogleConnected(Boolean(res.connected)));
  }, []);

  const draftTipo = draft ? normalizarTipo(draft.tipo) : null;
  const draftCategoria = draft && draftTipo === tipo ? String(draft.classificacao || '') : '';

  const categoriasDoTipo = useMemo(() => {
    const list = categories.filter((c) => c.tipo === tipo).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    if (draftCategoria && !list.some((c) => c.nome === draftCategoria)) {
      list.unshift({ id: `draft-${draftCategoria}`, nome: draftCategoria });
    }
    return list;
  }, [categories, tipo, draftCategoria]);

  const realizadoDefault = draft ? isRealizedLancamentoStatus(draft.status) : true;
  const effectiveQty = useCustomQty ? parseRecurrenceQuantity(customQty) : maxPreset;

  const googlePreviewTitle = useCallback(
    (valorRaw, classificacao) => {
      const v = parseFloat(String(valorRaw || '').replace(/\./g, '').replace(',', '.'));
      if (!Number.isFinite(v) || v <= 0 || !classificacao) return 'Preencha valor e categoria para ver o resumo.';
      return buildTransactionEventTitle({ tipo, valor: v, classificacao });
    },
    [tipo],
  );

  const connectGoogle = async () => {
    setGoogleBusy(true);
    try {
      sessionStorage.setItem(
        DRAFT_STORAGE_KEY,
        JSON.stringify({ tipo, recorrente, googleOn: true }),
      );
      const returnTo = `${window.location.origin}${window.location.pathname}${window.location.search}`;
      const res = await googleAuthUrlForTransactionAction(returnTo);
      if (res.ok && res.authUrl) window.location.href = res.authUrl;
      else setErrors((e) => ({ ...e, google: res.error || 'Não foi possível abrir o Google.' }));
    } finally {
      setGoogleBusy(false);
    }
  };

  const runGoogleSync = async (transactionId, recurring, maxOcc) => {
    const res = await syncTransactionGoogleEventAction({
      transactionId,
      isAllDay: googleAllDay,
      startTime: googleStart,
      endTime: googleEnd,
      reminderMinutes: googleReminder,
      recurring,
      max_ocorrencias: maxOcc ?? '',
      existingEventId: savedEventId || undefined,
    });
    if (res.ok) {
      setSavedEventId(res.eventId);
      setPartialGoogle(null);
      return true;
    }
    if (res.needsAuth) {
      setPartialGoogle({ message: res.error, needsAuth: true, transactionId });
      setGoogleConnected(false);
      return false;
    }
    setPartialGoogle({
      message: res.error || 'Falha ao sincronizar com o Google Agenda.',
      transactionId,
      errors: res.errors,
    });
    return false;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitLock.current || pending) return;
    submitLock.current = true;
    setPending(true);
    setErrors({});
    setPartialGoogle(null);

    const form = event.currentTarget;
    const fd = new FormData(form);
    fd.set('tipo', tipo);
    if (recorrente && canRepeat) {
      fd.set('recorrente', 'on');
      const q = useCustomQty ? customQty : String(maxPreset);
      if (q) fd.set('max_ocorrencias', q);
    }

    const saveResult = await saveTransactionAction(null, fd);
    if (!saveResult.ok) {
      setErrors(saveResult.errors || { form: 'Não foi possível salvar.' });
      setPending(false);
      submitLock.current = false;
      return;
    }

    let googleOk = true;
    if (googleOn && canGoogle && saveResult.transactionId) {
      const qty = recorrente && canRepeat ? (Number.isNaN(effectiveQty) ? null : effectiveQty) : null;
      googleOk = await runGoogleSync(saveResult.transactionId, Boolean(saveResult.recorrenciaId && recorrente), qty);
    }

    setPending(false);
    submitLock.current = false;

    if (!googleOk && googleOn) {
      setSuccess({
        ...saveResult,
        googleFailed: true,
        recurrenceWarning: saveResult.recurrenceWarning,
      });
      return;
    }

    setSuccess({
      ...saveResult,
      googleSynced: googleOn && googleOk,
      recurrenceWarning: saveResult.recurrenceWarning,
    });
    setTimeout(onClose, partialGoogle ? 0 : 1400);
  };

  const retryGoogleOnly = async () => {
    if (!partialGoogle?.transactionId || pending) return;
    setPending(true);
    const qty = recorrente && canRepeat ? (Number.isNaN(effectiveQty) ? null : effectiveQty) : null;
    const ok = await runGoogleSync(partialGoogle.transactionId, recorrente, qty);
    setPending(false);
    if (ok) {
      setSuccess((s) => ({ ...s, googleSynced: true, googleFailed: false }));
      setTimeout(onClose, 1400);
    }
  };

  const title = TITLES[mode] || TITLES.create;
  const subtitle = SUBTITLES[mode] || SUBTITLES.create;

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
          <div className={m.headText}>
            <IconBubble name="arrow-left-right" tone="primary" size={40} iconSize={20} />
            <div>
              <h2 className={m.title} id="ntx-title">
                {title}
              </h2>
              <p className={m.subtitle}>{subtitle}</p>
            </div>
          </div>
          <button type="button" className={m.close} onClick={onClose} aria-label="Fechar">
            <Icon name="x" size={18} />
          </button>
        </header>

        {success?.ok ? (
          <div className={m.form}>
            <Alert tone="success">
              {success.tipo === 'entrada' ? 'Entrada' : 'Saída'} de {formatBrl(success.valor)}{' '}
              {success.edited ? 'atualizada' : 'salva'} com sucesso.
              {success.googleSynced ? ' Lembrete enviado ao Google Agenda.' : null}
            </Alert>
            {success.recurrenceWarning ? <Alert tone="info">{success.recurrenceWarning}</Alert> : null}
            {success.googleFailed && partialGoogle ? (
              <>
                <Alert tone="error">{partialGoogle.message}</Alert>
                <div className={m.foot}>
                  {partialGoogle.needsAuth ? (
                    <Button type="button" onClick={connectGoogle} disabled={googleBusy}>
                      Conectar Google
                    </Button>
                  ) : (
                    <Button type="button" onClick={retryGoogleOnly} disabled={pending}>
                      Tentar sincronizar de novo
                    </Button>
                  )}
                  <Button type="button" variant="outline" onClick={onClose}>
                    Fechar
                  </Button>
                </div>
              </>
            ) : null}
          </div>
        ) : (
          <form className={m.form} onSubmit={handleSubmit} noValidate>
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

            <Field label="Valor (R$)" htmlFor="ntx-valor" error={errors.valor}>
              <Input
                id="ntx-valor"
                name="valor"
                className={m.valorInput}
                inputMode="decimal"
                placeholder="0,00"
                defaultValue={Number(draft?.valor) > 0 ? toMoneyInput(draft.valor) : ''}
                required
                invalid={Boolean(errors.valor)}
                autoFocus
              />
            </Field>

            <div className={m.row}>
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

            <Field label="Observação (opcional)" htmlFor="ntx-obs">
              <Input id="ntx-obs" name="obs" maxLength={200} defaultValue={draft?.obs || ''} placeholder="Ex.: conta de luz" />
            </Field>

            <label className={m.check}>
              <input type="checkbox" name="realizado" defaultChecked={realizadoDefault} />
              <span>{tipo === 'entrada' ? 'Já recebi este valor' : 'Já paguei este valor'}</span>
            </label>

            {canRepeat ? (
              <ExpandSection
                icon="repeat"
                title="Repetir lançamento"
                hint="Crie lançamentos automáticos para os próximos meses"
                enabled={recorrente}
                onToggle={setRecorrente}
              >
                <div className={m.row}>
                  <Field label="Frequência" htmlFor="ntx-freq">
                    <Select id="ntx-freq" defaultValue="mensal" disabled>
                      <option value="mensal">Mensal</option>
                    </Select>
                  </Field>
                  <Field label="Quantidade" htmlFor="ntx-qty" error={errors.max_ocorrencias}>
                    <Select
                      id="ntx-qty"
                      value={useCustomQty ? 'custom' : String(maxPreset)}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === 'custom') {
                          setUseCustomQty(true);
                        } else if (v === 'none') {
                          setUseCustomQty(true);
                          setCustomQty('');
                        } else {
                          setUseCustomQty(false);
                          setMaxPreset(Number(v));
                        }
                      }}
                    >
                      <option value="none">Sem limite</option>
                      {RECURRENCE_PRESETS.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                      <option value="custom">Personalizar…</option>
                    </Select>
                  </Field>
                </div>
                {useCustomQty ? (
                  <Field label="Meses (total incluindo este)" htmlFor="ntx-qty-custom" error={errors.max_ocorrencias}>
                    <Input
                      id="ntx-qty-custom"
                      inputMode="numeric"
                      placeholder="Ex.: 12"
                      value={customQty}
                      onChange={(e) => setCustomQty(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    />
                  </Field>
                ) : null}
                <p className={m.summaryLine}>
                  <Icon name="calendar-days" size={16} />
                  {recurrenceTotalLabel(useCustomQty && customQty === '' ? null : effectiveQty)}
                </p>
              </ExpandSection>
            ) : null}

            {canGoogle ? (
              <ExpandSection
                icon="calendar-days"
                title="Adicionar ao Google Agenda"
                hint="Crie um evento para este lançamento"
                enabled={googleOn}
                onToggle={setGoogleOn}
              >
                {googleConnected === false ? (
                  <Alert tone="info">
                    Google Agenda desconectado. Conecte para criar o lembrete — os dados do formulário serão preservados.
                  </Alert>
                ) : null}
                {googleConnected === false ? (
                  <Button type="button" variant="outline" onClick={connectGoogle} disabled={googleBusy} block>
                    {googleBusy ? 'Abrindo o Google…' : 'Conectar com Google'}
                  </Button>
                ) : null}
                {errors.google ? <Alert tone="error">{errors.google}</Alert> : null}
                <label className={m.check}>
                  <input type="checkbox" checked={googleAllDay} onChange={(e) => setGoogleAllDay(e.target.checked)} />
                  <span>Dia inteiro</span>
                </label>
                {!googleAllDay ? (
                  <div className={m.row}>
                    <Field label="Início" htmlFor="ntx-g-start" error={partialGoogle?.errors?.startTime}>
                      <Input id="ntx-g-start" type="time" value={googleStart} onChange={(e) => setGoogleStart(e.target.value)} />
                    </Field>
                    <Field label="Término" htmlFor="ntx-g-end" error={partialGoogle?.errors?.endTime}>
                      <Input id="ntx-g-end" type="time" value={googleEnd} onChange={(e) => setGoogleEnd(e.target.value)} />
                    </Field>
                  </div>
                ) : null}
                <Field label="Lembrete" htmlFor="ntx-reminder">
                  <Select id="ntx-reminder" value={googleReminder} onChange={(e) => setGoogleReminder(e.target.value)}>
                    {REMINDER_OPTIONS.filter((o) => o.value !== '').map((o) => (
                      <option key={o.value || 'none'} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <GooglePreview formId="ntx-preview" tipo={tipo} buildTitle={googlePreviewTitle} />
                <p className={m.summaryHint}>
                  Enviaremos título, data, categoria, valor, status e observação (se houver). O pagamento/recebimento continua só no app.
                </p>
              </ExpandSection>
            ) : null}

            {errors.form ? <Alert tone="error">{errors.form}</Alert> : null}

            <footer className={m.footSticky}>
              <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
                Cancelar
              </Button>
              <Button type="submit" disabled={pending} aria-busy={pending}>
                {pending ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Salvar transação'}
              </Button>
            </footer>
          </form>
        )}
      </div>
    </dialog>
  );
}

function GooglePreview({ formId, tipo, buildTitle }) {
  const [preview, setPreview] = useState('Preencha valor e categoria para ver o resumo.');
  useEffect(() => {
    const form = document.getElementById(formId)?.closest('form');
    if (!form) return undefined;
    const refresh = () => {
      const valor = form.querySelector('[name="valor"]')?.value;
      const cat = form.querySelector('[name="classificacao"]')?.value;
      setPreview(buildTitle(valor, cat));
    };
    refresh();
    form.addEventListener('input', refresh);
    return () => form.removeEventListener('input', refresh);
  }, [buildTitle, formId]);
  return (
    <p className={m.googlePreview} id={formId}>
      <strong>Resumo:</strong> {preview}
    </p>
  );
}
