import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../services/api';
import { Assignment, Attendance, WorkLocation, Notification } from '../../types';
import { AttendanceCameraModal } from '../../components/camera/AttendanceCameraModal';
import { WorkCameraModal } from '../../components/camera/WorkCameraModal';
import { SafeAvatar } from '../../components/common/SafeAvatar';
import {
  Calendar,
  Clock,
  Play,
  Square,
  CheckCircle2,
  ChevronRight,
  Briefcase,
  MapPin,
  Users,
  Camera,
  Navigation,
  Phone,
  Bell,
  FileText,
  AlertTriangle,
  Contact,
  ShieldCheck,
  RotateCw,
  User,
  ArrowRight,
  Building2,
  Sparkles,
  Lock,
} from 'lucide-react';
import { WorkEvidence } from '../../types';

export const WorkerHome: React.FC = () => {
  const { worker, user, refreshMe } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [todayAssignment, setTodayAssignment] = useState<Assignment | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [todayEvidence, setTodayEvidence] = useState<WorkEvidence[]>([]);
  const [locations, setLocations] = useState<WorkLocation[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showAllUpdates, setShowAllUpdates] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Camera modals state
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [attendanceMode, setAttendanceMode] = useState<'CHECK_IN' | 'CHECK_OUT'>('CHECK_IN');
  const [workCameraModalOpen, setWorkCameraModalOpen] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const workerName = worker?.name || user?.displayName || 'Worker';

  const [leaderPhone, setLeaderPhone] = useState<string | null>(null);

  useEffect(() => {
    if (worker?.primaryTeamId) {
      Promise.all([api.getTeams(), api.getLeaders()])
        .then(([teams, leaders]) => {
          const myTeam = teams.find((t) => t.teamId === worker.primaryTeamId);
          if (myTeam && myTeam.leaderIds && myTeam.leaderIds.length > 0) {
            const l = leaders.find((ld) => ld.leaderId === myTeam.leaderIds[0]);
            if (l?.phone) setLeaderPhone(l.phone);
          }
        })
        .catch((e) => console.warn(e));
    }
  }, [worker]);

  const loadData = async () => {
    try {
      const [assignments, attendanceList, locs, notifRes] = await Promise.all([
        api.getAssignments({ date: today }),
        api.getAttendance({ date: today }),
        api.getLocations().catch(() => []),
        api.getNotifications().catch(() => ({ notifications: [], unreadCount: 0 })),
      ]);

      setLocations(locs);
      setNotifications(notifRes?.notifications || []);

      if (assignments.length > 0) {
        setTodayAssignment(assignments[0]);
        api.getWorkEvidence({ assignmentId: assignments[0].assignmentId })
          .then((evList) => setTodayEvidence(evList || []))
          .catch(() => setTodayEvidence([]));
      } else {
        setTodayAssignment(null);
        setTodayEvidence([]);
      }

      if (attendanceList.length > 0) {
        setTodayAttendance(attendanceList[0]);
      } else {
        setTodayAttendance(null);
      }
    } catch (err) {
      console.error('Failed to load worker home data', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [worker]);

  const handleStartWork = () => {
    setAttendanceMode('CHECK_IN');
    setAttendanceModalOpen(true);
  };

  const handleEndWork = () => {
    setAttendanceMode('CHECK_OUT');
    setAttendanceModalOpen(true);
  };

  const handleAttendanceSuccess = (res: any) => {
    setTodayAttendance(res.attendance);
    setFeedback({
      type: 'success',
      message: res.message || t('attendance_success'),
    });
    loadData();
  };

  const handleWorkPhotoSuccess = () => {
    setFeedback({
      type: 'success',
      message: t('photo_saved_success'),
    });
    loadData();
  };

  const isCheckedIn = !!todayAttendance?.checkInTime;
  const isCheckedOut = !!todayAttendance?.checkOutTime;

  const hasBeforeWorkPhoto = todayEvidence.some((e) => e.category === 'BEFORE');
  const hasAfterWorkPhoto = todayEvidence.some((e) => e.category === 'AFTER');

  const checkInDisplayTime = todayAttendance?.checkInTime
    ? new Date(todayAttendance.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '--:--';

  const todayDateFormatted = new Date().toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const loc = todayAssignment?.locationId ? locations.find((l) => l.locationId === todayAssignment.locationId) : undefined;
  const buildingPhotoUrl = todayAssignment?.locationPhotoURL || loc?.photoURL || '';

  const currentHour = new Date().getHours();
  const timeGreeting =
    currentHour < 12 ? 'Good morning' : currentHour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-3.5 pb-4">
      {/* FEEDBACK BANNER (If any) */}
      {feedback && (
        <div
          className={`p-3 rounded-2xl text-xs flex items-center justify-between shadow-2xs border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-amber-50 border-amber-300 text-amber-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-bold text-2xs leading-snug">{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-xs font-bold text-slate-400">
            ✕
          </button>
        </div>
      )}

      {/* 1. SEAMLESS HERO GREETING + STATUS PILL BAR (No Card Box) */}
      <div className="relative -mx-3.5 sm:-mx-4 -mt-3.5 sm:-mt-4 px-4 pt-3.5 pb-1 overflow-hidden bg-gradient-to-b from-[#e4effe] via-[#eff5fe] to-[#f4f7fb]">
        {/* Soft sky clouds / atmospheric glow */}
        <div className="absolute -top-6 right-12 w-52 h-28 bg-white/60 rounded-full blur-2xl pointer-events-none" />

        {/* Architectural glass building silhouette on right */}
        <svg
          viewBox="0 0 220 150"
          className="absolute right-0 bottom-5 h-36 w-52 pointer-events-none select-none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="glassFacade" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.45" />
              <stop offset="55%" stopColor="#3b82f6" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.65" />
            </linearGradient>
            <linearGradient id="glassSide" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#1e40af" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.45" />
            </linearGradient>
            <linearGradient id="fadeMaskGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="white" stopOpacity="1" />
              <stop offset="75%" stopColor="white" stopOpacity="0.85" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>
            <mask id="buildingBottomFade">
              <rect x="0" y="0" width="220" height="150" fill="url(#fadeMaskGrad)" />
            </mask>
          </defs>
          <g mask="url(#buildingBottomFade)">
            {/* Left angled wing */}
            <polygon points="145,18 62,145 92,145 152,26" fill="url(#glassSide)" />
            {/* Main right facade */}
            <polygon points="145,18 220,48 220,145 88,145" fill="url(#glassFacade)" />
            {/* Roof highlight */}
            <polyline points="62,145 145,18 220,48" fill="none" stroke="#ffffff" strokeOpacity="0.8" strokeWidth="1.8" />
            {/* Horizontal window mullions */}
            <line x1="133" y1="38" x2="220" y2="70" stroke="#ffffff" strokeOpacity="0.45" strokeWidth="1" />
            <line x1="122" y1="58" x2="220" y2="92" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="1" />
            <line x1="110" y1="78" x2="220" y2="114" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="1" />
            <line x1="99" y1="98" x2="220" y2="136" stroke="#ffffff" strokeOpacity="0.3" strokeWidth="1" />
            {/* Vertical window mullions */}
            <line x1="164" y1="26" x2="124" y2="145" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="1" />
            <line x1="184" y1="34" x2="154" y2="145" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="1" />
            <line x1="204" y1="42" x2="184" y2="145" stroke="#ffffff" strokeOpacity="0.3" strokeWidth="1" />
          </g>
        </svg>

        <div className="relative z-10 space-y-3.5">
          <div className="pr-16">
            <div className="flex items-center gap-1.5 text-slate-600 text-xs font-medium">
              <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>{todayDateFormatted}</span>
            </div>

            <p className="text-base sm:text-lg font-medium text-slate-800 mt-1.5 leading-tight">
              {timeGreeting},
            </p>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight truncate">
              {workerName}
            </h2>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 mt-2 rounded-full bg-white/95 border border-slate-200/80 shadow-2xs text-[11px] font-semibold text-slate-600">
              <Contact className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>ID:</span>
              <span className="font-mono font-bold text-slate-800">
                {worker?.workerId || '—'}
              </span>
            </div>
          </div>

          {/* FLOATING STATUS / SHIFT / WORK TIME PILL BAR */}
          <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm px-3 py-2.5 flex items-center justify-between gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wide shrink-0 ${
                isCheckedOut
                  ? 'bg-blue-50 text-blue-700'
                  : todayAttendance?.status === 'LATE'
                  ? 'bg-amber-50 text-amber-700'
                  : todayAttendance?.status === 'PRESENT' || isCheckedIn
                  ? 'bg-[#dcfce7] text-[#15803d]'
                  : todayAssignment
                  ? 'bg-[#dcfce7] text-[#15803d]'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isCheckedOut
                    ? 'bg-blue-600'
                    : todayAttendance?.status === 'LATE'
                    ? 'bg-amber-500'
                    : todayAttendance?.status === 'PRESENT' || isCheckedIn || todayAssignment
                    ? 'bg-[#16a34a]'
                    : 'bg-slate-400'
                }`}
              />
              {isCheckedOut
                ? 'COMPLETED'
                : todayAttendance?.status === 'LATE'
                ? 'LATE'
                : todayAttendance?.status === 'PRESENT' || isCheckedIn
                ? 'PRESENT'
                : todayAssignment
                ? 'READY'
                : 'NO SHIFT'}
            </span>

            <div className="w-px h-4 bg-slate-200 shrink-0" />

            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 min-w-0 truncate">
              <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="truncate">
                {todayAssignment?.startTime && todayAssignment?.endTime
                  ? `Shift: ${todayAssignment.startTime} – ${todayAssignment.endTime}`
                  : 'Shift: Not scheduled'}
              </span>
            </div>

            <div className="w-px h-4 bg-slate-200 shrink-0" />

            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 whitespace-nowrap shrink-0">
              <Briefcase className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>
                Work Time:{' '}
                <strong className="font-mono font-bold text-slate-900">{checkInDisplayTime}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. DUAL ACTION CARDS (Start Work & End Work) */}
      <div className="grid grid-cols-2 gap-3">
        {/* Start Work (Check In) */}
        <button
          type="button"
          onClick={handleStartWork}
          disabled={isCheckedIn}
          className={`min-h-[104px] p-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all shadow-sm ${
            !isCheckedIn
              ? 'bg-gradient-to-br from-[#0b66e4] via-[#1070f0] to-[#084ec4] hover:brightness-105 active:scale-98 text-white'
              : 'bg-[#0b66e4]/85 text-white opacity-85 cursor-default'
          }`}
        >
          <div className="w-9 h-9 rounded-full bg-white text-[#0b66e4] flex items-center justify-center shadow-xs">
            <Play className="w-4 h-4 fill-current translate-x-0.5" />
          </div>
          <div className="text-center">
            <span className="block font-bold text-sm text-white leading-tight">
              Start Work
            </span>
            <span className="text-[11px] text-blue-100 font-medium">
              (Check In)
            </span>
          </div>
        </button>

        {/* End Work (Check Out) */}
        <button
          type="button"
          onClick={handleEndWork}
          disabled={!isCheckedIn || isCheckedOut}
          className={`min-h-[104px] p-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all ${
            isCheckedIn && !isCheckedOut
              ? 'bg-slate-900 hover:bg-slate-800 text-white active:scale-98 shadow-sm'
              : 'bg-[#f1f5f9] border border-slate-200/80 text-slate-700 cursor-default'
          }`}
        >
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center ${
              isCheckedIn && !isCheckedOut
                ? 'bg-white/20 text-white'
                : 'bg-slate-200/90 text-slate-800'
            }`}
          >
            <Square className="w-3.5 h-3.5 fill-current" />
          </div>
          <div className="text-center">
            <span
              className={`block font-bold text-sm leading-tight ${
                isCheckedIn && !isCheckedOut ? 'text-white' : 'text-slate-700'
              }`}
            >
              End Work
            </span>
            <span
              className={`text-[11px] font-medium ${
                isCheckedIn && !isCheckedOut ? 'text-slate-300' : 'text-slate-500'
              }`}
            >
              Check Out
            </span>
          </div>
        </button>
      </div>

      {/* 3. THREE QUICK ACTION CARDS */}
      <div className="grid grid-cols-3 gap-2.5">
        {/* 1. Take Work Photo */}
        <button
          type="button"
          onClick={() => {
            if (!todayAssignment) {
              alert('No assignment active for today.');
              return;
            }
            if (!isCheckedIn) {
              if (
                window.confirm(
                  'Step 1 is Attendance Check-In! You should verify attendance first before recording work photos. Open Attendance Check-In now?'
                )
              ) {
                handleStartWork();
                return;
              }
            }
            setWorkCameraModalOpen(true);
          }}
          className="p-3.5 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col items-center justify-center gap-2 transition-all active:scale-97 shadow-2xs"
        >
          <div className="w-10 h-10 rounded-full bg-[#edf2fe] text-[#106ee8] flex items-center justify-center">
            <Camera className="w-4.5 h-4.5" />
          </div>
          <span className="text-[11px] font-bold text-slate-800 text-center leading-tight">
            Take Work<br />Photo
          </span>
        </button>

        {/* 2. Directions */}
        {todayAssignment?.locationLatitude && todayAssignment?.locationLongitude ? (
          <a
            href={`https://maps.google.com/?q=${todayAssignment.locationLatitude},${todayAssignment.locationLongitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3.5 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col items-center justify-center gap-2 transition-all active:scale-97 shadow-2xs text-center"
          >
            <div className="w-10 h-10 rounded-full bg-[#edf2fe] text-[#106ee8] flex items-center justify-center">
              <MapPin className="w-4.5 h-4.5" />
            </div>
            <span className="text-[11px] font-bold text-slate-800 text-center leading-tight">
              Directions
            </span>
          </a>
        ) : (
          <div
            onClick={() => alert('No site GPS coordinates on file for today.')}
            className="p-3.5 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col items-center justify-center gap-2 shadow-2xs text-center cursor-pointer active:scale-97 transition-all"
          >
            <div className="w-10 h-10 rounded-full bg-[#edf2fe] text-[#106ee8] flex items-center justify-center">
              <MapPin className="w-4.5 h-4.5" />
            </div>
            <span className="text-[11px] font-bold text-slate-800 text-center leading-tight">
              Directions
            </span>
          </div>
        )}

        {/* 3. Call Leader */}
        {leaderPhone ? (
          <a
            href={`tel:${leaderPhone}`}
            className="p-3.5 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col items-center justify-center gap-2 transition-all active:scale-97 shadow-2xs text-center"
          >
            <div className="w-10 h-10 rounded-full bg-[#edf2fe] text-[#106ee8] flex items-center justify-center">
              <Phone className="w-4.5 h-4.5" />
            </div>
            <span className="text-[11px] font-bold text-slate-800 text-center leading-tight">
              Call Leader
            </span>
          </a>
        ) : (
          <div
            onClick={() => alert('No team leader phone number registered.')}
            className="p-3.5 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col items-center justify-center gap-2 shadow-2xs text-center cursor-pointer active:scale-97 transition-all"
          >
            <div className="w-10 h-10 rounded-full bg-[#edf2fe] text-[#106ee8] flex items-center justify-center">
              <Phone className="w-4.5 h-4.5" />
            </div>
            <span className="text-[11px] font-bold text-slate-800 text-center leading-tight">
              Call Leader
            </span>
          </div>
        )}
      </div>

      {/* 4. TODAY'S ASSIGNMENT CARD (Derived 100% from Live Data) */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-[#106ee8]" />
            <h3 className="text-xs font-bold text-slate-900">Today's Assignment</h3>
          </div>

          <button
            type="button"
            onClick={() => navigate('/worker/work')}
            className="text-[11px] font-bold text-[#106ee8] hover:underline flex items-center gap-0.5"
          >
            <span>View Details</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {todayAssignment ? (
          <div className="flex items-start gap-3">
            {/* Building Thumbnail */}
            {buildingPhotoUrl ? (
              <img
                src={buildingPhotoUrl}
                alt=""
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                  const sibling = (e.currentTarget as HTMLElement).nextElementSibling;
                  if (sibling) (sibling as HTMLElement).style.display = 'flex';
                }}
                className="w-20 h-20 rounded-2xl object-cover shrink-0 border border-slate-100 shadow-2xs"
              />
            ) : null}
            <div
              style={{ display: buildingPhotoUrl ? 'none' : 'flex' }}
              className="w-20 h-20 rounded-2xl bg-blue-50 border border-blue-100 items-center justify-center shrink-0 text-blue-600 shadow-2xs"
            >
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>

            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-black text-slate-900 leading-tight truncate">
                  {todayAssignment.title}
                </h4>
                <span
                  className={`font-black px-2 py-0.5 rounded-full text-4xs shrink-0 ${
                    todayAssignment.status === 'COMPLETED'
                      ? 'bg-[#dcfce7] text-[#15803d]'
                      : todayAssignment.status === 'IN_PROGRESS'
                      ? 'bg-[#fef3c7] text-[#b45309]'
                      : 'bg-[#eff6ff] text-[#2563eb]'
                  }`}
                >
                  {todayAssignment.status === 'IN_PROGRESS'
                    ? 'In Progress'
                    : todayAssignment.status === 'COMPLETED'
                    ? 'Completed'
                    : 'Assigned'}
                </span>
              </div>

              <div className="space-y-0.5 text-2xs text-slate-600 pt-0.5">
                <div className="flex items-center gap-1.5 truncate">
                  <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="truncate">
                    {todayAssignment.locationName || todayAssignment.locationAddress || 'Assigned Site'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>
                    {todayAssignment.startTime && todayAssignment.endTime
                      ? `${todayAssignment.startTime} – ${todayAssignment.endTime}`
                      : 'Standard Shift'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Team: {worker?.primaryTeamName || 'General Crew'}</span>
                </div>
              </div>

              {/* SEQUENTIAL 3-STEP EXECUTION TRACKER */}
              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <span className="text-4xs font-black uppercase tracking-wider text-slate-400 block">
                  Required Order of Work:
                </span>
                <div className="grid grid-cols-3 gap-1.5 text-center">
                  {/* Step 1: Attendance */}
                  <div
                    className={`p-1.5 rounded-xl text-3xs font-extrabold flex flex-col items-center border ${
                      isCheckedIn
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-blue-50 text-blue-700 border-blue-200'
                    }`}
                  >
                    <span>{isCheckedIn ? '✓ 1. Attendance' : '1. Attendance'}</span>
                    <span className="text-4xs opacity-75 font-normal">
                      {isCheckedIn ? 'Verified' : 'Required'}
                    </span>
                  </div>

                  {/* Step 2: Before Photo */}
                  <div
                    className={`p-1.5 rounded-xl text-3xs font-extrabold flex flex-col items-center border ${
                      hasBeforeWorkPhoto
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : isCheckedIn
                        ? 'bg-amber-50 text-amber-800 border-amber-300 ring-1 ring-amber-400/50'
                        : 'bg-slate-50 text-slate-400 border-slate-200'
                    }`}
                  >
                    <span>{hasBeforeWorkPhoto ? '✓ 2. Before Pic' : '2. Before Pic'}</span>
                    <span className="text-4xs opacity-75 font-normal">
                      {hasBeforeWorkPhoto ? 'Recorded' : isCheckedIn ? 'Next Step' : 'Step 2'}
                    </span>
                  </div>

                  {/* Step 3: After Photo / Auto-Verify */}
                  <div
                    className={`p-1.5 rounded-xl text-3xs font-extrabold flex flex-col items-center border ${
                      hasAfterWorkPhoto
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : hasBeforeWorkPhoto
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-300 ring-1 ring-indigo-400/50'
                        : 'bg-slate-50 text-slate-400 border-slate-200'
                    }`}
                  >
                    <span>{hasAfterWorkPhoto ? '✓ 3. Verified' : '3. After Pic'}</span>
                    <span className="text-4xs opacity-75 font-normal">
                      {hasAfterWorkPhoto ? 'Complete' : hasBeforeWorkPhoto ? 'Auto-Verify' : 'Locked'}
                    </span>
                  </div>
                </div>

                {/* DIRECT STEP ACTION BUTTON */}
                <div className="pt-1">
                  {!isCheckedIn ? (
                    <button
                      type="button"
                      onClick={handleStartWork}
                      className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-2xs sm:text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 active:scale-98 transition-all"
                    >
                      <Play className="w-3.5 h-3.5 fill-white shrink-0" />
                      <span className="truncate">Step 1: Attendance Check-In</span>
                    </button>
                  ) : !hasBeforeWorkPhoto ? (
                    <button
                      type="button"
                      onClick={() => setWorkCameraModalOpen(true)}
                      className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-2xs sm:text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 active:scale-98 transition-all"
                    >
                      <Camera className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Step 2: Take Before-Work Photo</span>
                    </button>
                  ) : !hasAfterWorkPhoto ? (
                    <button
                      type="button"
                      onClick={() => setWorkCameraModalOpen(true)}
                      className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-2xs sm:text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 active:scale-98 transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Step 3: After Photo & Auto-Verify</span>
                    </button>
                  ) : (
                    <div className="w-full py-2 px-3 bg-emerald-50 text-emerald-800 border border-emerald-200 font-extrabold text-2xs sm:text-xs rounded-xl flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">Duty Completed & Auto-Verified ✓</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-4 px-2 flex items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#edf2fe] text-[#106ee8]/80 flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">No assignment for today</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Tap 'My Work' to view all jobs.</p>
            </div>
          </div>
        )}
      </div>

      {/* 5. RECENT UPDATES SECTION */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#106ee8]" />
            <h3 className="text-xs font-bold text-slate-900">Recent Updates</h3>
          </div>

          {notifications.length > 3 ? (
            <button
              type="button"
              onClick={() => setShowAllUpdates((prev) => !prev)}
              className="text-[11px] font-bold text-[#106ee8] hover:underline flex items-center gap-0.5"
            >
              <span>{showAllUpdates ? 'Show Less' : 'View All'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate('/worker/attendance')}
              className="text-[11px] font-bold text-[#106ee8] hover:underline flex items-center gap-0.5"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="space-y-2.5">
          {!todayAssignment && !todayAttendance && notifications.length === 0 ? (
            <div className="p-4 text-center text-slate-400 text-xs font-medium">
              No recent updates yet.
            </div>
          ) : (
            <>
              {/* Update Item 1: New Work Assignment */}
              {todayAssignment && (
                <div className="flex items-center justify-between gap-2 p-1">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-[#edf2fe] text-[#106ee8] flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 leading-tight">
                        New Work Assignment
                      </h4>
                      <p className="text-3xs text-slate-500 font-medium mt-0.5 truncate max-w-[200px]">
                        {todayAssignment.title} at{' '}
                        {todayAssignment.locationName || todayAssignment.locationAddress || 'Site'}
                      </p>
                    </div>
                  </div>

                  <span className="text-4xs text-slate-400 font-medium whitespace-nowrap shrink-0">
                    {todayAssignment.startTime ? `Shift ${todayAssignment.startTime}` : 'Today'}
                  </span>
                </div>
              )}

              {/* Update Item 2: Attendance Status */}
              {todayAttendance && (
                <div className="flex items-center justify-between gap-2 p-1 border-t border-slate-100 pt-2.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 leading-tight">
                        {todayAttendance.status === 'PRESENT' ? 'Attendance Confirmed' : 'Attendance Recorded'}
                      </h4>
                      <p className="text-3xs text-slate-500 font-medium mt-0.5 truncate max-w-[200px]">
                        {todayAttendance.checkInAddress || `Check-in at ${checkInDisplayTime}`}
                      </p>
                    </div>
                  </div>

                  <span className="text-4xs text-slate-400 font-medium whitespace-nowrap shrink-0">
                    {checkInDisplayTime}
                  </span>
                </div>
              )}

              {/* Live Notifications from Database */}
              {(showAllUpdates ? notifications : notifications.slice(0, 3)).map((notif, idx) => (
                <div
                  key={notif.notificationId}
                  className={`flex items-center justify-between gap-2 p-1 ${
                    todayAssignment || todayAttendance || idx > 0 ? 'border-t border-slate-100 pt-2.5' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-[#edf2fe] text-[#106ee8] flex items-center justify-center shrink-0">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 leading-tight truncate">
                        {notif.title}
                      </h4>
                      <p className="text-3xs text-slate-500 font-medium mt-0.5 truncate max-w-[200px]">
                        {notif.message}
                      </p>
                    </div>
                  </div>

                  <span className="text-4xs text-slate-400 font-medium whitespace-nowrap shrink-0">
                    {notif.createdAt
                      ? new Date(notif.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : ''}
                  </span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* CAMERA MODALS */}
      <AttendanceCameraModal
        isOpen={attendanceModalOpen}
        onClose={() => setAttendanceModalOpen(false)}
        mode={attendanceMode}
        assignment={todayAssignment}
        targetLocation={
          todayAssignment?.locationId
            ? locations.find((l) => l.locationId === todayAssignment.locationId)
            : locations[0]
        }
        attendanceId={todayAttendance?.attendanceId}
        onSuccess={handleAttendanceSuccess}
      />

      {todayAssignment && (
        <WorkCameraModal
          isOpen={workCameraModalOpen}
          onClose={() => setWorkCameraModalOpen(false)}
          assignment={todayAssignment}
          onSuccess={handleWorkPhotoSuccess}
        />
      )}
    </div>
  );
};
