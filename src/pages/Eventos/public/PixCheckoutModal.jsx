import React, { useEffect, useMemo, useState } from "react";
import { X, Copy, CheckCircle2, QrCode, Mail, MessageCircle } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import  storage  from "@/src/utilies/storage";
import { supabase } from "@/src/lib/supabase";

import ContactFormValidated from "./ContactFormValidated";
import EventRegistrationForm from "./EventRegistrationForm";
import Loading from "@/src/components/ui/Loading"

export default function PixCheckoutModal({
  onClose,
  ticketType, // "presencial" | "online"
  amount, // number
  pixKey, // string (chave pix copia e cola)
  pixQrImage, // string (url/base64 opcional)
  onConfirmPaid, // callback
  user,
  cursos,
  selectedEvent
}) {

    const navigate = useNavigate()
    const {id, type} = useParams()
    const [event, setEvent] = useState({})
    const [formData, setFormData] = useState([])
    const [dataCursos, setDataCursos] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
    const run = async () => {
        const ev = await storage.getEventById(id);
      
        const {data: cursosSelect} = await supabase
        .from('curses_event') 
        .select('*')
        .in('id', cursos?.map(c => c.id))

        setDataCursos(cursosSelect)
        

        setEvent(ev || null);
        setLoading(false)
    };

    run();
    }, [id]);


  const title = event?.title || "Evento";
  const isPresencial = type === "presencial";
  const isCombo = type === 'combo'
  const typeLabel = isPresencial ? "Ingresso Presencial" : isCombo ? "Combo presencial & online" : "Ingresso Online";


 


  
  useEffect(()=> {
    const hasForm =  event.fields && event.fields.length
    setFormDataOK(!hasForm? true : false)
  },[event])

  const [data, setData] = useState({})
  const [formDataOK, setFormDataOK] = useState(false)
    
  

  const handleSubmitForm = () => {
    setFormDataOK(true)
  }

  const selectedCount = useMemo(() => {
      let count = 0;

      // cursos
      if (cursos?.length) {
        count += cursos.length;
      }

      // presencial simples
      if (selectedEvent.presencial && !event.curses) {
        count += 1;
      }

      // online
      if (selectedEvent.online) {
        count += 1;
      }

      // combo
      if (selectedEvent.combo) {
        count += 1;
      }

      return count;
    }, [selectedEvent, event]);

    const totalBase = useMemo(() => {
      let total = 0;

      // cursos
      if (selectedEvent.cursos?.length) {
        const cursosSelecionados = dataCursos.filter(c =>
          selectedEvent.cursos.some(sel => sel.id === c.id)
        );

        total += cursosSelecionados.reduce((acc, c) => acc + Number(c.price || 0), 0);
      }

      // presencial simples
      if (selectedEvent.presencial && !event.curses) {
        total += Number(event.price_presencial || 0);
      }

      // online
      if (selectedEvent.online) {
        total += Number(event.price_online || 0);
      }

      // combo
      if (selectedEvent.combo) {
        total += Number(event.price_combo || 0);
      }

      return total;
    }, [selectedEvent, event]);

    const totalWithDiscount = useMemo(() => {
  if (!event?.discount_event?.length) return totalBase;

  let total = totalBase;

  // ordena pelo melhor desconto
  const discounts = [...event.discount_event].sort((a, b) => b.value - a.value);

  for (const discount of discounts) {
    const min = Number(discount.min || 0);

    // ✅ AGORA baseado na quantidade
    if (selectedCount >= min) {
      if (discount.type === "percent") {
        total = total - (total * Number(discount.value) / 100);
      } else {
        total = total - Number(discount.value);
      }

      break; // aplica só o melhor
    }
  }

  return total;
    }, [totalBase, selectedCount, event]);

    const appliedDiscount = useMemo(() => {
      if (!event?.discount_event?.length) return null;

      return [...event.discount_event]
        .sort((a, b) => b.value - a.value)
        .find(d => selectedCount >= d.min);
    }, [selectedCount, event]);

     const priceLabel = useMemo(() => {
      // prioridade: total com desconto se existir
      if (totalWithDiscount > 0) {
        return totalWithDiscount.toFixed(2);
      }

      // fallback
      const value =
        type === "online"
          ? event.price_online
          : isCombo
          ? event.price_combo
          : type === "presencial"
          ? event.price_presencial
          : (event.price_presencial || 0) + (event.price_online || 0);

      return Number(value || 0).toFixed(2);
    }, [event, type, isCombo, totalWithDiscount]);

    if (loading)
      return (
      <div className="flex min-h-[60vh] items-center justify-center">
          <Loading/>
      </div>
      );

  return (
    <div className="">

      {/* modal */}
      <div className=" flex items-end md:items-center justify-center p-2 lg:p-4 min-w-5xl">
        <div className="min-w-lg overflow-hidden bg-white rounded-2xl shadow-xl border border-slate-200 lg:px-4 px-2">
          {/* header */}
          <div className="p-4  flex items-center space-x-3 border-b border-slate-200">
            <div>
                <CheckCircle2 className="text-blue-500"/>
            </div>
            <div>
              <p className="text-sm lg:text-lg font-bold text-slate-900">Checkout (PIX)</p>
              <p className="text-xs lg:text-md text-slate-500">
                Pagamento rápido e confirmado manualmente
              </p>
            </div>

          </div>

          {/* content */}
          <div className="p-2 lg:p-4 space-y-4">
            {/* resumo */}
            <div className="">
              <p className="text-xs lg:text-md text-slate-500 mb-1">Resumo do pedido</p>
              <p className="text-md font-bold text-slate-900 lg:text-xl">{title}</p>
              {!event?.curses ?
              <div className="mt-3 flex items-center justify-between shadow-lg py-4 px-2 bg-blue-100 border border-slate-200 rounded-md">
                <p className="text-xs font-semibold text-slate-700 lg:text-md">1x {typeLabel}</p>
                <p className="text-sm font-bold text-slate-900 lg:text-md">R$ {priceLabel}</p>
              </div>
              :
              dataCursos?.map(curso=> {
                return (
                  <div className="mt-3 flex items-center justify-between shadow-lg py-4 px-2 bg-blue-100 border border-slate-200 rounded-md">
                    <p className="text-sm font-semibold text-slate-700 lg:text-md truncate max-w-[200px]">{curso?.name}</p>
                    <p className="text-sm font-bold text-slate-900 lg:text-md">R$ {curso.price}</p>
                  </div>
                )
              })
              }
            </div>
            {appliedDiscount ? (
              <p className="text-sm text-right my-2 text-green-600 font-semibold">
                Desconto aplicado: {appliedDiscount.value}%
              </p>
            ) : event?.discount_event?.length > 0 ? (
              <p className="text-sm text-right my-2 text-yellow-600 font-semibold">
                {event.discount_event[0].value}% OFF a partir de {event.discount_event[0].min}+ itens 🎉
              </p>
            ) : null}
             {event?.curses
            &&
            <div className="mt-4 text-right">
              {totalWithDiscount < totalBase && (
                <p className="text-sm text-slate-400 line-through">
                  R$ {totalBase.toFixed(2)}
                </p>
              )}

              <p className="text-xl font-bold text-green-600">
                R$ {totalWithDiscount.toFixed(2)}
              </p>
            </div>}
            
            {data.email ? 
            navigate(`/ticket/${data.registration_id}`):
            !formDataOK ?
            <EventRegistrationForm
            event={event}
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmitForm}
            />
            :
            <ContactFormValidated
            onSubmit={(data) => {
              setData(data)
            }}
            event={event}
            formData={formData}
            price={priceLabel}
            user={user}
            back={()=> {
              setFormDataOK(false)
              setFormData([])
            }}
            cursos={cursos}
            />
            }

            

            {/* aviso */}
            <p className="text-xs text-slate-400 text-center">
              A confirmação do pagamento é instatânea.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
