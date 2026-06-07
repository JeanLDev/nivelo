import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Type, 
  Square, 
  Image as ImageIcon, 
  Trash2, 
  RotateCw, 
  Download, 
  Layers, 
  Layout, 
  Users, 
  Search,
  CheckCircle2,
  X,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Save
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import  storage  from '@/src/utilies/storage';
import { supabase } from '@/src/lib/supabase';

/**
 * IMPORTANTE: Para evitar erros de resolução de módulos em ambientes restritos,
 * utilizamos o carregamento via CDN para bibliotecas pesadas de manipulação de arquivos.
 */
const loadScript = (src) => {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

// --- Constantes de Dimensões ---
const A4_LANDSCAPE = { width: 842, height: 595 };
const A4_PORTRAIT = { width: 595, height: 842 };

// --- Mock de Dados de Registros ---
const MOCK_REGISTERS = Array.from({ length: 15 }, (_, i) => ({
  id: `reg_${i + 1}`,
  name: `Participante Exemplo ${i + 1}`,
  email: `usuario${i + 1}@email.com`,
  type: i % 2 === 0 ? 'Palestrante' : 'Ouvinte',
  status: 'Confirmado',
  paid_at: '2023-10-20',
  created_at: '2023-10-15',
  user_id: `u_${i + 100}`,
  qr_code: `QR_${i + 5000}`,
  payment_id: `PAY_${i + 9000}`,
  present: i % 3 !== 0,
  present_at: '2023-10-22 09:00',
  event_id: 'event_123',
  number: `CERT-${1000 + i}`,
  price: 'R$ 50,00',
  coupon: 'DESC10',
  useCoupon: true,
}));

const PLACEHOLDERS = [
  'id', 'email', 'type', 'status', 'paid_at', 'created_at', 
  'user_id', 'qr_code', 'payment_id', 'present', 'present_at', 
  'event_id', 'number', 'price', 'coupon', 'useCoupon'
];
const DEFAULT_CERTIFICATE_TEMPLATE = [
  // 🔷 FAIXA SUPERIOR
  {
    id: "bg_top",
    type: "shape",
    x: 0,
    y: 0,
    width: 842,
    height: 170,
    color: "#0f2f26",
    borderRadius: 0,
    rotation: 0,
  },

  // 🔤 TÍTULO
  {
    id: "title",
    type: "text",
    content: "CERTIFICADO",
    x: 0,
    y: 35,
    width: 842,
    fontSize: 48,
    fontWeight: "bold",
    color: "#ffffff",
    fontFamily: "sans-serif",
    textAlign: "center",
    rotation: 0,
  },

  // 🔤 SUBTÍTULO
  {
    id: "subtitle",
    type: "text",
    content: "DE PARTICIPAÇÃO",
    x: 0,
    y: 95,
    width: 842,
    fontSize: 26,
    fontWeight: "normal",
    color: "#e5e7eb",
    fontFamily: "sans-serif",
    textAlign: "center",
    rotation: 0,
  },

  // 📄 TEXTO INTRODUÇÃO
  {
    id: "intro",
    type: "text",
    content:
      "A liga acadêmica de rede e capacitação biomédica certifica que:",
    x: 0,
    y: 200,
    width: 842,
    fontSize: 18,
    fontWeight: "normal",
    color: "#111827",
    fontFamily: "sans-serif",
    textAlign: "center",
    rotation: 0,
  },

  // 🧑 NOME DO PARTICIPANTE
  {
    id: "participant_name",
    type: "text",
    content: "{{name}}",
    x: 100,
    y: 240,
    width: 642,
    fontSize: 40,
    fontWeight: "bold",
    color: "#000000",
    fontFamily: "serif",
    textAlign: "center",
    rotation: 0,
  },

  // 📜 TEXTO DESCRIÇÃO
  {
    id: "description",
    type: "text",
    content:
      "Ministrou palestra no evento \"Imersão nas áreas da biomedicina\", contribuindo com a formação acadêmica e atualização científica dos participantes.",
    x: 80,
    y: 310,
    width: 682,
    fontSize: 16,
    fontWeight: "normal",
    color: "#111827",
    fontFamily: "sans-serif",
    textAlign: "center",
    rotation: 0,
  },

  // 📅 DATA E LOCAL
  {
    id: "date_place",
    type: "text",
    content: "{{created_at}} • Salvador - BA",
    x: 0,
    y: 420,
    width: 842,
    fontSize: 16,
    fontWeight: "normal",
    color: "#000000",
    fontFamily: "sans-serif",
    textAlign: "center",
    rotation: 0,
  },

  // ✍ ASSINATURA ESQUERDA
  {
    id: "sign_left_name",
    type: "text",
    content: "BRUNNA LUANNE GUALBERTO F DE SOUZA",
    x: 60,
    y: 480,
    width: 280,
    fontSize: 14,
    fontWeight: "bold",
    color: "#000000",
    fontFamily: "sans-serif",
    textAlign: "center",
    rotation: 0,
  },

  {
    id: "sign_left_role",
    type: "text",
    content: "Presidente da Liga",
    x: 60,
    y: 500,
    width: 280,
    fontSize: 12,
    fontWeight: "normal",
    color: "#374151",
    fontFamily: "sans-serif",
    textAlign: "center",
    rotation: 0,
  },

  // ✍ ASSINATURA DIREITA
  {
    id: "sign_right_name",
    type: "text",
    content: "Orientador(a) do Evento",
    x: 502,
    y: 480,
    width: 280,
    fontSize: 14,
    fontWeight: "bold",
    color: "#000000",
    fontFamily: "sans-serif",
    textAlign: "center",
    rotation: 0,
  },

  {
    id: "sign_right_role",
    type: "text",
    content: "Coordenação Acadêmica",
    x: 502,
    y: 500,
    width: 280,
    fontSize: 12,
    fontWeight: "normal",
    color: "#374151",
    fontFamily: "sans-serif",
    textAlign: "center",
    rotation: 0,
  }
];

export default function App() {
  // --- Estados do Canvas ---
  const {id} = useParams()
  const [orientation, setOrientation] = useState('landscape');
  const [elements, setElements] = useState(DEFAULT_CERTIFICATE_TEMPLATE);
  const [selectedId, setSelectedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [canvasBg, setCanvasBg] = useState('#ffffff');
  const [zoom, setZoom] = useState(0.8);
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    present: "all",
  });
    
  // --- Estados de Interação ---
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [guides, setGuides] = useState({ x: null, y: null });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState(null);
  const [visualRotation, setVisualRotation] = useState(0); // 0 ou 90

  // --- Estados de Registros/Exportação ---
  const [registers, setRegisters] = useState(MOCK_REGISTERS);
  const [selectedRegisters, setSelectedRegisters] = useState([]);
  const [search, setSearch] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const canvasRef = useRef(null);
  const hiddenCanvasRef = useRef(null);

  const canvasSize = orientation === 'landscape' ? A4_LANDSCAPE : A4_PORTRAIT;

  // --- Efeito para carregar dependências externas ---
  useEffect(() => {
    const initDeps = async () => {
      try {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
      } catch (err) {
        console.error("Erro ao carregar scripts de exportação:", err);
      }
    };
    initDeps();
  }, []);

  const fetchRegistrations = async() => {
    const data = await storage.getRegistrationsByEvent(id)
    setRegisters(data)
  }
  useEffect(()=> {
    fetchRegistrations()
    loadTemplate();
  },[id])
  const [eventFields, setEventFields] = useState([]); // Campos do form

  const fetchEventFields = async () => {
    const { data, error } = await supabase
      .from("fluxes_events")
      .select("fields")
      .eq("id", id) // id do evento
      .single();

    if (error) {
      console.error("Erro ao buscar campos do evento", error);
      return;
    }

    setEventFields(data.fields || []);
  };

  useEffect(() => {
    fetchEventFields();
  }, [id]);

  // --- Funções de Manipulação de Elementos ---
  const addText = () => {
    const newEl = {
      id: Date.now().toString(),
      type: 'text',
      content: 'Clique duplo para editar',
      x: 100,
      y: 100,
      width: 300,
      fontSize: 24,
      fontWeight: 'normal',
      color: '#000000',
      fontFamily: 'sans-serif',
      textAlign: 'center',
      rotation: 0,
    };
    setElements([...elements, newEl]);
    setSelectedId(newEl.id);
  };

  const addShape = () => {
    const newEl = {
      id: Date.now().toString(),
      type: 'shape',
      x: 150,
      y: 150,
      width: 100,
      height: 100,
      color: '#3b82f6',
      borderRadius: 0,
      rotation: 0,
    };
    setElements([...elements, newEl]);
    setSelectedId(newEl.id);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newEl = {
          id: Date.now().toString(),
          type: 'image',
          src: event.target.result,
          x: 100,
          y: 100,
          width: 200,
          height: 150,
          rotation: 0,
        };
        setElements([...elements, newEl]);
        setSelectedId(newEl.id);
      };
      reader.readAsDataURL(file);
    }
  };

  const updateElement = (id, updates) => {
    setElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));
  };

  const deleteElement = (id) => {
    setElements(prev => prev.filter(el => el.id !== id));
    setSelectedId(null);
  };

  // --- Lógica de Drag and Drop & Snap ---
  const handleMouseDown = (e, el) => {
    if (editingId === el.id) return; // importante!
    
    setSelectedId(el.id);
    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragStart({
      x: (e.clientX - rect.left) / zoom,
      y: (e.clientY - rect.top) / zoom
    });
  };

  const handleMouseMove = useCallback((e) => {
  if (!selectedId) return;

  const canvasRect = canvasRef.current.getBoundingClientRect();

  let mouseX = (e.clientX - canvasRect.left) / zoom;
  let mouseY = (e.clientY - canvasRect.top) / zoom;

  // 🔥 CORREÇÃO PARA CANVAS ROTACIONADO 90°
  if (visualRotation === 90) {
    const tempX = mouseX;
    mouseX = mouseY;
    mouseY = canvasSize.height - tempX;
  }

  // 👉 RESIZE
  if (isResizing && resizeStart) {
    const dx = mouseX - resizeStart.startX;
    const dy = mouseY - resizeStart.startY;

    updateElement(selectedId, {
      width: Math.max(20, resizeStart.startWidth + dx),
      height: Math.max(20, resizeStart.startHeight + dy),
    });
    return;
  }

  // 👉 DRAG
  if (isDragging && !editingId) {
    const el = elements.find(item => item.id === selectedId);
    if (!el) return;

    const newX = mouseX - dragStart.x;
    const newY = mouseY - dragStart.y;

    updateElement(selectedId, { x: newX, y: newY });
  }

}, [isDragging, isResizing, selectedId, resizeStart, dragStart, zoom, elements, editingId, visualRotation, canvasSize.height]);

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeStart(null);
    setGuides({ x: null, y: null });
  };

  // --- Lógica de Substituição de Placeholder ---
  const replacePlaceholders = (text, data, fields = []) => {
  let newText = text;

  // 1️⃣ PLACEHOLDERS padrão
  PLACEHOLDERS.forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    newText = newText.replace(regex, data[key] ?? '');
  });

  // 2️⃣ PLACEHOLDERS do form_data usando label
  if (data.form_data) {
    fields.forEach(f => {
      const fieldId = f.id;
      const regex = new RegExp(`{{${f.label}}}`, 'g'); // placeholder é o label
      newText = newText.replace(regex, data.form_data[fieldId] ?? '');
    });
  }

  return newText;
};
  const labelToFieldId = {};
    eventFields.forEach(f => {
      labelToFieldId[f.label] = f.id;
    });

  // --- Exportação ---
  const generateSinglePDF = async (register, elementList, orientationType, fields = []) => {
    if (!window.html2canvas || !window.jspdf) {
      throw new Error("Bibliotecas de exportação ainda não carregadas.");
    }

    const container = document.createElement('div');
    container.style.width = `${canvasSize.width}px`;
    container.style.height = `${canvasSize.height}px`;
    container.style.backgroundColor = canvasBg;
    container.style.position = 'relative';
    container.style.overflow = 'hidden';

    elementList.forEach(el => {
      const div = document.createElement('div');
      div.style.position = 'absolute';
      div.style.left = `${el.x}px`;
      div.style.top = `${el.y}px`;
      div.style.transform = `rotate(${el.rotation}deg)`;
      
      if (el.type === 'text') {
        div.style.width = `${el.width}px`;
        div.style.fontSize = `${el.fontSize}px`;
        div.style.fontWeight = el.fontWeight;
        div.style.color = el.color;
        div.style.fontFamily = el.fontFamily;
        div.style.textAlign = el.textAlign;
        div.innerText = replacePlaceholders(el.content, register, fields);
      } else if (el.type === 'shape') {
        div.style.width = `${el.width}px`;
        div.style.height = `${el.height}px`;
        div.style.backgroundColor = el.color;
        div.style.borderRadius = `${el.borderRadius}px`;
      } else if (el.type === 'image') {
        const img = document.createElement('img');
        img.src = el.src;
        img.style.width = `${el.width}px`;
        img.style.height = `${el.height}px`;
        div.appendChild(img);
      }
      container.appendChild(div);
    });

    document.body.appendChild(container);
    const canvas = await window.html2canvas(container, { scale: 2 });
    document.body.removeChild(container);

    const imgData = canvas.toDataURL('image/png');
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
      orientation: orientationType,
      unit: 'px',
      format: [canvasSize.width, canvasSize.height]
    });
    pdf.addImage(imgData, 'PNG', 0, 0, canvasSize.width, canvasSize.height);
    return pdf;
  };

  const handleExportBatch = async () => {
    if (selectedRegisters.length === 0 || !window.JSZip) return;
    setIsExporting(true);
    setExportProgress(0);
    const zip = new window.JSZip();

    try {
      for (let i = 0; i < selectedRegisters.length; i++) {
        const reg = registers.find(r => r.id === selectedRegisters[i]);
        const pdf = await generateSinglePDF(reg, elements, orientation, eventFields);
        const pdfBlob = pdf.output('blob');
        const safeName = (reg.email ?? 'SemNome').replace(/\s/g, '_'); // 🔹 correção
        zip.file(`Certificado_${safeName}.pdf`, pdfBlob);
        setExportProgress(Math.round(((i + 1) / selectedRegisters.length) * 100));
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `certificados_lote_${Date.now()}.zip`;
      link.click();
    } catch (err) {
      console.error("Falha na exportação:", err);
    } finally {
      setIsExporting(false);
    }
  };

  // --- Seleção de Registros ---
  const toggleSelectAll = () => {
    if (selectedRegisters.length === filteredRegisters.length) {
      setSelectedRegisters([]);
    } else {
      setSelectedRegisters(filteredRegisters.map(r => r.id));
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedRegisters(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const filteredRegisters = registers.filter(r => {
  const searchMatch =
    r.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
    r.email?.toLowerCase().includes(filters.search.toLowerCase());

  const statusMatch =
    filters.status === "all" || r.status === filters.status;

  const presentMatch =
    filters.present === "all" ||
    String(r.present) === filters.present;

  return searchMatch && statusMatch && presentMatch;
});

const selectedElement = elements.find(el => el.id === selectedId);

  //resize
 const startResize = (e, el) => {
  setSelectedId(el.id);
  setIsResizing(true);

  const rect = canvasRef.current.getBoundingClientRect();

  let mouseX = (e.clientX - rect.left) / zoom;
  let mouseY = (e.clientY - rect.top) / zoom;

  if (visualRotation === 90) {
    const tempX = mouseX;
    mouseX = mouseY;
    mouseY = canvasSize.height - tempX;
  }

  setResizeStart({
    startX: mouseX,
    startY: mouseY,
    startWidth: el.width,
    startHeight: el.height,
  });
  };
  //save template

  const saveTemplate = async () => {
  try {
    const { data, error } = await supabase
      .from("event_certificate_templates")
      .upsert(
        [
          {
            event_id: id,       // chave única por evento
            name: "Template padrão",
            orientation,
            canvas_bg: canvasBg,
            elements
          }
        ],
        { onConflict: ["event_id"] } // se já existir, atualiza
      );

    if (error) throw error;

    alert("Template salvo com sucesso!");
  } catch (err) {
    console.error(err);
    alert("Erro ao salvar template");
  }
};


  const loadTemplate = async () => {
    const { data, error } = await supabase
      .from("event_certificate_templates")
      .select("*") 
      .eq("event_id", id)
      .single();

    if (error || !data) return;

    setElements(data.elements || []);
    setOrientation(data.orientation || "landscape");
    setCanvasBg(data.canvas_bg || "#ffffff");
  };



  return (
    <div className=" border border-slate-300 flex h-full rounded-md items-start w-full bg-slate-50 text-slate-900 font-sans overflow-hidden select-none">
      
      {/* --- Sidebar Esquerda --- */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col z-20 shadow-sm">
        <div className='m-2 '>
          <button
            onClick={saveTemplate}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white py-2 rounded-lg font-medium text-sm hover:bg-emerald-700 shadow-sm"
          >
            <Save size={16} />
            Salvar Template
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Seção Página */}
          <section>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Página</h3>
            <div className="flex gap-2">
              <button 
                onClick={() => setOrientation('landscape')}
                className={`flex-1 p-2 rounded-md border text-xs flex flex-col items-center gap-1 transition-all ${orientation === 'landscape' ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}
              >
                Paisagem
              </button>
              <button 
                onClick={() => setOrientation('portrait')}
                className={`flex-1 p-2 rounded-md border text-xs flex flex-col items-center gap-1 transition-all ${orientation === 'portrait' ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}
              >
                Retrato
              </button>
            </div>
          </section>

          {/* Seção Inserir */}
          <section>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Inserir</h3>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={addText} className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-lg text-sm hover:bg-slate-50 transition-colors">
                <Type size={16} className="text-blue-500" /> Texto
              </button>
              <button onClick={addShape} className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-lg text-sm hover:bg-slate-50 transition-colors">
                <Square size={16} className="text-orange-500" /> Forma
              </button>
              <label className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-lg text-sm hover:bg-slate-50 transition-colors cursor-pointer col-span-2">
                <ImageIcon size={16} className="text-emerald-500" /> 
                <span>Upload Imagem</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>
            </div>
          </section>

          {/* Seção Campos Dinâmicos */}
          <section>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Variáveis</h3>
            <div className="flex flex-wrap gap-1">
              {[...PLACEHOLDERS, ...eventFields.map(f => f.label)].map(key => (
                <button
                  key={key}
                  onClick={() => {
                    if (selectedId && selectedElement?.type === 'text') {
                      updateElement(selectedId, { content: selectedElement.content + ` {{${key}}}` });
                    } else {
                      const newEl = {
                        id: Date.now().toString(),
                        type: 'text',
                        content: `{{${key}}}`,
                        x: 100,
                        y: 100,
                        width: 200,
                        fontSize: 20,
                        fontWeight: 'bold',
                        color: '#000000',
                        fontFamily: 'sans-serif',
                        textAlign: 'left',
                        rotation: 0,
                      };
                      setElements([...elements, newEl]);
                      setSelectedId(newEl.id);
                    }
                  }}
                  className="px-2 py-1 bg-slate-100 border border-slate-200 rounded text-[10px] font-mono text-slate-600 hover:bg-blue-100 hover:text-blue-700 hover:border-blue-200 transition-colors"
                >
                  {key}
                </button>
              ))}
            </div>
          </section>
        </div>

        <div className="p-4 border border-slate-200 ">
          <button 
            disabled={isExporting}
            onClick={() => setSelectedRegisters(registers.map(r => r.id))}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50 shadow-sm"
          >
            {isExporting ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
            Selecionar Todos
          </button>
          {selectedRegisters.length > 0 &&
          <button 
            disabled={isExporting}
            onClick={() => setSelectedRegisters([])}
            className="w-full flex items-center justify-center gap-2 bg-slate-200 text-slate-700 py-2 rounded-lg font-medium text-sm hover:bg-slate-300 mt-2"
          >
            Limpar seleção
          </button>}
        </div>
        
        {/* --- Sidebar Direita --- */}
        <aside className="w-full bg-white border-l border-slate-200 flex flex-col z-20 shadow-sm">
          <div className="p-4 border-b border-slate-100 flex-shrink-0">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Propriedades</h3>
            
            {selectedElement ? (
              <div className="space-y-4">
                <div>
                <label className="text-xs font-medium block mb-1">Rotação</label>
                <input 
                  type="range"
                  min="0"
                  max="360"
                  value={selectedElement.rotation || 0}
                  onChange={(e) =>
                    updateElement(selectedId, { rotation: Number(e.target.value) })
                  }
                  className="w-full"
                />
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {[0, 45, 90, 135, 180, 270].map((deg) => (
                      <button
                        key={deg}
                        onClick={() =>
                          updateElement(selectedId, { rotation: deg })
                        }
                        className={`px-2 py-1 text-xs border rounded
                          ${selectedElement.rotation === deg
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white hover:bg-gray-50"
                          }`}
                      >
                        {deg}°
                      </button>
                    ))}
                  </div>
                </div>
                {selectedElement.type === 'text' || selectedElement.type === 'shape' && (
                  <>
                    <div>
                      <label className="text-xs font-medium block mb-1">Tamanho Fonte</label>
                      <input type="number" className="w-full p-2 border rounded" value={selectedElement.fontSize} onChange={(e) => updateElement(selectedId, { fontSize: parseInt(e.target.value) })} />
                    </div>
                    <div>
                      <label className="text-xs font-medium block mb-1">Cor</label>
                      <input type="color" className="w-full h-8 p-1 border rounded" value={selectedElement.color} onChange={(e) => updateElement(selectedId, { color: e.target.value })} />
                    </div>
                  </>
                )}

                <button onClick={() => deleteElement(selectedId)} className="w-full flex items-center justify-center gap-2 py-2 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100 mt-4">
                  <Trash2 size={14} /> Remover
                </button>
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 italic">Selecione um elemento para editar.</p>
            )}
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="text-xs font-semibold text-slate-400 uppercase mb-3 flex items-center gap-2">
                <Users size={14} /> Destinatários
              </h3>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 text-slate-400" size={14} />
                <input 
                  type="text"
                  placeholder="Buscar..."
                  className="w-full pl-8 pr-4 py-2 bg-slate-100 border-none rounded-md text-xs"
                  value={filters.search}
                  onChange={(e) =>
                    setFilters(prev => ({ ...prev, search: e.target.value }))
                  }
                />
                <div className="flex gap-2 mt-2">
                  <select
                    className="flex-1 text-xs p-2 bg-slate-100 rounded"
                    value={filters.status}
                    onChange={(e) =>
                      setFilters(prev => ({ ...prev, status: e.target.value }))
                    }
                  >
                    <option value="all">Todos status</option>
                    <option value="paid">Pago</option>
                    <option value="pending">Pendente</option>
                  </select>

                  <select
                    className="flex-1 text-xs p-2 bg-slate-100 rounded"
                    value={filters.present}
                    onChange={(e) =>
                      setFilters(prev => ({ ...prev, present: e.target.value }))
                    }
                  >
                    <option value="all">Todos</option>
                    <option value="true">Presentes</option>
                    <option value="false">Ausentes</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[300px]">
              {filteredRegisters.map(reg => (
                <div 
                  key={reg.id}
                  onClick={() => toggleSelectOne(reg.id)}
                  className={`p-3 border-b border-slate-50 flex items-center gap-3 cursor-pointer hover:bg-slate-50 ${selectedRegisters.includes(reg.id) ? 'bg-blue-50/30' : ''}`}
                >
                  <input type="checkbox" checked={selectedRegisters.includes(reg.id)} readOnly className="rounded text-blue-600" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-700 truncate">{reg.email}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-slate-900 text-white rounded-md">
              <button 
                disabled={selectedRegisters.length === 0 || isExporting}
                onClick={handleExportBatch}
                className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-md font-semibold text-sm flex items-center justify-center gap-3 transition-all"
              >
                {isExporting ? `Gerando ZIP (${exportProgress}%)` : `Exportar ${selectedRegisters.length} Itens`}
              </button>
            </div>
          </div>
        </aside>

      </aside>

      {/* --- Área do Canvas Central --- */}
      <main 
        className="flex-1 overflow-auto relative bg-slate-200 p-12 flex items-center justify-center"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div 
          className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur px-3 py-1 rounded-full shadow-sm border border-slate-200 text-xs font-medium text-slate-500 flex items-center gap-4 z-10"
        >
          <button
            onClick={() => setVisualRotation(prev => (prev === 0 ? 90 : 0))}
            className="hover:text-blue-600 flex items-center gap-1"
          >
            <RotateCw size={14} />
          
          </button>
          <span>A4 {orientation === 'landscape' ? '842x595' : '595x842'}px</span>
          <div className="w-[1px] h-3 bg-slate-300" />
          <div className="flex items-center gap-2">
            <button onClick={() => setZoom(Math.max(0.2, zoom - 0.1))} className="hover:text-blue-600">-</button>
            <span>{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(Math.min(2, zoom + 0.1))} className="hover:text-blue-600">+</button>
          </div>
        </div>

        {/* Canvas de Edição */}
        <div 
          ref={canvasRef}
          className="relative bg-white shadow-2xl transition-all duration-300 overflow-hidden"
          style={{
            width: `${canvasSize.width}px`,
            height: `${canvasSize.height}px`,
            backgroundColor: canvasBg,
            transform: `scale(${zoom}) rotate(${visualRotation}deg)`,
            transformOrigin: 'center center',
          }}
          onMouseDown={(e) => {
            if (e.target === canvasRef.current) {
              setSelectedId(null);
            }
          }}
        >
          {/* Guias de Snap */}
          {guides.x !== null && (
            <div className="absolute top-0 bottom-0 border-l border-blue-400 z-50 pointer-events-none" style={{ left: guides.x }} />
          )}
          {guides.y !== null && (
            <div className="absolute left-0 right-0 border-t border-blue-400 z-50 pointer-events-none" style={{ top: guides.y }} />
          )}

          {elements.map((el) => (
            <div
              key={el.id}
              onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
                handleMouseDown(e, el);
              }}
              onDoubleClick={() => el.type === 'text' && setEditingId(el.id)}
              className={`absolute cursor-move ${selectedId === el.id ? 'outline outline-2 outline-blue-500' : ''}`}
              style={{
                left: el.x,
                top: el.y,
                width: el.width,
                height: el.height,
                transform: `rotate(${el.rotation}deg)`,
                zIndex: selectedId === el.id ? 100 : 1,
              }}
            >
              {editingId === el.id &&
              <div
                  className="absolute -right-2 -bottom-2 w-4 h-4 bg-white border border-blue-500 cursor-se-resize"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    startResize(e, el);
                  }}
                />}
              {el.type === 'text' ? (
                 editingId === el.id ? (
                  <textarea
                    autoFocus
                    className="w-full bg-transparent border-none outline-none resize-none p-0 overflow-hidden leading-tight"
                    style={{
                      fontSize: `${el.fontSize}px`,
                      fontWeight: el.fontWeight,
                      color: el.color,
                      fontFamily: el.fontFamily,
                      textAlign: el.textAlign,
                      minHeight: el.fontSize,
                      cursor: 'text'
                    }}
                    value={el.content}
                    onChange={(e) => updateElement(el.id, { content: e.target.value })}
                    onBlur={() => setEditingId(null)}
                    onMouseDown={(e) => e.stopPropagation()} // 🔹 importante!
                  />
                ) : (
                  <div
                    className="w-full break-words leading-tight"
                    style={{
                      fontSize: `${el.fontSize}px`,
                      fontWeight: el.fontWeight,
                      color: el.color,
                      fontFamily: el.fontFamily,
                      textAlign: el.textAlign,
                      cursor: 'move'
                    }}
                    onDoubleClick={() => setEditingId(el.id)}
                  >
                    {replacePlaceholders(el.content, registers[0], eventFields)}
                  </div>
                )
              ) : el.type === 'shape' ? (
                <div 
                  className="w-full h-full"
                  style={{ backgroundColor: el.color, borderRadius: `${el.borderRadius}px` }}
                />
              ) : (
                <img src={el.src} className="w-full h-full object-contain pointer-events-none" draggable={false} alt="Element" />
              )}
            </div>
          ))}
        </div>
      </main>

      

      {/* Overlay de Progresso */}
      {isExporting && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[100] flex items-center justify-center">
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-xs w-full text-center">
            <h4 className="font-bold text-slate-800 mb-4">Exportando...</h4>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mb-2">
              <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${exportProgress}%` }} />
            </div>
            <p className="text-[10px] text-slate-500">{exportProgress}% concluído</p>
          </div>
        </div>
      )}
    </div>
  );
}