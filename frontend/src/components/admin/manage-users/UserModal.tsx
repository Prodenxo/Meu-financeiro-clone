import { useState, useEffect } from 'react';
import { Ban, ShieldAlert } from 'lucide-react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { toast } from '../../../lib/toast';
import { useAuthStore } from '../../../store/authStore';
import {
  banUser,
  createUser,
  resetUserPassword,
  sendUserPasswordResetEmail,
  unbanUser,
  updateUser,
  patchAdminMeiDocumentosAtivos,
  type EmpresaOption,
  type ManagedUser
} from '../../../services/usersService';
import { fetchAdminMeiCertificateStatus } from '../../../services/adminUserDataService';
import LoadingOverlay from '../../LoadingOverlay';
import { UserBlockConfirmDialog, type UserBlockConfirmIntent } from './UserBlockConfirmDialog';
import {
  STRONG_PASSWORD_MIN_LENGTH,
  strongPasswordRequirementsSummary,
  validateStrongPassword
} from '../../../lib/passwordPolicy';
import { shouldShowAdminMeiToggle } from '../../../lib/managedUserActions';

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
  const currentSessionUserId = useAuthStore((s) => s.userId);
  const [loading, setLoading] = useState(false);
  const [linkBlocked, setLinkBlocked] = useState(false);
  const [blockBusy, setBlockBusy] = useState(false);
  const [blockConfirmIntent, setBlockConfirmIntent] = useState<UserBlockConfirmIntent | null>(null);
  
  // Create fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showCreatePassword, setShowCreatePassword] = useState(false);

  // Edit-only: alteração de e-mail do membro
  const [editEmail, setEditEmail] = useState('');
  const [originalEmail, setOriginalEmail] = useState('');

  // Common fields
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'usuario' | 'outsider'>('usuario');
  const [mei, setMei] = useState(false);
  const [docNfse, setDocNfse] = useState(true);
  const [docNfe, setDocNfe] = useState(false);
  const [docNfce, setDocNfce] = useState(false);
  const [docsLoading, setDocsLoading] = useState(false);
  const [expiresAt, setExpiresAt] = useState('');

  // Empresa selection
  const [targetEmpresaId, setTargetEmpresaId] = useState('');
  const [empresaQuery, setEmpresaQuery] = useState('');
  const [empresaOpen, setEmpresaOpen] = useState(false);

  // Role selection custom dropdown
  const [roleOpen, setRoleOpen] = useState(false);

  // Validation feedback
  const [showErrors, setShowErrors] = useState(false);

  // Editar: redefinição de senha (painel opcional)
  const [accessPasswordPanelOpen, setAccessPasswordPanelOpen] = useState(false);
  const [resetPasswordManual, setResetPasswordManual] = useState('');
  const [resetPasswordConfirm, setResetPasswordConfirm] = useState('');
  const [showResetPasswordFields, setShowResetPasswordFields] = useState(false);
  const [passwordResetBusy, setPasswordResetBusy] = useState(false);
  const [lastGeneratedPassword, setLastGeneratedPassword] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(false); // Reset loading state when opening
      if (mode === 'edit' && user) {
        setDisplayName(user.displayName || '');
        setPhone(user.phone || '');
        setEditEmail(user.email || '');
        setOriginalEmail(user.email || '');
        setSelectedRole((user.role as 'admin' | 'usuario' | 'outsider') || 'usuario');
        setMei(user.mei === true);
        setExpiresAt(user.expiresAt ? new Date(user.expiresAt).toISOString().split('T')[0] : '');
        setTargetEmpresaId(user.empresaId || '');
        const matchedEmpresa = empresas.find(e => e.id === user.empresaId);
        setEmpresaQuery(matchedEmpresa?.empresa || user.empresaName || '');
        setLinkBlocked(user.status === false);
        void (async () => {
          setDocsLoading(true);
          try {
            const status = await fetchAdminMeiCertificateStatus(user.id);
            const docs = status.documentosAtivos;
            if (docs) {
              setDocNfse(Boolean(docs.nfse));
              setDocNfe(Boolean(docs.nfe));
              setDocNfce(Boolean(docs.nfce));
            } else {
              setDocNfse(true);
              setDocNfe(false);
              setDocNfce(false);
            }
          } catch {
            setDocNfse(true);
            setDocNfe(false);
            setDocNfce(false);
          } finally {
            setDocsLoading(false);
          }
        })();
      } else {
        setEmail('');
        setPassword('');
        setEditEmail('');
        setOriginalEmail('');
        setDisplayName('');
        setPhone('');
        setSelectedRole('usuario');
        setMei(false);
        setDocNfse(true);
        setDocNfe(false);
        setDocNfce(false);
        setExpiresAt('');
        setTargetEmpresaId('');
        setEmpresaQuery('');
        setLinkBlocked(false);
      }
      setBlockBusy(false);
      setBlockConfirmIntent(null);
      setShowErrors(false);
      setEmpresaOpen(false);
      setRoleOpen(false);
      setAccessPasswordPanelOpen(false);
      setResetPasswordManual('');
      setResetPasswordConfirm('');
      setShowResetPasswordFields(false);
      setPasswordResetBusy(false);
      setLastGeneratedPassword(null);
    }
  }, [isOpen, mode, user, empresas]);

  const isEditingSelf = mode === 'edit' && !!user && user.id === currentSessionUserId;
  const showAdminMeiToggle =
    role === 'admin' &&
    shouldShowAdminMeiToggle(empresas, { meiActive: mei, userHasMei: user?.mei });
  const isSelfMeiRemoval = isEditingSelf && user?.mei === true && !mei;

  const openBlockConfirm = () => {
    if (!user || isEditingSelf || blockBusy) return;
    setBlockConfirmIntent(linkBlocked ? 'unblock' : 'block');
  };

  const executeBlockToggle = async () => {
    if (!user || !blockConfirmIntent || blockBusy) return;
    const intent = blockConfirmIntent;
    setBlockBusy(true);
    try {
      if (intent === 'unblock') {
        await unbanUser(user.id);
        setLinkBlocked(false);
        toast.success('Usuário desbloqueado.');
      } else {
        await banUser(user.id);
        setLinkBlocked(true);
        toast.success('Usuário bloqueado.');
      }
      setBlockConfirmIntent(null);
      await Promise.resolve(onSuccess());
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível atualizar o bloqueio.');
    } finally {
      setBlockBusy(false);
    }
  };

  const handleCopyGeneratedPassword = async () => {
    if (!lastGeneratedPassword) return;
    try {
      await navigator.clipboard.writeText(lastGeneratedPassword);
      toast.success('Senha copiada para a área de transferência');
    } catch {
      toast.error('Não foi possível copiar automaticamente. Selecione o texto manualmente.');
    }
  };

  const handleGenerateRandomPassword = async () => {
    if (!user || passwordResetBusy) return;
    const ok = window.confirm(
      'Será gerada uma senha aleatória e exibida aqui. Envie ao usuário por um canal seguro. Continuar?'
    );
    if (!ok) return;
    setPasswordResetBusy(true);
    setLastGeneratedPassword(null);
    try {
      const result = await resetUserPassword(user.id);
      const pwd = result?.password;
      if (pwd) setLastGeneratedPassword(pwd);
      toast.success('Senha gerada e aplicada na conta deste usuário');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao gerar senha';
      toast.error(message);
    } finally {
      setPasswordResetBusy(false);
    }
  };

  const handleApplyManualPasswordReset = async () => {
    if (!user || passwordResetBusy) return;
    const a = resetPasswordManual.trim();
    const b = resetPasswordConfirm.trim();
    const policy = validateStrongPassword(a);
    if (!policy.ok) {
      toast.error(policy.message);
      return;
    }
    if (a !== b) {
      toast.error('As senhas digitadas não coincidem');
      return;
    }
    setPasswordResetBusy(true);
    setLastGeneratedPassword(null);
    try {
      await resetUserPassword(user.id, a);
      toast.success('Senha atualizada. Informe o usuário por um canal seguro.');
      setResetPasswordManual('');
      setResetPasswordConfirm('');
      setShowResetPasswordFields(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao redefinir senha';
      toast.error(message);
    } finally {
      setPasswordResetBusy(false);
    }
  };

  const handleSendPasswordResetEmail = async () => {
    if (!user || passwordResetBusy) return;
    const targetEmail = (user.email || '').trim();
    if (!targetEmail) {
      toast.error('Este usuário não tem e-mail cadastrado para enviar o link');
      return;
    }
    setPasswordResetBusy(true);
    try {
      await sendUserPasswordResetEmail(user.id);
      toast.success(`E-mail de redefinição enviado para ${targetEmail}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao enviar e-mail';
      toast.error(message);
    } finally {
      setPasswordResetBusy(false);
    }
  };

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
    if (role === 'superadmin' && !targetEmpresaId) missingFields.push('Empresa');
    if (!selectedRole) missingFields.push('Perfil');

    if (missingFields.length > 0) {
      toast.error(`Campos obrigatórios: ${missingFields.join(', ')}`);
      return;
    }

    if (mei && !docNfse && !docNfe && !docNfce) {
      toast.error('Com MEI ativo, libere ao menos um tipo de nota (NFS-e, NF-e ou NFC-e).');
      return;
    }

    if (mode === 'create') {
      const pwdCheck = validateStrongPassword(password);
      if (!pwdCheck.ok) {
        toast.error(pwdCheck.message);
        return;
      }
    }

    // Validação de Capacidade/Limite da Empresa
    const validationEmpresa = role === 'superadmin' 
      ? empresas.find(e => e.id === targetEmpresaId)
      : (empresas.length > 0 ? empresas[0] : null);

    if (validationEmpresa) {
      if (mei) {
        const currentMeis = users.filter(u => u.empresaId === validationEmpresa.id && u.mei && u.id !== user?.id).length;
        const limit = validationEmpresa.max_mei;
        if (limit !== null && currentMeis >= limit) {
          toast.error(limit === 0 ? 'Módulo MEI está desativado para esta empresa' : `Limite de MEIs atingido (${limit})`);
          return;
        }
      } else if (!isSelfMeiRemoval) {
        const currentRegular = users.filter(u => u.empresaId === validationEmpresa.id && !u.mei && u.id !== user?.id).length;
        const limit = validationEmpresa.max_usuarios_nao_mei;
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
          role: selectedRole,
          empresaId: role === 'superadmin' ? targetEmpresaId || undefined : undefined,
          mei,
          expiresAt: expiresAt || null
        };
        const created = await createUser(payload);
        if (mei && created?.userId) {
          await patchAdminMeiDocumentosAtivos(created.userId, {
            nfse: docNfse,
            nfe: docNfe,
            nfce: docNfce,
          });
        }
        toast.success('Usuário criado com sucesso');
      } else if (user) {
        const trimmedEditEmail = editEmail.trim().toLowerCase();
        const emailChanged = trimmedEditEmail && trimmedEditEmail !== (originalEmail || '').trim().toLowerCase();
        if (trimmedEditEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEditEmail)) {
          toast.error('E-mail inválido');
          setLoading(false);
          return;
        }
        const payload = {
          displayName: displayName || undefined,
          phone: phone || undefined,
          email: emailChanged ? trimmedEditEmail : undefined,
          role:
            isEditingSelf
              ? undefined
              : role === 'superadmin' || role === 'admin'
                ? selectedRole
                : undefined,
          empresaId:
            isEditingSelf ? undefined : role === 'superadmin' ? targetEmpresaId || undefined : undefined,
          mei,
          expiresAt: expiresAt || null
        };
        await updateUser(user.id, payload);
        if (mei) {
          await patchAdminMeiDocumentosAtivos(user.id, {
            nfse: docNfse,
            nfe: docNfe,
            nfce: docNfce,
          });
        }
        if (emailChanged) {
          toast.success(`Usuário atualizado. Link de confirmação enviado para ${trimmedEditEmail}.`);
        } else {
          toast.success('Usuário atualizado com sucesso');
        }
      }
      onSuccess();
      onClose();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar usuário');
    } finally {
      setLoading(false);
    }
  };

  const filteredEmpresas = empresas.filter(e => 
    e.empresa.toLowerCase().includes(empresaQuery.toLowerCase())
  );

  if (!isOpen) return null;

  const blockDialogUserLabel = user?.displayName?.trim() || user?.email?.trim() || '';

  return (
    <>
    <UserBlockConfirmDialog
      open={blockConfirmIntent !== null}
      intent={blockConfirmIntent ?? 'block'}
      userLabel={blockDialogUserLabel}
      loading={blockBusy}
      onCancel={() => !blockBusy && setBlockConfirmIntent(null)}
      onConfirm={() => void executeBlockToggle()}
    />
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
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-snug">
                  {strongPasswordRequirementsSummary()}
                </p>
              </div>
            </div>
          )}

          {mode === 'edit' && user && (
            <section className="space-y-4" aria-labelledby="user-modal-access-heading">
              <div className="relative flex items-center">
                <div className="flex-grow border-t border-slate-100 dark:border-slate-800" />
                <span
                  id="user-modal-access-heading"
                  className="flex-shrink mx-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400"
                >
                  Acesso
                </span>
                <div className="flex-grow border-t border-slate-100 dark:border-slate-800" />
              </div>
              <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-4 space-y-3">
                <div className="space-y-1.5">
                  <label
                    htmlFor="user-modal-email"
                    className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide"
                  >
                    E-mail de login
                  </label>
                  <input
                    id="user-modal-email"
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="planner-input w-full"
                    placeholder="email@exemplo.com"
                    autoComplete="off"
                  />
                  {editEmail.trim().toLowerCase() !== (originalEmail || '').trim().toLowerCase() && editEmail.trim() && (
                    <p className="text-[11px] text-amber-700 dark:text-amber-300 leading-snug">
                      Ao salvar, um link de confirmação será enviado para <strong>{editEmail.trim()}</strong>. O e-mail só passa a valer após o usuário clicar no link.
                    </p>
                  )}
                </div>
                {role === 'admin' && (
                  <div className="space-y-2 pt-0.5">
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Enviamos um link seguro para o e-mail do usuário. Ele define a nova senha; você não altera a senha
                      por aqui.
                    </p>
                    <button
                      type="button"
                      disabled={passwordResetBusy || !(user.email || '').trim()}
                      onClick={() => void handleSendPasswordResetEmail()}
                      className="planner-button-secondary-compact text-blue-600 dark:text-blue-400 w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {passwordResetBusy ? 'Enviando…' : 'Enviar e-mail de redefinição de senha'}
                    </button>
                    {!(user.email || '').trim() && (
                      <p className="text-xs text-rose-600 dark:text-rose-400">
                        Não há e-mail cadastrado para enviar o link.
                      </p>
                    )}
                  </div>
                )}
                {role === 'superadmin' && (
                  <>
                    {!accessPasswordPanelOpen ? (
                      <button
                        type="button"
                        onClick={() => {
                          setAccessPasswordPanelOpen(true);
                          setLastGeneratedPassword(null);
                        }}
                        className="planner-button-secondary-compact text-blue-600 dark:text-blue-400 w-full sm:w-auto"
                      >
                        Redefinir senha
                      </button>
                    ) : (
                      <div className="space-y-4 pt-1">
                        {lastGeneratedPassword && (
                          <div
                            className="rounded-xl border border-amber-200/80 bg-amber-50/90 dark:border-amber-800/60 dark:bg-amber-950/30 px-3 py-2.5 text-sm text-amber-950 dark:text-amber-100"
                            role="status"
                          >
                            <p className="text-xs font-semibold text-amber-800 dark:text-amber-200 mb-1">
                              Senha gerada — copie e envie ao usuário com segurança
                            </p>
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <code className="text-xs sm:text-sm font-mono break-all">{lastGeneratedPassword}</code>
                              <button
                                type="button"
                                onClick={() => void handleCopyGeneratedPassword()}
                                className="shrink-0 planner-button-secondary-compact text-amber-900 dark:text-amber-200"
                              >
                                Copiar
                              </button>
                            </div>
                          </div>
                        )}
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                          {strongPasswordRequirementsSummary()}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={passwordResetBusy}
                            onClick={() => void handleGenerateRandomPassword()}
                            className="planner-button-secondary-compact disabled:opacity-50"
                          >
                            {passwordResetBusy && !showResetPasswordFields ? 'Gerando…' : 'Gerar senha aleatória'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowResetPasswordFields((v) => !v)}
                            className="planner-button-secondary-compact"
                            disabled={passwordResetBusy}
                          >
                            {showResetPasswordFields ? 'Ocultar campos' : 'Definir senha manualmente'}
                          </button>
                        </div>
                        {showResetPasswordFields && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <label
                                htmlFor="user-modal-new-password"
                                className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
                              >
                                Nova senha
                              </label>
                              <input
                                id="user-modal-new-password"
                                type="password"
                                autoComplete="new-password"
                                value={resetPasswordManual}
                                onChange={(e) => setResetPasswordManual(e.target.value)}
                            className="planner-input w-full"
                            placeholder={`Mínimo ${STRONG_PASSWORD_MIN_LENGTH} caracteres + complexidade`}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label
                                htmlFor="user-modal-confirm-password"
                                className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
                              >
                                Confirmar senha
                              </label>
                              <input
                                id="user-modal-confirm-password"
                                type="password"
                                autoComplete="new-password"
                                value={resetPasswordConfirm}
                                onChange={(e) => setResetPasswordConfirm(e.target.value)}
                                className="planner-input w-full"
                                placeholder="Repita a nova senha"
                              />
                            </div>
                            <div className="md:col-span-2 flex flex-wrap gap-2 justify-end">
                              <button
                                type="button"
                                disabled={passwordResetBusy}
                                onClick={() => void handleApplyManualPasswordReset()}
                                className="planner-button bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl text-sm disabled:opacity-50"
                              >
                                {passwordResetBusy ? 'Aplicando…' : 'Aplicar nova senha'}
                              </button>
                            </div>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setAccessPasswordPanelOpen(false);
                            setResetPasswordManual('');
                            setResetPasswordConfirm('');
                            setShowResetPasswordFields(false);
                            setLastGeneratedPassword(null);
                          }}
                          className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                        >
                          Fechar opções de senha
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </section>
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
              <span className="flex-shrink mx-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                {role === 'superadmin' ? 'Vínculo & Regras' : 'Acesso'}
              </span>
              <div className="flex-grow border-t border-slate-100 dark:border-slate-800"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
              {role === 'superadmin' && (
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
              )}

              <div className="space-y-1.5 relative">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Perfil de Acesso <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => !isEditingSelf && setRoleOpen(!roleOpen)}
                    disabled={isEditingSelf}
                    className={`planner-input w-full text-left flex justify-between items-center pr-10 ${showErrors && !selectedRole ? 'border-rose-500 bg-rose-50/5' : ''} ${isEditingSelf ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    <span className="capitalize">{selectedRole === 'usuario' ? 'Usuário' : selectedRole}</span>
                    <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  
                  {roleOpen && !isEditingSelf && (
                    <div className="absolute top-full left-0 right-0 z-[120] mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl animate-in fade-in slide-in-from-top-1 duration-150">
                      {(role === 'superadmin' ? ['usuario', 'admin', 'outsider'] : ['usuario', 'admin']).map(r => (
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

              {/* Toggle MEI: ativo na empresa ou na conta (permite desligar o próprio MEI) */}
              {showAdminMeiToggle && (
                <div className="bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800/50 flex items-center justify-between">
                  <div className="max-w-[70%]">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Usuário MEI</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                      {isSelfMeiRemoval || (isEditingSelf && mei)
                        ? 'Desligue para remover o módulo MEI da sua conta.'
                        : 'Habilita as funções específicas do módulo MEI.'}
                    </p>
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
              )}
            </div>

            {mei ? (
              <div className="rounded-2xl border border-slate-100 dark:border-slate-800/50 bg-slate-50/40 dark:bg-slate-900/40 p-4 space-y-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Tipos de nota liberados</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                    O usuário só vê e cadastra o que estiver ativo aqui (NFS-e, NF-e, NFC-e).
                  </p>
                </div>
                {docsLoading ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400">Carregando permissões…</p>
                ) : (
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-6">
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                      <input type="checkbox" checked={docNfse} onChange={(e) => setDocNfse(e.target.checked)} />
                      NFS-e (serviços)
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                      <input type="checkbox" checked={docNfe} onChange={(e) => setDocNfe(e.target.checked)} />
                      NF-e (produtos)
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                      <input type="checkbox" checked={docNfce} onChange={(e) => setDocNfce(e.target.checked)} />
                      NFC-e (varejo)
                    </label>
                  </div>
                )}
              </div>
            ) : null}

            {role === 'superadmin' && (
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

                <div className="bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="max-w-[70%]">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">Data de validade</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                        {expiresAt ? 'Acesso será bloqueado nesta data.' : 'Sem expiração — acesso permanente.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (expiresAt) {
                          setExpiresAt('');
                        } else {
                          const d = new Date();
                          d.setDate(d.getDate() + 30);
                          setExpiresAt(d.toISOString().split('T')[0]);
                        }
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 focus:outline-none ${
                        expiresAt ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                      aria-pressed={Boolean(expiresAt)}
                      aria-label={expiresAt ? 'Remover data de validade' : 'Definir data de validade'}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${expiresAt ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                  {expiresAt && (
                    <input
                      type="date"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="planner-input w-full"
                    />
                  )}
                </div>
              </div>
            )}

            {mode === 'edit' && user && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Situação do acesso
                </p>
                {isEditingSelf && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-800/40 px-3 py-2">
                    Você está editando a sua própria conta. Bloquear ou desbloquear pelo painel não está disponível
                    aqui por segurança.
                  </p>
                )}
                {!isEditingSelf && (
                  <>
                    {linkBlocked && (
                      <div
                        role="alert"
                        className="flex gap-3 rounded-2xl border border-amber-200/90 bg-amber-50/85 px-3.5 py-3 text-left dark:border-amber-500/30 dark:bg-amber-950/40"
                      >
                        <span
                          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200"
                          aria-hidden
                        >
                          <ShieldAlert className="h-4 w-4" strokeWidth={2.25} />
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-amber-950 dark:text-amber-50">
                            Usuário bloqueado
                          </p>
                          <p className="text-xs leading-relaxed text-amber-900/85 dark:text-amber-100/85 mt-0.5">
                            Esta conta não consegue entrar no Meu Financeiro até você desbloquear. Use o botão abaixo
                            para desbloquear.
                          </p>
                        </div>
                      </div>
                    )}
                    {!linkBlocked && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Bloquear impede o login na plataforma até você desbloquear de novo.
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={openBlockConfirm}
                      disabled={blockBusy}
                      className={
                        linkBlocked
                          ? 'inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/90 px-4 py-2.5 text-sm font-semibold text-emerald-900 shadow-sm hover:bg-emerald-100/90 dark:border-emerald-500/30 dark:bg-emerald-950/50 dark:text-emerald-100 dark:hover:bg-emerald-900/40 disabled:opacity-50'
                          : 'inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white/80 px-4 py-2.5 text-sm font-semibold text-rose-900 shadow-sm hover:bg-rose-50/90 dark:border-rose-500/25 dark:bg-rose-950/35 dark:text-rose-100 dark:hover:bg-rose-950/50 disabled:opacity-50'
                      }
                    >
                      {linkBlocked ? (
                        <>
                          <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden />
                          {blockBusy ? 'Desbloqueando…' : 'Desbloquear usuário'}
                        </>
                      ) : (
                        <>
                          <Ban className="h-4 w-4 shrink-0" aria-hidden />
                          {blockBusy ? 'Bloqueando…' : 'Bloquear usuário'}
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            )}
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
    </>
  );
}
