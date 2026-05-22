import React, { useState, useEffect, useRef } from 'react';
import Fuse from 'fuse.js';
import { useTransactionStore } from '../store/transactionStore';
import { useAuthStore } from '../store/authStore';
import { fetchCategoriesByType } from '../services/categoryService';
import * as XLSX from 'xlsx';
import { AlertTriangle, Download, PlusCircle, Filter, List, Repeat, Pencil, Trash2, ChevronDown } from 'lucide-react';
import { toast } from '../lib/toast';
import PageShell from '../components/PageShell';
import PageTitle from '../components/PageTitle';
import EmptyState from '../components/EmptyState';
import LoadingOverlay from '../components/LoadingOverlay';
import FetchErrorBanner from '../components/FetchErrorBanner';
import UserFacingErrorBlock from '../components/UserFacingErrorBlock';
import { mapUnknownErrorToUserFacing, userFacingToastSummary } from '../lib/mapUnknownErrorToUserFacing';
import ButtonSpinner from '../components/ButtonSpinner';
import RecorrenciaModal from '../components/RecorrenciaModal';
import RecorrenciaDeleteModal from '../components/RecorrenciaDeleteModal';
import { useRecorrenciaStore } from '../store/recorrenciaStore';
import type { Recorrencia, CreateRecorrenciaInput, UpdateRecorrenciaInput } from '../services/recorrenciaService';

const meses = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

interface Categoria {
  id: number;
  nome: string;
  tipo: string;
}

type SortField = 'classificacao' | 'valor' | 'tipo' | 'data' | 'status' | 'obs';

