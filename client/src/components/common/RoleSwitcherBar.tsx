import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Shield,
  Users,
  UserCheck,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  LogOut,
  Smartphone,
  Monitor,
} from 'lucide-react';

export const RoleSwitcherBar: React.FC = () => {
  const { user, role, switchRole, logout, refreshMe } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Mobile frame simulator mode for desktop evaluators (Default TRUE so Worker & Leader show mobile UI immediately)
  const [mobileSimulator, setMobileSimulator] = useState(() => {
    const saved = localStorage.getItem('workcrew_mobile_sim');
    return saved === null ? true : saved === 'true';
  });

  const toggleSimulator = () => {
    const nextVal = !mobileSimulator;
    setMobileSimulator(nextVal);
    localStorage.setItem('workcrew_mobile_sim', String(nextVal));
    window.dispatchEvent(new CustomEvent('workcrew_sim_toggle'));
  };

  const handleSwitch = async (newRole: 'ADMIN' | 'TEAM_LEADER' | 'WORKER') => {
    const url = await switchRole(newRole);
    navigate(url);
  };

  const handleResetData = async () => {
    if (confirm('Reset database to initial realistic pilot seeds?')) {
      setResetting(true);
      try {
        await fetch('/api/auth/reset-seed', { method: 'POST' });
        await refreshMe();
        window.location.reload();
      } finally {
        setResetting(false);
      }
    }
  };

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="fixed top-2 right-2 z-50 bg-slate-900/90 text-white text-3xs px-2 py-1 rounded-full shadow-lg flex items-center gap-1 hover:bg-slate-800 transition-all border border-slate-700"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="font-medium">{role}</span>
        <ChevronDown className="w-3 h-3" />
      </button>
    );
  }

  return (
    <div className="bg-slate-900 text-slate-200 text-xs px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 shadow-xs z-50">
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-4 rounded-sm overflow-hidden bg-slate-800 shrink-0 border border-slate-700">
          <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
        </div>
        <span className="font-bold text-white tracking-wide text-2xs flex items-center gap-1">
          Go_Repireo Crew
        </span>
        <span className="text-slate-600">/</span>
        <span className="font-semibold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded text-3xs border border-emerald-800/60">
          {user?.displayName || 'Loading...'} ({role})
        </span>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          onClick={() => handleSwitch('ADMIN')}
          className={`px-2 py-0.5 rounded text-3xs transition-colors flex items-center gap-1 ${
            role === 'ADMIN'
              ? 'bg-blue-600 text-white font-bold shadow-2xs'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <Shield className="w-3 h-3" />
          Admin
        </button>

        <button
          onClick={() => handleSwitch('TEAM_LEADER')}
          className={`px-2 py-0.5 rounded text-3xs transition-colors flex items-center gap-1 ${
            role === 'TEAM_LEADER'
              ? 'bg-indigo-600 text-white font-bold shadow-2xs'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <Users className="w-3 h-3" />
          Leader
        </button>

        <button
          onClick={() => handleSwitch('WORKER')}
          className={`px-2 py-0.5 rounded text-3xs transition-colors flex items-center gap-1 ${
            role === 'WORKER'
              ? 'bg-blue-600 text-white font-bold shadow-2xs'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <UserCheck className="w-3 h-3" />
          Worker
        </button>

        {/* Toggle Mobile Phone Frame Simulator on desktop */}
        <button
          onClick={toggleSimulator}
          title={mobileSimulator ? 'Switch to Full Screen Width' : 'Simulate Mobile Phone Frame'}
          className={`px-2 py-0.5 rounded text-3xs hidden sm:flex items-center gap-1 transition-colors ${
            mobileSimulator
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          {mobileSimulator ? <Monitor className="w-3 h-3" /> : <Smartphone className="w-3 h-3" />}
          <span>{mobileSimulator ? 'Full Width' : 'Phone Frame'}</span>
        </button>

        <button
          onClick={handleResetData}
          disabled={resetting}
          title="Reset database to seed"
          className="p-1 text-slate-400 hover:text-slate-200 rounded"
        >
          <RefreshCw className={`w-3 h-3 ${resetting ? 'animate-spin' : ''}`} />
        </button>

        <button
          onClick={() => {
            logout();
            navigate('/login');
          }}
          title="Logout"
          className="p-1 text-slate-400 hover:text-rose-400 rounded"
        >
          <LogOut className="w-3 h-3" />
        </button>

        <button
          onClick={() => setCollapsed(true)}
          title="Minimize toolbar"
          className="p-1 text-slate-400 hover:text-slate-200"
        >
          <ChevronUp className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
