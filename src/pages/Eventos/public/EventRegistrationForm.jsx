import React, { useMemo } from "react";
import DynamicField from "./DynamicField";

export default function EventRegistrationForm({
  event,
  formData,
  setFormData,
  onSubmit,
  sticky = true,
  title = "Formulário de Inscrição",
  submitLabelPaid = "Continuar para Pagamento",
  submitLabelFree = "Avançar",
}) {
  const fields = event?.fields || [];

  const isFormValid = useMemo(() => {
    // ✅ valida somente campos obrigatórios
    return fields.every((field) => {
      if (!field.required) return true;

      const value = formData?.[field.id];

      if (field.type === "checkbox") return !!value;

      return value !== undefined && value !== null && String(value).trim() !== "";
    });
  }, [fields, formData]);

  const isPaidEvent = Number(event?.price || 0) > 0;

  return (
    <div className="space-y-8">
      <div
        className={` ${
          sticky ? "sticky " : ""
        }`}
      >
        <h2 className="text-lg font-bold text-slate-900 mb-5">{title}</h2>

        <form onSubmit={onSubmit} className="space-y-6">
          {fields.map((field) => (
            <DynamicField
              key={field.id}
              field={field}
              value={formData?.[field.id]}
              onChange={(val) =>
                setFormData((prev) => ({
                  ...prev,
                  [field.id]: val,
                }))
              }
            />
          ))}

          <button
            type="submit"
            disabled={!isFormValid}
            className="w-full bg-green-600 text-white p-3 rounded-2xl font-bold tracking-[.1em] text-sm hover:bg-green-700 transition-all shadow-md shadow-indigo-100 mt-4 disabled:opacity-60"
          >
            {isPaidEvent ? submitLabelPaid : submitLabelFree}
          </button>
        </form>
      </div>
    </div>
  );
}
