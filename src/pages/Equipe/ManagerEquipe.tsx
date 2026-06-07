import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Settings, 
  UserPlus, 
  Search, 
  Mail, 
  Phone, 
  GraduationCap, 
  Calendar, 
  X, 
  Check, 
  AlertCircle, 
  Database,
  Info,
  Sliders,
  Sparkles
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

// --- Interfaces de Tipagem ---
interface DefinicaoCampo {
  id: string;
  nome_campo: string;
  label: string;
  tipo_campo: 'text' | 'number' | 'date' | 'boolean';
  obrigatorio: boolean;
}

interface Membro {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  universidade: string;
  curso: string;
  data_ingresso: string;
  campos_personalizados: Record<string, any>;
}


export default function ManagerEquipe() {
  // Configurações de Conexão com Supabase
  const [isDemoMode] = useState(false);

  // Estados dos Dados
  const [membros, setMembros] = useState<Membro[]>();
  const [definicoesCampos, setDefinicoesCampos] = useState<DefinicaoCampo[]>();
  const [busca, setBusca] = useState('');
  
  // Estados de UI/Modais
  const [carregando, setCarregando] = useState(false);
  const [notificacao, setNotificacao] = useState<{ tipo: 'sucesso' | 'erro', mensagem: string } | null>(null);
  const [modalMembroAberto, setModalMembroAberto] = useState(false);
  const [modalCamposAberto, setModalCamposAberto] = useState(false);
  
  // Estados de Formulários
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [membroForm, setMembroForm] = useState({
    nome: '',
    email: '',
    telefone: '',
    universidade: '',
    curso: '',
    data_ingresso: new Date().toISOString().split('T')[0],
  });
  const [customFormValues, setCustomFormValues] = useState<Record<string, any>>({});

  // Formulário para novo campo personalizado
  const [novoCampoForm, setNovoCampoForm] = useState({
    label: '',
    tipo_campo: 'text' as 'text' | 'number' | 'date' | 'boolean',
    obrigatorio: false
  });

  // Carregar dados iniciais do Supabase ou LocalStorage
  useEffect(() => {
    carregarDados();
  }, [supabase, isDemoMode]);

  const carregarDados = async () => {
    setCarregando(true);
    if (isDemoMode || !supabase) {
      // No modo demo, tenta carregar do localStorage ou usa o mock inicial
      const localMembros = localStorage.getItem('equipe_membros');
      const localCampos = localStorage.getItem('equipe_campos');
      if (localMembros) setMembros(JSON.parse(localMembros));
      if (localCampos) setDefinicoesCampos(JSON.parse(localCampos));
      setCarregando(false);
      return;
    }

    try {
      // 1. Carregar definições de campos
      const { data: camposData, error: camposError } = await supabase
        .from('definicoes_campos')
        .select('*')
        .order('criado_em', { ascending: true });

      if (camposError) throw camposError;
      setDefinicoesCampos(camposData || []);

      // 2. Carregar membros
      const { data: membrosData, error: membrosError } = await supabase
        .from('membros')
        .select('*')
        .order('nome', { ascending: true });

      if (membrosError) throw membrosError;
      setMembros(membrosData || []);

    } catch (error: any) {
      mostrarNotificacao('erro', `Erro ao carregar dados do banco: ${error.message}`);
    } finally {
      setCarregando(false);
    }
  };

  // --- Função auxiliar para notificações ---
  const mostrarNotificacao = (tipo: 'sucesso' | 'erro', mensagem: string) => {
    setNotificacao({ tipo, mensagem });
    setTimeout(() => {
      setNotificacao(null);
    }, 4000);
  };

  // --- Salvamento de Dados (Local ou Supabase) ---
  const salvarMembro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!membroForm.nome || !membroForm.email) {
      mostrarNotificacao('erro', 'Nome e E-mail são obrigatórios.');
      return;
    }

    setCarregando(true);

    const dadosMembro = {
      nome: membroForm.nome,
      email: membroForm.email,
      telefone: membroForm.telefone,
      universidade: membroForm.universidade,
      curso: membroForm.curso,
      data_ingresso: membroForm.data_ingresso,
      campos_personalizados: customFormValues
    };

    if (isDemoMode || !supabase) {
      // Modo de Demonstração
      let novosMembros = [...membros];
      if (editandoId) {
        novosMembros = novosMembros?.map(m => m.id === editandoId ? { ...m, ...dadosMembro } : m);
        mostrarNotificacao('sucesso', 'Cadastro do membro atualizado (Modo Demo)');
      } else {
        const novoMembro: Membro = {
          id: Math.random().toString(36).substr(2, 9),
          ...dadosMembro
        };
        novosMembros.push(novoMembro);
        mostrarNotificacao('sucesso', 'Novo membro adicionado (Modo Demo)');
      }
      setMembros(novosMembros);
      localStorage.setItem('equipe_membros', JSON.stringify(novosMembros));
      fecharModalMembro();
      setCarregando(false);
    } else {
      // Conectado ao Supabase
      try {
        if (editandoId) {
          const { error } = await supabase
            .from('membros')
            .update(dadosMembro)
            .eq('id', editandoId);
          if (error) throw error;
          mostrarNotificacao('sucesso', 'Cadastro de membro atualizado!');
        } else {
          const { error } = await supabase
            .from('membros')
            .insert([dadosMembro]);
          if (error) throw error;
          mostrarNotificacao('sucesso', 'Membro cadastrado com sucesso!');
        }
        await carregarDados();
        fecharModalMembro();
      } catch (err: any) {
        mostrarNotificacao('erro', `Erro ao salvar membro: ${err.message}`);
      } finally {
        setCarregando(false);
      }
    }
  };

  const deletarMembro = async (id: string) => {
    if (!confirm('Tem certeza de que deseja remover este membro da equipe?')) return;
    setCarregando(true);

    if (isDemoMode || !supabase) {
      const novosMembros = membros.filter(m => m.id !== id);
      setMembros(novosMembros);
      localStorage.setItem('equipe_membros', JSON.stringify(novosMembros));
      mostrarNotificacao('sucesso', 'Membro removido (Modo Demo)');
      setCarregando(false);
    } else {
      try {
        const { error } = await supabase
          .from('membros')
          .delete()
          .eq('id', id);
        if (error) throw error;
        mostrarNotificacao('sucesso', 'Membro excluído do banco de dados.');
        await carregarDados();
      } catch (err: any) {
        mostrarNotificacao('erro', `Erro ao deletar: ${err.message}`);
      } finally {
        setCarregando(false);
      }
    }
  };

  // --- CRUD de Campos Personalizados ---
  const adicionarCampoPersonalizado = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoCampoForm.label.trim()) {
      mostrarNotificacao('erro', 'Defina um rótulo (label) para o campo.');
      return;
    }

    // Criar um nome de coluna seguro com base no rótulo
    const nomeCampoFormatado = novoCampoForm.label
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove acentos
      .replace(/[^a-z0-9]/g, '_')     // substitui não alfanuméricos por underline
      .replace(/^_+|_+$/g, '');       // apara underlines nas pontas

    if (definicoesCampos.some(c => c.nome_campo === nomeCampoFormatado)) {
      mostrarNotificacao('erro', 'Já existe um campo com nome/rótulo similar.');
      return;
    }

    setCarregando(true);

    const novoCampo = {
      nome_campo: nomeCampoFormatado,
      label: novoCampoForm.label,
      tipo_campo: novoCampoForm.tipo_campo,
      obrigatorio: novoCampoForm.obrigatorio
    };

    if (isDemoMode || !supabase) {
      const novosCampos = [
        ...definicoesCampos,
        { id: Math.random().toString(36).substr(2, 9), ...novoCampo }
      ];
      setDefinicoesCampos(novosCampos);
      localStorage.setItem('equipe_campos', JSON.stringify(novosCampos));
      mostrarNotificacao('sucesso', 'Novo campo personalizado adicionado (Modo Demo)');
      setNovoCampoForm({ label: '', tipo_campo: 'text', obrigatorio: false });
      setCarregando(false);
    } else {
      try {
        const { error } = await supabase
          .from('definicoes_campos')
          .insert([novoCampo]);
        if (error) throw error;
        mostrarNotificacao('sucesso', 'Campo personalizado criado com sucesso!');
        setNovoCampoForm({ label: '', tipo_campo: 'text', obrigatorio: false });
        await carregarDados();
      } catch (err: any) {
        mostrarNotificacao('erro', `Erro ao criar campo: ${err.message}`);
      } finally {
        setCarregando(false);
      }
    }
  };

  const deletarCampoPersonalizado = async (id: string, nomeCampo: string) => {
    if (!confirm(`Excluir o campo personalizado também ocultará esses dados dos cadastros já existentes. Deseja continuar?`)) return;
    setCarregando(true);

    if (isDemoMode || !supabase) {
      const novosCampos = definicoesCampos?.filter(c => c.id !== id);
      setDefinicoesCampos(novosCampos);
      localStorage.setItem('equipe_campos', JSON.stringify(novosCampos));
      mostrarNotificacao('sucesso', 'Campo removido (Modo Demo)');
      setCarregando(false);
    } else {
      try {
        const { error } = await supabase
          .from('definicoes_campos')
          .delete()
          .eq('id', id);
        if (error) throw error;
        mostrarNotificacao('sucesso', 'Campo personalizado excluído do Supabase.');
        await carregarDados();
      } catch (err: any) {
        mostrarNotificacao('erro', `Erro ao excluir campo: ${err.message}`);
      } finally {
        setCarregando(false);
      }
    }
  };

  // --- Gerenciamento de Abertura de Modais ---
  const abrirModalMembro = (membro: Membro | null = null) => {
    if (membro) {
      setEditandoId(membro.id);
      setMembroForm({
        nome: membro.nome,
        email: membro.email,
        telefone: membro.telefone || '',
        universidade: membro.universidade || '',
        curso: membro.curso || '',
        data_ingresso: membro.data_ingresso || '',
      });
      setCustomFormValues(membro.campos_personalizados || {});
    } else {
      setEditandoId(null);
      setMembroForm({
        nome: '',
        email: '',
        telefone: '',
        universidade: '',
        curso: '',
        data_ingresso: new Date().toISOString().split('T')[0],
      });
      // Inicializar campos dinâmicos em branco
      const initialCustoms: Record<string, any> = {};
      definicoesCampos.forEach(c => {
        initialCustoms[c.nome_campo] = c.tipo_campo === 'boolean' ? false : '';
      });
      setCustomFormValues(initialCustoms);
    }
    setModalMembroAberto(true);
  };

  const fecharModalMembro = () => {
    setModalMembroAberto(false);
    setEditandoId(null);
  };

  const handleCustomFieldChange = (nome: string, valor: any) => {
    setCustomFormValues(prev => ({
      ...prev,
      [nome]: valor
    }));
  };

  // --- Filtro de Busca ---
  const membrosFiltrados = membros?.filter(m => {
    const termo = busca.toLowerCase();
    return (
      m.nome.toLowerCase().includes(termo) ||
      m.email.toLowerCase().includes(termo) ||
      (m.curso && m.curso.toLowerCase().includes(termo)) ||
      (m.universidade && m.universidade.toLowerCase().includes(termo))
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
     
      {/* Notificação Flutuante */}
      {notificacao && (
        <div className={`fixed bottom-4 right-4 z-50 p-4 rounded-2xl shadow-lg flex items-center gap-3 animate-slideIn ${
          notificacao.tipo === 'sucesso' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
        }`}>
          {notificacao.tipo === 'sucesso' ? <Check size={18} /> : <AlertCircle size={18} />}
          <span className="text-sm font-medium">{notificacao.mensagem}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Cabeçalho da Equipe */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight flex items-center gap-2">
              Gerenciamento de Equipe
              <span className="bg-emerald-100 text-emerald-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {membros?.length} {membros?.length === 1 ? 'Membro' : 'Membros'}
              </span>
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Gerencie dados acadêmicos, detalhes de contato e crie campos sob demanda para seu cadastro de equipe.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <button
              onClick={() => setModalCamposAberto(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors w-full sm:w-auto cursor-pointer"
            >
              <Settings size={16} />
              Configurar Campos
            </button>
            <button
              onClick={() => abrirModalMembro()}
              className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-800 rounded-2xl hover:bg-emerald-900 transition-colors w-full sm:w-auto cursor-pointer shadow-sm"
            >
              <UserPlus size={16} />
              Novo Membro
            </button>
          </div>
        </header>

        {/* Barra de Filtro e Busca */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-slate-600" size={18} />
            <input
              type="text"
              placeholder="Buscar por nome, e-mail, universidade ou curso..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:border-transparent"
            />
          </div>
          {busca && (
            <button 
              onClick={() => setBusca('')}
              className="text-xs text-emerald-800 hover:underline px-2 self-center cursor-pointer font-semibold"
            >
              Limpar Busca
            </button>
          )}
        </div>

        {/* Tabela Principal de Membros */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {carregando ? (
            <div className="py-20 flex flex-col justify-center items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-800"></div>
              <p className="text-xs text-slate-600 font-medium">Processando informações...</p>
            </div>
          ) : membrosFiltrados?.length === 0 ? (
            <div className="py-16 text-center">
              <UserPlus className="mx-auto text-slate-300 mb-3" size={48} />
              <p className="text-slate-600 font-medium">Nenhum membro encontrado</p>
              <p className="text-slate-600 text-xs mt-1 max-w-xs mx-auto">
                {busca ? 'Experimente modificar o termo de busca ou' : 'Adicione seu primeiro membro para povoar a equipe!'}
              </p>
              {!busca && (
                <button
                  onClick={() => abrirModalMembro()}
                  className="mt-4 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-2xl text-xs font-semibold"
                >
                  Adicionar Membro
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 text-sm font-semibold  tracking-wider">
                    <th className="py-4 px-6">Membro</th>
                    <th className="py-4 px-6">Acadêmico</th>
                    <th className="py-4 px-6">Ingresso</th>
                    {definicoesCampos?.map(c => (
                      <th key={c.id} className="py-4 px-6 text-slate-600 text-sm font-bold">{c.label}</th>
                    ))}
                    <th className="py-4 px-6 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {membrosFiltrados?.map((membro) => (
                    <tr key={membro.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-900">{membro.nome}</div>
                        <div className="flex flex-col gap-0.5 mt-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1.5"><Mail size={12} /> {membro.email}</span>
                          {membro.telefone && <span className="flex items-center gap-1.5"><Phone size={12} /> {membro.telefone}</span>}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-slate-700 flex items-center gap-1.5 font-medium">
                          <GraduationCap size={14} className="text-slate-600" />
                          {membro.curso || <span className="text-slate-600 text-xs ">Não informado</span>}
                        </div>
                        <div className="text-xs text-slate-600 mt-1 pl-5">{membro.universidade || '-'}</div>
                      </td>
                      <td className="py-4 px-6 text-slate-600 text-xs whitespace-nowrap">
                        <span className="flex items-center gap-1.5">
                          <Calendar size={13} className="text-slate-600" />
                          {membro.data_ingresso ? new Date(membro.data_ingresso + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}
                        </span>
                      </td>
                      {/* Renderizar colunas dinâmicas */}
                      {definicoesCampos?.map(c => {
                        const valor = membro.campos_personalizados?.[c.nome_campo];
                        return (
                          <td key={c.id} className="py-4 px-6 text-xs text-slate-600">
                            {c.tipo_campo === 'boolean' ? (
                              <span className={`px-2 py-0.5 rounded-full font-semibold ${valor ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                                {valor ? 'Sim' : 'Não'}
                              </span>
                            ) : valor !== undefined && valor !== '' ? (
                              String(valor)
                            ) : (
                              <span className="text-slate-300 ">-</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => abrirModalMembro(membro)}
                            className="p-1.5 text-slate-500 hover:text-emerald-800 hover:bg-emerald-50 rounded-2xl transition-colors cursor-pointer"
                            title="Editar Membro"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => deletarMembro(membro.id)}
                            className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-colors cursor-pointer"
                            title="Excluir Membro"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: Adicionar / Editar Membro */}
      {modalMembroAberto && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-scaleIn">
            
            {/* Cabeçalho do Modal */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                {editandoId ? <Edit3 size={20} className="text-emerald-800" /> : <UserPlus size={20} className="text-emerald-800" />}
                {editandoId ? 'Editar Membro da Equipe' : 'Cadastrar Novo Membro'}
              </h2>
              <button onClick={fecharModalMembro} className="text-slate-600 hover:text-slate-600 rounded-full p-1 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            {/* Corpo / Formulário */}
            <form onSubmit={salvarMembro} className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Seção 1: Dados Padrão Obrigatórios */}
              <div>
                <h3 className="text-xs font-semibold uppercase text-emerald-800 tracking-wider mb-3">Informações Principais</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Nome Completo *</label>
                    <input
                      type="text"
                      required
                      value={membroForm.nome}
                      onChange={(e) => setMembroForm({...membroForm, nome: e.target.value})}
                      placeholder="Ex: Clara Mendes"
                      className="w-full px-3 py-2 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">E-mail *</label>
                    <input
                      type="email"
                      required
                      value={membroForm.email}
                      onChange={(e) => setMembroForm({...membroForm, email: e.target.value})}
                      placeholder="clara@mendes.com"
                      className="w-full px-3 py-2 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Telefone</label>
                    <input
                      type="text"
                      value={membroForm.telefone}
                      onChange={(e) => setMembroForm({...membroForm, telefone: e.target.value})}
                      placeholder="(DD) XXXXX-XXXX"
                      className="w-full px-3 py-2 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800"
                    />
                  </div>
                </div>
              </div>

              {/* Seção 2: Dados Acadêmicos */}
              <div>
                <h3 className="text-xs font-semibold uppercase text-emerald-800 tracking-wider mb-3">Acadêmico & Ingresso</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Universidade</label>
                    <input
                      type="text"
                      value={membroForm.universidade}
                      onChange={(e) => setMembroForm({...membroForm, universidade: e.target.value})}
                      placeholder="USP, UFRJ, Unicamp..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Curso</label>
                    <input
                      type="text"
                      value={membroForm.curso}
                      onChange={(e) => setMembroForm({...membroForm, curso: e.target.value})}
                      placeholder="Física, Administração..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Data de Ingressão</label>
                    <input
                      type="date"
                      value={membroForm.data_ingresso}
                      onChange={(e) => setMembroForm({...membroForm, data_ingresso: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800"
                    />
                  </div>
                </div>
              </div>

              {/* Seção 3: Campos Dinâmicos Personalizados */}
              {definicoesCampos?.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-3">
                    <h3 className="text-xs font-semibold uppercase text-slate-600 tracking-wider">Campos Personalizados</h3>
                    <Sparkles size={12} className="text-emerald-800 animate-pulse" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    {definicoesCampos?.map((c) => (
                      <div key={c.id}>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          {c.label} {c.obrigatorio && '*'}
                        </label>
                        {c.tipo_campo === 'boolean' ? (
                          <div className="flex items-center h-9">
                            <input
                              type="checkbox"
                              checked={!!customFormValues[c.nome_campo]}
                              onChange={(e) => handleCustomFieldChange(c.nome_campo, e.target.checked)}
                              className="h-4 w-4 text-emerald-800 border-slate-300 rounded focus:ring-emerald-800"
                            />
                            <span className="ml-2 text-xs text-slate-500">Marcar como verdadeiro</span>
                          </div>
                        ) : (
                          <input
                            type={c.tipo_campo === 'number' ? 'number' : c.tipo_campo === 'date' ? 'date' : 'text'}
                            required={c.obrigatorio}
                            value={customFormValues[c.nome_campo] || ''}
                            onChange={(e) => handleCustomFieldChange(c.nome_campo, e.target.value)}
                            placeholder={`Inserir ${c.label.toLowerCase()}`}
                            className="w-full px-3 py-2 border border-slate-200 rounded-2xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Botões do Rodapé do Modal */}
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={fecharModalMembro}
                  className="px-4 py-2 border border-slate-200 rounded-2xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={carregando}
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-2xl text-sm font-semibold shadow-sm flex items-center gap-2 cursor-pointer transition-colors"
                >
                  {carregando ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Check size={16} />
                  )}
                  {editandoId ? 'Atualizar Membro' : 'Adicionar à Equipe'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL: Configurar Campos Personalizados */}
      {modalCamposAberto && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-scaleIn">
            
            {/* Cabeçalho */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Settings className="text-emerald-800" size={20} />
                Campos Personalizados do Cadastro
              </h2>
              <button 
                onClick={() => setModalCamposAberto(false)} 
                className="text-slate-600 hover:text-slate-600 rounded-full p-1 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              
              {/* Informação contextual */}
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3.5 text-xs text-emerald-800 flex gap-2.5">
                <Info size={16} className="shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Adicione campos que não vêm por padrão no sistema (ex: <b>LinkedIn, Cargo, RG, Semestre</b>). O formulário de cadastro de membros se ajustará instantaneamente para exibir as novas opções.
                </p>
              </div>

              {/* Criar novo Campo */}
              <form onSubmit={adicionarCampoPersonalizado} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4">
                <h3 className="text-xs font-semibold uppercase text-slate-600 tracking-wider">Criar Novo Campo</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Rótulo / Nome de Exibição</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: LinkedIn, Cargo, ID Slack"
                      value={novoCampoForm.label}
                      onChange={(e) => setNovoCampoForm({ ...novoCampoForm, label: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-2xl text-sm bg-white focus:outline-none focus:ring-1 focus:ring-emerald-800"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Tipo de Campo</label>
                      <select
                        value={novoCampoForm.tipo_campo}
                        onChange={(e) => setNovoCampoForm({ ...novoCampoForm, tipo_campo: e.target.value as any })}
                        className="w-full px-2.5 py-2 border border-slate-200 rounded-2xl text-sm bg-white focus:outline-none focus:ring-1 focus:ring-emerald-800"
                      >
                        <option value="text">Texto livre</option>
                        <option value="number">Numérico</option>
                        <option value="date">Data</option>
                        <option value="boolean">Verdadeiro/Falso</option>
                      </select>
                    </div>

                    <div className="flex items-center h-full pt-5">
                      <label className="flex items-center text-xs text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={novoCampoForm.obrigatorio}
                          onChange={(e) => setNovoCampoForm({ ...novoCampoForm, obrigatorio: e.target.checked })}
                          className="h-4 w-4 text-emerald-800 border-slate-300 rounded mr-2 focus:ring-emerald-800"
                        />
                        Campo Obrigatório
                      </label>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={carregando}
                  className="w-full py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-2xl text-xs font-semibold shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Plus size={14} /> Adicionar Campo
                </button>
              </form>

              {/* Lista dos Campos Existentes */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase text-slate-600 tracking-wider">Campos Personalizados Ativos</h3>
                {definicoesCampos?.length === 0 ? (
                  <p className="text-xs text-slate-600 ">Nenhum campo personalizado adicionado até o momento.</p>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
                    {definicoesCampos?.map((c) => (
                      <div key={c.id} className="flex justify-between items-center p-3 hover:bg-slate-50 text-xs">
                        <div>
                          <p className="font-semibold text-slate-800">{c.label}</p>
                          <p className="text-[10px] text-slate-600 mt-0.5">
                            Nome Interno: <code className="bg-slate-100 px-1 py-0.5 rounded">{c.nome_campo}</code> | Tipo: {c.tipo_campo}
                          </p>
                        </div>
                        <button
                          onClick={() => deletarCampoPersonalizado(c.id, c.nome_campo)}
                          className="p-1.5 text-slate-600 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                          title="Excluir Campo"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Rodapé */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setModalCamposAberto(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-2xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Concluir
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}