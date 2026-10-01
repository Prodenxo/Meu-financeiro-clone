'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { loadEmpresaAction, lookupCnpjAction, saveEmpresaAction } from '@/app/(app)/configuracoes/acessos/actions';
import { Alert, Button, Field, Input, Skeleton, cx } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import m from '@/components/dashboard/modal.module.css';
import s from './acessos.module.css';

const REGIMES = ['Simples Nacional', 'Lucro Presumido', 'Lucro Real', 'MEI'];

const EMPTY = {
  cnpj: '', nome_fantasia: '', empresa: '', razao_social: '', inscricao_estadual: '', regime_tributario: '',
  logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', cep: '', telefone: '', email: '',
  meiEnabled: false, meiSlots: '1', naoMeiUnlimited: true, maxNaoMei: '10',
};

function formatCnpj(value) {
  const d = String(value || '').replace(/\D/g, '').slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

function fromRecord(rec) {
  const maxMei = Number(rec?.max_mei || 0);
  const naoMei = rec?.max_usuarios_nao_mei;
  return {
    ...EMPTY,
    cnpj: formatCnpj(rec?.cnpj || ''),
    nome_fantasia: rec?.nome_fantasia || '',
    empresa: rec?.empresa || '',
    razao_social: rec?.razao_social || '',
    inscricao_estadual: rec?.inscricao_estadual || '',
    regime_tributario: rec?.regime_tributario || '',
    logradouro: rec?.logradouro || '',
    numero: rec?.numero || '',
    complemento: rec?.complemento || '',
    bairro: rec?.bairro || '',
    cidade: rec?.cidade || '',
    estado: rec?.estado || '',
    cep: rec?.cep || '',
    telefone: rec?.telefone || '',
    email: rec?.email || '',
    meiEnabled: maxMei > 0,
    meiSlots: String(maxMei > 0 ? Math.trunc(maxMei) : 1),
    naoMeiUnlimited: naoMei === null || naoMei === undefined || Number(naoMei) === 0,
    maxNaoMei: String(naoMei && Number(naoMei) > 0 ? Number(naoMei) : 10),
  };
}

/**
 * Cadastro/edição de empresa (só superadmin) — mesmos campos do `EmpresaModal` do app atual:
 * identificação com consulta de CNPJ, endereço, contato e limites (vagas MEI / clientes).
 */
export function EmpresaFormDialog({ empresaId = null, onClose }) {
  const ref = useRef(null);
  const isEdit = Boolean(empresaId);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState('');
  const [cnpjBusy, setCnpjBusy] = useState(false);
  const [cnpjMsg, setCnpjMsg] = useState('');
  const [error, setError] = useState('');
  const [pending, start] = useTransition();

  useEffect(() => {
    const el = ref.current;
    if (el && !el.open) el.showModal();
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    let alive = true;
    (async () => {
      const res = await loadEmpresaAction(empresaId);
      if (!alive) return;
      if (res?.ok && res.empresa) setForm(fromRecord(res.empresa));
      else setLoadError(res?.error || 'Não foi possível carregar a empresa.');
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [isEdit, empresaId]);

  const patch = (p) => setForm((f) => ({ ...f, ...p }));
  const close = () => {
    if (!pending) onClose(null);
  };

  const lookupCnpj = async () => {
    const digits = form.cnpj.replace(/\D/g, '');
    if (digits.length !== 14) return;
    setCnpjBusy(true);
    setCnpjMsg('');
    const res = await lookupCnpjAction(digits);
    setCnpjBusy(false);
    if (!res?.ok) {
      setCnpjMsg(res?.error || 'Não foi possível consultar o CNPJ.');
      return;
    }
    const d = res.data || {};
    const tel = d.telefone ? `${d.telefone.ddd || ''}${d.telefone.numero || ''}` : '';
    setForm((prev) => ({
      ...prev,
      empresa: d.razaoSocial || prev.empresa,
      razao_social: d.razaoSocial || prev.razao_social,
      inscricao_estadual: d.inscricaoEstadual || prev.inscricao_estadual,
      logradouro: d.endereco?.logradouro || prev.logradouro,
      numero: d.endereco?.numero || prev.numero,
      complemento: d.endereco?.complemento || prev.complemento,
      bairro: d.endereco?.bairro || prev.bairro,
      cidade: d.endereco?.descricaoCidade || prev.cidade,
      estado: d.endereco?.estado || prev.estado,
      cep: d.endereco?.cep || prev.cep,
      telefone: tel || prev.telefone,
      email: d.email || prev.email,
    }));
    setCnpjMsg('Dados preenchidos a partir do CNPJ. Confira antes de salvar.');
  };

  const submit = (e) => {
    e.preventDefault();
    setError('');
    const digits = form.cnpj.replace(/\D/g, '');
    if (digits && digits.length !== 14) {
      setError('CNPJ deve ter 14 dígitos ou ficar em branco.');
      return;
    }
    const meiSlots = Number.parseInt(form.meiSlots, 10);
    if (form.meiEnabled && (!Number.isFinite(meiSlots) || meiSlots < 1)) {
      setError('Informe ao menos 1 vaga MEI (módulo não pode ficar zerado).');
      return;
    }
    const maxNaoMei = Number.parseInt(form.maxNaoMei, 10);
    if (!form.naoMeiUnlimited && (!Number.isFinite(maxNaoMei) || maxNaoMei < 1)) {
      setError('Informe a quantidade máxima de clientes (mínimo 1).');
      return;
    }
    if (!isEdit && !form.nome_fantasia.trim() && !form.empresa.trim()) {
      setError('Informe o nome da empresa.');
      return;
    }

    start(async () => {
      const payload = {
        cnpj: digits,
        nome_fantasia: form.nome_fantasia,
        empresa: form.empresa,
        razao_social: form.razao_social || form.empresa,
        inscricao_estadual: form.inscricao_estadual,
        regime_tributario: form.regime_tributario,
        logradouro: form.logradouro,
        numero: form.numero,
        complemento: form.complemento,
        bairro: form.bairro,
        cidade: form.cidade,
        estado: form.estado.toUpperCase(),
        cep: form.cep,
        telefone: form.telefone,
        email: form.email,
        max_mei: form.meiEnabled ? meiSlots : 0,
        max_usuarios_nao_mei: form.naoMeiUnlimited ? null : maxNaoMei,
      };
      const res = await saveEmpresaAction(empresaId, payload);
      if (!res?.ok) {
        setError(res?.error || 'Não foi possível salvar a empresa.');
        return;
      }
      onClose({ ok: true, message: isEdit ? 'Empresa atualizada.' : 'Empresa cadastrada.' });
    });
  };

  return (
    <dialog
      ref={ref}
      className={m.dialog}
      aria-labelledby="emp-title"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClick={(e) => {
        if (e.target === ref.current) close();
      }}
    >
      <div className={cx(m.body, s.wideDialog)}>
        <header className={m.head}>
          <h2 className={m.title} id="emp-title">{isEdit ? 'Editar empresa' : 'Cadastrar empresa'}</h2>
          <button type="button" className={m.close} onClick={close} aria-label="Fechar" disabled={pending}>
            <Icon name="x" size={18} />
          </button>
        </header>

        {loading ? (
          <div className={s.form} aria-busy="true">
            <Skeleton height={42} />
            <Skeleton height={42} />
            <Skeleton height={42} />
          </div>
        ) : loadError ? (
          <Alert tone="error">{loadError}</Alert>
        ) : (
          <form className={s.form} onSubmit={submit} noValidate>
            <p className={s.sectionLabel}>Identificação</p>
            <div className={s.formRow}>
              <Field label="CNPJ (opcional)" htmlFor="emp-cnpj">
                <Input id="emp-cnpj" value={form.cnpj} onChange={(e) => patch({ cnpj: formatCnpj(e.target.value) })} onBlur={lookupCnpj} placeholder="00.000.000/0001-00" inputMode="numeric" maxLength={18} aria-describedby="emp-cnpj-hint" />
              </Field>
              <Field label="Nome da empresa" htmlFor="emp-nome">
                <Input id="emp-nome" value={form.nome_fantasia} onChange={(e) => patch({ nome_fantasia: e.target.value })} placeholder="Como chamamos essa empresa no sistema" />
              </Field>
            </div>
            {cnpjBusy || cnpjMsg ? (
              <p id="emp-cnpj-hint" className={s.hint} role="status">{cnpjBusy ? 'Consultando CNPJ…' : cnpjMsg}</p>
            ) : null}
            <div className={s.formRow}>
              <Field label="Razão social" htmlFor="emp-razao">
                <Input id="emp-razao" value={form.empresa} onChange={(e) => patch({ empresa: e.target.value, razao_social: e.target.value })} placeholder="Razão social" />
              </Field>
              <Field label="Inscrição estadual" htmlFor="emp-ie">
                <Input id="emp-ie" value={form.inscricao_estadual} onChange={(e) => patch({ inscricao_estadual: e.target.value })} placeholder="Inscrição estadual" />
              </Field>
            </div>
            <Field label="Regime tributário">
              <div className={s.roleChips} role="radiogroup" aria-label="Regime tributário">
                {REGIMES.map((r) => (
                  <button key={r} type="button" role="radio" aria-checked={form.regime_tributario === r} className={cx(s.roleChip, form.regime_tributario === r && s.roleChipActive)} onClick={() => patch({ regime_tributario: form.regime_tributario === r ? '' : r })}>
                    {r}
                  </button>
                ))}
              </div>
            </Field>

            <p className={s.sectionLabel}>Endereço</p>
            <div className={s.formRow3}>
              <Field label="Logradouro" htmlFor="emp-log">
                <Input id="emp-log" value={form.logradouro} onChange={(e) => patch({ logradouro: e.target.value })} placeholder="Rua, Avenida..." />
              </Field>
              <Field label="Número" htmlFor="emp-num">
                <Input id="emp-num" value={form.numero} onChange={(e) => patch({ numero: e.target.value })} placeholder="Número" />
              </Field>
              <Field label="Complemento" htmlFor="emp-comp">
                <Input id="emp-comp" value={form.complemento} onChange={(e) => patch({ complemento: e.target.value })} placeholder="Apto, Sala..." />
              </Field>
            </div>
            <div className={s.formRow3}>
              <Field label="Bairro" htmlFor="emp-bairro">
                <Input id="emp-bairro" value={form.bairro} onChange={(e) => patch({ bairro: e.target.value })} placeholder="Bairro" />
              </Field>
              <Field label="Cidade" htmlFor="emp-cidade">
                <Input id="emp-cidade" value={form.cidade} onChange={(e) => patch({ cidade: e.target.value })} placeholder="Cidade" />
              </Field>
              <Field label="UF / CEP" htmlFor="emp-uf">
                <div className={s.formRow} style={{ gridTemplateColumns: '64px 1fr' }}>
                  <Input id="emp-uf" value={form.estado} onChange={(e) => patch({ estado: e.target.value.toUpperCase().slice(0, 2) })} placeholder="UF" maxLength={2} aria-label="UF" />
                  <Input value={form.cep} onChange={(e) => patch({ cep: e.target.value.replace(/\D/g, '').slice(0, 8) })} placeholder="CEP" inputMode="numeric" aria-label="CEP" />
                </div>
              </Field>
            </div>

            <p className={s.sectionLabel}>Contato</p>
            <div className={s.formRow}>
              <Field label="Telefone" htmlFor="emp-tel">
                <Input id="emp-tel" type="tel" value={form.telefone} onChange={(e) => patch({ telefone: e.target.value })} placeholder="(11) 99999-9999" />
              </Field>
              <Field label="E-mail" htmlFor="emp-email">
                <Input id="emp-email" type="email" value={form.email} onChange={(e) => patch({ email: e.target.value })} placeholder="contato@empresa.com" />
              </Field>
            </div>

            <p className={s.sectionLabel}>Limites de acesso</p>
            <label className={s.switchRow}>
              <span className={s.switchText}>
                <span>Módulo MEI</span>
                <span className={s.switchHint}>Ligado, a empresa pode ter usuários com MEI habilitado (até o número de vagas).</span>
              </span>
              <input type="checkbox" checked={form.meiEnabled} onChange={(e) => patch({ meiEnabled: e.target.checked })} />
            </label>
            {form.meiEnabled ? (
              <Field label="Quantidade de vagas MEI" htmlFor="emp-mei">
                <Input id="emp-mei" type="number" min={1} step={1} value={form.meiSlots} onChange={(e) => patch({ meiSlots: e.target.value })} placeholder="Ex.: 1, 3, 10" />
              </Field>
            ) : null}
            <label className={s.switchRow}>
              <span className={s.switchText}>
                <span>Acesso ilimitado ao app</span>
                <span className={s.switchHint}>Desligado, define um máximo de clientes (usuários PF / Outros).</span>
              </span>
              <input type="checkbox" checked={form.naoMeiUnlimited} onChange={(e) => patch({ naoMeiUnlimited: e.target.checked })} />
            </label>
            {!form.naoMeiUnlimited ? (
              <Field label="Quantidade máxima de clientes" htmlFor="emp-max">
                <Input id="emp-max" type="number" min={1} step={1} value={form.maxNaoMei} onChange={(e) => patch({ maxNaoMei: e.target.value })} placeholder="Ex.: 10" />
              </Field>
            ) : null}

            {error ? <Alert tone="error">{error}</Alert> : null}

            <footer className={m.foot}>
              <Button variant="outline" onClick={close} disabled={pending}>Cancelar</Button>
              <Button type="submit" disabled={pending} aria-busy={pending}>
                {pending ? 'Salvando…' : isEdit ? 'Salvar' : 'Cadastrar empresa'}
              </Button>
            </footer>
          </form>
        )}
      </div>
    </dialog>
  );
}
