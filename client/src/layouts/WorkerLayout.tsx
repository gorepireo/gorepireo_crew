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

  useEffect(() => {
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#f4f7fb');
  }, []);

  return (
    <div className="h-[100dvh] pt-[env(safe-area-inset-top)] bg-[#f4f7fb] flex justify-center text-slate-800 antialiased selection:bg-blue-100 selection:text-blue-900 overflow-hidden">
      {/* MOBILE SHELL CONTAINER - Centered on desktop, full-width responsive on mobile */}
      <div className="w-full max-w-md bg-[#f4f7fb] h-full flex flex-col shadow-2xl relative overflow-hidden">
        {/* MAIN PAGE BODY (Scrolls cleanly with zero horizontal overflow) */}
        <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-none p-3.5 sm:p-4 space-y-3.5 pb-4">
          <Outlet />
        </main>

        {/* BOTTOM NAVIGATION BAR (Flex Sibling - Never Overlays Content) */}
        <footer className="shrink-0 z-40 bg-white/98 backdrop-blur-md border-t border-slate-200/80 pt-1.5 pb-[calc(0.75rem+env(safe-area-inset-bottom))] px-2 shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
          <nav className="grid grid-cols-4 w-full items-center gap-1">
              {/* 1. Home Tab */}
              <div className="flex justify-center w-full">
                <NavLink
                  to="/worker/home"
                  className={({ isActive }) =>
                    `w-full max-w-[84px] h-[52px] flex flex-col items-center justify-center rounded-2xl transition-colors duration-150 ${
                      isActive
                        ? 'text-[#3548e6] font-bold bg-[#edf2fe]'
                        : 'text-slate-500 hover:text-slate-800 font-bold'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Home className={`w-4.5 h-4.5 shrink-0 ${isActive ? 'fill-[#3548e6] text-[#3548e6]' : ''}`} />
                      <span className="text-3xs mt-0.5 tracking-tight font-bold truncate max-w-full px-0.5">{t('nav_home')}</span>
                    </>
                  )}
                </NavLink>
              </div>

              {/* 2. My Work Tab */}
              <div className="flex justify-center w-full">
                <NavLink
                  to="/worker/work"
                  className={({ isActive }) =>
                    `w-full max-w-[84px] h-[52px] flex flex-col items-center justify-center rounded-2xl transition-colors duration-150 ${
                      isActive
                        ? 'text-[#3548e6] font-bold bg-[#edf2fe]'
                        : 'text-slate-500 hover:text-slate-800 font-bold'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Briefcase className={`w-4.5 h-4.5 shrink-0 ${isActive ? 'stroke-[2.5]' : ''}`} />
                      <span className="text-3xs mt-0.5 tracking-tight font-bold truncate max-w-full px-0.5">{t('nav_my_work')}</span>
                    </>
                  )}
                </NavLink>
              </div>

              {/* 3. Attendance Tab */}
              <div className="flex justify-center w-full">
                <NavLink
                  to="/worker/attendance"
                  className={({ isActive }) =>
                    `w-full max-w-[84px] h-[52px] flex flex-col items-center justify-center rounded-2xl transition-colors duration-150 ${
                      isActive
                        ? 'text-[#3548e6] font-bold bg-[#edf2fe]'
                        : 'text-slate-500 hover:text-slate-800 font-bold'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <CalendarCheck className={`w-4.5 h-4.5 shrink-0 ${isActive ? 'stroke-[2.5]' : ''}`} />
                      <span className="text-3xs mt-0.5 tracking-tight font-bold truncate max-w-full px-0.5">{t('nav_attendance')}</span>
                    </>
                  )}
                </NavLink>
              </div>

              {/* 4. Profile Tab */}
              <div className="flex justify-center w-full">
                <NavLink
                  to="/worker/profile"
                  className={({ isActive }) =>
                    `w-full max-w-[84px] h-[52px] flex flex-col items-center justify-center rounded-2xl transition-colors duration-150 ${
                      isActive
                        ? 'text-[#3548e6] font-bold bg-[#edf2fe]'
                        : 'text-slate-500 hover:text-slate-800 font-bold'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <User className={`w-4.5 h-4.5 shrink-0 ${isActive ? 'stroke-[2.5]' : ''}`} />
                      <span className="text-3xs mt-0.5 tracking-tight font-bold truncate max-w-full px-0.5">{t('nav_profile')}</span>
                    </>
                  )}
                </NavLink>
              </div>
            </nav>
        </footer>
      </div>
    </div>
  );
};
