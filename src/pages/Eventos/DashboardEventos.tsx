
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import  storage  from '../../utilies/storage';
import { ArrowRight, CalendarDays, Link2, MapPin, Video } from 'lucide-react';
import Loading from '../../components/ui/Loading';


const DashboardEvents = () => {

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadEvents = async () => {
      setLoading(true)
      try {
        const data = await storage.getEvents();
        setEvents(data || []);
        setLoading(false)
      } catch (err) {
        console.error("Erro ao carregar eventos:", err);
      }
    };

    loadEvents();
  }, []);

  const copyToClipboard = (id) => {
    const url = `${window.location.origin}/form/${id}`;
    navigator.clipboard.writeText(url);
    alert('Link copiado para a área de transferência!');
  };
  function formatDateBR(dateStr) {
    if (!dateStr) return "";
    const [y, m, d] = String(dateStr).split("-");
    return `${d}/${m}/${y}`;
  }

  function formatTime(timeStr) {
    if (!timeStr) return "";
    // se vier "15:00:00" -> "15:00"
    return String(timeStr).slice(0, 5);
  }

  if (loading) return (
  <div className='w-full h-screen flex justify-center items-center'>
    <Loading/>
  </div>)
  

  
  return (
    <div className=" px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 ">Meus Eventos</h1>
          <p className="text-slate-500">Gerencie suas inscrições e formulários em um só lugar.</p>
        </div>
        <div>
          <Link to="/eventos/create" className="bg-green-700 text-white px-6 py-3 rounded-md font-semibold hover:bg-green-600 transition-all shadow-lg shadow-indigo-100 truncate">
            Novo Evento
          </Link>
        </div>
      </div>
      {events.length == 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
          <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-slate-700">Nenhum evento criado</h3>
          <p className="text-slate-500 mt-2 mb-6">Comece agora criando seu primeiro evento personalizado.</p>
          <Link to="/Eventos/create" className="bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition-all shadow-lg shadow-green-100">
            Criar Evento Agora
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
          {events.map((event) => (
            <div key={event.id} className="bg-white rounded-md shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow group">
              <div className="relative h-48">
                <img 
                  src={event.bannerUrl || `https://picsum.photos/seed/${event.id}/800/400`} 
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-5">
                <h3 className="text-xl font-bold text-slate-900 mb-2 truncate">{event.title}</h3>
                {/* datas */}
                <div className="my-3 space-y-3">
                  {event.presencial && (
                    <div className="grid grid-cols-[28px_1fr] gap-3 items-start text-slate-700">
                      <CalendarDays className="w-5 h-5 text-slate-500 mt-0.5" />

                      <div>
                        <p className="text-sm font-bold text-slate-900 mb-1">
                          Presencial
                        </p>

                        <div className="flex items-center gap-3">
                          <div className="leading-tight">
                            <p className="text-xs font-semibold">
                              {formatDateBR(event.date_inicio_presencial)}
                            </p>
                            <p className="text-xs font-semibold">
                              {formatTime(event.time_inicio_presencial)}
                            </p>
                          </div>

                          <span className="text-slate-300">
                            <ArrowRight className="w-4 h-4" />
                          </span>

                          <div className="leading-tight">
                            <p className="text-xs font-semibold">
                              {formatDateBR(event.date_fim_presencial)}
                            </p>
                            <p className="text-xs font-semibold">
                              {formatTime(event.time_fim_presencial)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {event.online && (
                    <div className="grid grid-cols-[28px_1fr] gap-3 items-start text-slate-700">
                      <CalendarDays className="w-5 h-5 text-slate-500 mt-0.5" />

                      <div>
                        <p className="text-sm font-bold text-slate-900 mb-1">
                          Online
                        </p>

                        <div className="flex items-center gap-3">
                          <div className="leading-tight">
                            <p className="text-xs font-semibold">
                              {formatDateBR(event.date_inicio_online)}
                            </p>
                            <p className="text-xs font-semibold">
                              {formatTime(event.time_inicio_online)}
                            </p>
                          </div>

                          <span className="text-slate-300">
                            <ArrowRight className="w-4 h-4" />
                          </span>

                          <div className="leading-tight">
                            <p className="text-xs font-semibold">
                              {formatDateBR(event.date_fim_online)}
                            </p>
                            <p className="text-xs font-semibold">
                              {formatTime(event.time_fim_online)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {event.presencial && (
                    <div className="grid grid-cols-[28px_1fr] gap-3 items-start">
                      <MapPin className="w-5 h-5 text-slate-500 mt-0.5" />
                      <p className="text-sm font-medium text-slate-700 leading-snug">
                        Local <br />
                        <span className="text-xs font-semibold text-indigo-600">
                          {event.adress},{" "}
                          <span className="text-slate-900">
                            {event.city} / {event.state}
                          </span>
                        </span>
                      </p>
                    </div>
                  )}

                  {event.online && (
                    <div className="grid grid-cols-[28px_1fr] gap-3 items-start">
                      <Video className="w-5 h-5 text-slate-500 mt-0.5" />
                      <p className="text-sm font-medium text-slate-700 leading-snug">
                        Plataforma <br />
                        <span className="text-xs font-bold text-indigo-600">
                          {event.platform || "Online"}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col space-y-2">
                  <Link 
                    to={`/eventos/app/${event.id}`} 
                    className="w-full text-center bg-green-900 text-white py-2 rounded-md font-medium hover:bg-green-800 transition-colors"
                  >
                    Acessar
                  </Link>
                  <div className="flex gap-2">
                    <Link 
                      to={`/event/${event.id}`}
                      className="flex-1 text-center bg-green-50 text-green-700 py-2 rounded-md font-medium hover:bg-green-100 transition-colors"
                    >
                      Ver Formulário
                    </Link>
                    <button 
                      onClick={() => copyToClipboard(event.id)}
                      className="p-2 bg-slate-50 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                      title="Copiar Link do Formulário"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardEvents;
