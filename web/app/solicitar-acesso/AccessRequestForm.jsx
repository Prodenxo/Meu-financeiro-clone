'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { submitAccessRequestAction } from '@/lib/auth/actions';
import { Alert, Button, Field, Input } from '@/components/ui';
import { Icon } from '@/components/ui/Icon';
import { PasswordInput, PhoneInput, RequiredMark, StrongPasswordRules } from '@/components/auth/fields';
import { maskCnpj, maskCpf } from '@/lib/auth/validation';
import s from '@/components/auth/auth.module.css';

const EMPTY = {
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  cnpj: '',
  cpf: '',
  razaoSocial: '',
  nomeFantasia: '',
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
  empresaTelefone: '',
  empresaEmail: '',
};

function Label({ children, required }) {
  return (
    <>
      {children}
      {required ? <RequiredMark /> : null}
    </>
  );
}

/**
 * Cadastro público = solicitação de acesso (mesmos campos e regras de
 * `frontend/screens/auth/AccessRequestForm.tsx`). PJ busca o CNPJ na BrasilAPI.
 */
export function AccessRequestForm() {
  const [state, formAction, pending] = useActionState(submitAccessRequestAction, null);
  const [pessoaTipo, setPessoaTipo] = useState('pj');
  const [f, setF] = useState(EMPTY);
  const [cnpjStatus, setCnpjStatus] = useState({ loading: false, message: '' });

  const set = (key, transform) => (e) => {
    const value = transform ? transform(e.target.value) : e.target.value;
    setF((prev) => ({ ...prev, [key]: value }));
  };

  const lookupCnpj = async () => {
    const digits = f.cnpj.replace(/\D/g, '');
    if (digits.length !== 14) return;
    setCnpjStatus({ loading: true, message: '' });
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`);
      if (!res.ok) {
        setCnpjStatus({ loading: false, message: 'Não encontramos esse CNPJ — você pode preencher os dados manualmente.' });
        return;
      }
      const d = await res.json();
      const rua = [d.descricao_tipo_de_logradouro, d.logradouro].filter(Boolean).join(' ').trim();
      setF((prev) => ({
        ...prev,
        razaoSocial: d.razao_social ? String(d.razao_social) : prev.razaoSocial,
        cep: d.cep ? String(d.cep).replace(/\D/g, '') : prev.cep,
        logradouro: rua || prev.logradouro,
        numero: d.numero ? String(d.numero) : prev.numero,
        complemento: d.complemento ? String(d.complemento) : prev.complemento,
        bairro: d.bairro ? String(d.bairro) : prev.bairro,
        cidade: d.municipio ? String(d.municipio) : prev.cidade,
        estado: d.uf ? String(d.uf) : prev.estado,
        empresaTelefone: d.ddd_telefone_1 ? String(d.ddd_telefone_1) : prev.empresaTelefone,
        empresaEmail: d.email ? String(d.email) : prev.empresaEmail,
      }));
      setCnpjStatus({ loading: false, message: 'Dados da empresa preenchidos automaticamente. Confira e ajuste se necessário.' });
    } catch {
      setCnpjStatus({ loading: false, message: 'Não foi possível consultar o CNPJ agora — preencha os dados manualmente.' });
    }
  };

  if (state?.ok) {
    return (
      <div className={s.success} role="status">
        <span className={s.successIcon}>
          <Icon name="check" size={34} strokeWidth={2.4} />
        </span>
        <h2 className={s.successTitle}>Solicitação enviada!</h2>
        <p className={s.successText}>
          Recebemos seus dados. A CF Contabilidade vai analisar a solicitação e liberar seu acesso. Você poderá entrar
          assim que a aprovação for concluída.
        </p>
        <Link href="/login" className={s.link}>
          Voltar ao login
        </Link>
      </div>
    );
  }

  const pf = pessoaTipo === 'pf';

  return (
    <form action={formAction} className={s.form} noValidate>
      <input type="hidden" name="pessoaTipo" value={pessoaTipo} />
      <div className={s.grid}>
        <p className={s.section}>Seus dados</p>

        <Field label={<Label required>Nome completo</Label>} htmlFor="ar-name">
          <Input id="ar-name" name="fullName" autoComplete="name" placeholder="Seu nome completo" value={f.fullName} onChange={set('fullName')} />
        </Field>
        <Field label={<Label required>E-mail</Label>} htmlFor="ar-email">
          <Input id="ar-email" name="email" type="email" autoComplete="email" placeholder="seu@email.com" value={f.email} onChange={set('email')} />
        </Field>
        <div className={s.full}>
          <Field label={<Label required>Telefone</Label>} htmlFor="ar-phone">
            <PhoneInput id="ar-phone" name="phone" />
          </Field>
        </div>
        <div>
          <Field label={<Label required>Senha</Label>} htmlFor="ar-pwd">
            <PasswordInput
              id="ar-pwd"
              name="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={f.password}
              onChange={set('password')}
              aria-describedby="ar-pwd-rules"
            />
          </Field>
          <StrongPasswordRules password={f.password} id="ar-pwd-rules" />
        </div>
        <Field
          label={<Label required>Confirmar senha</Label>}
          htmlFor="ar-pwd2"
          error={f.confirmPassword && f.confirmPassword !== f.password ? 'As senhas não conferem.' : undefined}
        >
          <PasswordInput
            id="ar-pwd2"
            name="confirmPassword"
            autoComplete="new-password"
            placeholder="••••••••"
            value={f.confirmPassword}
            onChange={set('confirmPassword')}
          />
        </Field>

        <p className={s.section}>{pf ? 'Dados do cadastro' : 'Dados da empresa'}</p>

        <div className={s.full}>
          <span className="sr-only" id="ar-tipo">
            Tipo de cadastro
          </span>
          <div className={s.choice} role="radiogroup" aria-labelledby="ar-tipo">
            {[
              { key: 'pj', label: 'Pessoa jurídica (CNPJ)' },
              { key: 'pf', label: 'Pessoa física (CPF)' },
            ].map((opt) => (
              <button
                key={opt.key}
                type="button"
                role="radio"
                aria-checked={pessoaTipo === opt.key}
                className={`${s.choiceBtn} ${pessoaTipo === opt.key ? s.choiceBtnOn : ''}`}
                onClick={() => {
                  setPessoaTipo(opt.key);
                  setCnpjStatus({ loading: false, message: '' });
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {pf ? <p className={s.hint}>Após a aprovação você fica como administrador do seu espaço.</p> : null}
        </div>

        <div className={s.full}>
          <Field label={pf ? 'Nome no sistema' : 'Nome fantasia'} htmlFor="ar-fantasia">
            <Input
              id="ar-fantasia"
              name="nomeFantasia"
              placeholder={pf ? 'Como você quer aparecer no app' : 'Nome comercial da empresa'}
              value={f.nomeFantasia}
              onChange={set('nomeFantasia')}
            />
          </Field>
        </div>

        {pf ? (
          <Field label={<Label required>CPF</Label>} htmlFor="ar-cpf">
            <Input id="ar-cpf" name="cpf" inputMode="numeric" placeholder="000.000.000-00" value={f.cpf} onChange={set('cpf', maskCpf)} />
          </Field>
        ) : (
          <div>
            <Field label={<Label required>CNPJ</Label>} htmlFor="ar-cnpj">
              <Input
                id="ar-cnpj"
                name="cnpj"
                inputMode="numeric"
                placeholder="00.000.000/0000-00"
                value={f.cnpj}
                onChange={set('cnpj', maskCnpj)}
                onBlur={lookupCnpj}
                aria-describedby="ar-cnpj-hint"
              />
            </Field>
            <p className={s.hint} id="ar-cnpj-hint" aria-live="polite">
              {cnpjStatus.loading ? 'Buscando dados do CNPJ…' : cnpjStatus.message || 'Ao sair do campo, buscamos os dados da empresa.'}
            </p>
          </div>
        )}
        <Field label={pf ? 'Nome completo' : <Label required>Razão social</Label>} htmlFor="ar-razao">
          <Input
            id="ar-razao"
            name="razaoSocial"
            placeholder={pf ? 'Opcional — usa o nome do cadastro se ficar em branco' : 'Razão social da empresa'}
            value={f.razaoSocial}
            onChange={set('razaoSocial')}
          />
        </Field>

        <Field label="CEP" htmlFor="ar-cep">
          <Input
            id="ar-cep"
            name="cep"
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder="Somente números"
            value={f.cep}
            onChange={set('cep', (v) => v.replace(/\D/g, '').slice(0, 8))}
          />
        </Field>
        <Field label="Logradouro" htmlFor="ar-rua">
          <Input id="ar-rua" name="logradouro" autoComplete="address-line1" placeholder="Rua, avenida…" value={f.logradouro} onChange={set('logradouro')} />
        </Field>
        <Field label="Número" htmlFor="ar-num">
          <Input id="ar-num" name="numero" placeholder="Nº" value={f.numero} onChange={set('numero')} />
        </Field>
        <Field label="Complemento" htmlFor="ar-compl">
          <Input id="ar-compl" name="complemento" placeholder="Sala, andar…" value={f.complemento} onChange={set('complemento')} />
        </Field>
        <div className={`${s.full} ${s.addrRow}`}>
          <Field label="Bairro" htmlFor="ar-bairro">
            <Input id="ar-bairro" name="bairro" placeholder="Bairro" value={f.bairro} onChange={set('bairro')} />
          </Field>
          <Field label="Cidade" htmlFor="ar-cidade">
            <Input id="ar-cidade" name="cidade" autoComplete="address-level2" placeholder="Cidade" value={f.cidade} onChange={set('cidade')} />
          </Field>
          <Field label="UF" htmlFor="ar-uf">
            <Input
              id="ar-uf"
              name="estado"
              maxLength={2}
              placeholder="UF"
              value={f.estado}
              onChange={set('estado', (v) => v.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase())}
            />
          </Field>
        </div>
        <Field label={pf ? 'Telefone' : 'Telefone da empresa'} htmlFor="ar-etel">
          <Input
            id="ar-etel"
            name="empresaTelefone"
            type="tel"
            placeholder={pf ? 'Seu telefone' : 'Telefone comercial'}
            value={f.empresaTelefone}
            onChange={set('empresaTelefone')}
          />
        </Field>
        <Field label={pf ? 'E-mail de contato' : 'E-mail da empresa'} htmlFor="ar-email2">
          <Input
            id="ar-email2"
            name="empresaEmail"
            type="email"
            placeholder={pf ? 'seu@email.com' : 'contato@empresa.com'}
            value={f.empresaEmail}
            onChange={set('empresaEmail')}
          />
        </Field>
      </div>

      {state?.error ? <Alert tone="error">{state.error}</Alert> : null}

      <Button type="submit" block disabled={pending} aria-busy={pending}>
        {pending ? 'Enviando…' : 'Enviar solicitação'}
      </Button>
      <p className={s.bottomText}>
        Já tem acesso?{' '}
        <Link href="/login" className={s.link}>
          Fazer login
        </Link>
      </p>
    </form>
  );
}
