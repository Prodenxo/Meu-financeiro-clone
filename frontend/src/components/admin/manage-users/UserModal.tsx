import { useState, useEffect } from 'react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { toast } from '../../../lib/toast';
import { createUser, updateUser, type ManagedUser, type EmpresaOption } from '../../../services/usersService';
import LoadingOverlay from '../../LoadingOverlay';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode: 'create' | 'edit';
  user?: ManagedUser | null;
  empresas: EmpresaOption[];
  users: ManagedUser[];
  role: string | null;
}

export function UserModal({ isOpen, onClose, onSuccess, mode, user, empresas, users, role }: UserModalProps) {
  const [loading, setLoading] = useState(false);
  
  // Create fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showCreatePassword, setShowCreatePassword] = useState(false);

  // Common fields
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'usuario' | 'outsider'>('usuario');
  const [mei, setMei] = useState(false);
  const [expiresAt, setExpiresAt] = useState('');

  // Empresa selection
  const [targetEmpresaId, setTargetEmpresaId] = useState('');
  const [empresaQuery, setEmpresaQuery] = useState('');
  const [empresaOpen, setEmpresaOpen] = useState(false);

  // Role selection custom dropdown
  const [roleOpen, setRoleOpen] = useState(false);

  // Validation feedback
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(false); // Reset loading state when opening
      if (mode === 'edit' && user) {
        setDisplayName(user.displayName || '');
        setPhone(user.phone || '');
        setSelectedRole((user.role as 'admin' | 'usuario' | 'outsider') || 'usuario');
        setMei(user.mei === true);
        setExpiresAt(user.expiresAt ? new Date(user.expiresAt).toISOString().split('T')[0] : '');
        setTargetEmpresaId(user.empresaId || '');
        const matchedEmpresa = empresas.find(e => e.id === user.empresaId);
        setEmpresaQuery(matchedEmpresa?.empresa || user.empresaName || '');
      } else {
        setEmail('');
        setPassword('');
        setDisplayName('');
        setPhone('');
        setSelectedRole('usuario');
        setMei(false);
        setExpiresAt('');
        setTargetEmpresaId('');
        setEmpresaQuery('');
      }
      setShowErrors(false);
      setEmpresaOpen(false);
      setRoleOpen(false);
    }
  }, [isOpen, mode, user, empresas]);

  const handleSubmit = async () => {
    if (loading) return;
    
    setShowErrors(true);
    
    const missingFields = [];
    if (mode === 'create') {
      if (!email.trim()) missingFields.push('E-mail');
      if (!password.trim()) missingFields.push('Senha');
    }
    
    if (!displayName.trim()) missingFields.push('Nome');
    if (!phone.trim()) missingFields.push('Telefone');
    if (!targetEmpresaId) missingFields.push('Empresa');
    if (!selectedRole) missingFields.push('Perfil');
    if (!expiresAt) missingFields.push('Data de Expiração');

    if (missingFields.length > 0) {
      toast.error(`Campos obrigatórios: ${missingFields.join(', ')}`);
      return;
    }

    // Validação de Capacidade/Limite da Empresa
    const targetEmpresa = empresas.find(e => e.id === targetEmpresaId);
    if (targetEmpresa) {
      if (mei) {
        const currentMeis = users.filter(u => u.empresaId === targetEmpresaId && u.mei && u.id !== user?.id).length;
        const limit = targetEmpresa.max_mei;
        if (limit !== null && currentMeis >= limit) {
          toast.error(limit === 0 ? 'Módulo MEI está desativado para esta empresa' : `Limite de MEIs atingido (${limit})`);
          return;
        }
      } else {
        const currentRegular = users.filter(u => u.empresaId === targetEmpresaId && !u.mei && u.id !== user?.id).length;
        const limit = targetEmpresa.max_usuarios_nao_mei;
        if (limit !== null && limit !== 0 && currentRegular >= limit) {
          toast.error(`Limite de Clientes (PF/Outros) atingido (${limit})`);
          return;
        }
      }
    }

    setLoading(true);
    try {
      if (mode === 'create') {
        const payload = {
          email,
          password,
          displayName: displayName || undefined,
          phone: phone || undefined,
          role: role === 'superadmin' ? selectedRole : 'usuario',
          empresaId: role === 'superadmin' ? targetEmpresaId || undefined : undefined,
          mei,
          expiresAt: expiresAt || null
        };
        await createUser(payload);
        toast.success('Usuário criado com sucesso');
      } else if (user) {
        const payload = {
          displayName: displayName || undefined,
          phone: phone || undefined,
          role: role === 'superadmin' ? selectedRole : undefined,
          empresaId: role === 'superadmin' ? targetEmpresaId || undefined : undefined,
          mei,
          expiresAt: expiresAt || null
        };
        await updateUser(user.id, payload);
        toast.success('Usuário atualizado com sucesso');
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar usuário');
    } finally {
      setLoading(false);
    }
  };

  const filteredEmpresas = empresas.filter(e => 
    e.empresa.toLowerCase().includes(empresaQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="planner-card w-full max-w-xl max-h-[90vh] overflow-y-auto p-0 shadow-2xl animate-in zoom-in-95 duration-200">
        {loading && <LoadingOverlay active={true} text={mode === 'create' ? 'Criando usuário...' : 'Salvando alterações...'} />}
        
        {/* Modal Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {mode === 'create' ? 'Novo Usuário' : 'Editar Usuário'}
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium uppercase tracking-wider">
              {mode === 'create' ? 'Preencha todos os dados obrigatórios' : 'Altere os dados do usuário abaixo'}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Informações de Login */}
          {mode === 'create' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  E-mail <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`planner-input w-full ${showErrors && !email ? 'border-rose-500 bg-rose-50/5' : ''}`}
                  placeholder="ex@email.com"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Senha <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showCreatePassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`planner-input w-full pr-10 ${showErrors && !password ? 'border-rose-500 bg-rose-50/5' : ''}`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCreatePassword(!showCreatePassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showCreatePassword ? (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Seção Perfil */}
          <section className="space-y-4">
            <div className="relative flex items-center">
              <div className="flex-grow border-t border-slate-100 dark:border-slate-800"></div>
              <span className="flex-shrink mx-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Perfil</span>
              <div className="flex-grow border-t border-slate-100 dark:border-slate-800"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Nome Completo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className={`planner-input w-full ${showErrors && !displayName ? 'border-rose-500 bg-rose-50/5' : ''}`}
                  placeholder="Nome do usuário"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  WhatsApp / Celular <span className="text-rose-500">*</span>
                </label>
                <PhoneInput
                  country={'br'}
                  value={phone}
                  onChange={val => setPhone(val)}
                  inputStyle={{
                    width: '100%',
                    paddingTop: '10px',
                    paddingBottom: '10px',
                    paddingLeft: '48px',
                    borderRadius: '0.75rem',
                    border: showErrors && !phone.trim() 
                      ? '1px solid #f43f5e' 
                      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? '1px solid #334155' : '1px solid #cbd5e1'),
                    fontSize: '1rem',
                    backgroundColor: showErrors && !phone.trim() 
                      ? '#fff1f2' 
                      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? '#0f172a' : 'white'),
                    color: window.matchMedia('(prefers-color-scheme: dark)').matches ? '#f8fafc' : '#0f172a',
                    height: '42px',
                  }}
                  containerClass="!w-full"
                  buttonClass="!bg-transparent !border-none !pl-2"
                />
              </div>
            </div>
          </section>

          {/* Seção Vínculo */}
          <section className="space-y-5">
            <div className="relative flex items-center">
              <div className="flex-grow border-t border-slate-100 dark:border-slate-800"></div>
              <span className="flex-shrink mx-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Vínculo & Regras</span>
              <div className="flex-grow border-t border-slate-100 dark:border-slate-800"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5 relative">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Empresa Responsável <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    readOnly={role !== 'superadmin'}
                    onClick={() => role === 'superadmin' && setEmpresaOpen(!empresaOpen)}
                    value={empresaQuery}
                    onChange={(e) => setEmpresaQuery(e.target.value)}
                    className={`planner-input w-full text-left flex justify-between items-center pr-10 ${role !== 'superadmin' ? 'bg-slate-50 dark:bg-slate-800/50 cursor-not-allowed opacity-75' : 'cursor-pointer'} ${showErrors && !targetEmpresaId ? 'border-rose-500 bg-rose-50/5' : ''}`}
                    placeholder="Pesquisar empresa..."
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                  
                  {empresaOpen && role === 'superadmin' && (
                    <div className="absolute top-full left-0 right-0 z-[120] mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-h-48 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150">
                      {filteredEmpresas.map(e => (
                        <button
                          key={e.id}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors border-b last:border-0 border-slate-50 dark:border-slate-800 ${targetEmpresaId === e.id ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
                          onClick={() => {
                            setTargetEmpresaId(e.id);
                            setEmpresaQuery(e.empresa);
                            setEmpresaOpen(false);
                          }}
                        >
                          {e.empresa}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 relative">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Perfil de Acesso <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setRoleOpen(!roleOpen)}
                    className={`planner-input w-full text-left flex justify-between items-center pr-10 ${showErrors && !selectedRole ? 'border-rose-500 bg-rose-50/5' : ''}`}
                  >
                    <span className="capitalize">{selectedRole === 'usuario' ? 'Usuário' : selectedRole}</span>
                    <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  
                  {roleOpen && (
                    <div className="absolute top-full left-0 right-0 z-[120] mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl animate-in fade-in slide-in-from-top-1 duration-150">
                      {['usuario', 'admin', 'outsider'].map(r => (
                        <button
                          key={r}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors border-b last:border-0 border-slate-50 dark:border-slate-800 capitalize ${selectedRole === r ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
                          onClick={() => {
                            setSelectedRole(r as any);
                            setRoleOpen(false);
                          }}
                        >
                          {r === 'usuario' ? 'Usuário' : r}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
              <div className="bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800/50 flex items-center justify-between">
                <div className="max-w-[70%]">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Usuário MEI</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">Habilita as funções específicas do módulo MEI.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setMei(!mei)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 focus:outline-none ${
                    mei ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${mei ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Data de Expiração <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className={`planner-input w-full ${showErrors && !expiresAt ? 'border-rose-500 bg-rose-50/5' : ''}`}
                />
              </div>
            </div>
          </section>
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-6 py-5 flex items-center justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="planner-button bg-blue-600 hover:bg-blue-700 text-white px-10 py-2.5 rounded-2xl shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
          >
            {loading ? 'Processando...' : mode === 'create' ? 'Criar Conta' : 'Salvar Alterações'}
          </button>
        </div>
      </div>
    </div>
  );
}
