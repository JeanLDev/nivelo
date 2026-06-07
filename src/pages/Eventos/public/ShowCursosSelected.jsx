import React, { useState } from 'react';
import { Calendar, Clock, Tag, MapPin, CheckCircle } from 'lucide-react';

const ShowCursosSelected = ({registrations, registration}) => {
  // Dados baseados na estrutura fornecida
    
  const [openId, setOpenId] = useState(null);
  const formatDate = (dateString) => {
    const options = { day: '2-digit', month: 'long', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('pt-BR', options);
  };

  const toggleDetails = (id) => {
    setOpenId((prev) => (prev === id ? null : id));
  };
  const formatTime = (dateString) => {
    return dateString.split('T')[1].slice(0, 5);
  };

  return (
    <div className="">
      <div className="max-w-4xl mx-auto">
       
        <div className="grid gap-6">
          {registrations.map((course) => (
            <div 
              key={course.id} 
              className="bg-white rounded-md shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300"
            >
              <div className="p-6 sm:p-4 ">
                <div className="flex flex-row  md:items-center md:justify-between gap-4">
                  <div className="relative w-20 h-20 sm:w-28 md:w-32 aspect-video sm:aspect-[4/3] md:aspect-video shrink-0 overflow-hidden rounded-xl ">
                    <img
                      src={course.photo || "https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=300&auto=format&fit=crop"}
                      alt={course.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=300&auto=format&fit=crop";
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    {registration.status == 'paid' &&
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wider ${
                        course.type === 'presencial' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {course.type}
                      </span>
                      <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                        <CheckCircle size={14} /> Inscrito
                      </span>
                    </div>}
                    
                    <h2 className="text-sm lg:text-lg font-semibold   text-gray-800 mb-4 leading-tight">
                      {course.name}
                    </h2>

                    <div className="flex flex-col sm:flex-row items-start  justify-between gap-x-6 text-gray-600 ">
                        <div>
                            <div className=" flex items-center gap-2 text-xs">
                                <Calendar className="text-green-500" size={18} />
                                <span>{formatDate(course.inicio)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                                <Clock className="text-green-500" size={18} />
                                <span>{formatTime(course.inicio)} às {formatTime(course.fim)}</span>
                            </div>
                            
                        </div>

                    
                        <div className=" flex flex-col gap-2">
                            <div className="flex flex-nowrap items-center gap-2 text-xs font-semibold text-gray-900">
                                <Tag className="text-green-500" size={18} />
                                <span className='flex flex-nowrap'><span>R$</span> {course.price.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 md:mt-0 flex flex-col gap-2">
                                <button
                                  onClick={() => toggleDetails(course.id)}
                                  className="mt-2 w-full md:w-auto inline-flex justify-center items-center px-2 border border-transparent text-xs font-medium rounded-md text-white bg-green-700 hover:bg-green-800 transition-colors py-1"
                                >
                                  {openId === course.id ? 'Ocultar Detalhes' : 'Ver Detalhes'}
                                </button>
                            </div>
                  </div>

                </div>
              
              </div>
               <div
                  className={`transition-all duration-300 overflow-y-auto ${
                    openId === course.id
                      ? 'max-h-60 opacity-100 mt-3'
                      : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 shadow-sm">
                    
                    <h3 className="text-sm font-semibold text-slate-700 mb-2">
                      Sobre o curso
                    </h3>

                    <p className="text-sm text-slate-600 leading-relaxed">
                      {course.descricao}
                    </p>

                  </div>
                </div>
            </div>
            
          ))}
        </div>
        

        {registrations.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
            <p className="text-gray-500">Você ainda não possui inscrições.</p>
          </div>
        )}
        
      </div>
    </div>
  );
};

export default ShowCursosSelected;