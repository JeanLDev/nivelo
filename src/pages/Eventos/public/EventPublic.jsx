import { useEffect, useMemo, useState } from "react"
import { useParams,Link } from "react-router-dom"
import {supabase} from "@/src/lib/supabase"
import { ArrowRight, CalendarDays, Contact2, MapPin, Share2, Video } from "lucide-react";
import ShowCursosEvent from "./ShowCursosEvent";
import Loading from "@/src/components/ui/Loading"


function formatDateBR(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = String(dateStr).split("-");
  return `${d}/${m}/${y}`;
}

function formatTime(timeStr) {
  if (!timeStr) return "";
  // se vier "15:00:00" -> "15:00"
  return String(timeStr).slice(0, 5);
}

function TicketSelectCard({ label, subtitle, price, checked, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`w-full bg-white border rounded-md p-3 flex items-center justify-between shadow-lg transition-all text-left ${
        checked
          ? "border-green-400 ring-4 ring-green-50"
          : "border-slate-200 hover:bg-slate-50"
      }`}
    >
      <div>
        <p className="font-bold text-sm text-slate-900">{label}</p>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="font-extrabold text-md text-slate-900">
            R$ {Number(price || 0).toFixed(2)}
          </p>
        </div>

        <div
          className={`w-5 h-5 rounded-full border flex items-center justify-center ${
            checked ? "bg-green-600 border-green-600" : "bg-white border-slate-300"
          }`}
        >
          {checked && <span className="w-2 h-2 rounded-full bg-white" />}
        </div>
      </div>
    </button>
  );
}


