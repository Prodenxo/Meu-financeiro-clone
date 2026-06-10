import { useEffect, useRef, useState } from 'react';
import {
  createEmpresa,
  lookupEmpresaCnpj,
  updateEmpresa,
  type EmpresaFullData,
} from '../services/usersService';

export type EmpresaData = EmpresaFullData;

interface EmpresaModalProps {
  open: boolean;
  initial?: EmpresaData | null;
  onClose: () => void;
  onSuccess: (empresa: EmpresaData) => void;
}

const REGIMES = ['Simples Nacional', 'Lucro Presumido', 'Lucro Real', 'MEI'];

/** Remove tudo que não for dígito e limita a 14 caracteres. */
const normalizeCnpjInput = (value: string) => value.replace(/\D/g, '').slice(0, 14);

const formatCnpj = (value: string) => {
  const digits = normalizeCnpjInput(value);
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
};

const onlyDigits = (value: string) => value.replace(/\D/g, '');

export default function EmpresaModal({ open, initial, onClose, onSuccess }: EmpresaModalProps) {
  const isEdit = Boolean(initial?.id);

  const [form, setForm] = useState<EmpresaData>({});
  const [errors, setErrors] = useState<Partial<Record<keyof EmpresaData, string>>>({});
  const [cnpjLoading, setCnpjLoading] = useState(false);
  const [cnpjError, setCnpjError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      const base = initial || {};
      setForm({
        ...base,
        max_mei:
          base.max_mei === null || base.max_mei === undefined ? 0 : base.max_mei,
      });
      setErrors({});
      setCnpjError('');
      setSubmitError('');
      setTimeout(() => firstInputRef.current?.focus(), 50);
    }
  }, [open, initial]);

  const set = (field: keyof EmpresaData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const setNum = (field: keyof EmpresaData, value: number | null) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  /** Estado separado para a chave MEI — não depende do valor numérico do input. */
  const [meiEnabled, setMeiEnabled] = useState(false);
  const [meiSlotsText, setMeiSlotsText] = useState('1');

  // Sincroniza meiEnabled/meiSlotsText quando o modal abre com dados iniciais
  useEffect(() => {
    if (open) {
      const v = initial?.max_mei ?? 0;
      const isOn = v > 0;
      setMeiEnabled(isOn);
      setMeiSlotsText(isOn ? String(Math.trunc(v)) : '1');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial]);

  const meiSlots = (() => {
    if (!meiEnabled) return 0;
    const n = parseInt(meiSlotsText, 10);
    return Number.isFinite(n) && n >= 1 ? n : 1;
  })();

  const toggleMeiModule = () => {
    if (meiEnabled) {
      setMeiEnabled(false);
      setNum('max_mei', 0);
    } else {
      setMeiEnabled(true);
      const current = parseInt(meiSlotsText, 10);
      const val = Number.isFinite(current) && current >= 1 ? current : 1;
      setMeiSlotsText(String(val));
      setNum('max_mei', val);
    }
  };

  // Clientes PF/Outros: null = ilimitado (padrão), número > 0 = limite explícito.
  // Em edições antigas, 0 ou undefined também caem em "ilimitado" (alinhado ao novo backend).
  const naoMeiUnlimited = form.max_usuarios_nao_mei === null
    || form.max_usuarios_nao_mei === undefined
    || form.max_usuarios_nao_mei === 0;
  const toggleNaoMeiUnlimited = () => {
    if (naoMeiUnlimited) {
      setNum('max_usuarios_nao_mei', 1);
    } else {
      setNum('max_usuarios_nao_mei', null);
    }
  };

  const handleCnpjBlur = async (currentValue?: string) => {
    const digits = onlyDigits(currentValue ?? form.cnpj ?? '');
    if (digits.length !== 14) return;

    setCnpjLoading(true);
    setCnpjError('');
    try {
      const data = await lookupEmpresaCnpj(digits);
      const telefoneStr = data.telefone
        ? `${data.telefone.ddd || ''}${data.telefone.numero || ''}`
        : '';
      setForm((prev) => ({
        ...prev,
        empresa: data.razaoSocial || prev.empresa || '',
        razao_social: data.razaoSocial || prev.razao_social || '',
        nome_fantasia: data.nomeFantasia || prev.nome_fantasia || '',
        inscricao_estadual: data.inscricaoEstadual || prev.inscricao_estadual || '',
        logradouro: data.endereco?.logradouro || prev.logradouro || '',
        numero: data.endereco?.numero || prev.numero || '',
        complemento: data.endereco?.complemento || prev.complemento || '',
        bairro: data.endereco?.bairro || prev.bairro || '',
        cidade: data.endereco?.descricaoCidade || prev.cidade || '',
        estado: data.endereco?.estado || prev.estado || '',
        cep: data.endereco?.cep || prev.cep || '',
        telefone: telefoneStr || prev.telefone || '',
        email: data.email || prev.email || '',
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao consultar CNPJ.';
      setCnpjError(msg);
    } finally {
      setCnpjLoading(false);
    }
  };

  const validate = () => {
    const newErrors: Partial<Record<keyof EmpresaData, string>> = {};
    const cnpjDigits = onlyDigits(form.cnpj || '');
    // CNPJ agora é opcional: só valida formato se houver valor
    if (cnpjDigits && cnpjDigits.length !== 14) {
      newErrors.cnpj = 'CNPJ deve ter 14 dígitos ou fique em branco';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError('');
    try {
      const payload: EmpresaData = {
        ...form,
        cnpj: onlyDigits(form.cnpj || '') || undefined,
        max_mei: meiSlots,
      };

      let result: EmpresaData;
      if (isEdit && initial?.id) {
        const res = await updateEmpresa(initial.id, payload);
        result = res.empresa;
      } else {
        const res = await createEmpresa(payload);
        result = res.empresa;
      }
      onSuccess(result);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Erro ao salvar empresa');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="planner-card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg md:text-xl font-semibold dark:text-white">
            {isEdit ? 'Editar Empresa' : 'Cadastrar Empresa'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-xl leading-none"
            aria-label="Fechar modal"
          >
            ✕
          </button>
        </div>

        {submitError && (
          <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded text-sm">
            {submitError}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {/* CNPJ — opcional, mas autopreenche os demais quando informado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              CNPJ <span className="text-xs text-gray-500 ml-1">(opcional)</span>
              {cnpjLoading && <span className="ml-2 text-xs text-blue-400">Consultando...</span>}
            </label>
            <input
              ref={firstInputRef}
              type="text"
              value={form.cnpj || ''}
              onChange={(e) => {
                const formatted = formatCnpj(e.target.value);
                set('cnpj', formatted);
                if (onlyDigits(formatted).length === 14) {
                  void handleCnpjBlur(formatted);
                }
              }}
              onPaste={(e) => {
                e.preventDefault();
                const pasted = (e.clipboardData?.getData('text') || '').trim();
                const digits = normalizeCnpjInput(pasted);
                const formatted = formatCnpj(digits);
                set('cnpj', formatted);
                if (digits.length === 14) {
                  void handleCnpjBlur(formatted);
                }
              }}
              onBlur={() => void handleCnpjBlur()}
              className={`planner-input-compact w-full ${errors.cnpj ? 'border-red-500' : ''}`}
              placeholder="00.000.000/0001-00"
              maxLength={18}
            />
            {errors.cnpj && <p className="text-red-500 text-xs mt-1">{errors.cnpj}</p>}
            {cnpjError && <p className="text-amber-500 text-xs mt-1">{cnpjError}</p>}
          </div>

          {/* Nome Fantasia */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nome Fantasia
            </label>
            <input
              type="text"
              value={form.nome_fantasia || ''}
              onChange={(e) => set('nome_fantasia', e.target.value)}
              className="planner-input-compact w-full"
              placeholder="Nome Fantasia"
            />
          </div>

          {/* Razão Social — autopreenchida pelo CNPJ */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Razão Social
            </label>
            <input
              type="text"
              value={form.empresa || ''}
              onChange={(e) => set('empresa', e.target.value)}
              className="planner-input-compact w-full"
              placeholder="Preenchida automaticamente pelo CNPJ"
            />
          </div>

          {/* Inscrição Estadual */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Inscrição Estadual
            </label>
            <input
              type="text"
              value={form.inscricao_estadual || ''}
              onChange={(e) => set('inscricao_estadual', e.target.value)}
              className="planner-input-compact w-full"
              placeholder="Inscrição Estadual"
            />
          </div>

          {/* Regime Tributário */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Regime Tributário
            </label>
            <select
              value={form.regime_tributario || ''}
              onChange={(e) => set('regime_tributario', e.target.value)}
              className="planner-input-compact w-full"
            >
              <option value="">Selecione...</option>
              {REGIMES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Endereço */}
        <div>
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">Endereço</p>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Logradouro
              </label>
              <input
                type="text"
                value={form.logradouro || ''}
                onChange={(e) => set('logradouro', e.target.value)}
                className="planner-input-compact w-full"
                placeholder="Rua, Avenida..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Número
              </label>
              <input
                type="text"
                value={form.numero || ''}
                onChange={(e) => set('numero', e.target.value)}
                className="planner-input-compact w-full"
                placeholder="Número"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Complemento
              </label>
              <input
                type="text"
                value={form.complemento || ''}
                onChange={(e) => set('complemento', e.target.value)}
                className="planner-input-compact w-full"
                placeholder="Apto, Sala..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Bairro
              </label>
              <input
                type="text"
                value={form.bairro || ''}
                onChange={(e) => set('bairro', e.target.value)}
                className="planner-input-compact w-full"
                placeholder="Bairro"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cidade
              </label>
              <input
                type="text"
                value={form.cidade || ''}
                onChange={(e) => set('cidade', e.target.value)}
                className="planner-input-compact w-full"
                placeholder="Cidade"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Estado
              </label>
              <input
                type="text"
                value={form.estado || ''}
                onChange={(e) => set('estado', e.target.value.toUpperCase().slice(0, 2))}
                className="planner-input-compact w-full"
                placeholder="UF"
                maxLength={2}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                CEP
              </label>
              <input
                type="text"
                value={form.cep || ''}
                onChange={(e) => set('cep', e.target.value.replace(/\D/g, '').slice(0, 8))}
                className="planner-input-compact w-full"
                placeholder="00000000"
                maxLength={8}
              />
            </div>
          </div>
        </div>

        {/* Contato */}
        <div>
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">Contato</p>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Telefone
              </label>
              <input
                type="text"
                value={form.telefone || ''}
                onChange={(e) => set('telefone', e.target.value)}
                className="planner-input-compact w-full"
                placeholder="(11) 99999-9999"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                E-mail
              </label>
              <input
                type="email"
                value={form.email || ''}
                onChange={(e) => set('email', e.target.value)}
                className="planner-input-compact w-full"
                placeholder="contato@empresa.com"
              />
            </div>
          </div>
        </div>

        {/* Limites de usuários */}
        <div>
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">Limites de usuários</p>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Módulo MEI</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {meiEnabled
                      ? 'Defina quantas vagas MEI (CNPJ) esta empresa pode ter.'
                      : 'Desativado — esta empresa não pode ter clientes MEI.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={toggleMeiModule}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    meiEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                  aria-pressed={meiEnabled}
                  aria-label={meiEnabled ? 'Desativar módulo MEI' : 'Ativar módulo MEI'}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      meiEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              {meiEnabled ? (
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Quantidade de vagas MEI
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={meiSlotsText}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const digits = raw.replace(/\D/g, '');
                      setMeiSlotsText(digits);
                      const n = digits === '' ? 1 : Math.min(9999, Math.max(1, Number(digits) || 1));
                      setNum('max_mei', n);
                    }}
                    onBlur={() => {
                      if (meiSlotsText === '' || parseInt(meiSlotsText, 10) < 1) {
                        setMeiSlotsText('1');
                        setNum('max_mei', 1);
                      }
                    }}
                    className="planner-input-compact w-full"
                    placeholder="Ex.: 1, 3, 10"
                  />
                </div>
              ) : null}
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Clientes PF (Outros)</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {naoMeiUnlimited ? 'Sem teto de cadastros.' : 'Define um limite máximo de usuários.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={toggleNaoMeiUnlimited}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    naoMeiUnlimited ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                  aria-pressed={naoMeiUnlimited}
                  aria-label={naoMeiUnlimited ? 'Definir limite' : 'Tornar ilimitado'}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      naoMeiUnlimited ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  naoMeiUnlimited
                    ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}>
                  {naoMeiUnlimited ? 'Ilimitado' : 'Com limite'}
                </span>
              </div>
              {!naoMeiUnlimited && (
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Quantidade máxima de clientes
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={form.max_usuarios_nao_mei === null || form.max_usuarios_nao_mei === undefined ? '' : form.max_usuarios_nao_mei}
                    onChange={(e) => {
                      const raw = e.target.value;
                      setNum('max_usuarios_nao_mei', raw === '' ? 1 : Math.max(1, Number(raw) || 1));
                    }}
                    className="planner-input-compact w-full"
                    placeholder="Ex.: 10"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="planner-button disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Cadastrar empresa'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="planner-button-secondary"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