// Função para formatar valor como moeda brasileira (recebe string de números)
const formatCurrency = (value: string): string => {
  if (!value) return '0,00';
  // Converte para número e divide por 100 para ter centavos
  const amount = parseFloat(value) / 100;
  // Formata como moeda brasileira
  return amount.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// Função para converter valor formatado de volta para número
const parseCurrency = (value: string): number => {
  const numbers = value.replace(/\D/g, '');
  if (!numbers) {
    console.warn('[parseCurrency] Valor vazio ou inválido:', value);
    return 0;
  }
  const parsedValue = parseFloat(numbers) / 100;
  console.log('[parseCurrency] Conversão:', { 
    input: value, 
    numbersOnly: numbers, 
    parsedValue 
  });
  return parsedValue;
};

function NovaTransacaoModal({
  open,
  onClose,
  onSave,
  saving,
  validationError,
  apiError,
  success
}: {
  open: boolean;
  onClose: () => void;
  onSave: (transacao: {
    tipo: 'entrada' | 'saída';
    valor: number;
    classificacao: string;
    data: string;
    status: string;
    obs?: string;
  }) => void;
  saving?: boolean;
  validationError?: string | null;
  apiError?: unknown | null;
  success?: boolean;
}) {
  const [tipo, setTipo] = useState<'entrada' | 'saída'>('saída');
  const [valor, setValor] = useState('');
  const [classificacao, setClassificacao] = useState('');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [obs, setObs] = useState('');
  const previousTipoRef = useRef<'entrada' | 'saída' | null>(null);

  // Resetar campos quando o modal abrir
  useEffect(() => {
    if (open) {
      // Resetar todos os campos quando o modal abrir
      setTipo('saída');
      setValor('');
      setClassificacao('');
      setData(new Date().toISOString().split('T')[0]);
      setObs('');
      setStatus('pago');
      
      // Resetar ref do tipo anterior
      previousTipoRef.current = null;
      
      // Buscar categorias iniciais (tipo padrão é 'saída')
      setLoading(true);
      const userId = useAuthStore.getState().userId;
      console.log('[NovaTransacaoModal] Modal aberto, userId:', userId);
      if (userId) {
        fetchCategoriesByType(userId, 'saída')
          .then((data) => {
            console.log('[NovaTransacaoModal] Categorias recebidas:', data);
            setCategorias(data);
          })
          .catch((error) => console.error('[NovaTransacaoModal] Erro ao buscar categorias:', error))
          .finally(() => setLoading(false));
      } else {
        console.warn('[NovaTransacaoModal] userId não encontrado');
        setCategorias([]);
        setLoading(false);
      }
    }
  }, [open]);

  // Buscar categorias quando o tipo mudar (não executa na primeira abertura ou quando modal fecha)
  useEffect(() => {
    if (open && previousTipoRef.current !== null && previousTipoRef.current !== tipo) {
      // Limpar categoria selecionada quando o tipo mudar
      setClassificacao('');
      
      // Buscar categorias do novo tipo
      setLoading(true);
      const userId = useAuthStore.getState().userId;
      console.log('[NovaTransacaoModal] Tipo mudou para:', tipo, 'userId:', userId);
      if (userId) {
        fetchCategoriesByType(userId, tipo)
          .then((data) => {
            console.log('[NovaTransacaoModal] Categorias recebidas para tipo', tipo, ':', data);
            setCategorias(data);
          })
          .catch((error) => console.error('[NovaTransacaoModal] Erro ao buscar categorias:', error))
          .finally(() => setLoading(false));
      } else {
        console.warn('[NovaTransacaoModal] userId não encontrado ao mudar tipo');
        setCategorias([]);
        setLoading(false);
      }
    }
    // Atualizar ref do tipo anterior
    if (open) {
      previousTipoRef.current = tipo;
    }
  }, [tipo, open]);

  useEffect(() => {
    setStatus(tipo === 'entrada' ? 'recebido' : 'pago');
  }, [tipo]);

  // Preencher classificacao automaticamente ao trocar categoria
  const handleCategoriaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setClassificacao(e.target.value);
  };

  const handleClose = () => {
    setTipo('saída');
    setValor('');
    setClassificacao('');
    setData(new Date().toISOString().split('T')[0]);
    setObs('');
    setStatus('pago');
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
      onClick={handleClose}
    >
      <div
        className="planner-card w-full max-w-md relative max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Fechar modal"
          className="absolute top-3 right-3 text-gray-400 dark:text-gray-300"
          onClick={handleClose}
        >
          ×
        </button>
        <div className="p-8 pb-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300">
            <PlusCircle size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold dark:text-white">Nova Transação</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Registre uma entrada ou saída rapidamente.</p>
          </div>
        </div>
        </div>
        {validationError ? (
          <div
            className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
            role="alert"
          >
            {validationError}
          </div>
        ) : null}
        {apiError != null ? (
          <UserFacingErrorBlock
            {...mapUnknownErrorToUserFacing(apiError, {
              variant: 'modal_body',
              surfaceId: 'transacoes.nova.modal',
              className:
                'mb-4 mt-0 border-0 bg-transparent p-0 shadow-none dark:bg-transparent',
            })}
          />
        ) : null}
        {success ? (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-200" role="alert">
            Transação salva com sucesso!
          </div>
        ) : null}
        <form
          className="px-8 pb-8 overflow-y-auto max-h-[calc(90vh-140px)]"
          onSubmit={(e) => {
          e.preventDefault();
          console.log('[NovaTransacaoModal] Form submit:', {
            valor,
            classificacao,
            data,
            tipo,
            status,
            obs
          });
          
          if (!valor || valor.trim() === '') {
            console.error('[NovaTransacaoModal] Valor não preenchido');
            return;
          }
          
          if (!classificacao || classificacao.trim() === '') {
            console.error('[NovaTransacaoModal] Classificação não preenchida');
            return;
          }
          
          if (!data) {
            console.error('[NovaTransacaoModal] Data não preenchida');
            return;
          }
          
          const parsedValue = parseCurrency(valor);
          console.log('[NovaTransacaoModal] Valor parseado:', { valor, parsedValue });
          
          if (parsedValue <= 0) {
            console.error('[NovaTransacaoModal] Valor parseado é zero ou negativo:', parsedValue);
            return;
          }
          
          onSave({
            tipo,
            valor: parsedValue,
            classificacao,
            data,
            status,
            obs: obs.trim() || undefined
          });
          // Limpar campos após salvar (será feito no handleSaveTransacao após sucesso)
        }}>
          <div className="space-y-4">
            <div>
            <label className="block mb-2 font-medium dark:text-gray-200">Tipo</label>
            <div className="flex gap-3">
              <button
                type="button"
                className={`planner-tab ${tipo === 'entrada' ? 'planner-tab-active bg-emerald-600' : ''}`}
                onClick={() => setTipo('entrada')}
              >Entrada</button>
              <button
                type="button"
                className={`planner-tab ${tipo === 'saída' ? 'planner-tab-active bg-rose-600' : ''}`}
                onClick={() => setTipo('saída')}
              >Saída</button>
            </div>
          </div>
          <div>
            <label className="block mb-2 font-medium dark:text-gray-200">Valor</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 dark:text-slate-400">R$</span>
              <input
                type="text"
                className="planner-input-compact pl-10"
                value={valor ? formatCurrency(valor) : ''}
                onChange={e => {
                  const rawValue = e.target.value.replace(/[^\d]/g, '');
                  setValor(rawValue);
                }}
                placeholder="0,00"
                required
              />
            </div>
          </div>
          <div>
            <label className="block mb-2 font-medium dark:text-gray-200">Categoria</label>
            <select
              className="planner-input-compact"
              value={classificacao}
              onChange={handleCategoriaChange}
              required
            >
              <option value="">Selecione uma categoria</option>
              {categorias.map(cat => (
                <option key={cat.id} value={cat.nome}>{cat.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-2 font-medium dark:text-gray-200">Data</label>
            <input
              type="date"
              className="planner-input-compact"
              value={data}
              onChange={e => setData(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block mb-2 font-medium dark:text-gray-200">Status</label>
            <select
              className="planner-input-compact"
              value={status}
              onChange={e => setStatus(e.target.value)}
              required
            >
              <option value={tipo === 'entrada' ? 'recebido' : 'pago'}>{tipo === 'entrada' ? 'Recebido' : 'Pago'}</option>
              <option value={tipo === 'entrada' ? 'a_receber' : 'a_pagar'}>{tipo === 'entrada' ? 'A Receber' : 'A Pagar'}</option>
            </select>
          </div>
          <div>
            <label className="block mb-2 font-medium dark:text-gray-200">Observações (opcional)</label>
            <textarea
              className="planner-input-compact min-h-[96px]"
              value={obs}
              onChange={e => {
                const value = e.target.value;
                if (value.length <= 500) {
                  setObs(value);
                }
              }}
              rows={3}
              maxLength={500}
              placeholder="Adicione observações sobre esta transação..."
            />
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{obs.length}/500 caracteres</div>
          </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className={`planner-button w-full ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {saving ? 'Salvando...' : 'Nova Transação'}
          </button>
        </form>
      </div>
    </div>
  );
}

function EditarTransacaoModal({
  open,
  onClose,
  transacao,
  onSave,
  apiError,
  saving,
}: {
  open: boolean;
  onClose: () => void;
  transacao: any;
  onSave: (transacao: any) => Promise<void>;
  apiError?: unknown | null;
  saving?: boolean;
}) {
  const [tipo, setTipo] = useState<'entrada' | 'saída'>(
    transacao?.tipo === 'saida' ? 'saída' : (transacao?.tipo || 'saída')
  );
  const [valor, setValor] = useState(transacao?.valor ? (transacao.valor * 100).toString() : '');
  const [classificacao, setClassificacao] = useState(transacao?.classificacao || '');
  const [data, setData] = useState(transacao?.data || (transacao?.criado_em ? new Date(transacao.criado_em).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]));
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [, setLoading] = useState(false);
  const [status, setStatus] = useState(transacao?.status || (transacao?.tipo === 'entrada' ? 'recebido' : 'pago'));
  const [obs, setObs] = useState(transacao?.obs || '');
  const previousTipoRef = useRef<'entrada' | 'saída' | null>(null);

  // Carregar dados da transação quando o modal abrir
  useEffect(() => {
    if (open && transacao) {
      // Atualizar estados com os dados da transação
      setTipo(transacao.tipo === 'saida' ? 'saída' : (transacao.tipo || 'saída'));
      setClassificacao(transacao.classificacao || '');
      setData(transacao.data || (transacao.criado_em ? new Date(transacao.criado_em).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]));
      setObs(transacao.obs || '');
      setStatus(transacao.status || (transacao.tipo === 'entrada' ? 'recebido' : 'pago'));
      
      // Inicializar valor convertendo para centavos (string de números)
      if (transacao.valor) {
        setValor((transacao.valor * 100).toString());
      } else {
        setValor('');
      }
      
      // Resetar ref do tipo anterior
      previousTipoRef.current = null;
      
      // Buscar categorias do tipo inicial da transação
      setLoading(true);
      const userId = useAuthStore.getState().userId;
      if (userId) {
        fetchCategoriesByType(userId, transacao.tipo || 'saída')
          .then((data) => setCategorias(data))
          .catch((error) => console.error('Erro ao buscar categorias:', error))
          .finally(() => setLoading(false));
      } else {
        setCategorias([]);
        setLoading(false);
      }
    }
  }, [open, transacao]);

  // Buscar categorias quando o tipo mudar (não executa na primeira abertura)
  useEffect(() => {
    if (open && transacao && previousTipoRef.current !== null && previousTipoRef.current !== tipo) {
      // Limpar categoria selecionada quando o tipo mudar
      setClassificacao('');
      
      // Buscar categorias do novo tipo
      setLoading(true);
      const userId = useAuthStore.getState().userId;
      if (userId) {
        fetchCategoriesByType(userId, tipo)
          .then((data) => {
            setCategorias(data);
            // Limpar categoria se não existir no novo tipo
            if (classificacao && !data.find(cat => cat.tipo === tipo && cat.nome === classificacao)) {
              setClassificacao('');
            }
          })
          .catch((error) => console.error('Erro ao buscar categorias:', error))
          .finally(() => setLoading(false));
      } else {
        setCategorias([]);
        setLoading(false);
      }
    }
    // Atualizar ref do tipo anterior
    if (open && transacao) {
      previousTipoRef.current = tipo;
    }
  }, [tipo, open, transacao, classificacao]);

  useEffect(() => {
    setStatus(tipo === 'entrada' ? 'recebido' : 'pago');
  }, [tipo]);

  const handleCategoriaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setClassificacao(e.target.value);
  };

  if (!open || !transacao) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="planner-card p-8 w-full max-w-md relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Fechar modal"
          className="absolute top-3 right-3 text-gray-400 dark:text-gray-300"
          onClick={onClose}
        >
          ×
        </button>
        <h2 className="text-xl font-bold mb-4 dark:text-white">Editar Transação</h2>
        {apiError != null ? (
          <UserFacingErrorBlock
            {...mapUnknownErrorToUserFacing(apiError, {
              variant: 'modal_body',
              surfaceId: 'transacoes.editar.modal',
              className:
                'mb-4 mt-0 border-0 bg-transparent p-0 shadow-none dark:bg-transparent',
            })}
          />
        ) : null}
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await onSave({
              ...transacao,
              tipo,
              valor: parseCurrency(valor),
              classificacao,
              data,
              status,
              obs: obs.trim() || undefined,
            });
          }}
        >
          <div className="mb-4">
            <label className="block mb-2 font-medium dark:text-gray-200">Tipo</label>
            <div className="flex gap-3">
              <button
                type="button"
                className={`planner-tab ${tipo === 'entrada' ? 'planner-tab-active bg-emerald-600' : ''}`}
                onClick={() => setTipo('entrada')}
              >Entrada</button>
              <button
                type="button"
                className={`planner-tab ${tipo === 'saída' ? 'planner-tab-active bg-rose-600' : ''}`}
                onClick={() => setTipo('saída')}
              >Saída</button>
            </div>
          </div>
          <div className="mb-4">
            <label className="block mb-2 font-medium dark:text-gray-200">Valor</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 dark:text-slate-400">R$</span>
              <input
                type="text"
                className="planner-input-compact pl-10"
                value={valor ? formatCurrency(valor) : ''}
                onChange={e => {
                  const rawValue = e.target.value.replace(/[^\d]/g, '');
                  setValor(rawValue);
                }}
                placeholder="0,00"
                required
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block mb-2 font-medium dark:text-gray-200">Categoria</label>
            <select
              className="planner-input-compact"
              value={classificacao}
              onChange={handleCategoriaChange}
              required
            >
              <option value="">Selecione uma categoria</option>
              {categorias.map(cat => (
                <option key={cat.id} value={cat.nome}>{cat.nome}</option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block mb-2 font-medium dark:text-gray-200">Data</label>
            <input
              type="date"
              className="planner-input-compact"
              value={data}
              onChange={e => setData(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block mb-2 font-medium dark:text-gray-200">Status</label>
            <select
              className="planner-input-compact"
              value={status}
              onChange={e => setStatus(e.target.value)}
              required
            >
              <option value={tipo === 'entrada' ? 'recebido' : 'pago'}>{tipo === 'entrada' ? 'Recebido' : 'Pago'}</option>
              <option value={tipo === 'entrada' ? 'a_receber' : 'a_pagar'}>{tipo === 'entrada' ? 'A Receber' : 'A Pagar'}</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block mb-2 font-medium dark:text-gray-200">Observações (opcional)</label>
            <textarea
              className="planner-input-compact min-h-[96px]"
              value={obs}
              onChange={e => {
                const value = e.target.value;
                if (value.length <= 500) {
                  setObs(value);
                }
              }}
              rows={3}
              maxLength={500}
              placeholder="Adicione observações sobre esta transação..."
            />
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{obs.length}/500 caracteres</div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className={`planner-button w-full ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </form>
      </div>
    </div>
  );
}

function ExcluirTransacaoModal({
  open,
  onClose,
  transacao,
  onDelete,
  localError,
  apiError,
  loading
}: {
  open: boolean;
  onClose: () => void;
  transacao: any;
  onDelete: (id: any) => void;
  localError?: string | null;
  apiError?: unknown | null;
  loading?: boolean;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !transacao) return;
    const firstFocusable = dialogRef.current?.querySelector<HTMLElement>(
      'button[type="button"]:not([disabled]), [href], input, select, textarea, button:not([disabled])'
    );
    firstFocusable?.focus();
  }, [open, transacao]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [open, onClose]);

  if (!open || !transacao) return null;
  const tipoLabel = transacao.tipo === 'saida' ? 'saída' : transacao.tipo;
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="excluir-transacao-title"
        className="planner-card p-8 w-full max-w-md relative focus-ring"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
      >
        <button
          type="button"
          aria-label="Fechar modal"
          className="absolute top-3 right-3 text-gray-400 dark:text-gray-300 focus-ring rounded"
          onClick={onClose}
        >
          ×
        </button>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-300">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h2 id="excluir-transacao-title" className="text-xl font-bold text-red-600 dark:text-red-400">Confirmar Exclusão</h2>
          </div>
        </div>
        {localError ? (
          <div
            className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
            role="alert"
          >
            {localError}
          </div>
        ) : null}
        {apiError != null ? (
          <UserFacingErrorBlock
            {...mapUnknownErrorToUserFacing(apiError, {
              variant: 'modal_body',
              surfaceId: 'transacoes.excluir.modal',
              className:
                'mb-4 mt-0 border-0 bg-transparent p-0 shadow-none dark:bg-transparent',
            })}
          />
        ) : null}
        <div className="mb-4 rounded-xl border border-slate-200/70 bg-slate-100/70 p-4 text-sm text-slate-700 dark:border-slate-800/70 dark:bg-slate-900/50 dark:text-slate-200">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
            <dt className="font-medium text-gray-500 dark:text-gray-400">Tipo</dt>
            <dd className="text-right font-semibold text-gray-900 dark:text-gray-100">{tipoLabel}</dd>
            <dt className="font-medium text-gray-500 dark:text-gray-400">Valor</dt>
            <dd className="text-right font-semibold text-gray-900 dark:text-gray-100">
              {transacao.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </dd>
            <dt className="font-medium text-gray-500 dark:text-gray-400">Categoria</dt>
            <dd className="text-right font-semibold text-gray-900 dark:text-gray-100">{transacao.classificacao}</dd>
            <dt className="font-medium text-gray-500 dark:text-gray-400">Data</dt>
            <dd className="text-right font-semibold text-gray-900 dark:text-gray-100">
              {new Date(transacao.criado_em).toLocaleDateString()}
            </dd>
          </dl>
          {transacao.obs ? (
            <div className="mt-3 border-t border-gray-200 pt-3 text-gray-600 dark:border-gray-700 dark:text-gray-300">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Observações</div>
              <div className="mt-1 text-sm">{transacao.obs}</div>
            </div>
          ) : null}
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            className="flex-1 planner-button-danger"
            disabled={!!loading}
            onClick={() => onDelete(transacao.id)}
          >
            {loading ? (
              <>
                <ButtonSpinner size={18} />
                Excluindo...
              </>
            ) : (
              'Sim, excluir'
            )}
          </button>
          <button
            type="button"
            className="flex-1 planner-button-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!!loading}
            onClick={onClose}
          >
            Não
          </button>
        </div>
      </div>
    </div>
  );
}

const formatValorRec = (v: number) =>
  Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function Transactions() {
  const {
    transactions,
    deleteTransaction,
    addTransaction,
    updateTransaction,
    fetchTransactions,
    loading: transactionsLoading,
    error: transactionsError,
  } = useTransactionStore();
  const {
    recorrencias,
    fetchRecorrencias,
    addRecorrencia,
    updateRecorrencia,
    removeRecorrencia,
  } = useRecorrenciaStore();
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState('Esse mês');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [aplicarFiltroDatas, setAplicarFiltroDatas] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [tipoFiltro, setTipoFiltro] = useState<'normal' | 'receita' | 'despesa'>('normal');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchFields, setSearchFields] = useState({
    classificacao: true,
    obs: true,
    status: true,
    valor: true,
  });
  const [sortConfig, setSortConfig] = useState<{ field: SortField | null; direction: 'asc' | 'desc' }>({
    field: null,
    direction: 'asc',
  });

  // Estado para mês/ano selecionado
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  // Pull-to-refresh
  useEffect(() => {
    let lastScrollTop = 0;
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      if (scrollTop === 0 && lastScrollTop === 0 && !isRefreshing) {
        setIsRefreshing(true);
        fetchTransactions().finally(() => {
          setTimeout(() => setIsRefreshing(false), 500);
        });
      }
      lastScrollTop = scrollTop;
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [fetchTransactions, isRefreshing]);

  useEffect(() => {
    void fetchRecorrencias();
  }, [fetchRecorrencias]);

  useEffect(() => {
    void fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    if (dateRange.start && dateRange.end) {
      setAplicarFiltroDatas(true);
    } else if (!dateRange.start && !dateRange.end) {
      setAplicarFiltroDatas(false);
    }
  }, [dateRange.start, dateRange.end]);

  // Função para checar se a data está na semana atual
  function isInCurrentWeek(date: Date) {
    const now = new Date();
    const first = now.getDate() - now.getDay();
    const last = first + 6;
    const firstDay = new Date(now.setDate(first));
    const lastDay = new Date(now.setDate(last));
    firstDay.setHours(0,0,0,0);
    lastDay.setHours(23,59,59,999);
    return date >= firstDay && date <= lastDay;
  }

  // Função para checar se a data é de hoje
  function isToday(date: Date) {
    const now = new Date();
    return date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }

  const normalizeSortText = (value: unknown) =>
    (value ?? '')
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

  const handleToggleSearchField = (field: keyof typeof searchFields) => {
    setSearchFields((prev) => {
      const next = { ...prev, [field]: !prev[field] };
      // Garante que sempre exista pelo menos um campo selecionado
      if (!Object.values(next).some(Boolean)) {
        return prev;
      }
      return next;
    });
  };

  const handleSort = (field: SortField) => {
    setSortConfig((prev) => {
      if (prev.field === field) {
        // Ciclo: asc -> desc -> padrão (sem ordenação)
        if (prev.direction === 'asc') {
          return {
            field,
            direction: 'desc',
          };
        }
        if (prev.direction === 'desc') {
          return {
            field: null,
            direction: 'asc',
          };
        }
      }
      return {
        field,
        direction: 'asc',
      };
    });
  };

  // Filtro de busca, período e tipo (Normal/Receita/Despesas)
  const filteredByPeriod = transactions.filter(t => {
    const data = t.data ? new Date(`${t.data}T00:00:00-03:00`) : new Date(t.criado_em);
    let periodoOk = false;
    if (aplicarFiltroDatas && dateRange.start && dateRange.end) {
      // Filtro por intervalo de datas
      const start = new Date(`${dateRange.start}T00:00:00-03:00`);
      const end = new Date(`${dateRange.end}T23:59:59-03:00`);
      periodoOk = data >= start && data <= end;
    } else if (period === 'Essa semana') {
      periodoOk = isInCurrentWeek(data);
    } else if (period === 'Esse mês') {
      periodoOk = data.getMonth() === selectedMonth && data.getFullYear() === selectedYear;
    } else if (period === 'Hoje') {
      periodoOk = isToday(data);
    } else {
      periodoOk = data.getMonth() === selectedMonth && data.getFullYear() === selectedYear;
    }
    if (!periodoOk) return false;

    // Filtro por tipo (Normal / Receita / Despesas)
    if (tipoFiltro !== 'normal') {
      const tipoRaw = t.tipo;
      const tipoNormalizado = tipoRaw === 'saida' ? 'saída' : tipoRaw;
      if (tipoFiltro === 'receita' && tipoNormalizado !== 'entrada') return false;
      if (tipoFiltro === 'despesa' && tipoNormalizado !== 'saída') return false;
    }

    return true;
  });

  let filtered = filteredByPeriod;

  if (search.trim()) {
    const normalizeText = (value: unknown) =>
      (value ?? '')
        .toString()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();

    const normalizedSearch = normalizeText(search);

    const activeTextKeys: Array<'classificacao' | 'obs' | 'status'> = [];
    if (searchFields.classificacao) activeTextKeys.push('classificacao');
    if (searchFields.obs) activeTextKeys.push('obs');
    if (searchFields.status) activeTextKeys.push('status');

    let fuzzyResults: typeof filteredByPeriod = [];
    if (activeTextKeys.length > 0) {
      // Fuzzy search para textos selecionados, já normalizados (sem acento, minúsculo)
      const fuse = new Fuse(filteredByPeriod, {
        keys: activeTextKeys,
        threshold: 0.4,
        ignoreLocation: true,
        getFn: (obj: any, path: string) => normalizeText(obj[path])
      });

      fuzzyResults = fuse.search(normalizedSearch).map(result => result.item);
    }

    // Match direto por "includes" (acento-insensitive), para casos como "me" → "médico"
    let directTextResults: typeof filteredByPeriod = [];
    if (activeTextKeys.length > 0) {
      directTextResults = filteredByPeriod.filter((t) =>
        activeTextKeys.some((key) =>
          normalizeText((t as any)[key]).includes(normalizedSearch)
        )
      );
    }

    // Busca numérica por valor (aceita "100", "100,00", "1.000,00", "R$ 100,00", etc.)
    const numericQuery = search.trim().replace(/[^\d]/g, '');
    let numericResults: typeof filteredByPeriod = [];

    if (searchFields.valor && numericQuery) {
      const searchInt = parseInt(numericQuery, 10);
      if (!Number.isNaN(searchInt)) {
        numericResults = filteredByPeriod.filter((t) => {
          if (typeof t.valor !== 'number') return false;
          // Trabalhar em centavos para manter precisão e comparar por "contém"
          const valorCents = Math.round(t.valor * 100);
          return String(valorCents).includes(String(searchInt));
        });
      }
    }

    // Unir resultados textuais (fuzzy + includes) e numéricos sem duplicar (usa id como chave)
    const byId = new Map<any, (typeof filteredByPeriod)[number]>();
    [...fuzzyResults, ...directTextResults, ...numericResults].forEach((item) => {
      byId.set(item.id, item);
    });

    filtered = Array.from(byId.values());
  }

  if (sortConfig.field) {
    const { field, direction } = sortConfig;
    const multiplier = direction === 'asc' ? 1 : -1;

    filtered = [...filtered].sort((a, b) => {
      if (field === 'valor') {
        const av = typeof a.valor === 'number' ? a.valor : 0;
        const bv = typeof b.valor === 'number' ? b.valor : 0;
        if (av === bv) return 0;
        return av < bv ? -1 * multiplier : 1 * multiplier;
      }

      if (field === 'data') {
        const ad = a.data ? new Date(`${a.data}T00:00:00-03:00`) : new Date(a.criado_em);
        const bd = b.data ? new Date(`${b.data}T00:00:00-03:00`) : new Date(b.criado_em);
        const at = ad.getTime();
        const bt = bd.getTime();
        if (at === bt) return 0;
        return at < bt ? -1 * multiplier : 1 * multiplier;
      }

      const av = normalizeSortText((a as any)[field]);
      const bv = normalizeSortText((b as any)[field]);
      if (av === bv) return 0;
      return av < bv ? -1 * multiplier : 1 * multiplier;
    });
  }

  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTransacao, setEditingTransacao] = useState<any>(null);
  const [editSaveApiError, setEditSaveApiError] = useState<unknown | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingTransacao, setDeletingTransacao] = useState<any>(null);
  const [deleteLocalError, setDeleteLocalError] = useState<string | null>(null);
  const [deleteApiError, setDeleteApiError] = useState<unknown | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState(false);
  const [savingTransaction, setSavingTransaction] = useState(false);
  const [saveValidationError, setSaveValidationError] = useState<string | null>(null);
  const [saveApiError, setSaveApiError] = useState<unknown | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [recModalOpen, setRecModalOpen] = useState(false);
  const [recEditing, setRecEditing] = useState<Recorrencia | null>(null);
  const [recSaving, setRecSaving] = useState(false);
  const [recSaveApiError, setRecSaveApiError] = useState<unknown | null>(null);
  const [recDeleteModalOpen, setRecDeleteModalOpen] = useState(false);
  const [recDeleting, setRecDeleting] = useState<Recorrencia | null>(null);
  const [recDeletingInProgress, setRecDeletingInProgress] = useState(false);

  const [recMenu, setRecMenu] = useState<{ open: boolean; source: 'desktop' | 'mobile' | null }>({
    open: false,
    source: null,
  });
  const recMenuDesktopRef = useRef<HTMLDivElement>(null);
  const recMenuMobileRef = useRef<HTMLDivElement>(null);

  const closeRecMenu = () => setRecMenu({ open: false, source: null });

  const toggleRecMenu = (source: 'desktop' | 'mobile') => {
    setRecMenu((m) => {
      if (m.open && m.source === source) return { open: false, source: null };
      return { open: true, source };
    });
  };

  useEffect(() => {
    if (!recMenu.open) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      const t = e.target as Node;
      if (recMenuDesktopRef.current?.contains(t) || recMenuMobileRef.current?.contains(t)) return;
      closeRecMenu();
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [recMenu.open]);

  useEffect(() => {
    if (!recMenu.open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRecMenu();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [recMenu.open]);

  const handleSaveTransacao = async (transacao: { tipo: 'entrada' | 'saída', valor: number, classificacao: string, data: string, status: string, obs?: string }) => {
    console.log('[Transactions] Iniciando salvamento de transação:', {
      tipo: transacao.tipo,
      valor: transacao.valor,
      classificacao: transacao.classificacao,
      data: transacao.data,
      status: transacao.status,
      obs: transacao.obs
    });

    // Validar dados antes de enviar
    if (!transacao.valor || transacao.valor <= 0) {
      const errorMsg = 'O valor deve ser maior que zero';
      console.error('[Transactions] Erro de validação:', errorMsg);
      setSaveApiError(null);
      setSaveValidationError(errorMsg);
      setTimeout(() => setSaveValidationError(null), 5000);
      return;
    }

    if (!transacao.classificacao || transacao.classificacao.trim() === '') {
      const errorMsg = 'A categoria é obrigatória';
      console.error('[Transactions] Erro de validação:', errorMsg);
      setSaveApiError(null);
      setSaveValidationError(errorMsg);
      setTimeout(() => setSaveValidationError(null), 5000);
      return;
    }

    if (!transacao.data) {
      const errorMsg = 'A data é obrigatória';
      console.error('[Transactions] Erro de validação:', errorMsg);
      setSaveApiError(null);
      setSaveValidationError(errorMsg);
      setTimeout(() => setSaveValidationError(null), 5000);
      return;
    }

    setSavingTransaction(true);
    setSaveValidationError(null);
    setSaveApiError(null);
    setSaveSuccess(false);

    try {
      console.log('[Transactions] Chamando addTransaction do store...');
      const result = await addTransaction(transacao);

      if (result?.error) {
        console.error('[Transactions] ❌ Erro ao salvar transação:', result.error);
        setSaveApiError(result.error);
        setSavingTransaction(false);
        return;
      }

      console.log('[Transactions] ✅ Transação salva com sucesso na tabela lancamentos_id:', result?.data || transacao);

      setSaveSuccess(true);
      setTimeout(() => {
        setModalOpen(false);
        setSaveSuccess(false);
        setSavingTransaction(false);
      }, 1500);
    } catch (error: unknown) {
      console.error('[Transactions] ❌ Erro ao salvar transação:', {
        error,
        transacao
      });
      setSaveApiError(error);
      setSavingTransaction(false);
    }
  };

  const handleEditTransacao = (transacao: any) => {
    setEditingTransacao(transacao);
    setEditSaveApiError(null);
    setEditModalOpen(true);
  };

  const handleSaveEditTransacao = async (transacao: any) => {
    const transacaoAtualizada = { ...transacao, classificacao: transacao.classificacao };
    setEditSaving(true);
    setEditSaveApiError(null);
    try {
      const result = await updateTransaction(transacao.id, transacaoAtualizada);
      if (result?.error) {
        console.error('Erro ao atualizar lançamento:', result.error);
        setEditSaveApiError(result.error);
        toast.error(
          userFacingToastSummary(result.error, 'Não foi possível atualizar a transação.')
        );
        return;
      }
      setEditModalOpen(false);
      setEditingTransacao(null);
      setEditSaveApiError(null);
    } catch (err: unknown) {
      console.error('Erro ao atualizar lançamento:', err);
      setEditSaveApiError(err);
      toast.error(
        userFacingToastSummary(err, 'Não foi possível atualizar a transação.')
      );
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeleteTransacao = (transacao: any) => {
    setDeletingTransacao(transacao);
    setDeleteLocalError(null);
    setDeleteApiError(null);
    setDeleteModalOpen(true);
  };

  const handleConfirmDeleteTransacao = async (id: any) => {
    setDeletingTransaction(true);
    setDeleteLocalError(null);
    setDeleteApiError(null);
    if (!id) {
      const errorMsg = 'ID da transação inválido.';
      setDeleteLocalError(errorMsg);
      toast.error(userFacingToastSummary(new Error(errorMsg), errorMsg));
      setDeletingTransaction(false);
      return;
    }
    const result = await deleteTransaction(id);
    console.log('Resultado da exclusão Supabase:', result);
    if (result?.error) {
      setDeleteApiError(result.error);
      toast.error(
        userFacingToastSummary(result.error, 'Não foi possível excluir a transação.')
      );
      setDeletingTransaction(false);
      return;
    }
    setDeletingTransaction(false);
    setDeleteModalOpen(false);
    setDeletingTransacao(null);
    setDeleteLocalError(null);
    setDeleteApiError(null);
    toast.success('Transação excluída com sucesso.');
  };

  const handleSaveRecorrencia = async (payload: CreateRecorrenciaInput | UpdateRecorrenciaInput) => {
    setRecSaveApiError(null);
    setRecSaving(true);
    try {
      if (recEditing) {
        const result = await updateRecorrencia(recEditing.id, payload as UpdateRecorrenciaInput);
        if (result.error) {
          setRecSaveApiError(result.error);
          return;
        }
        toast.success('Recorrência atualizada.');
      } else {
        const result = await addRecorrencia(payload as CreateRecorrenciaInput);
        if (result.error) {
          setRecSaveApiError(result.error);
          return;
        }
        toast.success('Recorrência criada. O lançamento será gerado no dia marcado de cada mês.');
      }
      setRecModalOpen(false);
      setRecEditing(null);
    } finally {
      setRecSaving(false);
    }
  };

  const handleConfirmDeleteRecorrencia = async () => {
    if (!recDeleting) return;
    setRecDeletingInProgress(true);
    try {
      const result = await removeRecorrencia(recDeleting.id);
      if (result.error) {
        toast.error(
          userFacingToastSummary(result.error, 'Não foi possível remover a recorrência.')
        );
        return;
      }
      toast.success('Recorrência removida.');
      setRecDeleteModalOpen(false);
      setRecDeleting(null);
    } finally {
      setRecDeletingInProgress(false);
    }
  };

  const tipoLabelRec = (t: string) => (t === 'entrada' ? 'Entrada' : 'Saída');

  const openNewRecorrenciaFromMenu = () => {
    setRecEditing(null);
    setRecSaveApiError(null);
    setRecModalOpen(true);
    closeRecMenu();
  };

  const renderRecorrenciasPanel = (variant: 'desktop' | 'mobile') => (
    <div
      role="dialog"
      aria-label="Modelos recorrentes"
      className={
        variant === 'desktop'
          ? 'absolute right-0 top-full z-50 mt-2 w-[min(24rem,calc(100vw-2rem))] rounded-xl border border-slate-200/70 bg-white shadow-soft dark:border-slate-800/70 dark:bg-slate-900'
          : 'absolute left-0 right-0 top-full z-50 mt-2 rounded-xl border border-slate-200/70 bg-white shadow-soft dark:border-slate-800/70 dark:bg-slate-900'
      }
    >
      <div className="max-h-[min(70vh,28rem)] overflow-y-auto p-4">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <div>
            <h4 className="text-sm font-semibold text-slate-800 dark:text-white">
              Modelos recorrentes
              {recorrencias.length > 0 ? (
                <span className="ml-1.5 font-normal text-slate-500 dark:text-slate-400">({recorrencias.length})</span>
              ) : null}
            </h4>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Receitas ou despesas que entram todo mês no dia escolhido (ex.: dia 5, R$ 50).
            </p>
          </div>
        </div>
        <button
          type="button"
          className="planner-button mb-4 inline-flex w-full items-center justify-center gap-2 sm:w-auto"
          onClick={openNewRecorrenciaFromMenu}
        >
          <Repeat size={18} />
          Nova recorrência
        </button>
        {!recorrencias.length ? (
          <div
            className="rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6 text-center dark:border-slate-700 dark:bg-slate-900/40"
            role="region"
            aria-label="Nenhum modelo recorrente"
          >
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300">
              <Repeat size={24} aria-hidden />
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-white">Nenhum modelo recorrente</p>
            <p className="mx-auto mt-1.5 max-w-sm text-xs text-slate-500 dark:text-slate-400">
              Crie um modelo para gerar lançamentos automaticamente (Netflix, aluguel, etc.).
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {recorrencias.map((r) => {
              const isEntrada = r.tipo === 'entrada';
              const tipoRing = isEntrada
                ? 'ring-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                : 'ring-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300';
              const bar = isEntrada ? 'bg-emerald-500' : 'bg-rose-500';
              return (
                <li
                  key={r.id}
                  className="planner-card-muted relative flex flex-wrap items-center justify-between gap-2 overflow-hidden rounded-lg border border-slate-200/70 p-3 pl-4 dark:border-slate-700/70"
                >
                  <span className={`absolute left-0 top-0 bottom-0 w-1 ${bar}`} aria-hidden title={tipoLabelRec(r.tipo)} />
                  <div className="flex min-w-0 items-center gap-2 pl-0 sm:pl-1">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-2 ${tipoRing}`}
                      aria-hidden
                    >
                      <Repeat size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium dark:text-white">{r.classificacao}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Todo dia <span className="font-medium text-slate-700 dark:text-slate-300">{r.dia_do_mes}</span>
                        {' · '}
                        <span className={isEntrada ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                          {tipoLabelRec(r.tipo)}
                        </span>
                        {' · '}
                        R$ {formatValorRec(r.valor)}
                        {!r.ativo && ' · Inativa'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-label="Editar recorrência"
                      className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:outline focus-visible:ring-2 focus-visible:ring-blue-500"
                      onClick={() => {
                        setRecEditing(r);
                        setRecSaveApiError(null);
                        setRecModalOpen(true);
                        closeRecMenu();
                      }}
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      type="button"
                      aria-label="Excluir recorrência"
                      className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 focus-visible:outline focus-visible:ring-2 focus-visible:ring-red-500"
                      onClick={() => {
                        setRecDeleting(r);
                        setRecDeleteModalOpen(true);
                        closeRecMenu();
                      }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );

  const exportToExcel = () => {
    // Preparar dados formatados para Excel
    const dadosFormatados = filtered.map((t) => {
      // Formatar data
      let dataFormatada = '';
      if (t.data) {
        const dataObj = new Date(t.data + 'T00:00:00-03:00');
        dataFormatada = dataObj.toLocaleDateString('pt-BR');
      } else if (t.criado_em) {
        const dataObj = new Date(t.criado_em);
        dataFormatada = dataObj.toLocaleDateString('pt-BR');
      }

      // Formatar valor monetário
      const valorFormatado = t.valor.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      });

      // Formatar tipo
      const tipoFormatado = t.tipo === 'entrada' ? 'RECEITA' : 'DESPESA';

      // Formatar status
      const statusFormatado = t.status === 'recebido' ? 'Recebido' :
                              t.status === 'pago' ? 'Pago' :
                              t.status === 'a_receber' ? 'A Receber' :
                              t.status === 'a_pagar' ? 'A Pagar' : t.status;

      return {
        'Descrição': t.classificacao || '',
        'Valor': valorFormatado,
        'Tipo': tipoFormatado,
        'Data': dataFormatada,
        'Status': statusFormatado,
        'Observações': t.obs || '-'
      };
    });

    // Criar workbook e worksheet
    const worksheet = XLSX.utils.json_to_sheet(dadosFormatados);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transações');

    // Ajustar largura das colunas
    const colWidths = [
      { wch: 30 }, // Descrição
      { wch: 15 }, // Valor
      { wch: 12 }, // Tipo
      { wch: 12 }, // Data
      { wch: 15 }, // Status
      { wch: 40 }  // Observações
    ];
    worksheet['!cols'] = colWidths;

    // Gerar nome do arquivo com data atual
    const hoje = new Date();
    const dataStr = hoje.toISOString().split('T')[0];
    const nomeArquivo = `transacoes_${dataStr}.xlsx`;

    // Fazer download do arquivo
    XLSX.writeFile(workbook, nomeArquivo);
  };

  return (
    <>
      <NovaTransacaoModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSaveValidationError(null);
          setSaveApiError(null);
          setSaveSuccess(false);
          setSavingTransaction(false);
        }}
        onSave={handleSaveTransacao}
        saving={savingTransaction}
        validationError={saveValidationError}
        apiError={saveApiError}
        success={saveSuccess}
      />
      <EditarTransacaoModal
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingTransacao(null);
          setEditSaveApiError(null);
          setEditSaving(false);
        }}
        transacao={editingTransacao}
        onSave={handleSaveEditTransacao}
        apiError={editSaveApiError}
        saving={editSaving}
      />
      <ExcluirTransacaoModal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeleteLocalError(null);
          setDeleteApiError(null);
        }}
        transacao={deletingTransacao}
        onDelete={handleConfirmDeleteTransacao}
        localError={deleteLocalError}
        apiError={deleteApiError}
        loading={deletingTransaction}
      />

      <RecorrenciaModal
        open={recModalOpen}
        onClose={() => {
          setRecModalOpen(false);
          setRecEditing(null);
          setRecSaveApiError(null);
        }}
        onSave={handleSaveRecorrencia}
        recorrencia={recEditing}
        saving={recSaving}
        error={recSaveApiError}
      />
      <RecorrenciaDeleteModal
        open={recDeleteModalOpen}
        recorrencia={recDeleting}
        onClose={() => setRecDeleteModalOpen(false)}
        onConfirm={handleConfirmDeleteRecorrencia}
        loading={recDeletingInProgress}
      />

      <PageShell>
      <PageTitle>Transações</PageTitle>

      {transactionsError ? (
        <FetchErrorBanner
          error={transactionsError}
          surfaceId="transacoes.list"
          onRetry={() => void fetchTransactions()}
        />
      ) : null}

      {/* Header e busca - Mobile */}
      <div className="mb-4 md:mb-6">
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Pesquisar receitas ou gastos"
            className="planner-input pr-11"
            value={search}
            onChange={e=>setSearch(e.target.value)}
          />
          <button
            type="button"
            aria-label="Filtrar campos de pesquisa"
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200"
            onClick={() => setIsFilterOpen(prev => !prev)}
          >
            <Filter size={18} />
          </button>
          {isFilterOpen && (
            <div className="absolute right-0 top-11 z-50 w-64 rounded-xl border border-slate-200/70 bg-white shadow-soft dark:border-slate-800/70 dark:bg-slate-900">
              <div className="px-4 py-3 border-b border-slate-200/60 dark:border-slate-800/60">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Campos para pesquisar
                </p>
              </div>
              <div className="px-4 py-3 space-y-2 text-sm text-slate-700 dark:text-slate-200">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    checked={searchFields.classificacao}
                    onChange={() => handleToggleSearchField('classificacao')}
                  />
                  <span>Descrição</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    checked={searchFields.obs}
                    onChange={() => handleToggleSearchField('obs')}
                  />
                  <span>Observações</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    checked={searchFields.status}
                    onChange={() => handleToggleSearchField('status')}
                  />
                  <span>Status</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    checked={searchFields.valor}
                    onChange={() => handleToggleSearchField('valor')}
                  />
                  <span>Valor</span>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filtros - Desktop */}
      <div className="hidden md:flex items-center gap-4 mb-6 relative">
        <button
          className="planner-button-secondary flex items-center gap-2 text-base md:text-lg"
          onClick={() => setShowMonthPicker(true)}
        >
          <span>←</span>
          {meses[selectedMonth]} {selectedYear}
        </button>
        {showMonthPicker && (
          <div className="absolute left-0 top-16 planner-card p-4 z-50 w-72">
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setSelectedYear(y => y - 1)} className="planner-tab">◀</button>
              <span className="font-bold text-lg dark:text-white">{selectedYear}</span>
              <button onClick={() => setSelectedYear(y => y + 1)} className="planner-tab">▶</button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {meses.map((mes, idx) => (
                <button
                  key={mes}
                  className={`${idx === selectedMonth && selectedYear === now.getFullYear() ? 'planner-tab planner-tab-active' : 'planner-tab'} justify-center`}
                  onClick={() => {
                    setSelectedMonth(idx);
                    setShowMonthPicker(false);
                  }}
                >
                  {mes}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="flex gap-2 ml-auto">
          <button onClick={() => { setPeriod('Essa semana'); setAplicarFiltroDatas(false); setDateRange({ start: '', end: '' }); }} className={period==='Essa semana' ? 'planner-tab planner-tab-active' : 'planner-tab'}>Essa semana</button>
          <button onClick={() => { setPeriod('Esse mês'); setAplicarFiltroDatas(false); setDateRange({ start: '', end: '' }); }} className={period==='Esse mês' ? 'planner-tab planner-tab-active' : 'planner-tab'}>Esse mês</button>
          <button onClick={() => { setPeriod('Hoje'); setAplicarFiltroDatas(false); setDateRange({ start: '', end: '' }); }} className={period==='Hoje' ? 'planner-tab planner-tab-active' : 'planner-tab'}>Hoje</button>
          <input type="date" className="planner-input-compact" value={dateRange.start} onChange={e=>setDateRange({...dateRange, start: e.target.value})} />
          <span className="text-slate-400 dark:text-slate-400">até</span>
          <input type="date" className="planner-input-compact" value={dateRange.end} onChange={e=>setDateRange({...dateRange, end: e.target.value})} />
          <button className="planner-button-secondary-compact" onClick={e => { e.preventDefault(); setDateRange({ start: '', end: '' }); setAplicarFiltroDatas(false); }}>Limpar</button>
        </div>
      </div>

      <div className="planner-card p-4 md:p-6 relative">
        {/* Filtro por tipo (Normal / Receita / Despesas) */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Tipo
          </span>
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setTipoFiltro('normal')}
              className={tipoFiltro === 'normal' ? 'planner-tab planner-tab-active' : 'planner-tab'}
            >
              Normal
            </button>
            <button
              type="button"
              onClick={() => setTipoFiltro('receita')}
              className={
                tipoFiltro === 'receita'
                  ? 'planner-tab planner-tab-active bg-emerald-600 text-white'
                  : 'planner-tab'
              }
            >
              Receitas
            </button>
            <button
              type="button"
              onClick={() => setTipoFiltro('despesa')}
              className={
                tipoFiltro === 'despesa'
                  ? 'planner-tab planner-tab-active bg-rose-600 text-white'
                  : 'planner-tab'
              }
            >
              Despesas
            </button>
            </div>
          </div>
        </div>

        {/* Ações (desktop) - no fluxo para evitar sobreposição com tabela */}
        <div className="hidden md:flex items-center justify-end gap-2 mb-4">
          <button
            className="planner-button-secondary flex items-center gap-2"
            onClick={exportToExcel}
          >
            <Download size={18} />
            Exportar Excel
          </button>
          <button
            className="planner-button"
            onClick={() => { setSaveValidationError(null); setSaveApiError(null); setModalOpen(true); }}
          >
            + Nova Transação
          </button>
        </div>

        {transactionsLoading && transactions.length === 0 ? (
          <LoadingOverlay message="Carregando transações…" className="min-h-[280px]" />
        ) : (
          <>
        {/* Tabela desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-gray-700 dark:text-gray-200">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700">
                <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-100">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400"
                    onClick={() => handleSort('classificacao')}
                  >
                    Descrição
                    {sortConfig.field === 'classificacao' && (
                      <span className="text-xs">
                        {sortConfig.direction === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-100">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400"
                    onClick={() => handleSort('valor')}
                  >
                    Valor
                    {sortConfig.field === 'valor' && (
                      <span className="text-xs">
                        {sortConfig.direction === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-100">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400"
                    onClick={() => handleSort('tipo')}
                  >
                    Tipo
                    {sortConfig.field === 'tipo' && (
                      <span className="text-xs">
                        {sortConfig.direction === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-100">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400"
                    onClick={() => handleSort('data')}
                  >
                    Data
                    {sortConfig.field === 'data' && (
                      <span className="text-xs">
                        {sortConfig.direction === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-100">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400"
                    onClick={() => handleSort('status')}
                  >
                    Status
                    {sortConfig.field === 'status' && (
                      <span className="text-xs">
                        {sortConfig.direction === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-100">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400"
                    onClick={() => handleSort('obs')}
                  >
                    Observações
                    {sortConfig.field === 'obs' && (
                      <span className="text-xs">
                        {sortConfig.direction === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-100"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="border-b border-gray-200 dark:border-gray-700">
                  <td className="px-4 py-2">{t.classificacao}</td>
                  <td className="px-4 py-2">{t.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                  <td className="px-4 py-2 font-bold" style={{color: t.tipo==='entrada'?'#10B981':'#EF4444'}}>{t.tipo==='entrada'?'RECEITA':'DESPESA'}</td>
                  <td className="px-4 py-2">{t.data ? new Date(new Date(t.data + 'T00:00:00-03:00')).toLocaleDateString('pt-BR') : ''}</td>
                  <td className="px-4 py-2">{t.status}</td>
                  <td className="px-4 py-2 max-w-xs">
                    {t.obs ? (
                      <span 
                        className="truncate block" 
                        title={t.obs}
                      >
                        {t.obs}
                      </span>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-4 py-2 flex gap-2">
                    <button className="px-3 py-1 rounded bg-gray-100 dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600" onClick={() => handleEditTransacao(t)}>Editar</button>
                    <button className="px-3 py-1 rounded bg-gray-100 dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400" onClick={()=>handleDeleteTransacao(t)}>Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Cards mobile */}
        <div className="md:hidden space-y-3">
          {filtered.map((t) => (
            <div key={t.id} className="planner-card-muted p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-base dark:text-white mb-1">{t.classificacao}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t.data ? new Date(new Date(t.data + 'T00:00:00-03:00')).toLocaleDateString('pt-BR') : ''}
                  </p>
                </div>
                <span 
                  className={`text-lg font-bold ${t.tipo === 'entrada' ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}
                >
                  {t.tipo === 'entrada' ? '+' : '-'} {t.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
              {t.obs && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{t.obs}</p>
              )}
              <div className="flex items-center justify-between mt-3 pt-3 border-t dark:border-gray-600">
                <span className="text-xs text-gray-500 dark:text-gray-400">{t.status}</span>
                <div className="flex gap-2">
                  <button 
                    className="p-2 rounded-md text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                    onClick={() => handleEditTransacao(t)}
                    title="Editar"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button 
                    className="p-2 rounded-md text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
                    onClick={()=>handleDeleteTransacao(t)}
                    title="Excluir"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {filtered.length === 0 && !transactionsLoading && !transactionsError && (
          <EmptyState
            icon={List}
            title="Nenhuma transação encontrada"
            description="Adicione sua primeira transação para acompanhar receitas e despesas."
            action={
              <button
                type="button"
                className="planner-button inline-flex items-center gap-2"
                onClick={() => { setSaveValidationError(null); setSaveApiError(null); setModalOpen(true); }}
              >
                <PlusCircle size={18} />
                Nova transação
              </button>
            }
          />
        )}
          </>
        )}
      </div>

      {/* Botão flutuante mobile */}
      <button
        className="md:hidden fixed bottom-20 right-4 w-14 h-14 bg-blue-600 text-white rounded-full shadow-soft flex items-center justify-center z-40 hover:bg-blue-500 transition"
        onClick={() => { setSaveValidationError(null); setSaveApiError(null); setModalOpen(true); }}
        title="Nova Transação"
        aria-label="Nova transação"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
      </PageShell>
    </>
  );
}