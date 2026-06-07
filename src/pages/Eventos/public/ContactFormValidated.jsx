import React, { useMemo, useState } from "react";
import { Mail, MessageCircle } from "lucide-react";
import  storage  from "@/src/utilies/storage";
import { useParams } from "react-router-dom";
import {supabase} from "@/src/lib/supabase"

function onlyDigits(v = "") {
  return String(v).replace(/\D/g, "");
}

function formatBRPhone(value = "") {
  const digits = onlyDigits(value);

  // suporta 10 ou 11 dígitos (com DDD)
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6, 10)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}



function isValidEmail(email = "") {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email.trim());
}

function isValidBRWhatsapp(phone = "") {
  const digits = onlyDigits(phone);
  // 10 (fixo) ou 11 (celular) com DDD
  return digits.length === 10 || digits.length === 11;
}

export default function ContactFormValidated({ onSubmit,back,formData,price, cursos }) {

  const {id,type} = useParams()
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  const [touched, setTouched] = useState({
    email: false,
    whatsapp: false,
  });

  const emailOk = useMemo(() => isValidEmail(email), [email]);
  const whatsappOk = useMemo(() => isValidBRWhatsapp(whatsapp), [whatsapp]);

  const canSubmit = emailOk && whatsappOk;



  const handleSubmit = async(e) =>  {
    e.preventDefault();

    
    // marca como tocado pra mostrar erros
    setTouched({ email: true, whatsapp: true });

    if (!canSubmit) return;

    const payload = {
      email: email.trim().toLowerCase(),
      whatsapp: onlyDigits(whatsapp),
    };

    try {
      const newReg = {
        event_id: id,
        form_data: formData,
        status: Number(price) > 0 ? "pending" : "paid",
        type,
        number: payload.whatsapp,
        email:payload.email,
        price: Number(price),
      };

      const payloadInsert = {
        ...newReg,
      };
  
      const { data, error } = await supabase
        .from("registrations_events")
        .insert([payloadInsert])
        .select("*")
        .single();
  
      if (error) throw error;

      await Promise.all(
        cursos?.map(curso =>
          supabase
            .from('cursos_registrations')
            .insert({
              curso_id: curso.id,
              registration_id: data.id
            })
        )
      );

      onSubmit?.({
        ...payload,
        registration_id: data.id,
      });


    } catch (err) {
      console.error("Erro ao salvar inscrição:", err);
      alert(err?.message || "Erro ao salvar inscrição");
    }

  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-slate-200 pt-5 space-y-3">
      {/* EMAIL */}
      <div>
        <h5 className="mb-1 text-sm flex items-end">
          <Mail className="mr-2 w-4" /> Digite seu email:
        </h5>

        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
          className={`w-full px-4 py-2 border rounded-md outline-none focus:ring-4 shadow-sm transition-all ${
            touched.email && !emailOk
              ? "border-red-300 focus:ring-red-50"
              : "border-slate-200 focus:ring-indigo-50"
          }`}
          placeholder="exemplo@gmail.com"
        />

        {touched.email && !emailOk && (
          <p className="mt-1 text-xs text-red-600 font-medium">
            Digite um email válido (ex: nome@dominio.com)
          </p>
        )}
      </div>

      {/* WHATSAPP */}
      <div>
        <h5 className="mb-1 text-sm flex items-end">
          <MessageCircle className="mr-2 w-4" /> Digite seu Whatsapp:
        </h5>

        <input
          type="tel"
          required
          value={whatsapp}
          onChange={(e) => setWhatsapp(formatBRPhone(e.target.value))}
          onBlur={() => setTouched((prev) => ({ ...prev, whatsapp: true }))}
          className={`w-full px-4 py-2 border rounded-md outline-none focus:ring-4 shadow-sm transition-all ${
            touched.whatsapp && !whatsappOk
              ? "border-red-300 focus:ring-red-50"
              : "border-slate-200 focus:ring-indigo-50"
          }`}
          placeholder="(71) 9XXXX-XXXX"
          inputMode="numeric"
          maxLength={15}
        />

        {touched.whatsapp && !whatsappOk && (
          <p className="mt-1 text-xs text-red-600 font-medium">
            Digite um WhatsApp válido com DDD (10 ou 11 dígitos)
          </p>
        )}
      </div>

      {/* BUTTON */}
      <div className="flex space-x-2">
        <button
        type="button"
        onClick={(e) =>{
          e.preventDefault()
          back()}}
          className={`w-full p-2 rounded-md font-bold text-gray-700 transition-all bg-slate-300`}
        >
          voltar
        </button>
        <button
          type="submit"
          disabled={!canSubmit}
          className={`w-full p-2 rounded-2xl font-bold text-white transition-all ${
            canSubmit
              ? "bg-green-600 hover:bg-green-700"
              : "bg-slate-300 cursor-not-allowed"
          }`}
        >
          Avançar
        </button>
      </div>

      {/* status */}
      <div className="text-xs text-slate-500 text-center">
        {canSubmit ? "✅ Dados válidos" : "Preencha email e WhatsApp corretamente"}
      </div>
    </form>
  );
}