const EventPublic= ({ selectedEvent, setselectedEvent }) => {
    const {id} = useParams()
    const [event, setEvent] = useState(null)
    const [reg, setReg] = useState(null)
    const [loading, setLoading] = useState(true)
    const limit = Number(event?.limit || 0);
    const [cursos, setCursos] = useState([])
    const hasTicket = limit > 0 && reg.length >= limit;

    useEffect(()=> {    
        const a = async() => {
        
        const {data: ev, error:errorEv}= await supabase
        .from('eventos')
        .select('*, curses_event(*), discount_event(*)')
        .eq('id', id)
        .single()

        const {data:reg, error:errorReg}=  await supabase
        .from('registrations_events')
        .select('*')
        .eq('event_id', id)
        .eq('status', 'paid')

        const { data: cursosRegs, error: errorCursosReg } = await supabase
        .from('cursos_registrations')
        .select(`
          curso_id,
          registrations_events!inner (
            id,
            status,
            event_id
          )
        `)
        .eq('registrations_events.event_id', id)
        .eq('registrations_events.status', 'paid')

        const courseCountMap = (cursosRegs || []).reduce((acc, item) => {
          const cursoId = item.curso_id;
          if (!cursoId) return acc;

          acc[cursoId] = (acc[cursoId] || 0) + 1;
          return acc;
        }, {});

        const cursosWithStatus = (ev?.curses_event || []).map((curso) => {
          const limit = Number(curso.limit || 0);
          const total = courseCountMap[curso.id] || 0;

          const isFull = limit > 0 && total >= limit;

          return {
            ...curso,
            isFull,
            remaining: limit > 0 ? limit - total : null
          };
        });

        setEvent(ev)
        setReg(reg)
        setCursos(cursosWithStatus)
        setLoading(false)
        }


        a()
    },[])

    const title = event?.title || "Evento sem título";

    const description = event?.description || "";
    const bannerUrl =
      event?.bannerUrl ||
      "https://images.unsplash.com/photo-1522158637959-30385a09e0da?auto=format&fit=crop&w=1400&q=80";
    
    
    const handleShare = async () => {
        const shareData = {
        title: event?.title || "Evento",
        text: event?.description || "Confira este evento",
        url: window.location.href,
        };

        try {
        if (navigator.share) {
            await navigator.share(window.location.href);
        } else {
            await navigator.clipboard.writeText(window.location.href);
            alert("✅ Link copiado!");
        }
        } catch (err) {
        console.log(err);
        }
    };
    
    // ✅ pode continuar se marcou pelo menos 1
    const canContinue = selectedEvent.presencial || selectedEvent.online || selectedEvent.combo;
    
    const selectedCount = useMemo(() => {
      let count = 0;

      // cursos
      if (selectedEvent.cursos?.length) {
        count += selectedEvent.cursos.length;
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
        const cursosSelecionados = event.curses_event.filter(c =>
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

    // ✅ define o tipo final do checkout
    const checkoutType = useMemo(() => {
        if (selectedEvent.presencial && selectedEvent.online) return "hibrido";
        if (selectedEvent.presencial) return "presencial";
        if (selectedEvent.online) return "online";
        if (selectedEvent.combo) return "combo";
        return "presencial";
    }, [selectedEvent]);
    const formatTimestamp = (timestamp) => {
          if (!timestamp) return "-";

          let date;

          // Se já for Date
          if (timestamp instanceof Date) {
            date = timestamp;
          }
          // Se for número (timestamp UNIX em ms ou s)
          else if (typeof timestamp === "number") {
            // Detecta se está em segundos (10 dígitos)
            date = timestamp.toString().length === 10
              ? new Date(timestamp * 1000)
              : new Date(timestamp);
          }
          // Se for string
          else if (typeof timestamp === "string") {
            // Tenta converter direto
            date = new Date(timestamp);

            // Se falhar, tenta converter número dentro da string
            if (isNaN(date.getTime())) {
              const num = Number(timestamp);
              if (!isNaN(num)) {
                date = num.toString().length === 10
                  ? new Date(num * 1000)
                  : new Date(num);
              }
            }
          }

          // Se ainda for inválido
          if (!date || isNaN(date.getTime())) return "Data inválida";

          // Formatação BR
          return date.toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
        }

    if (loading)
        return (
        <div className="flex min-h-[60vh] items-center justify-center">
            <Loading/>
        </div>
        );
    
    if (hasTicket) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
    <div className="w-full max-w-md rounded-md border border-slate-200 bg-white p-6 shadow-sm text-center">
    <p className="text-xs font-black uppercase tracking-wider text-slate-500">
        Evento lotado
    </p>

    <h2 className="text-xl font-extrabold text-slate-900 mt-2">
        Poxa… os ingressos acabaram 😥
    </h2>

    <p className="text-sm text-slate-600 mt-2 leading-relaxed">
        Todas as vagas já foram preenchidas.
        <br />
        Mas fica de olho: se abrirem novas vagas, esse link volta a funcionar.
    </p>

    <div className="mt-5">

        <p className="text-[11px] text-slate-400 mt-3">
        Obrigado por querer participar 💙
        </p>
    </div>
    {/* Rodapé info extra */}
    <div className="text-center text-xs text-slate-400 mt-5">
        <p>Powered by <a href="https://portifoliojeanldev.online" target="_blank" className="text-blue-500 underline tracking-widest">Jeanldev</a></p>
    </div>
    </div>
</div>

    )

    if (event) return (
      <div className="min-h-screen bg-slate-50 relative">
        <div className="absolute top-52 md:top-72 z-50 left-1/2 -translate-x-1/2 w-full px-4 max-w-xl">
          <button
            type="button"
            onClick={handleShare}
            className="w-full bg-white/50 z-50 backdrop-blur border border-white/60 text-slate-900 font-semibold py-2 rounded-2xl flex items-center justify-center gap-2 shadow-xl text-xs md:text-lg"
          >
            <Share2 className="w-5 h-5" />
            COMPARTILHAR
          </button>
        </div>
        {/* BANNER */}
        <div className="relative w-full h-56 md:h-80 overflow-hidden">
          <img
            src={bannerUrl}
            alt="Banner do evento"
            className="w-full h-full object-cover"
          />

          {/* overlay suave */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />

          {/* botão compartilhar */}
        </div>
        

        {/* CONTEÚDO */}
        <div className=" max-w-xl mx-auto px-4 py-6 space-y-6 z-10 pt-12 bg-white border border-slate-200">
          {/* TÍTULO */}
          <div>
            <h1 className="text-lg md:text-3xl md:text-4xl font-bold text-slate-900 leading-tight">
              {title}
            </h1>

          <div className="mt-6 space-y-4">
              {/* PRESENCIAL DATA/HORA */}
              {event.presencial && (
                  <div className="grid grid-cols-[28px_1fr] gap-3 items-start text-slate-700">
                  <CalendarDays className="w-5 h-5 text-slate-500 mt-0.5" />

                  <div>
                      <p className="text-sm font-semibold mb-1">Presencial</p>

                      <div className="flex items-center gap-3">
                      <div className="leading-tight">
                          <p className="text-xs font-bold">{formatDateBR(event.date_inicio_presencial)}</p>
                          {!event?.curses && <p className="text-xs font-bold">{formatTime(event.time_inicio_presencial)}</p>}
                      </div>

                      <span className="text-slate-400">
                          <ArrowRight className="w-4 h-4" />
                      </span>

                       <div className="leading-tight">
                          <p className="text-xs font-bold">{formatDateBR(event.date_fim_presencial)}</p>
                          {!event?.curses && <p className="text-xs font-bold">{formatTime(event.time_fim_presencial)}</p>}
                      </div>
                      </div>
                  </div>
                  </div>
              )}

              {/* ONLINE DATA/HORA */}
              {event.online && (
                  <div className="grid grid-cols-[28px_1fr] gap-3 items-start text-slate-700">
                  <CalendarDays className="w-5 h-5 text-slate-500 mt-0.5" />

                  <div>
                      <p className="text-sm font-semibold mb-1">Online</p>

                      <div className="flex items-center gap-3">
                      <div className="leading-tight">
                          <p className="text-xs font-bold">{formatDateBR(event.date_inicio_online)}</p>
                          <p className="text-xs font-bold">{formatTime(event.time_inicio_online)}</p>
                      </div>

                      <span className="text-slate-400">
                          <ArrowRight className="w-4 h-4" />
                      </span>

                      <div className="leading-tight">
                          <p className="text-xs font-bold">{formatDateBR(event.date_fim_online)}</p>
                          <p className="text-xs font-bold">{formatTime(event.time_fim_online)}</p>
                      </div>
                      </div>
                  </div>
                  </div>
              )}

              {/* LOCAL PRESENCIAL */}
              {event.presencial && (
                  <div className="grid grid-cols-[28px_1fr] gap-3 items-start">
                  <MapPin className="w-5 h-5 text-slate-500 mt-0.5" />

                  <p className="text-sm font-medium text-slate-700 leading-snug">
                      Evento presencial em <br />
                      <span className="text-xs font-bold text-blue-600">
                      {event.adress},{" "}
                      <span className="text-slate-900">
                          {event.city} / {event.state}
                      </span>
                      </span>
                  </p>
                  </div>
              )}

              {/* LOCAL ONLINE */}
              {event.online && (
                  <div className="grid grid-cols-[28px_1fr] gap-3 items-start">
                  <Video className="w-5 h-5 text-slate-500 mt-0.5" />

                  <p className="text-sm font-medium text-slate-700 leading-snug">
                      Evento online em <br />
                      <span className="text-xs font-bold text-blue-600">
                      {event.platform || "Online"}
                      </span>
                  </p>
                  </div>
              )}
              {event.contato && (
                  <div className="grid grid-cols-[28px_1fr] gap-3 items-start text-slate-700">
                    <Contact2 className="w-5 h-5 text-slate-500 mt-0.5" />

                      <div>
                          <p className="text-sm font-semibold mb-1">Contato</p>

                          <div className="flex items-center gap-3">
                          <div className="leading-tight">
                              <p className="text-xs font-bold">{event.contato}</p>
                          </div>
                      </div>
                    </div>
                  </div>
              )}
          </div>


            {/* Botão parcelamento */}
            <div className="mt-5">
              <p
                className="inline-flex items-center gap-2 bg-green-700 text-white font-bold px-2 py-1 rounded-full shadow text-xs"
              >
                Pagamento via pix
              </p>
            </div>

          </div>

          {/* Escolha uma opção */}
          <div className="pt-5">
            <h3 className="text-lg font-bold text-slate-900 mb-3">
              Escolha uma opção
            </h3>

            {/* ✅ seleção */}
            <div className="space-y-3">
              {/* Presencial sem cursos*/}
              {event?.presencial && !event.curses && (
                <TicketSelectCard
                  label="Ingresso Presencial"
                  subtitle={`${formatDateBR(event.date_inicio_presencial)} • ${formatTime(
                    event.time_inicio_presencial
                  )}`}
                  price={Number(event.price_presencial || 0)}
                  checked={selectedEvent.presencial}
                  onToggle={() =>
                    setselectedEvent((prev) => ({ ...prev, presencial: !prev.presencial }))
                  }
                />
              )}
              {/*Presencial com cursos */}
              {event?.presencial && event?.curses && (
                cursos?.map(curso => {
                  const isSelected = selectedEvent.cursos?.some(c => c.id === curso.id);

                  return (
                    <ShowCursosEvent
                      imageUrl={curso.photo}
                      description={curso.descricao}
                      date={curso.inicio}
                      isFull={curso.isFull}
                      end={curso.fim}
                      label={
                        curso.isFull 
                          ? `${curso.name} (Esgotado)` 
                          : curso.name
                      }
                      subtitle={
                        curso.isFull
                          ? "Sem vagas disponíveis"
                          : `${formatTimestamp(curso.inicio)} | ${formatTimestamp(curso.fim)}`
                      }
                      price={Number(curso.price || 0)}
                      checked={isSelected}
                      
                      // 🔒 bloqueia clique
                      onToggle={() => {
                        if (curso.isFull) return; // 👈 não deixa selecionar

                        setselectedEvent((prev) => {
                          const exists = prev.cursos?.some(c => c.id === curso.id);
                          return {
                            ...prev,
                            presencial: curso.type === "presencial",
                            cursos: exists
                              ? prev.cursos.filter(c => c.id !== curso.id)
                              : [...(prev.cursos || []), { id: curso.id }]
                          };
                        });
                      }}
                    />
                  );
                })
              )}

              {/* Online */}
              {event?.online && (
                <TicketSelectCard
                  label="Ingresso Online"
                  subtitle={`${formatDateBR(event.date_inicio_online)} • ${formatTime(
                    event.time_inicio_online
                  )}`}
                  price={Number(event.price_online || 0)}
                  checked={selectedEvent.online}
                  onToggle={() =>
                    setselectedEvent((prev) => ({ ...prev, online: !prev.online }))
                  }
                />
              )}


              {/* combo */}
              {event?.combo && (
                <TicketSelectCard
                  label="Combo online & presencial"
                  price={Number(event.price_combo || 0)}
                  checked={selectedEvent.combo}
                  onToggle={() =>
                    setselectedEvent((prev) => ({ ...prev, combo: !prev.online }))
                  }
                />
              )}
            </div>
           {appliedDiscount ? (
              <p className="text-sm text-right my-2 text-yellow-600 font-semibold">
                Desconto aplicado: {appliedDiscount.value}%
              </p>
            ):
             (
              <p className="text-sm text-right my-2 text-yellow-600 font-semibold">
                {event?.discount_event[0]?.value}% OFF ao selecionar {event?.discount_event[0]?.min}+ itens 🎉
              </p>
            )}

            {event?.curses
            &&
            <div className="mt-4 text-right">
              {totalWithDiscount < totalBase && (
                <p className="text-sm text-slate-400 line-through">
                  R$ {totalBase.toFixed(2)}
                </p>
              )}

              <p className="text-xl font-extrabold text-green-600">
                R$ {totalWithDiscount.toFixed(2)}
              </p>
            </div>}

            {/* ✅ botão continuar */}
            <div className="mt-4">
              <Link
                to={`/event/${event.id}/checkout/${checkoutType}`}
                className={`w-full block text-center px-3 py-2 rounded-md font-bold text-white transition-all ${
                  canContinue
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-slate-300 cursor-not-allowed pointer-events-none"
                }`}
              >
                Continuar
              </Link>

              {!canContinue && (
                <p className="text-xs text-slate-500 mt-2 text-center">
                  Selecione pelo menos 1 ingresso para continuar
                </p>
              )}
            </div>
          </div>


          {/* Descrição */}
          {description && (
            <div className=" pt-5">
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Sobre o evento
              </h3>
              <p className="text-slate-700 text-[15px] leading-7 whitespace-pre-line">
                {description}
              </p>
            </div>
          )}

          

          {/* Rodapé info extra */}
          <div className="text-center text-xs text-slate-400">
            <p>Powered by <a href="https://portifoliojeanldev.online" target="_blank" className="text-blue-500 underline tracking-widest">Jeanldev</a></p>
          </div>
        </div>
      </div>
    ) ;
    if (!event)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm text-center">
          <p className="text-xs font-black uppercase tracking-wider text-slate-500">
            Evento indisponível
          </p>

          <h2 className="text-xl font-extrabold text-slate-900 mt-2">
            Não conseguimos carregar esse evento 😥
          </h2>

          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            Pode ser um problema do navegador do Instagram.
            <br />
            Abra no Chrome/Safari para garantir.
          </p>

          <a
            href={window.location.href}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-white font-bold"
          >
            Abrir no navegador
          </a>
        </div>
      </div>
    );
}

export default EventPublic;