import { useEffect, useRef, useState } from 'react';
import { createEmpresa, updateEmpresa, type EmpresaFullData } from '../services/usersService';

export type EmpresaData = EmpresaFullData;

interface EmpresaModalProps {
  open: boolean;
  initial?: EmpresaData | null;
  onClose: () => void;
  onSuccess: (empresa: EmpresaData) => void;
}

const REGIMES = ['Simples Nacional', 'Lucro Presumido', 'Lucro Real', 'MEI'];

const formatCnpj = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 14);
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
      setForm(initial || {});
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

  const handleCnpjBlur = async () => {
    const digits = onlyDigits(form.cnpj || '');
    if (digits.length !== 14) return;

    setCnpjLoading(true);
    setCnpjError('');
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`);
      if (!res.ok) {
        setCnpjError(res.status === 404 ? 'CNPJ não encontrado.' : 'Erro ao consultar CNPJ.');
        return;
      }
      const data = await res.json();
      setForm((prev) => ({
        ...prev,
        razao_social: data.razao_social || prev.razao_social || '',
        nome_fantasia: data.nome_fantasia || prev.nome_fantasia || '',
        logradouro: data.logradouro || prev.logradouro || '',
        numero: data.numero || prev.numero || '',
        complemento: data.complemento || prev.complemento || '',
        bairro: data.bairro || prev.bairro || '',
        cidade: data.municipio || prev.cidade || '',
        estado: data.uf || prev.estado || '',
        cep: (data.cep || '').replace(/\D/g, '') || prev.cep || '',
        telefone: data.ddd_telefone_1
          ? data.ddd_telefone_1.replace(/\D/g, '')
          : prev.telefone || '',
        email: data.email || prev.email || '',
      }));
    } catch {
      setCnpjError('Erro de conexão ao consultar CNPJ.');
    } finally {
      setCnpjLoading(false);
    }
  };

  const validate = () => {
    const newErrors: Partial<Record<keyof EmpresaData, string>> = {};
    if (!form.empresa?.trim()) newErrors.empresa = 'Razão Social é obrigatória';
    if (form.cnpj && onlyDigits(form.cnpj).length > 0 && onlyDigits(form.cnpj).length !== 14) {
      newErrors.cnpj = 'CNPJ deve ter 14 dígitos';
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
          {/* Razão Social */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Razão Social <span className="text-red-500">*</span>
            </label>
            <input
              ref={firstInputRef}
              type="text"
              value={form.empresa || ''}
              onChange={(e) => set('empresa', e.target.value)}
              className={`planner-input-compact w-full ${errors.empresa ? 'border-red-500' : ''}`}
              placeholder="Razão Social"
            />
            {errors.empresa && <p className="text-red-500 text-xs mt-1">{errors.empresa}</p>}
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

          {/* CNPJ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              CNPJ
              {cnpjLoading && <span className="ml-2 text-xs text-blue-400">Consultando...</span>}
            </label>
            <input
              type="text"
              value={form.cnpj || ''}
              onChange={(e) => set('cnpj', formatCnpj(e.target.value))}
              onBlur={handleCnpjBlur}
              className={`planner-input-compact w-full ${errors.cnpj ? 'border-red-500' : ''}`}
              placeholder="00.000.000/0001-00"
              maxLength={18}
            />
            {errors.cnpj && <p className="text-red-500 text-xs mt-1">{errors.cnpj}</p>}
            {cnpjError && <p className="text-amber-500 text-xs mt-1">{cnpjError}</p>}
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
