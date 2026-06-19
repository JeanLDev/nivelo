import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  User, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Plus, 
  Search, 
  Filter, 
  TrendingUp, 
  Clock,
  ArrowUpRight,
  Check,
  Users
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import storage from "@/src/utilies/storage"

// ============================================================================
// CONFIGURAÇÃO DO SUPABASE
// ============================================================================
const SUPABASE_URL = "https://seu-projeto-supabase.supabase.co"; // Substituir com seu URL real
const SUPABASE_ANON_KEY = "sua-chave-anon-key-aqui"; // Substituir com sua chave real

// Interfaces TypeScript para Tipagem Segura
interface Membro {
  id: string;
  nome: string;
  email: string;
  matricula: string;
  ativo: boolean;
}

interface FaturaConsolidada {
  fatura_id: string;
  referencia_mes_ano: string;
  valor_fatura: number;
  data_vencimento: string;
  membro_id: string;
  membro_nome: string;
  membro_email: string;
  membro_matricula: string;
  total_pago: number;
  saldo_devedor: number;
  status_pagamento: 'Pago' | 'Parcial' | 'Atrasado' | 'Pendente';
}

export default function App() {

  // Estados da Aplicação
  const [faturas, setFaturas] = useState<FaturaConsolidada[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filtroMes, setFiltroMes] = useState<string>('2026-06'); // Mês de referência atual padrão
  const [buscaMembro, setBuscaMembro] = useState<string>('');
  const [filtroStatus, setFiltroStatus] = useState<string>('Todos');
  const [notificacao, setNotificacao] = useState<{ mensagem: string; tipo: 'sucesso' | 'erro' } | null>(null);


  // Carregar dados iniciais assim que o Supabase estiver pronto ou quando o filtro mudar
  useEffect(() => {
    if (supabase) {
      carregarFaturasConsolidadas();
    } 
  }, [supabase, filtroMes]);




  // Buscar faturas consolidadas usando a View criada no Postgres
  const carregarFaturasConsolidadas = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const collab = await storage.getCollaborator()

      const { data, error } = await supabase
        .from('faturas')
        .select('*,membros(*)')
        .eq('user_id', collab?.user_id);


      if (error) throw error;
      setFaturas(data || []);
    } catch (err: any) {
      console.warn('Usando dados de simulação locais enquanto a view no Supabase é configurada:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Cálculos financeiros consolidados para os cards estatísticos superiores
  const totalFaturado = faturas.reduce((acc, curr) => acc + curr.valor_total, 0);
  const totalRecebido = faturas.filter(p=> p.status == 'paid').reduce((acc, curr) => acc + curr.valor_total, 0);
  const totalPendente = faturas.filter(p=> p.status !== 'paid').reduce((acc, curr) => acc + curr.valor_total, 0);
  
  // Taxa de adimplência do mês
  const taxaAdimplencia = totalFaturado > 0 ? Math.round((totalRecebido / totalFaturado) * 100) : 0;

  // Filtragem dos dados exibidos na tabela principal
  const faturasFiltradas = faturas.filter((f) => {
    const correspondeBusca =
      f.membros?.nome?.toLowerCase().includes(buscaMembro.toLowerCase()) ||
      f.membros?.matricula?.toLowerCase().includes(buscaMembro.toLowerCase()) ||
      f.membros?.email?.toLowerCase().includes(buscaMembro.toLowerCase());

    const correspondeStatus =
      filtroStatus === 'Todos' ||
      f.status === filtroStatus;

    return correspondeBusca && correspondeStatus;
  });



  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased">
      
      {/* Alerta de Notificação Flutuante */}
      {notificacao && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-xl transition-all duration-300 border ${
          notificacao.tipo === 'sucesso' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {notificacao.tipo === 'sucesso' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-rose-600" />}
          <span className="font-semibold text-sm">{notificacao.mensagem}</span>
        </div>
      )}

      {/* Header Principal */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-emerald-900 text-white text-sm font-semibold rounded-full  tracking-wider">
                Financeiro
              </span>
              <span className="text-slate-400 text-sm font-semibold">•</span>
              <span className="text-slate-700 text-sm font-semibold  tracking-wider">Membros</span>
            </div>
            <h1 className="text-2xl font-semibold text-emerald-950 mt-1 flex items-center gap-2">
              Mensalidades &amp; Receitas
            </h1>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Seletor de Mês de Referência */}
            <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
              <Calendar className="w-4 h-4 text-slate-700 ml-2" />
              <input 
                type="month" 
                value={filtroMes}
                onChange={(e) => setFiltroMes(e.target.value)}
                className="bg-transparent border-none text-slate-700 text-sm font-semibold py-1.5 px-2 focus:ring-0 cursor-pointer"
              />
            </div>

          </div>
        </div>
      </header>

      {/* Conteúdo Principal do Painel */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Bloco de Cards Estatísticos */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          {/* Card 1: Total Faturado */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-slate-700 text-sm   tracking-wider block">Total Previsto</span>
              <span className="text-2xl font-bold text-slate-900 block">
                {totalFaturado?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
              <span className="text-sm  text-slate-400 flex items-center gap-1">
                Faturas deste mês
              </span>
            </div>
            <div className="p-3 bg-slate-100 rounded-lg text-slate-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          {/* Card 2: Total Recebido */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-emerald-800 text-sm   tracking-wider block">Total Recebido</span>
              <span className="text-2xl font-bold text-emerald-950 block">
                {totalRecebido?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
              <span className="text-sm  text-emerald-600 flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5" /> {taxaAdimplencia}% recebido do total
              </span>
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg text-emerald-800">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          {/* Card 3: Total Pendente */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-amber-800 text-sm   tracking-wider block">Total em Aberto</span>
              <span className="text-2xl font-bold text-amber-950 block">
                {totalPendente?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
              <span className="text-sm  text-amber-700 flex items-center gap-1">
                Aguardando pagamento
              </span>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg text-amber-800">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          {/* Card 4: Taxa de Adimplência */}
          <div className="bg-white p-6 rounded-xl border border-emerald-900/10 shadow-sm flex justify-between items-start bg-gradient-to-br from-emerald-50/30 to-white">
            <div className="space-y-2">
              <span className="text-emerald-900 text-sm   tracking-wider block">Adimplência</span>
              <span className="text-2xl font-bold text-emerald-900 block">
                {taxaAdimplencia}%
              </span>
              <div className="w-28 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div className="bg-emerald-800 h-1.5 rounded-full" style={{ width: `${taxaAdimplencia}%` }}></div>
              </div>
            </div>
            <div className="p-3 bg-emerald-900 text-white rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

        </section>

        {/* Bloco de Filtros da Lista */}
        <section className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          
          {/* Caixa de Busca */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={buscaMembro}
              onChange={(e) => setBuscaMembro(e.target.value)}
              placeholder="Buscar por nome, e-mail ou matrícula..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 font-semibold"
            />
          </div>

          {/* Filtros rápidos de Status */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <span className="text-sm font-semibold text-slate-400  tracking-wider mr-2 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filtrar Status:
            </span>
            {['Todos', 'paid', 'pending'].map((status) => (
              <button
                key={status}
                onClick={() => setFiltroStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  filtroStatus === status 
                    ? 'bg-emerald-900 text-white shadow-sm' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

        </section>

        {/* Tabela de Faturas */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-700 text-sm tracking-wider">
                  <th className="py-4 px-6">Membro</th>
                  <th className="py-4 px-6">Identificação</th>
                  <th className="py-4 px-6">Data Vencimento</th>
                  <th className="py-4 px-6 text-right">Valor da Fatura</th>
                  <th className="py-4 px-6 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 font-semibold">
                      Carregando dados financeiros...
                    </td>
                  </tr>
                ) : faturasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 font-semibold">
                      Nenhuma fatura encontrada com os filtros aplicados neste mês.
                    </td>
                  </tr>
                ) : (
                  faturasFiltradas.map((f) => (
                    <tr key={f.fatura_id} className="hover:bg-slate-50/50 transition-colors">
                      
                      {/* Membro Nome e Email */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div>
                            <span className="font-semibold text-slate-900 block">{f.membros?.nome}</span>
                            <span className="text-slate-400 text-sm font-semibold block">{f.membros?.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Matrícula */}
                      <td className="py-4 px-6 font-semibold text-slate-600">
                        {f.membros?.matricula || 'N/D'}
                      </td>

                      {/* Vencimento */}
                      <td className="py-4 px-6 font-semibold text-slate-600">
                        {new Date(f.data_vencimento).toLocaleDateString('pt-BR')}
                      </td>

                      {/* Valor Total */}
                      <td className="py-4 px-6 text-right font-semibold text-slate-900">
                        {f.valor_total?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-semibold ${
                          f.status === 'paid' 
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : f.status === 'Parcial'
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : f.status === 'Atrasado'
                            ? 'bg-rose-50 text-rose-800 border border-rose-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {f.status === 'paid' && <CheckCircle2 className="w-3.5 h-3.5" />}
                          {f.status === 'pending' && <AlertCircle className="w-3.5 h-3.5" />}
                          {f.status}
                        </span>
                      </td>


                    </tr>
                  ))
                )}

              </tbody>
            </table>
          </div>
        </section>

      </main>

     

    </div>
  );
}