import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import  storage  from '@/src/utilies/storage';
import FormBuilder from './FormBuilder';
import CityStateAutocomplete from './CityStateAutocomplete';
import { Upload } from 'lucide-react';
import  { supabase }  from "@/src/lib/supabase";
import BackButton from '../../components/Buttons/Back';

const CreateOrEditEvent = ({ user }) => {

  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(false);

  // ✅ ETAPAS
  const [step, setStep] = useState(1);
  const nextStep = () => setStep((s) => Math.min(s + 1, 4));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  // ✅ STATE ORIGINAL + NOVOS CAMPOS
  const [eventData, setEventData] = useState({
    title: "",
    description: "",
    date_inicio_presencial: "",
    date_fim_presencial: "",
    time_inicio_presencial: "",
    time_fim_presencial: "",
    date_inicio_online: "",
    date_fim_online: "",
    time_inicio_online: "",
    time_fim_online: "",
    price_presencial: 0,
    price_online: 0,
    adress: "",
    online: false,
    presencial: true,
    online_url: "",
    platform: "",
    bannerUrl: "",
    city: "",
    state: "",
    fields: [],
    contato: "",
    limit: 0,

    // ✅ NOVO
    tickets: [],
    
  });

  const fetchEvent = async () => {
  if (!id) return;

  const ev = await storage.getEventById(id);
  if (!ev) return;

  setEventData({
    ...ev,
    tickets: ev.tickets || [],
    fields: ev.fields || [],
  });
};

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const toDateOrNull = (v) => (v ? v : null);
  const toTimeOrNull = (v) => (v ? v : null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const newEvent = {
        user_id: user.id,
        ...eventData,

        date_inicio_presencial: toDateOrNull(eventData.date_inicio_presencial),
        date_fim_presencial: toDateOrNull(eventData.date_fim_presencial),
        time_inicio_presencial: toTimeOrNull(eventData.time_inicio_presencial),
        time_fim_presencial: toTimeOrNull(eventData.time_fim_presencial),

        date_inicio_online: toDateOrNull(eventData.date_inicio_online),
        date_fim_online: toDateOrNull(eventData.date_fim_online),
        time_inicio_online: toTimeOrNull(eventData.time_inicio_online),
        time_fim_online: toTimeOrNull(eventData.time_fim_online),
      };

      if (id) {
        await storage.updateEvent(id, newEvent);
        navigate(`/admin/Eventos/${id}`);
      } else {
        const saved = await storage.saveEvent(newEvent);
        navigate(`/admin/Eventos/${saved.id}`);
      }

    } catch (err) {
      alert(err?.message || "Erro ao salvar evento");
    } finally {
      setLoading(false);
    }
  };

  const [uploadingBanner, setUploadingBanner] = useState(false);

  async function handleUploadBanner(file) {
    if (!file) return;
    try {
      setUploadingBanner(true);
      const ext = file.name.split(".").pop();
      const fileName = `banner-${Date.now()}.${ext}`;
      const filePath = `events/${fileName}`;

      const { error } = await supabase.storage
        .from("event-banners")
        .upload(filePath, file, { upsert: true });

      if (error) throw error;

      const { data } = supabase.storage
        .from("event-banners")
        .getPublicUrl(filePath);

      setEventData(prev => ({ ...prev, bannerUrl: data.publicUrl }));

    } catch (err) {
      alert("Erro ao enviar imagem");
    } finally {
      setUploadingBanner(false);
    }
  }

  return (
    <div className="w-full mx-auto px-4 pt-8 pb-24">

        <BackButton onBack={'/eventos'} link={true}/>
      <h1 className="text-3xl font-bold mb-6">
        Configurar {!id && "Novo"} Evento
      </h1>

      {/* PROGRESSO */}
      <div className="flex gap-2 mb-8">
        {[1,2,3,4].map(n => (
          <div key={n} className={`h-2 flex-1 rounded-2xl ${step>=n?"bg-indigo-600":"bg-slate-200"}`} />
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">

        {/* ETAPA 1 — SEU FORM ORIGINAL */}
        {step === 1 && (
          <section className="bg-white p-5 rounded-2xl shadow border border-slate-300 space-y-6">

            <input
              required
              placeholder="Título do Evento"
              value={eventData.title}
              onChange={(e) => setEventData({ ...eventData, title: e.target.value })}
              className="w-full border border-slate-300 px-4 py-3 rounded-2xl"
            />

            <textarea
              required
              placeholder="Descrição"
              value={eventData.description}
              onChange={(e) => setEventData({ ...eventData, description: e.target.value })}
              className="w-full border border-slate-300 px-4 py-3 rounded-2xl"
            />

            <CityStateAutocomplete
              value={{ city: eventData.city, state: eventData.state }}
              onChange={(next) =>
                setEventData(prev => ({
                  ...prev,
                  city: next.city,
                  state: next.state
                }))
              }
            />

            <input
              placeholder="Endereço"
              value={eventData.adress}
              onChange={(e) => setEventData({ ...eventData, adress: e.target.value })}
              className="w-full border border-slate-300 px-4 py-3 rounded-2xl"
            />

            <input
              placeholder="Contato"
              value={eventData.contato}
              onChange={(e) => setEventData({ ...eventData, contato: e.target.value })}
              className="w-full border border-slate-300 px-4 py-3 rounded-2xl"
            />

            <div className='flex gap-3 items-center'>
              <input
                type="url"
                value={eventData.bannerUrl}
                onChange={(e) => setEventData({ ...eventData, bannerUrl: e.target.value })}
                className="w-full border border-slate-300 px-4 py-3 rounded-2xl"
                placeholder="URL do banner"
              />

              <label className="inline-flex items-center gap-2 cursor-pointer bg-white shadow-md p-2 rounded-2xl border border-slate-300">
                <Upload />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleUploadBanner(e.target.files?.[0])}
                />
              </label>
            </div>

          </section>
        )}

        {/* ETAPA 2 — INGRESSOS */}
        {step === 2 && (
          <section className="bg-white p-5 rounded-2xl shadow border border-slate-300 space-y-6">
            <h2 className="text-xl font-bold">Ingressos</h2>

            <button
              type="button"
              onClick={() =>
                setEventData(prev => ({
                  ...prev,
                  tickets: [...prev.tickets, { name: "", price: 0, limit: 0, unique: true }]
                }))
              }
              className="bg-indigo-600 text-white px-4 py-2 rounded-2xl"
            >
              + Criar ingresso
            </button>

            {eventData.tickets.map((ticket, index) => (
              <div key={index} className="border border-slate-300 p-4 rounded-2xl space-y-2">

                <input
                  placeholder="Nome"
                  value={ticket.name}
                  onChange={(e) => {
                    const tickets = [...eventData.tickets];
                    tickets[index].name = e.target.value;
                    setEventData({ ...eventData, tickets });
                  }}
                  className="w-full border border-slate-300 px-3 py-2 rounded-2xl"
                />

                <input
                  type="number"
                  placeholder="Preço"
                  value={ticket.price}
                  onChange={(e) => {
                    const tickets = [...eventData.tickets];
                    tickets[index].price = Number(e.target.value);
                    setEventData({ ...eventData, tickets });
                  }}
                  className="w-full border border-slate-300 px-3 py-2 rounded-2xl"
                />

                <label className="flex gap-2">
                  <input
                    type="checkbox"
                    checked={ticket.unique}
                    onChange={(e) => {
                      const tickets = [...eventData.tickets];
                      tickets[index].unique = e.target.checked;
                      setEventData({ ...eventData, tickets });
                    }}
                  />
                  Ingresso único
                </label>
              </div>
            ))}

            {/* COMBO */}
            <label className="flex gap-2">
              <input
                type="checkbox"
                checked={eventData.combo_enabled}
                onChange={(e) =>
                  setEventData({ ...eventData, combo_enabled: e.target.checked })
                }
              />
              Criar combo
            </label>

            {eventData.combo_enabled && (
              <>
                <input
                  placeholder="Nome do combo"
                  value={eventData.combo.name}
                  onChange={(e) =>
                    setEventData({
                      ...eventData,
                      combo: { ...eventData.combo, name: e.target.value }
                    })
                  }
                  className="w-full border border-slate-300 px-3 py-2 rounded-2xl"
                />

                <input
                  type="number"
                  placeholder="Preço do combo"
                  value={eventData.combo.price}
                  onChange={(e) =>
                    setEventData({
                      ...eventData,
                      combo: { ...eventData.combo, price: Number(e.target.value) }
                    })
                  }
                  className="w-full border border-slate-300 px-3 py-2 rounded-2xl"
                />
              </>
            )}
          </section>
        )}

        {/* ETAPA 3 — FORM BUILDER */}
        {step === 3 && (
          <section className="bg-slate-100 p-8 rounded-2xl border border-slate-300">
            <FormBuilder
              fields={eventData.fields || []}
              onChange={(fields) => setEventData({ ...eventData, fields })}
            />
          </section>
        )}

        {/* ETAPA 4 — REVISÃO */}
        {step === 4 && (
          <section className="bg-white p-6 border border-slate-300 rounded-2xl">
            <h2 className="text-xl font-bold mb-4">Revisão</h2>
            <pre className="text-xs bg-slate-100 p-4 rounded-2xl">
              {JSON.stringify(eventData, null, 2)}
            </pre>
          </section>
        )}

        {/* NAVEGAÇÃO */}
        <div className="flex justify-between pt-6">
          
          <button
          disabled={step == 1}
          type="button" 
          onClick={prevStep} 
          className={`px-6 py-3 border border-slate-300 rounded-2xl ${step == 1 && 'bg-slate-50 text-slate-400 cursor-default'}`}
          >
            Voltar
          </button>
         

          {step < 4 && (
            <button type="button" onClick={nextStep} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl">
              Próximo
            </button>
          )}

          {step === 4 && (
            <button type="submit" className="px-6 py-3 bg-green-600 text-white rounded-2xl">
              {loading ? "Salvando..." : "Publicar Evento"}
            </button>
          )}
        </div>

      </form>
    </div>
  );
};

export default CreateOrEditEvent;