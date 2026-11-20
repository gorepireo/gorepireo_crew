import React, { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import {
  Home,
  Briefcase,
  CalendarCheck,
  User,
} from 'lucide-react';

export const WorkerLayout: React.FC = () => {
  const { t } = useLanguage();

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

  return (
    <div className="h-[100dvh] min-h-[100dvh] bg-slate-950 flex flex-col text-slate-800 antialiased overflow-hidden">
      {/* 1. CHASSIS CENTERING CONTAINER */}
      <div className="flex-1 min-h-0 flex justify-center items-center p-0 sm:py-2 sm:px-4 overflow-hidden">
        {/* MOBILE PHONE FRAME CONTAINER */}
        <div
          className={`flex flex-col bg-[#f4f7fb] w-full h-full sm:max-w-[400px] sm:h-[844px] sm:max-h-full sm:rounded-[42px] sm:border-[8px] sm:border-slate-900 sm:shadow-2xl sm:ring-1 sm:ring-slate-800 transition-all relative overflow-hidden`}
        >
          {/* MAIN PAGE BODY (Scrolls cleanly inside the phone frame) */}
          <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-3 pt-4 space-y-3">
            <Outlet />
          </main>

          {/* BOTTOM NAVIGATION BAR (Permanently Fixed Equal 4-Column Grid - Zero Shifting) */}
          <footer className="sticky bottom-0 shrink-0 bg-white/98 backdrop-blur-md border-t border-slate-100 z-40 pt-1.5 pb-3 px-2 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
            <nav className="grid grid-cols-4 w-full items-center">
              {/* 1. Home Tab */}
              <div className="flex justify-center">
                <NavLink
                  to="/worker/home"
                  className={({ isActive }) =>
                    `w-[76px] h-[52px] flex flex-col items-center justify-center rounded-2xl transition-colors duration-150 ${
                      isActive
                        ? 'text-[#3548e6] font-bold bg-[#edf2fe]'
                        : 'text-slate-500 hover:text-slate-800 font-bold'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Home className={`w-4.5 h-4.5 ${isActive ? 'fill-[#3548e6] text-[#3548e6]' : ''}`} />
                      <span className="text-3xs mt-0.5 tracking-tight font-bold">{t('nav_home')}</span>
                    </>
                  )}
                </NavLink>
              </div>

              {/* 2. My Work Tab */}
              <div className="flex justify-center">
                <NavLink
                  to="/worker/work"
                  className={({ isActive }) =>
                    `w-[76px] h-[52px] flex flex-col items-center justify-center rounded-2xl transition-colors duration-150 ${
                      isActive
                        ? 'text-[#3548e6] font-bold bg-[#edf2fe]'
                        : 'text-slate-500 hover:text-slate-800 font-bold'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Briefcase className={`w-4.5 h-4.5 ${isActive ? 'stroke-[2.5]' : ''}`} />
                      <span className="text-3xs mt-0.5 tracking-tight font-bold">{t('nav_my_work')}</span>
                    </>
                  )}
                </NavLink>
              </div>

              {/* 3. Attendance Tab */}
              <div className="flex justify-center">
                <NavLink
                  to="/worker/attendance"
                  className={({ isActive }) =>
                    `w-[76px] h-[52px] flex flex-col items-center justify-center rounded-2xl transition-colors duration-150 ${
                      isActive
                        ? 'text-[#3548e6] font-bold bg-[#edf2fe]'
                        : 'text-slate-500 hover:text-slate-800 font-bold'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <CalendarCheck className={`w-4.5 h-4.5 ${isActive ? 'stroke-[2.5]' : ''}`} />
                      <span className="text-3xs mt-0.5 tracking-tight font-bold">{t('nav_attendance')}</span>
                    </>
                  )}
                </NavLink>
              </div>

              {/* 4. Profile Tab */}
              <div className="flex justify-center">
                <NavLink
                  to="/worker/profile"
                  className={({ isActive }) =>
                    `w-[76px] h-[52px] flex flex-col items-center justify-center rounded-2xl transition-colors duration-150 ${
                      isActive
                        ? 'text-[#3548e6] font-bold bg-[#edf2fe]'
                        : 'text-slate-500 hover:text-slate-800 font-bold'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <User className={`w-4.5 h-4.5 ${isActive ? 'stroke-[2.5]' : ''}`} />
                      <span className="text-3xs mt-0.5 tracking-tight font-bold">{t('nav_profile')}</span>
                    </>
                  )}
                </NavLink>
              </div>
            </nav>
          </footer>
        </div>
      </div>
    </div>
  );
};
