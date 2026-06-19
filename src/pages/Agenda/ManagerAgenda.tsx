import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  X, 
  Check, 
  ChevronLeft, 
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

// --- CONFIGURAÇÃO DO SUPABASE ---
// Substitua pelas credenciais do seu projeto Supabase para ativar a sincronização na nuvem.
const SUPABASE_URL = ""; 
const SUPABASE_ANON_KEY = "";

// --- INTERFACES ---
interface Evento {
  id?: string;
  title: string;
  description: string;
  event_date: string;
  start_time: string;
  end_time: string;
  category: string;
  created_at?: string;
}

export default function App() {
  // Estados para dados da agenda
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [erro, setErro] = useState<string | null>(null);
  const [usandoMock, setUsandoMock] = useState<boolean>(false);
  
  // Estado para busca e filtro
  const [busca, setBusca] = useState<string>('');
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('todos');
  const [dataSelecionada, setDataSelecionada] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Estado para navegação do calendário mensal
  const [mesCorrente, setMesCorrente] = useState<Date>(new Date());

  // Estado para o formulário (Criação/Edição)
  const [modalAberto, setModalAberto] = useState<boolean>(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState<Evento>({
    title: '',
    description: '',
    event_date: new Date().toISOString().split('T')[0],
    start_time: '09:00',
    end_time: '10:00',
    category: 'pessoal'
  });

  // Notificações locais temporárias
  const [notificacao, setNotificacao] = useState<{ mensagem: string; tipo: 'sucesso' | 'erro' } | null>(null);


  // Buscar eventos quando o cliente do Supabase estiver pronto
  useEffect(() => {
    if (supabase && !usandoMock) {
      carregarEventos();
    }
  }, [supabase, usandoMock]);

  // Função para mostrar notificações temporárias
  const mostrarNotificacao = (mensagem: string, tipo: 'sucesso' | 'erro' = 'sucesso') => {
    setNotificacao({ mensagem, tipo });
    setTimeout(() => {
      setNotificacao(null);
    }, 4000);
  };

  // Listar Eventos (Read)
  const carregarEventos = async () => {
    if (usandoMock || !supabase) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('agenda')
        .select('*')
        .order('event_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      setEventos(data || []);
      setErro(null);
    } catch (err: any) {
      console.error(err);
      setErro("Erro ao carregar dados do Supabase. Utilizando modo de simulação local.");
      setUsandoMock(true);
    } finally {
      setLoading(false);
    }
  };

  // Salvar Evento (Create / Update)
  const salvarEvento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      mostrarNotificacao("O título é obrigatório", "erro");
      return;
    }

    // Validação de horário simples
    if (form.start_time > form.end_time) {
      mostrarNotificacao("O horário de início não pode ser maior que o de fim", "erro");
      return;
    }
    const categoriaFinal =
        form.category === 'outro'
            ? form.customCategory
            : form.category;

    try {
      setLoading(true);
      if (editandoId) {
        // Atualizar evento existente no Supabase
        const { error } = await supabase
          .from('agenda')
          .update({
            title: form.title,
            description: form.description,
            event_date: form.event_date,
            start_time: form.start_time,
            end_time: form.end_time,
            category: categoriaFinal
          })
          .eq('id', editandoId);

        if (error) throw error;
        mostrarNotificacao("Compromisso atualizado com sucesso!");
      } else {
        // Criar novo evento no Supabase
        const { error } = await supabase
          .from('agenda')
          .insert([{
            title: form.title,
            description: form.description,
            event_date: form.event_date,
            start_time: form.start_time,
            end_time: form.end_time,
            category: categoriaFinal
          }]);

        if (error) throw error;
        mostrarNotificacao("Compromisso agendado com sucesso!");
      }

      setModalAberto(false);
      resetarFormulario();
      carregarEventos();
    } catch (err: any) {
      console.error(err);
      mostrarNotificacao("Erro ao salvar dados no Supabase: " + err.message, "erro");
    } finally {
      setLoading(false);
    }
  };

  // Excluir Evento (Delete)
  const excluirEvento = async (id: string) => {
    const confirmar = window.confirm("Deseja realmente remover este compromisso?");
    if (!confirmar) return;

    if (usandoMock || !supabase) {
      // Excluir localmente
      setLoading(true);
      setTimeout(() => {
        setEventos(prev => prev.filter(ev => ev.id !== id));
        mostrarNotificacao("Compromisso removido localmente com sucesso!");
        setLoading(false);
      }, 300);
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('agenda')
        .delete()
        .eq('id', id);

      if (error) throw error;
      mostrarNotificacao("Compromisso removido com sucesso!");
      carregarEventos();
    } catch (err: any) {
      console.error(err);
      mostrarNotificacao("Erro ao remover compromisso do Supabase: " + err.message, "erro");
    } finally {
      setLoading(false);
    }
  };

  // Preparar edição de evento (Populate Form)
  const prepararEdicao = (evento: Evento) => {
    setEditandoId(evento.id || null);
    setForm({
      title: evento.title,
      description: evento.description || '',
      event_date: evento.event_date,
      start_time: evento.start_time.substring(0, 5),
      end_time: evento.end_time.substring(0, 5),
      category: evento.category
    });
    setModalAberto(true);
  };

  const resetarFormulario = () => {
    setEditandoId(null);
    setForm({
      title: '',
      description: '',
      event_date: dataSelecionada,
      start_time: '09:00',
      end_time: '10:00',
      category: 'pessoal'
    });
  };

  const abrirNovoModal = () => {
    resetarFormulario();
    setModalAberto(true);
  };

  // Filtragem de eventos baseada em busca, categoria e data selecionada
  const eventosFiltrados = eventos.filter(evento => {
    const correspondeBusca = 
      evento.title.toLowerCase().includes(busca.toLowerCase()) ||
      (evento.description && evento.description.toLowerCase().includes(busca.toLowerCase()));
    
    const correspondeCategoria = categoriaFiltro === 'todos' || evento.category === categoriaFiltro;
    const correspondeData = evento.event_date === dataSelecionada;

    return correspondeBusca && correspondeCategoria && correspondeData;
  });

  // Alterar data por dia
  const alterarDia = (dias: number) => {
    const dataAtual = new Date(dataSelecionada + 'T00:00:00');
    dataAtual.setDate(dataAtual.getDate() + dias);
    const novaData = dataAtual.toISOString().split('T')[0];
    setDataSelecionada(novaData);
    setMesCorrente(new Date(dataAtual));
    setForm(prev => ({ ...prev, event_date: novaData }));
  };

  // Formatação de data amigável para o cabeçalho
  const formatarDataCabecalho = (dataStr: string) => {
    const opcoes: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    const data = new Date(dataStr + 'T00:00:00');
    return data.toLocaleDateString('pt-BR', opcoes);
  };

  // Helper para cores de categorias
  const obterCorCategoria = (cat: string) => {
    switch (cat) {
      case 'trabalho':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'saude':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'pessoal':
        return 'bg-lime-100 text-lime-800 border-lime-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  // --- LÓGICA DO CALENDÁRIO MENSAL ---
  const obterDiasDoMes = () => {
    const ano = mesCorrente.getFullYear();
    const mes = mesCorrente.getMonth();
    
    // Primeiro dia do mês
    const primeiroDiaMes = new Date(ano, mes, 1);
    // Último dia do mês
    const ultimoDiaMes = new Date(ano, mes + 1, 0);
    
    const diasNoMes = ultimoDiaMes.getDate();
    const diaSemanaInicial = primeiroDiaMes.getDay(); // 0 (Domingo) a 6 (Sábado)

    const dias = [];
    
    // Preencher espaços em branco do início da semana
    for (let i = 0; i < diaSemanaInicial; i++) {
      dias.push(null);
    }
    
    // Preencher os dias reais
    for (let dia = 1; dia <= diasNoMes; dia++) {
      const dataString = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
      dias.push({
        numero: dia,
        dataString
      });
    }

    return dias;
  };

  const navegarMes = (offset: number) => {
    const novoMes = new Date(mesCorrente.getFullYear(), mesCorrente.getMonth() + offset, 1);
    setMesCorrente(novoMes);
  };

  const formatarNomeMes = (data: Date) => {
    const nomeMes = data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    return nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1);
  };

  const obterEventosDoDia = (dataStr: string) => {
    return eventos.filter(e => e.event_date === dataStr);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-700 font-sans antialiased pb-12">
      {/* Alerta informativo sobre o estado de conexão */}
      {usandoMock && (
        <div className="bg-emerald-50 border-b border-emerald-150 p-4 text-center">
          <div className="max-w-4xl mx-auto flex items-center justify-center gap-2 text-emerald-800 text-sm">
            <AlertCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="font-semibold text-left">
              Modo De Demonstração Ativo! Insira As Suas Credenciais Do Supabase No Início Do Código (<code className="bg-emerald-100 px-1 py-0.5 rounded-md font-mono text-xs">SUPABASE_URL</code> E <code className="bg-emerald-100 px-1 py-0.5 rounded-md font-mono text-xs">SUPABASE_ANON_KEY</code>) Para Sincronizar Na Nuvem. Todas As Ações Estão Funcionando Localmente Para Você Testar.
            </p>
          </div>
        </div>
      )}

      {/* Topo / Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
              <CalendarIcon className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-800 tracking-tight">Agenda Inteligente</h1>
              <p className="text-xs text-slate-600">Organização simples e limpa</p>
            </div>
          </div>

          {/* Filtros rápidos e adicionar */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-grow md:flex-grow-0">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-4 w-4 text-slate-600" />
              </span>
              <input
                type="text"
                placeholder="Buscar compromissos..."
                className="w-full md:w-60 pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
              {busca && (
                <button 
                  onClick={() => setBusca('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-600 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              onClick={abrirNovoModal}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2 rounded-xl transition-colors shadow-sm shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Novo compromisso</span>
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-5xl mx-auto px-4 mt-6">
        {erro && (
          <div className="bg-rose-50 border border-rose-100 text-rose-800 p-4 rounded-xl mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Aviso de conexão</p>
              <p className="text-xs text-rose-700/95 mt-1">{erro}</p>
            </div>
          </div>
        )}

        {/* Layout de Agenda */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Coluna Esquerda: Calendário Mensal e Filtros */}
          <section className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Calendário Mensal Completo */}
            <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-sm text-slate-800">Calendário Mensal</h2>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => navegarMes(-1)}
                    className="p-1.5 hover:bg-slate-50 rounded-lg transition-colors text-slate-600 hover:text-slate-900 border border-transparent hover:border-slate-100"
                    title="Mês anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-semibold text-slate-700 px-2">
                    {formatarNomeMes(mesCorrente)}
                  </span>
                  <button 
                    onClick={() => navegarMes(1)}
                    className="p-1.5 hover:bg-slate-50 rounded-lg transition-colors text-slate-600 hover:text-slate-900 border border-transparent hover:border-slate-100"
                    title="Próximo mês"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Dias da Semana */}
              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((dia, idx) => (
                  <span key={idx} className="text-[10px] font-semibold text-slate-600 py-1">
                    {dia}
                  </span>
                ))}
              </div>

              {/* Grade de Dias do Mês */}
              <div className="grid grid-cols-7 gap-1">
                {obterDiasDoMes().map((diaInfo, idx) => {
                  if (!diaInfo) {
                    return <div key={`empty-${idx}`} className="aspect-square" />;
                  }

                  const { numero, dataString } = diaInfo;
                  const eHoje = dataString === new Date().toISOString().split('T')[0];
                  const estaSelecionado = dataString === dataSelecionada;
                  const eventosDoDia = obterEventosDoDia(dataString);

                  return (
                    <button
                      key={dataString}
                      onClick={() => {
                        setDataSelecionada(dataString);
                        setForm(prev => ({ ...prev, event_date: dataString }));
                      }}
                      className={`aspect-square rounded-xl flex flex-col items-center justify-between p-1.5 transition-all border relative ${
                        estaSelecionado 
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : eHoje 
                            ? 'bg-lime-50 text-lime-900 border-lime-200'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <span className="text-xs font-semibold">{numero}</span>
                      
                      {/* Indicadores de Compromissos */}
                      <div className="flex gap-0.5 justify-center w-full overflow-hidden">
                        {eventosDoDia.slice(0, 3).map((evento, evIdx) => (
                          <span 
                            key={evIdx} 
                            className={`w-1.5 h-1.5 rounded-full ${
                              estaSelecionado 
                                ? 'bg-white' 
                                : evento.category === 'trabalho' 
                                  ? 'bg-emerald-500' 
                                  : evento.category === 'saude' 
                                    ? 'bg-teal-500' 
                                    : 'bg-lime-500'
                            }`}
                          />
                        ))}
                        {eventosDoDia.length > 3 && (
                          <span className={`text-[8px] leading-none ${estaSelecionado ? 'text-white' : 'text-slate-600'}`}>
                            +
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Atalhos Rápidos */}
              <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100">
                <button
                  onClick={() => {
                    const hoje = new Date().toISOString().split('T')[0];
                    setDataSelecionada(hoje);
                    setMesCorrente(new Date());
                    setForm(prev => ({ ...prev, event_date: hoje }));
                  }}
                  className={`py-1.5 text-xs rounded-xl border text-center transition-colors font-semibold ${
                    dataSelecionada === new Date().toISOString().split('T')[0]
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Ir para Hoje
                </button>
                <button
                  onClick={() => {
                    const amanha = new Date();
                    amanha.setDate(amanha.getDate() + 1);
                    const amanhaStr = amanha.toISOString().split('T')[0];
                    setDataSelecionada(amanhaStr);
                    setMesCorrente(new Date(amanha));
                    setForm(prev => ({ ...prev, event_date: amanhaStr }));
                  }}
                  className={`py-1.5 text-xs rounded-xl border text-center transition-colors font-semibold ${
                    dataSelecionada === new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0]
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Amanhã
                </button>
              </div>
            </div>

          </section>

          {/* Coluna Direita: Listagem de Eventos do Dia */}
          <section className="lg:col-span-7">
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
              
              {/* Dia Ativo */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-5 mb-5 gap-3">
                <div>
                  <span className="text-xs text-slate-600 font-semibold">Mostrando compromissos de</span>
                  <h2 className="text-lg font-semibold text-slate-800 capitalize">
                    {formatarDataCabecalho(dataSelecionada)}
                  </h2>
                </div>
                <div className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-100 px-3 py-1.5 rounded-xl font-semibold self-start sm:self-auto">
                  {eventosFiltrados.length} {eventosFiltrados.length === 1 ? 'compromisso' : 'compromissos'}
                </div>
              </div>

              {/* Navegação Rápida entre Dias */}
              <div className="flex justify-between items-center mb-6 bg-slate-50 p-2 rounded-xl">
                <button 
                  onClick={() => alterarDia(-1)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-950 border border-slate-100 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Dia Anterior</span>
                </button>
                <span className="text-xs font-semibold text-slate-500">Navegação rápida</span>
                <button 
                  onClick={() => alterarDia(1)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-950 border border-slate-100 transition-colors"
                >
                  <span>Próximo Dia</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Lista ou Estado Vazio */}
              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs text-slate-600">Sincronizando compromissos...</p>
                </div>
              ) : eventosFiltrados.length === 0 ? (
                <div className="py-16 flex flex-col items-center justify-center text-center">
                  <div className="bg-emerald-50/50 p-4 rounded-full border border-emerald-100 mb-3">
                    <CalendarIcon className="w-8 h-8 text-emerald-400" />
                  </div>
                  <p className="text-slate-800 font-semibold text-sm">Nada planejado para este dia</p>
                  <p className="text-slate-600 text-xs mt-1 max-w-xs">
                    Aproveite o dia ou adicione novas tarefas e reuniões diretamente na sua agenda.
                  </p>
                  <button
                    onClick={abrirNovoModal}
                    className="mt-4 inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-semibold px-4 py-2 rounded-xl transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Criar primeiro evento do dia
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {eventosFiltrados.map((evento) => (
                    <div
                      key={evento.id}
                      className="group flex flex-col sm:flex-row sm:items-start justify-between p-4 rounded-xl border border-slate-100 hover:border-emerald-200/60 hover:bg-emerald-50/10 transition-all gap-4"
                    >
                      {/* Horário & Categoria + Detalhes */}
                      <div className="flex items-start gap-4">
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex flex-col items-center justify-center text-slate-600 min-w-16 shrink-0">
                          <Clock className="w-3.5 h-3.5 mb-1 text-slate-600" />
                          <span className="text-xs font-semibold">{evento.start_time.substring(0, 5)}</span>
                          <span className="text-[10px] text-slate-600">Até {evento.end_time.substring(0, 5)}</span>
                        </div>
                        
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`text-[10px] px-2 py-0.5 rounded-lg border font-semibold capitalize ${obterCorCategoria(evento.category)}`}>
                              {evento.category}
                            </span>
                            <h3 className="text-sm font-semibold text-slate-800 group-hover:text-emerald-950 transition-colors">
                              {evento.title}
                            </h3>
                          </div>
                          {evento.description && (
                            <p className="text-xs text-slate-600 max-w-md leading-relaxed whitespace-pre-line">
                              {evento.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Botões de Ação */}
                      <div className="flex items-center gap-1 self-end sm:self-auto opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => prepararEdicao(evento)}
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-slate-700 transition-colors"
                          title="Editar compromisso"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => evento.id && excluirEvento(evento.id)}
                          className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-600 hover:text-rose-600 transition-colors"
                          title="Remover compromisso"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Modal: Cadastro & Edição (CRUD) */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-xl shadow-lg border border-slate-100 max-w-md w-full overflow-hidden">
            
            {/* Cabeçalho Modal */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="bg-emerald-50 p-1.5 rounded-lg border border-emerald-100">
                  <CalendarIcon className="w-4 h-4 text-emerald-600" />
                </div>
                <h3 className="text-sm font-semibold text-slate-800">
                  {editandoId ? 'Editar compromisso' : 'Adicionar compromisso'}
                </h3>
              </div>
              <button
                onClick={() => setModalAberto(false)}
                className="p-1 hover:bg-slate-150 rounded-lg text-slate-600 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Formulário */}
            <form onSubmit={salvarEvento} className="p-6 space-y-4">
              
              {/* Título */}
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Título</label>
                <input
                  type="text"
                  required
                  placeholder="Reunião de projeto, consulta, etc."
                  value={form.title}
                  onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-700"
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Descrição</label>
                <textarea
                  rows={3}
                  placeholder="Detalhes adicionais, pautas ou notas..."
                  value={form.description}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-700 resize-none"
                />
              </div>

              {/* Data do Evento */}
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Data</label>
                <input
                  type="date"
                  required
                  value={form.event_date}
                  onChange={(e) => {
                    setForm(prev => ({ ...prev, event_date: e.target.value }));
                    setDataSelecionada(e.target.value);
                    setMesCorrente(new Date(e.target.value));
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-700"
                />
              </div>

              {/* Grid Horários */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1">Início</label>
                  <div className="relative">
                    <input
                      type="time"
                      required
                      value={form.start_time}
                      onChange={(e) => setForm(prev => ({ ...prev, start_time: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-700"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1">Fim</label>
                  <div className="relative">
                    <input
                      type="time"
                      required
                      value={form.end_time}
                      onChange={(e) => setForm(prev => ({ ...prev, end_time: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-700"
                    />
                  </div>
                </div>
              </div>

              {/* Categorias (Radio Buttons) */}
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">Categoria</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'pessoal', label: 'Pessoal', color: 'bg-lime-50 border-lime-200 text-lime-800' },
                    { id: 'trabalho', label: 'Trabalho', color: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
                    { id: 'saude', label: 'Saúde', color: 'bg-teal-50 border-teal-200 text-teal-800' },
                    { id: 'outro', label: 'Outro', color: 'bg-slate-50 border-slate-200 text-slate-800' }
                  ].map((cat) => (
                    <label
                      key={cat.id}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center cursor-pointer transition-all ${
                        form.category === cat.id
                          ? `${cat.color} ring-2 ring-offset-1 ring-emerald-500/20 font-semibold`
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="category"
                        value={cat.id}
                        checked={form.category === cat.id}
                        onChange={() => setForm(prev => ({ ...prev, category: cat.id }))}
                        className="sr-only"
                      />
                      <span className="text-xs font-semibold">{cat.label}</span>
                    </label>
                  ))}
                </div>
                {form.category === 'outro' && (
                    <input
                        type="text"
                        placeholder="Digite a categoria"
                        value={form.customCategory || ''}
                        onChange={(e) =>
                        setForm(prev => ({
                            ...prev,
                            customCategory: e.target.value
                        }))
                        }
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-500 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-700 mt-3"
                    />
                    )}
              </div>

              {/* Botões de Ação Modal */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-sm font-semibold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  {loading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                  <span>{editandoId ? 'Atualizar' : 'Salvar'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}