import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../services/api';
import { Team, Worker, Assignment, Attendance, WorkLocation } from '../../types';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { LeaderAttendanceCameraModal } from '../../components/camera/LeaderAttendanceCameraModal';
import {
  Users,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  UserPlus,
  ClipboardList,
  Camera,
  Briefcase,
  ChevronRight,
  Bell,
  BarChart3,
  Zap,
  Building2,
  ShoppingBag,
} from 'lucide-react';

export const LeaderDashboard: React.FC = () => {
  const { leader, user, settings } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [teams, setTeams] = useState<Team[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<Attendance[]>([]);
  const [locations, setLocations] = useState<WorkLocation[]>([]);
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().slice(0, 10);
  
  // Format: "Thu, 19 Nov, 2026"
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  // Time-based greeting: "Good morning," / "Good afternoon," / "Good evening,"
  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12 ? 'Good morning,' : currentHour < 17 ? 'Good afternoon,' : 'Good evening,';

  const leaderName = leader?.name || user?.displayName || 'Prithibi';
  const orgName = settings?.orgName || 'Go_Repireo Crew';
  
  // High fidelity avatar fallback matching reference image
  const avatarUrl =
    user?.photoURL && !user.photoURL.includes('dicebear')
      ? user.photoURL
      : leader?.photoURL && !leader.photoURL.includes('dicebear')
      ? leader.photoURL
      : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80';

  const loadData = async () => {
    try {
      setLoading(true);
      const [tList, wList, aList, attList, locList] = await Promise.all([
        api.getTeams(true),
        api.getWorkers(),
        api.getAssignments(),
        api.getAttendance({ date: today }),
        api.getLocations().catch(() => []),
      ]);
      setTeams(tList);
      setWorkers(wList);
      setAssignments(aList);
      setTodayAttendance(attList);
      setLocations(locList);
    } catch (e) {
      console.error('Failed to load leader dashboard', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [leader]);

  if (loading) return <LoadingSpinner message={t('loading')} />;

  const totalWorkersCount = workers.length;
  const presentCount = todayAttendance.filter((a) => a.status === 'PRESENT').length;
  const absentCount = todayAttendance.filter((a) => a.status === 'ABSENT').length;
  const notCheckedInCount = Math.max(0, totalWorkersCount - presentCount - absentCount);

  // Purely dynamic orders list derived from live assignments database
  const liveOrders = assignments.map((asn) => {
    let statusLabel = 'Assigned';
    let statusClass = 'bg-[#eff6ff] text-[#2563eb]';
    if (asn.status === 'IN_PROGRESS') {
      statusLabel = 'In Progress';
      statusClass = 'bg-[#fff7ed] text-[#ea580c]';
    } else if (asn.status === 'COMPLETED') {
      statusLabel = 'Completed';
      statusClass = 'bg-[#f0fdf4] text-[#16a34a]';
    } else if (asn.status === 'CANCELLED') {
      statusLabel = 'Cancelled';
      statusClass = 'bg-[#fff1f2] text-[#e11d48]';
    }

    const timeStr =
      asn.startTime && asn.endTime ? `${asn.startTime} – ${asn.endTime}` : 'Full Day Shift';

    const loc = locations.find((l) => l.locationId === asn.locationId);
    const photo = asn.locationPhotoURL || loc?.photoURL || '';

    return {
      id: asn.assignmentId,
      title: asn.title,
      status: statusLabel,
      statusClass,
      location: asn.locationName || loc?.name || asn.locationAddress || 'Assigned Site',
      time: timeStr,
      thumbnail: photo,
    };
  });

  return (
    <div className="space-y-3.5 pb-2">
      {/* =========================================================================
          1. TOP HERO CONTAINER (Exact Match to User Reference Mockup)
          Smooth purple/royal-blue gradient with waving curves, smiling avatar,
          greeting, leader name, translucent "TEAM LEADER" badge & notification bell.
          ========================================================================= */}
      <div className="-mx-3 -mt-3 bg-gradient-to-r from-[#2031c9] via-[#353de0] to-[#5a32de] text-white pt-5 pb-6 px-4 relative overflow-hidden z-10 shadow-sm">
        {/* Subtle decorative smooth background waves */}
        <div className="absolute inset-0 opacity-25 pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 400 120" preserveAspectRatio="none" fill="none">
            <path
              d="M0,20 C120,80 260,-20 400,40 L400,120 L0,120 Z"
              fill="url(#header-wave-grad)"
            />
            <defs>
              <linearGradient id="header-wave-grad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#818cf8" stopOpacity="0.1" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Content Row: Avatar + Leader Greeting/Badge + Notification Bell */}
        <div className="relative z-10 flex items-center justify-between">
          {/* Left: Avatar + Details */}
          <div className="flex items-center gap-3">
            {/* Avatar with White Ring & Green Active Status Dot */}
            <div className="relative shrink-0">
              <img
                src={avatarUrl}
                alt={leaderName}
                className="w-14 h-14 rounded-full object-cover ring-2 ring-white shadow-md bg-white/20"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (target.src.includes(':3000/uploads/')) {
                    target.src = target.src.replace(':3000', ':5000');
                  } else {
                    target.src =
                      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80';
                  }
                }}
              />
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white ring-1 ring-emerald-400" />
            </div>

            {/* Greeting, Name & Pill Badge */}
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white/85 leading-none">
                {greeting}
              </p>
              <h1 className="text-xl font-black text-white leading-tight tracking-tight mt-1 truncate max-w-[200px]">
                {leaderName}
              </h1>
              <div className="mt-1">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-4xs font-black uppercase tracking-wider bg-white/20 backdrop-blur-md text-white border border-white/25 shadow-2xs">
                  TEAM LEADER
                </span>
              </div>
            </div>
          </div>

          {/* Right: Glassmorphism Notification Bell with Red Badge */}
          <button
            type="button"
            className="relative w-10 h-10 rounded-2xl bg-white/18 hover:bg-white/25 active:scale-95 backdrop-blur-md border border-white/25 flex items-center justify-center text-white transition-all cursor-pointer shadow-xs"
            title="Notifications"
          >
            <Bell className="w-5 h-5 fill-current" />
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-[#353de0]" />
          </button>
        </div>
      </div>

      {/* =========================================================================
          2. SUB-HEADER CARD (Dark Sapphire Navy Pill)
          Organization + Teams on Left | Date on Right
          ========================================================================= */}
      <div className="bg-gradient-to-r from-[#1725a3] via-[#242bb5] to-[#3f27a6] rounded-2xl p-3 px-3.5 text-white flex items-center justify-between shadow-xs border border-white/10">
        {/* Left: Building Icon / Logo + Org Name + Teams Count */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-xl bg-white/10 overflow-hidden border border-white/20 flex items-center justify-center shrink-0 shadow-2xs">
            {settings?.orgLogo ? (
              <img src={settings.orgLogo} alt="Org Logo" className="w-full h-full object-cover" />
            ) : (
              <Building2 className="w-5 h-5 text-white stroke-[2]" />
            )}
          </div>
          <div className="min-w-0 truncate">
            <h2 className="text-xs font-extrabold text-white leading-tight truncate">
              {orgName}
            </h2>
            <p className="text-3xs text-blue-200 font-semibold mt-0.5">
              {teams.length} {teams.length === 1 ? 'Team' : 'Teams'}
            </p>
          </div>
        </div>

        {/* Center Vertical Divider */}
        <div className="w-[1px] h-6 bg-white/20 mx-3 shrink-0" />

        {/* Right: Calendar Icon + Date */}
        <div className="flex items-center gap-2 shrink-0">
          <Calendar className="w-4.5 h-4.5 text-white stroke-[2]" />
          <span className="text-xs font-bold text-white whitespace-nowrap">
            {todayFormatted}
          </span>
        </div>
      </div>

      {/* =========================================================================
          3. WORK SUMMARY (White Card with 2x2 Metric Grid)
          ========================================================================= */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100/90 relative overflow-hidden">
        {/* Subtle decorative purple corner accent */}
        <div className="absolute top-0 right-0 w-28 h-20 bg-gradient-to-bl from-purple-100/50 to-transparent rounded-bl-[40px] pointer-events-none" />

        {/* Header */}
        <div className="flex items-center gap-2 mb-3.5 relative z-10">
          <BarChart3 className="w-5 h-5 text-[#2552ea] stroke-[2.5]" />
          <h2 className="text-base font-black text-slate-900 tracking-tight">
            Work Summary
          </h2>
        </div>

        {/* 2x2 Metric Cards Grid */}
        <div className="grid grid-cols-2 gap-2.5 relative z-10">
          {/* Total Workers */}
          <div className="bg-[#f0f5ff] border border-blue-100/70 rounded-2xl p-2.5 flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-[#dbe8fe] text-[#2563eb] flex items-center justify-center shrink-0 shadow-2xs">
              <Users className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-3xs font-bold text-slate-700 block leading-none">
                Total Workers
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-black text-slate-900 leading-none">
                  {totalWorkersCount}
                </span>
                <span className="text-3xs font-semibold text-slate-500">
                  Registered
                </span>
              </div>
            </div>
          </div>

          {/* Present Today */}
          <div className="bg-[#f0fbf4] border border-emerald-100/70 rounded-2xl p-2.5 flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-[#d1fae5] text-[#059669] flex items-center justify-center shrink-0 shadow-2xs">
              <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-3xs font-bold text-slate-700 block leading-none">
                Present Today
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-black text-[#059669] leading-none">
                  {presentCount}
                </span>
                <span className="text-3xs font-semibold text-[#059669]">
                  On Duty
                </span>
              </div>
            </div>
          </div>

          {/* Absent */}
          <div className="bg-[#fff2f4] border border-rose-100/70 rounded-2xl p-2.5 flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-[#ffe4e6] text-[#e11d48] flex items-center justify-center shrink-0 shadow-2xs">
              <XCircle className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-3xs font-bold text-slate-700 block leading-none">
                Absent
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-black text-[#e11d48] leading-none">
                  {absentCount}
                </span>
                <span className="text-3xs font-semibold text-[#e11d48]">
                  Reported
                </span>
              </div>
            </div>
          </div>

          {/* Not Checked In */}
          <div className="bg-[#fef9ee] border border-amber-100/70 rounded-2xl p-2.5 flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-[#fef3c7] text-[#d97706] flex items-center justify-center shrink-0 shadow-2xs">
              <Clock className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-3xs font-bold text-slate-700 block leading-none">
                Not Checked In
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-black text-[#d97706] leading-none">
                  {notCheckedInCount}
                </span>
                <span className="text-3xs font-semibold text-[#d97706]">
                  Pending
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          4. QUICK LEADER ACTIONS (White Card with 4 Buttons Row)
          Add Worker (Blue) | Assign Work (Purple) | Take Attendance | View Team
          ========================================================================= */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100/90 relative overflow-hidden">
        {/* Subtle decorative purple corner accent */}
        <div className="absolute top-0 right-0 w-28 h-20 bg-gradient-to-bl from-purple-100/50 to-transparent rounded-bl-[40px] pointer-events-none" />

        {/* Header */}
        <div className="flex items-center gap-2 mb-3.5 relative z-10">
          <Zap className="w-5 h-5 text-[#7042e6] stroke-[2.5]" />
          <h2 className="text-base font-black text-slate-900 tracking-tight">
            Quick Leader Actions
          </h2>
        </div>

        {/* 4 Action Buttons Grid */}
        <div className="grid grid-cols-4 gap-2 relative z-10">
          {/* Action 1: Add Worker (Solid Royal Blue) */}
          <button
            type="button"
            onClick={() => navigate('/leader/add-worker')}
            className="bg-[#2355ea] hover:bg-blue-700 active:scale-95 text-white rounded-2xl py-3 px-1 flex flex-col items-center justify-center text-center shadow-md shadow-blue-500/25 transition-all cursor-pointer"
          >
            <UserPlus className="w-5 h-5 text-white mb-1.5 stroke-[2.2]" />
            <span className="text-3xs font-bold leading-tight block text-white">Add</span>
            <span className="text-3xs font-bold leading-tight block text-white">Worker</span>
          </button>

          {/* Action 2: Assign Work (Solid Purple) */}
          <button
            type="button"
            onClick={() => navigate('/leader/assign-work')}
            className="bg-[#7042e6] hover:bg-purple-700 active:scale-95 text-white rounded-2xl py-3 px-1 flex flex-col items-center justify-center text-center shadow-md shadow-purple-500/25 transition-all cursor-pointer"
          >
            <ClipboardList className="w-5 h-5 text-white mb-1.5 stroke-[2.2]" />
            <span className="text-3xs font-bold leading-tight block text-white">Assign</span>
            <span className="text-3xs font-bold leading-tight block text-white">Work</span>
          </button>

          {/* Action 3: Take Attendance (Soft Outline - Launches Instant Camera & Auto GPS) */}
          <button
            type="button"
            onClick={() => setCameraModalOpen(true)}
            className="bg-[#f8faff] hover:bg-slate-100 active:scale-95 border border-slate-200/80 text-slate-800 rounded-2xl py-3 px-1 flex flex-col items-center justify-center text-center transition-all cursor-pointer shadow-2xs group"
          >
            <Camera className="w-5 h-5 text-[#2355ea] mb-1.5 stroke-[2] group-hover:scale-110 transition-transform" />
            <span className="text-3xs font-bold leading-tight block text-slate-800">Take</span>
            <span className="text-3xs font-bold leading-tight block text-slate-800">Attendance</span>
          </button>

          {/* Action 4: View Team (Soft Outline) */}
          <button
            type="button"
            onClick={() => navigate('/leader/teams')}
            className="bg-[#f8faff] hover:bg-slate-100 active:scale-95 border border-slate-200/80 text-slate-800 rounded-2xl py-3 px-1 flex flex-col items-center justify-center text-center transition-all cursor-pointer shadow-2xs"
          >
            <Users className="w-5 h-5 text-[#2355ea] mb-1.5 stroke-[2]" />
            <span className="text-3xs font-bold leading-tight block text-slate-800">View</span>
            <span className="text-3xs font-bold leading-tight block text-slate-800">Team</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          5. TODAY'S WORK SECTION (White Card with Isometric Empty State)
          ========================================================================= */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100/90 space-y-3">
        {/* Header with Counter Link */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#2552ea] stroke-[2.2]" />
            <h2 className="text-base font-black text-slate-900 tracking-tight">
              Today&apos;s Work
            </h2>
          </div>

          <button
            type="button"
            onClick={() => navigate('/leader/assign-work')}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 cursor-pointer transition-colors"
          >
            <span>{liveOrders.length} Orders</span>
            <ChevronRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Content: Empty State Box or Live Orders */}
        {liveOrders.length === 0 ? (
          <div className="bg-[#f8faff] border border-blue-100/60 rounded-2xl py-7 px-4 text-center flex flex-col items-center justify-center">
            {/* 3D Isometric Cube Box SVG with Sparkles */}
            <div className="relative mb-2.5">
              <span className="absolute -top-2.5 -left-4 text-indigo-400 text-xs font-bold select-none">
                ✦
              </span>
              <span className="absolute -top-1.5 -right-4 text-indigo-400 text-xs font-bold select-none">
                ✦
              </span>
              <span className="absolute -bottom-1 -left-3 text-indigo-400 text-2xs font-bold select-none">
                ✦
              </span>
              <svg className="w-13 h-13 text-[#8b5cf6]" viewBox="0 0 54 54" fill="none">
                {/* Top isometric plane */}
                <path
                  d="M27 8L44 18L27 28L10 18L27 8Z"
                  fill="#ede9fe"
                  stroke="#7c3aed"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                {/* Left isometric plane */}
                <path
                  d="M10 18V36L27 46V28L10 18Z"
                  fill="#ddd6fe"
                  stroke="#7c3aed"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                {/* Right isometric plane */}
                <path
                  d="M44 18V36L27 46V28L44 18Z"
                  fill="#c4b5fd"
                  stroke="#7c3aed"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                {/* Flap fold details */}
                <path
                  d="M18 13L36 23"
                  stroke="#7c3aed"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeDasharray="2 2"
                />
              </svg>
            </div>

            <h3 className="text-sm font-black text-slate-900 tracking-tight">
              No active orders scheduled
            </h3>
            <p className="text-2xs text-slate-500 font-medium mt-1 max-w-[250px]">
              Tap &ldquo;Assign Work&rdquo; to dispatch tasks to your crew.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {liveOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => navigate('/leader/assign-work')}
                className="p-2.5 rounded-2xl border border-slate-100 hover:border-blue-200 bg-slate-50/60 hover:bg-white transition-all cursor-pointer flex items-center justify-between gap-3 group shadow-2xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {order.thumbnail ? (
                    <img
                      src={order.thumbnail}
                      alt=""
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                        const sibling = (e.currentTarget as HTMLElement).nextElementSibling;
                        if (sibling) (sibling as HTMLElement).style.display = 'flex';
                      }}
                      className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200"
                    />
                  ) : null}
                  <div
                    style={{ display: order.thumbnail ? 'none' : 'flex' }}
                    className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 items-center justify-center shrink-0 text-blue-600"
                  >
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-4xs font-black uppercase px-2 py-0.5 rounded-full ${order.statusClass}`}>
                        {order.status}
                      </span>
                      <span className="text-3xs text-slate-500 font-medium">{order.time}</span>
                    </div>
                    <h4 className="text-xs font-black text-slate-900 mt-0.5 truncate group-hover:text-blue-600 transition-colors">
                      {order.title}
                    </h4>
                    <p className="text-3xs text-slate-500 truncate mt-0.5">{order.location}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CAMERA & AUTO GPS ATTENDANCE MODAL */}
      <LeaderAttendanceCameraModal
        isOpen={cameraModalOpen}
        onClose={() => setCameraModalOpen(false)}
        workers={workers}
        teams={teams}
        locations={locations}
        onSuccess={() => {
          setCameraModalOpen(false);
          loadData();
        }}
      />
    </div>
  );
};
