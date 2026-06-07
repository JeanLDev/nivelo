import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link,useNavigate } from "react-router-dom";
import  storage  from "@/src/utilies/storage";
import { CheckCircle, ChevronDown, ChevronUp, Clock, ExternalLink , Ticket } from "lucide-react";
import { supabase } from "@/src/lib/supabase"
import FormBuilder from "./FormBuilder"

import CuponsPage from "./components/CuponsPage";
import Sorted from "./components/Sorted";
import BuilderCertific from "./components/BuilderCertific";
import RegistrationDetailsModal from "./components/RegistrationDetailsModal";
import CursosRegisters from "./cursos/cursosRegisters";

import BackButton from "../../components/Buttons/Back"

const PaymentStatus = {
  PAID: "paid",
  PENDING: "pending",
};

const AdminList = () => {
  const { id } = useParams();
  const navigate = useNavigate();


  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);

  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");

  // ✅ menu ações
  const [openActionMenu, setOpenActionMenu] = useState(null);

  // ✅ modal detalhes
  const [detailsReg, setDetailsReg] = useState(null);

  const [step, setStep] = useState("table")
  // ✅ modal editar inscrição
  const [editReg, setEditReg] = useState(null);

  // ✅ modal editar evento
  const [editEventOpen, setEditEventOpen] = useState(false);
  const [eventDraft, setEventDraft] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    price: 0,
  });

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        // ✅ BUSCA O EVENTO NO SUPABASE
        const ev = await storage.getEventById(id);

        setEvent(ev || null);

        if (ev) {
          setEventDraft({
            title: ev.title || "",
            description: ev.description || "",
            date: ev.date || "",
            time: ev.time || "",
            price: Number(ev.price || 0),
          });
        }

        // ✅ BUSCA INSCRIÇÕES DESSE EVENTO (ajuste pro seu storage)
        const regs = await storage.getRegistrations(id);
        setRegistrations(regs || []);
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
        window.location.href = '/'
      }
    };

    load();
  }, [id]);

  
  const [limit, setLimit] = useState(event?.limit ?? 0);
  const [savingLimit, setSavingLimit] = useState(false);
  useEffect(() => {
    setLimit(event?.limit ?? 0);
  }, [event?.limit]);
  

  async function handleSaveLimit() {
    if (!event?.id) return;

    setSavingLimit(true);
    try {
      const { data, error } = await supabase
        .from("eventos")
        .update({ limit })
        .eq("id", event.id)
        .select("*")
        .single();

      if (error) throw error;

      setEvent(data); // ✅ atualiza na tela
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar limite.");
    } finally {
      setSavingLimit(false);
    }
  }

  const deleteEvent  = async () => {
    const ok = window.confirm(
      "Tem certeza que deseja EXCLUIR esse evento?\n\nIsso vai apagar TODAS as inscrições dele também."
    );
    if (!ok) return;

    // confirmação extra (segurança)
    const ok2 = window.confirm("Última confirmação: deseja excluir mesmo?");
    if (!ok2) return;

    try {
      // 2) apaga o evento
      const ok = await storage.deleteEvent(id);

      if (ok) {
        alert("Evento excluído com sucesso ✅");
        navigate("/admin/Eventos");
      }
    } catch (err) {
      console.error(err);
      alert(err?.message || "Erro ao excluir evento");
    }
  };

  const visibleFields = useMemo(() => {
    if (!event) return [];
    return (event.fields || []).slice(0, 3);
  }, [event]);


  const filtered = useMemo(() => {
  // 1️⃣ Filtro base por status
  const base = registrations.filter(
    (r) => filterStatus === "all" || r.status === filterStatus
  )

  const q = search.trim().toLowerCase()
  if (!q) return base

  // 2️⃣ Mapa dinâmico de fields: id → label
  const fieldMap = Object.fromEntries(
    (event?.fields || []).map((f) => [
      f.id,
      String(f.label || "").toLowerCase(),
    ])
  )

  return base.filter((r) => {
    // 3️⃣ Status humano (pago / pendente)
    const statusLabel = r.status === "paid" ? "pago" : "pendente"
    if (statusLabel.includes(q)) return true

    // 4️⃣ Campos fixos da inscrição
    const staticValues = [
      r.email,
      r.number,
      r.payment_id,
      r.type,
    ]
      .filter(Boolean)
      .map((v) => String(v).toLowerCase())

    if (staticValues.some((v) => v.includes(q))) return true

    // 5️⃣ Campos dinâmicos do formulário (valor + label)
    const dynamicValues = Object.entries(r.form_data || {}).flatMap(
      ([fieldId, value]) => [
        String(value ?? "").toLowerCase(), // valor preenchido
        fieldMap[fieldId] || "",            // label do campo
      ]
    )

    return dynamicValues.some((v) => v.includes(q))
  })
}, [registrations, filterStatus, search, event?.fields])


  const paidCount = registrations.length> 0 && registrations.filter((r) => r.status === PaymentStatus.PAID).length;

  const pendingCount = registrations.length> 0 && registrations.filter((r) => r.status === PaymentStatus.PENDING).length;

  const ReceitaPending = registrations.length > 0 ? registrations
  .filter(r => r.status === PaymentStatus.PENDING)
  .reduce((total, r) => total + Number(r.price || 0), 0) : 0

  //Coupons
  const couponsCount = registrations.length> 0 && registrations.filter(r => r.useCoupon).length;

  const [showCoupons, setShowCoupons] = useState(false);

  const couponsUses = registrations.filter(r => r.useCoupon);

  const couponsGrouped = useMemo(() => {
    return couponsUses.reduce((acc, reg) => {
      const code = reg.coupon;

      if (!acc[code]) {
        acc[code] = {
          code,
          count: 0,
          users: [],
        };
      }

      acc[code].count += 1;
      acc[code].users.push({
        email: reg.email,
        number: reg.number,
        date: reg.created_at,
      });

      return acc;
    }, {});
  }, [couponsUses]);



  

  // ✅ Toggle status + paid_at
  const confirmPayment = async (regId) => {
    await storage.updateRegistrationStatus(regId, PaymentStatus.PAID);

    if (storage.updateRegistrationPaidAt) {
      await storage.updateRegistrationPaidAt(regId, new Date().toISOString());
    }

    const regs = await storage.getRegistrations(id);
    setRegistrations(regs || []);
  };

  const markPending = async (regId) => {
    await storage.updateRegistrationStatus(regId, PaymentStatus.PENDING);

    if (storage.updateRegistrationPaidAt) {
      await storage.updateRegistrationPaidAt(regId, null);
    }

    const regs = await storage.getRegistrations(id);
    setRegistrations(regs || []);
  };

  const deleteRegistration = async (regId) => {
    const ok = window.confirm("Tem certeza que deseja excluir esta inscrição?");
    if (!ok) return;

    await storage.deleteRegistration(regId);

    const regs = await storage.getRegistrations(id);
    setRegistrations(regs || []);
  };

  const saveRegistrationEdits = async () => {
    if (!editReg) return;

    await storage.updateRegistration(editReg.id, {
      formData: editReg.formData,
    });

    const regs = await storage.getRegistrations(id);
    setRegistrations(regs || []);
    setEditReg(null);
  };

  const ticketType = String(event?.type || "").toLowerCase(); 
