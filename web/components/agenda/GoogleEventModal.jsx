'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { saveGoogleEventAction } from '@/app/(app)/agenda/actions';
import { Alert, Button, Field, Input, Select, cx } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { GOOGLE_CALENDAR_COLORS, RECURRENCE_OPTIONS, REMINDER_OPTIONS, googleEventToForm } from '@/lib/finance/agenda';
import m from '@/components/dashboard/modal.module.css';
import s from './agenda.module.css';

function initialForm(event, defaults) {
  if (event) return googleEventToForm(event);
  return {
    title: '',
    description: '',
    location: '',
    isAllDay: Boolean(defaults.isAllDay),
    startDate: defaults.startDate,
    endDate: defaults.startDate,
    startTime: '09:00',
    endTime: '10:00',
    colorId: '',
    recurrence: '',
    reminderMinutes: defaults.isAllDay ? '1440' : '30',
    createMeetLink: false,
  };
}

/**
 * Novo compromisso / Editar compromisso — mesmos campos do `CreateGoogleEventModal` do app
 * atual (descrição, data, início/término, dia inteiro, lembrete, local, cor, Meet, repetir, detalhes).
 * Grava no Google Agenda via server action.
 */
export function GoogleEventModal({ event = null, defaults, onClose, onSaved, onDelete }) {
  const dialogRef = useRef(null);
  const [form, setForm] = useState(() => initialForm(event, defaults));
  const [state, formAction, pending] = useActionState(saveGoogleEventAction, null);
  const isEdit = Boolean(event?.id);

  useEffect(() => {
    const el = dialogRef.current;
    if (el && !el.open) el.showModal();
  }, []);

  useEffect(() => {
    if (state?.ok) {
      onSaved?.(state);
      const tm = setTimeout(onClose, 900);
      return () => clearTimeout(tm);
    }
    return undefined;
  }, [state, onClose, onSaved]);

  const errors = state?.errors || {};
  const patch = (p) => setForm((f) => ({ ...f, ...p }));
  const onStartDate = (v) => patch({ startDate: v, endDate: !form.endDate || form.endDate < v ? v : form.endDate });
  const onStartTime = (v) => {
    const next = { startTime: v };
    if (form.endDate === form.startDate && form.endTime <= v) {
      const [h, mi] = v.split(':').map(Number);
      next.endTime = `${String(Math.min(23, h + 1)).padStart(2, '0')}:${String(mi).padStart(2, '0')}`;
    }
    patch(next);
  };

  return (
    <dialog
      ref={dialogRef}
      className={m.dialog}
      aria-labelledby="gevent-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
    >
      <div className={m.body}>
        <header className={m.head}>
          <h2 className={m.title} id="gevent-title">
            {isEdit ? 'Editar compromisso' : 'Novo compromisso'}
          </h2>
          <button type="button" className={m.close} onClick={onClose} aria-label="Fechar">
            <Icon name="x" size={18} />
          </button>
        </header>

        <form action={formAction} className={m.form} noValidate>
          {isEdit ? <input type="hidden" name="eventId" value={event.id} /> : null}
          <input type="hidden" name="colorId" value={form.colorId} />

          <Field label="Descrição" htmlFor="gev-title" error={errors.title}>
            <Input id="gev-title" name="title" placeholder="Ex: Reunião com cliente" value={form.title} onChange={(e) => patch({ title: e.target.value })} maxLength={200} required autoFocus invalid={Boolean(errors.title)} />
          </Field>

          <div className={s.formRow}>
            <Field label="Data de início" htmlFor="gev-start" error={errors.startDate}>
              <Input id="gev-start" name="startDate" type="date" value={form.startDate} onChange={(e) => onStartDate(e.target.value)} required invalid={Boolean(errors.startDate)} />
            </Field>
            <Field label="Data de término" htmlFor="gev-end" error={errors.endDate}>
              <Input id="gev-end" name="endDate" type="date" value={form.endDate} min={form.startDate} onChange={(e) => patch({ endDate: e.target.value })} invalid={Boolean(errors.endDate)} />
            </Field>
          </div>

          <label className={s.switchRow}>
            <span className={s.switchText}>
              Dia inteiro
              <span className={s.switchHint}>Sem horário definido (aparece como lembrete)</span>
            </span>
            <input type="checkbox" name="isAllDay" checked={form.isAllDay} onChange={(e) => patch({ isAllDay: e.target.checked, createMeetLink: e.target.checked ? false : form.createMeetLink })} />
          </label>

          {!form.isAllDay ? (
            <div className={s.formRow}>
              <Field label="Início" htmlFor="gev-st">
                <Input id="gev-st" name="startTime" type="time" step={900} value={form.startTime} onChange={(e) => onStartTime(e.target.value)} />
              </Field>
              <Field label="Término" htmlFor="gev-et" error={errors.endTime}>
                <Input id="gev-et" name="endTime" type="time" step={900} value={form.endTime} onChange={(e) => patch({ endTime: e.target.value })} invalid={Boolean(errors.endTime)} />
              </Field>
            </div>
          ) : (
            <>
              <input type="hidden" name="startTime" value={form.startTime} />
              <input type="hidden" name="endTime" value={form.endTime} />
            </>
          )}

          <div className={s.formRow}>
            <Field label="Lembrete" htmlFor="gev-rem">
              <Select id="gev-rem" name="reminderMinutes" value={form.reminderMinutes} onChange={(e) => patch({ reminderMinutes: e.target.value })}>
                {REMINDER_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Repetir" htmlFor="gev-rec">
              <Select id="gev-rec" name="recurrence" value={form.recurrence} onChange={(e) => patch({ recurrence: e.target.value })}>
                {RECURRENCE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="Local (opcional)" htmlFor="gev-loc">
            <Input id="gev-loc" name="location" placeholder="Adicionar local" value={form.location} onChange={(e) => patch({ location: e.target.value })} maxLength={200} />
          </Field>

          <Field label="Cor do evento">
            <div className={s.colorRow} role="radiogroup" aria-label="Cor do evento">
              <button type="button" role="radio" aria-checked={!form.colorId} className={cx(s.swatch, s.swatchDefault, !form.colorId && s.swatchActive)} onClick={() => patch({ colorId: '' })} title="Cor padrão">
                {!form.colorId ? <Icon name="check" size={14} /> : null}
              </button>
              {GOOGLE_CALENDAR_COLORS.map((c) => (
                <button key={c.id} type="button" role="radio" aria-checked={form.colorId === c.id} className={cx(s.swatch, form.colorId === c.id && s.swatchActive)} style={{ background: c.hex }} onClick={() => patch({ colorId: c.id })} title={c.name}>
                  {form.colorId === c.id ? <Icon name="check" size={14} /> : null}
                </button>
              ))}
            </div>
          </Field>

          <label className={cx(s.switchRow)} aria-disabled={form.isAllDay}>
            <span className={s.switchText}>
              Google Meet
              <span className={s.switchHint}>{form.isAllDay ? 'Indisponível em eventos de dia inteiro' : 'Gerar link de reunião'}</span>
            </span>
            <input type="checkbox" name="createMeetLink" checked={form.createMeetLink} disabled={form.isAllDay} onChange={(e) => patch({ createMeetLink: e.target.checked })} />
          </label>

          <Field label="Detalhes (opcional)" htmlFor="gev-desc">
            <Input id="gev-desc" name="description" placeholder="Detalhes adicionais (opcional)" value={form.description} onChange={(e) => patch({ description: e.target.value })} maxLength={1000} />
          </Field>

          {errors.form ? <Alert tone="error">{errors.form}</Alert> : null}
          {state?.ok ? <Alert tone="success">{isEdit ? 'Compromisso atualizado no Google Agenda.' : 'Compromisso criado no Google Agenda.'}</Alert> : null}

          <footer className={m.foot}>
            {isEdit && onDelete ? (
              <Button type="button" variant="ghost" icon="trash" onClick={() => onDelete(event)} disabled={pending} style={{ marginRight: 'auto', color: 'var(--mf-danger)' }}>
                Excluir
              </Button>
            ) : null}
            <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending} aria-busy={pending}>
              {pending ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Salvar compromisso'}
            </Button>
          </footer>
        </form>
      </div>
    </dialog>
  );
}
