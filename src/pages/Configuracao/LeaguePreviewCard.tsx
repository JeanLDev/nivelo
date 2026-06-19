import { useEffect, useState } from "react";
import { Mail, Instagram, User } from "lucide-react";
import { supabase } from "../../lib/supabase";
import storage from "@/src/utilies/storage"

export function LeaguePreviewCard() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchBanner = async() => {

        const collab = await storage.getCollaborator()

        const {data} = await supabase
        .from('academic_leagues')
        .select('*')
        .eq('user_id', collab?.user_id)
        .single()

        return data || null
    }

    useEffect(() => {
        const load = async () => {
        try {
            setLoading(true);
            const result = await fetchBanner();
            setData(result);
        } finally {
            setLoading(false);
        }
        };

        load()
    }, []);

    if (loading) {
        return (
        <div className="border rounded-xl p-6 max-w-sm mx-auto animate-pulse">
            Carregando...
        </div>
        );
    }

    if (!data) return null;

    const {
        area,
        photo_url,
        name,
        institution,
        bio,
        email,
        instagram,
    } = data;

    return (
        <div className="h-screen w-full bg-[#c1ffde] flex justify-between items-center">
          <div className=" overflow-hidden flex flex-col items-center transition-shadow duration-300 max-w-sm mx-auto">
          
            <div className="h-[200px] w-[200px] rounded-full overflow-hidden border-4 border-white bg-slate-50 shadow-sm">
              {photo_url ? (
                <img
                  src={photo_url}
                  alt="Logo"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=400";
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                  <User className="w-6 h-6" />
                </div>
              )}
            </div>
              {/* Header */}
              <div className="mt-4 relative flex items-end px-4">
                  <span className=" text-3xl font-semibold  px-2 py-0.5 rounded-lg fotn-sans">
                    {name || "Nome da Liga"}
                  </span>
              </div>
          
                <div className="px-5 pb-6 pt-1 relative">
          {/* Avatar */}
          <div className="absolute -top-10 left-4">
          </div>
          {/* Conteúdo */}
          <div className="mt-8 space-y-3">
            <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
              {bio || "Biografia não informada."}
            </p>
            <div className="border-t border-slate-100 my-2" />
            {/* Contatos */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              {email && (
                <a
                  href={`mailto:${email}`}
                  className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-emerald-700"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[120px]">{email}</span>
                </a>
              )}
              {instagram && (
                <a
                  href={`https://instagram.com/${instagram}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-emerald-700"
                >
                  <Instagram className="w-3.5 h-3.5" />
                  @{instagram}
                </a>
              )}
            </div>
          </div>
                </div>
          </div>
        </div>
  );
}