import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  CalendarCheck2,
  CreditCard,
  Receipt,
  User,
  LogOut,
} from 'lucide-react';

export const ClientLayout: React.FC = () => {
  const { user, logout, settings } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { to: '/client/overview', label: 'Home', icon: LayoutDashboard },
    { to: '/client/events', label: 'Events', icon: CalendarCheck2 },
    { to: '/client/invoices', label: 'Invoices', icon: CreditCard },
    { to: '/client/receipts', label: 'Receipts', icon: Receipt },
    { to: '/client/profile', label: 'Profile', icon: User },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex justify-center text-slate-800 antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* MOBILE-FIRST SHELL CONTAINER (Same on all screen sizes, no PC sidebar) */}
      <div className="w-full max-w-md bg-[#f4f7fb] min-h-screen flex flex-col shadow-2xl relative overflow-x-hidden">
        {/* COMPACT MOBILE HEADER */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 h-14 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl overflow-hidden bg-slate-950 border border-slate-200/80 flex items-center justify-center shrink-0">
              <img
                src={settings?.orgLogo || '/logo.png'}
                alt={settings?.orgName || 'Go_Repireo Crew'}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 text-xs truncate">
                  {user?.organizationName || 'Apex Corporate Towers'}
                </span>
                <span className="text-4xs font-bold text-[#3548e6] bg-[#edf2fe] px-1.5 py-0.5 rounded-full shrink-0">
                  B2B
                </span>
              </div>
              <p className="text-4xs text-slate-500 truncate">
                {user?.displayName || 'Client Portal'}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </header>

        {/* MAIN PAGE BODY (Scrolls cleanly with zero horizontal overflow) */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 sm:p-4 space-y-3.5 pb-24">
          <Outlet />
        </main>

        {/* BOTTOM NAVIGATION BAR (Fixed 5-Column Fluid Grid on All Screen Sizes) */}
        <footer className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pointer-events-none">
          <div className="w-full max-w-md bg-white/98 backdrop-blur-md border-t border-slate-200/80 pt-1.5 pb-3 px-1.5 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] pointer-events-auto">
            <nav className="grid grid-cols-5 w-full items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.to} className="flex justify-center w-full">
                    <NavLink
                      to={item.to}
                      className={({ isActive }) =>
                        `w-full max-w-[72px] h-[52px] flex flex-col items-center justify-center rounded-2xl transition-colors duration-150 ${
                          isActive
                            ? 'text-[#3548e6] font-bold bg-[#edf2fe]'
                            : 'text-slate-500 hover:text-slate-800 font-bold'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon
                            className={`w-4.5 h-4.5 shrink-0 ${
                              isActive ? 'text-[#3548e6] stroke-[2.4]' : ''
                            }`}
                          />
                          <span className="text-3xs mt-0.5 tracking-tight font-bold truncate max-w-full px-0.5">
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
