import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Settings, 
  Sparkles, 
  Camera, 
  User, 
  Check, 
  AlertCircle, 
  Database, 
  Copy,
  Info,
  ChevronRight,
  BookOpen,
  Mail,
  Instagram,
  ExternalLink
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import storage from "@/src/utilies/storage"

// Interfaces para os dados da Liga Acadêmica
interface AcademicLeague {
  id?: string;
  name: string;
  bio: string;
  photo_url: string;
  area: string;
  email: string;
  instagram: string;
  institution: string;
  primary_color: string;
  user_id: string
}

export default function App() {
  // Estados para o formulário e configuração
  const [name, setName] = useState('Liga Acadêmica de Cardiologia');
  const [bio, setBio] = useState('Promovendo o ensino, pesquisa e extensão na área cardiovascular. Realizamos discussões de casos, simpósios e ações na comunidade.');
  const [photoUrl, setPhotoUrl] = useState('https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=400');
  const [area, setArea] = useState('Medicina');
  const [email, setEmail] = useState('lacardio@email.com');
  const [instagram, setInstagram] = useState('lacardio.uf');
  const [institution, setInstitution] = useState('Universidade Federal');
  
  // Estado para feedback visual das ações
  const [saveStatus, setSaveStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');


  // Função fictícia de simulação de envio ao Supabase
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus('loading');
    
    // Simulando chamada de API para o Supabase
    try {
      const collab = await storage.getCollaborator()
      const payload: AcademicLeague = {
          name,
          bio,
          photo_url: photoUrl,
          area,
          email,
          instagram,
          institution,
          primary_color: '#dcfce7',
          user_id:collab?.user_id
      };
    
    

    const { error } = await supabase
    .from("academic_leagues")
    .upsert(payload, {
      onConflict: "user_id",
    });

    if (error) {
      return console.error(error)
    }
    console.log('Dados salvos no Supabase:', payload);


    setSaveStatus('success');
    
    setSaveStatus('idle');

    } catch (error) {
    setSaveStatus('error');
    }
  };

  const copyToClipboard = (text: string) => {
    // Usando a API alternativa recomendada
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
    } catch (err) {
      console.error('Erro ao copiar', err);
    }
    document.body.removeChild(textarea);
  };

  return (
    <div className="min-h-screen bg-[#fcfdfa] text-slate-800 font-sans selection:bg-emerald-100 selection:text-emerald-900 pb-16">
      {/* Topo do Painel */}
      <header className="border-b border-emerald-100 bg-white sticky top-0 z-10 backdrop-blur-md bg-opacity-90">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Settings className="w-6 h-6 stroke-[1.5]" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-slate-900">Configurador de Liga</h1>
              <p className="text-sm text-slate-500">Crie seu perfil</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        

        {/* Layout Principal: Formulário / Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Formulário de Configuração - Ocupa 7 colunas */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <h2 className="text-base font-semibold text-slate-900">Dados da sua Liga Acadêmica</h2>
            </div>

            <form onSubmit={handleSave} className="space-y-5">
              
              {/* Nome da Liga */}
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1.5">
                  Nome da Liga Acadêmica
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Liga Acadêmica de Cirurgia"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 focus:bg-white transition-all text-slate-800"
                />
              </div>

              {/* Grid de 2 colunas para Instituição e Área */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1.5">
                    Instituição de Ensino
                  </label>
                  <input
                    type="text"
                    required
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="Ex: UFBA, USP, UNICAMP"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 focus:bg-white transition-all text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1.5">
                    Área Temática
                  </label>
                  <input
                    type="text"
                    required
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="Ex: Medicina, Enfermagem"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 focus:bg-white transition-all text-slate-800"
                  />
                </div>
              </div>

              {/* URL da Foto de Perfil */}
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1.5 flex items-center justify-between">
                  <span>URL da Foto da Liga</span>
                  <span className="text-[10px] text-slate-400 font-normal">Insira um link de imagem (Unsplash, Imgur, etc.)</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Camera className="w-4 h-4" />
                  </span>
                  <input
                    type="url"
                    required
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 focus:bg-white transition-all text-slate-800"
                  />
                </div>
                <div className="mt-1 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPhotoUrl('https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=400')}
                    className="text-[11px] text-emerald-700 hover:underline"
                  >
                    Usar foto médica padrão
                  </button>
                  <span className="text-slate-300 text-[11px]">•</span>
                  <button
                    type="button"
                    onClick={() => setPhotoUrl('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=400')}
                    className="text-[11px] text-emerald-700 hover:underline"
                  >
                    Usar foto tecnologia/saúde
                  </button>
                </div>
              </div>

              {/* Biografia / Descrição curta */}
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1.5 flex items-center justify-between">
                  <span>Biografia da Liga</span>
                  <span className="text-[10px] text-slate-400 font-normal">{bio.length}/200 caracteres</span>
                </label>
                <textarea
                  required
                  maxLength={200}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Escreva um resumo rápido sobre as atividades e objetivos da liga..."
                  rows={4}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 focus:bg-white transition-all text-slate-800 resize-none leading-relaxed"
                />
              </div>

              {/* Contatos / Redes Sociais */}
              <div className="bg-emerald-50/40 p-4 rounded-xl border border-emerald-100/50 space-y-4">
                <span className="block text-sm font-semibold text-emerald-900">Canais de Contato e Redes</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-emerald-800 mb-1">
                      E-mail de contato
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="liga@dominio.com"
                      className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 transition-all text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-emerald-800 mb-1">
                      Instagram (sem o @)
                    </label>
                    <input
                      type="text"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      placeholder="nomedaliga"
                      className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 transition-all text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Botão de Envio */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saveStatus === 'loading'}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold rounded-xl text-sm transition-all shadow-sm disabled:opacity-70"
                >
                  {saveStatus === 'loading' ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Salvando</span>
                    </>
                  ) : saveStatus === 'success' ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Salvo com Sucesso!</span>
                    </>
                  ) : (
                    <>
                      <span>Salvar</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>

          {/* Área de Preview Interativo - Ocupa 5 colunas */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
            
            <div className="">
              
              {/* COMPONENTE DO CARD REUTILIZÁVEL */}
              <div className="border border-emerald-100 bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 max-w-sm mx-auto">
                
                {/* Header do Card (Verde Claro) */}
                <div className="h-16 bg-[#eafaf1] relative flex items-end px-4">
                  <span className="absolute top-3 right-3 text-[10px] font-semibold text-emerald-800 bg-emerald-200/50 px-2 py-0.5 rounded-lg">
                    {area || 'Área'}
                  </span>
                </div>

                <div className="px-5 pb-6 pt-1 relative">
                  {/* Avatar / Foto */}
                  <div className="absolute -top-10 left-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden border-4 border-white bg-slate-50 shadow-sm">
                      {photoUrl ? (
                        <img 
                          src={photoUrl} 
                          alt="Logo da liga" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback caso a imagem quebre
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=400';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                          <User className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Detalhes do Nome e Bio */}
                  <div className="mt-8 space-y-3">
                    <div>
                      <h4 className="text-base font-semibold text-slate-900 leading-tight">
                        {name || 'Nome da Liga'}
                      </h4>
                      <p className="text-sm text-emerald-700 font-medium">
                        {institution || 'Instituição de Ensino'}
                      </p>
                    </div>

                    <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
                      {bio || 'Uma biografia amigável sobre os ideais, publicações e reuniões da sua liga acadêmica.'}
                    </p>

                    {/* Divisor */}
                    <div className="border-t border-slate-100 my-2" />

                    {/* Links Sociais e de Contato */}
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      {email && (
                        <a 
                          href={`mailto:${email}`} 
                          title={email}
                          className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-emerald-700 transition-colors"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span className="max-w-[120px] truncate">{email}</span>
                        </a>
                      )}

                      {instagram && (
                        <a 
                          href={`https://instagram.com/${instagram}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-emerald-700 transition-colors"
                        >
                          <Instagram className="w-3.5 h-3.5" />
                          <span>@{instagram}</span>
                        </a>
                      )}
                    </div>
                  </div>

                </div>
              </div>
              {/* FIM DO COMPONENTE CARD REUTILIZÁVEL */}

            </div>


          </div>

        </div>
      </main>
    </div>
  );
}