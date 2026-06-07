import React, { useState, useEffect } from 'react';
import { 
  Ticket, 
  Plus, 
  Trash2, 
  Calendar, 
  Percent, 
  DollarSign, 
  Save, 
  CheckCircle,
  Copy,
  Users,
  Edit2
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import {supabase} from "@/src/lib/supabase"

// Estrutura do componente principal
const CuponsPage = () => {
    const {id} = useParams()
  const [coupons, setCoupons] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Estado do formulário
    const [formData, setFormData] = useState({
        code: '',
        discount_type: 'percentage', // 'percentage' ou 'fixed_amount'
        discount_value: '',
        expiration_date: '',
        usage_limit: '',
        min_purchase_amount: '0',
        is_active: true
    });
    const fetchCoupons = async()=> {
        const {data, error} = await supabase
        .from('fluxes_coupons')
        .select('*')
        .eq('event_id', id)

        if(data) {
            return setCoupons(data)
        }
    }

    useEffect(()=> {
        fetchCoupons()
    },[])

    // Função para gerar um código aleatório
    const generateRandomCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setFormData({ ...formData, code });
    };

  // Simulação de salvamento no Supabase
    const handleSaveToSupabase = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        try {
        // Estrutura preparada para o Supabase:
        const couponData = {
            event_id: id,
            code: formData.code.toUpperCase(),
            discount_type: formData.discount_type,
            discount_value: parseFloat(formData.discount_value),
            expiration_date: formData.expiration_date || null,
            usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
            min_purchase_amount: parseFloat(formData.min_purchase_amount),
            is_active: formData.is_active,
            created_at: new Date().toISOString(),
        };


        const { data: coupons , error } = await supabase
            .from('fluxes_coupons')
            .insert(couponData)
            .select();
        console.log(error)

        if (error) console.error(error)
        
        setCoupons([couponData, ...coupons]);
        setIsFormOpen(false);
        resetForm();
        showStatus("Cupom criado com sucesso!");

        } catch (err) {
        showStatus("Erro ao criar cupom.", "error");
        } finally {
        setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
        code: '',
        discount_type: 'percentage',
        discount_value: '',
        expiration_date: '',
        usage_limit: '',
        min_purchase_amount: '0',
        is_active: true
        });
    };

    const showStatus = (msg, type = 'success') => {
        setStatusMessage({ msg, type });
        setTimeout(() => setStatusMessage(null), 3000);
    };

    const copyToClipboard = (text) => {
        document.execCommand('copy'); // Fallback para ambiente de iframe
        showStatus(`Código ${text} copiado!`);
    };
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    const handleDeleteCoupon = async (couponId) => {
    setDeletingId(couponId);

    try {
        const { error } = await supabase
        .from("fluxes_coupons")
        .delete()
        .eq("id", couponId);

        if (error) {
        console.log(error);
        showStatus("Erro ao apagar cupom.", "error");
        return;
        }

        setCoupons((prev) => prev.filter((c) => c.id !== couponId));
        showStatus("Cupom apagado com sucesso!");
        setConfirmDeleteId(null);
    } catch (err) {
        showStatus("Erro ao apagar cupom.", "error");
    } finally {
        setDeletingId(null);
    }
    };

  const [editingCouponId, setEditingCouponId] = useState(null)
  const [editFormData, setEditFormData] = useState({})
  const [savingEdit, setSavingEdit] = useState(false)
  const handleToggleEdit = (coupon) => {
    if (editingCouponId === coupon.id) {
      setEditingCouponId(null)
      return
    }

    setEditingCouponId(coupon.id)
    setEditFormData({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      expiration_date: coupon.expiration_date || "",
      usage_limit: coupon.usage_limit || "",
      min_purchase_amount: coupon.min_purchase_amount || 0,
      is_active: coupon.is_active,
    })
  }
  const handleUpdateCoupon = async () => {
    setSavingEdit(true)

    const { error } = await supabase
      .from("fluxes_coupons")
      .update({
        ...editFormData,
        discount_value: Number(editFormData.discount_value),
        usage_limit: editFormData.usage_limit
          ? Number(editFormData.usage_limit)
          : null,
        min_purchase_amount: Number(editFormData.min_purchase_amount),
      })
      .eq("id", editingCouponId)

    if (!error) {
      setCoupons((prev) =>
        prev.map((c) =>
          c.id === editingCouponId ? { ...c, ...editFormData } : c
        )
      )
      showStatus("Cupom atualizado com sucesso!")
      setEditingCouponId(null)
    } else {
      showStatus("Erro ao atualizar cupom", "error")
    }

    setSavingEdit(false)
  }

  const formatDateForInput = (date) => {
  if (!date) return ""
  return new Date(date).toISOString().split("T")[0]
}


  return (
    <div className="min-h-screen p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <Ticket className="text-indigo-600" />
              Gestão de Cupons
            </h1>
            <p className="text-slate-500">Crie e gerencie ofertas especiais para seus clientes.</p>
          </div>
          <button 
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md font-medium transition-all shadow-lg shadow-indigo-200"
          >
            {isFormOpen ? 'Fechar' : <><Plus size={20} /> Novo Cupom</>}
          </button>
        </div>

        {/* Feedback de Status */}
        {statusMessage && (
          <div className={`mb-6 p-4 rounded-md flex items-center gap-3 animate-in fade-in slide-in-from-top-4 ${
            statusMessage.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
          }`}>
            <CheckCircle size={18} />
            {statusMessage.msg}
          </div>
        )}

        {/* Formulário de Criação */}
        {isFormOpen && (
          <div className="bg-white border border-slate-200 rounded-md shadow-sm p-6 mb-8 animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-semibold mb-6 text-slate-800">Configurar Novo Cupom</h2>
            <form onSubmit={handleSaveToSupabase} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 flex justify-between">
                  Código do Cupom
                  <button 
                    type="button" 
                    onClick={generateRandomCode}
                    className="text-xs text-indigo-600 hover:underline"
                  >
                    Gerar aleatório
                  </button>
                </label>
                <input
                  required
                  type="text"
                  placeholder="Ex: VERAO2024"
                  className="w-full px-4 py-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none uppercase"
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Tipo de Desconto</label>
                <div className="flex bg-slate-100 p-1 rounded-md">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, discount_type: 'percentage'})}
                    className={`flex-1 py-1.5 text-sm rounded-md transition-all ${formData.discount_type === 'percentage' ? 'bg-white shadow-sm text-indigo-600 font-bold' : 'text-slate-500'}`}
                  >
                    Porcentagem (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, discount_type: 'fixed_amount'})}
                    className={`flex-1 py-1.5 text-sm rounded-md transition-all ${formData.discount_type === 'fixed_amount' ? 'bg-white shadow-sm text-indigo-600 font-bold' : 'text-slate-500'}`}
                  >
                    Valor Fixo (R$)
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                  Valor do Desconto {formData.discount_type === 'percentage' ? <Percent size={14}/> : <DollarSign size={14}/>}
                </label>
                <input
                  required
                  type="number"
                  placeholder={formData.discount_type === 'percentage' ? "Ex: 15" : "Ex: 50.00"}
                  className="w-full px-4 py-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formData.discount_value}
                  onChange={(e) => setFormData({...formData, discount_value: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                  Data de Expiração <Calendar size={14}/>
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formData.expiration_date}
                  onChange={(e) => setFormData({...formData, expiration_date: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                  Limite de Uso <Users size={14}/>
                </label>
                <input
                  type="number"
                  placeholder="Ilimitado se vazio"
                  className="w-full px-4 py-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formData.usage_limit}
                  onChange={(e) => setFormData({...formData, usage_limit: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Compra Mínima (R$)</label>
                <input
                  type="number"
                  className="w-full px-4 py-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formData.min_purchase_amount}
                  onChange={(e) => setFormData({...formData, min_purchase_amount: e.target.value})}
                />
              </div>

              <div className="md:col-span-2 pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 text-slate-600 hover:bg-slate-50 rounded-md transition-colors"
                >
                  Limpar
                </button>
                <button
                  disabled={loading}
                  type="submit"
                  className="bg-slate-900 text-white px-8 py-2 rounded-md font-medium hover:bg-slate-800 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : <><Save size={18} /> Salvar Cupom</>}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de Cupons Existentes */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Seus Cupons</h3>
          
          {coupons.length === 0 ? (
            <div className="text-center py-12 bg-white border border-dashed border-slate-300 rounded-2xl">
              <Ticket className="mx-auto text-slate-300 mb-3" size={48} />
              <p className="text-slate-500">Nenhum cupom criado ainda.</p>
            </div>
          ) : (
            coupons.map((coupon, idx) => (
              <div key={idx} className="bg-white border border-slate-200 p-5 rounded-md flex flex-col  md:items-center justify-between gap-4 hover:border-indigo-200 transition-colors group">
                <div className='flex justify-between w-full'>
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-indigo-50 rounded-md flex items-center justify-center text-indigo-600">
                      {coupon.discount_type === 'percentage' ? <Percent size={20}/> : <DollarSign size={20}/>}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 tracking-wider">{coupon.code}</span>
                        <button
                          onClick={() => copyToClipboard(coupon.code)}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-indigo-600 transition-opacity"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                      <div className="text-sm text-slate-500">
                        {coupon?.discount_type === 'percentage' ? `${coupon?.discount_value}% off` : `R$ ${coupon?.discount_value.toFixed(2)} off`}
                        {coupon.min_purchase_amount > 0 && ` • Min: R$ ${coupon.min_purchase_amount}`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                      <div className="text-sm font-medium text-slate-700">
                        {coupon.expiration_date ? new Date(coupon.expiration_date).toLocaleDateString() : 'Sem expiração'}
                      </div>
                      <div className="text-xs text-slate-400">Expira em</div>
                    </div>
                  
                    <div className="h-10 w-[1px] bg-slate-100 hidden md:block"></div>
                  
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${coupon.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {coupon.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                      <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setConfirmDeleteId(confirmDeleteId === coupon.id ? null : coupon.id)
                        }
                        className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                        title="Apagar cupom"
                      >
                        <Trash2 size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleEdit(coupon)}
                        className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                        title="Editar cupom"
                      >
                        <Edit2 size={18}/>
                      </button>
                        {/* ✅ confirmação ao lado do botão */}
                        {confirmDeleteId === coupon.id && (
                          <div className="absolute right-12 top-1/2 -translate-y-1/2 bg-white border border-slate-200 shadow-lg rounded-md px-3 py-2 flex items-center gap-2 z-30">
                            <span className="text-xs font-medium text-slate-700">
                              Apagar?
                            </span>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="text-xs px-2 py-1 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              disabled={deletingId === coupon.id}
                              onClick={() => handleDeleteCoupon(coupon.id)}
                              className="text-xs px-2 py-1 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                            >
                              {deletingId === coupon.id ? "Apagando..." : "Confirmar"}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                 </div>
                 {editingCouponId === coupon.id && (
                    <div className="mt-4 bg-slate-50 border border-indigo-200 rounded-md p-5 animate-in fade-in slide-in-from-top-2 w-full">
                      <h4 className="font-semibold text-slate-800 mb-4">
                        Editar cupom <span className="font-mono">{coupon.code}</span>
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ">
                        <div>
                          <label className="text-sm font-medium text-slate-700 block">Nome</label>
                          <input 
                            disabled
                            className="px-3 py-2 border rounded-md w-full"
                            value={editFormData.code}
                            onChange={(e) =>
                              setEditFormData({ ...editFormData, code: e.target.value })
                            }
                            placeholder="Código"
                          />
                        </div>
                        {/**Tipo */}
                        <div className='grid grid-cols-2 gap-4'>
                          <div className="">
                            <label className="text-sm font-medium text-slate-700">Tipo de Desconto</label>
                            <div className="flex bg-slate-100 p-1 rounded-md">
                              <button
                                type="button"
                                onClick={() => setEditFormData({...editFormData, discount_type: 'percentage'})}
                                className={`flex-1 py-1.5 text-sm rounded-md transition-all ${editFormData.discount_type === 'percentage' ? 'bg-white shadow-sm text-indigo-600 font-bold' : 'text-slate-500'}`}
                              >
                                (%)
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditFormData({...editFormData, discount_type: 'fixed_amount'})}
                                className={`flex-1 py-1.5 text-sm rounded-md transition-all ${editFormData.discount_type === 'fixed_amount' ? 'bg-white shadow-sm text-indigo-600 font-bold' : 'text-slate-500'}`}
                              >
                                (R$)
                              </button>
                            </div>
                          </div>
                          <div className="">
                            <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                              Valor  {editFormData.discount_type === 'percentage' ? <Percent size={14}/> : <DollarSign size={14}/>}
                            </label>
                            <input
                              required
                              type="number"
                              placeholder={editFormData.discount_type === 'percentage' ? "Ex: 15" : "Ex: 50.00"}
                              className="w-full px-4 py-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                              value={editFormData.discount_value}
                              onChange={(e) => setEditFormData({...editFormData, discount_value: e.target.value})}
                            />
                          </div>
                        </div>
                          <div>
                            <label className="text-sm font-medium text-slate-700 block">
                              Data de expiração
                            </label>

                            <input
                              type="date"
                              className="px-3 py-2 border rounded-md w-full"
                              value={formatDateForInput(editFormData.expiration_date)}
                              onChange={(e) =>
                                setEditFormData({
                                  ...editFormData,
                                  expiration_date: e.target.value,
                                })
                              }
                            />
                          </div>


                        <div className='grid grid-cols-2 gap-2'>
                          <div>
                            <label className="text-sm font-medium text-slate-700 block">Limite de uso</label>
                            <input
                              type="number"
                              className="px-3 py-2 border rounded-md w-full"
                              value={editFormData.usage_limit}
                              onChange={(e) =>
                                setEditFormData({
                                  ...editFormData,
                                  usage_limit: e.target.value,
                                })
                              }
                              placeholder="Limite de uso"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-slate-700 block">Compra mínima</label>
                            <input
                              type="number"
                              className="px-3 py-2 border rounded-md w-full"
                              value={editFormData.min_purchase_amount}
                              onChange={(e) =>
                                setEditFormData({
                                  ...editFormData,
                                  min_purchase_amount: e.target.value,
                                })
                              }
                              placeholder="Limite de uso"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 mt-5">
                        <button
                          onClick={() => setEditingCouponId(null)}
                          className="px-4 py-2 text-xs lg:text-sm text-slate-600 hover:bg-slate-200 rounded-md"
                        >
                          Cancelar
                        </button>

                        <button
                          onClick={handleUpdateCoupon}
                          disabled={savingEdit}
                          className="px-4  bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700 disabled:opacity-60 text-xs lg:text-sm"
                        >
                          {savingEdit ? "Salvando..." : "Salvar alterações"}
                        </button>
                      </div>
                    </div>
                  )}

              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CuponsPage;