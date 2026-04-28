import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { type ManagedUser } from '../../../services/usersService';

interface DeleteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  user: ManagedUser | null;
  loading?: boolean;
}

export function DeleteUserModal({ isOpen, onClose, onConfirm, user, loading }: DeleteUserModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800 animate-in zoom-in-95 duration-200">
        <div className="absolute right-4 top-4">
          <button
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-500">
              <AlertTriangle size={32} />
            </div>
            
            <h3 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">
              Excluir Usuário
            </h3>
            
            <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
              Você está prestes a excluir <span className="font-bold text-slate-900 dark:text-white">{user?.displayName || user?.email}</span>. 
              Esta ação é <span className="text-rose-600 font-semibold uppercase">irreversível</span> e todos os dados vinculados serão removidos permanentemente.
            </p>

            <div className="flex w-full flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-750 transition-all active:scale-95"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                className="flex-[1.5] flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-rose-600/20 hover:bg-rose-700 disabled:opacity-50 transition-all active:scale-95"
              >
                {loading ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Excluindo...
                  </>
                ) : (
                  'Sim, Excluir Usuário'
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Decorative footer line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-rose-500 to-rose-600 opacity-80" />
      </div>
    </div>
  );
}
