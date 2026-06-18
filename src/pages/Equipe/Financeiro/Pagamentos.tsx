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
  const [membros, setMembros] = useState<Membro[]>([]);
  const [faturas, setFaturas] = useState<FaturaConsolidada[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filtroMes, setFiltroMes] = useState<string>('2026-06'); // Mês de referência atual padrão
  const [buscaMembro, setBuscaMembro] = useState<string>('');
  const [filtroStatus, setFiltroStatus] = useState<string>('Todos');
  const [notificacao, setNotificacao] = useState<{ mensagem: string; tipo: 'sucesso' | 'erro' } | null>(null);

  // Estados para Modal de Lançar Fatura (Suporta múltiplos membros agora)
  const [modalFaturaAberto, setModalFaturaAberto] = useState<boolean>(false);
  const [filtroMembrosModal, setFiltroMembrosModal] = useState<string>('');
  const [novaFatura, setNovaFatura] = useState<{
    membro_ids: string[];
    valor: string;
    vencimento: string;
    referencia: string;
  }>({
    membro_ids: [],
    valor: '',
    vencimento: '',
    referencia: '2026-06'
  });

  // Estados para Modal de Lançar Pagamento
  const [modalPagamentoAberto, setModalPagamentoAberto] = useState<boolean>(false);
  const [faturaSelecionada, setFaturaSelecionada] = useState<FaturaConsolidada | null>(null);
  const [novoPagamento, setNovoPagamento] = useState({
    valor_pago: '',
    metodo: 'Pix'
  });


  // Carregar dados iniciais assim que o Supabase estiver pronto ou quando o filtro mudar
  useEffect(() => {
    if (supabase) {
      carregarMembros();
      carregarFaturasConsolidadas();
    } 
  }, [supabase, filtroMes]);

  // Função auxiliar para exibir notificações personalizadas (Sem usar Alert!)
  const mostrarNotificacao = (mensagem: string, tipo: 'sucesso' | 'erro') => {
    setNotificacao({ mensagem, tipo });
    setTimeout(() => {
      setNotificacao(null);
    }, 4500);
  };

  // Buscar todos os membros ativos
  const carregarMembros = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('membros')
        .select('id, nome, email, matricula, ativo')
        .eq('ativo', true)
        .order('nome', { ascending: true });

      if (error) throw error;
      setMembros(data || []);
    } catch (err: any) {
      console.error('Erro ao carregar membros:', err.message);
    }
  };

  // Buscar faturas consolidadas usando a View criada no Postgres
  const carregarFaturasConsolidadas = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const referenciaData = `${filtroMes}-01`;

      const { data, error } = await supabase
        .from('vw_financeiro_consolidado')
        .select('*')
        .eq('referencia_mes_ano', referenciaData);

      if (error) throw error;
      setFaturas(data || []);
    } catch (err: any) {
      console.warn('Usando dados de simulação locais enquanto a view no Supabase é configurada:', err.message);
      gerarDadosSimulados();
    } finally {
      setLoading(false);
    }
  };

  // Criação de dados de simulação para o painel funcionar imediatamente
  const gerarDadosSimulados = () => {
    const dadosFicticios: FaturaConsolidada[] = [
      {
        fatura_id: 'f1',
        referencia_mes_ano: '2026-06-01',
        valor_fatura: 150.00,
        data_vencimento: '2026-06-10',
        membro_id: 'm1',
        membro_nome: 'Ana Carolina Santos',
        membro_email: 'ana.carol@universidade.edu',
        membro_matricula: 'ENG2026-0032',
        total_pago: 150.00,
        saldo_devedor: 0.00,
        status_pagamento: 'Pago'
      },
      {
        fatura_id: 'f2',
        referencia_mes_ano: '2026-06-01',
        valor_fatura: 150.00,
        data_vencimento: '2026-06-10',
        membro_id: 'm2',
        membro_nome: 'Bruno Henrique Silva',
        membro_email: 'bruno.silva@universidade.edu',
        membro_matricula: 'MED2026-0105',
        total_pago: 50.00,
        saldo_devedor: 100.00,
        status_pagamento: 'Parcial'
      },
      {
        fatura_id: 'f3',
        referencia_mes_ano: '2026-06-01',
        valor_fatura: 150.00,
        data_vencimento: '2026-06-05',
        membro_id: 'm3',
        membro_nome: 'Gabriela Lima Costa',
        membro_email: 'gabi.costa@universidade.edu',
        membro_matricula: 'DIR2026-0044',
        total_pago: 0.00,
        saldo_devedor: 150.00,
        status_pagamento: 'Atrasado'
      },
      {
        fatura_id: 'f4',
        referencia_mes_ano: '2026-06-01',
        valor_fatura: 150.00,
        data_vencimento: '2026-06-25',
        membro_id: 'm4',
        membro_nome: 'Lucas Mateus Ramos',
        membro_email: 'lucas.ramos@universidade.edu',
        membro_matricula: 'COM2026-0089',
        total_pago: 0.00,
        saldo_devedor: 150.00,
        status_pagamento: 'Pendente'
      }
    ];

    // Se a lista de membros locais estiver vazia, preenche para a simulação do modal de criação
    if (membros.length === 0) {
      setMembros([
        { id: 'm1', nome: 'Ana Carolina Santos', email: 'ana.carol@universidade.edu', matricula: 'ENG2026-0032', ativo: true },
        { id: 'm2', nome: 'Bruno Henrique Silva', email: 'bruno.silva@universidade.edu', matricula: 'MED2026-0105', ativo: true },
        { id: 'm3', nome: 'Gabriela Lima Costa', email: 'gabi.costa@universidade.edu', matricula: 'DIR2026-0044', ativo: true },
        { id: 'm4', nome: 'Lucas Mateus Ramos', email: 'lucas.ramos@universidade.edu', matricula: 'COM2026-0089', ativo: true }
      ]);
    }
    setFaturas(dadosFicticios);
  };

  // Alternar a seleção de um membro específico no modal
  const alternarSelecaoMembro = (membroId: string) => {
    setNovaFatura(prev => {
      const jaSelecionado = prev.membro_ids.includes(membroId);
      const novosIds = jaSelecionado
        ? prev.membro_ids.filter(id => id !== membroId)
        : [...prev.membro_ids, membroId];
      return { ...prev, membro_ids: novosIds };
    });
  };

  // Selecionar todos os membros que estão visíveis no filtro atual do modal
  const selecionarTodosMembrosVisiveis = (membrosFiltrados: Membro[]) => {
    setNovaFatura(prev => {
      const todosIdsVisiveis = membrosFiltrados.map(m => m.id);
      // Evita duplicados combinando com o que já estava selecionado
      const novosIds = Array.from(new Set([...prev.membro_ids, ...todosIdsVisiveis]));
      return { ...prev, membro_ids: novosIds };
    });
  };

  // Limpar a seleção de membros no modal
  const limparSelecaoMembros = () => {
    setNovaFatura(prev => ({ ...prev, membro_ids: [] }));
  };

  // Ação para Lançar Nova Fatura em Lote (Multi-membros)
  const lidarComNovaFatura = async (e: React.FormEvent) => {
    e.preventDefault();
    if (novaFatura.membro_ids.length === 0 || !novaFatura.valor || !novaFatura.vencimento) {
      mostrarNotificacao('Por favor, selecione pelo menos um membro e preencha todos os campos.', 'erro');
      return;
    }

    const valorFaturaFloat = parseFloat(novaFatura.valor);
    const referenciaMes = `${novaFatura.referencia}-01`;

    // Montar o vetor de faturas para inserção em lote (Bulk Insert)
    const faturasParaInserir = novaFatura.membro_ids.map(membroId => ({
      membro_id: membroId,
      valor_total: valorFaturaFloat,
      data_vencimento: novaFatura.vencimento,
      referencia_mes_ano: referenciaMes
    }));

    if (supabase) {
      try {
        const { error } = await supabase
          .from('faturas')
          .insert(faturasParaInserir);

        if (error) throw error;

        mostrarNotificacao(`${novaFatura.membro_ids.length} fatura(s) lançada(s) com sucesso no Supabase!`, 'sucesso');
        setModalFaturaAberto(false);
        setNovaFatura({ membro_ids: [], valor: '', vencimento: '', referencia: '2026-06' });
        setFiltroMembrosModal('');
        carregarFaturasConsolidadas();
        return;
      } catch (err: any) {
        mostrarNotificacao(`Erro ao salvar no banco: ${err.message}`, 'erro');
      }
    }

    // Fluxo de Simulação Local (Caso esteja em modo offline/demonstração)
    const novasFaturasSimuladas: FaturaConsolidada[] = [];
    
    novaFatura.membro_ids.forEach(membroId => {
      const membroSelecionado = membros.find(m => m.id === membroId) || {
        id: membroId,
        nome: 'Membro Demonstrativo',
        email: 'demo@link.com',
        matricula: 'DEMO-123'
      };

      novasFaturasSimuladas.push({
        fatura_id: Math.random().toString(),
        referencia_mes_ano: referenciaMes,
        valor_fatura: valorFaturaFloat,
        data_vencimento: novaFatura.vencimento,
        membro_id: membroSelecionado.id,
        membro_nome: membroSelecionado.nome,
        membro_email: membroSelecionado.email,
        membro_matricula: membroSelecionado.matricula || 'MAT-DEMO',
        total_pago: 0,
        saldo_devedor: valorFaturaFloat,
        status_pagamento: 'Pendente'
      });
    });

    setFaturas(prev => [...novasFaturasSimuladas, ...prev]);
    mostrarNotificacao(`${novaFatura.membro_ids.length} fatura(s) criada(s) localmente para teste!`, 'sucesso');
    setModalFaturaAberto(false);
    setNovaFatura({ membro_ids: [], valor: '', vencimento: '', referencia: '2026-06' });
    setFiltroMembrosModal('');
  };

  // Ação para Registrar Pagamento
  const lidarComNovoPagamento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!faturaSelecionada || !novoPagamento.valor_pago) {
      mostrarNotificacao('Por favor, preencha o valor do pagamento.', 'erro');
      return;
    }

    const valorPagoFloat = parseFloat(novoPagamento.valor_pago);

    if (supabase) {
      try {
        const { error } = await supabase
          .from('pagamentos')
          .insert([
            {
              fatura_id: faturaSelecionada.fatura_id,
              valor_pago: valorPagoFloat,
              metodo_pagamento: novoPagamento.metodo
            }
          ]);

        if (error) throw error;

        mostrarNotificacao('Pagamento efetuado e reconciliado no Supabase!', 'sucesso');
        setModalPagamentoAberto(false);
        setNovoPagamento({ valor_pago: '', metodo: 'Pix' });
        carregarFaturasConsolidadas();
        return;
      } catch (err: any) {
        mostrarNotificacao(`Erro ao registrar: ${err.message}`, 'erro');
      }
    }

    // Reconciliação local imediata para testes visuais
    setFaturas(prev => prev.map(f => {
      if (f.fatura_id === faturaSelecionada.fatura_id) {
        const novoTotalPago = f.total_pago + valorPagoFloat;
        const novoSaldo = f.valor_fatura - novoTotalPago;
        let novoStatus: 'Pago' | 'Parcial' | 'Atrasado' | 'Pendente' = 'Pendente';
        if (novoTotalPago >= f.valor_fatura) novoStatus = 'Pago';
        else if (novoTotalPago > 0) novoStatus = 'Parcial';
        
        return {
          ...f,
          total_pago: novoTotalPago,
          saldo_devedor: Math.max(0, novoSaldo),
          status_pagamento: novoStatus
        };
      }
      return f;
    }));
    
    mostrarNotificacao('Pagamento registrado localmente!', 'sucesso');
    setModalPagamentoAberto(false);
    setNovoPagamento({ valor_pago: '', metodo: 'Pix' });
  };

  // Cálculos financeiros consolidados para os cards estatísticos superiores
  const totalFaturado = faturas.reduce((acc, curr) => acc + curr.valor_fatura, 0);
  const totalRecebido = faturas.reduce((acc, curr) => acc + curr.total_pago, 0);
  const totalPendente = faturas.reduce((acc, curr) => acc + curr.saldo_devedor, 0);
  
  // Taxa de adimplência do mês
  const taxaAdimplencia = totalFaturado > 0 ? Math.round((totalRecebido / totalFaturado) * 100) : 0;

  // Filtragem dos dados exibidos na tabela principal
  const faturasFiltradas = faturas.filter(f => {
    const correspondeBusca = 
      f.membro_nome.toLowerCase().includes(buscaMembro.toLowerCase()) ||
      (f.membro_matricula && f.membro_matricula.toLowerCase().includes(buscaMembro.toLowerCase())) ||
      f.membro_email.toLowerCase().includes(buscaMembro.toLowerCase());
    
    const correspondeStatus = 
      filtroStatus === 'Todos' || 
      f.status_pagamento === filtroStatus;

    return correspondeBusca && correspondeStatus;
  });

  // Filtragem de membros no modal de criação
  const membrosFiltradosModal = membros.filter(m => 
    m.nome.toLowerCase().includes(filtroMembrosModal.toLowerCase()) ||
    m.email.toLowerCase().includes(filtroMembrosModal.toLowerCase()) ||
    (m.matricula && m.matricula.toLowerCase().includes(filtroMembrosModal.toLowerCase()))
  );

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

            {/* Lançamento de faturas */}
            <button 
              onClick={() => {
                setNovaFatura({ membro_ids: [], valor: '', vencimento: '', referencia: filtroMes });
                setModalFaturaAberto(true);
              }}
              className="flex items-center gap-2 bg-emerald-900 hover:bg-emerald-950 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Lançar Fatura
            </button>
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
                {totalFaturado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
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
                {totalRecebido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
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
                {totalPendente.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
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
            {['Todos', 'Pago', 'Parcial', 'Pendente', 'Atrasado'].map((status) => (
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
                  <th className="py-4 px-6 text-right">Valor Pago</th>
                  <th className="py-4 px-6 text-right">Saldo Devedor</th>
                  <th className="py-4 px-6 text-center">Status</th>
                  <th className="py-4 px-6 text-center">Ações</th>
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
                          <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-950 flex items-center justify-center font-bold text-sm">
                            {f.membro_nome.charAt(0)}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 block">{f.membro_nome}</span>
                            <span className="text-slate-400 text-sm font-semibold block">{f.membro_email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Matrícula */}
                      <td className="py-4 px-6 font-semibold text-slate-600">
                        {f.membro_matricula || 'N/D'}
                      </td>

                      {/* Vencimento */}
                      <td className="py-4 px-6 font-semibold text-slate-600">
                        {new Date(f.data_vencimento).toLocaleDateString('pt-BR')}
                      </td>

                      {/* Valor Total */}
                      <td className="py-4 px-6 text-right font-semibold text-slate-900">
                        {f.valor_fatura.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>

                      {/* Valor Pago */}
                      <td className="py-4 px-6 text-right font-semibold text-emerald-800">
                        {f.total_pago.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>

                      {/* Saldo Devedor */}
                      <td className={`py-4 px-6 text-right font-semibold ${f.saldo_devedor > 0 ? 'text-amber-800' : 'text-slate-400'}`}>
                        {f.saldo_devedor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-semibold ${
                          f.status_pagamento === 'Pago' 
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : f.status_pagamento === 'Parcial'
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : f.status_pagamento === 'Atrasado'
                            ? 'bg-rose-50 text-rose-800 border border-rose-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {f.status_pagamento === 'Pago' && <CheckCircle2 className="w-3.5 h-3.5" />}
                          {f.status_pagamento === 'Parcial' && <AlertCircle className="w-3.5 h-3.5" />}
                          {f.status_pagamento === 'Atrasado' && <XCircle className="w-3.5 h-3.5" />}
                          {f.status_pagamento === 'Pendente' && <Clock className="w-3.5 h-3.5" />}
                          {f.status_pagamento}
                        </span>
                      </td>

                      {/* Ações */}
                      <td className="py-4 px-6 text-center">
                        <button
                          disabled={f.status_pagamento === 'Pago'}
                          onClick={() => {
                            setFaturaSelecionada(f);
                            setModalPagamentoAberto(true);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                            f.status_pagamento === 'Pago'
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              : 'bg-emerald-900 text-white hover:bg-emerald-950 shadow-sm'
                          }`}
                        >
                          Pagar
                        </button>
                      </td>

                    </tr>
                  ))
                )}

              </tbody>
            </table>
          </div>
        </section>

      </main>

      {/* MODAL 1: Lançamento de Faturas (Agora com Multiseleção) */}
      {modalFaturaAberto && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all my-8">
            
            <div className="bg-emerald-900 px-6 py-4 flex items-center justify-between text-white">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Plus className="w-5 h-5" /> Nova fatura
              </h3>
              <button 
                onClick={() => setModalFaturaAberto(false)}
                className="text-emerald-100 hover:text-white text-xl font-semibold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={lidarComNovaFatura} className="p-6 space-y-4 grid grid-cols-2 gap-4">
              
                {/* Seleção de Múltiplos Membros */}
                <div className="space-y-2">
                    <div className="flex  flex-col justify-between">
                    <label className="block text-sm font-semibold text-slate-700  tracking-wider">
                        Selecionar Membros ({novaFatura.membro_ids.length} selecionados) 
                    </label>
                    <div className="flex gap-2">
                        <button
                        type="button"
                        onClick={() => selecionarTodosMembrosVisiveis(membrosFiltradosModal)}
                        className="text-sm font-semibold text-emerald-800 hover:text-emerald-950 underline"
                        >
                        Selecionar Filtrados
                        </button>
                        <span className="text-slate-300 text-sm">|</span>
                        <button
                        type="button"
                        onClick={limparSelecaoMembros}
                        className="text-sm font-semibold text-rose-700 hover:text-rose-900 underline"
                        >
                        Limpar
                        </button>
                    </div>
                    </div>

                    {/* Caixa de pesquisa rápida de membros dentro do modal */}
                    <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={filtroMembrosModal}
                        onChange={(e) => setFiltroMembrosModal(e.target.value)}
                        placeholder="Pesquisar por nome ou matrícula..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-800 font-semibold"
                    />
                    </div>

                    {/* Lista de Membros com Scroll */}
                    <div className="border border-slate-200 rounded-xl max-h-48 overflow-y-auto divide-y divide-slate-100 bg-slate-50/50">
                    {membrosFiltradosModal.length === 0 ? (
                        <div className="p-4 text-center text-sm text-slate-400 font-semibold">
                        Nenhum membro encontrado.
                        </div>
                    ) : (
                        membrosFiltradosModal.map(membro => {
                        const isSelected = novaFatura.membro_ids.includes(membro.id);
                        return (
                            <div 
                            key={membro.id}
                            onClick={() => alternarSelecaoMembro(membro.id)}
                            className={`flex items-center justify-between px-4 py-2.5 cursor-pointer transition-colors ${
                                isSelected ? 'bg-emerald-50/60 hover:bg-emerald-50' : 'hover:bg-slate-100'
                            }`}
                            >
                            <div className="flex items-center gap-3 ">
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                isSelected ? 'bg-emerald-900 border-emerald-900 text-white' : 'border-slate-300 bg-white'
                                }`}>
                                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                </div>
                                <div>
                                <span className="text-sm font-semibold text-slate-900 block truncate max-w-[200px]">{membro.nome}</span>
                                
                                </div>
                            </div>
                            </div>
                        );
                        })
                    )}
                    </div>
                </div>
                <div>
                {/* Informações da Fatura */}
                <div className="grid grid-cols-1 gap-4">
                    <div>
                    <label className="block text-sm font-semibold text-slate-700  tracking-wider mb-1">
                        Mês de Referência
                    </label>
                    <input
                        type="month"
                        value={novaFatura.referencia}
                        onChange={(e) => setNovaFatura(prev => ({ ...prev, referencia: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm font-semibold focus:outline-none"
                    />
                    </div>

                    <div>
                    <label className="block text-sm font-semibold text-slate-700  tracking-wider mb-1">
                        Valor da Fatura (R$)
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        required
                        placeholder="150.00"
                        value={novaFatura.valor}
                        onChange={(e) => setNovaFatura(prev => ({ ...prev, valor: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm font-semibold focus:outline-none"
                    />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-slate-700  tracking-wider mb-1">
                    Data de Vencimento *
                    </label>
                    <input
                    type="date"
                    required
                    value={novaFatura.vencimento}
                    onChange={(e) => setNovaFatura(prev => ({ ...prev, vencimento: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm font-semibold focus:outline-none"
                    />
                </div>

                <span className="text-sm font-semibold text-slate-700">
                {novaFatura.membro_ids.length > 0 && novaFatura.valor ? (
                    <>
                    Total a faturar: <p className="text-emerald-900 text-lg">
                        {(novaFatura.membro_ids.length * parseFloat(novaFatura.valor || '0')).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                    </>
                ) : 'Selecione membros e insira o valor.'}
                </span>
                <div className="pt-4 flex flex-col items-end justify-between border-t border-slate-100">
                    
                    <div className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={() => setModalFaturaAberto(false)}
                        className=" py-2 text-sm font-semibold text-slate-700 hover:text-slate-700"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="px-5 py-2 bg-emerald-900 hover:bg-emerald-950 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
                    >
                        Gerar Faturas
                    </button>
                    </div>
                </div>

                </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Registrar Recebimento / Pagamento */}
      {modalPagamentoAberto && faturaSelecionada && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all">
            
            <div className="bg-emerald-900 px-6 py-4 flex items-center justify-between text-white">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <DollarSign className="w-5 h-5" /> Registrar Recebimento
              </h3>
              <button 
                onClick={() => setModalPagamentoAberto(false)}
                className="text-emerald-100 hover:text-white text-xl font-semibold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={lidarComNovoPagamento} className="p-6 space-y-4">
              
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-1.5">
                <span className="text-sm font-semibold text-slate-400  tracking-wider block">Fatura Selecionada</span>
                <span className="font-semibold text-slate-900 block">{faturaSelecionada.membro_nome}</span>
                <div className="flex justify-between items-center text-sm text-slate-700 font-semibold pt-1">
                  <span>Valor Faturado: {faturaSelecionada.valor_fatura.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                  <span className="text-emerald-800">Já pago: {faturaSelecionada.total_pago.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700  tracking-wider mb-1">
                  Valor que está sendo Pago (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  max={faturaSelecionada.saldo_devedor}
                  placeholder={`Máximo: R$ ${faturaSelecionada.saldo_devedor}`}
                  value={novoPagamento.valor_pago}
                  onChange={(e) => setNovoPagamento(prev => ({ ...prev, valor_pago: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-800/20"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700  tracking-wider mb-1">
                  Meio de Pagamento
                </label>
                <select
                  value={novoPagamento.metodo}
                  onChange={(e) => setNovoPagamento(prev => ({ ...prev, metodo: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm font-semibold focus:outline-none"
                >
                  <option value="Pix">Pix</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Transferência">Transferência Bancária</option>
                  <option value="Cartão">Cartão de Crédito/Débito</option>
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalPagamentoAberto(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-900 hover:bg-emerald-950 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
                >
                  Registrar Pagamento
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}