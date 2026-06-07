import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Mail, 
  User, 
  Shield, 
  Calendar, 
  X, 
  Check,
  AlertCircle,
  Database,
  Wifi,
  WifiOff,
  Loader2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import  storage  from "@/src/utilies/storage";



interface Collaborator {
  id: string;
  email: string;
  role: string | null;
  created_at: string | null;
  user_id: string | null;
  role_id: string | null;
  name: string | null;
}

const AVAILABLE_ROLES = [
    { id: "e1b2c3d4-0000-0000-0000-000000000001", name: "Administrador" },
    { id: "e1b2c3d4-0000-0000-0000-000000000002", name: "Colaborador" },
    { id: "e1b2c3d4-0000-0000-0000-000000000003", name: "Gerente" },
    { id: "e1b2c3d4-0000-0000-0000-000000000004", name: "Suporte" }
];

export default function App() {
  // Estados para as credenciais do Supabase
  const [isConfigured] = useState(true);


  // Estados dos dados e interface
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  
  // Estado para controlo do formulário (Criar / Editar)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role_id: "",
    role: "Colaborador"
  });


  // Função para carregar dados do Supabase
  const fetchCollaborators = async () => {
    if (!supabase) return;
    setIsLoading(true);
    setErrorMsg("");
    
    try {
        const collab = await storage.getCollaborator()
        const { data, error } = await supabase
        .from('collaborators')
        .select('*')
        .eq('user_id', collab?.user_id)
        .not('role', 'eq', 'Owner')
        .order('created_at', { ascending: false });

        if (error) throw error;
        setCollaborators(data || []);
    } catch (err: any) {
      setErrorMsg(`Erro ao carregar colaboradores: ${err.message || err}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar dados assim que estiver configurado e o SDK estiver pronto
  useEffect(() => {
    if (supabase) {
      fetchCollaborators();
    }
  }, [isConfigured]);


  // Filtragem dos colaboradores para a barra de pesquisa
  const filteredCollaborators = collaborators.filter(item => 
    (item.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
    item.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.role?.toLowerCase().includes(searchQuery.toLowerCase()) || false)
  );

  // Abrir modal para Novo Cadastro
  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      name: "",
      email: "",
      role_id: AVAILABLE_ROLES[1].id, // Padrão: Colaborador
      role: "Colaborador"
    });
    setErrorMsg("");
    setIsModalOpen(true);
  };

  // Abrir modal para Edição
  const handleOpenEdit = (colab: Collaborator) => {
    setEditingId(colab.id);
    setFormData({
      name: colab.name || "",
      email: colab.email,
      role_id: colab.role_id || AVAILABLE_ROLES[1].id,
      role: colab.role || "Colaborador"
    });
    setErrorMsg("");
    setIsModalOpen(true);
  };

  // Gravar dados (Inserir ou Atualizar no Supabase)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!supabase) {
      setErrorMsg("O cliente do Supabase não está inicializado corretamente.");
      return;
    }

    if (!formData.name.trim() || !formData.email.trim()) {
      setErrorMsg("Por favor, preenche todos os campos obrigatórios.");
      return;
    }

    const selectedRoleName = AVAILABLE_ROLES.find(r => r.id === formData.role_id)?.name || "Colaborador";

    try {
      if (editingId) {
        // Operação de UPDATE
        const { error } = await supabase
          .from('collaborators')
          .update({
            name: formData.name,
            email: formData.email,
            role_id: formData.role_id || null,
            role: selectedRoleName
          })
          .eq('id', editingId);

        if (error) throw error;
        setSuccessMsg("Colaborador atualizado com sucesso!");
      } else {
        // Operação de INSERT
        const { error } = await supabase
          .from('collaborators')
          .insert([
            {
              name: formData.name,
              email: formData.email,
              role_id: formData.role_id || null,
              role: selectedRoleName
            }
          ]);

        if (error) throw error;
        setSuccessMsg("Colaborador registado com sucesso!");
      }

      setIsModalOpen(false);
      fetchCollaborators(); // Atualiza a lista a partir da base de dados
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      setErrorMsg(`Erro na operação: ${err.message || err}`);
    }
  };

  // Eliminar colaborador do Supabase
  const handleDelete = async (id: string) => {
    if (!supabase) return;
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const { error } = await supabase
        .from('collaborators')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setSuccessMsg("Colaborador removido da base de dados.");
      fetchCollaborators();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      setErrorMsg(`Erro ao eliminar: ${err.message || err}`);
    }
  };

  // Formatar data para exibição amigável
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Não disponível";
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 text-slate-800">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Notificações Gerais */}
        {successMsg && (
          <div className="p-3 bg-green-50 border border-green-100 text-green-800 rounded-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in duration-200">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
        
        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-100 text-red-700 rounded-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Header da Página */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-green-800">
              Colaboradores
            </h1>
            <p className="text-sm text-slate-500 font-semibold mt-1">
              Gerencia os acessos, cargos e informações da equipa
            </p>
          </div>

          <button
            onClick={handleOpenCreate}
            disabled={!isConfigured}
            className={`inline-flex items-center justify-center gap-2 font-semibold py-2.5 px-4 rounded-xl transition-all duration-200 shadow-sm self-start sm:self-auto text-sm ${
              isConfigured
                ? 'bg-green-800 hover:bg-green-900 text-white cursor-pointer' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Plus className="w-4 h-4" />
            Adicionar colaborador
          </button>
        </header>

        {/* Filtros e Busca */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
          <div className="relative w-full md:flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search className="w-5 h-5" />
            </span>
            <input
              type="text"
              placeholder="Pesquisar por nome, e-mail ou cargo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-800 focus:border-transparent text-sm transition-all"
              disabled={!isConfigured}
            />
          </div>
          <div className="text-xs text-slate-400 font-semibold self-end md:self-center">
            {isConfigured ? (
              <>A mostrar {filteredCollaborators.length} de {collaborators.length} resultados</>
            ) : (
              <>Configuração pendente</>
            )}
          </div>
        </div>

        {/* Listagem / Tabela */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {!isConfigured ? (
            <div className="text-center py-16 px-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 mx-auto mb-3">
                <Database className="w-6 h-6" />
              </div>
              <p className="text-slate-700 font-semibold">Ligação Necessária</p>
              <p className="text-xs text-slate-400 font-semibold mt-1 max-w-sm mx-auto">
                Configura o URL e a Chave do teu Supabase no painel superior para carregar a tabela de colaboradores.
              </p>
            </div>
          ) : isLoading ? (
            <div className="text-center py-16 px-4">
              <Loader2 className="w-8 h-8 text-green-800 animate-spin mx-auto mb-3" />
              <p className="text-slate-500 font-semibold">A carregar colaboradores...</p>
            </div>
          ) : filteredCollaborators.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-xs font-semibold text-green-800 tracking-wider">
                      Nome / Identificação
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-green-800 tracking-wider">
                      E-mail
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-green-800 tracking-wider">
                      Cargo / Role
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-green-800 tracking-wider">
                      Data de Registo
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-green-800 tracking-wider text-right">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCollaborators.map((colab) => (
                    <tr key={colab.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Nome */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-800 font-semibold text-lg">
                            {colab.name ? colab.name.charAt(0) : "C"}
                          </div>
                          <div>
                            <div className="font-semibold text-sm text-slate-900">
                              {colab.name || "Sem nome registado"}
                            </div>
                            <div className="text-xs text-slate-400 font-semibold">
                              id: {colab.id.substring(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* E-mail */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-slate-600 font-semibold">
                          <Mail className="w-4 h-4 text-slate-400" />
                          {colab.email}
                        </div>
                      </td>

                      {/* Cargo (Role) */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-green-50 text-green-800 border border-green-100">
                          <Shield className="w-3.5 h-3.5" />
                          {colab.role || "Colaborador"}
                        </span>
                      </td>

                      {/* Data de Criação */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-semibold">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          {formatDate(colab.created_at)}
                        </div>
                      </td>

                      {/* Ações */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(colab)}
                            className="p-2 text-slate-500 hover:text-green-800 hover:bg-slate-100 rounded-xl transition-colors"
                            title="Editar colaborador"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(colab.id)}
                            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                            title="Remover colaborador"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 px-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
                <Search className="w-6 h-6" />
              </div>
              <p className="text-slate-500 font-semibold">Nenhum colaborador encontrado</p>
              <p className="text-xs text-slate-400 font-semibold mt-1">Tenta ajustar os termos de pesquisa ou adiciona um novo colaborador.</p>
            </div>
          )}
        </div>

        {/* Modal de Formulário (Criar e Editar) */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-155">
              
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="text-base font-bold text-green-800">
                  {editingId ? "Editar Colaborador" : "Adicionar Colaborador"}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 hover:bg-slate-200 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSave} className="p-6 space-y-4">
                
                {/* Mensagem de Erro do Modal */}
                {errorMsg && (
                  <div className="p-3 bg-red-50 border border-red-100 text-red-700 rounded-xl flex items-start gap-2 text-xs font-semibold">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Input Nome */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 block">
                    Nome completo *
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="Ex: Carlos Eduardo"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-800 focus:border-transparent text-sm transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Input E-mail */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 block">
                    Endereço de e-mail *
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="email"
                      placeholder="Ex: carlos@empresa.com"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-800 focus:border-transparent text-sm transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Seleção de Role (Vinculado a role_id) */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 block">
                    Cargo atribuído
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <Shield className="w-4 h-4" />
                    </span>
                    <select
                      value={formData.role_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, role_id: e.target.value }))}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-800 focus:border-transparent text-sm transition-all appearance-none bg-slate-50"
                    >
                      {AVAILABLE_ROLES.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 hover:bg-slate-100 text-slate-500 font-semibold rounded-xl text-xs transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 bg-green-800 hover:bg-green-900 text-white font-semibold px-4 py-2 rounded-xl text-xs transition-colors duration-200"
                  >
                    <Check className="w-4 h-4" />
                    Gravar alterações
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}