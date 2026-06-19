import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Copy, 
  Check, 
  Database, 
  ExternalLink, 
  Search, 
  TrendingUp, 
  DollarSign, 
  Layers, 
  Code,
  Settings,
  X,
  AlertCircle,
  Eye,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

// Interface para o Link de Pagamento
interface PaymentLink {
  id: string;
  created_at: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  status: 'active' | 'inactive';
  redirect_url: string;
}


export default function App() {

  // Estados de dados
  const [links, setLinks] = useState<PaymentLink[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Estados de formulário e filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'sql' | 'settings'>('dashboard');
  
  // Dados do formulário para Criar/Editar
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formAmount, setFormAmount] = useState<number | ''>('');
  const [formCurrency, setFormCurrency] = useState('BRL');
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');
  const [formRedirectUrl, setFormRedirectUrl] = useState('');

  // Estados de feedback visual
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [previewLink, setPreviewLink] = useState<PaymentLink | null>(null);


  // Função para carregar links (Do Supabase ou LocalStorage)
  const fetchLinks = async () => {
    setIsLoading(true);

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('payment_links')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setLinks(data || []);
      } catch (err: any) {
        showToast(`Erro ao carregar dados do Supabase: ${err.message}`, 'error');
        // Fallback para LocalStorage se falhar
        loadLocalLinks();
      } finally {
        setIsLoading(false);
      }
    } else {
      loadLocalLinks();
      setIsLoading(false);
    }
  };


  // Carregar dados iniciais e sempre que mudar o modo de conexão
  useEffect(() => {
    fetchLinks();
  }, []);


  // Função para exibir notificações amigáveis
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Copiar link para o clipboard
  const handleCopyLink = (id: string) => {
    const fakeUrl = `${window.location.origin}/pay/${id}`;
    const tempInput = document.createElement('input');
    tempInput.value = fakeUrl;
    document.body.appendChild(tempInput);
    tempInput.select();
    try {
      document.execCommand('copy');
      setCopiedId(id);
      showToast('Link de pagamento copiado com sucesso!');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      showToast('Falha ao copiar o link', 'error');
    }
    document.body.removeChild(tempInput);
  };

  // Salvar Link (Create e Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formTitle.trim()) return showToast('O título é obrigatório', 'error');
    if (!formAmount || formAmount <= 0) return showToast('Insira um valor maior que zero', 'error');
    setIsLoading(true);

    const linkPayload = {
      title: formTitle,
      description: formDescription,
      amount: Number(formAmount),
      currency: formCurrency,
      status: formStatus,
      redirect_url: formRedirectUrl
    };

    if (supabase) {
      try {
        if (editingId) {
          // Atualização real no Supabase
          const { error } = await supabase
            .from('payment_links')
            .update(linkPayload)
            .eq('id', editingId);

          if (error) throw error;
          showToast('Link de pagamento atualizado');
        } else {
          // Criação real no Supabase
          const { error } = await supabase
            .from('payment_links')
            .insert([linkPayload]);

          if (error) throw error;
          showToast('Novo link de pagamento gerado');
        }
        fetchLinks();
        resetForm();
      } catch (err: any) {
        showToast(`Erro na operação do Supabase: ${err.message}`, 'error');
      } finally {
        setIsLoading(false);
      }
    } 
  };

  // Iniciar edição de link
  const startEdit = (link: PaymentLink) => {
    setEditingId(link.id);
    setFormTitle(link.title);
    setFormDescription(link.description);
    setFormAmount(link.amount);
    setFormCurrency(link.currency);
    setFormStatus(link.status);
    setFormRedirectUrl(link.redirect_url);
    setIsFormOpen(true);
  };

  // Deletar link (Delete)
  const handleDelete = async (id: string) => {
    setIsLoading(true);

    if (supabase) {
      try {
        const { error } = await supabase
          .from('payment_links')
          .delete()
          .eq('id', id);

        if (error) throw error;
        showToast('Link de pagamento removido do Supabase.');
        fetchLinks();
        if (previewLink?.id === id) {
          setPreviewLink(null);
        }
      } catch (err: any) {
        showToast(`Erro ao deletar no Supabase: ${err.message}`, 'error');
      } finally {
        setIsLoading(false);
      }
    } else {
      setLinks(prev => prev.filter(link => link.id !== id));
      showToast('Link de pagamento removido localmente.');
      if (previewLink?.id === id) {
        setPreviewLink(null);
      }
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormTitle('');
    setFormDescription('');
    setFormAmount('');
    setFormCurrency('BRL');
    setFormStatus('active');
    setIsFormOpen(false);
  };


  // Filtragem dos links baseada na busca
  const filteredLinks = links.filter(link => 
    link.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    link.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    link.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Cálculos de métricas do Dashboard
  const activeLinksCount = links.filter(l => l.status === 'active').length;
  const totalPotentialVolume = links
    .filter(l => l.status === 'active')
    .reduce((sum, link) => sum + link.amount, 0);


  return (
    <div className="min-h-screen bg-slate-50 text-slate-600 font-sans antialiased">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-md border animate-bounce bg-white border-slate-100 text-slate-600">
          <div className={`w-2 h-2 rounded-full ${notification.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`} />
          <span className="text-sm font-medium">{notification.message}</span>
        </div>
      )}

      {/* Header Principal */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-100 backdrop-blur-md bg-opacity-95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <span className="text-slate-800 font-semibold text-lg block leading-none">Links de Pagamento</span>
                <span className="text-xs text-slate-400">Gerenciador de links de pagamento</span>
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* --- ABA DASHBOARD & MEUS LINKS --- */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            
            {/* Cards de Métricas Rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block mb-1">Links de pagamento ativos</span>
                  <span className="text-slate-800 font-semibold text-2xl">{activeLinksCount}</span>
                </div>
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Layers className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block mb-1">Faturamento ativo potencial</span>
                  <span className="text-slate-800 font-semibold text-2xl">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPotentialVolume)}
                  </span>
                </div>
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block mb-1">Total de links criados</span>
                  <span className="text-slate-800 font-semibold text-2xl">{links.length}</span>
                </div>
                <div className="p-3 bg-slate-50 text-slate-500 rounded-xl">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Filtros e Barra de Ações */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar links por título ou ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 w-full text-sm bg-slate-50 text-slate-600 rounded-xl border border-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:bg-white transition-all"
                />
              </div>

              <button
                onClick={() => {
                  resetForm();
                  setIsFormOpen(true);
                }}
                className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-sm py-2 px-4 rounded-xl transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Criar link de pagamento
              </button>
            </div>

            {/* Listagem de Links e Preview Lateral */}
            <div className="">
              
              {/* Lista Principal */}
              <div className=" space-y-4">
                {isLoading && links.length === 0 ? (
                  <div className="bg-white border border-slate-100 rounded-xl p-12 text-center shadow-sm flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                    <p className="text-slate-400 text-sm">Carregando links de pagamento...</p>
                  </div>
                ) : filteredLinks.length === 0 ? (
                  <div className="bg-white border border-slate-100 rounded-xl p-12 text-center shadow-sm">
                    <p className="text-slate-400 text-sm mb-2">Nenhum link de pagamento encontrado.</p>
                    <button 
                      onClick={() => setIsFormOpen(true)}
                      className="text-emerald-600 text-xs font-semibold hover:underline"
                    >
                      Clique aqui para criar o primeiro
                    </button>
                  </div>
                ) : (
                  filteredLinks.map((link) => (
                    <div 
                      key={link.id} 
                      className={`bg-white border transition-all p-5 rounded-xl shadow-sm hover:shadow-md flex flex-col justify-between gap-4 ${previewLink?.id === link.id ? 'border-emerald-300 ring-1 ring-emerald-300' : 'border-slate-100'}`}
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-800 font-semibold text-base leading-snug">{link.title}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${link.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                              {link.status === 'active' ? 'Ativo' : 'Inativo'}
                            </span>
                          </div>
                          <p className="text-slate-400 text-xs line-clamp-2 max-w-xl">{link.description || 'Sem descrição disponível.'}</p>
                        </div>
                        
                        <div className="text-right">
                          <span className="text-slate-400 text-xs block">Valor do link</span>
                          <span className="text-slate-700 font-semibold text-lg block">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: link.currency }).format(link.amount)}
                          </span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-50 flex flex-wrap justify-between items-center gap-3">
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1 text-xs">
                          <span className="text-slate-400 font-mono text-xs">{link.id}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                        
                          
                          <button
                            onClick={() => startEdit(link)}
                            title="Editar link"
                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50/50 rounded-xl transition-all"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleCopyLink(link.id)}
                            title="Copiar URL de pagamento"
                            className={`p-2 rounded-xl transition-all border flex items-center gap-1.5 text-xs font-medium ${copiedId === link.id ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-white hover:bg-slate-50 text-slate-500 border-slate-200'}`}
                          >
                            {copiedId === link.id ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                Copiado!
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                Copiar link
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => handleDelete(link.id)}
                            title="Remover link de pagamento"
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50/50 rounded-xl transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>

          </div>
        )}

      </main>

      {/* --- FORM MODAL: CRIAR / EDITAR LINK --- */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 rounded-xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
              <h3 className="text-slate-800 font-semibold text-base">
                {editingId ? 'Editar link de pagamento' : 'Novo link de pagamento'}
              </h3>
              <button 
                onClick={resetForm}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              <div className="space-y-1.5">
                <label className="text-xs text-slate-500 font-semibold block">Título da cobrança *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Consultoria de UX Design"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-4 py-2 text-sm bg-slate-50 text-slate-600 rounded-xl border border-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:bg-white transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-500 font-semibold block">Descrição (opcional)</label>
                <textarea
                  placeholder="Detalhe os termos do serviço, formato ou entregas..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 text-sm bg-slate-50 text-slate-600 rounded-xl border border-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:bg-white transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-500 font-semibold block">Valor total *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-medium">R$</span>
                    <input
                      type="number"
                      required
                      step="0.01"
                      min="1"
                      placeholder="0,00"
                      value={formAmount}
                      onChange={(e) => setFormAmount(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 text-slate-600 rounded-xl border border-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:bg-white transition-all font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-500 font-semibold block">Moeda</label>
                  <select
                    value={formCurrency}
                    onChange={(e) => setFormCurrency(e.target.value)}
                    className="w-full px-4 py-2 text-sm bg-slate-50 text-slate-600 rounded-xl border border-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:bg-white transition-all"
                  >
                    <option value="BRL">Real (BRL)</option>
                    <option value="USD">Dólar (USD)</option>
                    <option value="EUR">Euro (EUR)</option>
                  </select>
                </div>
              </div>

              <div className=" gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-500 font-semibold block">Status inicial</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as 'active' | 'inactive')}
                    className="w-full px-4 py-2 text-sm bg-slate-50 text-slate-600 rounded-xl border border-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:bg-white transition-all"
                  >
                    <option value="active">Ativo (visível para clientes)</option>
                    <option value="inactive">Inativo (indisponível)</option>
                  </select>
                </div>

                
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-50">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium text-sm py-2 px-4 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-sm py-2 px-4 rounded-xl transition-all shadow-sm"
                >
                  {editingId ? 'Salvar alterações' : 'Gerar link'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}