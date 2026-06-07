import React, { useState } from 'react';
import { 
  School, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { supabase } from '../../lib/supabase';


export default function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  
  // Estado para alternar visualmente a aba de recuperação de senha
  const [isRecovering, setIsRecovering] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setMessage('Login efetuado com sucesso! Redirecionando para o Painel Escolar...');
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage('Verifique seu e-mail para confirmar o cadastro e liberar o acesso!');
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro inesperado ao conectar ao servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleRecovery = async () => {
    if (!email) {
      setError('Por favor, insira seu e-mail para a recuperação de senha.');
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.href}/reset-password`,
      });
      if (error) throw error;
      
      await supabase.auth.signOut();
      setMessage('E-mail de recuperação enviado com sucesso!');
      setIsRecovering(false);
    } catch (err: any) {
      setError(err.message || 'Falha ao solicitar recuperação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center lg:justify-end overflow-hidden bg-slate-950 font-sans">
      
      {/* Estilos customizados injetados para suporte perfeito do corte diagonal responsivo */}
      <style>{`
        @media (min-width: 1024px) {
          .diagonal-split {
            clip-path: polygon(15% 0, 100% 0, 100% 100%, 0% 100%);
          }
        }
      `}</style>

      {/* BACKGROUND DA TELA INTEIRA - Foto de arquitetura escolar cobrindo toda a tela */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80&w=1920" 
          alt="Corredor universitário moderno e elegante" 
          className="w-full h-full object-cover filter brightness-[0.3] contrast-[1.05]"
        />
        {/* Camada gradiente escura para destacar os textos à esquerda */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/70 to-transparent pointer-events-none" />
      </div>

      {/* CONTEÚDO DO LADO ESQUERDO (Apenas visível em telas grandes para evitar aperto) */}
      <div className="hidden lg:flex absolute left-12 xl:left-24 top-1/2 -translate-y-1/2 z-10 max-w-lg flex-col space-y-6 text-white select-none">
        <div className="inline-flex items-center gap-2.5 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 w-fit">
          <Sparkles className="w-5 h-5 text-green-400 animate-pulse" />
          <span className="text-sm font-medium tracking-wide">Plataforma Administrativa</span>
        </div>
        
        <h1 className="text-5xl xl:text-6xl font-extrabold tracking-tight leading-none">
          Lidere com <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-300 via-emerald-300 to-sky-300">
            Inteligência e Visão.
          </span>
        </h1>
        
        <p className="text-slate-300 text-lg leading-relaxed max-w-md">
          Centralize dados acadêmicos, acompanhe o desempenho institucional e gerencie a comunicação estratégica em um único ecossistema seguro e ágil.
        </p>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
          <div>
            <p className="text-3xl font-bold text-green-400">100%</p>
            <p className="text-xs text-slate-400 uppercase tracking-wider mt-1">Nuvem Protegida</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-emerald-400">+15k</p>
            <p className="text-xs text-slate-400 uppercase tracking-wider mt-1">Atividades Diárias</p>
          </div>
        </div>
      </div>

      {/* SEÇÃO DIAGONAL BRANCA À DIREITA (Corta a tela no desktop) */}
      <div className="diagonal-split absolute inset-y-0 right-0 w-full lg:w-[50%] xl:w-[44%] bg-white z-20 flex items-center justify-center p-6 sm:p-12 shadow-2xl transition-all duration-500">
        
        {/* CONTAINER DO FORMULÁRIO (Interno e Limpo) */}
        <div className="w-full max-w-md mx-auto flex flex-col">
          
          {/* LOGO & CABEÇALHO */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-14 h-14 bg-gradient-to-tr from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/20 mb-4 ring-4 ring-green-500/10">
              <School className="w-8 h-8 text-white stroke-[1.8]" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
              {isRecovering 
                ? 'Recuperar Acesso' 
                : isLogin ? 'Painel de Direção' : 'Novo Registro de Gestão'
              }
            </h2>
            <p className="text-sm text-slate-500 mt-1.5">
              {isRecovering 
                ? 'Digite seu e-mail institucional cadastrado' 
                : 'CRM de Gestão Escolar Integrada'
              }
            </p>
          </div>

          {/* FEEDBACK DE SUCESSO / ERRO */}
          {message && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
              <p className="font-medium">{message}</p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-800 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
              <p className="font-medium">{error}</p>
            </div>
          )}

          {/* FORMULÁRIO PRINCIPAL */}
          {!isRecovering ? (
            <form onSubmit={handleAuth} className="space-y-5">
              {/* Campo E-mail */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  E-mail Institucional
                </label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-green-500 transition-colors">
                    <Mail className="w-5 h-5" />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="diretor@escola.com"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Campo Senha */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Senha de Acesso
                  </label>
                  {isLogin && (
                    <button
                      type="button"
                      onClick={() => setIsRecovering(true)}
                      className="text-xs text-green-600 hover:text-green-700 font-semibold hover:underline transition-colors focus:outline-none"
                    >
                      Esqueceu a senha?
                    </button>
                  )}
                </div>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-green-500 transition-colors">
                    <Lock className="w-5 h-5" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10 transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* AVISO DE SEGURANÇA (Apenas para Cadastro) */}
              {!isLogin && (
                <div className="flex items-start gap-2 text-xs text-slate-500 leading-relaxed py-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Ao criar a conta, você confirma possuir autorização administrativa da reitoria.</span>
                </div>
              )}

              {/* BOTÃO DE ENTRAR / REGISTRAR */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold py-3.5 px-6 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-md shadow-green-500/10 focus:ring-4 focus:ring-green-500/20 disabled:opacity-50 disabled:pointer-events-none mt-4 text-sm tracking-wide"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {isLogin ? 'Entrar no Painel' : 'Solicitar Cadastro'}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* FORMULÁRIO DE RECUPERAÇÃO DE SENHA */
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  E-mail Corporativo
                </label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-green-500 transition-colors">
                    <Mail className="w-5 h-5" />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="diretor@escola.com"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10 transition-all duration-200"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleRecovery}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3.5 px-6 rounded-xl transition-all duration-300 shadow-md shadow-green-500/10 disabled:opacity-50 disabled:pointer-events-none text-sm tracking-wide"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Enviar Código de Acesso'
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsRecovering(false);
                  setError(null);
                  setMessage(null);
                }}
                className="w-full text-center text-sm text-slate-500 hover:text-slate-800 transition-colors py-2 focus:outline-none font-semibold"
              >
                Voltar ao Início
              </button>
            </div>
          )}

          {/* CHANGER: LOGIN <=> REGISTRO */}
          {!isRecovering && (
            <div className="mt-8 pt-6 border-t border-slate-200 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError(null);
                  setMessage(null);
                }}
                className="text-sm text-slate-500 hover:text-slate-800 transition-colors focus:outline-none"
              >
                {isLogin ? (
                  <span>Ainda sem conta ativa? <strong className="text-green-600 hover:underline">Registre-se aqui</strong></span>
                ) : (
                  <span>Já possui registro de acesso? <strong className="text-green-600 hover:underline">Acesse a conta</strong></span>
                )}
              </button>
            </div>
          )}

          {/* RODAPÉ DO CARD */}
          <div className="mt-8 flex items-center justify-center gap-1.5 text-xs text-slate-400 font-medium">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Gestão Escolar Conectada &copy; 2026</span>
          </div>
          
        </div>
      </div>
    </div>
  );
}