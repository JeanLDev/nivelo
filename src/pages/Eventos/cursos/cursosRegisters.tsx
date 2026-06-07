import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Users, 
  Settings, 
  CheckCircle, 
  XCircle, 
  ChevronDown, 
  ChevronUp,
  Save,
  Loader2,
  Calendar,
  Mail,
  UserCheck
} from 'lucide-react';
import { supabase } from '@/src/lib/supabase';



// Interfaces de Tipagem
interface Course {
  id: string;
  name: string;
  limit: number;
  type: string;
  inicio: string;
  registrations_count?: number;
}

interface Registration {
  id: string;
  registration_info: {
    id: string;
    name: string;
    email: string;
    status: string;
  };
  has_presence: boolean;
}

export default function CursosRegisters() {
  const { id } = useParams<{ id: string }>();
  
  // Estados da Aplicação
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [attendees, setAttendees] = useState<Record<string, Registration[]>>({});
  const [editingLimit, setEditingLimit] = useState<{ id: string, value: number } | null>(null);
  const [search, setSearch] = useState('');
  const [order, setOrder] = useState<'name' | 'date'>('name');
  const [statusMessage, setStatusMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    courseId: string;
    registrationId: string;
    currentPresence: boolean;
    name: string;
  } | null>(null);

  const [confirmLoading, setConfirmLoading] = useState(false);

  // Inicialização
  useEffect(() => {
    if (id) {
      fetchCourses();
    }
  }, [id]);

  // Limpa mensagens de status após 3 segundos
  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => setStatusMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      // Busca cursos e conta registros
     const { data, error } = await supabase
      .from('curses_event')
      .select(`
        *,
        cursos_registrations (
          registrations_events!inner (
            status
          )
        )
      `)
      .eq('event_id', id)
      .eq('cursos_registrations.registrations_events.status', 'paid');

      if (error) throw error;

      const formatted = data.map((c: any) => ({
        ...c,
        registrations_count: c.cursos_registrations?.length || 0
      }));

      setCourses(formatted);
    } catch (err: any) {
      setStatusMessage({ text: "Erro ao carregar cursos: " + err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendees = async (
    courseId: string,
    search = '',
    order: 'name' | 'date' = 'name') => {
  try {
    const { data, error } = await supabase
    .from('cursos_registrations')
    .select(`
      id,
      registration_id,
      registrations_events!inner (
        id,
        name,
        email,
        status,
        form_data,
        created_at
      ),
      curses_event(curses_presence(*))
    `)
    .eq('curso_id', courseId)
    .eq('registrations_events.status', 'paid');
    console.log(data)


    if (error) throw error;

    const formatted = data.map((reg: any) => ({
      id: reg.id,
      registration_id: reg.registration_id,
      registration_info: reg.registrations_events,
      has_presence: reg?.curses_event?.curses_presence?.some(
        (p: any) =>
          p.curso_id === courseId &&
          p.registration_id === reg.registration_id
      )
    }));

    let filtered = formatted;

    if (search) {
      filtered = formatted.filter((reg) => {
        const name = reg.registration_info?.form_data?.jv2cl53d1 || '';
        return name.toLowerCase().includes(search.toLowerCase());
      });
    }

    if (order === 'name') {
        formatted.sort((a, b) => {
          const nameA = a.registration_info?.form_data?.jv2cl53d1 || '';
          const nameB = b.registration_info?.form_data?.jv2cl53d1 || '';
          return nameA.localeCompare(nameB);
        });
      }

      if (order === 'date') {
        formatted.sort((a, b) => {
          return new Date(b.registration_info?.created_at).getTime() -
                new Date(a.registration_info?.created_at).getTime();
        });
      }

    setAttendees(prev => ({ ...prev, [courseId]: filtered }));
  } catch (err) {
    console.error("Erro ao carregar inscritos:", err);
  }
};

  useEffect(() => {
    if (expandedCourse) {
      fetchAttendees(expandedCourse, search, order);
    }
  }, [search, order]);

  const updateLimit = async (courseId: string) => {
    if (!editingLimit) return;
    try {
      const { error } = await supabase
        .from('curses_event')
        .update({ limit: editingLimit.value })
        .eq('id', courseId);

      if (error) throw error;
      
      setCourses(prev => prev.map(c => c.id === courseId ? { ...c, limit: editingLimit.value } : c));
      setEditingLimit(null);
      setStatusMessage({ text: "Limite atualizado com sucesso!", type: 'success' });
    } catch (err: any) {
      setStatusMessage({ text: "Erro ao atualizar: " + err.message, type: 'error' });
    }
  };

  const togglePresence = async (
  courseId: string,
  registrationId: string,
  currentPresence: boolean
) => {
  try {
    if (currentPresence) {
      const {error} = await supabase
        .from('curses_presence')
        .delete()
        .match({
          curso_id: courseId,
          registration_id: registrationId
        });

        console.log(error)
    } else {
      const {error:err} = await supabase
        .from('curses_presence')
        .insert({
          curso_id: courseId,
          registration_id: registrationId
        });
        console.log(err)
    } 

    fetchAttendees(courseId);
  } catch (err) {
    console.error("Erro na presença:", err);
  }
};

  const handleExpand = (courseId: string) => {
    if (expandedCourse === courseId) {
      setExpandedCourse(null);
    } else {
      setExpandedCourse(courseId);
      if (!attendees[courseId]) fetchAttendees(courseId);
    }
  };
  const handleConfirmPresence = async () => {
    if (!confirmModal) return;

    setConfirmLoading(true);

    await togglePresence(
      confirmModal.courseId,
      confirmModal.registrationId,
      confirmModal.currentPresence
    );

    setConfirmLoading(false);
    setConfirmModal(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <Loader2 className="animate-spin text-blue-600 w-10 h-10" />
        <p className="text-gray-500 font-semibold">Carregando cursos...</p>
      </div>
    );
  }

  return (
    <div className="pt-3 mx-auto space-y-6 bg-gray-50 min-h-screen">
      <header className="flex justify-between items-center border-b border-slate-300 pb-4">
        <div>
          <h1 className="text-md lg:text-3xl font-semibold text-gray-800">Painel de Cursos</h1>
          <p className="text-sm text-gray-500">Gerencie inscritos, limites e presença por atividade.</p>
        </div>
        <div className="bg-white p-2 px-4 rounded-md shadow-sm border border-slate-300 text-sm font-semibold text-blue-600">
          ID Evento: {id?.substring(0, 8)}...
        </div>
      </header>

      {/* Mensagens de Feedback */}
      {statusMessage && (
        <div className={`p-3 rounded-md font-semibold text-center animate-bounce ${
          statusMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {statusMessage.text}
        </div>
      )}
      
      {courses.length === 0 && (
        <div className="text-center py-20 bg-white rounded-md border border-slate-300 border-dashed">
          <Calendar className="mx-auto text-gray-300 mb-2" size={48} />
          <p className="text-gray-500 font-semibold">Nenhum curso disponível para este evento.</p>
        </div>
      )}

      <div className="grid gap-4">
        {courses.map((course) => (
          <div key={course.id} className="border border-slate-300 border-gray-200 rounded-md overflow-hidden bg-white shadow-sm transition-all">
            {/* Header do Card */}
            <div className="p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${course.registrations_count! >= course.limit ? 'bg-red-500' : 'bg-green-500'}`} />
                  <h3 className="font-semibold text-sm lg:text-xl text-gray-800">{course.name}</h3>
                </div>
                <p className="text-xs font-semibold text-gray-400 mt-1 tracking-wider bg-gray-100 inline-block px-2 py-0.5 rounded-md">
                  {course.type || 'Geral'}
                </p>
              </div>

              <div className="flex items-center gap-8">
                <div className="text-right">
                  <p className="text-xs text-gray-400 font-semibold">Ocupação</p>
                  <p className={`text-lg font-semibold ${course.registrations_count! >= course.limit ? 'text-red-600' : 'text-gray-700'}`}>
                    {course.registrations_count} / {course.limit}
                  </p>
                </div>

                <button 
                  onClick={() => handleExpand(course.id)}
                  className="p-2 hover:bg-blue-50 text-blue-600 rounded-md transition-colors border border-slate-300 border-transparent hover:border-b border-slate-300lue-100"
                >
                  {expandedCourse === course.id ? <ChevronUp size={24}/> : <ChevronDown size={24}/>}
                </button>
              </div>
            </div>

            {/* Conteúdo Expandido */}
            {expandedCourse === course.id && (
              <div className="p-5 border-t border-gray-50 bg-gray-50/30 space-y-8 animate-in fade-in slide-in-from-top-2">
                
                {/* Seção de Configuração */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-md shadow-sm border border-slate-300 border-gray-100">
                    <div className="flex items-center gap-2 mb-3 text-blue-600">
                      <Settings size={18} />
                      <span className="font-semibold text-sm uppercase">Ajustes do Curso</span>
                    </div>
                    <div className="flex items-end gap-3">
                      <div className="flex-1">
                        <label className="text-xs text-gray-500 mb-1 block font-semibold">Vagas Totais (Limite)</label>
                        <input 
                          type="number"
                          value={editingLimit?.id === course.id ? editingLimit.value : course.limit}
                          onChange={(e) => setEditingLimit({ id: course.id, value: parseInt(e.target.value) || 0 })}
                          className="w-full p-2 bg-gray-50 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold"
                        />
                      </div>
                      {editingLimit?.id === course.id && editingLimit.value !== course.limit && (
                        <button 
                          onClick={() => updateLimit(course.id)}
                          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-700 transition-all shadow-md"
                        >
                          <Save size={18} />
                          Salvar
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-md shadow-sm border border-slate-300 border-gray-100 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Status de Lotação</p>
                      <div className="h-2 w-48 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all ${course.registrations_count! >= course.limit ? 'bg-red-500' : 'bg-blue-500'}`}
                          style={{ width: `${Math.min((course.registrations_count! / course.limit) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-3 bg-gray-50">
                  
                  {/* 🔎 Busca */}
                  <input
                    type="text"
                    placeholder="Buscar por nome..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 p-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />

                  {/* 🔤 Ordenação */}
                  <select
                    value={order}
                    onChange={(e) => setOrder(e.target.value as 'name' | 'date')}
                    className="p-2 border border-slate-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="name">Ordenar por Nome (A-Z)</option>
                    <option value="date">Mais recentes</option>
                  </select>

                </div>
                {/* Lista de Participantes */}
                <div className="bg-white rounded-md shadow-sm border border-slate-300 border-gray-100 overflow-hidden">
                  <div className="p-4 border-b border-slate-300 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Users size={18} />
                      <span className="font-semibold">Participantes Inscritos</span>
                    </div>
                    <span className="text-xs font-semibold bg-gray-100 px-2 py-1 rounded-md text-gray-500">
                      {attendees[course.id]?.length || 0} Registros
                    </span>
                  </div>

                  {!attendees[course.id] ? (
                    <div className="p-10 text-center"><Loader2 className="animate-spin h-6 w-6 text-blue-500 mx-auto" /></div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="bg-gray-50 text-gray-400 uppercase text-[10px] tracking-widest font-bold">
                            <th className="px-6 py-3">Dados do Aluno</th>
                            <th className="px-6 py-3 text-center w-40">Status Presença</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {attendees[course.id].map((reg) => (
                            <tr key={reg.id} className="hover:bg-blue-50/30 transition-colors group">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold text-xs">
                                    {reg.registration_info?.name?.charAt(0) || '?'}
                                  </div>
                                  <div>
                                    <div className="font-semibold text-gray-800">{reg.registration_info?.form_data?.jv2cl53d1 || 'Não identificado'}</div>
                                    <div className="flex items-center gap-1 text-xs text-gray-400">
                                      <Mail size={12} />
                                      {reg.registration_info?.email}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <button
                                  onClick={() =>
                                    setConfirmModal({
                                      open: true,
                                      courseId: course.id,
                                      registrationId: reg.registration_id,
                                      currentPresence: reg.has_presence,
                                      name: reg.registration_info?.form_data?.jv2cl53d1 || 'Aluno'
                                    })
                                  }
                                  className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-semibold transition-all border border-slate-300 shadow-sm ${
                                    reg.has_presence 
                                      ? 'bg-green-600 text-white border-green-700 hover:bg-green-700' 
                                      : 'bg-white text-gray-500 border-gray-200 hover:border-b border-slate-300lue-300 hover:text-blue-600'
                                  }`}
                                >
                                  {reg.has_presence ? <UserCheck size={14} /> : <XCircle size={14} />}
                                  Presente
                                </button>
                              </td>
                            </tr>
                          ))}
                          {attendees[course.id].length === 0 && (
                            <tr>
                              <td colSpan={2} className="px-6 py-10 text-center text-gray-400 font-semibold italic">
                                Nenhuma inscrição confirmada para este curso.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {confirmModal?.open && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
    
    <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6 animate-in fade-in zoom-in-95">
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-full ${
          confirmModal.currentPresence ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
        }`}>
          {confirmModal.currentPresence ? <XCircle /> : <UserCheck />}
        </div>
        <h2 className="text-lg font-semibold text-gray-800">
          Confirmar ação
        </h2>
      </div>

      {/* Texto */}
      <p className="text-sm text-gray-600 mb-6">
        {confirmModal.currentPresence ? (
          <>
            Remover presença de <strong>{confirmModal.name}</strong>?
          </>
        ) : (
          <>
            Confirmar presença de <strong>{confirmModal.name}</strong>?
          </>
        )}
      </p>

      {/* Botões */}
      <div className="flex justify-end gap-3">
        
        <button
          onClick={() => setConfirmModal(null)}
          className="px-4 py-2 rounded-md border border-slate-300 text-gray-600 hover:bg-gray-100"
        >
          Cancelar
        </button>

        <button
          onClick={handleConfirmPresence}
          disabled={confirmLoading}
          className={`px-4 py-2 rounded-md text-white font-semibold flex items-center gap-2 ${
            confirmModal.currentPresence
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {confirmLoading && <Loader2 className="animate-spin" size={16} />}
          {confirmModal.currentPresence ? 'Remover' : 'Confirmar'}
        </button>

      </div>
    </div>
  </div>
)}
    </div>
  );
}