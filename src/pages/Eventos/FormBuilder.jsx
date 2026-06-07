
import React, { useState } from 'react';


const FormBuilder= ({ fields, onChange }) => {

  const FieldType = {
    TEXT: "text",
    TEXTAREA: "textarea",
    NUMBER: "number",
    EMAIL: "email",
    DATE: "date",
    SELECT: "select",
    CHECKBOX: "checkbox",
  };

  const addField = () => {
    const newField = {
      id: Math.random().toString(36).substr(2, 9),
      label: 'Novo Campo',
      type: FieldType.TEXT,
      required: false,
      options: []
    };
    onChange([...fields, newField]);
  };

  const removeField = (id) => {
    onChange(fields.filter(f => f.id !== id));
  };

  const updateField = (id, updates) => {
    onChange(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const handleOptionChange = (fieldId, optionsString) => {
    const options = optionsString.split(',').map(s => s.trim()).filter(s => s !== '');
    updateField(fieldId, { options });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-800">Formulário de Inscrição</h3>
        <button 
          type="button"
          onClick={addField}
          className="text-sm bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-md hover:bg-indigo-100 transition-colors flex items-center gap-1 font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Adicionar Campo
        </button>
      </div>

      <div className="space-y-3">
        {fields.length === 0 && (
          <p className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
            Nenhum campo personalizado adicionado.
          </p>
        )}
        {fields.map((field, index) => (
          <div key={field.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative group">
            <button 
              type="button"
              onClick={() => removeField(field.id)}
              className="absolute -top-2 -right-2 bg-white text-red-500 border border-slate-200 p-1.5 rounded-full hover:bg-red-50 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-5">
                <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Rótulo (Label)</label>
                <input 
                  type="text"
                  value={field.label}
                  onChange={(e) => updateField(field.id, { label: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Ex: Nome Completo"
                />
              </div>
              <div className="md:col-span-4">
                <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Tipo de Input</label>
                <select 
                  value={field.type}
                  onChange={(e) => updateField(field.id, { type: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value={FieldType.TEXT}>Texto Curto</option>
                  <option value={FieldType.TEXTAREA}>Texto Longo</option>
                  <option value={FieldType.NUMBER}>Número</option>
                  <option value={FieldType.EMAIL}>E-mail</option>
                  <option value={FieldType.DATE}>Data</option>
                  <option value={FieldType.SELECT}>Seleção (Dropdown)</option>
                  <option value={FieldType.CHECKBOX}>Checkbox</option>
                </select>
              </div>
              <div className="md:col-span-3 flex items-end">
                <label className="flex items-center gap-2 cursor-pointer pb-2">
                  <input 
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) => updateField(field.id, { required: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm text-slate-600 font-medium">Obrigatório</span>
                </label>
              </div>

              {field.type === FieldType.SELECT && (
                <div className="md:col-span-12">
                  <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Opções (separadas por vírgula)</label>
                  <input 
                    type="text"
                    value={field.options?.join(', ')}
                    onChange={(e) => handleOptionChange(field.id, e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Ex: Opção 1, Opção 2, Opção 3"
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FormBuilder;
