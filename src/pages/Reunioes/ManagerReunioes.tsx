import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Users, 
  User, 
  FileText, 
  Plus, 
  Trash2, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Briefcase, 
  Mail,
  Search,
  BookOpen,
  CheckSquare,
  ChevronRight,
  Info
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

// --- CONFIGURAÇÃO DO SUPABASE ---
const SUPABASE_URL = ""; 
const SUPABASE_ANON_KEY = "";

// --- INTERFACES ---
interface Member {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  universidade?: string;
  curso?: string;
}

interface Meeting {
  id: string;
  title: string;
  date: string;
  start_time?: string;
  end_time?: string;
  next_meeting_date?: string;
  location?: string;
  facilitator: string;
  recorder: string;
  attendees: string[];
  agenda: string;
  notes?: string;
  created_at: string;
}

interface ActionItem {
  id: string;
  meeting_id: string;
  task: string;
  assignee_name: string;
  assignee_email?: string;
  due_date?: string;
  status: 'Pendente' | 'Em Andamento' | 'Concluído';
  created_at: string;
}

export default function ManagerReunioes() {
  // --- ESTADOS ---
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'dashboard'>('list');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Mensagens e alertas customizados
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Form de Nova Ata
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');
  const [newNextMeetingDate, setNewNextMeetingDate] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newFacilitator, setNewFacilitator] = useState('');
  const [newRecorder, setNewRecorder] = useState('');
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]); // Lista de nomes selecionados
  const [newAgenda, setNewAgenda] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Itens de ação temporários no formulário de criação
  const [tempActions, setTempActions] = useState<Omit<ActionItem, 'id' | 'meeting_id' | 'created_at'>[]>([]);
  const [tempTask, setTempTask] = useState('');
  const [tempAssigneeId, setTempAssigneeId] = useState(''); // ID do membro selecionado
  const [tempAssignee, setTempAssignee] = useState('');
  const [tempEmail, setTempEmail] = useState('');
  const [tempDueDate, setTempDueDate] = useState('');


  // --- CARREGAR DADOS ---
  useEffect(() => {
    fetchData();
  }, [supabase]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (!supabase) {
        setLoading(false);
        return;
      }

      // Buscar membros da tabela public.membros
      const { data: membersData, error: memError } = await supabase
        .from('membros')
        .select('id, nome, email, telefone, universidade, curso')
        .order('nome', { ascending: true });

      if (memError) throw memError;

      // Buscar atas
      const { data: meetingsData, error: mError } = await supabase
        .from('meeting_minutes')
        .select('*')
        .order('date', { ascending: false });

      if (mError) throw mError;

      // Buscar ações
      const { data: actionsData, error: aError } = await supabase
        .from('action_items')
        .select('*');

      if (aError) throw aError;

      setMembers(membersData || []);
      setMeetings(meetingsData || []);
      setActionItems(actionsData || []);
      
      if (meetingsData && meetingsData.length > 0 && !selectedMeeting) {
        setSelectedMeeting(meetingsData[0]);
      }
    } catch (err: any) {
      console.error("Erro ao carregar dados do Supabase:", err.message);
      showAlert('error', 'Usando dados simulados locais. Configure o Supabase e crie a tabela de membros para persistência real.');
    } finally {
      setLoading(false);
    }
  };


  const showAlert = (type: 'success' | 'error', text: string) => {
    setAlertMsg({ type, text });
    setTimeout(() => setAlertMsg(null), 5000);
  };

  // --- MÉTODOS DE AÇÃO ---

  const addTempAction = () => {
    if (!tempTask || !tempAssignee) {
      showAlert('error', 'Selecione uma Tarefa e um Responsável da lista.');
      return;
    }
    const newActionItem = {
      task: tempTask,
      assignee_name: tempAssignee,
      assignee_email: tempEmail || undefined,
      due_date: tempDueDate || undefined,
      status: 'Pendente' as const
    };
    setTempActions([...tempActions, newActionItem]);
    setTempTask('');
    setTempAssigneeId('');
    setTempAssignee('');
    setTempEmail('');
    setTempDueDate('');
  };

  const removeTempAction = (index: number) => {
    setTempActions(tempActions.filter((_, i) => i !== index));
  };

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newFacilitator || !newRecorder || !newAgenda) {
      showAlert('error', 'Por favor, preencha todos os campos obrigatórios (*).');
      return;
    }

    const meetingPayload = {
      title: newTitle,
      date: newDate,
      start_time: newStartTime || null,
      end_time: newEndTime || null,
      next_meeting_date: newNextMeetingDate || null,
      location: newLocation || null,
      facilitator: newFacilitator,
      recorder: newRecorder,
      attendees: selectedAttendees,
      agenda: newAgenda,
      notes: newNotes || null
    };

    try {
      let createdMeeting: Meeting;

      if (supabase && SUPABASE_URL && SUPABASE_ANON_KEY) {
        const { data, error } = await supabase
          .from('meeting_minutes')
          .insert([meetingPayload])
          .select();

        if (error) throw error;
        createdMeeting = data[0];

        if (tempActions.length > 0) {
          const actionPayloads = tempActions.map(act => ({
            meeting_id: createdMeeting.id,
            task: act.task,
            assignee_name: act.assignee_name,
            assignee_email: act.assignee_email || null,
            due_date: act.due_date || null,
            status: act.status
          }));

          const { error: actionError } = await supabase
            .from('action_items')
            .insert(actionPayloads);

          if (actionError) throw actionError;
        }
      } else {
        const generatedId = Math.random().toString(36).substring(2, 9);
        createdMeeting = {
          id: generatedId,
          ...meetingPayload,
          location: meetingPayload.location || undefined,
          notes: meetingPayload.notes || undefined,
          start_time: meetingPayload.start_time || undefined,
          end_time: meetingPayload.end_time || undefined,
          next_meeting_date: meetingPayload.next_meeting_date || undefined,
          created_at: new Date().toISOString()
        };

        const newActions: ActionItem[] = tempActions.map((act, i) => ({
          id: `act-${generatedId}-${i}`,
          meeting_id: generatedId,
          ...act,
          created_at: new Date().toISOString()
        }));

        setMeetings(prev => [createdMeeting, ...prev]);
        setActionItems(prev => [...prev, ...newActions]);
      }

      setNewTitle('');
      setNewDate(new Date().toISOString().split('T')[0]);
      setNewStartTime('');
      setNewEndTime('');
      setNewNextMeetingDate('');
      setNewLocation('');
      setNewFacilitator('');
      setNewRecorder('');
      setSelectedAttendees([]);
      setNewAgenda('');
      setNewNotes('');
      setTempActions([]);
      
      if (supabase && SUPABASE_URL && SUPABASE_ANON_KEY) {
        await fetchData();
      } else {
        setSelectedMeeting(createdMeeting);
      }

      showAlert('success', 'Ata de reunião registrada com sucesso!');
      setActiveTab('list');

    } catch (err: any) {
      console.error(err);
      showAlert('error', 'Erro ao salvar ata: ' + err.message);
    }
  };

  const handleToggleStatus = async (actionId: string, currentStatus: string) => {
    const statuses: ('Pendente' | 'Em Andamento' | 'Concluído')[] = ['Pendente', 'Em Andamento', 'Concluído'];
    const currentIndex = statuses.indexOf(currentStatus as any);
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];

    try {
      if (supabase && SUPABASE_URL && SUPABASE_ANON_KEY) {
        const { error } = await supabase
          .from('action_items')
          .update({ status: nextStatus })
          .eq('id', actionId);

        if (error) throw error;
        await fetchData();
      } else {
        setActionItems(prev => prev.map(act => act.id === actionId ? { ...act, status: nextStatus } : act));
      }
      showAlert('success', `Status da tarefa atualizado para: ${nextStatus}`);
    } catch (err: any) {
      console.error(err);
      showAlert('error', 'Erro ao atualizar status: ' + err.message);
    }
  };

  const handleDeleteMeeting = async (meetingId: string) => {
    if (!confirm("Tem certeza que deseja remover permanentemente esta ata? Todos os itens de ação relacionados serão excluídos.")) {
      return;
    }

    try {
      if (supabase && SUPABASE_URL && SUPABASE_ANON_KEY) {
        const { error } = await supabase
          .from('meeting_minutes')
          .delete()
          .eq('id', meetingId);

        if (error) throw error;
        await fetchData();
      } else {
        setMeetings(prev => prev.filter(m => m.id !== meetingId));
        setActionItems(prev => prev.filter(act => act.meeting_id !== meetingId));
        if (selectedMeeting?.id === meetingId) {
          setSelectedMeeting(null);
        }
      }
      showAlert('success', 'Ata de reunião removida com sucesso!');
    } catch (err: any) {
      console.error(err);
      showAlert('error', 'Erro ao excluir ata: ' + err.message);
    }
  };

  // --- FILTROS & CÁLCULOS ---
  const filteredMeetings = meetings.filter(m => 
    m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.agenda.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.facilitator.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getMeetingActions = (meetingId: string) => {
    return actionItems.filter(item => item.meeting_id === meetingId);
  };

  const stats = {
    totalMeetings: meetings.length,
    totalActions: actionItems.length,
    pendingActions: actionItems.filter(a => a.status === 'Pendente').length,
    inProgressActions: actionItems.filter(a => a.status === 'Em Andamento').length,
    completedActions: actionItems.filter(a => a.status === 'Concluído').length,
  };

  const assigneesSummary = actionItems.reduce((acc, current) => {
    const key = current.assignee_name;
    if (!acc[key]) {
      acc[key] = {
        name: key,
        email: current.assignee_email || 'Não informado',
        tasks: []
      };
    }
    acc[key].tasks.push(current);
    return acc;
  }, {} as Record<string, { name: string, email: string, tasks: ActionItem[] }>);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* HEADER */}
      <header className="bg-gradient-to-r from-slate-900 to-green-950 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-700 p-2.5 rounded-2xl shadow-inner">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-white">Ata de Reuniões</h1>
            </div>
          </div>
          
          {/* Navegação principal */}
          <div className="flex bg-slate-800/60 p-1.5 rounded-2xl border border-slate-700/50">
            <button 
              onClick={() => setActiveTab('list')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'list' 
                  ? 'bg-green-800 text-white shadow' 
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              Atas de Reunião
            </button>
            <button 
              onClick={() => setActiveTab('create')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'create' 
                  ? 'bg-green-800 text-white shadow' 
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Plus className="w-4 h-4" />
              Nova Ata
            </button>
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'dashboard' 
                  ? 'bg-green-800 text-white shadow' 
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              Quem Faz o Que
            </button>
          </div>
        </div>
      </header>

      {/* ALERT BOX */}
      {alertMsg && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <div className={`p-4 rounded-2xl flex items-center gap-3 shadow-sm border ${
            alertMsg.type === 'success' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}>
            <Info className="w-5 h-5 shrink-0" />
            <p className="text-sm font-semibold">{alertMsg.text}</p>
          </div>
        </div>
      )}

      {/* CONTEÚDO PRINCIPAL */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-800 mb-4"></div>
            <p className="font-semibold">Carregando informações das atas...</p>
          </div>
        ) : (
          <>
            {/* 1. ABA DE ATAS DE REUNIÃO (LISTAGEM + DETALHES) */}
            {activeTab === 'list' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Lateral Esquerda: Lista de Atas */}
                <div className="lg:col-span-5 flex flex-col gap-4">
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80">
                    <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      Histórico de Reuniões
                      <span className="text-sm font-normal bg-green-50 text-green-800 px-2 py-0.5 rounded-full font-mono">
                        {filteredMeetings.length}
                      </span>
                    </h2>
                    
                    {/* Barra de Pesquisa */}
                    <div className="relative mb-3">
                      <Search className="w-4 h-4 text-slate-600 absolute left-3.5 top-3.5" />
                      <input 
                        type="text" 
                        placeholder="Buscar por título, facilitador ou pauta..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-700 bg-slate-50/50"
                      />
                    </div>

                    {/* Lista Scrolável */}
                    <div className="max-h-[500px] overflow-y-auto space-y-2 pr-1">
                      {filteredMeetings.length === 0 ? (
                        <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-xl">
                          <p className="text-slate-600 text-sm">Nenhuma ata de reunião encontrada.</p>
                        </div>
                      ) : (
                        filteredMeetings.map((meeting) => (
                          <div 
                            key={meeting.id}
                            onClick={() => setSelectedMeeting(meeting)}
                            className={`p-3.5 rounded-xl cursor-pointer transition-all border text-left flex justify-between items-center ${
                              selectedMeeting?.id === meeting.id 
                                ? 'bg-green-50/70 border-green-200 shadow-sm' 
                                : 'bg-white hover:bg-slate-50 border-slate-100'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold text-slate-900 text-sm truncate">{meeting.title}</h3>
                              <div className="flex items-center gap-3 mt-1.5 text-sm text-slate-500">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5 shrink-0" />
                                  {meeting.date}
                                </span>
                                <span className="flex items-center gap-1 truncate">
                                  <User className="w-3.5 h-3.5 shrink-0" />
                                  {meeting.facilitator}
                                </span>
                              </div>
                            </div>
                            <ChevronRight className={`w-5 h-5 shrink-0 transition-transform ${
                              selectedMeeting?.id === meeting.id ? 'text-green-800 translate-x-1' : 'text-slate-300'
                            }`} />
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Lateral Direita: Detalhamento da Ata Selecionada */}
                <div className="lg:col-span-7">
                  {selectedMeeting ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden flex flex-col h-full">
                      
                      {/* Topo do Detalhe */}
                      <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-green-50/30">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-semibold bg-green-50 text-green-800">
                              <Calendar className="w-3.5 h-3.5" />
                              {selectedMeeting.date}
                            </span>
                            <h2 className="text-xl font-semibold text-slate-900 mt-2">{selectedMeeting.title}</h2>
                          </div>
                          
                          <button 
                            onClick={() => handleDeleteMeeting(selectedMeeting.id)}
                            className="p-2 text-rose-500 hover:text-white hover:bg-rose-500 rounded-xl transition-all border border-slate-200 hover:border-rose-500"
                            title="Excluir esta ata"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Metadados da reunião */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100 text-sm">
                          <div>
                            <span className="text-slate-600 block mb-1">FACILITADOR(A)</span>
                            <span className="font-semibold text-slate-800 flex items-center gap-1">
                              <User className="w-3.5 h-3.5 text-green-700" />
                              {selectedMeeting.facilitator}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-600 block mb-1">REDATOR(A)</span>
                            <span className="font-semibold text-slate-800 flex items-center gap-1">
                              <FileText className="w-3.5 h-3.5 text-green-700" />
                              {selectedMeeting.recorder}
                            </span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-slate-600 block mb-1">LOCAL / LINK</span>
                            <span className="font-semibold text-slate-800 truncate block">
                              {selectedMeeting.location || 'Não especificado'}
                            </span>
                          </div>
                        </div>

                        {/* Linha adicional de horário e próxima reunião */}
                        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-dashed border-slate-200 text-sm">
                          <div>
                            <span className="text-slate-600 block mb-1">DURAÇÃO / HORÁRIO</span>
                            <span className="font-semibold text-slate-800 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-emerald-600" />
                              {selectedMeeting.start_time && selectedMeeting.end_time 
                                ? `${selectedMeeting.start_time} às ${selectedMeeting.end_time}`
                                : 'Não registrado'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-600 block mb-1">PRÓXIMA REUNIÃO PROGRAMADA</span>
                            <span className="font-semibold text-green-800 flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                              {selectedMeeting.next_meeting_date || 'A definir'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Corpo do Detalhe */}
                      <div className="p-6 space-y-6 flex-1">
                        
                        {/* Participantes */}
                        <div>
                          <h3 className="text-sm font-semibold  tracking-wider text-slate-600 mb-2 flex items-center gap-2">
                            <Users className="w-3.5 h-3.5" />
                            Presentes na Reunião ({selectedMeeting.attendees.length})
                          </h3>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedMeeting.attendees.length > 0 ? (
                              selectedMeeting.attendees.map((attendee, index) => (
                                <span key={index} className="px-2.5 py-1 bg-slate-100 hover:bg-green-50 hover:text-green-800 text-slate-700 text-sm font-semibold rounded-lg transition-colors">
                                  {attendee}
                                </span>
                              ))
                            ) : (
                              <span className="text-sm text-slate-600 italic">Nenhum participante listado</span>
                            )}
                          </div>
                        </div>

                        {/* Pauta */}
                        <div>
                          <h3 className="text-sm font-semibold  tracking-wider text-slate-600 mb-2 flex items-center gap-2">
                            <Briefcase className="w-3.5 h-3.5" />
                            Pauta Discutida
                          </h3>
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
                            {selectedMeeting.agenda}
                          </div>
                        </div>

                        {/* Notas Adicionais */}
                        {selectedMeeting.notes && (
                          <div>
                            <h3 className="text-sm font-semibold  tracking-wider text-slate-600 mb-2 flex items-center gap-2">
                              <FileText className="w-3.5 h-3.5" />
                              Notas e Discussão
                            </h3>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
                              {selectedMeeting.notes}
                            </div>
                          </div>
                        )}

                        {/* Plano de Ação - Quem fez cada coisa */}
                        <div className="border-t border-slate-100 pt-6">
                          <h3 className="text-sm font-semibold text-slate-950 mb-3 flex items-center gap-2">
                            <CheckSquare className="w-4 h-4 text-green-800" />
                            Plano de Ação Registrado
                            <span className="text-sm font-normal text-slate-600">
                              (Clique para alterar o status da tarefa)
                            </span>
                          </h3>

                          {getMeetingActions(selectedMeeting.id).length === 0 ? (
                            <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                              <p className="text-slate-600 text-sm">Nenhum item de ação foi definido nesta reunião.</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {getMeetingActions(selectedMeeting.id).map((action) => (
                                <div 
                                  key={action.id}
                                  onClick={() => handleToggleStatus(action.id, action.status)}
                                  className={`p-3.5 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer ${
                                    action.status === 'Concluído' 
                                      ? 'bg-emerald-50/40 border-emerald-100 opacity-80 hover:opacity-100' 
                                      : action.status === 'Em Andamento' 
                                        ? 'bg-amber-50/40 border-amber-100 hover:bg-amber-50' 
                                        : 'bg-white border-slate-100 hover:bg-slate-50'
                                  }`}
                                >
                                  <div className="flex items-start gap-3">
                                    {/* Ícone de Status */}
                                    <div className="mt-0.5 shrink-0">
                                      {action.status === 'Concluído' ? (
                                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                                      ) : action.status === 'Em Andamento' ? (
                                        <Clock className="w-5 h-5 text-amber-500" />
                                      ) : (
                                        <AlertCircle className="w-5 h-5 text-slate-600" />
                                      )}
                                    </div>
                                    <div>
                                      <p className={`text-sm font-semibold ${
                                        action.status === 'Concluído' ? 'line-through text-slate-500' : 'text-slate-800'
                                      }`}>
                                        {action.task}
                                      </p>
                                      
                                      {/* Responsável */}
                                      <div className="flex flex-wrap items-center gap-2 mt-1.5 text-sm text-slate-500">
                                        <span className="bg-green-50 text-green-800 px-2 py-0.5 rounded font-semibold flex items-center gap-1">
                                          <User className="w-3 h-3" />
                                          {action.assignee_name}
                                        </span>
                                        {action.assignee_email && (
                                          <span className="flex items-center gap-1 text-slate-600">
                                            <Mail className="w-3 h-3" />
                                            {action.assignee_email}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Data limite & status badge */}
                                  <div className="flex items-center gap-3 self-end md:self-auto text-sm">
                                    {action.due_date && (
                                      <span className="text-slate-500 bg-slate-100 px-2 py-1 rounded">
                                        Prazo: {action.due_date}
                                      </span>
                                    )}
                                    <span className={`px-2 py-1 rounded-md font-semibold ${
                                      action.status === 'Concluído' 
                                        ? 'bg-emerald-100 text-emerald-800' 
                                        : action.status === 'Em Andamento' 
                                          ? 'bg-amber-100 text-amber-800' 
                                          : 'bg-slate-100 text-slate-600'
                                    }`}>
                                      {action.status}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl p-10 text-center border border-slate-200/80 flex flex-col items-center justify-center h-full">
                      <FileText className="w-12 h-12 text-slate-300 mb-3" />
                      <h3 className="font-semibold text-slate-700 text-lg">Nenhuma ata selecionada</h3>
                      <p className="text-slate-600 text-sm max-w-sm mt-1">Selecione uma ata de reunião ao lado para examinar os detalhes, notas e responsáveis pelas tarefas.</p>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* 2. ABA DE CRIAÇÃO DE ATA */}
            {activeTab === 'create' && (
              <form onSubmit={handleCreateMeeting} className="bg-white rounded-2xl shadow-sm border border-slate-200/80 max-w-4xl mx-auto overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-slate-900 to-green-950 text-white">
                  <h2 className="text-xl font-semibold">Registrar Nova Ata de Reunião</h2>
                  <p className="text-green-100 text-sm mt-1">Preencha os dados e atribua os responsáveis de ação em tempo real.</p>
                </div>

                <div className="p-6 space-y-6">
                  
                  {/* Bloco 1: Informações Gerais */}
                  <div>
                    <h3 className="text-sm font-semibold text-green-800  tracking-wide mb-3">1. Dados Básicos da Reunião</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-slate-600 mb-1">Título da Reunião *</label>
                        <input 
                          type="text" 
                          required
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          placeholder="Ex: Alinhamento de Vendas Semanal"
                          className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-green-700 outline-none"
                        />
                      </div>
                      
                      {/* Data e Horários */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-600 mb-1">Data da Reunião *</label>
                        <input 
                          type="date" 
                          required
                          value={newDate}
                          onChange={(e) => setNewDate(e.target.value)}
                          className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-green-700 outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-sm font-semibold text-slate-600 mb-1">Início</label>
                          <input 
                            type="time" 
                            value={newStartTime}
                            onChange={(e) => setNewStartTime(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-green-700 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-600 mb-1">Término</label>
                          <input 
                            type="time" 
                            value={newEndTime}
                            onChange={(e) => setNewEndTime(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-green-700 outline-none"
                          />
                        </div>
                      </div>

                      {/* Facilitador e Redator vindos da tabela */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-600 mb-1">Facilitador(a) / Líder *</label>
                        <select 
                          required
                          value={newFacilitator}
                          onChange={(e) => setNewFacilitator(e.target.value)}
                          className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-green-700 outline-none bg-white"
                        >
                          <option value="">Selecione o Facilitador...</option>
                          {members.map(member => (
                            <option key={member.id} value={member.nome}>{member.nome}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-600 mb-1">Redator(a) *</label>
                        <select 
                          required
                          value={newRecorder}
                          onChange={(e) => setNewRecorder(e.target.value)}
                          className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-green-700 outline-none bg-white"
                        >
                          <option value="">Selecione o Redator...</option>
                          {members.map(member => (
                            <option key={member.id} value={member.nome}>{member.nome}</option>
                          ))}
                        </select>
                      </div>

                      {/* Local e Próxima Reunião */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-600 mb-1">Local ou Link de Conexão</label>
                        <input 
                          type="text" 
                          value={newLocation}
                          onChange={(e) => setNewLocation(e.target.value)}
                          placeholder="Ex: Google Meet / Sala de Reuniões"
                          className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-green-700 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-600 mb-1">Data da Próxima Reunião</label>
                        <input 
                          type="date" 
                          value={newNextMeetingDate}
                          onChange={(e) => setNewNextMeetingDate(e.target.value)}
                          className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-green-700 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                 {/* Bloco 2: Participantes e Conteúdo */}
                    <div className="border-t border-slate-100 pt-6">
                    <h3 className="text-sm font-semibold text-green-800 tracking-wide mb-4">
                        2. Conteúdo & Discussões
                    </h3>

                    <div className="space-y-5">
                        {/* PARTICIPANTES */}
                        <div>
                        <label className="block text-sm font-semibold text-slate-600 mb-3">
                            Presença dos Membros
                        </label>

                        {members.length === 0 ? (
                            <p className="text-sm text-slate-600 italic">
                            Nenhum membro carregado para selecionar.
                            </p>
                        ) : (
                            <div className="grid md:grid-cols-2 gap-4">
                            {/* TODOS OS MEMBROS */}
                            <div className="border border-slate-200 rounded-2xl overflow-hidden">
                                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                                <h4 className="font-semibold text-slate-700">
                                    Lista de Membros
                                </h4>
                                </div>

                                <div className="h-64 overflow-y-auto p-3 space-y-2">
                                {members.map((member) => {
                                    const isSelected = selectedAttendees.includes(member.nome);

                                    return (
                                    <button
                                        key={member.id}
                                        type="button"
                                        onClick={() => {
                                        if (isSelected) {
                                            setSelectedAttendees(
                                            selectedAttendees.filter(
                                                (name) => name !== member.nome
                                            )
                                            );
                                        } else {
                                            setSelectedAttendees([
                                            ...selectedAttendees,
                                            member.nome,
                                            ]);
                                        }
                                        }}
                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border transition-all ${
                                        isSelected
                                            ? "bg-green-50 border-green-300 text-green-800"
                                            : "bg-white border-slate-200 hover:bg-slate-50"
                                        }`}
                                    >
                                        <span className="text-sm font-medium">
                                        {member.nome}
                                        </span>

                                        {isSelected && (
                                        <span className="text-xs font-bold">
                                            ✓ 
                                        </span>
                                        )}
                                    </button>
                                    );
                                })}
                                </div>
                            </div>

                            {/* PRESENTES */}
                            <div className="border border-green-200 rounded-2xl overflow-hidden">
                                <div className="bg-green-50 px-4 py-3 border-b border-green-200 flex items-center justify-between">
                                <h4 className="font-semibold text-green-800">
                                    Presentes
                                </h4>

                                <span className="text-xs font-bold bg-green-700 text-white px-2 py-1 rounded-full">
                                    {selectedAttendees.length}
                                </span>
                                </div>

                                <div className="h-64 overflow-y-auto p-3">
                                {selectedAttendees.length === 0 ? (
                                    <div className="h-full flex items-center justify-center text-sm text-slate-400 italic">
                                    Nenhum participante selecionado
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                    {selectedAttendees.map((name) => (
                                        <div
                                        key={name}
                                        className="flex items-center justify-between px-3 py-2 rounded-xl bg-green-100 border border-green-200"
                                        >
                                        <span className="text-sm font-medium text-green-900">
                                            {name}
                                        </span>

                                        <button
                                            type="button"
                                            onClick={() =>
                                            setSelectedAttendees(
                                                selectedAttendees.filter(
                                                (item) => item !== name
                                                )
                                            )
                                            }
                                            className="text-xs font-bold text-red-500 hover:text-red-700"
                                        >
                                            <Trash2 size={14}/>
                                        </button>
                                        </div>
                                    ))}
                                    </div>
                                )}
                                </div>
                            </div>
                            </div>
                        )}
                        </div>

                        {/* PAUTA */}
                        <div>
                        <label className="block text-sm font-semibold text-slate-600 mb-1">
                            Pauta da Reunião *
                        </label>

                        <textarea
                            rows={3}
                            required
                            value={newAgenda}
                            onChange={(e) => setNewAgenda(e.target.value)}
                            placeholder="Descreva brevemente os temas principais que foram abordados..."
                            className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-green-700 outline-none resize-y"
                        />
                        </div>

                        {/* ANOTAÇÕES */}
                        <div>
                        <label className="block text-sm font-semibold text-slate-600 mb-1">
                            Anotações Gerais / Decisões Tomadas
                        </label>

                        <textarea
                            rows={4}
                            value={newNotes}
                            onChange={(e) => setNewNotes(e.target.value)}
                            placeholder="Registre aqui discussões detalhadas, votações ou observações adicionais..."
                            className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-green-700 outline-none resize-y"
                        />
                        </div>
                    </div>
                    </div>

                  {/* Bloco 3: Itens de Ação de Responsabilidade */}
                  <div className="border-t border-slate-100 pt-6">
                    <h3 className="text-sm font-semibold text-green-800  tracking-wide mb-1">3. Definir Plano de Ação (Quem faz o que?)</h3>
                    <p className="text-sm text-slate-600 mb-4">Insira tarefas individuais selecionando um dos membros cadastrados abaixo.</p>
                    
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-semibold text-slate-600 mb-1">Tarefa de Ação</label>
                          <input 
                            type="text"
                            value={tempTask}
                            onChange={(e) => setTempTask(e.target.value)}
                            placeholder="Ex: Revisar planilha de orçamento"
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:ring-1 focus:ring-green-700 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-600 mb-1">Responsável *</label>
                          <select 
                            value={tempAssigneeId}
                            onChange={(e) => {
                              const val = e.target.value;
                              setTempAssigneeId(val);
                              const found = members.find(m => m.id === val);
                              if (found) {
                                setTempAssignee(found.nome);
                                setTempEmail(found.email);
                              } else {
                                setTempAssignee('');
                                setTempEmail('');
                              }
                            }}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:ring-1 focus:ring-green-700 outline-none bg-white"
                          >
                            <option value="">Selecione o responsável...</option>
                            {members.map(member => (
                              <option key={member.id} value={member.id}>{member.nome}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-600 mb-1">Data Limite (Prazo)</label>
                          <input 
                            type="date"
                            value={tempDueDate}
                            onChange={(e) => setTempDueDate(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:ring-1 focus:ring-green-700 outline-none"
                          />
                        </div>
                      </div>

                      {tempEmail && (
                        <p className="text-sm text-slate-500 font-medium">
                          E-mail vinculado automaticamente: <span className="text-green-800 font-semibold">{tempEmail}</span>
                        </p>
                      )}

                      <button 
                        type="button"
                        onClick={addTempAction}
                        className="flex items-center gap-2 text-sm bg-green-800 text-white px-4 py-2 rounded-lg hover:bg-green-900 transition-all font-semibold"
                      >
                        <Plus className="w-3.5 h-3.5" /> Atribuir Tarefa
                      </button>
                    </div>

                    {/* Exibição das tarefas temporárias adicionadas */}
                    {tempActions.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <span className="text-sm font-semibold text-slate-500 ">Tarefas Adicionadas na Fila:</span>
                        {tempActions.map((act, index) => (
                          <div key={index} className="p-3 bg-white border border-slate-100 rounded-xl flex items-center justify-between gap-4 shadow-sm text-sm">
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-slate-800">{act.task}</p>
                              <p className="text-slate-500 mt-0.5">
                                Responsável: <span className="font-semibold">{act.assignee_name}</span> 
                                {act.assignee_email ? ` (${act.assignee_email})` : ''} 
                                {act.due_date ? ` • Prazo: ${act.due_date}` : ''}
                              </p>
                            </div>
                            <button 
                              type="button"
                              onClick={() => removeTempAction(index)}
                              className="text-rose-500 hover:text-rose-700 font-semibold px-2 py-1 hover:bg-rose-50 rounded"
                            >
                              Remover
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>

                {/* Footer do formulário */}
                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                  <button 
                    type="button" 
                    onClick={() => setActiveTab('list')}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="bg-green-800 hover:bg-green-900 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center gap-2"
                  >
                    Salvar Ata de Reunião
                  </button>
                </div>
              </form>
            )}

            {/* 3. ABA DE DASHBOARD (QUEM FAZ O QUE) */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                
                {/* Cartões de Métricas */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80 text-center">
                    <span className="text-sm text-slate-600 block font-semibold  tracking-wider">Total de Reuniões</span>
                    <span className="text-3xl font-semibold text-green-800 block mt-1">{stats.totalMeetings}</span>
                  </div>
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80 text-center">
                    <span className="text-sm text-slate-600 block font-semibold  tracking-wider">Total de Tarefas</span>
                    <span className="text-3xl font-semibold text-slate-800 block mt-1">{stats.totalActions}</span>
                  </div>
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80 text-center">
                    <span className="text-sm text-slate-600 block font-semibold  tracking-wider">Pendentes</span>
                    <span className="text-3xl font-semibold text-slate-500 block mt-1">{stats.pendingActions}</span>
                  </div>
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80 text-center">
                    <span className="text-sm text-slate-600 block font-semibold  tracking-wider">Em Andamento</span>
                    <span className="text-3xl font-semibold text-amber-500 block mt-1">{stats.inProgressActions}</span>
                  </div>
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80 text-center col-span-2 md:col-span-1">
                    <span className="text-sm text-slate-600 block font-semibold  tracking-wider">Concluídas</span>
                    <span className="text-3xl font-semibold text-emerald-600 block mt-1">{stats.completedActions}</span>
                  </div>
                </div>

                {/* Quadro de Responsabilidades */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-slate-900">Quadro Consolidado de Responsáveis</h2>
                    <p className="text-slate-500 text-sm mt-0.5">Veja todas as tarefas ativas agrupadas individualmente pela pessoa designada.</p>
                  </div>

                  {Object.keys(assigneesSummary).length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-xl">
                      <p className="text-slate-600 text-sm">Nenhuma tarefa designada no momento.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {Object.values(assigneesSummary).map((assignee, idx) => (
                        <div key={idx} className="bg-slate-50/50 rounded-2xl p-5 border border-slate-200/70 flex flex-col justify-between">
                          <div>
                            {/* Nome e E-mail */}
                            <div className="flex items-center gap-3 border-b border-slate-200/50 pb-3 mb-4">
                              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-800 font-semibold  text-sm">
                                {assignee.name.substring(0, 2)}
                              </div>
                              <div className="min-w-0">
                                <h3 className="font-semibold text-slate-900 truncate text-sm">{assignee.name}</h3>
                                <p className="text-sm text-slate-600 truncate flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  {assignee.email}
                                </p>
                              </div>
                            </div>

                            {/* Lista de Tarefas da pessoa */}
                            <div className="space-y-2.5">
                              {assignee.tasks.map((task) => (
                                <div key={task.id} className="p-3 bg-white rounded-xl border border-slate-200/60 shadow-sm text-sm">
                                  <div className="flex justify-between items-start gap-2">
                                    <p className="font-semibold text-slate-800 line-clamp-2">{task.task}</p>
                                    <span className={`px-2 py-0.5 rounded text-sm font-semibold shrink-0 ${
                                      task.status === 'Concluído' 
                                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' 
                                        : task.status === 'Em Andamento' 
                                          ? 'bg-amber-50 text-amber-800 border border-amber-100' 
                                          : 'bg-slate-50 text-slate-600 border border-slate-200'
                                    }`}>
                                      {task.status}
                                    </span>
                                  </div>
                                  
                                  {/* Rodapé da minitransação */}
                                  <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100 text-sm text-slate-600">
                                    <span>Prazo: {task.due_date || 'A combinar'}</span>
                                    <span className="font-mono">ID Reunião: #{task.meeting_id.substring(0,4)}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-200/50 flex justify-between text-sm font-semibold text-slate-500">
                            <span>Total atribuídas: {assignee.tasks.length}</span>
                            <span className="text-emerald-600">
                              Concluídas: {assignee.tasks.filter(t => t.status === 'Concluído').length}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}
          </>
        )}
      </main>
     
    </div>
  );
}