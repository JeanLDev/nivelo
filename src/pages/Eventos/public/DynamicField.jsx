import React from "react";

export default function DynamicField({ field, value, onChange }) {
  const label = field?.label || "Campo";
  const required = !!field?.required;
  const type = field?.type || "text";

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {/* SELECT */}
      {type === "select" ? (
        <select
          required={required}
          value={value || ""}
          onChange={(e) => onChange?.(e.target.value)}
          className="w-full px-4 py-3 border border-slate-200 rounded-md outline-none focus:ring-4 focus:ring-indigo-50 shadow-sm transition-all"
        >
          <option value="">Selecione uma opção...</option>

          {(field.options || []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : type === "checkbox" ? (
        // CHECKBOX
        <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-50 rounded-xl border border-slate-100">
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange?.(e.target.checked)}
            className="w-5 h-5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
          />
          <span className="text-sm font-medium text-slate-600">
            {field.checkboxLabel || "Confirmo os termos"}
          </span>
        </label>
      ) : (
        // INPUT PADRÃO
        <input
          type={type}
          required={required}
          value={value || ""}
          onChange={(e) => onChange?.(e.target.value)}
          className="w-full px-4 py-1 border border-slate-200 rounded-md outline-none focus:ring-4 focus:ring-indigo-50 shadow-sm transition-all rounded-xl"
        />
      )}
    </div>
  );
}
