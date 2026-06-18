import React, { useState, useEffect } from 'react';
// Importação segura utilizando ESM CDN para garantir compatibilidade no ambiente de execução do navegador
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import { 
  Users, 
  Clock, 
  Settings, 
  Plus, 
  Minus, 
  History, 
  Paperclip, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  Calendar, 
  Search, 
  Filter,
  X,
  ExternalLink,
  Database,
  Info
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';

// --- CONFIGURAÇÃO DO SUPABASE ---
const DEFAULT_SUPABASE_URL = ""; 
const DEFAULT_SUPABASE_ANON_KEY = "";

// --- INTERFACES DE DADOS ---
interface Membro {
  id: string;
  nome: string;
  email: string;
  ativo: boolean;
  matricula: string;
}

interface MembroComHoras extends Membro {
  saldoHoras: number;
}

interface Meeting {
  id: string;
  title: string;
  date: string;
}

interface TipoEvento {
  id: string;
  nome: string;
  horas_padrao: number;
  descricao: string;
  ativo: boolean;
}

interface LancamentoHoras {
  id: string;
  criado_em: string;
  membro_id: string;
  membros?: { nome: string };
  tipo_evento_id: string | null;
  tipos_evento?: { nome: string } | null;
  meeting_id: string | null;
  meeting_minutes?: { title: string; date: string } | null;
  tipo_lancamento: 'credito' | 'debito';
  quantidade_horas: number;
  justificativa: string;
  data_evento: string;
  anexo_url: string | null;
  anexo_nome: string | null;
}

export default function BancoHorasManager() {
  
  // --- ESTADOS DA APLICAÇÃO ---
  const [membros, setMembros] = useState<MembroComHoras[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [tiposEvento, setTiposEvento] = useState<TipoEvento[]>([]);
  const [lancamentos, setLancamentos] = useState<LancamentoHoras[]>([]);
  
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingAttendees, setLoadingAttendees] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // Controle de Abas
  const [activeTab, setActiveTab] = useState<'membros' | 'historico' | 'configuracoes'>('membros');

  // Filtros e Pesquisas
  const [searchQuery, setSearchQuery] = useState('');
  const [membroFiltro, setMembroFiltro] = useState('todos');

  // Modais de Criação/Edição
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState<TipoEvento | null>(null);
  const [configForm, setConfigForm] = useState({ nome: '', horas_padrao: 2, descricao: '' });

  const [showLancamentoModal, setShowLancamentoModal] = useState(false);
  const [lancamentoTipo, setLancamentoTipo] = useState<'credito' | 'debito'>('credito');
  const [selectedMembroId, setSelectedMembroId] = useState<string>('');
  const [selectedMembrosMultiples, setSelectedMembrosMultiples] = useState<string[]>([]);
  const [isBulkInsert, setIsBulkInsert] = useState(false);
  
  // Formulário do Lançamento
  const [lancForm, setLancForm] = useState({
    tipo_evento_id: '',
    meeting_id: '',
    quantidade_horas: 2,
    justificativa: '',
    data_evento: new Date().toISOString().split('T')[0],
    anexo_nome: '',
    anexo_url: ''
  });

  const [fileToUpload, setFileToUpload] = useState<File | null>(null);


  // --- CARREGAMENTO DE DADOS ---
  const fetchData = async () => {
    if (!supabase) return;

    try {
      setLoading(true);
      setErrorMsg(null);

      // 1. Buscar membros ativos
      const { data: membrosData, error: mError } = await supabase
        .from('membros')
        .select('id, nome, email, ativo, matricula')
        .eq('ativo', true)
        .order('nome', { ascending: true });

      if (mError) throw mError;

      // 2. Buscar Reuniões (meeting_minutes)
      const { data: meetingsData, error: meetError } = await supabase
        .from('meeting_minutes')
        .select('id, title, date')
        .order('date', { ascending: false });

      if (meetError) throw meetError;
      setMeetings(meetingsData || []);

      // 3. Buscar Configurações de Horas (tipos_evento)
      const { data: tiposData, error: tError } = await supabase
        .from('tipos_evento')
        .select('*')
        .order('nome', { ascending: true });

      if (tError) throw tError;
      setTiposEvento(tiposData || []);

      // 4. Buscar Lançamentos de Horas
      const { data: lancData, error: lError } = await supabase
        .from('banco_horas')
        .select(`
          id, criado_em, membro_id, tipo_evento_id, meeting_id, tipo_lancamento, 
          quantidade_horas, justificativa, data_evento, anexo_url, anexo_nome,
          membros(nome), tipos_evento(nome), meeting_minutes(title, date)
        `)
        .order('criado_em', { ascending: false });

      if (lError) throw lError;
      setLancamentos(lancData || []);

      // 5. Calcular saldo de horas de cada membro em memória
      const lancs = lancData || [];
      const membrosComSaldo = (membrosData || []).map((memb: any) => {
        const saldo = lancs
          .filter((l: any) => l.membro_id === memb.id)
          .reduce((acc: number, curr: any) => {
            const horas = parseFloat(curr.quantidade_horas);
            return curr.tipo_lancamento === 'credito' ? acc + horas : acc - horas;
          }, 0);
        return { ...memb, saldoHoras: saldo };
      });

      setMembros(membrosComSaldo);

    } catch (err: any) {
      console.error(err);
      setErrorMsg('Erro ao carregar dados do Supabase. Verifique se as tabelas e políticas de acesso estão criadas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (supabase) {
      fetchData();
    }
  }, [supabase]);

  // Ajustar automaticamente o valor padrão de horas ao mudar o tipo de evento
  useEffect(() => {
    if (lancForm.tipo_evento_id) {
      const selectedType = tiposEvento.find(t => t.id === lancForm.tipo_evento_id);
      if (selectedType) {
        setLancForm(prev => ({ ...prev, quantidade_horas: selectedType.horas_padrao }));
      }
    }
  }, [lancForm.tipo_evento_id, tiposEvento]);

  // --- LÓGICA DE DETECÇÃO DE REUNIÃO (SOLICITAÇÃO DO USUÁRIO) ---
  // Quando uma reunião é clicada/selecionada, buscar somente os integrantes presentes na reunião
  useEffect(() => {
    const fetchMeetingAttendees = async () => {
      if (!lancForm.meeting_id || !supabase) return;

      try {
        setLoadingAttendees(true);
        setErrorMsg(null);

        // Busca em meeting_attendees filtrando por ID da reunião e status present
        const { data: attendeesData, error: attError } = await supabase
          .from('meeting_attendees')
          .select('member_id')
          .eq('meeting_id', lancForm.meeting_id)
          .eq('status', 'present');

        if (attError) throw attError;

        if (attendeesData && attendeesData.length > 0) {
          const presentIds = attendeesData.map((att: any) => att.member_id);
          
          // Altera automaticamente o formulário para modo múltiplo/grupo
          setIsBulkInsert(true);
          setSelectedMembrosMultiples(presentIds);
          
          // Atualiza a justificativa sugerida
          const reuniaoNome = meetings.find(m => m.id === lancForm.meeting_id)?.title || 'Reunião';
          setLancForm(prev => ({
            ...prev,
            justificativa: `Presença confirmada na ata da atividade: ${reuniaoNome}.`
          }));

          triggerMessage('success', `${presentIds.length} membros com presença confirmada ('present') foram pré-selecionados.`);
        } else {
          // Se ninguém for encontrado com status "present"
          setSelectedMembrosMultiples([]);
          triggerMessage('error', 'Nenhum integrante foi marcado com status "present" nesta ata de reunião.');
        }

      } catch (err: any) {
        console.error("Erro ao carregar os participantes da reunião", err);
        triggerMessage('error', 'Erro ao obter integrantes com presença confirmada na reunião.');
      } finally {
        setLoadingAttendees(false);
      }
    };

    fetchMeetingAttendees();
  }, [lancForm.meeting_id, supabase]);

  // Auxiliar para mensagens temporárias
  const triggerMessage = (type: 'success' | 'error', text: string) => {
    if (type === 'success') {
      setSuccessMsg(text);
      setTimeout(() => setSuccessMsg(null), 5000);
    } else {
      setErrorMsg(text);
      setTimeout(() => setErrorMsg(null), 5000);
    }
  };

  // --- CRUD CONFIGURAÇÃO DE EVENTOS ---
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    try {
      if (!configForm.nome.trim()) {
        triggerMessage('error', 'O nome do evento é obrigatório.');
        return;
      }

      if (editingConfig) {
        const { error } = await supabase
          .from('tipos_evento')
          .update({
            nome: configForm.nome,
            horas_padrao: configForm.horas_padrao,
            descricao: configForm.descricao
          })
          .eq('id', editingConfig.id);

        if (error) throw error;
        triggerMessage('success', 'Configuração de evento atualizada com sucesso!');
      } else {
        const { error } = await supabase
          .from('tipos_evento')
          .insert([{
            nome: configForm.nome,
            horas_padrao: configForm.horas_padrao,
            descricao: configForm.descricao,
            ativo: true
          }]);

        if (error) throw error;
        triggerMessage('success', 'Nova configuração de evento adicionada!');
      }

      setShowConfigModal(false);
      setEditingConfig(null);
      setConfigForm({ nome: '', horas_padrao: 2, descricao: '' });
      fetchData();
    } catch (err: any) {
      triggerMessage('error', err.message || 'Erro ao salvar configuração.');
    }
  };

  const deleteConfig = async (id: string) => {
    if (!window.confirm('Deseja realmente excluir este tipo de evento? Lançamentos antigos não serão alterados.')) return;
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from('tipos_evento')
        .delete()
        .eq('id', id);

      if (error) throw error;
      triggerMessage('success', 'Configuração excluída com sucesso.');
      fetchData();
    } catch (err: any) {
      triggerMessage('error', 'Não foi possível excluir. Este tipo pode estar sendo usado em lançamentos.');
    }
  };

  const startEditConfig = (tipo: TipoEvento) => {
    setEditingConfig(tipo);
    setConfigForm({
      nome: tipo.nome,
      horas_padrao: tipo.horas_padrao,
      descricao: tipo.descricao || ''
    });
    setShowConfigModal(true);
  };

  // --- ARQUIVOS / ANEXOS ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileToUpload(file);
      setLancForm(prev => ({
        ...prev,
        anexo_nome: file.name,
        anexo_url: `https://mock-storage.supabase.co/banco-horas/${Date.now()}_${file.name}`
      }));
    }
  };

  // --- REGISTRAR LANÇAMENTO (CRÉDITO / DÉBITO) ---
  const handleCreateLancamento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    if (!lancForm.justificativa.trim()) {
      triggerMessage('error', 'A justificativa é estritamente obrigatória para qualquer alteração.');
      return;
    }

    const alvos: string[] = isBulkInsert ? selectedMembrosMultiples : [selectedMembroId];
    const filteredAlvos = alvos.filter(id => !!id);

    if (filteredAlvos.length === 0) {
      triggerMessage('error', 'Selecione pelo menos um membro para o lançamento.');
      return;
    }

    if (lancForm.quantidade_horas <= 0) {
      triggerMessage('error', 'A quantidade de horas deve ser maior do que zero.');
      return;
    }

    try {
      setLoading(true);

      let finalAnexoUrl = lancForm.anexo_url;
      if (fileToUpload) {
        finalAnexoUrl = `https://mock-supabase-storage.com/files/${Date.now()}-${fileToUpload.name}`;
      }

      const inserts = filteredAlvos.map(membroId => ({
        membro_id: membroId,
        tipo_evento_id: lancForm.tipo_evento_id || null,
        meeting_id: lancForm.meeting_id || null,
        tipo_lancamento: lancamentoTipo,
        quantidade_horas: lancForm.quantidade_horas,
        justificativa: lancForm.justificativa,
        data_evento: lancForm.data_evento,
        anexo_url: finalAnexoUrl || null,
        anexo_nome: lancForm.anexo_nome || null
      }));

      const { error } = await supabase
        .from('banco_horas')
        .insert(inserts);

      if (error) throw error;

      triggerMessage('success', `${inserts.length} lançamento(s) de ${lancamentoTipo} realizado(s) com sucesso!`);
      
      setShowLancamentoModal(false);
      setFileToUpload(null);
      setIsBulkInsert(false);
      setSelectedMembrosMultiples([]);
      setSelectedMembroId('');
      setLancForm({
        tipo_evento_id: '',
        meeting_id: '',
        quantidade_horas: 2,
        justificativa: '',
        data_evento: new Date().toISOString().split('T')[0],
        anexo_nome: '',
        anexo_url: ''
      });

      fetchData();
    } catch (err: any) {
      triggerMessage('error', err.message || 'Erro ao salvar lançamentos.');
    } finally {
      setLoading(false);
    }
  };

  const deleteLancamento = async (id: string) => {
    if (!window.confirm('Tem certeza de que deseja apagar este lançamento? O saldo dos membros será recalculado automaticamente.')) return;
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from('banco_horas')
        .delete()
        .eq('id', id);

      if (error) throw error;
      triggerMessage('success', 'Lançamento deletado. Saldo atualizado!');
      fetchData();
    } catch (err: any) {
      triggerMessage('error', 'Falha ao deletar o lançamento.');
    }
  };


  // --- FILTRAGENS E SELEÇÕES ---
  const filteredMembros = membros.filter(membro => {
    const query = searchQuery.toLowerCase();
    return (
      membro.nome.toLowerCase().includes(query) ||
      membro.email.toLowerCase().includes(query) ||
      (membro.matricula && membro.matricula.toLowerCase().includes(query))
    );
  });

  const filteredLancamentos = lancamentos.filter(lanc => {
    const matchMembro = membroFiltro === 'todos' || lanc.membro_id === membroFiltro;
    return matchMembro;
  });

  const toggleMembroSelection = (membroId: string) => {
    setSelectedMembrosMultiples(prev => 
      prev.includes(membroId) 
        ? prev.filter(id => id !== membroId) 
        : [...prev, membroId]
    );
  };

  const selectAllMembrosForBulk = () => {
    if (selectedMembrosMultiples.length === membros.length) {
      setSelectedMembrosMultiples([]);
    } else {
      setSelectedMembrosMultiples(membros.map(m => m.id));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased">
      {/* HEADER DA LIGA - TEMA CLARO COM TOQUES VERDE ESCURO */}
      <header className="border-b border-emerald-100 bg-white/90 backdrop-blur-md sticky top-0 z-10 px-4 md:px-8 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
              <Clock className="w-6 h-6 text-emerald-700" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-emerald-950">Banco de Horas</h1>
              <p className="text-xs text-emerald-700/80">Sistema de Gestão de Banco de Horas</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">

            <div className="flex bg-slate-100 border border-slate-200/60 rounded-xl p-1 gap-1">
              <button
                onClick={() => setActiveTab('membros')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm transition-all duration-200 flex items-center gap-2 ${
                  activeTab === 'membros' 
                    ? 'bg-emerald-800 text-white font-semibold shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <Users className="w-4 h-4" />
                Membros
              </button>
              <button
                onClick={() => setActiveTab('historico')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm transition-all duration-200 flex items-center gap-2 ${
                  activeTab === 'historico' 
                    ? 'bg-emerald-800 text-white font-semibold shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <History className="w-4 h-4" />
                Lançamentos
              </button>
              <button
                onClick={() => setActiveTab('configuracoes')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm transition-all duration-200 flex items-center gap-2 ${
                  activeTab === 'configuracoes' 
                    ? 'bg-emerald-800 text-white font-semibold shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <Settings className="w-4 h-4" />
                Configuração
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        
        {/* NOTIFICAÇÕES */}
        {successMsg && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center gap-3 text-xs sm:text-sm shadow-sm animate-fade-in">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-3 text-xs sm:text-sm shadow-sm animate-fade-in">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* --- ABA DE MEMBROS --- */}
        {activeTab === 'membros' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Saldos dos Integrantes</h2>
                <p className="text-xs sm:text-sm text-slate-500 ">Controle de créditos e débitos de horas individuais ou em lote baseado na presença.</p>
              </div>

              <div className="flex w-full md:w-auto gap-2">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar membro ou matrícula..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-sm"
                  />
                </div>
                <button
                  onClick={() => {
                    setLancamentoTipo('credito');
                    setIsBulkInsert(true);
                    setShowLancamentoModal(true);
                  }}
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Lançar em Grupo
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-700 rounded-full animate-spin"></div>
                <span className="text-xs sm:text-sm text-slate-500">Atualizando saldos dos membros...</span>
              </div>
            ) : filteredMembros.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-xl border border-slate-200/80 text-slate-500 text-xs sm:text-sm shadow-sm">
                Nenhum membro ativo encontrado. Certifique-se de que o Supabase está conectado e as tabelas populadas.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMembros.map((membro) => {
                  const corSaldo = membro.saldoHoras >= 0 ? 'text-emerald-700' : 'text-rose-700';
                  const bgSaldo = membro.saldoHoras >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100';

                  return (
                    <div 
                      key={membro.id} 
                      className="bg-white border border-slate-200/80 rounded-xl p-5 hover:border-emerald-700/30 transition-all shadow-sm hover:shadow-md group"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold text-slate-800 group-hover:text-emerald-700 transition-colors">{membro.nome}</h3>
                          <p className="text-xs text-slate-500 mt-0.5">{membro.email}</p>
                          <span className="inline-block mt-2 py-0.5 rounded-xl text-xs text-slate-600 font-medium">
                            Matrícula: {membro.matricula || 'N/D'}
                          </span>
                        </div>
                        <div className={`px-3 py-2 rounded-xl border ${bgSaldo} text-right shadow-sm`}>
                          <p className="text-xs text-slate-500  font-semibold">Saldo</p>
                          <p className={`text-lg font-semibold ${corSaldo}`}>
                            {membro.saldoHoras > 0 ? `+${membro.saldoHoras}` : membro.saldoHoras}h
                          </p>
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-4 flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedMembroId(membro.id);
                            setLancamentoTipo('credito');
                            setIsBulkInsert(false);
                            setShowLancamentoModal(true);
                          }}
                          className="flex-1 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Adicionar
                        </button>
                        <button
                          onClick={() => {
                            setSelectedMembroId(membro.id);
                            setLancamentoTipo('debito');
                            setIsBulkInsert(false);
                            setShowLancamentoModal(true);
                          }}
                          className="flex-1 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                        >
                          <Minus className="w-3.5 h-3.5" />
                          Subtrair
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* --- ABA DE HISTÓRICO DE LANÇAMENTOS --- */}
        {activeTab === 'historico' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Extrato Geral de Horas</h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">Detalhamento dos créditos e débitos com comprovantes anexados.</p>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={membroFiltro}
                  onChange={(e) => setMembroFiltro(e.target.value)}
                  className="w-full md:w-64 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-700 focus:outline-none focus:border-emerald-600 shadow-sm"
                >
                  <option value="todos">Todos os integrantes</option>
                  {membros.map(m => (
                    <option key={m.id} value={m.id}>{m.nome}</option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-700 rounded-full animate-spin"></div>
              </div>
            ) : filteredLancamentos.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-xl border border-slate-200/80 text-slate-400 text-xs sm:text-sm shadow-sm">
                Nenhum lançamento de horas registrado para esta seleção.
              </div>
            ) : (
              <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-xs  text-slate-500 font-semibold">
                        <th className="p-4">Integrante</th>
                        <th className="p-4">Data Lançamento</th>
                        <th className="p-4">Evento / Reunião</th>
                        <th className="p-4">Justificativa</th>
                        <th className="p-4">Quantidade</th>
                        <th className="p-4">Documento</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                      {filteredLancamentos.map((lanc) => {
                        const ehCredito = lanc.tipo_lancamento === 'credito';
                        return (
                          <tr key={lanc.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-4">
                              <span className="font-semibold text-slate-800">{lanc.membros?.nome || 'Membro Deletado'}</span>
                            </td>
                            <td className="p-4 text-slate-500 text-xs">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                {new Date(lanc.criado_em).toLocaleDateString('pt-BR')}
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="max-w-[200px] truncate">
                                {lanc.tipos_evento?.nome && (
                                  <span className="inline-block px-2 py-0.5 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-800 font-semibold mb-1">
                                    {lanc.tipos_evento.nome}
                                  </span>
                                )}
                                {lanc.meeting_minutes && (
                                  <div className="text-xs text-slate-500 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                                    {lanc.meeting_minutes.title}
                                  </div>
                                )}
                                {!lanc.tipo_evento_id && !lanc.meeting_id && (
                                  <span className="text-xs text-slate-400 italic">Lançamento Avulso</span>
                                )}
                              </div>
                            </td>
                            <td className="p-4 max-w-[240px]">
                              <p className="text-xs text-slate-600 line-clamp-2" title={lanc.justificativa}>
                                {lanc.justificativa}
                              </p>
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-1 rounded-xl text-xs font-semibold ${
                                ehCredito 
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' 
                                  : 'bg-rose-50 text-rose-800 border border-rose-100'
                              }`}>
                                {ehCredito ? '+' : '-'}{lanc.quantidade_horas} horas
                              </span>
                            </td>
                            <td className="p-4">
                              {lanc.anexo_url ? (
                                <a 
                                  href={lanc.anexo_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-xs text-emerald-700 hover:text-emerald-900 hover:underline flex items-center gap-1 font-semibold"
                                >
                                  <Paperclip className="w-3 h-3" />
                                  <span className="max-w-[100px] truncate">{lanc.anexo_nome || 'Ver Anexo'}</span>
                                  <ExternalLink className="w-3 h-3 shrink-0" />
                                </a>
                              ) : (
                                <span className="text-xs text-slate-400 italic">Sem anexo</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- ABA DE CONFIGURAÇÕES DE TIPOS DE EVENTO --- */}
        {activeTab === 'configuracoes' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Pesos e Atividades</h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">Defina o valor padrão de horas dado a cada tipo de compromisso da liga.</p>
              </div>

              <button
                onClick={() => {
                  setEditingConfig(null);
                  setConfigForm({ nome: '', horas_padrao: 2, descricao: '' });
                  setShowConfigModal(true);
                }}
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Novo Peso de Evento
              </button>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-700 rounded-full animate-spin"></div>
              </div>
            ) : tiposEvento.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-xs sm:text-sm shadow-sm">
                Nenhum evento configurado ainda.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tiposEvento.map((tipo) => (
                  <div key={tipo.id} className="bg-white border border-slate-200/80 rounded-xl p-5 flex flex-col justify-between shadow-sm hover:shadow transition">
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-800 font-semibold">
                          {tipo.horas_padrao} horas padrão
                        </span>
                      </div>
                      <h3 className="font-semibold text-slate-800">{tipo.nome}</h3>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                        {tipo.descricao || 'Sem descrição específica.'}
                      </p>
                    </div>

                    <div className="border-t border-slate-100 pt-4 mt-4 flex gap-2">
                      <button
                        onClick={() => startEditConfig(tipo)}
                        className="flex-1 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold transition"
                      >
                        Editar Regra
                      </button>
                      <button
                        onClick={() => deleteConfig(tipo.id)}
                        className="p-1.5 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-xl transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>


      {/* --- MODAL PARA ADICIONAR/EDITAR CONFIGURAÇÃO DE EVENTOS --- */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md overflow-hidden shadow-xl">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="font-semibold text-slate-800 text-sm sm:text-base">
                {editingConfig ? 'Editar Tipo de Evento' : 'Criar Novo Tipo de Evento'}
              </h3>
              <button 
                onClick={() => setShowConfigModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="p-5 space-y-4">
              <div>
                <label className="block text-xs text-slate-500 font-semibold mb-1  tracking-wider">
                  Nome da Atividade / Evento *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Reunião Geral, Evento Externo"
                  value={configForm.nome}
                  onChange={(e) => setConfigForm(prev => ({ ...prev, nome: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-500 font-semibold mb-1  tracking-wider">
                  Horas Padrão de Recompensa *
                </label>
                <input
                  type="number"
                  required
                  step="0.25"
                  min="0"
                  max="100"
                  value={configForm.horas_padrao}
                  onChange={(e) => setConfigForm(prev => ({ ...prev, horas_padrao: parseFloat(e.target.value) }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-500 font-semibold mb-1  tracking-wider">
                  Descrição complementar
                </label>
                <textarea
                  placeholder="Instruções e regras gerais de atribuição deste peso de horas..."
                  value={configForm.descricao}
                  onChange={(e) => setConfigForm(prev => ({ ...prev, descricao: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-emerald-600 resize-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs sm:text-sm transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-950 text-white rounded-xl text-xs sm:text-sm font-semibold transition shadow-sm"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL PARA REALIZAR LANÇAMENTO --- */}
      {showLancamentoModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl my-8 overflow-hidden shadow-xl">
            
            {/* Header */}
            <div className={`p-5 border-b border-slate-200 flex justify-between items-center ${
              lancamentoTipo === 'credito' ? 'bg-emerald-50' : 'bg-rose-50'
            }`}>
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-xl ${
                  lancamentoTipo === 'credito' ? 'bg-emerald-800 text-white' : 'bg-rose-800 text-white'
                }`}>
                  {lancamentoTipo === 'credito' ? <Plus className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                </div>
                <h3 className="font-semibold text-slate-800 text-sm sm:text-base">
                  {lancamentoTipo === 'credito' ? 'Lançar Crédito de Horas' : 'Lançar Débito de Horas'}
                </h3>
              </div>
              <button 
                onClick={() => setShowLancamentoModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLancamento} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              
              {/* Associação a uma Reunião da Liga */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <label className="block text-xs text-slate-700 font-semibold  tracking-wider">
                    Vincular a uma Reunião da Liga?
                  </label>
                </div>
                <select
                  value={lancForm.meeting_id}
                  onChange={(e) => setLancForm(prev => ({ ...prev, meeting_id: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-emerald-600"
                >
                  <option value="">Não vincular (Evento presencial/Atividade livre)</option>
                  {meetings.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.title} ({new Date(m.date).toLocaleDateString('pt-BR')})
                    </option>
                  ))}
                </select>
              </div>

              {/* Alvos do Lançamento */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs text-slate-600 font-semibold  tracking-wider">
                    Membro(s) Alvo *
                  </label>
                  {!isBulkInsert ? (
                    <button 
                      type="button" 
                      onClick={() => setIsBulkInsert(true)}
                      className="text-xs text-emerald-800 hover:underline font-semibold"
                    >
                      Mudar para lançamento em lote
                    </button>
                  ) : (
                    <button 
                      type="button" 
                      onClick={() => setIsBulkInsert(false)}
                      className="text-xs text-emerald-800 hover:underline font-semibold"
                    >
                      Lançar para apenas um membro
                    </button>
                  )}
                </div>

                {loadingAttendees && (
                  <div className="py-2 flex items-center gap-2 text-xs text-emerald-800 font-semibold">
                    <span className="w-4 h-4 border-2 border-emerald-800 border-t-transparent rounded-full animate-spin"></span>
                    Buscando membros presentes da ata...
                  </div>
                )}

                {!isBulkInsert ? (
                  <select
                    required
                    value={selectedMembroId}
                    onChange={(e) => setSelectedMembroId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-emerald-600"
                  >
                    <option value="">Selecione o Integrante...</option>
                    {membros.map(m => (
                      <option key={m.id} value={m.id}>{m.nome} (Matrícula: {m.matricula || 'N/D'})</option>
                    ))}
                  </select>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200/80">
                      <span className="text-xs text-slate-500 font-medium">Selecione os integrantes:</span>
                      <button
                        type="button"
                        onClick={selectAllMembrosForBulk}
                        className="text-xs px-2.5 py-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl transition font-semibold"
                      >
                        {selectedMembrosMultiples.length === membros.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                      {membros.map(m => (
                        <label 
                          key={m.id} 
                          className="flex items-center gap-2 p-2 bg-white hover:bg-slate-100 rounded-xl cursor-pointer border border-slate-200/60 transition text-xs"
                        >
                          <input
                            type="checkbox"
                            checked={selectedMembrosMultiples.includes(m.id)}
                            onChange={() => toggleMembroSelection(m.id)}
                            className="rounded-xl border-slate-300 text-emerald-800 focus:ring-emerald-800 bg-white"
                          />
                          <span className="truncate text-slate-700" title={m.nome}>{m.nome}</span>
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      Selecionado(s): <span className="text-emerald-700 font-semibold">{selectedMembrosMultiples.length}</span> membros de {membros.length}.
                    </p>
                  </div>
                )}
              </div>

              {/* Bloco de Atividade */}
              <div>
                <label className="block text-xs text-slate-500 font-semibold mb-1  tracking-wider">
                  Regra de Atividade (Opcional)
                </label>
                <select
                  value={lancForm.tipo_evento_id}
                  onChange={(e) => setLancForm(prev => ({ ...prev, tipo_evento_id: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-emerald-600"
                >
                  <option value="">Lançamento Avulso (Inserir peso manualmente abaixo)</option>
                  {tiposEvento.map(t => (
                    <option key={t.id} value={t.id}>{t.nome} ({t.horas_padrao}h)</option>
                  ))}
                </select>
              </div>

              {/* Quantidade e Data */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-500 font-semibold mb-1  tracking-wider">
                    Quantidade de Horas a {lancamentoTipo === 'credito' ? 'Adicionar' : 'Remover'} *
                  </label>
                  <input
                    type="number"
                    required
                    step="0.25"
                    min="0.25"
                    max="500"
                    value={lancForm.quantidade_horas}
                    onChange={(e) => setLancForm(prev => ({ ...prev, quantidade_horas: parseFloat(e.target.value) }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-emerald-600 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-500 font-semibold mb-1  tracking-wider">
                    Data da Realização do Evento
                  </label>
                  <input
                    type="date"
                    required
                    value={lancForm.data_evento}
                    onChange={(e) => setLancForm(prev => ({ ...prev, data_evento: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* Justificativa */}
              <div>
                <label className="block text-xs text-slate-500 font-semibold mb-1  tracking-wider flex justify-between">
                  <span>Justificativa da Alteração *</span>
                  <span className="text-rose-600 text-xs lowercase italic font-normal">obrigatória</span>
                </label>
                <textarea
                  required
                  placeholder="Justifique o motivo desta atribuição ou retirada de horas..."
                  value={lancForm.justificativa}
                  onChange={(e) => setLancForm(prev => ({ ...prev, justificativa: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-emerald-600 resize-none shadow-inner"
                />
              </div>

              {/* Anexos de Arquivos */}
              <div>
                <label className="block text-xs text-slate-500 font-semibold mb-1.5  tracking-wider">
                  Anexar Comprovante / Ata (Opcional)
                </label>
                <div className="border-2 border-dashed border-slate-300 hover:border-emerald-700/60 rounded-xl p-4 transition flex flex-col items-center justify-center bg-slate-50 cursor-pointer relative">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Paperclip className="w-6 h-6 text-slate-400 mb-2" />
                  <p className="text-xs text-slate-700 font-semibold">
                    {fileToUpload ? fileToUpload.name : 'Clique para selecionar um comprovante (PDF, JPG, PNG)'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {fileToUpload ? `(${(fileToUpload.size / (1024 * 1024)).toFixed(2)} MB)` : 'Ideal para comprovação de presença externa'}
                  </p>
                </div>
              </div>

              {/* Rodapé do Modal */}
              <div className="flex gap-2 justify-end pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowLancamentoModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs sm:text-sm transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || loadingAttendees}
                  className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition shadow-sm ${
                    loading || loadingAttendees
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                      : lancamentoTipo === 'credito'
                        ? 'bg-emerald-800 hover:bg-emerald-900 text-white'
                        : 'bg-rose-800 hover:bg-rose-900 text-white'
                  }`}
                >
                  {loading ? 'Processando...' : lancamentoTipo === 'credito' ? 'Confirmar Crédito' : 'Confirmar Débito'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}