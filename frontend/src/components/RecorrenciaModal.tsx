import React, { useState, useEffect, useRef } from 'react';
import type { Recorrencia, CreateRecorrenciaInput, UpdateRecorrenciaInput } from '../services/recorrenciaService';
import { fetchCategoriesByType, type Category } from '../services/categoryService';
import { useAuthStore } from '../store/authStore';
import { toast } from '../lib/toast';
import UserFacingErrorBlock from './UserFacingErrorBlock';
import { mapUnknownErrorToUserFacing } from '../lib/mapUnknownErrorToUserFacing';

export interface RecorrenciaModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (payload: CreateRecorrenciaInput | UpdateRecorrenciaInput) => void;
  recorrencia?: Recorrencia | null;
  saving?: boolean;
  error?: unknown | null;
}

export default function RecorrenciaModal({
  open,
  onClose,
  onSave,
  recorrencia,
  saving,
  error,
}: RecorrenciaModalProps) {
  const [diaDoMes, setDiaDoMes] = useState(recorrencia?.dia_do_mes ?? 5);
  const [valor, setValor] = useState(recorrencia?.valor != null ? String(recorrencia.valor) : '');
  const [classificacao, setClassificacao] = useState(recorrencia?.classificacao ?? '');
  const [tipo, setTipo] = useState<'entrada' | 'saída'>(recorrencia?.tipo === 'entrada' ? 'entrada' : 'saída');
  const [status, setStatus] = useState(recorrencia?.status ?? 'pago');
  const [obs, setObs] = useState(recorrencia?.obs ?? '');
  const [categorias, setCategorias] = useState<Category[]>([]);
  const [, setLoadingCategorias] = useState(false);
  const previousTipoRef = useRef<'entrada' | 'saída' | null>(null);
  const skipNextTipoEffectRef = useRef(false);

  useEffect(() => {
    if (!open) return;

    const initialTipo: 'entrada' | 'saída' = recorrencia
      ? recorrencia.tipo === 'entrada'
        ? 'entrada'
        : 'saída'
      : 'saída';

    if (recorrencia) {
      setDiaDoMes(recorrencia.dia_do_mes);
      setValor(String(recorrencia.valor));
      setClassificacao(recorrencia.classificacao);
      setTipo(initialTipo);
      setStatus(recorrencia.status);
      setObs(recorrencia.obs ?? '');
    } else {
      setDiaDoMes(5);
      setValor('');
      setClassificacao('');
      setTipo('saída');
      setStatus('pago');
      setObs('');
    }

    skipNextTipoEffectRef.current = true;
    previousTipoRef.current = initialTipo;

    setLoadingCategorias(true);
    const userId = useAuthStore.getState().userId;
    if (userId) {
      fetchCategoriesByType(userId, initialTipo)
        .then((data) => setCategorias(data))
        .catch((err) => console.error('[RecorrenciaModal] Erro ao buscar categorias:', err))
        .finally(() => setLoadingCategorias(false));
    } else {
      console.warn('[RecorrenciaModal] userId não encontrado');
      setCategorias([]);
      setLoadingCategorias(false);
    }
  }, [open, recorrencia]);

  useEffect(() => {
    if (!open) return;
    if (skipNextTipoEffectRef.current) {
      skipNextTipoEffectRef.current = false;
      return;
    }
    if (previousTipoRef.current !== null && previousTipoRef.current !== tipo) {
      setClassificacao('');
      setLoadingCategorias(true);
      const userId = useAuthStore.getState().userId;
      if (userId) {
        fetchCategoriesByType(userId, tipo)
          .then((data) => setCategorias(data))
          .catch((err) => console.error('[RecorrenciaModal] Erro ao buscar categorias:', err))
          .finally(() => setLoadingCategorias(false));
      } else {
        console.warn('[RecorrenciaModal] userId não encontrado ao mudar tipo');
        setCategorias([]);
        setLoadingCategorias(false);
      }
    }
    if (open) {
      previousTipoRef.current = tipo;
    }
  }, [tipo, open]);

  useEffect(() => {
    if (open && !recorrencia) {
      setStatus(tipo === 'entrada' ? 'recebido' : 'pago');
    }
  }, [tipo, open, recorrencia]);

  const handleCategoriaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setClassificacao(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = parseFloat(valor.replace(',', '.'));
    if (!classificacao.trim()) {
      toast.error('Selecione uma categoria.');
      return;
    }
    if (Number.isNaN(v) || v <= 0) {
      toast.error('Valor deve ser maior que zero.');
      return;
    }
    if (diaDoMes < 1 || diaDoMes > 31) {
      toast.error('Dia do mês deve ser entre 1 e 31.');
      return;
    }
    onSave({
      dia_do_mes: diaDoMes,
      valor: v,
      classificacao: classificacao.trim(),
      tipo,
      status,
      obs: obs.trim() || undefined,
    });
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="planner-card p-8 w-full max-w-md relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Fechar"
          className="absolute top-3 right-3 text-slate-400 dark:text-slate-300"
          onClick={onClose}
        >
          ×
        </button>
        <h2 className="text-xl font-bold mb-4 dark:text-white">
          {recorrencia ? 'Editar recorrência' : 'Nova recorrência'}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Todo mês, no dia escolhido, um lançamento será criado automaticamente na lista de transações.
        </p>
        {error != null ? (
          <UserFacingErrorBlock
            {...mapUnknownErrorToUserFacing(error, {
              variant: 'modal_body',
              surfaceId: 'recorrencias.modal',
              className:
                'mb-4 mt-0 border-0 bg-transparent p-0 shadow-none dark:bg-transparent',
            })}
          />
        ) : null}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-2 font-medium dark:text-gray-200">Dia do mês (1–31)</label>
            <input
              type="number"
              min={1}
              max={31}
              className="planner-input-compact w-full"
              value={diaDoMes}
              onChange={(e) => setDiaDoMes(Number(e.target.value))}
              required
            />
          </div>
          <div>
            <label className="block mb-2 font-medium dark:text-gray-200">Tipo</label>
            <div className="flex gap-3">
              <button
                type="button"
                className={`planner-tab ${tipo === 'entrada' ? 'planner-tab-active bg-emerald-600' : ''}`}
                onClick={() => setTipo('entrada')}
              >
                Entrada
              </button>
              <button
                type="button"
                className={`planner-tab ${tipo === 'saída' ? 'planner-tab-active bg-rose-600' : ''}`}
                onClick={() => setTipo('saída')}
              >
                Saída
              </button>
            </div>
          </div>
          <div>
            <label className="block mb-2 font-medium dark:text-gray-200">Valor (R$)</label>
            <input
              type="text"
              inputMode="decimal"
              className="planner-input-compact w-full"
              value={valor}
              onChange={(e) => setValor(e.target.value.replace(/[^\d,.]/g, '').replace(',', '.'))}
              placeholder="0,00"
              required
            />
          </div>
          <div>
            <label className="block mb-2 font-medium dark:text-gray-200">Categoria</label>
            <select
              className="planner-input-compact w-full"
              value={classificacao}
              onChange={handleCategoriaChange}
              required
            >
              <option value="">Selecione uma categoria</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.nome}>
                  {cat.nome}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-2 font-medium dark:text-gray-200">Status do lançamento</label>
            <select
              className="planner-input-compact w-full"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value={tipo === 'entrada' ? 'recebido' : 'pago'}>
                {tipo === 'entrada' ? 'Recebido' : 'Pago'}
              </option>
              <option value={tipo === 'entrada' ? 'a_receber' : 'a_pagar'}>
                {tipo === 'entrada' ? 'A receber' : 'A pagar'}
              </option>
            </select>
          </div>
          <div>
            <label className="block mb-2 font-medium dark:text-gray-200">Observações (opcional)</label>
            <textarea
              className="planner-input-compact w-full min-h-[80px]"
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              placeholder="Observações"
              maxLength={500}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" className="planner-button-secondary flex-1" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="planner-button flex-1">
              {saving ? 'Salvando...' : recorrencia ? 'Salvar' : 'Criar recorrência'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
