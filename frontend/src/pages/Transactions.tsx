import React, { useState, useEffect, useRef } from 'react';
import { useTransactionStore } from '../store/transactionStore';
import { useAuthStore } from '../store/authStore';
import { fetchCategoriesByType } from '../services/categoryService';
import * as XLSX from 'xlsx';
import { AlertTriangle, Download, PlusCircle } from 'lucide-react';
import { toast } from 'react-toastify';

const meses = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

interface Categoria {
  id: number;
  nome: string;
  tipo: string;
}

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

function NovaTransacaoModal({ open, onClose, onSave, saving, error, success }: { 
  open: boolean, 
  onClose: () => void, 
  onSave: (transacao: { tipo: 'entrada' | 'saída', valor: number, classificacao: string, data: string, status: string, obs?: string }) => void,
  saving?: boolean,
  error?: string | null,
  success?: boolean
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
        {error ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200" role="alert">
            {error}
          </div>
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

function EditarTransacaoModal({ open, onClose, transacao, onSave }: {
  open: boolean,
  onClose: () => void,
  transacao: any,
  onSave: (transacao: any) => void
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

  if (!open) return null;

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
        <form onSubmit={e => {
          e.preventDefault();
          onSave({
            ...transacao,
            tipo,
            valor: parseCurrency(valor),
            classificacao,
            data,
            status,
            obs: obs.trim() || undefined
          });
        }}>
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
            className="planner-button w-full"
          >
            Salvar Alterações
          </button>
        </form>
      </div>
    </div>
  );
}

function ExcluirTransacaoModal({ open, onClose, transacao, onDelete, error, loading }: {
  open: boolean,
  onClose: () => void,
  transacao: any,
  onDelete: (id: any) => void,
  error?: string | null,
  loading?: boolean
}) {
  if (!open || !transacao) return null;
  const tipoLabel = transacao.tipo === 'saida' ? 'saída' : transacao.tipo;
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
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-300">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-red-600 dark:text-red-400">Confirmar Exclusão</h2>
          </div>
        </div>
        {error ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200" role="alert">
            {error}
          </div>
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
            className="flex-1 planner-button bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!!loading}
            onClick={() => onDelete(transacao.id)}
          >
            {loading ? 'Excluindo...' : 'Sim, excluir'}
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

export default function Transactions() {
  const { transactions, deleteTransaction, addTransaction, updateTransaction, fetchTransactions } = useTransactionStore();
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState('Esse mês');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [aplicarFiltroDatas, setAplicarFiltroDatas] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  // Filtro de busca e de período
  const filtered = transactions.filter(t => {
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
    if (search && !t.classificacao.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTransacao, setEditingTransacao] = useState<any>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingTransacao, setDeletingTransacao] = useState<any>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState(false);
  const [savingTransaction, setSavingTransaction] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

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
      setSaveError(errorMsg);
      setTimeout(() => setSaveError(null), 5000);
      return;
    }

    if (!transacao.classificacao || transacao.classificacao.trim() === '') {
      const errorMsg = 'A categoria é obrigatória';
      console.error('[Transactions] Erro de validação:', errorMsg);
      setSaveError(errorMsg);
      setTimeout(() => setSaveError(null), 5000);
      return;
    }

    if (!transacao.data) {
      const errorMsg = 'A data é obrigatória';
      console.error('[Transactions] Erro de validação:', errorMsg);
      setSaveError(errorMsg);
      setTimeout(() => setSaveError(null), 5000);
      return;
    }

    setSavingTransaction(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      console.log('[Transactions] Chamando addTransaction do store...');
      const result = await addTransaction(transacao);
      
      if (result?.error) {
        const errorMsg = result.error;
        console.error('[Transactions] ❌ Erro ao salvar transação:', errorMsg);
        setSaveError(errorMsg);
        setSavingTransaction(false);
        setTimeout(() => setSaveError(null), 5000);
        return;
      }
      
      console.log('[Transactions] ✅ Transação salva com sucesso na tabela lancamentos_id:', result?.data || transacao);
      
      setSaveSuccess(true);
      // Limpar campos após salvar com sucesso
      setTimeout(() => {
        setModalOpen(false);
        setSaveSuccess(false);
        setSavingTransaction(false);
        // Os campos serão limpos quando o modal fechar (useEffect no modal)
      }, 1500);
    } catch (error: any) {
      const errorMsg = error?.message || 'Erro ao salvar transação. Tente novamente.';
      console.error('[Transactions] ❌ Erro ao salvar transação:', {
        error,
        message: error?.message,
        stack: error?.stack,
        transacao
      });
      setSaveError(errorMsg);
      setSavingTransaction(false);
      setTimeout(() => setSaveError(null), 5000);
    }
  };

  const handleEditTransacao = (transacao: any) => {
    setEditingTransacao(transacao);
    setEditModalOpen(true);
  };

  const handleSaveEditTransacao = async (transacao: any) => {
    // Garante que classificacao seja igual ao campo de descrição
    const transacaoAtualizada = { ...transacao, classificacao: transacao.classificacao };
    const result = await updateTransaction(transacao.id, transacaoAtualizada);
    console.log('Resultado do update Supabase:', result);
    if (result && result.error) {
      console.error('Erro ao atualizar lançamento:', result.error);
    } else {
      console.log('Lançamento atualizado com sucesso:', result?.data || transacaoAtualizada);
    }
    setEditModalOpen(false);
    setEditingTransacao(null);
  };

  const handleDeleteTransacao = (transacao: any) => {
    setDeletingTransacao(transacao);
    setDeleteError(null);
    setDeleteModalOpen(true);
  };

  const handleConfirmDeleteTransacao = async (id: any) => {
    setDeletingTransaction(true);
    setDeleteError(null);
    if (!id) {
      const errorMsg = 'ID da transação inválido.';
      setDeleteError(errorMsg);
      toast.error(errorMsg);
      setDeletingTransaction(false);
      return;
    }
    const result = await deleteTransaction(id);
    console.log('Resultado da exclusão Supabase:', result);
    if (result?.error) {
      const errorMsg = result.error || 'Não foi possível excluir a transação.';
      setDeleteError(errorMsg);
      toast.error(errorMsg);
      setDeletingTransaction(false);
      return;
    }
    setDeletingTransaction(false);
    setDeleteModalOpen(false);
    setDeletingTransacao(null);
    toast.success('Transação excluída com sucesso.');
  };

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
          setSaveError(null);
          setSaveSuccess(false);
          setSavingTransaction(false);
        }} 
        onSave={handleSaveTransacao}
        saving={savingTransaction}
        error={saveError}
        success={saveSuccess}
      />
      <EditarTransacaoModal open={editModalOpen} onClose={() => setEditModalOpen(false)} transacao={editingTransacao} onSave={handleSaveEditTransacao} />
      <ExcluirTransacaoModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        transacao={deletingTransacao}
        onDelete={handleConfirmDeleteTransacao}
        error={deleteError}
        loading={deletingTransaction}
      />
      
      {/* Header e busca - Mobile */}
      <div className="mb-4 md:mb-6">
        <h2 className="text-xl md:text-2xl font-bold mb-1 dark:text-white">Transações</h2>
        <input
          type="text"
          placeholder="Pesquisar receitas ou gastos"
          className="planner-input mb-4"
          value={search}
          onChange={e=>setSearch(e.target.value)}
        />
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
            onClick={() => { setSaveError(null); setModalOpen(true); }}
          >
            + Nova Transação
          </button>
        </div>

        {/* Tabela desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-gray-700 dark:text-gray-200">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700">
                <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-100">Descrição</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-100">Valor</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-100">Tipo</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-100">Data</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-100">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-100">Observações</th>
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
          {filtered.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Nenhuma transação encontrada
            </div>
          )}
        </div>
      </div>

      {/* Botão flutuante mobile */}
      <button
        className="md:hidden fixed bottom-20 right-4 w-14 h-14 bg-blue-600 text-white rounded-full shadow-soft flex items-center justify-center z-40 hover:bg-blue-500 transition"
        onClick={() => { setSaveError(null); setModalOpen(true); }}
        title="Nova Transação"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </>
  );
}