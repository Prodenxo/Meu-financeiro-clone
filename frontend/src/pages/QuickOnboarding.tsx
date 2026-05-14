import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '../lib/toast';
import { strongPasswordRequirementsSummary, validateStrongPassword } from '../lib/passwordPolicy';
import { createUser, type EmpresaFullData } from '../services/usersService';
import { useAuthStore } from '../store/authStore';
import EmpresaModal from '../components/EmpresaModal';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

const formatCnpjMask = (digits?: string | null) => {
  if (!digits) return '';
  const d = digits.replace(/\D/g, '').slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
};

export default function QuickOnboarding() {
  const navigate = useNavigate();
  const { role } = useAuthStore();
  const [loading, setLoading] = useState(false);

  // Segurança: Apenas Superadmin pode acessar esta página
  useEffect(() => {
    if (role && role !== 'superadmin') {
      toast.error('Acesso negado. Apenas administradores globais podem realizar o cadastro rápido.');
      navigate('/settings/users');
    }
  }, [role, navigate]);

  // User state
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showErrors, setShowErrors] = useState(false);

  // Company state — agora gerenciado pelo EmpresaModal
  const [empresaCriada, setEmpresaCriada] = useState<EmpresaFullData | null>(null);
  const [empresaModalOpen, setEmpresaModalOpen] = useState(false);

  const handleEmpresaSaved = (empresa: EmpresaFullData) => {
    setEmpresaCriada(empresa);
    setEmpresaModalOpen(false);
    toast.success('Empresa cadastrada. Agora finalize com o administrador.');
  };

  const handleOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowErrors(true);

    if (!empresaCriada?.id) {
      toast.error('Cadastre a empresa antes de finalizar.');
      return;
    }

    setLoading(true);
    try {
      const pwdCheck = validateStrongPassword(password);
      if (!pwdCheck.ok) {
        toast.error(pwdCheck.message);
        return;
      }

      await createUser({
        email,
        displayName,
        phone,
        password,
        role: 'admin',
        empresaId: empresaCriada.id,
      });

      toast.success('Empresa e Usuário cadastrados com sucesso!');
      navigate('/settings/users');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao realizar cadastro rápido');
    } finally {
      setLoading(false);
    }
  };

  // Se não for superadmin, não renderiza nada enquanto o redirecionamento acontece
  if (role !== 'superadmin') return null;

  return (
    <div className="admin-page-shell max-w-4xl">
      <section className="admin-hero mb-6">
        <h1 className="admin-hero-title">Cadastro Rápido</h1>
        <p className="admin-hero-subtitle">
          Crie uma nova empresa e seu administrador principal em um único passo.
        </p>
      </section>

      <form onSubmit={handleOnboarding} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* User Section */}
          <div className="admin-section-card-create-user h-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Dados do Administrador</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nome Completo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  className={`planner-input ${showErrors && !displayName.trim() ? 'border-rose-500 bg-rose-50/5' : ''}`}
                  placeholder="Ex: João Silva"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  E-mail Profissional <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  className={`planner-input ${showErrors && !email.trim() ? 'border-rose-500 bg-rose-50/5' : ''}`}
                  placeholder="joao@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Telefone <span className="text-rose-500">*</span>
                </label>
                <div className="admin-phone-input">
                  <PhoneInput
                    country={'br'}
                    value={phone}
                    onChange={(val) => setPhone(val)}
                    inputStyle={{
                      width: '100%',
                      paddingTop: '10px',
                      paddingBottom: '10px',
                      paddingLeft: '48px',
                      borderRadius: '0.5rem',
                      border: showErrors && !phone.trim()
                        ? '1px solid #f43f5e'
                        : (window.matchMedia('(prefers-color-scheme: dark)').matches ? '1px solid #334155' : '1px solid #D1D5DB'),
                      fontSize: '1rem',
                      backgroundColor: showErrors && !phone.trim()
                        ? '#fff1f2'
                        : (window.matchMedia('(prefers-color-scheme: dark)').matches ? '#0f172a' : 'white'),
                      color: window.matchMedia('(prefers-color-scheme: dark)').matches ? '#f8fafc' : '#0f172a',
                      height: '42px',
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Senha de Acesso <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  className={`planner-input ${showErrors && !password.trim() ? 'border-rose-500 bg-rose-50/5' : ''}`}
                  placeholder="Defina uma senha forte"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-snug">
                  {strongPasswordRequirementsSummary()}
                </p>
              </div>
            </div>
          </div>

          {/* Company Section */}
          <div className="admin-section-card h-full border-l-[5px] border-l-emerald-500">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Dados da Empresa</h2>
            </div>

            <div className="space-y-4">
              {empresaCriada ? (
                <div className="rounded-xl border border-emerald-200 dark:border-emerald-700/40 bg-emerald-50/60 dark:bg-emerald-900/20 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 text-sm font-semibold">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Empresa cadastrada
                  </div>
                  <p className="text-base font-semibold text-slate-900 dark:text-white">
                    {empresaCriada.empresa || empresaCriada.razao_social || 'Sem nome'}
                  </p>
                  {empresaCriada.cnpj && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      CNPJ: {formatCnpjMask(empresaCriada.cnpj)}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => setEmpresaModalOpen(true)}
                    className="planner-button-secondary-compact text-xs mt-2"
                  >
                    Editar dados da empresa
                  </button>
                </div>
              ) : (
                <div className="rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 p-6 text-center">
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                    Cadastre a empresa com CNPJ, endereço, regime tributário e limites de MEI/PF.
                  </p>
                  <button
                    type="button"
                    onClick={() => setEmpresaModalOpen(true)}
                    className="planner-button bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Cadastrar empresa
                  </button>
                </div>
              )}

              <div className="mt-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400 flex gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Ao finalizar, o usuário será vinculado automaticamente como administrador da empresa cadastrada.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate('/settings/users')}
            className="planner-button-secondary px-8"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || !empresaCriada?.id}
            className="planner-button px-10 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processando...
              </span>
            ) : 'Finalizar Cadastro'}
          </button>
        </div>
      </form>

      <EmpresaModal
        open={empresaModalOpen}
        initial={empresaCriada}
        onClose={() => setEmpresaModalOpen(false)}
        onSuccess={handleEmpresaSaved}
      />
    </div>
  );
}
