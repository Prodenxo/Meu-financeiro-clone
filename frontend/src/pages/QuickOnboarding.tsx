import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '../lib/toast';
import { createEmpresaLimits, createUser } from '../services/usersService';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

export default function QuickOnboarding() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // User state
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  
  // Company state
  const [companyName, setCompanyName] = useState('');
  const [maxMei, setMaxMei] = useState('5');
  const [maxNonMei, setMaxNonMei] = useState('1');

  const handleOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // 1. Create Company
      const companyResp = await createEmpresaLimits({
        empresa: companyName,
        max_mei: parseInt(maxMei),
        max_usuarios_nao_mei: parseInt(maxNonMei)
      });
      
      const empresaId = companyResp.empresa.id;
      
      // 2. Create User linked to Company
      await createUser({
        email,
        displayName,
        phone,
        password: password || undefined,
        role: 'admin', // Default to admin for the new company
        empresaId
      });
      
      toast.success('Empresa e Usuário cadastrados com sucesso!');
      navigate('/settings/users');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao realizar cadastro rápido');
    } finally {
      setLoading(false);
    }
  };

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
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  className="planner-input"
                  placeholder="Ex: João Silva"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">E-mail Profissional</label>
                <input
                  type="email"
                  required
                  className="planner-input"
                  placeholder="joao@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Telefone</label>
                <div className="admin-phone-input">
                  <PhoneInput
                    country={'br'}
                    value={phone}
                    onChange={(val) => setPhone(val)}
                    inputClass="planner-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Senha (opcional)</label>
                <input
                  type="password"
                  className="planner-input"
                  placeholder="Deixe em branco para gerar"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
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
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome da Empresa / Escritório</label>
                <input
                  type="text"
                  required
                  className="planner-input"
                  placeholder="Ex: Contabilidade Central"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Limite MEI</label>
                  <input
                    type="number"
                    className="planner-input"
                    value={maxMei}
                    onChange={(e) => setMaxMei(e.target.value)}
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Qtd. de clientes MEI permitidos</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Limite Usuários</label>
                  <input
                    type="number"
                    className="planner-input"
                    value={maxNonMei}
                    onChange={(e) => setMaxNonMei(e.target.value)}
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Colaboradores adicionais</p>
                </div>
              </div>

              <div className="mt-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400 flex gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Ao finalizar, a empresa será criada e o usuário será vinculado automaticamente como administrador.
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
            disabled={loading}
            className="planner-button px-10 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 shadow-lg shadow-blue-500/20"
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
    </div>
  );
}
