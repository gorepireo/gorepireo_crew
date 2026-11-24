import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SafeAvatar } from '../components/common/SafeAvatar';
import {
  LayoutDashboard,
  CalendarCheck2,
  CreditCard,
  Receipt,
  Building2,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

export const ClientLayout: React.FC = () => {
  const { user, logout, settings } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { to: '/client/overview', label: 'Overview', icon: LayoutDashboard },
    { to: '/client/events', label: 'My Events', icon: CalendarCheck2 },
    { to: '/client/invoices', label: 'Payments & Invoices', icon: CreditCard },
    { to: '/client/receipts', label: 'Payment History & Receipts', icon: Receipt },
    { to: '/client/profile', label: 'Profile', icon: Building2 },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      <div className="flex-1 flex flex-col lg:flex-row min-w-0 overflow-x-hidden">
        {/* DESKTOP SIDEBAR (Matches Admin Console) */}
        <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 shrink-0">
          <div className="p-5 border-b border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-950 border border-slate-200/80 flex items-center justify-center shadow-xs shrink-0">
              <img
                src={settings?.orgLogo || '/logo.png'}
                alt={settings?.orgName || 'Go_Repireo Crew'}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="overflow-hidden">
              <h1 className="font-bold text-slate-900 text-sm truncate">
                {user?.organizationName || settings?.orgName || 'Go_Repireo Crew'}
              </h1>
              <span className="text-2xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full inline-block">
                B2B Client Portal
              </span>
            </div>
          </div>

          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-semibold shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="p-3 border-t border-slate-100">
            <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 border border-slate-200/60 mb-2">
              <SafeAvatar
                src={user?.photoURL}
                name={user?.displayName || 'Client'}
                className="w-8 h-8"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate">
                  {user?.displayName || 'Client User'}
                </p>
                <p className="text-2xs text-slate-500 truncate">
                  {user?.email || user?.phone || 'client@apextowers.com'}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* MOBILE HEADER (Matches Admin Console) */}
        <div className="lg:hidden w-full flex flex-col">
          <header className="h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between sticky top-0 z-30">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 shrink-0"
                aria-label="Toggle Menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <div className="w-7 h-7 rounded-lg overflow-hidden bg-slate-950 border border-slate-200 shrink-0">
                <img
                  src={settings?.orgLogo || '/logo.png'}
                  alt="Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="font-bold text-slate-900 text-sm truncate">
                {user?.organizationName || 'B2B Client Portal'}
              </span>
            </div>
            <span className="text-xs font-medium text-slate-500 truncate max-w-[120px]">
              {user?.displayName}
            </span>
          </header>

          {/* MOBILE SLIDE-DOWN DRAWER */}
          {mobileMenuOpen && (
            <div className="bg-white border-b border-slate-200 p-4 space-y-1 shadow-md z-40">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 font-semibold'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}

              <div className="pt-2 mt-2 border-t border-slate-100">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* MAIN OUTLET */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
