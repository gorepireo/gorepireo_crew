import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  Home,
  Users,
  Plus,
  Calendar,
  CalendarCheck,
  User,
  MoreHorizontal,
  X,
  LogOut,
  ChevronRight,
  Camera,
  CheckCircle2,
  MapPin,
  BarChart3,
  UserPlus,
  Briefcase,
} from 'lucide-react';

export const LeaderLayout: React.FC = () => {
  const { logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [mobileSimulator, setMobileSimulator] = useState(() => {
    const saved = localStorage.getItem('workcrew_mobile_sim');
    return saved === null ? true : saved === 'true';
  });

  useEffect(() => {
    const handleStorage = () => {
      const saved = localStorage.getItem('workcrew_mobile_sim');
      setMobileSimulator(saved === null ? true : saved === 'true');
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('workcrew_sim_toggle', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('workcrew_sim_toggle', handleStorage);
    };
  }, []);

  const moreMenuItems = [
    {
      to: '/leader/assign-work',
      label: 'Assign Work Orders',
      icon: Briefcase,
      desc: 'Create and dispatch job orders to teams',
    },
    {
      to: '/leader/add-worker',
      label: 'Register Field Worker',
      icon: UserPlus,
      desc: 'Generate Worker ID and assign to crew',
    },
    {
      to: '/leader/evidence',
      label: 'Work & Attendance Evidence',
      icon: Camera,
      desc: 'Review worker selfies, GPS tags & photos',
    },
    {
      to: '/leader/work-monitoring',
      label: 'Work Monitoring & Proofs',
      icon: CheckCircle2,
      desc: 'Track field deliverables and completion photos',
    },
    {
      to: '/leader/locations',
      label: 'Work Locations & Sites',
      icon: MapPin,
      desc: 'View geofences and physical site radius',
    },
    {
      to: '/leader/reports',
      label: 'Performance Reports',
      icon: BarChart3,
      desc: 'Team attendance rates and shift hours',
    },
  ];

  return (
    <div className="h-[100dvh] min-h-[100dvh] bg-slate-950 flex flex-col text-slate-800 antialiased overflow-hidden">
      {/* 1. CHASSIS CENTERING CONTAINER */}
      <div className="flex-1 min-h-0 flex justify-center items-center p-0 sm:py-2 sm:px-4 overflow-hidden">
        {/* MOBILE PHONE FRAME CONTAINER */}
        <div
          className={`flex flex-col bg-[#f4f7fb] w-full h-full sm:max-w-[400px] sm:h-[844px] sm:max-h-full sm:rounded-[42px] sm:border-[8px] sm:border-slate-900 sm:shadow-2xl sm:ring-1 sm:ring-slate-800 transition-all relative overflow-hidden`}
        >
          {/* MAIN PAGE CONTENT (Scrolls cleanly inside the phone frame) */}
          <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain p-3 space-y-3">
            <Outlet />
          </main>

          {/* MOBILE 4-ITEM BOTTOM NAVIGATION BAR (Permanently Fixed Equal Grid - Zero Shifting) */}
          <footer className="sticky bottom-0 shrink-0 bg-white/98 backdrop-blur-md border-t border-slate-100 z-40 pt-1.5 pb-3 px-2 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
            <nav className="grid grid-cols-4 w-full items-center">
              {/* 1. Home Tab */}
              <div className="flex justify-center">
                <NavLink
                  to="/leader/dashboard"
                  className={({ isActive }) =>
                    `w-[76px] h-[52px] flex flex-col items-center justify-center rounded-2xl transition-colors duration-150 ${
                      isActive
                        ? 'bg-[#ede9fe] text-[#5b21b6] font-bold shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800 font-bold'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Home className={`w-5 h-5 ${isActive ? 'fill-[#5b21b6] text-[#5b21b6]' : 'stroke-[2]'}`} />
                      <span className="text-3xs mt-0.5 tracking-tight font-bold">Home</span>
                    </>
                  )}
                </NavLink>
              </div>

              {/* 2. My Team Tab */}
              <div className="flex justify-center">
                <NavLink
                  to="/leader/teams"
                  className={({ isActive }) =>
                    `w-[76px] h-[52px] flex flex-col items-center justify-center rounded-2xl transition-colors duration-150 ${
                      isActive
                        ? 'bg-[#ede9fe] text-[#5b21b6] font-bold shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800 font-bold'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Users className={`w-5 h-5 ${isActive ? 'stroke-[2.5] text-[#5b21b6]' : 'stroke-[2]'}`} />
                      <span className="text-3xs mt-0.5 tracking-tight font-bold">My Team</span>
                    </>
                  )}
                </NavLink>
              </div>

              {/* 3. Attendance Tab */}
              <div className="flex justify-center">
                <NavLink
                  to="/leader/attendance"
                  className={({ isActive }) =>
                    `w-[76px] h-[52px] flex flex-col items-center justify-center rounded-2xl transition-colors duration-150 ${
                      isActive
                        ? 'bg-[#ede9fe] text-[#5b21b6] font-bold shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800 font-bold'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <CalendarCheck className={`w-5 h-5 ${isActive ? 'stroke-[2.5] text-[#5b21b6]' : 'stroke-[2]'}`} />
                      <span className="text-3xs mt-0.5 tracking-tight font-bold">Attendance</span>
                    </>
                  )}
                </NavLink>
              </div>

              {/* 4. Profile Tab */}
              <div className="flex justify-center">
                <NavLink
                  to="/leader/profile"
                  className={({ isActive }) =>
                    `w-[76px] h-[52px] flex flex-col items-center justify-center rounded-2xl transition-colors duration-150 ${
                      isActive
                        ? 'bg-[#ede9fe] text-[#5b21b6] font-bold shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800 font-bold'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <User className={`w-5 h-5 ${isActive ? 'stroke-[2.5] text-[#5b21b6]' : 'stroke-[2]'}`} />
                      <span className="text-3xs mt-0.5 tracking-tight font-bold">Profile</span>
                    </>
                  )}
                </NavLink>
              </div>
            </nav>
          </footer>

          {/* MOBILE "MORE" BOTTOM ACTION SHEET / DRAWER */}
          {moreMenuOpen && (
            <div className="absolute inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
              <div
                className="absolute inset-0"
                onClick={() => setMoreMenuOpen(false)}
              />
              <div
                className="relative w-full bg-white rounded-t-3xl shadow-2xl p-4 z-10 space-y-3 max-h-[85%] overflow-y-auto animate-in slide-in-from-bottom duration-200"
              >
                <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto -mt-1 mb-2" />

                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                    <h3 className="text-xs font-black text-slate-900">Leader Quick Operations</h3>
                  </div>
                  <button
                    onClick={() => setMoreMenuOpen(false)}
                    className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-1.5">
                  {moreMenuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => setMoreMenuOpen(false)}
                        className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 hover:bg-blue-50/70 border border-slate-100 transition-all text-left group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-xl bg-white shadow-2xs text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-800 block">
                              {item.label}
                            </span>
                            <span className="text-3xs text-slate-500">{item.desc}</span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                      </NavLink>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setMoreMenuOpen(false);
                      logout();
                      navigate('/login');
                    }}
                    className="w-full py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors flex items-center justify-center gap-2 border border-rose-200"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out from Leader Portal
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
