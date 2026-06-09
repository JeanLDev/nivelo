import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Search, 
  Save, 
  Database, 
  Plus, 
  Clock, 
  MapPin, 
  FileText,
  RefreshCw,
  Sparkles,
  Check,
  UserCheck
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

// Interfaces baseadas no seu schema do banco de dados
interface Meeting {
  id: string;
  title: string;
  date: string;
  location: string | null;
  facilitator: string;
  recorder: string;
  agenda: string;
  codigo: string | null;
}

interface Member {
  id: string;
  nome: string;
  email: string;
  universidade: string | null;
  curso: string | null;
}

interface AttendanceState {
  memberId: string;
  status: 'present' | 'absent' | 'excused';
  notes: string;
  dbRecordId?: string; // Se já existir salvo no banco
}

export default function App() {
  const [isConfigured] = useState(true);

  // Estados da Aplicação
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>('');
  const [attendances, setAttendances] = useState<Record<string, AttendanceState>>({});
  
  // Estados de UI/Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);



  // Carregar dados iniciais (Reuniões e Membros)
  useEffect(() => {
    if (isConfigured) {
      fetchMeetingsAndMembers();
    }
  }, [isConfigured]);

  // Carregar presenças quando a reunião selecionada mudar
  useEffect(() => {
    if (selectedMeetingId) {
      fetchAttendanceForMeeting(selectedMeetingId);
    } else {
      setAttendances({});
    }
  }, [selectedMeetingId]);

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchMeetingsAndMembers = async () => {
    setLoading(true);
    try {
      // 1. Buscar reuniões ordenadas por data decrescente
      const { data: meetingsData, error: meetingsErr } = await supabase
        .from('meeting_minutes')
        .select('*')
        .order('date', { ascending: false });

      if (meetingsErr) throw meetingsErr;
      setMeetings(meetingsData || []);

      // 2. Buscar membros cadastrados
      const { data: membersData, error: membersErr } = await supabase
        .from('membros')
        .select('id, nome, email, universidade, curso')
        .order('nome', { ascending: true });

      if (membersErr) throw membersErr;
      setMembers(membersData || []);

      // Pré-selecionar a reunião mais recente se houver
      if (meetingsData && meetingsData.length > 0) {
        setSelectedMeetingId(meetingsData[0].id);
      }

      showNotification('success', 'Dados de reuniões e membros sincronizados!');
    } catch (err: any) {
      showNotification('error', `Falha ao sincronizar: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceForMeeting = async (meetingId: string) => {
    setLoading(true);
    try {
      // Buscar registros existentes na tabela de junção
      const { data: attendanceData, error } = await supabase
        .from('meeting_attendees')
        .select('*')
        .eq('meeting_id', meetingId);

      if (error) throw error;

      // Mapear os registros existentes para o estado
      const attendanceMap: Record<string, AttendanceState> = {};
      
      // Inicializar todos os membros conhecidos como 'present' por padrão se não houver registro
      members.forEach(member => {
        attendanceMap[member.id] = {
          memberId: member.id,
          status: 'present', // padrão otimista
          notes: ''
        };
      });

      // Sobrescrever com os dados reais salvos no banco de dados
      if (attendanceData) {
        attendanceData.forEach((record: any) => {
          attendanceMap[record.member_id] = {
            memberId: record.member_id,
            status: record.status as 'present' | 'absent' | 'excused',
            notes: record.notes || '',
            dbRecordId: record.id
          };
        });
      }

      setAttendances(attendanceMap);
    } catch (err: any) {
      showNotification('error', `Erro ao buscar presenças: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Alternar rapidamente o status de presença de um membro
  const handleStatusChange = (memberId: string, status: 'present' | 'absent' | 'excused') => {
    setAttendances(prev => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        memberId,
        status
      }
    }));
  };

  // Atualizar nota personalizada de presença do membro
  const handleNoteChange = (memberId: string, notes: string) => {
    setAttendances(prev => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        notes
      }
    }));
  };

  // Marcar todos os membros visíveis/filtrados com um status específico (atalho em lote)
  const handleMarkAll = (status: 'present' | 'absent' | 'excused') => {
    const updated = { ...attendances };
    filteredMembers.forEach(member => {
      if (!updated[member.id]) {
        updated[member.id] = { memberId: member.id, status, notes: '' };
      } else {
        updated[member.id].status = status;
      }
    });
    setAttendances(updated);
    showNotification('info', `Todos os membros filtrados marcados como: ${
      status === 'present' ? 'Presente' : status === 'absent' ? 'Falta' : 'Justificado'
    }`);
  };

  // Salvar presenças no Supabase (Upsert inteligente)
  const saveAttendance = async () => {
    if (!selectedMeetingId) {
      showNotification('error', 'Selecione uma reunião válida para salvar.');
      return;
    }

    setSaving(true);
    try {
      const recordsToUpsert = Object.values(attendances).map(att => {
        const payload: any = {
          meeting_id: selectedMeetingId,
          member_id: att.memberId,
          status: att.status,
          notes: att.notes || null,
        };

        // Se já temos o ID do registro no banco, incluímos para fazer update
        if (att.dbRecordId) {
          payload.id = att.dbRecordId;
        }

        return payload;
      });

      if (recordsToUpsert.length === 0) {
        showNotification('info', 'Nenhuma alteração de presença para salvar.');
        setSaving(false);
        return;
      }

      // Executa o UPSERT no Supabase (insere ou atualiza se houver conflito na restrição unique)
      const { data, error } = await supabase
        .from('meeting_attendees')
        .upsert(recordsToUpsert, { onConflict: 'meeting_id,member_id' })
        .select();

      if (error) throw error;

      // Recarrega as presenças para garantir sincronização total com IDs gerados pelo banco
      await fetchAttendanceForMeeting(selectedMeetingId);
      showNotification('success', 'Presenças salvas com sucesso no Supabase!');
    } catch (err: any) {
      showNotification('error', `Erro ao salvar presenças: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Filtros em tempo real
  const filteredMembers = members.filter(member => {
    const matchesSearch = 
      member.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.curso && member.curso.toLowerCase().includes(searchTerm.toLowerCase()));

    const attendanceState = attendances[member.id];
    const currentStatus = attendanceState ? attendanceState.status : 'present';

    if (filterStatus === 'all') return matchesSearch;
    return matchesSearch && currentStatus === filterStatus;
  });

  const selectedMeeting = meetings.find(m => m.id === selectedMeetingId);

  // Contadores rápidos para o painel superior
  const stats = {
    total: members.length,
    present: Object.values(attendances).filter(a => a.status === 'present').length,
    absent: Object.values(attendances).filter(a => a.status === 'absent').length,
    excused: Object.values(attendances).filter(a => a.status === 'excused').length,
  };


  return (
    <div className="min-h-screen  text-slate-100 font-sans selection:bg-indigo-500 selection:text-white pb-12">
      {/* HEADER DE NAVEGAÇÃO / APRESENTAÇÃO */}
      <header className="border-b border-slate-200 backdrop-blur sticky top-0 z-30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white-600/20 text-green-800 rounded-xl border border-indigo-500/30 shadow-lg shadow-indigo-500/10">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-700">
                Portal de Presenças
              </h1>
              <p className="text-xs text-slate-600">Gerenciador de Atas & Frequência Acadêmica</p>
            </div>
          </div>
        </div>
      </header>

      {/* NOTIFICAÇÕES FLUTUANTES */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 animate-bounce">
          <div className={`p-4 rounded-xl shadow-2xl border flex items-center gap-3 max-w-md ${
            notification.type === 'success' 
              ? 'bg-emerald-950/95 border-emerald-500/40 text-emerald-200' 
              : notification.type === 'error'
              ? 'bg-rose-950/95 border-rose-500/40 text-rose-200'
              : 'bg-indigo-950/95 border-indigo-500/40 text-indigo-200'
          }`}>
            {notification.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />}
            {notification.type === 'error' && <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />}
            {notification.type === 'info' && <AlertCircle className="w-5 h-5 text-indigo-400 flex-shrink-0" />}
            <span className="text-sm font-medium">{notification.message}</span>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 md:px-6 mt-8">
        
        <div className="space-y-6">
          
          {/* PAINEL SELETOR DE REUNIÃO E INFO */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Seletor */}
            <div className="lg:col-span-1 border border-green-300 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <h3 className="text-md font-semibold tracking-wider text-slate-700 mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-400" />
                  Selecione a Reunião
                </h3>
                
                <div className='flex items-center gap-2'>
                  {meetings.length === 0 ? (
                    <div className="text-center py-6 text-slate-500">
                      <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhuma ata de reunião cadastrada.</p>
                    </div>
                  ) : (
                    <select
                      value={selectedMeetingId}
                      onChange={(e) => setSelectedMeetingId(e.target.value)}
                      className="w-full  border border-slate-300 rounded-xl px-3.5 py-3 text-sm text-slate-700 focus:outline-none focus:border-indigo-500 transition-colors"
                    >
                      {meetings.map((meeting) => (
                        <option key={meeting.id} value={meeting.id}>
                          {meeting.date} - {meeting.title} {meeting.codigo ? `[${meeting.codigo}]` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                  {/* Sincronização manual */}
                  <div className=" border-green-300 flex justify-between items-center">
                  
                    <button
                      onClick={fetchMeetingsAndMembers}
                      disabled={loading}
                      className="text-xs  text-green-700 hover:text-green-300 font-medium py-1.5 px-2 rounded-lg border  flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Informações da Ata Atual */}
            <div className="lg:col-span-2 border shadow-md border-slate-300 rounded-2xl p-5">
              {selectedMeeting ? (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 text-sm font-semibold  tracking-wider text-slate-700 bg-green-500/10 px-2.5 py-1 rounded-md">
                      Reunião Selecionada
                    </span>
                    {selectedMeeting.codigo && (
                      <span className="text-xs text-slate-600  px-2 py-1 rounded font-mono border border-slate-300">
                        CÓDIGO: {selectedMeeting.codigo}
                      </span>
                    )}
                  </div>
                  
                  <h2 className="text-xl font-semibold text-slate-700">{selectedMeeting.title}</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-500" />
                      <span>Data: <strong>{selectedMeeting.date}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-500" />
                      <span>Local: <strong>{selectedMeeting.location || 'Não informado'}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-slate-500" />
                      <span>Facilitador: <strong>{selectedMeeting.facilitator}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-500" />
                      <span>Pauta principal: <strong className="truncate max-w-[200px] inline-block align-bottom">{selectedMeeting.agenda}</strong></span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                  Nenhuma reunião selecionada
                </div>
              )}
            </div>
          </div>

          {/* PAINEL DE CONTROLE DAS PRESENÇAS */}
          {selectedMeetingId && (
            <div className=" border border-slate-300 rounded-2xl overflow-hidden shadow-xl">
              
              {/* Header de controles superiores */}
              <div className="p-5 border-b border-slate-300  flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Busca e filtros */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 max-w-2xl">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Buscar membro por nome, email ou curso..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full  border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>

                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className=" border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="all">Filtro: Todos</option>
                    <option value="present">Status: Presente</option>
                    <option value="absent">Status: Falta</option>
                    <option value="excused">Status: Justificado</option>
                  </select>
                </div>

                {/* Salvar na nuvem */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={saveAttendance}
                    disabled={saving || loading}
                    className="w-full md:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium rounded-xl px-5 py-2.5 text-sm transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/40 disabled:opacity-50"
                  >
                    {saving ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {saving ? 'Gravando no Banco...' : 'Salvar Alterações'}
                  </button>
                </div>
              </div>

              {/* Métricas rápidas */}
              <div className="grid grid-cols-2 md:grid-cols-4 border-b border-slate-300 text-center">
                <div className="py-3 px-4 border-r border-slate-300/80">
                  <div className="text-xs text-slate-400 font-medium">Membros Totais</div>
                  <div className="text-xl font-bold text-slate-700 mt-0.5">{stats.total}</div>
                </div>
                <div className="py-3 px-4 border-r border-slate-300/80 bg-emerald-500/5">
                  <div className="text-xs text-emerald-400 font-medium">Presentes</div>
                  <div className="text-xl font-bold text-emerald-400 mt-0.5">{stats.present}</div>
                </div>
                <div className="py-3 px-4 border-r border-slate-300/80 bg-rose-500/5">
                  <div className="text-xs text-rose-400 font-medium">Faltas</div>
                  <div className="text-xl font-bold text-rose-400 mt-0.5">{stats.absent}</div>
                </div>
                <div className="py-3 px-4 bg-amber-500/5">
                  <div className="text-xs text-amber-400 font-medium">Faltas Justificadas</div>
                  <div className="text-xl font-bold text-amber-400 mt-0.5">{stats.excused}</div>
                </div>
              </div>

              {/* Atalhos Rápidos por Lote */}
              <div className="px-5 py-3 /30 border-b border-slate-300 flex flex-wrap items-center gap-2.5 text-xs text-slate-400">
                <span>Marcar em lote todos os membros filtrados:</span>
                <div className='flex gap-2.5 hidden'>
                  <button
                    onClick={() => handleMarkAll('present')}
                    className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-medium px-2.5 py-1 rounded border border-emerald-500/25 transition-all cursor-pointer"
                  >
                    Todos Presentes
                  </button>
                  <button
                    onClick={() => handleMarkAll('absent')}
                    className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-medium px-2.5 py-1 rounded border border-rose-500/25 transition-all cursor-pointer"
                  >
                    Todos Faltaram
                  </button>
                  <button
                    onClick={() => handleMarkAll('excused')}
                    className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-medium px-2.5 py-1 rounded border border-amber-500/25 transition-all cursor-pointer"
                  >
                    Todos Justificados
                  </button>
                </div>
              </div>

              {/* Lista de Membros e Suas Opções de Presença */}
              <div className="divide-y divide-slate-800/60 max-h-[60vh] overflow-y-auto">
                {filteredMembers.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium text-slate-400">Nenhum membro encontrado</p>
                    <p className="text-xs mt-1">Experimente limpar seus filtros ou termos de pesquisa.</p>
                  </div>
                ) : (
                  filteredMembers.map((member) => {
                    const attendance = attendances[member.id] || {
                      memberId: member.id,
                      status: 'present',
                      notes: ''
                    };

                    return (
                      <div 
                        key={member.id} 
                        className={`p-4 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                          attendance.status === 'present' 
                            ? 'hover:bg-emerald-500/[0.01]' 
                            : attendance.status === 'absent' 
                            ? 'hover:bg-rose-500/[0.01]' 
                            : 'hover:bg-amber-500/[0.01]'
                        }`}
                      >
                        {/* Nome e informações básicas */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2.5">
                            <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                              attendance.status === 'present' 
                                ? 'bg-emerald-500' 
                                : attendance.status === 'absent' 
                                ? 'bg-rose-500' 
                                : 'bg-amber-500'
                            }`} />
                            <div>
                              <h4 className="font-semibold text-slate-700 truncate max-w-[280px] sm:max-w-[400px]">
                                {member.nome}
                              </h4>
                              <p className="text-xs text-slate-600 mt-0.5 truncate">{member.email}</p>
                              
                              {(member.curso || member.universidade) && (
                                <span className="inline-block text-xs tracking-wider text-slate-600  border border-indigo-900/30 px-1.5 py-0.5 rounded mt-1.5">
                                  {member.curso || 'Não especificado'} • {member.universidade || 'Univ.'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Seletor de Presença e Comentário */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:w-3/5">
                          
                          {/* Input de anotação adicional */}
                          <input
                            type="text"
                            placeholder="Observação (ex: atrasado)"
                            value={attendance.notes || ''}
                            onChange={(e) => handleNoteChange(member.id, e.target.value)}
                            className="/50 border border-slate-300/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors flex-1 hidden"
                          />

                          {/* Botões do Status */}
                          <div className="grid grid-cols-3 gap-1  p-1 rounded-lg border border-slate-300 hidden">
                            <button
                              onClick={() => handleStatusChange(member.id, 'present')}
                              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                attendance.status === 'present'
                                  ? 'bg-emerald-500/25 text-emerald-400 border border-emerald-500/20'
                                  : 'text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Presente
                            </button>

                            <button
                              onClick={() => handleStatusChange(member.id, 'absent')}
                              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                attendance.status === 'absent'
                                  ? 'bg-rose-500/25 text-rose-400 border border-rose-500/20'
                                  : 'text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Falta
                            </button>

                            <button
                              onClick={() => handleStatusChange(member.id, 'excused')}
                              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                attendance.status === 'excused'
                                  ? 'bg-amber-500/25 text-amber-400 border border-amber-500/20'
                                  : 'text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              <AlertCircle className="w-3.5 h-3.5" />
                              Justif.
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })
                )}
              </div>

              {/* Rodapé informativo */}
              <div className= " p-4 border-t border-slate-300 flex justify-between items-center text-xs text-slate-500">
                <span>Listando {filteredMembers.length} de {members.length} membros cadastrados</span>
              </div>

            </div>
          )}

        </div>
      </main>
    </div>
  );
}