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
    <div className="min-h-screen bg-slate-950 flex justify-center text-slate-800 antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* MOBILE-FIRST SHELL CONTAINER (All screen sizes, no PC sidebar) */}
      <div className="w-full max-w-md bg-[#eef3f9] min-h-screen flex flex-col shadow-2xl relative overflow-x-hidden">
        {/* TOP DARK-NAVY APP BAR */}
        <header className="sticky top-0 z-30 bg-[#0b1b3d]/95 backdrop-blur-md px-4 h-14 flex items-center justify-between shrink-0 border-b border-white/10">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl overflow-hidden bg-slate-900 border border-white/20 flex items-center justify-center shrink-0 shadow-xs">
              <img
                src={settings?.orgLogo || '/logo.png'}
                alt={settings?.orgName || 'Go_Repireo Crew'}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white text-xs truncate">
                  {user?.organizationName || 'Apex Corporate Towers'}
                </span>
                <span className="text-4xs font-bold text-blue-100 bg-white/15 px-1.5 py-0.5 rounded-md shrink-0">
                  B2B
                </span>
              </div>
              <p className="text-4xs text-blue-200/80 truncate">
                {user?.displayName || 'Client Portal'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => navigate('/client/events')}
              title="Notifications & Updates"
              className="p-2 rounded-xl text-blue-100 hover:text-white hover:bg-white/10 transition-colors relative"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-orange-500 ring-2 ring-[#0b1b3d]" />
            </button>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-2 rounded-xl text-blue-100 hover:text-white hover:bg-white/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* MAIN PAGE BODY */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden pb-24">
          <Outlet />
        </main>

        {/* BOTTOM NAVIGATION BAR (Fixed 5-Column Fluid Grid with Royal Blue Active Pill) */}
        <footer className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pointer-events-none">
          <div className="w-full max-w-md bg-white/95 backdrop-blur-md border-t border-slate-200/80 pt-1.5 pb-2.5 px-2 shadow-[0_-6px_24px_rgba(15,23,42,0.08)] pointer-events-auto">
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
          </div>
        </footer>
      </div>
    </div>
  );
};
