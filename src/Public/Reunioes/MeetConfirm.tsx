import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Calendar, 
  UserCheck, 
  Database, 
  ShieldAlert,
  Hash,
  Fingerprint,
  Sparkles,
  ArrowRight,
  Settings,
  X
} from 'lucide-react';
import { supabase } from '../../lib/supabase';


export default function App() {

  // Estados do formulário
  const [matricula, setMatricula] = useState('');
  const [codigoReuniao, setCodigoReuniao] = useState('');
  
  // Estados de processamento e feedback
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: 'idle' | 'success' | 'error' | 'warning';
    message: string;
    details?: {
      membroNome?: string;
      reuniaoTitulo?: string;
      dataHora?: string;
    }
  }>({ type: 'idle', message: '' });




  const handleConfirmarPresenca = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!supabase) {
      setStatus({
        type: 'error',
        message: 'Conexão com Supabase não configurada. Clique no ícone de engrenagem no topo para introduzir a sua URL e Anon Key corretas.'
      });
      return;
    }

    if (!matricula.trim() || !codigoReuniao.trim()) {
      setStatus({
        type: 'warning',
        message: 'Por favor, preencha todos os campos obrigatórios.'
      });
      return;
    }

    setIsLoading(true);
    setStatus({ type: 'idle', message: '' });

    try {
      // 1. Validar membro ativo pela matrícula
      const { data: membro, error: erroMembro } = await supabase
        .from('membros')
        .select('id, nome, ativo, matricula')
        .eq('matricula', matricula.trim())
        .maybeSingle();

      if (erroMembro) throw new Error(`Erro ao buscar membro: ${erroMembro.message}`);
      
      if (!membro) {
        setStatus({
          type: 'error',
          message: `Nenhum membro encontrado com a matrícula "${matricula}". Verifique o código digitado.`
        });
        setIsLoading(false);
        return;
      }

      if (membro.ativo !== true) {
        setStatus({
          type: 'error',
          message: `A matrícula ${matricula} pertencente a ${membro.nome} está inativa no sistema. Entre em contacto com a direção.`
        });
        setIsLoading(false);
        return;
      }

      // 2. Validar reunião pelo código inserido
      const { data: reuniao, error: erroReuniao } = await supabase
        .from('meeting_minutes')
        .select('id, title, date, codigo')
        .eq('codigo', codigoReuniao.trim())
        .maybeSingle();

      if (erroReuniao) throw new Error(`Erro ao buscar reunião: ${erroReuniao.message}`);

      if (!reuniao) {
        setStatus({
          type: 'error',
          message: `Código de reunião "${codigoReuniao}" inválido ou não registado.`
        });
        setIsLoading(false);
        return;
      }

      // 3. Verificar se já existe registo de presença para este membro nesta reunião
      const { data: presencaExistente, error: erroPresencaExistente } = await supabase
        .from('meeting_attendees')
        .select('id, status, marked_at')
        .eq('meeting_id', reuniao.id)
        .eq('member_id', membro.id)
        .maybeSingle();

      if (erroPresencaExistente) throw new Error(`Erro ao verificar duplicidade: ${erroPresencaExistente.message}`);

      if (presencaExistente) {
        const dataFormatada = new Date(presencaExistente.marked_at).toLocaleString('pt-PT');
        setStatus({
          type: 'warning',
          message: `Presença já confirmada anteriormente!`,
          details: {
            membroNome: membro.nome,
            reuniaoTitulo: reuniao.title,
            dataHora: dataFormatada
          }
        });
        setIsLoading(false);
        return;
      }

      // 4. Registar presença na tabela meeting_attendees
      const { error: erroInsercao } = await supabase
        .from('meeting_attendees')
        .insert([
          {
            meeting_id: reuniao.id,
            member_id: membro.id,
            status: 'present',
            notes: 'Presença autodeclarada via Portal de Confirmação'
          }
        ]);

      if (erroInsercao) throw new Error(`Erro ao guardar presença: ${erroInsercao.message}`);

      // 5. Sucesso absoluto
      setStatus({
        type: 'success',
        message: 'Presença confirmada com sucesso no diário da reunião!',
        details: {
          membroNome: membro.nome,
          reuniaoTitulo: reuniao.title,
          dataHora: new Date().toLocaleString('pt-PT')
        }
      });
      
      // Limpar campos de entrada apenas em caso de sucesso
      setMatricula('');
      setCodigoReuniao('');

    } catch (error: any) {
      console.error(error);
      setStatus({
        type: 'error',
        message: error.message || 'Ocorreu um erro inesperado ao processar a sua presença. Tente novamente mais tarde.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between font-sans selection:bg-green-100 selection:text-green-900">
      

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-[1.5rem] my-[1rem]">
        <div className="w-full max-w-lg transition-all duration-300">
          

          {/* Form Card Principal */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden relative">
            
            {/* Gradiente Decorativo no Topo */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-green-500 to-black-500" />
            
            <div className="p-[2rem] space-y-[1.5rem]">
              
              {/* Título e Subtítulo */}
              <div className="text-center space-y-2">
                <h2 className="font-semibold text-[1.5rem] tracking-tight text-slate-900 mt-2">Confirmar a Minha Presença</h2>
                <p className="text-[0.875rem] text-slate-500">
                  Preencha os campos abaixo com as informações válidas do seu registo.
                </p>
              </div>

              {/* Formulário */}
              <form onSubmit={handleConfirmarPresenca} className="space-y-[1.25rem]">
                
                {/* Input Matrícula */}
                <div className="space-y-1.5">
                  <label className="block text-[0.75rem] text-slate-700 font-semibold flex items-center gap-1.5">
                    <Fingerprint className="h-[0.875rem] w-[0.875rem] text-green-500" />
                    A sua Matrícula ou ID de Membro
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={matricula}
                      onChange={(e) => setMatricula(e.target.value)}
                      placeholder="Ex: MEM-2026-0489"
                      disabled={isLoading}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-green-400 focus:bg-white text-slate-900 rounded-2xl pl-[1rem] pr-[1rem] py-[0.875rem] text-[0.875rem] focus:outline-none transition-all placeholder:text-slate-400 font-semibold"
                      required
                    />
                  </div>
                </div>

                {/* Input Código da Reunião */}
                <div className="space-y-1.5">
                  <label className="block text-[0.75rem] text-slate-700 font-semibold flex items-center gap-1.5">
                    <Hash className="h-[0.875rem] w-[0.875rem] text-green-500" />
                    Código Identificador da Reunião
                  </label>
                  <input
                    type="text"
                    value={codigoReuniao}
                    onChange={(e) => setCodigoReuniao(e.target.value)}
                    placeholder="Ex: REU-GER-831"
                    disabled={isLoading}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-green-400 focus:bg-white text-slate-900 rounded-2xl px-[1rem] py-[0.875rem] text-[0.875rem] focus:outline-none transition-all placeholder:text-slate-400 font-semibold"
                    required
                  />
                </div>

                {/* Botão de Envio */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-green-600 hover:bg-green-500 disabled:bg-slate-100 text-white disabled:text-slate-400 font-semibold text-[0.875rem] py-[1rem] px-[1.5rem] rounded-2xl transition-all duration-200 shadow-md shadow-green-600/10 hover:shadow-green-500/20 flex items-center justify-center gap-2 border border-green-500/10 disabled:border-transparent mt-[0.5rem]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-[1.125rem] w-[1.125rem] animate-spin" />
                      A processar presença...
                    </>
                  ) : (
                    <>
                      Marcar Presença
                      <ArrowRight className="h-[1.125rem] w-[1.125rem]" />
                    </>
                  )}
                </button>
              </form>

              {/* Feedbacks dinâmicos */}
              {status.type !== 'idle' && (
                <div className={`p-[1.25rem] rounded-2xl border transition-all duration-300 animate-fade-in ${
                  status.type === 'success' 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                    : status.type === 'warning'
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}>
                  <div className="flex gap-3 items-start">
                    {status.type === 'success' ? (
                      <CheckCircle2 className="h-[1.25rem] w-[1.25rem] text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className={`h-[1.25rem] w-[1.25rem] shrink-0 mt-0.5 ${status.type === 'warning' ? 'text-amber-600' : 'text-rose-600'}`} />
                    )}
                    
                    <div className="space-y-2 flex-1">
                      <p className="font-semibold text-[0.875rem] leading-snug">{status.message}</p>
                      
                      {status.details && (
                        <div className="pt-2 border-t border-slate-100 text-[0.75rem] space-y-1 text-slate-700">
                          <p><strong className="text-slate-500 font-semibold">Membro:</strong> {status.details.membroNome}</p>
                          <p><strong className="text-slate-500 font-semibold">Reunião:</strong> {status.details.reuniaoTitulo}</p>
                          <p><strong className="text-slate-500 font-semibold">Registo feito em:</strong> {status.details.dataHora}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Rodapé Informativo Interno */}
            <div className="bg-slate-50 px-[2rem] py-[1rem] border-t border-slate-100 flex items-center justify-between text-[0.75rem] text-slate-500">
              <span className="flex items-center gap-1.5 font-semibold">
                <Calendar className="h-[0.875rem] w-[0.875rem] text-slate-400" />
                Diário Oficial {new Date().getFullYear()}
              </span>
              <span className="font-semibold text-slate-400">Segurança SSL Ativa</span>
            </div>
          </div>

        </div>
      </main>

      
    </div>
  );
}