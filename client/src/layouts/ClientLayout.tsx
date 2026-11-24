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
  ShieldCheck,
  User,
} from 'lucide-react';

export const ClientLayout: React.FC = () => {
  const { user, logout, settings } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { to: '/client/overview', label: 'Overview', icon: LayoutDashboard },
    { to: '/client/events', label: 'My Events', icon: CalendarCheck2 },
    { to: '/client/invoices', label: 'Invoices & Pay', icon: CreditCard },
    { to: '/client/receipts', label: 'Payment Receipts', icon: Receipt },
    { to: '/client/profile', label: 'Client Profile', icon: Building2 },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800 antialiased">
      {/* TOP HEADER */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-lg shadow-sm">
              GR
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 text-sm tracking-tight sm:text-base">
                  Go_Repireo Crew
                </span>
                <span className="inline-flex items-center gap-1 text-3xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
                  <ShieldCheck className="w-3 h-3" />
                  B2B Client Portal
                </span>
              </div>
              <p className="text-3xs text-slate-500 font-medium truncate max-w-[200px] sm:max-w-xs">
                {user?.organizationName || 'Enterprise Partner'}
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* User Profile & Logout (Desktop) */}
          <div className="hidden md:flex items-center gap-3 pl-3 border-l border-slate-200">
            <div className="flex items-center gap-2.5">
              <SafeAvatar
                src={user?.photoURL}
                name={user?.displayName || 'Client User'}
                className="w-8 h-8 rounded-full border border-slate-200 ring-2 ring-blue-500/10"
              />
              <div className="text-left hidden lg:block">
                <div className="text-xs font-bold text-slate-900 leading-tight">
                  {user?.displayName || 'Client Admin'}
                </div>
                <div className="text-3xs text-slate-500 font-medium">
                  {user?.phone || user?.email || 'Authorized Representative'}
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-4 space-y-2 shadow-lg animate-in slide-in-from-top-2">
            <div className="p-3 bg-slate-50 rounded-xl mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <SafeAvatar
                  src={user?.photoURL}
                  name={user?.displayName || 'Client User'}
                  className="w-8 h-8 rounded-full border border-slate-200"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900">{user?.displayName}</div>
                  <div className="text-3xs text-slate-500">{user?.organizationName}</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="text-xs font-semibold text-red-600 flex items-center gap-1 p-1 hover:bg-red-50 rounded-lg"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Exit</span>
              </button>
            </div>

            <div className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-12">
        <Outlet />
      </main>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/98 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <nav className="grid grid-cols-5 h-16 items-center px-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center h-full transition-colors ${
                    isActive ? 'text-blue-600 font-bold' : 'text-slate-400 hover:text-slate-700 font-medium'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div
                      className={`p-1 rounded-xl transition-all ${
                        isActive ? 'bg-blue-50' : 'bg-transparent'
                      }`}
                    >
                      <Icon className={`w-4.5 h-4.5 ${isActive ? 'stroke-[2.5]' : ''}`} />
                    </div>
                    <span className="text-4xs mt-0.5 tracking-tight truncate max-w-[62px]">
                      {item.label.split(' ')[0]}
                    </span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </footer>
    </div>
  );
};
