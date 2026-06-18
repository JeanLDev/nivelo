import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  FileText, 
  Calendar, 
  Database, 
  Copy, 
  Check, 
  RefreshCw, 
  Wallet,
  AlertCircle
} from 'lucide-react';

// Interfaces para os tipos de dados do Banco Digital
interface Transacao {
  id: string;
  created_at: string;
  descricao: string;
  valor: number;
  tipo: 'entrada' | 'saida';
  categoria: string;
}

interface FaturaPaga {
  id: string;
  created_at: string;
  estabelecimento: string;
  valor: number;
  categoria: string;
  data_pagamento: string;
}

export default function App() {
  // Estados da Aplicação
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [faturas, setFaturas] = useState<FaturaPaga[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'geral' | 'transacao' | 'faturas' | 'sql'>('geral');
  const [copiado, setCopiado] = useState(false);
  const [erroNotificacao, setErroNotificacao] = useState<string | null>(null);

  // Estados para Formulários
  const [descTransacao, setDescTransacao] = useState('');
  const [valorTransacao, setValorTransacao] = useState('');
  const [tipoTransacao, setTipoTransacao] = useState<'entrada' | 'saida'>('saida');
  const [catTransacao, setCatTransacao] = useState('Alimentação');

  const [estFatura, setEstFatura] = useState('');
  const [valorFatura, setValorFatura] = useState('');
  const [catFatura, setCatFatura] = useState('Assinaturas');
  const [dataFatura, setDataFatura] = useState(new Date().toISOString().split('T')[0]);

  // Filtro do Extrato
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'entrada' | 'saida'>('todos');


  // Carregar dados iniciais do Supabase Real importado
  const carregarDados = async () => {
    setLoading(true);
    setErroNotificacao(null);
    try {
      // 1. Carrega Transações
      const { data: transData, error: transError } = await supabase
        .from('transacoes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (transError) throw transError;
      if (transData) setTransacoes(transData);

      // 2. Carrega Faturas Pagas
      const { data: fatData, error: fatError } = await supabase
        .from('pagamentos')
        .select('*')
        .order('data_pagamento', { ascending: false });

      if (fatError) throw fatError;
      if (fatData) setFaturas(fatData);

    } catch (error: any) {
      console.error("Erro ao consultar o Supabase:", error);
      setErroNotificacao(error.message || "Erro de comunicação com o Supabase. Verifique se as tabelas existem.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  // Registrar Transação (Entrada/Saída)
  const lidarNovaTransacao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descTransacao || !valorTransacao) return;

    const payload = {
      descricao: descTransacao,
      valor: parseFloat(valorTransacao),
      tipo: tipoTransacao,
      categoria: catTransacao
    };

    setLoading(true);
    setErroNotificacao(null);
    try {
      const { error } = await supabase.from('transacoes').insert([payload]);
      if (error) throw error;

      // Reset formulário e recarrega
      setDescTransacao('');
      setValorTransacao('');
      setActiveTab('geral');
      await carregarDados();
    } catch (error: any) {
      console.error(error);
      setErroNotificacao("Não foi possível registrar a transação. Verifique se a tabela 'transacoes' existe.");
    } finally {
      setLoading(false);
    }
  };


  // Cálculos Financeiros Dinâmicos
  const totalEntradas = transacoes
    .filter(t => t.tipo === 'entrada')
    .reduce((soma, t) => soma + Number(t.valor), 0);

  const totalSaidas = transacoes
    .filter(t => t.tipo === 'saida')
    .reduce((soma, t) => soma + t.valor, 0);

  const totalFaturasPagas = faturas
    .reduce((soma, f) => soma + f.valor_pago, 0);

  // Balanço = Entradas - Saídas - Faturas Pagas
  const saldoDisponivel = (totalEntradas + totalFaturasPagas) - totalSaidas;

  // Filtragem de transações para o extrato visível
  const transacoesFiltradas = transacoes.filter(t => {
    if (filtroTipo === 'todos') return true;
    return t.tipo === filtroTipo;
  });


  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-emerald-200">
      {/* Header do Banco */}
      <header className="bg-white border-b border-emerald-100/60 sticky top-0 z-10 shadow-sm backdrop-blur-md bg-white/95">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-800 text-white p-2.5 rounded-2xl shadow-md shadow-emerald-800/10 flex items-center justify-center">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <span className="text-emerald-900 font-semibold text-xl tracking-tight block">Financeiro</span>
              <span className="text-emerald-600 text-sm font-semibold  tracking-wider block">Gerencie entradas e saídas</span>
            </div>
          </div>

        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Banner de Erros/Notificações Amigáveis */}
        {erroNotificacao && (
          <div className="bg-amber-50 border border-amber-200 text-amber-950 p-4 rounded-2xl shadow-sm mb-6 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold leading-relaxed">
                {erroNotificacao}
              </p>
              <p className="text-[11px] font-semibold text-amber-700 mt-1">
                Certifique-se de executar o script contido na aba <strong className="underline cursor-pointer" onClick={() => setActiveTab('sql')}>Script SQL</strong> dentro do painel do seu Supabase para o correto funcionamento das tabelas.
              </p>
            </div>
          </div>
        )}

        {/* Abas Principais de Navegação */}
        <div className="flex border-b border-emerald-100/60 mb-8 gap-1 overflow-x-auto pb-1 scrollbar-thin">
          <button 
            onClick={() => setActiveTab('geral')}
            className={`px-5 py-3 rounded-2xl font-semibold text-sm transition duration-200 shrink-0 ${activeTab === 'geral' ? 'bg-emerald-800 text-white shadow-sm' : 'text-emerald-800 hover:bg-emerald-50'}`}
          >
            Visão Geral e Extrato
          </button>
          <button 
            onClick={() => setActiveTab('transacao')}
            className={`px-5 py-3 rounded-2xl font-semibold text-sm transition duration-200 shrink-0 ${activeTab === 'transacao' ? 'bg-emerald-800 text-white shadow-sm' : 'text-emerald-800 hover:bg-emerald-50'}`}
          >
            + Registrar Transação
          </button>
         
        </div>

        {/* CONTEÚDO DA TAB 1: VISÃO GERAL */}
        {activeTab === 'geral' && (
          <div className="space-y-8">
            
            {/* Cards de Métricas e Balanço */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              
              {/* Saldo Total */}
              <div className="text-slate-700 p-6 rounded-2xl shadow-md shadow-emerald-900/10 flex flex-col justify-between min-h-[140px] border border-emerald-800/20">
                <div className="flex justify-between items-center">
                  <p className='text-slate-700 font-semibold'>Saldo disponível</p>
                  <div className="bg-emerald-900/40 p-2 rounded-xl">
                    <DollarSign className="h-5 w-5 text-emerald-700" />
                  </div>
                </div>
                <div>
                  <span className="text-3xl font-semibold tracking-tight">
                    R$ {saldoDisponivel?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-emerald-800/80 text-sm block mt-1 font-semibold">
                    Consolidado Geral
                  </span>
                </div>
              </div>

              {/* Entradas */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between min-h-[140px]">
                <div className="flex justify-between items-center">
                  <span className="text-slate-700 text-sm font-bold  tracking-wider">Total Entradas</span>
                  <div className="bg-emerald-50 p-2 rounded-xl text-emerald-700">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                </div>
                <div>
                  <span className="text-2xl font-semibold text-slate-800 tracking-tight">
                    R$ {totalEntradas?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-emerald-600 text-sm block mt-1 font-semibold">
                    Transações de entrada
                  </span>
                </div>
              </div>

              {/* Despesas */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between min-h-[140px]">
                <div className="flex justify-between items-center">
                  <span className="text-slate-700 text-sm font-bold  tracking-wider">Despesas Registradas</span>
                  <div className="bg-red-50 p-2 rounded-xl text-red-600">
                    <TrendingDown className="h-5 w-5" />
                  </div>
                </div>
                <div>
                  <span className="text-2xl font-semibold text-slate-800 tracking-tight">
                    R$ {totalSaidas?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-red-600 text-sm block mt-1 font-semibold">
                    Transações de saída
                  </span>
                </div>
              </div>

              {/* Faturas Pagas Somadas */}
              <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100/80 flex flex-col justify-between min-h-[140px]">
                <div className="flex justify-between items-center">
                  <span className="text-emerald-900 text-sm font-bold  tracking-wider">Faturas Pagas</span>
                  <div className="bg-emerald-850 text-white p-2 rounded-xl">
                    <FileText className="h-5 w-5" />
                  </div>
                </div>
                <div>
                  <span className="text-2xl font-semibold text-emerald-900 tracking-tight">
                    R$ {totalFaturasPagas?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-emerald-700 text-sm block mt-1 font-semibold">
                    Total das faturas externas
                  </span>
                </div>
              </div>

            </div>

            {/* Layout em Duas Colunas: Extrato & Faturas */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Lado Esquerdo: Extrato de Transações */}
              <div className="lg:col-span-8 space-y-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  
                  {/* Cabeçalho do Extrato com Filtros */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                      <h2 className="text-emerald-900 font-semibold text-lg">Extrato Geral de Lançamentos</h2>
                      <p className="text-slate-500 text-sm font-semibold">Controle detalhado de entradas e saídas</p>
                    </div>

                    {/* Botões de Filtro */}
                    <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-2xl border border-slate-200/60">
                      <button 
                        onClick={() => setFiltroTipo('todos')}
                        className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition duration-150 ${filtroTipo === 'todos' ? 'bg-white text-emerald-900 shadow-sm' : 'text-slate-600 hover:text-emerald-900'}`}
                      >
                        Todos
                      </button>
                      <button 
                        onClick={() => setFiltroTipo('entrada')}
                        className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition duration-150 ${filtroTipo === 'entrada' ? 'bg-white text-emerald-900 shadow-sm' : 'text-slate-600 hover:text-emerald-900'}`}
                      >
                        Entradas
                      </button>
                      <button 
                        onClick={() => setFiltroTipo('saida')}
                        className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition duration-150 ${filtroTipo === 'saida' ? 'bg-white text-emerald-900 shadow-sm' : 'text-slate-600 hover:text-emerald-900'}`}
                      >
                        Saídas
                      </button>
                    </div>
                  </div>

                  {/* Listagem de Transações */}
                  {loading ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-3">
                      <RefreshCw className="h-8 w-8 text-emerald-800 animate-spin" />
                      <p className="text-slate-500 text-sm font-semibold">Atualizando informações...</p>
                    </div>
                  ) : transacoesFiltradas.length === 0 ? (
                    <div className="py-12 text-center">
                      <p className="text-slate-500 text-sm font-semibold">Nenhuma transação encontrada para este filtro.</p>
                      <button 
                        onClick={() => setActiveTab('transacao')}
                        className="mt-3 text-emerald-800 hover:underline text-sm font-semibold"
                      >
                        Registrar primeiro lançamento →
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-hidden">
                      <div className="divide-y divide-slate-100">
                        {transacoesFiltradas.map((t) => (
                          <div key={t.id} className="py-3.5 flex items-center justify-between hover:bg-slate-50/50 px-2 -mx-2 rounded-xl transition duration-150">
                            <div className="flex items-center gap-3.5">
                              {/* Ícone de Categoria Customizado por tipo */}
                              <div className={`p-2.5 rounded-xl ${t.tipo === 'entrada' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                {t.tipo === 'entrada' ? <TrendingUp className="h-4.5 w-4.5" /> : <TrendingDown className="h-4.5 w-4.5" />}
                              </div>
                              <div>
                                <h4 className="text-slate-800 font-semibold text-sm leading-tight">{t.descricao}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[11px] font-semibold text-slate-400">
                                    {new Date(t.created_at).toLocaleDateString('pt-BR')}
                                  </span>
                                  <span className="bg-slate-100 text-slate-500 text-[10px] font-semibold px-1.5 py-0.5 rounded-md ">
                                    {t.categoria}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <span className={`font-semibold text-sm tracking-tight ${t.tipo === 'entrada' ? 'text-emerald-700' : 'text-slate-700'}`}>
                              {t.tipo === 'entrada' ? '+' : '-'} R$ {t.valor?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-sm text-slate-400 font-semibold">
                      Mostrando {transacoesFiltradas.length} transações
                    </span>
                    <button 
                      onClick={carregarDados}
                      className="text-emerald-800 hover:text-emerald-950 text-sm font-semibold flex items-center gap-1.5"
                    >
                      <RefreshCw className="h-3.5 w-3.5" /> Atualizar dados
                    </button>
                  </div>

                </div>
              </div>

              {/* Lado Direito: Tabela de Faturas Pagas (Soma Ativa) */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-emerald-900 font-semibold text-lg">Faturas Pagas</h2>
                      <p className="text-slate-500 text-sm font-semibold">Integradas e deduzidas do saldo</p>
                    </div>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold px-2 py-1 rounded-2xl ">
                      Ativo
                    </span>
                  </div>

                  {/* Listagem Simplificada de Faturas */}
                  {faturas.length === 0 ? (
                    <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <p className="text-slate-400 text-sm font-semibold">Nenhuma fatura registrada.</p>
                      <button 
                        onClick={() => setActiveTab('faturas')}
                        className="mt-2 text-emerald-800 hover:underline text-sm font-semibold"
                      >
                        Adicionar Fatura +
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {faturas.map((f) => (
                        <div key={f.id} className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100 flex justify-between items-center">
                          <div>
                            <h4 className="text-slate-800 font-semibold text-sm leading-tight">{f.estabelecimento}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Calendar className="h-3 w-3 text-slate-400" />
                              <span className="text-[11px] font-semibold text-slate-500">
                                {new Date(f.data_pagamento).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-semibold text-emerald-900 block">
                              R$ {f.valor?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                            <span className="text-[10px] text-slate-400  font-semibold">
                              {f.categoria}
                            </span>
                          </div>
                        </div>
                      ))}

                      {/* Caixa de Somatório Geral de Faturas */}
                      <div className="bg-emerald-850 text-white p-4 rounded-2xl mt-4">
                        <div className="flex justify-between items-center text-sm opacity-90 font-semibold">
                          <span>Soma de Faturas</span>
                          <span>{faturas.length} Itens</span>
                        </div>
                        <div className="text-xl font-semibold tracking-tight mt-1">
                          R$ {totalFaturasPagas?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>

            </div>

          </div>
        )}

        {/* CONTEÚDO DA TAB 2: CADASTRAR TRANSAÇÃO */}
        {activeTab === 'transacao' && (
          <div className="max-w-xl bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-emerald-900 font-semibold text-xl mb-2">Registrar Transação Financeira</h2>
            <p className="text-slate-500 text-sm font-semibold mb-6">Insira um novo fluxo de caixa direto no seu banco de dados</p>

            <form onSubmit={lidarNovaTransacao} className="space-y-5">
              
              {/* Toggle de Entrada / Saída */}
              <div>
                <label className="block text-slate-600 text-sm font-semibold mb-2">Tipo de Fluxo</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTipoTransacao('entrada')}
                    className={`py-3 rounded-2xl font-semibold text-sm transition duration-150 flex items-center justify-center gap-2 border ${tipoTransacao === 'entrada' ? 'bg-emerald-50 border-emerald-500 text-emerald-850 ring-1 ring-emerald-500' : 'bg-white border-slate-200 text-slate-600'}`}
                  >
                    <TrendingUp className="h-4 w-4" />
                    Entrada / Receita
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoTransacao('saida')}
                    className={`py-3 rounded-2xl font-semibold text-sm transition duration-150 flex items-center justify-center gap-2 border ${tipoTransacao === 'saida' ? 'bg-rose-50 border-rose-500 text-rose-900 ring-1 ring-rose-500' : 'bg-white border-slate-200 text-slate-600'}`}
                  >
                    <TrendingDown className="h-4 w-4" />
                    Saída / Despesa
                  </button>
                </div>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-slate-600 text-sm font-semibold mb-1.5">Descrição do Lançamento</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Supermercado Central, Salário Mensal"
                  value={descTransacao}
                  onChange={(e) => setDescTransacao(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-2xl px-4 py-3 text-sm font-semibold outline-none transition duration-150"
                />
              </div>

              {/* Valor e Categoria */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 text-sm font-semibold mb-1.5">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0,00"
                    value={valorTransacao}
                    onChange={(e) => setValorTransacao(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-2xl px-4 py-3 text-sm font-semibold outline-none transition duration-150"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 text-sm font-semibold mb-1.5">Categoria</label>
                  <select
                    value={catTransacao}
                    onChange={(e) => setCatTransacao(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-2xl px-4 py-3 text-sm font-semibold outline-none transition duration-150 appearance-none"
                  >
                    <option value="Alimentação">Alimentação</option>
                    <option value="Moradia">Moradia</option>
                    <option value="Salário">Salário</option>
                    <option value="Rendimentos">Rendimentos</option>
                    <option value="Transporte">Transporte</option>
                    <option value="Lazer">Lazer</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-800 hover:bg-emerald-950 text-white font-semibold text-sm py-3.5 px-4 rounded-2xl transition duration-200 flex items-center justify-center gap-2 shadow-sm shadow-emerald-900/10"
                >
                  {loading ? 'Processando lançamento...' : 'Salvar no Banco de Dados'}
                </button>
              </div>

            </form>
          </div>
        )}


      </main>

    </div>
  );
}