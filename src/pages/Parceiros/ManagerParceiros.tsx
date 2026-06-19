import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Instagram, 
  Phone, 
  Mail, 
  Award, 
  Plus, 
  Trash2, 
  Edit3, 
  MessageSquare, 
  Calendar, 
  Database, 
  Code, 
  ChevronLeft,
  X,
  Check,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

// --- CONFIGURAÇÃO DE TIPOS ---

interface Parceiro {
  id: string;
  nome: string;
  instagram: string;
  telefone: string;
  email: string;
  especialidades: string[];
  created_at?: string;
}

interface Acao {
  id: string;
  parceiro_id: string;
  titulo: string;
  descricao: string;
  data: string;
}

interface Comentario {
  id: string;
  parceiro_id: string;
  autor: string;
  texto: string;
  created_at: string;
}



export default function ManagerParceiros() {

  // Estados dos Dados
  const [parceiros, setParceiros] = useState<Parceiro[]>();
  const [acoes, setAcoes] = useState<Acao[]>();
  const [comentarios, setComentarios] = useState<Comentario[]>();

  // Navegação e Filtros
  const [activeTab, setActiveTab] = useState<'lista' | 'sql-setup'>('lista');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [selectedParceiro, setSelectedParceiro] = useState<Parceiro | null>(null);

  // Modais de Criação/Edição
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Parceiro | null>(null);

  // Estados dos Formulários
  const [formDataName, setFormDataName] = useState('');
  const [formDataInsta, setFormDataInsta] = useState('');
  const [formDataPhone, setFormDataPhone] = useState('');
  const [formDataEmail, setFormDataEmail] = useState('');
  const [formDataSpecialties, setFormDataSpecialties] = useState('');

  // Ações e Comentários Formulários
  const [showAcaoForm, setShowAcaoForm] = useState(false);
  const [acaoTitle, setAcaoTitle] = useState('');
  const [acaoDesc, setAcaoDesc] = useState('');
  const [acaoDate, setAcaoDate] = useState('');

  const [showComentarioForm, setShowComentarioForm] = useState(false);
  const [comentarioAutor, setComentarioAutor] = useState('');
  const [comentarioTexto, setComentarioTexto] = useState('');
  const [editingComentarioId, setEditingComentarioId] = useState<string | null>(null);

  // Status de feedback visual
  const [toastMessage, setToastMessage] = useState('');



  const fetchDataFromSupabase = async (client: supabase) => {
    try {
      const { data: pData } = await client.from('parceiros').select('*').order('nome');
      const { data: aData } = await client.from('acoes_parceiros').select('*').order('data', { ascending: false });
      const { data: cData } = await client.from('comentarios_parceiros').select('*').order('created_at', { ascending: false });

      if (pData) setParceiros(pData);
      if (aData) setAcoes(aData);
      if (cData) setComentarios(cData);
    } catch (err) {
      console.error('Erro ao buscar dados do Supabase:', err);
    }
  };

  // Atualiza os dados se conectado ao Supabase
  useEffect(() => {
    if (supabase) {
      fetchDataFromSupabase(supabase);
    }
  }, [selectedParceiro]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // --- HANDLERS DO CRUD DE PARCEIROS ---

  const openAddModal = () => {
    setEditingPartner(null);
    setFormDataName('');
    setFormDataInsta('');
    setFormDataPhone('');
    setFormDataEmail('');
    setFormDataSpecialties('');
    setShowPartnerModal(true);
  };

  const openEditModal = (p: Parceiro) => {
    setEditingPartner(p);
    setFormDataName(p.nome);
    setFormDataInsta(p.instagram);
    setFormDataPhone(p.telefone);
    setFormDataEmail(p.email);
    setFormDataSpecialties(p.especialidades.join(', '));
    setShowPartnerModal(true);
  };

  const handleSavePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDataName) return;

    const specsArray = formDataSpecialties
      ? formDataSpecialties.split(',')?.map(s => s.trim()).filter(s => s?.length > 0)
      : [];

    const newPartnerData = {
      nome: formDataName,
      instagram: formDataInsta,
      telefone: formDataPhone,
      email: formDataEmail,
      especialidades: specsArray
    };

    if (supabase) {
      try {
        if (editingPartner) {
          const { error } = await supabase
            .from('parceiros')
            .update(newPartnerData)
            .eq('id', editingPartner.id);
          if (error) throw error;
          showToast('Parceiro atualizado com sucesso no Supabase!');
        } else {
          const { error } = await supabase
            .from('parceiros')
            .insert([newPartnerData]);
          if (error) throw error;
          showToast('Novo parceiro cadastrado com sucesso!');
        }
        fetchDataFromSupabase(supabase);
      } catch (err: any) {
        showToast(`Erro ao salvar no Supabase: ${err.message}`);
      }
    } else {
      // Modo de Simulação Local
      if (editingPartner) {
        setParceiros(prev => prev?.map(p => p.id === editingPartner.id ? { ...p, ...newPartnerData } : p));
        if (selectedParceiro?.id === editingPartner.id) {
          setSelectedParceiro({ ...selectedParceiro, ...newPartnerData });
        }
        showToast('Parceiro atualizado localmente!');
      } else {
        const localNew: Parceiro = {
          id: Math.random().toString(36).substring(2, 9),
          ...newPartnerData,
          created_at: new Date().toISOString()
        };
        setParceiros(prev => [localNew, ...prev]);
        showToast('Parceiro adicionado localmente!');
      }
    }

    setShowPartnerModal(false);
  };

  const handleDeletePartner = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Deseja realmente remover este parceiro da liga acadêmica?')) return;

    if (supabase) {
      try {
        const { error } = await supabase.from('parceiros').delete().eq('id', id);
        if (error) throw error;
        showToast('Parceiro removido do Supabase!');
        if (selectedParceiro?.id === id) setSelectedParceiro(null);
        fetchDataFromSupabase(supabase);
      } catch (err: any) {
        showToast(`Erro ao deletar: ${err.message}`);
      }
    } else {
      setParceiros(prev => prev.filter(p => p.id !== id));
      if (selectedParceiro?.id === id) setSelectedParceiro(null);
      showToast('Parceiro removido localmente!');
    }
  };

  // --- HANDLERS DO HISTÓRICO DE AÇÕES ---

  const handleAddAcao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParceiro || !acaoTitle || !acaoDate) return;

    const novaAcaoData = {
      parceiro_id: selectedParceiro.id,
      titulo: acaoTitle,
      descricao: acaoDesc,
      data: acaoDate
    };

    if ( supabase) {
      try {
        const { error } = await supabase.from('acoes_parceiros').insert([novaAcaoData]);
        if (error) throw error;
        showToast('Ação registrada com sucesso!');
        fetchDataFromSupabase(supabase);
      } catch (err: any) {
        showToast(`Erro: ${err.message}`);
      }
    } else {
      const localAcao: Acao = {
        id: Math.random().toString(36).substring(2, 9),
        ...novaAcaoData
      };
      setAcoes(prev => [localAcao, ...prev]);
      showToast('Ação registrada localmente!');
    }

    setAcaoTitle('');
    setAcaoDesc('');
    setAcaoDate('');
    setShowAcaoForm(false);
  };

  const handleDeleteAcao = async (id: string) => {
    if (!confirm('Excluir esta ação do histórico?')) return;

    if ( supabase) {
      try {
        const { error } = await supabase.from('acoes_parceiros').delete().eq('id', id);
        if (error) throw error;
        showToast('Ação excluída!');
        fetchDataFromSupabase(supabase);
      } catch (err: any) {
        showToast(`Erro: ${err.message}`);
      }
    } else {
      setAcoes(prev => prev.filter(a => a.id !== id));
      showToast('Ação removida localmente.');
    }
  };

  // --- HANDLERS DOS COMENTÁRIOS (CRU) ---

  const handleSaveComentario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParceiro || !comentarioAutor || !comentarioTexto) return;

    if (editingComentarioId) {
      // Edição de comentário existente
      if ( supabase) {
        try {
          const { error } = await supabase
            .from('comentarios_parceiros')
            .update({ autor: comentarioAutor, texto: comentarioTexto })
            .eq('id', editingComentarioId);
          if (error) throw error;
          showToast('Comentário atualizado!');
          fetchDataFromSupabase(supabase);
        } catch (err: any) {
          showToast(`Erro: ${err.message}`);
        }
      } else {
        setComentarios(prev => prev?.map(c => c.id === editingComentarioId ? {
          ...c, autor: comentarioAutor, texto: comentarioTexto
        } : c));
        showToast('Comentário editado localmente.');
      }
    } else {
      // Criação de novo comentário
      const novoCom = {
        parceiro_id: selectedParceiro.id,
        autor: comentarioAutor,
        texto: comentarioTexto,
        created_at: new Date().toISOString()
      };

      if ( supabase) {
        try {
          const { error } = await supabase.from('comentarios_parceiros').insert([novoCom]);
          if (error) throw error;
          showToast('Comentário adicionado!');
          fetchDataFromSupabase(supabase);
        } catch (err: any) {
          showToast(`Erro: ${err.message}`);
        }
      } else {
        const localCom: Comentario = {
          id: Math.random().toString(36).substring(2, 9),
          ...novoCom
        };
        setComentarios(prev => [localCom, ...prev]);
        showToast('Comentário adicionado localmente.');
      }
    }

    setComentarioAutor('');
    setComentarioTexto('');
    setEditingComentarioId(null);
    setShowComentarioForm(false);
  };

  const startEditComentario = (c: Comentario) => {
    setEditingComentarioId(c.id);
    setComentarioAutor(c.autor);
    setComentarioTexto(c.texto);
    setShowComentarioForm(true);
  };

  // --- FILTRAGEM ---

  const todasEspecialidades = Array.from(
    new Set(parceiros?.flatMap(p => p.especialidades || []))
  );

  const parceirosFiltrados = parceiros?.filter(p => {
    const buscaMatch = p.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       p.especialidades.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    const especialidadeMatch = selectedSpecialty === '' || p.especialidades.includes(selectedSpecialty);
    return buscaMatch && especialidadeMatch;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-600 font-sans antialiased">
      
      {/* --- BANNER DE FEEDBACK (TOAST) --- */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 z-50 transition-all">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* --- HEADER PRINCIPAL --- */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-100 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-800 tracking-tight">Portal de Parceiros</h1>
            <p className="text-sm text-slate-600 mt-1">Gestão de apoiadores, colaboradores e histórico de ações da liga acadêmica.</p>
          </div>
        </div>
      </header>


      {/* --- ÁREA PRINCIPAL DE CONTEÚDO --- */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        
        {/* VIEW: LISTAGEM E DETALHES */}
        {activeTab === 'lista' && (
          <div>
            {!selectedParceiro ? (
              /* --- MÓDULO DE LISTA DE PARCEIROS --- */
              <div>
                {/* FILTROS E PESQUISA */}
                <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center mb-8">
                  <div className="flex flex-col sm:flex-row gap-3 flex-1">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input 
                        type="text" 
                        placeholder="Buscar por nome ou especialidade..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 bg-white"
                      />
                    </div>
                    
                    <select
                      value={selectedSpecialty}
                      onChange={(e) => setSelectedSpecialty(e.target.value)}
                      className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 bg-white"
                    >
                      <option value="">Todas especialidades</option>
                      {todasEspecialidades?.map(spec => (
                        <option key={spec} value={spec}>{spec}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={openAddModal}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors shrink-0"
                  >
                    <UserPlus className="w-4 h-4" />
                    Cadastrar parceiro
                  </button>
                </div>

                {/* CONTADOR E LISTA GRID */}
                <div className="mb-4">
                  <span className="text-sm text-slate-600 font-semibold bg-slate-100 px-3 py-1.5 rounded-xl">
                    Exibindo {parceirosFiltrados?.length} parceiros cadastrados
                  </span>
                </div>

                {parceirosFiltrados?.length === 0 ? (
                  <div className="bg-white rounded-xl border border-slate-100 p-12 text-center shadow-sm">
                    <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-base font-semibold text-slate-700 mb-1">Nenhum parceiro encontrado</h3>
                    <p className="text-sm text-slate-600">Altere seus termos de busca ou cadastre um novo parceiro acadêmico.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {parceirosFiltrados?.map((parceiro) => (
                      <div 
                        key={parceiro.id}
                        onClick={() => setSelectedParceiro(parceiro)}
                        className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm hover:shadow-md hover:border-emerald-100 transition-all cursor-pointer flex flex-col justify-between relative group"
                      >
                        <div>
                          {/* Nome e Ações rápidas */}
                          <div className="flex justify-between items-start gap-2 mb-3">
                            <h3 className="text-base font-semibold text-slate-800 leading-tight group-hover:text-emerald-700 transition-colors">
                              {parceiro.nome}
                            </h3>
                            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                              <button 
                                onClick={() => openEditModal(parceiro)}
                                className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                                title="Editar"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={(e) => handleDeletePartner(parceiro.id, e)}
                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                title="Deletar"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Especialidades */}
                          <div className="flex flex-wrap gap-1.5 mb-4">
                            {parceiro.especialidades?.map((spec, i) => (
                              <span 
                                key={i} 
                                className="text-[10px] font-semibold text-slate-600 bg-slate-50 px-2 py-0.5 rounded-xl border border-slate-100"
                              >
                                {spec}
                              </span>
                            ))}
                            {parceiro.especialidades?.length === 0 && (
                              <span className="text-[10px] text-slate-600 italic">Nenhuma especialidade informada</span>
                            )}
                          </div>
                        </div>

                        {/* Dados de Contato */}
                        <div className="space-y-1.5 pt-3 border-t border-slate-50 text-sm">
                          {parceiro.instagram && (
                            <div className="flex items-center gap-2 text-slate-600">
                              <Instagram className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{parceiro.instagram}</span>
                            </div>
                          )}
                          {parceiro.telefone && (
                            <div className="flex items-center gap-2 text-slate-600">
                              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{parceiro.telefone}</span>
                            </div>
                          )}
                          {parceiro.email && (
                            <div className="flex items-center gap-2 text-slate-600">
                              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{parceiro.email}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-4 pt-3 flex justify-end text-sm text-emerald-600 font-semibold group-hover:underline">
                          Ver perfil completo →
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* --- MÓDULO DE PERFIL DO PARCEIRO --- */
              <div>
                {/* Botão de Retorno */}
                <button
                  onClick={() => setSelectedParceiro(null)}
                  className="mb-6 flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-emerald-700 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Voltar para lista de parceiros
                </button>

                {/* Grid do Perfil */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  
                  {/* COLUNA ESQUERDA: INFOS DO PARCEIRO */}
                  <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm">
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                          <Users className="w-6 h-6" />
                        </div>
                        <button
                          onClick={() => openEditModal(selectedParceiro)}
                          className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Editar dados
                        </button>
                      </div>

                      <h2 className="text-lg font-semibold text-slate-800 leading-snug mb-2">{selectedParceiro.nome}</h2>
                      
                      <div className="flex flex-wrap gap-1.5 mb-6">
                        {selectedParceiro.especialidades?.map((spec, i) => (
                          <span key={i} className="text-[10px] font-semibold text-slate-600 bg-emerald-50/50 text-emerald-700 px-2.5 py-0.5 rounded-xl border border-emerald-100/50">
                            {spec}
                          </span>
                        ))}
                      </div>

                      <h3 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">Dados de contato</h3>
                      <div className="space-y-3 text-sm text-slate-600">
                        <div className="flex items-center gap-3">
                          <Instagram className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>{selectedParceiro.instagram || 'Não informado'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>{selectedParceiro.telefone || 'Não informado'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="break-all">{selectedParceiro.email || 'Não informado'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* COLUNA DIREITA: HISTÓRICO DE AÇÕES E COMENTÁRIOS */}
                  <div className="lg:col-span-2 space-y-8">
                    
                    {/* SEÇÃO: HISTÓRICO DE AÇÕES */}
                    <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm">
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-emerald-600" />
                          <h3 className="text-base font-semibold text-slate-800">Histórico de ações</h3>
                        </div>
                        
                        {!showAcaoForm && (
                          <button
                            onClick={() => setShowAcaoForm(true)}
                            className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Nova ação
                          </button>
                        )}
                      </div>

                      {/* Formulário de Ação */}
                      {showAcaoForm && (
                        <form onSubmit={handleAddAcao} className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6 space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-semibold text-slate-700">Adicionar atividade no histórico</span>
                            <button type="button" onClick={() => setShowAcaoForm(false)} className="text-slate-400 hover:text-slate-600">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Título da ação</label>
                              <input 
                                type="text" 
                                required 
                                value={acaoTitle} 
                                onChange={(e) => setAcaoTitle(e.target.value)}
                                placeholder="Ex: Palestra ministrada" 
                                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Data de ocorrência</label>
                              <input 
                                type="date" 
                                required 
                                value={acaoDate} 
                                onChange={(e) => setAcaoDate(e.target.value)}
                                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-white"
                              />
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Breve descrição ou feedback</label>
                            <textarea 
                              rows={2} 
                              value={acaoDesc} 
                              onChange={(e) => setAcaoDesc(e.target.value)}
                              placeholder="Ex: Detalhes sobre o evento, número de participantes..." 
                              className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-white"
                            ></textarea>
                          </div>

                          <div className="flex justify-end gap-2 pt-1">
                            <button 
                              type="button" 
                              onClick={() => setShowAcaoForm(false)} 
                              className="px-3 py-1.5 text-sm font-semibold bg-white border border-slate-200 rounded-xl text-slate-600"
                            >
                              Cancelar
                            </button>
                            <button 
                              type="submit" 
                              className="px-4 py-1.5 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors"
                            >
                              Salvar registro
                            </button>
                          </div>
                        </form>
                      )}

                      {/* Lista de Ações */}
                      <div className="space-y-4">
                        {acoes.filter(a => a.parceiro_id === selectedParceiro.id)?.length === 0 ? (
                          <p className="text-sm text-slate-600 italic">Nenhum evento registrado ainda para este parceiro.</p>
                        ) : (
                          acoes
                            .filter(a => a.parceiro_id === selectedParceiro.id)
                            ?.map(acao => (
                              <div key={acao.id} className="relative pl-5 border-l-2 border-emerald-200 pb-2">
                                <div className="absolute -left-1.5 top-1 w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>
                                <div className="flex justify-between items-start gap-4">
                                  <div>
                                    <h4 className="text-sm font-semibold text-slate-800 leading-tight">{acao.titulo}</h4>
                                    <span className="text-[10px] text-slate-600 font-semibold block mt-0.5">{acao.data}</span>
                                    <p className="text-sm text-slate-600 mt-1">{acao.descricao}</p>
                                  </div>
                                  <button
                                    onClick={() => handleDeleteAcao(acao.id)}
                                    className="text-slate-400 hover:text-red-500 p-1 rounded-xl hover:bg-red-50 transition-colors shrink-0"
                                    title="Remover registro"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))
                        )}
                      </div>
                    </div>

                    {/* SEÇÃO: COMENTÁRIOS / OBSERVAÇÕES (CRU) */}
                    <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm">
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-5 h-5 text-emerald-600" />
                          <h3 className="text-base font-semibold text-slate-800">Comentários e anotações</h3>
                        </div>

                        {!showComentarioForm && (
                          <button
                            onClick={() => {
                              setEditingComentarioId(null);
                              setComentarioAutor('');
                              setComentarioTexto('');
                              setShowComentarioForm(true);
                            }}
                            className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Anotar comentário
                          </button>
                        )}
                      </div>

                      {/* Formulário de Comentário */}
                      {showComentarioForm && (
                        <form onSubmit={handleSaveComentario} className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6 space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-semibold text-slate-700">
                              {editingComentarioId ? 'Editar comentário' : 'Novo comentário/avaliação'}
                            </span>
                            <button type="button" onClick={() => setShowComentarioForm(false)} className="text-slate-400 hover:text-slate-600">
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Autor da nota</label>
                            <input 
                              type="text" 
                              required 
                              value={comentarioAutor} 
                              onChange={(e) => setComentarioAutor(e.target.value)}
                              placeholder="Ex: Coordenação acadêmica, Diretor científico..." 
                              className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-white"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Comentário ou avaliação</label>
                            <textarea 
                              rows={3} 
                              required
                              value={comentarioTexto} 
                              onChange={(e) => setComentarioTexto(e.target.value)}
                              placeholder="Descreva as percepções sobre a parceria acadêmica..." 
                              className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-white"
                            ></textarea>
                          </div>

                          <div className="flex justify-end gap-2 pt-1">
                            <button 
                              type="button" 
                              onClick={() => {
                                setShowComentarioForm(false);
                                setEditingComentarioId(null);
                              }} 
                              className="px-3 py-1.5 text-sm font-semibold bg-white border border-slate-200 rounded-xl text-slate-600"
                            >
                              Cancelar
                            </button>
                            <button 
                              type="submit" 
                              className="px-4 py-1.5 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors"
                            >
                              {editingComentarioId ? 'Atualizar comentário' : 'Postar comentário'}
                            </button>
                          </div>
                        </form>
                      )}

                      {/* Lista de Comentários */}
                      <div className="space-y-4">
                        {comentarios.filter(c => c.parceiro_id === selectedParceiro.id)?.length === 0 ? (
                          <p className="text-sm text-slate-600 italic">Nenhum comentário ou anotação registrado para este parceiro.</p>
                        ) : (
                          comentarios
                            .filter(c => c.parceiro_id === selectedParceiro.id)
                            ?.map(com => (
                              <div key={com.id} className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 flex flex-col justify-between">
                                <div className="flex justify-between items-start gap-4 mb-2">
                                  <div>
                                    <span className="text-sm font-semibold text-slate-800">{com.autor}</span>
                                    <span className="text-[10px] text-slate-600 ml-2">
                                      {new Date(com.created_at).toLocaleDateString('pt-BR')}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => startEditComentario(com)}
                                    className="text-slate-400 hover:text-emerald-600 p-1 rounded-xl transition-colors shrink-0"
                                    title="Editar nota"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <p className="text-sm text-slate-600 italic leading-relaxed">"{com.texto}"</p>
                              </div>
                            ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </main>

      {/* --- MODAL CADASTRO / EDIÇÃO DE PARCEIROS --- */}
      {showPartnerModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-slate-100 shadow-xl max-w-lg w-full overflow-hidden">
            <div className="border-b border-slate-100 px-6 py-4 flex justify-between items-center bg-slate-50">
              <h2 className="text-base font-semibold text-slate-800">
                {editingPartner ? 'Editar informações do parceiro' : 'Cadastrar novo parceiro na liga'}
              </h2>
              <button 
                onClick={() => setShowPartnerModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePartner} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nome completo do parceiro</label>
                <input 
                  type="text" 
                  required
                  value={formDataName} 
                  onChange={(e) => setFormDataName(e.target.value)}
                  placeholder="Nome do profissional, professor ou instituição"
                  className="w-full text-sm px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Instagram</label>
                  <input 
                    type="text" 
                    value={formDataInsta} 
                    onChange={(e) => setFormDataInsta(e.target.value)}
                    placeholder="@parceiro"
                    className="w-full text-sm px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Telefone de contato</label>
                  <input 
                    type="text" 
                    value={formDataPhone} 
                    onChange={(e) => setFormDataPhone(e.target.value)}
                    placeholder="(00) 00000-0000"
                    className="w-full text-sm px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">E-mail</label>
                <input 
                  type="email" 
                  value={formDataEmail} 
                  onChange={(e) => setFormDataEmail(e.target.value)}
                  placeholder="parceiro@exemplo.com"
                  className="w-full text-sm px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Especialidades (separe por vírgula)
                </label>
                <input 
                  type="text" 
                  value={formDataSpecialties} 
                  onChange={(e) => setFormDataSpecialties(e.target.value)}
                  placeholder="Ex: Neurologia, Cardiologia, Metodologia Científica"
                  className="w-full text-sm px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 bg-white"
                />
                <span className="text-[10px] text-slate-600 mt-1 block">
                  As especialidades ajudam nos filtros e na categorização dos perfis.
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
                <button 
                  type="button" 
                  onClick={() => setShowPartnerModal(false)}
                  className="px-4 py-2.5 text-sm font-semibold bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                >
                  Salvar parceiro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}