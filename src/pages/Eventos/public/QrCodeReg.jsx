import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/src/lib/supabase";

import { QrCode, Copy, CheckCircle2, ArrowLeft, MapPin, Video, CalendarDays, ArrowRight, Link2, Contact2, Ticket, Loader, Loader2 } from "lucide-react";
import ShowCursosSelected from "./ShowCursosSelected";

const WEBHOOK_URL = "https://agenciadeia-n8n.qa3w33.easypanel.host/webhook/ead43765-a6ff-4ba6-b13c-990a450b67a7";


function onlyDigits(v = "") {
  return String(v).replace(/\D/g, "");
}

export default function QrCodereg() {
  const { id } = useParams(); 

  const [loading, setLoading] = useState(true);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);

  const [registration, setRegistration] = useState(null);
  const [event, setEvent] = useState(null);

  const [pixQrImage, setPixQrImage] = useState(""); // se vier no retorno
  const [copied, setCopied] = useState(false);

  // ✅ tenta pegar email do registro em vários formatos
  const email = useMemo(() => {
    if (!registration) return "";

    // se você salvar direto:
    if (registration.email) return registration.email;

  }, [registration]);

  useEffect(() => {
    fetchRegistrationAndEvent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  {/**Real time */}

  const paidTriggeredRef = useRef(false);
  const currentStatus = useMemo(() => {
    return String(registration?.status || "").toLowerCase();
  }, [registration]);

  useEffect(() => {
  if (!id) return;

  const channel = supabase
    .channel(`realtime-registration-${id}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "registrations_events",
        filter: `id=eq.${id}`,
      },
      (payload) => {
        const next = payload?.new;
        const old = payload?.old;

        if (!next) return;

        const nextStatus = String(next?.status || "").toLowerCase();
        const oldStatus = String(old?.status || "").toLowerCase();

        if (nextStatus === oldStatus) return;

        console.log("🔄 Status mudou:", oldStatus, "→", nextStatus);

        // 🔥 MERGE (ESSENCIAL)
        setRegistration((prev) => ({
          ...prev,
          ...next,
        }));
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
  }, [id]);

  useEffect(() => {
    const paidValues = ["paid", "pago", "approved"];
    if (paidValues.includes(currentStatus)) {
      paidTriggeredRef.current = true;
    }
  }, [currentStatus]);


  const ticketUrl = useMemo(() => {
    if (!id) return "";
    return `${window.location.origin}/admin/Eventos/checkin/:regId`;
  }, [id]);

  async function fetchRegistrationAndEvent() {
    setLoading(true);
    try {
      // ✅ buscar registro
      const { data: reg, error: regErr } = await supabase
        .from("registrations_events")
        .select("*, cursos_registrations(curses_event(*))")
        .eq("id", id)
        .single()

      if (regErr) throw regErr;

      setRegistration(reg);
      // ✅ define preço base (se vier salvo no registro, usa)
      const basePrice = Number(reg?.price || 0);
      setOriginalPrice(basePrice);
      setFinalPrice(basePrice);


      // ✅ buscar evento do registro
      if (reg?.event_id) {
        const { data: ev, error: evErr } = await supabase
          .from("eventos")
          .select("*")
          .eq("id", reg?.event_id)
          .single()

        if (evErr) throw evErr;

        setEvent(ev);
      }

    } catch (err) {
      console.error("Erro buscando registro/evento:", err);
      alert("Erro ao carregar dados do pagamento.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    supabase.realtime.connect();
  }, []);

  async function handlePayNowWithValue(customValue) {
  if (!email || !event || !id) return;

  setLoadingPayment(true);

  try {
    const ticketType = registration?.type || "presencial";

    const baseValue =
      ticketType === "presencial"
        ? Number(event.price_presencial || 0)
        : ticketType === "combo"
        ? Number(event.price_combo || 0)
        : ticketType === "online"
        ? Number(event.price_online || 0)
        : Number(event.price_presencial || 0) + Number(event.price_online || 0);

    const valorFinal = typeof customValue === "number" ? customValue : baseValue;

    const payload = {
      email_cliente: email,
      user_id: event?.user_id || "",
      chavePix: event?.chavePix || "",
      description: event?.title || "Evento",
      nomeRecebedor: event?.nome_clinica || "",
      cidade: (event?.city || "SALVADOR").toUpperCase(),
      valor: Number(valorFinal || 0),
      txid: id,
    };

    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (data.pix) {
      setPixQrImage(data.pix);
    }
  } catch (err) {
    console.error("Erro no processamento do Pix:", err);
  } finally {
    setLoadingPayment(false);
  }
  }

// mantém compatível com seu código antigo:
  async function handlePayNow() {
    return handlePayNowWithValue(finalPrice || registration?.price || 0);
  }

  useEffect(()=> {
    handlePayNow()
  },[])


  async function handleCopy() {
    if (!pixQrImage) return;

    try {
      await navigator.clipboard.writeText(pixQrImage);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      alert("Não foi possível copiar, copie manualmente.");
    }
  }

  
  const payTriggeredRef = useRef(false);

  useEffect(() => {
    if (!registration) return;

    const s = String(registration.status || "").toLowerCase();
    const isPaid = ["paid", "pago", "approved"].includes(s);
    if (isPaid) return;

    if (payTriggeredRef.current) return;
    payTriggeredRef.current = true;

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registration?.id, registration?.status]);

  //AREA DE COUPONS
  const [couponCode, setCouponCode] = useState(registration?.coupon);
  const [couponApplying, setCouponApplying] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  const [originalPrice, setOriginalPrice] = useState(0);
  const [finalPrice, setFinalPrice] = useState(0);

  function isExpired(expiration) {
    if (!expiration) return false;
    const exp = new Date(expiration).getTime();
    return Date.now() > exp;
  }

  function calcDiscountedPrice(base, coupon) {
    const type = String(coupon?.discount_type || "").toLowerCase();
    const value = Number(coupon?.discount_value || 0);

    if (base <= 0) return 0;

    if (type === "percentage") {
      const discounted = base - (base * value) / 100;
      return Math.max(0, Number(discounted.toFixed(2)));
    }

    if (type === "fixed_amount") {
      const discounted = base - value;
      return Math.max(0, Number(discounted.toFixed(2)));
    }

    return base;
  }

  async function applyCoupon() {
    setCouponError("");
    setCouponSuccess("");

    const code = String(couponCode || "").trim().toUpperCase();
    if (!code) {
      setCouponError("Digite um cupom.");
      return;
    }

    if (!event?.id) {
      setCouponError("Evento não carregado.");
      return;
    }

    setCouponApplying(true);

    try {
      // ✅ busca cupom
      const { data: coupon, error } = await supabase
        .from("fluxes_coupons")
        .select("*")
        .eq("event_id", event.id)
        .eq("code", code)
        .maybeSingle();

      if (error) {
        console.log(error);
        setCouponError("Erro ao validar cupom.");
        return;
      }

      if (!coupon) {
        setCouponError("Cupom inválido.");
        return;
      }

      if (!coupon.is_active) {
        setCouponError("Esse cupom está inativo.");
        return;
      }

      if (isExpired(coupon.expiration_date)) {
        setCouponError("Esse cupom expirou.");
        return;
      }

      const base = Number(originalPrice || registration?.price || 0);

      const minPurchase = Number(coupon.min_purchase_amount || 0);
      if (base < minPurchase) {
        setCouponError(`Compra mínima: R$ ${minPurchase.toFixed(2)}`);
        return;
      }




      // ✅ se tiver limite de uso, checa quantas inscrições já usaram esse cupom
      if (coupon.usage_limit) {
        const { count, error: countErr } = await supabase
          .from("registrations_events")
          .select("id", { count: "exact", head: true })
          .eq("event_id", event.id)


        if (!countErr && typeof count === "number") {
          if (count >= Number(coupon.usage_limit)) {
            setCouponError("Cupom esgotado (limite atingido).");
            return;
          }
        }
      }






      // ✅ calcula novo valor
      const discounted = calcDiscountedPrice(base, coupon);

      setAppliedCoupon(coupon);
      setFinalPrice(discounted);
      setCouponSuccess(`Cupom aplicado ✅ Novo valor: R$ ${discounted.toFixed(2)}`);

      // ✅ atualiza o registro (opcional, mas recomendo)

      await supabase
        .from("registrations_events")
        .update({
          price: discounted,
          useCoupon: true,
          coupon: coupon.code, // ⚠️ se não tiver essa coluna, remove essa linha
        })
        .eq("id", id);

      // ✅ gera novo PIX com valor descontado
      await handlePayNowWithValue(discounted);

    } catch (err) {
      console.log(err);
      setCouponError("Erro ao aplicar cupom.");
    } finally {
      setCouponApplying(false);
    }
  }

  const handleFreePay = async() => {

    await supabase
    .from("registrations_events")
    .update({
      paid_at: new Date().toISOString(),
      status: 'paid',
    })
    .eq("id", id);


  }


const isPaid = registration?.status === "paid"
const isFree = finalPrice === 0
const canPay = !isPaid && !isFree


function extractCursos(data) {
  if (!Array.isArray(data)) return [];

  return data.map(item => item.curses_event).filter(Boolean);
}

  function extractCursos(data) {
    if (!Array.isArray(data)) return [];

    return data.map(item => item.curses_event).filter(Boolean);
  }
  const cursos = extractCursos(registration?.cursos_registrations);

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

  if (loading) {
    return (
      <div className="p-4">
        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-lg h-screen w-full flex items-center justify-center">
         <Loader2 className="animate-spin text-green-800" size={40}/>
        </div>
      </div>
    );
  }
  

  if (!registration) {
    return (
      <div className="p-4">
        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-lg">
          <p className="text-sm font-bold text-slate-900">Registro não encontrado</p>
          <p className="text-xs text-slate-500">Verifique o link.</p>
        </div>
      </div>
    );
  }

  if (!email) {
    return (
      <div className="p-4">
        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-lg">
          <p className="text-sm font-bold text-slate-900">Email não encontrado</p>
          <p className="text-xs text-slate-500">
            Esse registro não possui email no form_data.
          </p>
        </div>
      </div>
    );
  }

  


  return (
  <div className="min-h-screen bg-slate-50 px-2 lg:px-4 py-8">
    <div className="max-w-xl mx-auto">

      {/* TICKET */}
      <div className="bg-white border border-slate-200 rounded-md shadow-xl overflow-hidden">
        
        {/* HEADER DO TICKET */}
        <div className="p-5 bg-gradient-to-r from-green-900 via-green-700 to-green-900 text-white">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-xs font-semibold opacity-90 tracking-widest ">
                Pagamento via PIX
              </p>

              <h1 className="mt-1 text-lg md:text-4xl font-bold leading-tight">
                {event?.title || "Evento"}
              </h1>

              {registration.status === 'pending'&&
              <p className={`
              text-xs md:text-sm opacity-90 mt-1
              ${registration.status === 'pending' && 'text-white'}
              `}>
                Finalize o pagamento para confirmar sua inscrição.
              </p>}
            </div>

          </div>

          {/* mini infos */}
          <div className="mt-4 space-y-3">
            <div className=" ">
              <p className="text-[10px] uppercase tracking-widest font-bold">
                Registro
              </p>
              <p className="text-sm lg:text-md  break-all mt-1">
                # {id}
              </p>
            </div>

            <div className="">
              <p className="text-[10px] uppercase tracking-widest font-bold">
                Email
              </p>
              <p className="text-sm lg:text-md  truncate mt-1">
                {email}
              </p>
            </div>
          </div>
        </div>

        {/* INFO DO EVENTO (mesmo ticket) */}
        <div className="p-5 space-y-4">
          {/* datas */}
          <div className="space-y-3">
            {event.presencial && !event.curses && (
              <div className="grid grid-cols-[28px_1fr] gap-3 items-start text-slate-700">
                <CalendarDays className="w-5 h-5 text-slate-500 mt-0.5" />

                <div>
                  <p className="text-sm font-bold text-slate-900 mb-1">
                    Presencial
                  </p>

                  <div className="flex items-center gap-3">
                    <div className="leading-tight">
                      <p className="text-sm font-semibold">
                        {formatDateBR(event.date_inicio_presencial)}
                      </p>
                      <p className="text-sm font-semibold">
                        {formatTime(event.time_inicio_presencial)}
                      </p>
                    </div>

                    <span className="text-slate-300">
                      <ArrowRight className="w-4 h-4" />
                    </span>

                    <div className="leading-tight">
                      <p className="text-sm font-semibold">
                        {formatDateBR(event.date_fim_presencial)}
                      </p>
                      <p className="text-sm font-semibold">
                        {formatTime(event.time_fim_presencial)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
             {event.presencial && event.curses && (
              <div className="grid grid-cols-[28px_1fr] gap-3 items-start text-slate-700">
                <CalendarDays className="w-5 h-5 text-slate-500 mt-0.5" />

                <div>
                  <p className="text-sm font-bold text-slate-900 mb-1">
                    Presencial
                  </p>

                  <div className="flex items-center gap-3">
                    <div className="leading-tight">
                      <p className="text-sm font-semibold">
                        {formatDateBR(event.date_inicio_presencial)}
                      </p>
                    </div>

                    <span className="text-slate-300">
                      <ArrowRight className="w-4 h-4" />
                    </span>

                    <div className="leading-tight">
                      <p className="text-sm font-semibold">
                        {formatDateBR(event.date_fim_presencial)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {event.online && (
              <div className="grid grid-cols-[28px_1fr] gap-3 items-start text-slate-700">
                <CalendarDays className="w-5 h-5 text-slate-500 mt-0.5" />

                <div>
                  <p className="text-sm font-bold text-slate-900 mb-1">
                    Online
                  </p>

                  <div className="flex items-center gap-3">
                    <div className="leading-tight">
                      <p className="text-sm font-semibold">
                        {formatDateBR(event.date_inicio_online)}
                      </p>
                      <p className="text-sm font-semibold">
                        {formatTime(event.time_inicio_online)}
                      </p>
                    </div>

                    <span className="text-slate-300">
                      <ArrowRight className="w-4 h-4" />
                    </span>

                    <div className="leading-tight">
                      <p className="text-sm font-semibold">
                        {formatDateBR(event.date_fim_online)}
                      </p>
                      <p className="text-sm font-semibold">
                        {formatTime(event.time_fim_online)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {event.presencial && (
              <div className="grid grid-cols-[28px_1fr] gap-3 items-start">
                <MapPin className="w-5 h-5 text-slate-500 mt-0.5" />
                <p className="text-sm font-bold text-slate-700 leading-snug">
                  Local <br />
                  <span className="text-sm font-semibold text-indigo-600">
                    {event.adress},{" "}
                    <span className="text-slate-900">
                      {event.city} / {event.state}
                    </span>
                  </span>
                </p>
              </div>
            )}
            {event?.curses && <ShowCursosSelected registrations={cursos} registration={registration}/>}

            {event.online && (
              <div className="grid grid-cols-[28px_1fr] gap-3 items-start">
                <Video className="w-5 h-5 text-slate-500 mt-0.5" />
                <p className="text-sm font-medium text-slate-700 leading-snug">
                  Plataforma <br />
                  <span className="text-xs font-bold text-indigo-600">
                    {event.platform || "Online"}
                  </span>
                </p>
              </div>
            )}
            {event.online &&  registration.status == "paid" && (
              <div className="grid grid-cols-[28px_1fr] gap-3 items-start">
                
                <Link2 className="w-5 h-5 text-slate-500 mt-0.5" />
                <p className="text-sm font-medium text-slate-700 leading-snug">
                  Link <br />
                  <a href={event.online_url} target="_blank" className="text-xs font-bold text-indigo-600 underline">
                    {event.online_url || "Online"}
                  </a>
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
        </div>

        {/* PERFURAÇÃO (picote) */}
        <div className="relative">
          <div className="border-t border-dashed border-slate-300" />
          {/* “meia lua” lado esquerdo */}
          <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-50 border border-slate-200" />
          {/* “meia lua” lado direito */}
          <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-50 border border-slate-200" />
        </div>
        {/**Compra */}
        <div>
          {registration.type =='hibrido' || registration.type == 'combo' &&
          <div className="py-5 bg-green-600">
            <p className="text-center">Ingresso online e presencial</p>
          </div>
          }
          {registration.type =='online' &&
          <div className="py-5 bg-green-600">
            <p className="text-center font-semibold text-md">Ingresso online</p>
          </div>
          }
          {registration.type =='presencial' &&
          <div className="py-5 bg-green-600">
            <p className="text-center font-semibold text-md">Ingresso presencial</p>
          </div>
          }
        </div>

        {/* PIX SECTION */}
        
        <div className="p-5">
  {/* ===================== */}
  {/* CUPOM (somente se NÃO estiver pago) */}
  {/* ===================== */}
  {!isPaid && (
    <div className="mb-5">
      <p className="text-sm font-bold text-slate-900 flex items-center">
        <Ticket className="mr-2" /> Inserir cupom de desconto
      </p>

      <div className="mt-2 flex gap-2">
        <input
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
          placeholder="EX: VERAO10"
          className="w-full px-4 py-3 rounded-md border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-indigo-500 font-bold tracking-wider"
        />

        <button
          type="button"
          onClick={applyCoupon}
          disabled={couponApplying}
          className="px-4 py-3 text-sm rounded-md font-semibold bg-green-600 hover:bg-green-700 text-white disabled:opacity-60"
        >
          {couponApplying ? "Aplicando..." : "Aplicar"}
        </button>
      </div>

      {!!couponError && (
        <div className="mt-2 text-xs font-bold text-red-600">
          {couponError}
        </div>
      )}

      {!!couponSuccess && (
        <div className="mt-2 text-xs font-bold text-emerald-600">
          {couponSuccess}
        </div>
      )}

      <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3">
        <div className="flex justify-between text-xs">
          <span className="text-slate-500 font-bold">Valor original</span>
          <span className="font-extrabold">
            R$ {Number(originalPrice || 0).toFixed(2)}
          </span>
        </div>

        <div className="flex justify-between text-xs mt-2">
          <span className="text-slate-500 font-bold">Valor com desconto</span>
          <span className="text-indigo-600 font-extrabold">
            R$ {Number(finalPrice || 0).toFixed(2)}
          </span>
        </div>

        {appliedCoupon?.code && (
          <div className="mt-2 text-[11px] text-slate-500">
            Cupom aplicado:{" "}
            <span className="font-extrabold">{appliedCoupon.code}</span>
          </div>
        )}
      </div>
    </div>
  )}

  {/* ===================== */}
  {/* PAGAMENTO GRATUITO */}
  {/* ===================== */}
  {isFree && !isPaid && (
    <button
      onClick={handleFreePay}
      className="bg-green-600 p-3 w-full rounded-md text-white font-bold"
    >
      Realizar inscrição
    </button>
  )}

  {/* ===================== */}
  {/* PAGAMENTO PIX */}
  {/* ===================== */}
  {canPay && (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <QrCode className="w-5 h-5 text-slate-500" />
          <p className="text-md font-semibold text-slate-900">
            Pague via PIX
          </p>
        </div>
        {loadingPayment && (
          <span className="text-xs font-bold text-indigo-600">
            Gerando...
          </span>
        )}
      </div>

      <p className="text-xs text-slate-500 mt-1">
        Escaneie o QR Code ou copie o código abaixo.
      </p>

      <div className="mt-4 flex justify-center">
        {pixQrImage ? (
          <div className="p-3 bg-white border rounded-2xl shadow">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
                pixQrImage
              )}`}
              className="w-52 h-52"
            />
          </div>
        ) : (
          <div className="w-52 h-52 border-dashed border rounded-2xl flex items-center justify-center text-slate-400">
            {loadingPayment ? "Gerando..." : "QR Code"}
          </div>
        )}
      </div>

      <p className="text-center text-2xl font-bold text-blue-600 mt-4">
        R$ {Number(finalPrice || registration?.price || 0).toFixed(2)}
      </p>

      <div className="mt-5">
        <p className="font-bold text-sm">PIX Copia e Cola</p>

        <div className="mt-2 bg-slate-50 border border-slate-300 rounded-md p-3 text-xs break-all">
          {pixQrImage || "PIX não gerado"}
        </div>

        <button
          onClick={handleCopy}
          disabled={!pixQrImage}
          className={`mt-3 w-full py-3 rounded-md font-bold text-white ${
            pixQrImage
              ? "bg-slate-600 hover:bg-slate-700"
              : "bg-slate-400"
          }`}
        >
          {copied ? "Copiado ✅" : "Copiar PIX"}
        </button>
        <button
          onClick={handlePayNow}
          className={`mt-3 w-full py-3 rounded-md font-bold text-white bg-green-600`}
        >
          Gerar Qr code
        </button>
      </div>
    </div>
  )}

          {/* ===================== */}
          {/* STATUS PAGO */}
          {/* ===================== */}
          {isPaid && (
            <div className="flex flex-col items-center p-7">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(
                  ticketUrl
                )}`}
                className="w-56 h-56 mb-6"
              />

              <CheckCircle2 className="h-20 w-20 text-green-600" />

              <span className="mt-2 px-4 py-1 rounded-full bg-emerald-600 text-white text-xs font-extrabold">
                PAGO
              </span>
            </div>
          )}
        </div>
      </div>
        {/* FOOTER / CREDITOS */}
        <div className="text-center mt-6">
          <p className="text-sm text-slate-800">
            Sistema desenvolvido por{" "}
            <a href="https://portifoliojeanldev.online" target="_blank" className="underline font-semibold text-blue-700">
              Jean Lucas
            </a>
          </p>
        </div>
    </div>
  </div>
);


}
