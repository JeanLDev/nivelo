import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from '@/src/lib/supabase';
import Auth from '@/src/pages/auth/Auth';
import Sidebar from '@/src/components/Layout/Sidebar';
import { Loader2, Store } from 'lucide-react';
import storage from '@/src/utilies/storage';
import ResetPassword from '@/src/pages/auth/RecoveryPassword';

import { generateToken } from '@/src/utilies/generateTokenFirebase';
import { onMessage } from 'firebase/messaging';
import { messaging } from '@/src/lib/firebase';
import MainLobby from './pages/lobby/main';

{/**eventos */}
import DashboardEvents from './pages/Eventos/DashboardEventos'
import CreateOrEditEvent from './pages/Eventos/CreateOrEditEvent';
import AdminList from "./pages/Eventos/AdminList"
import EventPublic from "./pages/Eventos/public/EventPublic"
import PixCheckoutModal from "./pages/Eventos/public/PixCheckoutModal"
import QrCodereg from "./pages/Eventos/public/QrCodereg"
import ManagerEquipe from './pages/Equipe/ManagerEquipe';
import ManagerReunioes from './pages/Reunioes/ManagerReunioes';
import ManagerColaboradores from './pages/Colaboradores/ManagerColaboradores';


export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cargo, setCargo] = useState('')
  const [permissions, setPermissions] = useState(null)
  const [selectedEvent, setSelectedEvent] = useState({
        presencial: false,
        online: false,
    });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("🔥 Mensagem em foreground:", payload);

      const title =
        payload?.notification?.title ||
        payload?.data?.title ||
        "Nova notificação";

      const body =
        payload?.notification?.body ||
        payload?.data?.body ||
        "";

      if (Notification.permission === "granted") {
        new Notification(title, {
          body,
          icon: "/logo.png"
        });
      }
    });

    return () => unsubscribe();
  }, []);
  
  useEffect(() => {

    const checkUser = async (session) => {
      if (!session?.user?.email) return;

      const email = session.user.email;

      // verifica se já existe
      const { data: user, error } = await supabase
        .from("users")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      // se não encontrou, cria
      if (error) {
        const {error: errorD} = await supabase.from("users").insert({
          email: email,
          user_id: session.user.id
        });
        const {error: errorData} = await supabase.from("collaborators").insert({
          email: email,
          user_id: session.user.id,
          role:'Owner',
          role_id:'fab1a75c-64c9-4c99-a282-ada0404f9b56'
        });

      } else {

          const collaborator = await storage.getCollaborator()
          if (collaborator) {
            const permissionsData = await storage.getCollaboratorPermissions(collaborator.role_id)
            setPermissions(permissionsData)
          }
          setCargo(collaborator)
      } 

    };
    // sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      
      if (session) {
        checkUser(session);
      }
    });
    
    // listener de login/logout
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      
      if (session) {
        checkUser(session);
      }
    });

    return () => subscription.unsubscribe();

  }, []);
   
  useEffect(() => {
      if (session) {
        generateToken();
      }
    }, [session]);

  const ROLES = {
    OWNER: 'Owner',
    ADMIN: 'Admin',
    LOGISTICA: 'Logística',
    GERENTE: 'Gerente',
    TI: 'TI',
    PRODUCAO: 'Produção',
    MARKETING: 'Marketing',
    OPERADORPONTO:'OperadorPonto'
  } as const

  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }


  
  
 return (
  <Routes>
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route path="/event/:id" 
      element={
      <EventPublic  
      selectedEvent={selectedEvent} 
      setselectedEvent={setSelectedEvent}
      />
    }
    />
    <Route path="/ticket/:id" element={<QrCodereg />} />
    <Route path="/event/:id/checkout/:type" 
    element={<PixCheckoutModal 
    cursos={selectedEvent?.cursos} 
    selectedEvent={selectedEvent}
    />} 
    />

    {/* ROTAS PÚBLICAS */}
    {!session && (
      <>
        <Route path="/" element={<Auth />} />
        <Route path="*" element={<Navigate to="/" replace />} />
        
      </>
    )}

    {/* ROTAS PRIVADAS */}
    {session && (
      <Route
        path="/*"
        element={
          <div className="flex min-h-screen bg-slate-50 md:flex-row flex-col">
            <div className="no-printer">
              <Sidebar
                userEmail={session.user.email}
                cargo={cargo}
                permissions={permissions}
              />
            </div>  
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
              <Routes>
                <Route path="/" element={<Navigate to="/lobby" replace />} />

                {/**Eventos */}
                <Route
                  path="/eventos"
                  element={
                    <ProtectedRoute allowedRoles={[ROLES.OWNER]} cargo={cargo}>
                      <DashboardEvents />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/eventos/create"
                  element={
                    <ProtectedRoute allowedRoles={[ROLES.OWNER]} cargo={cargo}>
                      <CreateOrEditEvent user={session}/>
                    </ProtectedRoute>
                  }
                />
                 <Route
                  path="/eventos/app/:id"
                  element={
                    <ProtectedRoute allowedRoles={[ROLES.OWNER]} cargo={cargo}>
                      <AdminList user={session}/>
                    </ProtectedRoute>
                  }
                />


                {/**Equipe */}
                <Route
                  path="/equipe"
                  element={
                    <ProtectedRoute allowedRoles={[ROLES.OWNER]} cargo={cargo}>
                      <ManagerEquipe />
                    </ProtectedRoute>
                  }
                />
                {/**Reuniões */}
                <Route
                path="/reunioes"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.OWNER]} cargo={cargo}>
                    <ManagerReunioes />
                  </ProtectedRoute>
                }
                />
                {/**Colaboradores */}
                <Route
                path="/colaboradores"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.OWNER]} cargo={cargo}>
                    <ManagerColaboradores />
                  </ProtectedRoute>
                }
                />



                <Route path="*" element={<Navigate to="/lobby" replace />} />

              </Routes>
            </main>
          </div>
        }
      />
    )}
  </Routes>
);
}

function ProtectedRoute({ 
  children, 
  allowedRoles, 
  cargo 
}: {
  children: React.ReactNode
  allowedRoles: string[]
  cargo: any
}) {

  // ainda carregando (evita bloquear antes de carregar dados)
  if (!cargo) {
    return null; // ou loader
  }

  const userRole = cargo?.role;

  const isAllowed = allowedRoles.includes(userRole);

  if (!isAllowed) {
    return <Navigate to="/lobby" replace />;
  }

  return <>{children}</>;
}