import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useParams } from 'react-router-dom';
import QRCode from 'qrcode';


// Interface para tipagem do Membro de acordo com o seu schema
interface Membro {
  id: string;
  nome: string;
  email: string;
  matricula: string;
  ativo: boolean;
  telefone?: string;
  universidade?: string;
  curso?: string;
  user_id:string;
}

// Parâmetros do componente (simulação de rota / link de pagamento)
interface PaymentPortalProps {
  paymentLinkId?: string; // ID do link de pagamento vindo da rota
}

export default function PaymentPortal({ paymentLinkId = "link-pagamento-padrao" }: PaymentPortalProps) {
 
    const {id} = useParams()
 
    // Estados do fluxo de validação do Membro
    const [matricula, setMatricula] = useState('');
    const [loadingMembro, setLoadingMembro] = useState(false);
    const [membro, setMembro] = useState<Membro | null>(null);
    const [erroMembro, setErroMembro] = useState('');

    // Estados do fluxo de pagamento (Pix)
    const [gerandoPix, setGerandoPix] = useState(false);
    const [pixQrCode, setPixQrCode] = useState(''); 
    const [pixCopiaECola, setPixCopiaECola] = useState('');
    const [valorTotal, setValorTotal] = useState(49.90); 
    const [statusPagamento, setStatusPagamento] = useState<'pendente' | 'processando' | 'pago' | 'erro'>('pendente');
    const [paymentId, setPaymentId] = useState<string | null>(null);
    const [mensagemStatus, setMensagemStatus] = useState('');
  
    // Estado para feedback de cópia do código Pix
    const [copiado, setCopiado] = useState(false);

    // Função auxiliar para copiar texto
    const handleCopiarPix = () => {
        if (pixCopiaECola) {
        const textarea = document.createElement('textarea');
        textarea.value = pixCopiaECola;
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            setCopiado(true);
            setTimeout(() => setCopiado(false), 3000);
        } catch (err) {
            console.error('Falha ao copiar o código', err);
        }
        document.body.removeChild(textarea);
        }
    };

    // 1. Verificar se a matrícula existe e está ativa usando a API REST do Supabase
    const verificarMembro = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!matricula.trim()) {
        setErroMembro('Por favor, informe a matrícula.');
        return;
        }

        setLoadingMembro(true);
        setErroMembro('');
        setMembro(null);

        try {
        // Fazendo a requisição diretamente para a API REST do Supabase
        const {data} = await supabase
        .from('membros')
        .select('*')
        .eq('matricula', matricula)
        .single()


        if (!data || Object.keys(data).length === 0) {
            setErroMembro('Membro não encontrado com a matrícula informada.');
            setLoadingMembro(false);
            return;
        }

        console.log(data)
        const membroEncontrado = data as Membro;

        if (!membroEncontrado.ativo) {
            setErroMembro('Este cadastro consta como inativo. Regularize sua situação para prosseguir.');
            setLoadingMembro(false);
            return;
        }

        // Membro validado com sucesso!
        setMembro(membroEncontrado);
        
        // Prossegue gerando o QR Code Pix através do webhook
        await gerarPagamentoPix(membroEncontrado);

        } catch (err) {
        setErroMembro('Ocorreu um erro ao validar sua matrícula. Tente novamente mais tarde.');
        } finally {
        setLoadingMembro(false);
        }
    };
    // 1.1 Verificar Valor de pagamento
    const verificaValor = async() => {
        const {data} = await supabase
        .from('payment_links')
        .select('amount')
        .eq('id', id)
        .single()

        if (data?.amount) {
            setValorTotal(Number(data?.amount))
        }
    }  
    useEffect(()=> {
        verificaValor()
    },[membro])

    // 2. Chamar o Webhook para gerar o Pix (QR Code e Copia e Cola)
    const gerarPagamentoPix = async (membroValido: Membro) => {
        setGerandoPix(true);
        setStatusPagamento('processando');
        
        try {
        const webhookUrl = "https://agenciadeia-n8n.qa3w33.easypanel.host/webhook/a146a5d0-8c6b-4d41-be7e-d7caa4785934";
        
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            },
            body: JSON.stringify({
            membroId: membroValido.id,
            nome: membroValido.nome,
            email: membroValido.email,
            valor: valorTotal,
            referencia: paymentLinkId,
            user_id:membroValido.user_id
            }),
        });

        if (!response.ok) {
            throw new Error('Falha na resposta do webhook');
        }

        const data = await response.json();
        const qrImage = await QRCode.toDataURL(data.pix);

        setPixQrCode(qrImage);
        setPixCopiaECola(data.pix);
        setPaymentId(data.payment_id);
        setStatusPagamento('pendente');

        } catch (err) {
        // Fallback para visualização em desenvolvimento se o webhook de produção não estiver acessível
        console.warn("Erro ao chamar o webhook. Gerando dados de demonstração segura.");

        } finally {
        setGerandoPix(false);
        }
    };



    useEffect(() => {
      if (!paymentId) return;

      const channel = supabase
        .channel(`fatura-${paymentId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'faturas',
            filter: `payment_id=eq.${paymentId}`
          },
          (payload) => {
            const fatura = payload.new;

            if (fatura.status === 'paid') {
              setStatusPagamento('pago');
              setMensagemStatus('Pagamento confirmado!');
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }, [paymentId]);


  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        
        {/* Topo / Header */}
        <div className="bg-emerald-50 p-6 border-b border-emerald-100/50">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 text-white p-2.5 rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-800">Pagamento de mensalidade</h1>
              <p className="text-xs text-slate-500">Acesse e regularize sua conta instantaneamente</p>
            </div>
          </div>
        </div>

        {/* Conteúdo Principal */}
        <div className="p-6">
          
          {/* Passo 1: Inserção de Matrícula */}
          {!membro && (
            <form onSubmit={verificarMembro} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="matricula" className="block text-sm font-semibold text-slate-700">
                  Digite sua matrícula
                </label>
                <input
                  type="text"
                  id="matricula"
                  placeholder="Ex: MAT-2026-987"
                  value={matricula}
                  onChange={(e) => setMatricula(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-slate-600 placeholder:text-slate-400"
                  disabled={loadingMembro}
                />
              </div>

              {erroMembro && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl flex items-start gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>{erroMembro}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loadingMembro}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:bg-slate-300"
              >
                {loadingMembro ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Consultando sistema...</span>
                  </>
                ) : (
                  <span>Avançar para o pagamento</span>
                )}
              </button>
            </form>
          )}

          {/* Passo 2: Exibição do QR Code Pix e Dados do Membro */}
          {membro && statusPagamento !== 'pago' && (
            <div className="space-y-6">
              
              {/* Informações do Membro */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    Cadastro ativo
                  </span>
                  <span className="text-xs text-slate-500">Matrícula: {membro.matricula}</span>
                </div>
                <h3 className="font-semibold text-slate-800">{membro.nome}</h3>
                <p className="text-xs text-slate-600">{membro.email}</p>
                {membro.curso && (
                  <p className="text-xs text-slate-600 mt-1">{membro.curso} - {membro.universidade}</p>
                )}
              </div>

              {/* Área de Processamento do Webhook */}
              {gerandoPix ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-3">
                  <div className="relative flex items-center justify-center">
                    <div className="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-emerald-400 opacity-75"></div>
                    <div className="relative rounded-full h-4 w-4 bg-emerald-600"></div>
                  </div>
                  <p className="text-sm text-slate-600 font-semibold animate-pulse">
                    Gerando pix para pagamento...
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  
                  {/* QR Code Pix */}
                  {pixQrCode && (
                    <div className="flex flex-col items-center justify-center">
                      <div className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm mb-2">
                        <img 
                          src={pixQrCode} 
                          alt="QR Code Pix" 
                          className="w-48 h-48 object-contain"
                        />
                      </div>
                      <span className="text-xs text-slate-600 font-semibold flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse"></span>
                        Aguardando confirmação do pagamento
                      </span>
                    </div>
                  )}

                  {/* Pix Copia e Cola */}
                  {pixCopiaECola && (
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-600">
                        Pix copia e cola
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          readOnly
                          value={pixCopiaECola}
                          className="flex-1 bg-slate-50 border border-slate-200 text-xs text-slate-500 px-3 py-2 rounded-xl focus:outline-none select-all"
                        />
                        <button
                          onClick={handleCopiarPix}
                          className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-xl border border-emerald-200 transition-all active:scale-95"
                        >
                          {copiado ? 'Copiado!' : 'Copiar'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Detalhes do Valor */}
                  <div className="flex justify-between items-center py-3 border-t border-b border-slate-100 text-slate-700">
                    <span className="text-sm font-semibold">Valor da mensalidade</span>
                    <span className="text-lg font-semibold text-slate-800">
                      R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Botão de Cancelar */}
                  <button
                    onClick={() => {
                      setMembro(null);
                      setMatricula('');
                    }}
                    className="w-full text-center text-xs text-slate-600 hover:text-slate-800 transition-all underline"
                  >
                    Usar outra matrícula
                  </button>

                </div>
              )}
            </div>
          )}

          {/* Passo 3: Tela de Sucesso */}
          {statusPagamento === 'pago' && membro && (
            <div className="py-6 flex flex-col items-center justify-center text-center space-y-4">
              <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center animate-bounce">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-800">Pagamento confirmado</h2>
                <p className="text-sm text-slate-600 mt-2">
                  {mensagemStatus || 'Sua mensalidade foi quitada com sucesso.'}
                </p>
              </div>

              <div className="bg-emerald-50 border border-emerald-100/50 p-4 rounded-xl w-full text-left space-y-1.5">
                <p className="text-xs text-slate-600 font-semibold">Comprovante de pagamento</p>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Membro:</span>
                  <span className="font-semibold text-slate-800">{membro.nome}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Matrícula:</span>
                  <span className="font-semibold text-slate-800">{membro.matricula}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Valor pago:</span>
                  <span className="font-semibold text-slate-800">
                    R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Status da fatura:</span>
                  <span className="font-semibold text-emerald-700">Registrada e paga</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setMembro(null);
                  setMatricula('');
                  setStatusPagamento('pendente');
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-xl shadow-sm transition-all"
              >
                Efetuar novo pagamento
              </button>
            </div>
          )}

        </div>

        {/* Rodapé Seguro */}
        <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          <span>Ambiente criptografado e 100% seguro para pagamentos</span>
        </div>

      </div>
    </div>
  );
}