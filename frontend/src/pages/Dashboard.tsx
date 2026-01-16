import React, { useEffect, useState } from 'react';
import { useTransactionStore } from '../store/transactionStore';
import { useAuthStore } from '../store/authStore';
import { Pie, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Link } from 'react-router-dom';
import Layout from '../Layout/Layout';
import { fetchCategories } from '../services/categoryService';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function Dashboard() {
  const { transactions, fetchTransactions, addTransaction, updateTransaction, deleteTransaction, loading, error } = useTransactionStore();
  const { userId, user } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [formData, setFormData] = useState({
    classificacao: '',
    valor: '',
    tipo: 'saída' as 'saída' | 'entrada',
  });
  const [period, setPeriod] = useState('Mês');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [aplicarFiltroDatas, setAplicarFiltroDatas] = useState(false);
  const [categoriasMap, setCategoriasMap] = useState<Record<string, string>>({});
  const [despesaTab, setDespesaTab] = useState<'pagos' | 'a_pagar'>('pagos');

  useEffect(() => {
    if (userId) {
      fetchTransactions();
    }
  }, [userId, fetchTransactions]);

  useEffect(() => {
    // Buscar categorias e criar um map id -> nome
    if (!userId) return;
    
    fetchCategories(userId)
      .then((data) => {
        const map: Record<string, string> = {};
        data.forEach((cat) => {
          map[cat.id] = cat.nome;
        });
        setCategoriasMap(map);
      })
      .catch((error) => console.error('Erro ao buscar categorias:', error));
  }, [userId]);

  const totalIncome = transactions
    .filter((t) => t.tipo === 'entrada')
    .reduce((sum, t) => sum + t.valor, 0);

  const totalExpenses = transactions
    .filter((t) => t.tipo === 'saída')
    .reduce((sum, t) => sum + t.valor, 0);

  const balance = totalIncome - totalExpenses;

  const getTransactionDate = (t: any) =>
    t.data ? new Date(`${t.data}T00:00:00-03:00`) : new Date(t.criado_em);

  // Gráfico de evolução do saldo
  const sorted = [...transactions].sort((a, b) => {
    const dateA = getTransactionDate(a);
    const dateB = getTransactionDate(b);
    return dateA.getTime() - dateB.getTime();
  });
  let saldo = 0;
  const saldoData = sorted.map(t => {
    saldo += t.tipo === 'entrada' ? t.valor : -t.valor;
    const dataRef = getTransactionDate(t);
    return { x: dataRef.toLocaleDateString('pt-BR'), y: saldo };
  });

  // Gráfico de pizza por categoria
  const expensesByCategory = transactions.filter(t => t.tipo === 'saída').reduce((acc, curr) => {
    acc[curr.classificacao] = (acc[curr.classificacao] || 0) + curr.valor;
    return acc;
  }, {} as Record<string, number>);
  const pieLabels = Object.keys(expensesByCategory);
  const pieData = Object.values(expensesByCategory);
  const pieColors = [
    '#F59E42', '#10B981', '#EF4444', '#6366F1', '#FBBF24', '#3B82F6', '#22D3EE', '#A78BFA', '#F472B6', '#34D399'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const transaction = {
      ...formData,
      valor: parseFloat(formData.valor),
    };

    if (editingTransaction) {
      await updateTransaction(editingTransaction.id, transaction);
    } else {
      await addTransaction(transaction);
    }

    setIsModalOpen(false);
    setEditingTransaction(null);
    setFormData({
      classificacao: '',
      valor: '',
      tipo: 'saída',
    });
  };

  const handleEdit = (transaction: any) => {
    setEditingTransaction(transaction);
    setFormData({
      classificacao: transaction.classificacao,
      valor: transaction.valor.toString(),
      tipo: transaction.tipo,
    });
    setIsModalOpen(true);
  };

  // Filtros de período (apenas visual, não filtra dados reais)
  const handlePeriod = (p: string) => setPeriod(p);

  // Função para obter o saldo do período
  function getBalanceInPeriod(start: Date, end: Date) {
    return transactions
      .filter(t => {
        const d = getTransactionDate(t);
        return d >= start && d <= end;
      })
      .reduce((sum, t) => sum + (t.tipo === 'entrada' ? t.valor : -t.valor), 0);
  }

  // Função para obter o total de entradas/saídas no período
  function getTotalInPeriod(start: Date, end: Date, tipo: 'entrada' | 'saída') {
    return transactions
      .filter(t => {
        const d = getTransactionDate(t);
        return t.tipo === tipo && d >= start && d <= end;
      })
      .reduce((sum, t) => sum + t.valor, 0);
  }

  // Determinar período atual e anterior
  let periodoAtual = { start: null as Date | null, end: null as Date | null };
  let periodoAnterior = { start: null as Date | null, end: null as Date | null };
  const hoje = new Date();
  hoje.setHours(0,0,0,0);

  if (dateRange.start && dateRange.end) {
    // Personalizado
    const start = new Date(`${dateRange.start}T00:00:00-03:00`);
    const end = new Date(`${dateRange.end}T23:59:59-03:00`);
    periodoAtual = { start, end };
    const diff = end.getTime() - start.getTime();
    const prevEnd = new Date(start.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - diff);
    prevStart.setHours(0,0,0,0);
    prevEnd.setHours(23,59,59,999);
    periodoAnterior = { start: prevStart, end: prevEnd };
  } else if (period === 'Semana') {
    // Semana atual
    const now = new Date();
    const day = now.getDay();
    const start = new Date(now);
    start.setDate(now.getDate() - day);
    start.setHours(0,0,0,0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23,59,59,999);
    periodoAtual = { start, end };
    // Semana anterior
    const prevEnd = new Date(start.getTime() - 1);
    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevEnd.getDate() - 6);
    prevStart.setHours(0,0,0,0);
    prevEnd.setHours(23,59,59,999);
    periodoAnterior = { start: prevStart, end: prevEnd };
  } else if (period === 'Mês') {
    // Mês atual
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    end.setHours(23,59,59,999);
    periodoAtual = { start, end };
    // Mês anterior
    const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    prevStart.setHours(0,0,0,0);
    prevEnd.setHours(23,59,59,999);
    periodoAnterior = { start: prevStart, end: prevEnd };
  } else if (period === 'Hoje') {
    // Hoje
    const start = new Date();
    start.setHours(0,0,0,0);
    const end = new Date();
    end.setHours(23,59,59,999);
    periodoAtual = { start, end };
    // Ontem
    const prevStart = new Date(start);
    prevStart.setDate(start.getDate() - 1);
    prevStart.setHours(0,0,0,0);
    const prevEnd = new Date(start);
    prevEnd.setDate(start.getDate() - 1);
    prevEnd.setHours(23,59,59,999);
    periodoAnterior = { start: prevStart, end: prevEnd };
  }

  // Calcular saldo dos períodos
  const saldoAtual = (periodoAtual.start && periodoAtual.end) ? getBalanceInPeriod(periodoAtual.start, periodoAtual.end) : balance;
  const saldoAnterior = (periodoAnterior.start && periodoAnterior.end) ? getBalanceInPeriod(periodoAnterior.start, periodoAnterior.end) : 0;

  // Calcular variação percentual
  let variacao = 'N/A';
  let variacaoCor = 'text-gray-500';
  if (saldoAnterior !== 0) {
    const perc = ((saldoAtual - saldoAnterior) / Math.abs(saldoAnterior)) * 100;
    variacao = (perc >= 0 ? '↑ +' : '↓ ') + Math.abs(perc).toFixed(1) + '%';
    variacaoCor = perc > 0 ? 'text-green-500' : perc < 0 ? 'text-red-500' : 'text-gray-500';
  } else if (saldoAnterior === 0 && saldoAtual !== 0) {
    variacao = '↑ +100%';
    variacaoCor = 'text-green-500';
  } else if (saldoAnterior === 0 && saldoAtual === 0) {
    variacao = '0%';
    variacaoCor = 'text-gray-500';
  }

  // Calcular entradas e saídas do período filtrado
  const entradasPeriodo = (periodoAtual.start && periodoAtual.end) ? getTotalInPeriod(periodoAtual.start, periodoAtual.end, 'entrada') : totalIncome;
  const saidasPeriodo = (periodoAtual.start && periodoAtual.end) ? getTotalInPeriod(periodoAtual.start, periodoAtual.end, 'saída') : totalExpenses;

  // Calcular total previsto (a receber) no período
  const entradasAReceber = (periodoAtual.start && periodoAtual.end)
    ? transactions.filter(t => {
        const d = getTransactionDate(t);
        return t.tipo === 'entrada' && t.status === 'a_receber' && d >= periodoAtual.start! && d <= periodoAtual.end!;
      }).reduce((sum, t) => sum + t.valor, 0)
    : transactions.filter(t => t.tipo === 'entrada' && t.status === 'a_receber').reduce((sum, t) => sum + t.valor, 0);

  // Calcular total previsto (a pagar) no período
  const saidasAPagar = (periodoAtual.start && periodoAtual.end)
    ? transactions.filter(t => {
        const d = getTransactionDate(t);
        return t.tipo === 'saída' && t.status === 'a_pagar' && d >= periodoAtual.start! && d <= periodoAtual.end!;
      }).reduce((sum, t) => sum + t.valor, 0)
    : transactions.filter(t => t.tipo === 'saída' && t.status === 'a_pagar').reduce((sum, t) => sum + t.valor, 0);

  // Filtrar transações do período atual para o gráfico
  const transacoesPeriodo = (periodoAtual.start && periodoAtual.end)
    ? sorted.filter(t => {
        const d = getTransactionDate(t);
        return d >= periodoAtual.start! && d <= periodoAtual.end!;
      })
    : sorted;

  // Gráfico de evolução do saldo no período filtrado
  let saldoPeriodo = 0;
  const saldoDataPeriodo = transacoesPeriodo.map(t => {
    saldoPeriodo += t.tipo === 'entrada' ? t.valor : -t.valor;
    const dataRef = getTransactionDate(t);
    return { x: dataRef.toLocaleDateString('pt-BR'), y: saldoPeriodo };
  });

  // Filtrar despesas do período atual para o gráfico de pizza
  const despesasPeriodo = (periodoAtual.start && periodoAtual.end)
    ? transactions.filter(t => {
        const d = getTransactionDate(t);
        return t.tipo === 'saída' && d >= periodoAtual.start! && d <= periodoAtual.end!;
      })
    : transactions.filter(t => t.tipo === 'saída');

  // Filtrar por status (Pagos ou A Pagar)
  const despesasFiltradas = despesasPeriodo.filter(t => {
    if (despesaTab === 'pagos') {
      return t.status === 'pago';
    } else {
      return t.status === 'a_pagar';
    }
  });

  const expensesByCategoryPeriodo = despesasFiltradas.reduce((acc, curr) => {
    const catKey = curr.categoria ? String(curr.categoria) : curr.classificacao;
    acc[catKey] = (acc[catKey] || 0) + curr.valor;
    return acc;
  }, {} as Record<string, number>);
  const pieLabelsPeriodo = Object.keys(expensesByCategoryPeriodo).map(catId => categoriasMap[catId] || catId);
  const pieDataPeriodo = Object.values(expensesByCategoryPeriodo);
  
  // Calcular total para a aba selecionada
  const totalDespesaTab = despesasFiltradas.reduce((sum, t) => sum + t.valor, 0);

  return (
    <Layout>
      {/* Conteúdo do dashboard abaixo, sem header/main duplicado */}
      {/* Filtros de período */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 md:mb-6 gap-3 md:gap-4 mt-2">
        <div className="flex items-center gap-2">
          <button onClick={() => handlePeriod('Semana')} className={`px-4 py-2 rounded-lg border text-sm md:text-base ${period==='Semana'?'bg-blue-600 text-white border-blue-600 font-bold':'bg-white dark:bg-gray-800 dark:text-white border-gray-200 dark:border-gray-600'}`}>Semana</button>
          <button onClick={() => handlePeriod('Mês')} className={`px-4 py-2 rounded-lg border text-sm md:text-base ${period==='Mês'?'bg-blue-600 text-white border-blue-600 font-bold':'bg-white dark:bg-gray-800 dark:text-white border-gray-200 dark:border-gray-600'}`}>Mês</button>
          <button onClick={() => handlePeriod('Hoje')} className={`px-4 py-2 rounded-lg border text-sm md:text-base ${period==='Hoje'?'bg-blue-600 text-white border-blue-600 font-bold':'bg-white dark:bg-gray-800 dark:text-white border-gray-200 dark:border-gray-600'}`}>Hoje</button>
        </div>
        <div className="hidden md:flex gap-2 ml-auto">
          <input type="date" className="border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2" value={dateRange.start} onChange={e=>setDateRange({...dateRange, start: e.target.value})} />
          <span className="text-gray-400 dark:text-gray-400">até</span>
          <input type="date" className="border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2" value={dateRange.end} onChange={e=>setDateRange({...dateRange, end: e.target.value})} />
          <button className="ml-2 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-gray-200" onClick={e => { e.preventDefault(); setDateRange({ start: '', end: '' }); setAplicarFiltroDatas(false); }}>Limpar</button>
        </div>
      </div>
      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-5 md:p-6 flex flex-col justify-between">
          <span className="text-gray-500 dark:text-gray-400 text-sm mb-2">Resultado do Período</span>
          <span className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">{saldoAtual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {periodoAtual.start && periodoAtual.end ? `${periodoAtual.start.toLocaleDateString('pt-BR')} - ${periodoAtual.end.toLocaleDateString('pt-BR')}` : ''}
          </span>
          <span className={`${variacaoCor} font-semibold flex items-center gap-1 mt-2`}>{variacao}</span>
          <div className="mt-2"><div className="h-1 w-full bg-gradient-to-r from-purple-400 to-purple-100 rounded-full"></div></div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-5 md:p-6 flex flex-col justify-between">
          <span className="text-gray-500 dark:text-gray-400 text-sm mb-2">Entradas</span>
          <div className="flex items-center justify-between mb-2">
            <span className="text-green-600 dark:text-green-400 font-bold text-xl md:text-2xl">{entradasPeriodo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            <span className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs px-3 py-1 rounded-full font-semibold">Receitas</span>
          </div>
          <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-2">
            <span>Previsto (A Receber)</span>
            <span>{entradasAReceber.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-5 md:p-6 flex flex-col justify-between">
          <span className="text-gray-500 dark:text-gray-400 text-sm mb-2">Saídas</span>
          <div className="flex items-center justify-between mb-2">
            <span className="text-red-500 dark:text-red-400 font-bold text-xl md:text-2xl">{saidasPeriodo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            <span className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 text-xs px-3 py-1 rounded-full font-semibold">Despesas</span>
          </div>
          <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-2">
            <span>Previsto (A Pagar)</span>
            <span>{saidasAPagar.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
          </div>
        </div>
      </div>
      {/* Gráficos e detalhes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 md:p-6">
          <span className="font-semibold text-gray-800 dark:text-white text-sm md:text-base">Evolução do Saldo no Período</span>
          <div className="mt-4">
            <Line
              data={{
                labels: saldoDataPeriodo.map(d => d.x),
                datasets: [
                  {
                    label: 'Saldo Realizado',
                    data: saldoDataPeriodo.map(d => d.y),
                    borderColor: '#6366F1',
                    backgroundColor: 'rgba(99,102,241,0.1)',
                    fill: true,
                    tension: 0.4,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                  legend: { display: false },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: (value: any) => `R$ ${value}`,
                      font: { size: 10 },
                    },
                  },
                  x: {
                    ticks: {
                      font: { size: 10 },
                    },
                  },
                },
              }}
              height={150}
            />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 md:p-6 flex flex-col">
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6 mb-4">
            <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm md:text-base">Despesas</span>
            <div className="flex gap-2">
              <button 
                onClick={() => setDespesaTab('pagos')}
                className={`text-xs px-3 py-1 rounded font-semibold ${
                  despesaTab === 'pagos' 
                    ? 'bg-gray-200 dark:bg-gray-700 dark:text-white' 
                    : 'bg-gray-100 dark:bg-gray-600 dark:text-gray-300'
                }`}
              >
                Pagos
              </button>
              <button 
                onClick={() => setDespesaTab('a_pagar')}
                className={`text-xs px-3 py-1 rounded font-semibold ${
                  despesaTab === 'a_pagar' 
                    ? 'bg-gray-200 dark:bg-gray-700 dark:text-white' 
                    : 'bg-gray-100 dark:bg-gray-600 dark:text-gray-300'
                }`}
              >
                A Pagar
              </button>
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="w-32 h-32 md:w-40 md:h-40 mx-auto">
              <Pie
                data={{
                  labels: pieLabelsPeriodo,
                  datasets: [
                    {
                      data: pieDataPeriodo,
                      backgroundColor: pieColors,
                      borderWidth: 2,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: true,
                  plugins: {
                    legend: { display: false },
                  },
                }}
              />
              <div className="text-center font-bold mt-2 text-base md:text-lg dark:text-white">{totalDespesaTab.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
              <div className="text-center text-xs text-gray-400 dark:text-gray-500">Total {despesaTab === 'pagos' ? 'Pago' : 'A Pagar'}</div>
            </div>
            <div className="flex-1 w-full">
              <span className="font-semibold text-gray-700 dark:text-gray-300 text-sm block mb-2">Detalhes por Categoria</span>
              <ul className="space-y-2">
                {Object.keys(expensesByCategoryPeriodo).map((catId, idx) => (
                  <li key={catId} className="flex items-center justify-between text-sm dark:text-gray-200">
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-3 h-3 rounded-full" style={{background: pieColors[idx % pieColors.length]}}></span>
                      <span>{categoriasMap[catId] || catId}</span>
                    </div>
                    <span className="font-semibold">{expensesByCategoryPeriodo[catId].toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                  </li>
                ))}
                {Object.keys(expensesByCategoryPeriodo).length === 0 && (
                  <li className="text-sm text-gray-500 dark:text-gray-400">Nenhuma despesa {despesaTab === 'pagos' ? 'paga' : 'a pagar'} no período</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}