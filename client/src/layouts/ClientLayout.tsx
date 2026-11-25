import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Home,
  CalendarCheck2,
  FileText,
  Receipt,
  User,
  LogOut,
  Bell,
} from 'lucide-react';

export const ClientLayout: React.FC = () => {
  const { user, logout, settings } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { to: '/client/overview', label: 'Home', icon: Home },
    { to: '/client/events', label: 'Events', icon: CalendarCheck2 },
    { to: '/client/invoices', label: 'Invoices', icon: FileText },
    { to: '/client/receipts', label: 'Receipts', icon: Receipt },
    { to: '/client/profile', label: 'Profile', icon: User },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="h-[100dvh] bg-slate-950 flex justify-center text-slate-800 antialiased selection:bg-blue-100 selection:text-blue-900 overflow-hidden">
      {/* MOBILE-FIRST SHELL CONTAINER (All screen sizes, no PC sidebar) */}
      <div className="w-full max-w-md bg-[#eef3f9] h-full flex flex-col shadow-2xl relative overflow-hidden">
        {/* MAIN PAGE BODY */}
        <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pb-4">
          {/* TRANSPARENT TOP HEADER (Inside scroll flow so it scrolls with hero, exact h-14 -mb-14 = 0px gap) */}
          <header className="relative z-20 px-4 h-14 flex items-center justify-between -mb-14">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-900 border border-white/25 flex items-center justify-center shrink-0 shadow-sm">
                <img
                  src={settings?.orgLogo || '/logo.png'}
                  alt={settings?.orgName || 'Go_Repireo Crew'}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm truncate">
                    {user?.organizationName || settings?.orgName || 'Client Portal'}
                  </span>
                  <span className="text-4xs font-extrabold text-white bg-[#1a63ed] px-2.5 py-0.5 rounded-full shrink-0 shadow-xs">
                    B2B
                  </span>
                </div>
                <p className="text-3xs text-blue-100/85 truncate leading-tight">
                  {user?.displayName || 'Client Portal'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => navigate('/client/events')}
                title="Notifications & Updates"
                className="p-2 rounded-xl text-white/90 hover:text-white hover:bg-white/10 transition-colors relative"
              >
                <Bell className="w-4.5 h-4.5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-orange-500" />
              </button>
              <button
                onClick={handleLogout}
                title="Sign Out"
                className="p-2 rounded-xl text-white/90 hover:text-white hover:bg-white/10 transition-colors"
              >
                <LogOut className="w-4.5 h-4.5" />
              </button>
            </div>
          </header>

          <Outlet />
        </main>

        {/* BOTTOM NAVIGATION BAR (Flex Sibling - Never Overlays Content) */}
        <footer className="shrink-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 pt-1.5 pb-2.5 px-2 shadow-[0_-6px_24px_rgba(15,23,42,0.08)]">
          <nav className="grid grid-cols-5 w-full items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.to} className="flex justify-center w-full">
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      `w-full max-w-[72px] h-[52px] flex flex-col items-center justify-center rounded-2xl transition-all duration-150 ${
                        isActive
                          ? 'bg-gradient-to-b from-[#2563eb] to-[#1d4ed8] text-white font-bold shadow-md shadow-blue-600/25'
                          : 'text-slate-500 hover:text-slate-800 font-semibold'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          className={`w-4.5 h-4.5 shrink-0 ${
                            isActive ? 'text-white stroke-[2.2]' : 'stroke-[1.9]'
                          }`}
                        />
                        <span className="text-3xs mt-0.5 tracking-tight truncate max-w-full px-0.5">
                          {item.label}
                        </span>
                      </>
                    )}
                  </NavLink>
                </div>
              );
            })}
          </nav>
        </footer>
      </div>
    </div>
  );
};
