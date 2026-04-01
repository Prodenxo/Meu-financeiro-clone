import React from 'react';
import type { Recorrencia } from '../services/recorrenciaService';
import ButtonSpinner from './ButtonSpinner';

export interface RecorrenciaDeleteModalProps {
  open: boolean;
  recorrencia: Recorrencia | null;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
}

export default function RecorrenciaDeleteModal({
  open,
  recorrencia,
  onClose,
  onConfirm,
  loading = false,
}: RecorrenciaDeleteModalProps) {
  if (!open || !recorrencia) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="planner-card p-6 w-full max-w-sm relative"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold dark:text-white mb-2">Excluir recorrência?</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          {recorrencia.classificacao} (dia {recorrencia.dia_do_mes}) será removida. Os lançamentos já gerados nas transações não serão apagados.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            className="planner-button-secondary flex-1"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="planner-button-danger flex-1"
            onClick={() => onConfirm()}
            disabled={loading}
          >
            {loading ? (
              <>
                <ButtonSpinner size={18} />
                Excluindo...
              </>
            ) : (
              'Excluir'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
