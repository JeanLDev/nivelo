import React, { useEffect, useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Calendar, 
  Mail, 
  Phone, 
  CreditCard, 
  Tag, 
  Clock,
  ExternalLink
} from 'lucide-react';
import { supabase } from '@/src/lib/supabase';

const RegistrationDetailsModal = ({ registration, event, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [cursos, setCursos] = useState([])

  if (!registration) return null;

  const fecthCurses = async() => {
    const {data} = await supabase
    .from('cursos_registrations')
    .select('*, curses_event(*)')
    .eq('registration_id', registration?.id)

    setCursos(data)
  }

  useEffect(()=>{
    fecthCurses()
  },[registration?.id])

  const registrationUrl = `${window.location.origin}/ticket/${registration.id}`;

  const handleCopy = () => {
    // Usando fallback seguro para cópia
    const textArea = document.createElement("textarea");
    textArea.value = registrationUrl;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar', err);
    }
    document.body.removeChild(textArea);
  };

  const isPaid = registration.status === 'paid' || registration.status === 'PAID';

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[999] transition-all">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Detalhes da Inscrição</h2>
            <p className="text-xs text-slate-500 font-medium tracking-tight">ID: {registration.id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

       
        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 cols-span-8">
        
            {/* Status and Primary Info */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Status do Pagamento</span>
                <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold w-fit ${
                isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${isPaid ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                {isPaid ? "Pago" : "Pendente"}
                </div>
            </div>
            <div className="text-right space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Valor Total</span>
                <p className="text-lg font-bold text-slate-900">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(registration.price)}
                </p>
            </div>
            </div>
            {/* Quick Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoItem
                icon={<Mail size={16} />}
                label="E-mail"
                value={registration.email}
            />
            <InfoItem
                icon={<Phone size={16} />}
                label="Telefone"
                value={registration.number}
            />
            <InfoItem
                icon={<Calendar size={16} />}
                label="Data da Inscrição"
                value={new Date(registration.created_at).toLocaleString("pt-BR", { dateStyle: 'short', timeStyle: 'short' })}
            />
            {isPaid && registration.paid_at && (
                <InfoItem
                icon={<Clock size={16} />}
                label="Confirmado em"
                value={new Date(registration.paid_at).toLocaleString("pt-BR", { dateStyle: 'short', timeStyle: 'short' })}
                />
            )}
            <InfoItem
                icon={<CreditCard size={16} />}
                label="Tipo de Ingresso"
                value={registration.type}
            />
            {registration.useCoupon && (
                <InfoItem
                icon={<Tag size={16} />}
                label="Cupom"
                value={registration.coupon}
                />
            )}
            </div>
            {/* Shareable Link */}
            <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider ml-1">Link do Comprovante</label>
            <div className="flex items-center gap-2 p-2 pl-3 rounded-xl bg-white border border-slate-200 group hover:border-blue-300 transition-colors">
                <ExternalLink size={14} className="text-slate-400" />
                <span className="text-sm text-slate-600 truncate flex-1 font-mono">{registrationUrl}</span>
                <button
                onClick={handleCopy}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    copied
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-blue-600 hover:text-white'
                }`}
                >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copiado!' : 'Copiar'}
                </button>
            </div>
            </div>
            {/* Form Answers Section */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/30 p-5 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Respostas do Formulário</h3>
                <div className="h-px bg-slate-200 flex-1 ml-4" />
            </div>
            <div className="divide-y divide-slate-100">
                {(event?.fields || []).length > 0 ? (
                event.fields.map((f) => (
                    <div key={f.id} className="py-3 flex flex-col sm:flex-row sm:items-start justify-between gap-1">
                    <span className="text-sm text-slate-500">{f.label}</span>
                    <span className="text-sm font-semibold text-slate-900 text-left sm:text-right">
                        {String(registration.form_data?.[f.id] ?? "-")}
                    </span>
                    </div>
                ))
                ) : (
                <p className="text-center text-sm text-slate-400 py-4 italic">Nenhum campo adicional preenchido.</p>
                )}
            </div>
            </div>
            {/* Cursos */}
<div className="rounded-2xl border border-slate-100 bg-white p-5 space-y-4">
  <div className="flex items-center justify-between">
    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
      Cursos Selecionados
    </h3>
    <div className="h-px bg-slate-200 flex-1 ml-4" />
  </div>

  <div className="space-y-4">
    {cursos.length > 0 ? (
      cursos.map((c) => (
        <div
          key={c.id}
          className="flex gap-4 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition"
        >
          {/* Foto */}
          <img
            src={c.curses_event?.photo}
            alt={c.curses_event?.name}
            className="w-20 h-20 object-cover rounded-lg border"
          />

          {/* Info */}
          <div className="flex flex-col justify-between flex-1">
            <div>
              <h4 className="text-sm font-semibold text-slate-900">
                {c.curses_event?.name}
              </h4>

              <p className="text-xs text-slate-500 line-clamp-2">
                {c.curses_event?.descricao}
              </p>
            </div>

            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-slate-500">
                {new Date(c.curses_event?.inicio).toLocaleString("pt-BR", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </span>

              <span className="text-sm font-bold text-slate-900">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(c.curses_event?.price || 0)}
              </span>
            </div>
          </div>
        </div>
      ))
    ) : (
      <p className="text-sm text-slate-400 text-center italic">
        Nenhum curso selecionado.
      </p>
    )}
  </div>
</div>
        </div>
        

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-8 py-2.5 rounded-xl bg-slate-900 text-sm font-bold text-white hover:bg-slate-800 active:scale-95 transition-all shadow-lg shadow-slate-200"
          >
            Concluído
          </button>
        </div>
      </div>
    </div>
  );
};

// Sub-componente para os itens de informação
const InfoItem = ({ icon, label, value }) => (
  <div className="flex items-start gap-3 p-1">
    <div className="mt-0.5 text-slate-400">
      {icon}
    </div>
    <div className="flex flex-col">
      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wide">{label}</span>
      <span className="text-sm font-medium text-slate-700 leading-tight">{value || '-'}</span>
    </div>
  </div>
);

export default RegistrationDetailsModal;