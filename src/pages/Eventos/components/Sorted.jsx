import React, { useState, useEffect, useMemo } from 'react';
import { 
  Trophy, 
  Users, 
  Settings, 
  Play, 
  RotateCcw, 
  CheckCircle, 
  Filter,
  UserCheck,
  Search,
  History,
  Maximize,
  Minimize
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import  storage  from '@/src/utilies/storage';
import * as XLSX from "xlsx";


// Mock de dados baseado na estrutura da imagem enviada
const MOCK_DATA = [
  { id: '1', email: 'joao@email.com', status: 'paid', present: true, type: 'VIP', number: '001', form_data: { name: 'João Silva' } },
  { id: '2', email: 'maria@email.com', status: 'paid', present: true, type: 'Normal', number: '002', form_data: { name: 'Maria Souza' } },
  { id: '3', email: 'pedro@email.com', status: 'pending', present: false, type: 'Normal', number: '003', form_data: { name: 'Pedro Alves' } },
  { id: '4', email: 'ana@email.com', status: 'paid', present: true, type: 'VIP', number: '004', form_data: { name: 'Ana Costa' } },
  { id: '5', email: 'lucas@email.com', status: 'paid', present: true, type: 'Palestrante', number: '005', form_data: { name: 'Lucas Lima' } },
];

export default function Sorted() {
  // Estados de Configuração
  const { id } = useParams();
  const [expand, setExpand] = useState(false)
  const [participants, setParticipants] = useState(MOCK_DATA);
  const [prizeName, setPrizeName] = useState('iPhone 15 Pro');
  const [winners, setWinners] = useState([]);

  const fetchRegistrations = async() => {
      const regs = await storage.getRegistrations(id);
      setParticipants(regs || []);
  }
  const fetchSorteds = async() => {
      const regs = await storage.getSorteds(id);
      setWinners(regs || []);
  }
  useEffect(()=> {
    fetchRegistrations()
    fetchSorteds()
  },[id])
  
  // Estados de Filtro
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPresent, setFilterPresent] = useState('all');
  const [filterTypes, setFilterTypes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  

  // Estados de Animação
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentDisplay, setCurrentDisplay] = useState(null);
  const [winnerResult, setWinnerResult] = useState(null);
  const [showEligible, setShowEligible] = useState(false);

  // Lógica de Filtro
  const filteredParticipants = useMemo(() => {
    return participants.filter(p => {
      const matchStatus = filterStatus === 'all' || p.status === filterStatus;
      const matchPresent = filterPresent === 'all' || (filterPresent === 'true' ? p.present : !p.present);
      const matchType =
        filterTypes.length === 0 || filterTypes.includes(p.type);
      const matchSearch = p.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (p.form_data?.name?.toLowerCase().includes(searchTerm.toLowerCase()));
      // Evita sortear quem já ganhou (opcional)
      const notWinner = !winners.find(w => w.registration_id === p.id);
      
      return matchStatus && matchPresent && matchType && matchSearch && notWinner;
    });
  }, [participants, filterStatus, filterPresent, filterTypes, searchTerm, winners]);

  // Função do Sorteio
  const startDraw = () => {
    if (filteredParticipants.length === 0) return;
    
    setIsDrawing(true);
    setWinnerResult(null);
    
    let iterations = 0;
    const maxIterations = 30;
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * filteredParticipants.length);
      setCurrentDisplay(filteredParticipants[randomIndex]);
      
      iterations++;
      if (iterations >= maxIterations) {
        clearInterval(interval);
        const finalWinner = filteredParticipants[Math.floor(Math.random() * filteredParticipants.length)];
        finishDraw(finalWinner);
      }
    }, 100);
  };


  const finishDraw = async(winner) => {
    const nowSP = new Date().toLocaleString('sv-SE', {
        timeZone: 'America/Sao_Paulo'
        }).replace(' ', 'T');
    setIsDrawing(false);
    setWinnerResult(winner);
    console.log(winner)
    const newWinnerEntry = {
        event_id: winner.event_id,
        registration_id: winner.id,
        winner_email: winner.email,
        prize_name: prizeName,
        winner_name: winner.form_data.hc8b43fzo,
        created_at: nowSP
    };
    await storage.saveWinnerSorted(newWinnerEntry)
    setWinners([newWinnerEntry, ...winners]);
  };

  const resetAll = async() => {
    if(confirm("Deseja realmente resetar todos os ganhadores e filtros?")) {
        await storage.resetSorteds()
        setWinners([]);
        setWinnerResult(null);
        setCurrentDisplay(null);
        setFilterStatus('all');
        setFilterPresent('all');
        setFilterTypes([]);
    }
  };
    const downloadEligibleExcel = () => {
  if (filteredParticipants.length === 0) {
    alert("Nenhum participante apto para exportar.");
    return;
  }

  const data = filteredParticipants.map(p => ({
    Nome: p.form_data.hc8b43fzo ,
    Email: p.email,
    Numero: p.number,
    Tipo: p.type,
    Status: p.status,
    Presente: p.present ? "Sim" : "Não",
    Bilhete: p.number || "",
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Participantes Aptos");

  XLSX.writeFile(workbook, "participantes_aptos.xlsx");
    };

  return (
    <div className={`${
        expand
          ? "fixed inset-0 z-50 bg-white overflow-y-auto"
          : ""
      }`}>
      <div className="min-h-screen border border-slate-300 rounded-md border-slate-300 p-4 md:p-8 font-sans">
        {/* Botão */}
        {expand ? (
          <Minimize
            className="mb-4 cursor-pointer"
            onClick={() => setExpand(false)}
          />
        ) : (
          <Maximize
            className="mb-4 cursor-pointer"
            onClick={() => setExpand(true)}
          />
        )}
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
      
          {/* Painel de Controle e Filtros */}
          <div className="lg:col-span-1 space-y-6">
            <div className="border border-slate-300 rounded-md p-6 shadow-xl">
              <div className="flex items-center gap-2 mb-6">
                <Settings className="text-blue-400" size={20} />
                <h2 className="text-xl ">Configurações</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1 ">Prêmio da Vez</label>
                  <input
                    type="text"
                    value={prizeName}
                    onChange={(e) => setPrizeName(e.target.value)}
                    className="w-full  border border-slate-300  rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="Ex: Kit Gamer"
                  />
                </div>
                <div className="pt-4 border-t border-slate-800">
                  <div className="flex items-center gap-2 mb-4">
                    <Filter className="text-blue-400" size={18} />
                    <h3 className="font-semibold">Filtros de Participação</h3>
                  </div>
                  <div className="space-y-3">
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full  border border-slate-300  rounded-lg px-3 py-2 text-sm outline-none"
                    >
                      <option value="all">Todos os Status</option>
                      <option value="paid">Apenas Pagos (Paid)</option>
                      <option value="pending">Pendentes</option>
                    </select>
                    <select
                      value={filterPresent}
                      onChange={(e) => setFilterPresent(e.target.value)}
                      className="w-full  border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none"
                    >
                      <option value="all">Presença: Todos</option>
                      <option value="true">Apenas Presentes</option>
                      <option value="false">Apenas Ausentes</option>
                    </select>
                  <div className="w-full  border border-slate-300  rounded-lg px-3 py-2 text-sm outline-none">
                      <p className='mb-2'>Tipo</p>
                      {['combo','online','presencial','hibrido'].map(type => (
                          <label key={type} className="flex items-center gap-2 text-sm">
                              <input
                              type="checkbox"
                              checked={filterTypes.includes(type)}
                              onChange={() => {
                                  setFilterTypes(prev =>
                                  prev.includes(type)
                                      ? prev.filter(t => t !== type)
                                      : [...prev, type]
                                  );
                              }}
                              />
                              {type}
                          </label>
                          ))}
                  </div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                      <input
                        type="text"
                        placeholder="Buscar nome ou email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full  border border-slate-300  rounded-lg pl-9 pr-3 py-2 text-sm outline-none"
                      />
                    </div>
                  </div>
                </div>
                  <div className="mt-6 flex items-center justify-between bg-blue-500/10 p-4 rounded-xl border border-slate-300 border-blue-500/20">
                      <div className="flex flex-col">
                      <span className="text-xs text-blue-400 uppercase  tracking-wider">Aptos</span>
                      <span className="text-2xl ">{filteredParticipants.length}</span>
                      </div>
                      <Users className="text-blue-400" size={24} />
                  </div>
                  {showEligible && (
                      <div className="mt-4 border border-slate-300 rounded-lg max-h-[250px] overflow-y-auto">
                          <div className='border-b pb-2'>
                              <button
                                  onClick={downloadEligibleExcel}
                                  disabled={filteredParticipants.length === 0}
                                  className="w-fit ml-1 mt-3 px-2 py-1 bg-green-600 text-white rounded-md hover:bg-green-500 disabled:opacity-50"
                                  >
                                  Baixar lista
                              </button>
                          </div>
                          {filteredParticipants.length === 0 ? (
                          <div className="p-4 text-center text-sm text-slate-500">
                              Nenhum participante apto com os filtros atuais.
                          </div>
                          ) : (
                          <table className="w-full text-sm">
                              <thead className="border-b bg-slate-50">
                              <tr>
                                  <th className="p-2 text-left">Email</th>
                                  <th className="p-2 text-left">Tipo</th>
                                  <th className="p-2 text-left">Status</th>
                              </tr>
                              </thead>
                              <tbody>
                              {filteredParticipants.map(p => (
                                  <tr key={p.id} className="border-b">
                                  <td className="p-2">
                                      {p.email}
                                  </td>
                                  <td className="p-2">{p.type}</td>
                                  <td className="p-2">{p.status}</td>
                                  </tr>
                              ))}
                              </tbody>
                          </table>
                          )}
                      </div>
                  )}
                  <button
                      onClick={() => setShowEligible(prev => !prev)}
                      className="w-full mt-3 px-4 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50 transition"
                      >
                      {showEligible ? "Ocultar participantes aptos" : "Ver participantes aptos"}
                  </button>
                <button
                  onClick={resetAll}
                  className="w-full flex items-center justify-center gap-2 text-slate-500 hover:text-red-400 text-sm transition-colors pt-2"
                >
                  <RotateCcw size={14} /> Resetar Sistema
                </button>
              </div>
            </div>
          </div>
          {/* Área Principal de Sorteio */}
          <div className="lg:col-span-2 space-y-6">
            <div className=" border border-slate-300 bg-slate-50 rounded-md p-8 flex flex-col items-center justify-center min-h-[450px] relative overflow-hidden shadow-2xl">
              {/* Background Decorativo */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
      
              {!winnerResult && !isDrawing && (
                <div className="text-center space-y-6 animate-in fade-in zoom-in duration-500">
                  <div className="w-24 h-24  rounded-full flex items-center justify-center mx-auto mb-4 border-4 ">
                    <Trophy size={48} className="text-slate-600" />
                  </div>
                  <h1 className="text-2xl md:text-5xl  tracking-tighter">Pronto para começar?</h1>
                  <p className="text-slate-400 text-sm md:text-lg max-w-xs mx-auto">Configure o prêmio e os filtros ao lado para iniciar o sorteio.</p>
                  <button
                    disabled={filteredParticipants.length === 0}
                    onClick={startDraw}
                    className="group relative px-4 py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-full text-sm md:text-xl text-white transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(37,99,235,0.4)]"
                  >
                    <span className="flex items-center">
                      <Play fill="currentColor" size={20} className='mr-2'/> SORTEAR AGORA
                    </span>
                  </button>
                </div>
              )}
              {isDrawing && (
                <div className="text-center space-y-8">
                  <div className="text-blue-400 font-mono text-xl animate-pulse uppercase tracking-[0.3em]">Sorteando...</div>
                  <div className=" p-10 rounded-2xl border-2 border-blue-500/50 shadow-[0_0_50px_rgba(37,99,235,0.2)]">
                    <div className="text-5xl md:text-7xl font-black text-white transition-all duration-75">
      
                    </div>
                    <div className="text-slate-500 mt-2 font-mono">
                      ID: {currentDisplay?.number || "---"}
                    </div>
                  </div>
                  <div className="flex gap-2 justify-center">
                     {[1,2,3].map(i => (
                       <div key={i} className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{animationDelay: `${i*0.2}s`}}></div>
                     ))}
                  </div>
                </div>
              )}
              {winnerResult && !isDrawing && (
                <div className="text-center space-y-6 animate-in zoom-in fade-in duration-700">
                  <div className="relative inline-block">
                    <div className="absolute -inset-4 bg-yellow-500/20 rounded-full blur-2xl animate-pulse"></div>
                    <div className="w-32 h-32 bg-yellow-500 rounded-full flex items-center justify-center mx-auto relative border-4 border-yellow-200">
                      <Trophy size={64} className="text-yellow-900" />
                    </div>
                  </div>
      
                  <div className="space-y-2">
                    <h2 className="text-yellow-500 text-lg md:text-2xl uppercase tracking-widest">Ganhador(a)!</h2>
                    <div className="text-xl md:text-3xl  drop-shadow-lg">
                      {winnerResult.form_data?.hc8b43fzo || winnerResult.email}
                    </div>
                    <p className="text-lg md:text-4xl text-white  bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 w-fit mx-auto rounded-md p-2">{prizeName}</p>
                  </div>
                  <div className="flex flex-col gap-3 justify-center items-center text-sm md:text-lg pt-4">
                    <span className=" px-4 py-2 rounded-md border border-slate-300  flex items-center gap-2 w-fit">
                      <UserCheck size={14} className="text-green-400" /> {winnerResult.type}
                    </span>
                    <span className=" mx-4 px-3 py-2 rounded-md border border-slate-300  text-sm md:text-xl">
                      Bilhete: <span className="text-blue-400 ">{winnerResult.id}</span>
                    </span>
                  </div>
                  <div className="flex gap-4 pt-8">
                    <button
                      onClick={() => setWinnerResult(null)}
                      className="mx-auto text-white px-8 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl  shadow-lg transition-all"
                    >
                      Confirmar
                    </button>
                  </div>
                </div>
              )}
            </div>
            {/* Histórico de Ganhadores */}
            <div className=" border border-slate-300 rounded-md bg-white overflow-hidden">
              <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 ">
                  <History className="text-purple-400" size={18} />
                  Histórico de Ganhadores
                </div>
                <span className="text-xs  text-slate-400 px-2 py-1 rounded">
                  Total: {winners.length}
                </span>
              </div>
      
              <div className="max-h-[300px] overflow-y-auto">
                {winners.length === 0 ? (
                  <div className="p-10 text-center text-slate-600 italic">
                    Nenhum ganhador registrado ainda.
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead className="/50 text-xs text-slate-500 uppercase border-b">
                      <tr>
                        <th className="p-4 font-medium">Ganhador</th>
                        <th className="p-4 font-medium">Prêmio</th>
                        <th className="p-4 font-medium">Hora</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {winners.map((w) => (
                        <tr key={w.id} className="hover:/30 transition-colors group">
                          <td className="p-4 flex items-center gap-2">
                            <CheckCircle size={14} className="text-green-500" />
                            {w.winner_name}
                          </td>
                          <td className="p-4 group-hover:text-yellow-500 transition-colors italic">
                            {w.prize_name}
                          </td>
                          <td className="p-4 text-xs text-slate-500">
                            {new Date(w.created_at).toLocaleTimeString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}