// ou se você tiver event.presencial/event.online, usa isso abaixo

  


  const receitaTotal = registrations
  ?.filter(c => c.status === 'paid')
  .reduce((total, r) => total + r.price, 0);


  
  const handleMarkPresent = async (id, value) => {
  const { error } = await supabase
    .from('fluxes_registrations')
    .update({ present: value })
    .eq('id', id)

  if (error) {
    console.error(error)
  }
  // 2️⃣ Atualiza LOCALMENTE no state
  setRegistrations((prev) =>
    prev.map((reg) =>
      reg.id === id ? { ...reg, present: value } : reg
    )
  );
}

 const formatDateBR = (date) => {
  if (!date) return "-";

  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
};

function TabButton({ children, active, ...props }) {
  return (
    <button
      {...props}
      className={`
        whitespace-nowrap
        px-3 sm:px-4
        py-2
        text-sm sm:text-base
        rounded-t-md
        border border-b-0
        transition
        ${active 
          ? "bg-green-600 text-white border-green-600" 
          : "bg-white text-slate-600 hover:bg-slate-100 border-slate-200"
        }
      `}
    >
      {children}
    </button>
  );
}
  

  return (
    <div className="m-4 py-8">
      <BackButton onBack={'/eventos'} link={true}/>
       <h1 className="block w-full truncate text-lg md:text-3xl lg:text-5xl font-sans font-semibold tracking-[.1em] text-green-900 mb-2">
          {event?.title}
        </h1>
      {/* HEADER */}
      <div className="mb-8 bg-white text-black p-2 lg:p-4 rounded-2xl border border-slate-300 shadow-md">
       
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                {/* LEFT */}
                
                <div className="flex items-start gap-4">
                  
                  <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                       
                  </div>


                  <p className="text-slate-600 text-xl mt-1">
                    Lista de presença e controle de pagamentos.
                  </p>

                  {/**Botões */}
                  <div className="mt-3 flex items-center gap-2">
                    <Link
                    to={`/event/${event?.id}`}
                    target="_blank"
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-2xl text-xs lg:text-sm font-semibold border border-slate-200   transition shadow-lg"
                    >
                    Link <ExternalLink className="w-4 h-4"/>
                    </Link>
                    <Link
                      to={`/admin/Eventos/edit/${event?.id}`}
                      className="inline-flex items-center gap-2 px-3 py-1 rounded-2xl text-sm font-semibold border border-slate-200   transition shadow-lg text-xs lg:text-sm "
                    >
                      Editar
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path
                          d="M12 20h9"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </Link>

                    <button
                      onClick={deleteEvent}
                      className="inline-flex items-center gap-2 px-3 py-1 rounded-2xl text-xs lg:text-sm  font-semibold  border border-slate-200   hover:border-red-200 transition shadow-xl"
                    >
                      Excluir
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path
                          d="M3 6h18"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M8 6V4h8v2"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M19 6l-1 14H6L5 6"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                    <Link
                      to={`/admin/Eventos/${id}/cursos`}
                      className="inline-flex items-center gap-2 px-3 py-1 rounded-2xl text-sm font-semibold border border-slate-200   transition shadow-lg text-xs lg:text-sm "
                    >
                      Cursos
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path
                          d="M12 20h9"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </Link>
                  </div>

                </div>
              </div>
            </div>


          {/* RIGHT METRICS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 items-start lg:grid-cols-3 gap-4 my-4">

              {/* PAGOS */}
              <div className="rounded-2xl p-4 shadow-xl border border-green-200 flex gap-4">
                <CheckCircle className="text-green-500 w-6 h-6 shrink-0" />
                <div>
                  <p className="text-sm lg:text-lg ">Ingressos Pagos</p>
                  <p className="mt-2 text-3xl ">{paidCount}</p>
                  <p className="text-sm border-t w-fit border-green-500 mt-2">
                    R$ <span className=" text-lg">{receitaTotal.toFixed(2)}</span>{" "}
                    arrecadados
                  </p>
                </div>
              </div>

              {/* PENDENTES */}
              <div className="rounded-2xl p-4 shadow-xl border border-yellow-200 flex gap-4">
                <Clock className="text-yellow-500 w-6 h-6 shrink-0" />
                <div>
                  <p className="text-sm lg:text-lg ">Ingressos Pendentes</p>
                  <p className="mt-2 text-3xl ">{pendingCount}</p>
                  <p className="text-sm border-t w-fit border-yellow-500 mt-2">
                    Potencial: R${" "}
                    <span className=" text-lg">
                      {ReceitaPending?.toFixed(2)}
                    </span>
                  </p>
                </div>
              </div>

              {/* CUPONS */}
              <div className="rounded-2xl p-4 shadow-xl border border-purple-200">
                <div className="flex gap-4">
                  <Ticket className="text-purple-500 w-6 h-6 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm lg:text-lg ">Cupons Utilizados</p>
                    <p className="mt-2 text-3xl ">{couponsCount}</p>

                    <button
                      onClick={() => setShowCoupons(v => !v)}
                      className="mt-3 text-sm text-purple-600 font-medium flex items-center gap-2"
                    >
                      {showCoupons ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      {showCoupons ? "Ocultar cupons" : "Ver cupons utilizados"}
                    </button>
                  </div>
                </div>

                {showCoupons && (
                  <div className="mt-4 space-y-3">
                    {Object.values(couponsGrouped).length === 0 ? (
                      <p className="text-sm text-slate-500">
                        Nenhum cupom utilizado.
                      </p>
                    ) : (
                      Object.values(couponsGrouped)?.map(coupon => (
                        <div
                          key={coupon.code}
                          className="border border-slate-200 rounded-2xl p-3 bg-white"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-sm">
                              Cupom{" "}
                              <span className="bg-purple-200 px-2 py-0.5 rounded tracking-widest">
                                {coupon.code}
                              </span>
                            </span>
                            <span className="text-sm ">{coupon.count}x</span>
                          </div>

                          <div className="mt-2 space-y-2">
                            {coupon?.users?.map((u, idx) => (
                              <div
                                key={idx}
                                className="text-xs text-slate-600 flex justify-between border-b last:border-b-0 pb-1"
                              >
                                <div>
                                  <p>{u.number}</p>
                                  <p>{u.email}</p>
                                </div>
                                <span>
                                  {new Date(u.date).toLocaleDateString("pt-BR")}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

            </div>



            <div className="w-fit flex items-center gap-2">
              <div className="flex items-center mb-2">
                <p className=" mr-3 font-semibold text-sm">Inscritos {paidCount} de </p>
                <input
                  type="number"
                  min={0}
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  className="w-14 px-1 py-1 border border-slate-200 rounded-sm  bg-transparent"
                />
              </div>
              <div className="flex items-end  gap-3">

                <button
                  type="button"
                  onClick={handleSaveLimit}
                  disabled={savingLimit}
                  className="px-2 py-1 rounded-2xl bg-green-500 text-white font-semibold hover:bg-green-700 disabled:opacity-60 text-sm"
                >
                  {savingLimit ? "Salvando..." : "Alterar"}
                </button>
              </div>
              
            </div>
      </div>

      
      
      {/* TABLE */}
      <div className="w-full overflow-x-auto">
        <div className="flex min-w-max gap-2 px-2 ">
          
          <TabButton active={step === "table"} onClick={() => setStep("table")}>
            Table
          </TabButton>

          <TabButton active={step === "form"} onClick={() => setStep("form")}>
            Formulário
          </TabButton>

          <TabButton active={step === "cupons"} onClick={() => setStep("cupons")}>
            Cupons
          </TabButton>

          <TabButton active={step === "sorteio"} onClick={() => setStep("sorteio")}>
            Sorteio
          </TabButton>

          <TabButton active={step === "certificado"} onClick={() => setStep("certificado")}>
            Certificado
          </TabButton>
          <TabButton active={step === "cursos"} onClick={() => setStep("cursos")}>
            Cursos
          </TabButton>

        </div>
      </div>

      <div className="mr-4">
        {step == "table" &&
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-y-auto">
          <div className="p-2 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* filtros */}
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-500">Filtrar:</span>
                <div className="flex bg-white border border-slate-200 rounded-lg p-1">
                  <button
                    onClick={() => setFilterStatus("all")}
                    className={`px-3 py-1 text-xs  rounded-2xl transition-all ${
                      filterStatus === "all"
                        ? "bg-green-600 text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => setFilterStatus(PaymentStatus.PAID)}
                    className={`px-3 py-1 text-xs  rounded-2xl transition-all ${
                      filterStatus === PaymentStatus.PAID
                        ? "bg-green-600 text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    Pagos
                  </button>
                  <button
                    onClick={() => setFilterStatus(PaymentStatus.PENDING)}
                    className={`px-3 py-1 text-xs  rounded-2xl transition-all ${
                      filterStatus === PaymentStatus.PENDING
                        ? "bg-amber-600 text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    Pendentes
                  </button>
                </div>
              </div>
              {/* busca */}
              <div className="relative">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por qualquer campo..."
                  className="w-full md:w-[320px] px-4 py-2 rounded-2xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-green-200"
                />
                {search ? (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    title="Limpar"
                  >
                    ✕
                  </button>
                ) : null}
              </div>
            </div>
            <span className="text-sm text-slate-500 font-medium">
              Mostrando {filtered.length} de {registrations.length} inscritos
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 text-left border-b border-slate-200">
                  <th className="block md:hidden px-3 py-4 text-xs  text-slate-500 uppercase tracking-wider">
                    Ações
                  </th>
                  {!event?.curses &&
                  <th className="px-3 py-4 text-xs  text-slate-500 uppercase tracking-wider">
                    Presente
                  </th>}
                  {visibleFields?.map((f) => (
                    <th
                      key={f.id}
                      className="px-3 py-4 text-xs  text-slate-500 uppercase tracking-wider"
                    >
                      {f.label}
                    </th>
                  ))}
                  <th className="px-6 py-4 text-xs  text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="md:block hidden px-6 py-4 text-xs  text-slate-500 uppercase tracking-wider text-right">
                    Ações
                  </th>
                </tr>
              </thead>
              {/**informações**/}
              <tbody className="divide-y divide-slate-100 ml-8">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-12 text-center text-slate-400">
                      Nenhuma inscrição encontrada.
                    </td>
                  </tr>
                ) : (
                  filtered?.map((reg) => (
                    <tr key={reg?.id} className="hover:bg-slate-50 transition-colors">
                      <td className="block md:hidden px-6 py-4 whitespace-nowrap text-right relative">
                        <button
                          onClick={() =>
                            setOpenActionMenu(openActionMenu === reg.id ? null : reg.id)
                          }
                          className="px-3 py-2 text-xs  rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                        >
                          Ações ▾
                        </button>
                        {openActionMenu === reg.id ? (
                          <div
                            className="absolute left-6 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-50"
                            onMouseLeave={() => setOpenActionMenu(null)}
                          >
                            <button
                              onClick={() => {
                                setDetailsReg(reg);
                                setOpenActionMenu(null);
                              }}
                              className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50"
                            >
                              Ver detalhes
                            </button>
                            <button
                              onClick={() => {
                                setEditReg(reg);
                                setOpenActionMenu(null);
                              }}
                              className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50"
                            >
                              Editar inscrição
                            </button>
                            {reg.status === PaymentStatus.PENDING ? (
                              <button
                                onClick={() => {
                                  confirmPayment(reg.id);
                                  setOpenActionMenu(null);
                                }}
                                className="w-full text-left px-4 py-3 text-sm hover:bg-green-50 text-green-700 "
                              >
                                Confirmar pagamento
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  markPending(reg.id);
                                  setOpenActionMenu(null);
                                }}
                                className="w-full text-left px-4 py-3 text-sm hover:bg-amber-50 text-amber-700 "
                              >
                                Marcar como pendente
                              </button>
                            )}
                            <div className="h-px bg-slate-100" />
                            <button
                              onClick={() => {
                                deleteRegistration(reg.id);
                                setOpenActionMenu(null);
                              }}
                              className="w-full text-left px-4 py-3 text-sm hover:bg-red-50 text-red-600 "
                            >
                              Excluir
                            </button>
                          </div>
                        ) : null}
                      </td>

                       {!event?.curses&&
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        <input
                          type="checkbox"
                          checked={reg?.present}
                          onChange={(e) => handleMarkPresent(reg.id, e.target.checked)}
                        />                    
                      </td>}

                      {visibleFields?.map((f) => (
                        <td
                          key={f?.id}
                          className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 truncate max-w-[150px]"
                          title={String(reg?.form_data?.[f.id] ?? "-")}
                        >
                          {String(reg?.form_data?.[f.id] ?? "-")}
                        </td>
                      ))}

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-2xl text-xs  uppercase ${
                            reg?.status === PaymentStatus.PAID
                              ? "bg-green-100 text-green-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {reg?.status === PaymentStatus.PAID ? "Pago" : "Pendente"}
                        </span>
                      </td>
                      <td className="hidden md:block px-6 py-4 whitespace-nowrap text-right relative">
                        <button
                          onClick={() =>
                            setOpenActionMenu(openActionMenu === reg.id ? null : reg.id)
                          }
                          className="px-3 py-2 text-xs  rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                        >
                          Ações ▾
                        </button>
                        {openActionMenu === reg.id ? (
                          <div
                            className="absolute right-6 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-50"
                            onMouseLeave={() => setOpenActionMenu(null)}
                          >
                            <button
                              onClick={() => {
                                setDetailsReg(reg);
                                setOpenActionMenu(null);
                              }}
                              className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50"
                            >
                              Ver detalhes
                            </button>
                            <button
                              onClick={() => {
                                setEditReg(reg);
                                setOpenActionMenu(null);
                              }}
                              className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50"
                            >
                              Editar inscrição
                            </button>
                            {reg.status === PaymentStatus.PENDING ? (
                              <button
                                onClick={() => {
                                  confirmPayment(reg.id);
                                  setOpenActionMenu(null);
                                }}
                                className="w-full text-left px-4 py-3 text-sm hover:bg-green-50 text-green-700 "
                              >
                                Confirmar pagamento
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  markPending(reg.id);
                                  setOpenActionMenu(null);
                                }}
                                className="w-full text-left px-4 py-3 text-sm hover:bg-amber-50 text-amber-700 "
                              >
                                Marcar como pendente
                              </button>
                            )}
                            <div className="h-px bg-slate-100" />
                            <button
                              onClick={() => {
                                deleteRegistration(reg.id);
                                setOpenActionMenu(null);
                              }}
                              className="w-full text-left px-4 py-3 text-sm hover:bg-red-50 text-red-600 "
                            >
                              Excluir
                            </button>
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>}
        {step == 'cupons' &&
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden p-4">
          <CuponsPage
        
          />
        </div>}
        {step == "form" &&
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden p-4">
          <FormBuilder
          fields={event.fields || []}
          onChange={(fields) => setEvent({ ...event, fields })}
          />
          <button
          className="mt-4 text-left text-white bg-green-600 p-2 rounded-2xl"
          onClick={async() => await storage.updateEvent(event.id, event)}
          >
            Salvar
          </button>
        </div>
        }
        {step === 'sorteio' &&
          <Sorted/>
        }
        {step === 'certificado' &&
          <BuilderCertific/>
        }
        {step == 'cursos' && <CursosRegisters/>}
      </div>



      {/* MODAL Detalhes */}
      {detailsReg ? (
        <RegistrationDetailsModal registration={detailsReg} event={event} onClose={()=> setDetailsReg(null)}/>
      ) : null}

      {/* MODAL Editar inscrição */}
      {editReg ? (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-[999]">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg  text-slate-900">Editar inscrição</h2>
              <button
                onClick={() => setEditReg(null)}
                className="text-slate-500 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              {(event.fields || []).map((f) => (
                <div key={f.id}>
                  <label className="block text-xs  uppercase tracking-wider text-slate-500 mb-2">
                    {f.label}
                  </label>
                  <input
                    value={String(editReg.formData?.[f.id] ?? "")}
                    onChange={(e) =>
                      setEditReg({
                        ...editReg,
                        formData: {
                          ...(editReg.formData || {}),
                          [f.id]: e.target.value,
                        },
                      })
                    }
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-green-200"
                  />
                </div>
              ))}
            </div>

            <div className="p-5 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                onClick={() => setEditReg(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-sm  text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={saveRegistrationEdits}
                className="px-4 py-2 rounded-xl bg-green-600 text-white text-sm  hover:bg-green-700"
              >
                Salvar alterações
              </button>
            </div>
          </div>
        </div>
      ) : null}

      
    </div>
  );
};

export default AdminList;
