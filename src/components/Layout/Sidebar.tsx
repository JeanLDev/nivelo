import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  LogOut, 
  ChevronLeft, 
  Menu,
  HeartPulse,
  Ticket,
  Users,
  Book,
  Handshake,
  DollarSign
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useLocation } from 'react-router-dom';



function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidebarProps {
  userEmail: string | undefined;
  cargo:object;
}



export default function Sidebar({ userEmail,cargo }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false); // mobile
  const location = useLocation();
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


  const menuItems = [
    {
      id:'equipe',
      path: '/equipe',
      label: 'Integrantes',
      icon: Users,
      allowedRoles: [ROLES.OWNER],
      subPath: [
        { 
          id: 'horas', 
          path: '/equipe/horas', 
          label: 'Banco de horas',
          allowedRoles: [ROLES.OWNER]
        },
        { 
          id: 'pagamentos', 
          path: '/equipe/pagamentos', 
          label: 'Pagamentos',
          allowedRoles: [ROLES.OWNER]
        }
      ]
    },
    {
      id:'financeiro',
      path: '/financeiro',
      label: 'Financeiro',
      icon: DollarSign,
      allowedRoles: [ROLES.OWNER]
    },
    {
      id:'reunioes',
      path: '/reunioes',
      label: 'Reuniões',
      icon: Book,
      allowedRoles: [ROLES.OWNER],
      subPath: [
      { 
        id: 'atas', 
        path: '/reunioes', 
        label: 'Atas',
        allowedRoles: [ROLES.OWNER]
      },
      { 
        id: 'presença', 
        path: '/presenca', 
        label: 'Presença',
        allowedRoles: [ROLES.OWNER]
      },
    ]
    },
    {
      id:'colaboradores',
      path: '/colaboradores',
      label: 'Colaboradores',
      icon: Handshake,
      allowedRoles: [ROLES.OWNER]
    },
    {
    id:'eventos',
    path: '/eventos',
    label: 'Eventos',
    icon: Ticket,
    allowedRoles: [ROLES.OWNER],
  }
];

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };
  const isMenuActive = (item) => {
  if (location.pathname.startsWith(item.path)) return true;

  if (item.subPath) {
    return item.subPath.some(sub =>
      location.pathname.startsWith(sub.path)
    );
  }

  return false;
};
const filteredMenuItems = menuItems.filter(item =>
  item.allowedRoles?.includes(cargo?.role)
)

  return (
  <>
    {/* BOTÃO MOBILE FIXO */}
    <button
      onClick={() => setIsMobileOpen(true)}
      className="md:hidden absolute top-4 left-4 z-50 bg-white p-2 rounded-md "
    >
      <Menu className="w-6 h-6" />
    </button>

    {/* OVERLAY MOBILE */}
    {isMobileOpen && (
      <div
        className="fixed inset-0 bg-black/40 z-40 md:hidden"
        onClick={() => setIsMobileOpen(false)}
      />
    )}

    <aside
      className={cn(
        "bg-white border-r border-slate-200 flex flex-col transition-all duration-300 h-screen top-0 z-50",

        // 📱 Mobile
        "fixed md:sticky",
        isMobileOpen ? "translate-x-0" : "-translate-x-full",
        "md:translate-x-0",

        // 💻 Desktop width
        isCollapsed ? "md:w-20" : "md:w-64",
        "w-64"
      )}
    >
      <div className="p-4 border-b border-slate-200 flex items-center justify-between w-full">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="bg-green-900 p-1.5 rounded-md">
              <Link 
              to="/lobby">
                <HeartPulse className="w-5 h-5 text-white" />
              </Link>
            </div>
            <span className="font-bold text-slate-900 truncate">Nivelo</span>
          </div>
        )}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 hidden md:block hover:bg-slate-100 rounded-md text-slate-500 transition-colors mx-auto"
        >
          {isCollapsed ? <Menu className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {filteredMenuItems.map((item) => {
          const isActive = isMenuActive(item);

          return (
            <div key={item.id}>
              <NavLink
                to={item.path}
                className={cn(
                  "w-full flex items-center gap-3 p-2.5 rounded-md transition-all group",
                  isActive
                    ? "bg-green-50 text-green-600"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <item.icon
                  className={cn(
                    "w-5 h-5 shrink-0",
                    isActive
                      ? "text-green-600"
                      : "text-slate-400 group-hover:text-slate-600"
                  )}
                />
                {!isCollapsed && (
                  <span className=" text-sm truncate">
                    {item.label}
                  </span>
                )}
      </NavLink>

      {/* Renderizar submenus */}
      {!isCollapsed && item.subPath && isActive && (
        <div className="ml-8 mt-1 space-y-1">
          {item.subPath
          .filter(sub => sub.allowedRoles?.includes(cargo?.role))
          .map((sub) => {
            const isSubActive = location.pathname.startsWith(sub.path);

            return (
              <NavLink
                key={sub.id}
                to={sub.path}
                className={cn(
                  "block text-sm px-2 py-1 rounded-md transition-colors",
                  isSubActive
                    ? "text-green-600 "
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                {sub.label}
              </NavLink>
            );
          })}
        </div>
      )}
    </div>
  );
})}
      </nav>

      <div className="p-2 border-t border-slate-200">
        <button
          className={cn(
            "w-full flex items-center gap-3 rounded-xl p-3 transition-all ",
            isCollapsed ? "justify-center" : "justify-between"
          )}
        >
          <div className="flex items-center gap-3 min-w-0">
            

            {!isCollapsed && (
              <div className="text-left min-w-0">
                <p className="text-sm  text-slate-800 truncate">
                  {userEmail}
                </p>

                {cargo?.role && (
                  <p className="text-xs text-green-600 font-medium">
                    {cargo.role}
                  </p>
                )}
              </div>
            )}
          </div>

          {!isCollapsed && (
            <LogOut onClick={handleLogout} className="w-4 h-4 text-red-500 shrink-0 hover:bg-slate-100" />
          )}
        </button>
      </div>
    </aside>
    <Menu className="md:hidden m-4 "/>
    </>
  );
}
