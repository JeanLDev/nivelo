import React, { useState, useEffect } from 'react';
import { 
  Key, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Settings, 
  ExternalLink, 
  RefreshCw,
  Lock,
  Database
} from 'lucide-react';
import { supabase } from '../../lib/supabase';


interface MercadoPagoCredentials {
  id?: string;
  public_key: string;
  access_token: string;
  client_id: string;
  client_secret: string;
  environment: 'sandbox' | 'production';
  updated_at?: string;
}

export default function MercadoPago() {
  // --- ESTADOS ---
  const [credentials, setCredentials] = useState<MercadoPagoCredentials>({
    public_key: '',
    access_token: '',
    client_id: '',
    client_secret: '',
    environment: 'sandbox'
  });

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Controle de visibilidade de campos confidenciais
  const [showAccessToken, setShowAccessToken] = useState(false);
  const [showClientSecret, setShowClientSecret] = useState(false);


  // --- CARREGAR DADOS INICIAIS ---
  useEffect(() => {
    if (supabase) {
      fetchCredentials();
    }
  }, [supabase]);

  const fetchCredentials = async () => {
    setFetching(true);
    try {
      // Busca a primeira linha de configuração cadastrada
      const { data, error } = await supabase
        .from('mercado_pago_config')
        .select('*')
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Nenhum registro encontrado ainda (fluxo de configuração inicial)
          console.log('Nenhuma credencial configurada ainda.');
        } else {
          throw error;
        }
      }

      if (data) {
        setCredentials({
          id: data.id,
          public_key: data.public_key || '',
          access_token: data.access_token || '',
          client_id: data.client_id || '',
          client_secret: data.client_secret || '',
          environment: data.environment || 'sandbox'
        });
      }
    } catch (err: any) {
      showFeedback('error', 'Erro ao carregar as credenciais salvas no banco de dados.');
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  // --- FEEDBACK AO USUÁRIO ---
  const showFeedback = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => {
      setMessage(null);
    }, 5000);
  };

  // --- MANIPULADORES DE ENTRADA ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // --- SALVAR CREDENCIAIS ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      showFeedback('error', 'O serviço de banco de dados ainda não está pronto.');
      return;
    }
    setLoading(true);
    
    try {
      const payload = {
        public_key: credentials.public_key.trim(),
        access_token: credentials.access_token.trim(),
        client_id: credentials.client_id.trim(),
        client_secret: credentials.client_secret.trim(),
        environment: credentials.environment,
        updated_at: new Date().toISOString()
      };

      let error;

      if (credentials.id) {
        // Atualiza o registro existente
        const { error: updateError } = await supabase
          .from('mercado_pago_config')
          .update(payload)
          .eq('id', credentials.id);
        error = updateError;
      } else {
        // Insere um novo registro de credencial
        const { data, error: insertError } = await supabase
          .from('mercado_pago_config')
          .insert([payload])
          .select();
        
        error = insertError;
        if (data && data[0]) {
          setCredentials(prev => ({ ...prev, id: data[0].id }));
        }
      }

      if (error) throw error;

      showFeedback('success', 'Configurações salvas com sucesso no banco de dados.');
    } catch (err: any) {
      showFeedback('error', 'Ocorreu um erro ao tentar salvar as credenciais.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <div className="mx-auto">
        
        {/* Card Principal */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          
          {/* Cabeçalho do Card */}
          <div className="border-b border-slate-100 p-6 sm:p-8 bg-gradient-to-r from-emerald-50/30 to-transparent">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                <Settings className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-800">Configuração de pagamentos</h1>
                <p className="text-xs text-slate-600 mt-1">
                  Gerencie suas chaves de API e configure a integração segura com o Mercado Pago.
                </p>
              </div>
            </div>
          </div>

          {/* Área de Loading Inicial */}
          {fetching ? (
            <div className="p-12 text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-emerald-500 mx-auto" />
              <p className="text-xs text-slate-600 mt-3">Buscando configurações salvas no banco de dados...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
              
              {/* Notificação flutuante ou estática */}
              {message && (
                <div className={`p-4 rounded-xl flex items-center gap-3 border ${
                  message.type === 'success' 
                    ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                    : 'bg-red-50 border-red-100 text-red-800'
                }`}>
                  {message.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  )}
                  <span className="text-xs font-medium">{message.text}</span>
                </div>
              )}

              {/* Seletor de Ambiente */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ambiente de operação
                  </label>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Escolha se deseja operar em modo de homologação (sandbox) ou em produção real.
                  </p>
                </div>
                <div className="md:col-span-2">
                  <select
                    name="environment"
                    value={credentials.environment}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                  >
                    <option value="sandbox">Sandbox (testes de pagamento)</option>
                    <option value="production">Produção (recebimento real de valores)</option>
                  </select>
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Chaves principais da API */}
              <div className="space-y-5">
                <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <Key className="w-4 h-4 text-emerald-600" />
                  Credenciais de credenciamento
                </h3>

                {/* Public Key */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                  <label className="block text-xs font-semibold text-slate-700">
                    Chave pública (public key)
                  </label>
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      name="public_key"
                      placeholder="Ex: APP_USR-1234..."
                      value={credentials.public_key}
                      onChange={handleInputChange}
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-mono"
                    />
                  </div>
                </div>

                {/* Access Token */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                  <label className="block text-xs font-semibold text-slate-700">
                    Token de acesso (access token)
                  </label>
                  <div className="md:col-span-2 relative">
                    <input
                      type={showAccessToken ? 'text' : 'password'}
                      name="access_token"
                      placeholder="Ex: APP_USR-5678..."
                      value={credentials.access_token}
                      onChange={handleInputChange}
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-12 py-3 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAccessToken(!showAccessToken)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-600 hover:text-emerald-600 rounded-lg transition-colors"
                    >
                      {showAccessToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Credenciais adicionais / Legado */}
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">Chaves da aplicação (opcional)</h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Algumas integrações mais robustas podem necessitar do identificador da aplicação.
                  </p>
                </div>

                {/* Client ID */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                  <label className="block text-xs font-semibold text-slate-700">
                    ID do cliente (client id)
                  </label>
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      name="client_id"
                      placeholder="Digite o client id"
                      value={credentials.client_id}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-mono"
                    />
                  </div>
                </div>

                {/* Client Secret */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                  <label className="block text-xs font-semibold text-slate-700">
                    Chave secreta do cliente (client secret)
                  </label>
                  <div className="md:col-span-2 relative">
                    <input
                      type={showClientSecret ? 'text' : 'password'}
                      name="client_secret"
                      placeholder="Digite o client secret"
                      value={credentials.client_secret}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-12 py-3 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowClientSecret(!showClientSecret)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-600 hover:text-emerald-600 rounded-lg transition-colors"
                    >
                      {showClientSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Informação sobre segurança */}
              <div className="bg-slate-50 rounded-xl p-4 flex items-start gap-3 border border-slate-100">
                <Lock className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-slate-600 leading-relaxed">
                  As suas chaves de API são armazenadas de forma estritamente criptografada ou protegidas pelas diretrizes de segurança interna de banco de dados do Supabase. Nunca compartilhe estas informações publicamente.
                </p>
              </div>

              {/* Botões de Ação */}
              <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <a
                  href="https://www.mercadopago.com.br/developers/panel"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 hover:text-emerald-800 transition-colors self-start sm:self-auto"
                >
                  Pegar minhas chaves no Mercado Pago
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <div className="flex flex-col sm:flex-row gap-3">
                  
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-medium rounded-xl shadow-sm transition-all disabled:opacity-50 inline-flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Salvando dados...
                      </>
                    ) : (
                      'Salvar credenciais'
                    )}
                  </button>
                </div>
              </div>
              
            </form>
          )}

        </div>
        
      </div>
    </div>
  );
}