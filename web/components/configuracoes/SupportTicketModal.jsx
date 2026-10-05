'use client';

import { useEffect, useRef, useState } from 'react';
import { supportTicketFormAction } from '@/app/(app)/configuracoes/actions';
import { Alert, Button, Field, Input, Skeleton, cx } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { formatInternationalPhone } from '@/lib/phone/phone';
import m from '@/components/dashboard/modal.module.css';
import s from './configuracoes.module.css';

const PRIORIDADES = [
  { key: 'baixa', label: 'Baixa', icon: 'trending-down' },
  { key: 'media', label: 'Média', icon: 'minus' },
  { key: 'alta', label: 'Alta', icon: 'trending-up' },
  { key: 'critica', label: 'Crítica', icon: 'alert-circle' },
];

const MAX_ANEXO_BYTES = 50 * 1024 * 1024;
const MAX_ANEXOS = 10;

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}
function defaultPrazo() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return isoDate(d);
}

/**
 * Abrir chamado — mesmo formulário do `SupportTicketModal` do Expo (ScrumHub via backend):
 * assunto, descrição, prioridade, prazo, dados de contato e anexos (até 10 × 50 MB).
 */
export function SupportTicketModal({ defaults, onClose }) {
  const dialogRef = useRef(null);
  const [config, setConfig] = useState({ loading: true, error: '', projeto: 'Meu Financeiro' });
  const [assunto, setAssunto] = useState('');
  const [descricao, setDescricao] = useState('');
  const [prioridade, setPrioridade] = useState('media');
  const [prazo, setPrazo] = useState(defaultPrazo);
  const [nome, setNome] = useState(defaults.nome || '');
  const [email, setEmail] = useState(defaults.email || '');
  const [telefone, setTelefone] = useState(defaults.telefone ? formatInternationalPhone(defaults.telefone) : '');
  const [anexos, setAnexos] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState(null);
  const submitLockRef = useRef(false);
  const idempotencyKeyRef = useRef(
    typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `tk-${Date.now()}`,
  );

  useEffect(() => {
    const el = dialogRef.current;
    if (el && !el.open) el.showModal();
  }, []);

  useEffect(() => {
    let alive = true;
    supportTicketFormAction().then((res) => {
      if (!alive) return;
      if (res?.ok) setConfig({ loading: false, error: '', projeto: res.projeto?.nome || 'Meu Financeiro' });
      else setConfig({ loading: false, error: res?.error || 'Não foi possível carregar o formulário de suporte.', projeto: 'Meu Financeiro' });
    });
    return () => {
      alive = false;
    };
  }, []);

  const minDate = isoDate(new Date());

  const addFiles = (list) => {
    const picked = Array.from(list || []);
    if (!picked.length) return;
    const tooBig = picked.find((f) => f.size > MAX_ANEXO_BYTES);
    if (tooBig) return setSubmitError(`Anexo "${tooBig.name}" excede 50MB.`);
    setSubmitError('');
    setAnexos((prev) => [...prev, ...picked].slice(0, MAX_ANEXOS));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (submitLockRef.current || submitting) return;
    const subject = assunto.trim();
    if (!subject) return setSubmitError('Informe o assunto do chamado.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(prazo)) return setSubmitError('Selecione uma data de prazo válida.');
    submitLockRef.current = true;

    const fd = new FormData();
    fd.append('nome', subject);
    fd.append('prioridade', prioridade);
    fd.append('prazo', prazo);
    if (descricao.trim()) fd.append('descricao', descricao.trim());
    if (nome.trim()) fd.append('nome_solicitante', nome.trim());
    if (email.trim()) fd.append('email_solicitante', email.trim());
    if (telefone.trim()) fd.append('contato_solicitante', telefone.trim());
    anexos.forEach((file) => fd.append('anexos', file, file.name));

    setSubmitting(true);
    setSubmitError('');
    let completed = false;
    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Idempotency-Key': idempotencyKeyRef.current },
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.error) throw new Error(data?.error || 'Não foi possível abrir o chamado.');
      setSuccess({ message: data.message || 'Chamado criado com sucesso.', url: data.url || null });
      completed = true;
    } catch (err) {
      setSubmitError(err?.message || 'Não foi possível abrir o chamado.');
    } finally {
      setSubmitting(false);
      if (!completed) submitLockRef.current = false;
    }
  };

  const close = () => {
    if (!submitting) onClose(Boolean(success));
  };

  return (
    <dialog
      ref={dialogRef}
      className={m.dialog}
      aria-labelledby="ticket-title"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current) close();
      }}
    >
      <div className={cx(m.body, s.ticketBody)}>
        <header className={m.head}>
          <div>
            <h2 className={m.title} id="ticket-title">
              Abrir chamado
            </h2>
            <p className={s.cardDesc}>{config.projeto}</p>
          </div>
          <button type="button" className={m.close} onClick={close} aria-label="Fechar formulário de suporte" disabled={submitting}>
            <Icon name="x" size={18} />
          </button>
        </header>

        {config.loading ? (
          <div style={{ display: 'grid', gap: 12 }} aria-busy="true">
            <Skeleton height={42} radius={12} />
            <Skeleton height={96} radius={12} />
            <Skeleton height={42} radius={12} />
          </div>
        ) : config.error ? (
          <div style={{ display: 'grid', gap: 16 }}>
            <Alert tone="error">{config.error}</Alert>
            <footer className={m.foot}>
              <Button variant="outline" onClick={close}>
                Fechar
              </Button>
            </footer>
          </div>
        ) : success ? (
          <div className={s.ticketSuccess}>
            <span className={s.ticketSuccessIcon}>
              <Icon name="circle-check" size={28} />
            </span>
            <strong>{success.message}</strong>
            <p className={s.cardDesc}>Nossa equipe recebeu seu chamado e retornará em breve.</p>
            {success.url ? (
              <a href={success.url} target="_blank" rel="noopener noreferrer" className={s.googleBtn}>
                Acompanhar chamado
              </a>
            ) : null}
            <Button onClick={close}>Concluir</Button>
          </div>
        ) : (
          <form onSubmit={submit} className={m.form} noValidate>
            <p className={s.sectionLabel}>Detalhes do chamado</p>
            <Field label="Assunto *" htmlFor="tk-assunto">
              <Input id="tk-assunto" value={assunto} onChange={(e) => setAssunto(e.target.value)} placeholder="Ex.: erro ao salvar um lançamento" required autoFocus />
            </Field>
            <Field label="Descrição" htmlFor="tk-descricao">
              <textarea id="tk-descricao" className={s.textarea} value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Conte o contexto, passos e mensagens de erro" />
            </Field>

            <div className={s.ticketGrid}>
              <div>
                <span className={s.fieldLabel} id="tk-prio-label">
                  Prioridade
                </span>
                <div className={s.prioridades} role="radiogroup" aria-labelledby="tk-prio-label">
                  {PRIORIDADES.map((p) => (
                    <label key={p.key} className={cx(s.prioChip, prioridade === p.key && s.prioChipActive)}>
                      <input type="radio" name="prioridade" value={p.key} checked={prioridade === p.key} onChange={() => setPrioridade(p.key)} />
                      <Icon name={p.icon} size={13} />
                      {p.label}
                    </label>
                  ))}
                </div>
              </div>
              <Field label="Prazo desejado" htmlFor="tk-prazo">
                <Input id="tk-prazo" type="date" min={minDate} value={prazo} onChange={(e) => setPrazo(e.target.value)} required />
              </Field>
            </div>

            <p className={s.sectionLabel}>Seus dados</p>
            <Field label="Nome" htmlFor="tk-nome">
              <Input id="tk-nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" autoComplete="name" />
            </Field>
            <div className={s.ticketGrid}>
              <Field label="E-mail" htmlFor="tk-email">
                <Input id="tk-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com" autoComplete="email" />
              </Field>
              <Field label="Telefone" htmlFor="tk-telefone">
                <Input id="tk-telefone" type="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(21) 99999-9999" autoComplete="tel" />
              </Field>
            </div>

            <div>
              <p className={s.sectionLabel} style={{ marginBottom: 8 }}>
                Anexos <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 500 }}>— PDF, Office, TXT · máx. 50MB cada</span>
              </p>
              <label className={s.attachBtn}>
                <input type="file" multiple onChange={(e) => addFiles(e.target.files)} disabled={anexos.length >= MAX_ANEXOS} />
                <Icon name="paperclip" size={16} />
                Adicionar arquivos
              </label>
              {anexos.length > 0 ? (
                <ul className={s.attachList} style={{ listStyle: 'none', padding: 0, margin: '8px 0 0' }}>
                  {anexos.map((file, index) => (
                    <li key={`${file.name}-${index}`} className={s.attachItem}>
                      <Icon name="file-text" size={14} />
                      <span className={s.attachName}>{file.name}</span>
                      <button type="button" className={s.attachRemove} onClick={() => setAnexos((prev) => prev.filter((_, i) => i !== index))} aria-label={`Remover anexo ${file.name}`}>
                        <Icon name="x" size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            {submitError ? <Alert tone="error">{submitError}</Alert> : null}

            <footer className={m.foot}>
              <Button type="button" variant="outline" onClick={close} disabled={submitting}>
                Cancelar
              </Button>
              <Button type="submit" icon="send" disabled={submitting || !assunto.trim()} aria-busy={submitting}>
                {submitting ? 'Enviando…' : 'Enviar chamado'}
              </Button>
            </footer>
          </form>
        )}
      </div>
    </dialog>
  );
}
