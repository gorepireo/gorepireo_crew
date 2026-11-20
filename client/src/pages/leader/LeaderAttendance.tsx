import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { Attendance, Worker, Team, WorkLocation, Assignment } from '../../types';
import { Modal } from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { SafeAvatar } from '../../components/common/SafeAvatar';
import { LeaderAttendanceCameraModal } from '../../components/camera/LeaderAttendanceCameraModal';
import {
  Calendar,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Plus,
  LogIn,
  LogOut,
  MapPin,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  Users,
  XCircle,
  AlertTriangle,
  Send,
  Camera,
  Briefcase,
  Filter,
  Layers,
} from 'lucide-react';

const getTodayLocal = () => {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
};

export const LeaderAttendance: React.FC = () => {
  const { t } = useLanguage();
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [locations, setLocations] = useState<WorkLocation[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  const [dateFilter, setDateFilter] = useState(getTodayLocal);

  // Scope filter: ALL | TEAM | INDIVIDUAL
  const [scopeFilter, setScopeFilter] = useState<'ALL' | 'TEAM' | 'INDIVIDUAL'>('ALL');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('ALL');

  // Camera Attendance Modal (Auto GPS + AI Biometrics)
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [targetCameraWorkerId, setTargetCameraWorkerId] = useState<string | undefined>(undefined);

  // Manual marking modal
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manualWorkerId, setManualWorkerId] = useState('');
  const [manualStatus, setManualStatus] = useState('PRESENT');
  const [manualReason, setManualReason] = useState('Leader on-site physical check-in');
  const [submittingManual, setSubmittingManual] = useState(false);

  // Audit / Adjust modal
  const [auditTarget, setAuditTarget] = useState<any | null>(null);
  const [auditStatus, setAuditStatus] = useState('PRESENT');
  const [auditNotes, setAuditNotes] = useState('');
  const [submittingAudit, setSubmittingAudit] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [attList, wList, tList, locList, asnList] = await Promise.all([
        api.getAttendance({ date: dateFilter }),
        api.getWorkers(),
        api.getTeams(true).catch(() => []),
        api.getLocations().catch(() => []),
        api.getAssignments({ date: dateFilter }).catch(() => []),
      ]);
      setAttendance(attList);
      setWorkers(wList);
      setTeams(tList);
      setLocations(locList);
      setAssignments(asnList);
      if (wList.length > 0 && !manualWorkerId) {
        setManualWorkerId(wList[0].workerId);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [dateFilter]);

  // STAGE 1: ONLY include workers who have work scheduled on that day (or who have attendance on that day)
  const scheduledWorkerCards = workers
    .map((w) => {
      // Check if worker is assigned to any work on dateFilter
      const matchedAssignments = assignments.filter((a) => {
        const isDirect = a.workerIds && a.workerIds.includes(w.workerId);
        const isTeam =
          a.teamIds &&
          a.teamIds.length > 0 &&
          ((w.primaryTeamId && a.teamIds.includes(w.primaryTeamId)) ||
            teams.some(
              (t) => a.teamIds.includes(t.teamId) && t.memberWorkerIds?.includes(w.workerId)
            ));
        return isDirect || isTeam;
      });

      const att = attendance.find((a) => a.workerId === w.workerId);
      const hasWork = matchedAssignments.length > 0 || !!att;

      // STRICT REQUIREMENT: If worker has no work scheduled and no attendance on this day, DO NOT SHOW
      if (!hasWork) return null;

      const primaryAsn = matchedAssignments[0];
      const isTeamAssignment = (primaryAsn?.teamIds?.length ?? 0) > 0;
      const isIndividualAssignment = !isTeamAssignment;

      const isPresent = att?.status === 'PRESENT';
      const isAbsent = att?.status === 'ABSENT';
      const isHalfDay = att?.status === 'HALF_DAY';
      const isLate = att?.status === 'LATE';

      const checkInStr = att?.checkInTime
        ? new Date(att.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '--';

      const checkOutStr = att?.checkOutTime
        ? new Date(att.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '--';

      let durationStr = '--';
      if (att?.workingMinutes) {
        const h = Math.floor(att.workingMinutes / 60);
        const m = att.workingMinutes % 60;
        durationStr = `${h}h ${m}m`;
      } else if (att?.checkInTime && att?.checkOutTime) {
        const diffMins = Math.round(
          (new Date(att.checkOutTime).getTime() - new Date(att.checkInTime).getTime()) / 60000
        );
        const h = Math.floor(diffMins / 60);
        const m = diffMins % 60;
        durationStr = `${h}h ${m}m`;
      }

      const statusLabel = isPresent
        ? 'Present'
        : isAbsent
        ? 'Absent'
        : isHalfDay
        ? 'Half Day'
        : isLate
        ? 'Late'
        : 'Not Checked In';

      const statusPill = isPresent
        ? 'bg-[#e6fbf0] text-[#059669]'
        : isAbsent
        ? 'bg-[#fff1f2] text-[#e11d48]'
        : 'bg-[#fffbeb] text-[#d97706]';

      const distanceMeters =
        att?.checkInDistanceMeters !== undefined && att?.checkInDistanceMeters !== null
          ? att.checkInDistanceMeters
          : null;
      const isVerified =
        (att?.verificationStatus === 'VERIFIED' || att?.gpsStatus === 'VERIFIED') && isPresent;

      return {
        workerId: w.workerId,
        name: w.name,
        teamId: w.primaryTeamId,
        teamName: w.primaryTeamName || 'General Crew',
        avatarUrl: w.photoURL,
        status: statusLabel,
        statusPill,
        gpsBadge: isVerified ? 'GPS Verified' : isPresent ? 'Manual / Standard' : 'Unrecorded',
        checkIn: checkInStr,
        checkOut: checkOutStr,
        duration: durationStr,
        durationColor: durationStr !== '--' ? 'text-[#1752d5]' : 'text-slate-800',
        gpsDistance: distanceMeters !== null ? `${distanceMeters} m` : '--',
        siteVerification: isVerified
          ? 'Within Site (Verified)'
          : isPresent
          ? 'Work in Progress'
          : isAbsent
          ? 'Reported Absent'
          : 'Not Checked In',
        verificationType: isVerified ? 'VERIFIED' : 'IN_PROGRESS',
        assignmentTitle: primaryAsn?.title || (att?.assignmentTitle ? att.assignmentTitle : undefined),
        assignmentLocation:
          primaryAsn?.locationName || primaryAsn?.locationAddress || 'Assigned Worksite',
        shiftHours:
          primaryAsn?.startTime && primaryAsn?.endTime
            ? `${primaryAsn.startTime} – ${primaryAsn.endTime}`
            : 'Scheduled Shift',
        isTeamAssignment,
        isIndividualAssignment,
        rawAttendance: att,
      };
    })
    .filter(Boolean) as any[];

  // Real Counts derived STRICTLY from workers who have work scheduled on that day
  const totalCount = scheduledWorkerCards.length;
  const presentCount = scheduledWorkerCards.filter((c) => c.status === 'Present').length;
  const absentCount = scheduledWorkerCards.filter((c) => c.status === 'Absent').length;
  const notCheckedInCount = Math.max(0, totalCount - presentCount - absentCount);

  // STAGE 2: Filter by user scope: All Scheduled | By Team | Individual
  const displayCards = scheduledWorkerCards.filter((card) => {
    if (scopeFilter === 'TEAM') {
      if (selectedTeamFilter !== 'ALL' && card.teamId !== selectedTeamFilter) {
        return false;
      }
      return card.isTeamAssignment || !!card.teamId;
    }
    if (scopeFilter === 'INDIVIDUAL') {
      return card.isIndividualAssignment;
    }
    return true;
  });

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualWorkerId) return;
    setSubmittingManual(true);
    try {
      await api.markManualAttendance({
        workerId: manualWorkerId,
        date: dateFilter,
        status: manualStatus,
        reason: manualReason,
      });
      alert(`Manual attendance recorded for ${manualWorkerId}`);
      setManualModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to record manual attendance');
    } finally {
      setSubmittingManual(false);
    }
  };

  const handleAuditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auditTarget) return;
    setSubmittingAudit(true);
    try {
      await api.markManualAttendance({
        workerId: auditTarget.workerId,
        date: dateFilter,
        status: auditStatus,
        reason: auditNotes || 'Leader adjusted verification record',
      });
      alert(`Attendance record updated for ${auditTarget.name}`);
      setAuditTarget(null);
      setAuditNotes('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update attendance');
    } finally {
      setSubmittingAudit(false);
    }
  };

  return (
    <div className="space-y-3.5 pb-2">
      {/* 1. TOP CURVED BLUE HERO HEADER CONTAINER */}
      <div className="-mx-3 -mt-3 bg-gradient-to-r from-[#2031c9] via-[#353de0] to-[#5a32de] text-white pt-5 pb-6 px-4 relative overflow-hidden z-10 shadow-sm">
        {/* Subtle decorative smooth background waves */}
        <div className="absolute inset-0 opacity-25 pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 400 120" preserveAspectRatio="none" fill="none">
            <path
              d="M0,20 C120,80 260,-20 400,40 L400,120 L0,120 Z"
              fill="url(#att-wave-grad)"
            />
            <defs>
              <linearGradient id="att-wave-grad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#818cf8" stopOpacity="0.1" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/25 flex items-center justify-center text-white shrink-0 shadow-2xs">
            <CalendarCheck className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white leading-tight tracking-tight">
              Attendance Verification
            </h1>
            <p className="text-2xs text-white/80 font-medium mt-0.5 max-w-[240px] leading-snug">
              Audit GPS check-ins, record manual attendance, and review correction requests
            </p>
          </div>
        </div>
      </div>

      {/* 2. DATE SELECTOR & MARK ATTENDANCE ROW (Exact Match Image 2) */}
      <div className="flex items-center justify-between gap-2">
        {/* Date Dropdown Pill with native date picker trigger */}
        <label className="relative flex-1 cursor-pointer">
          <div className="h-10 px-3.5 bg-white rounded-full border border-slate-200/90 text-xs font-bold text-slate-800 flex items-center justify-between shadow-2xs hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#2b44e7]" />
              <span>
                {new Date(dateFilter + 'T00:00:00').toLocaleDateString('en-US', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
          />
        </label>

        <div className="flex items-center gap-2">
          {/* Blue/Indigo Camera & Auto GPS Attendance Pill Button */}
          <button
            type="button"
            onClick={() => {
              setTargetCameraWorkerId(undefined);
              setCameraModalOpen(true);
            }}
            className="h-10 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 active:scale-95 text-white font-extrabold text-xs rounded-full shadow-md shadow-blue-500/25 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
          >
            <Camera className="w-4 h-4 stroke-[2.5]" />
            <span>Camera & Auto GPS</span>
          </button>

          {/* Purple + Mark Attendance Pill Button */}
          <button
            type="button"
            onClick={() => setManualModalOpen(true)}
            className="h-10 px-3 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-extrabold text-xs rounded-full border border-slate-200/80 flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Manual</span>
          </button>
        </div>
      </div>

      {/* 3. 4 METRIC MINI CARDS (Exact Match Image 2) */}
      <div className="grid grid-cols-4 gap-2">
        {/* Total */}
        <div className="bg-[#f0f5ff] border border-blue-100/80 rounded-2xl py-2.5 px-1.5 flex flex-col items-center justify-center text-center shadow-2xs">
          <Users className="w-4.5 h-4.5 text-[#2563eb] mb-1 stroke-[2]" />
          <span className="text-base font-black text-slate-900 block leading-tight">{totalCount}</span>
          <span className="text-3xs font-bold text-[#2563eb] block mt-0.5">Total</span>
        </div>

        {/* Present */}
        <div className="bg-[#f0fbf4] border border-emerald-100/80 rounded-2xl py-2.5 px-1.5 flex flex-col items-center justify-center text-center shadow-2xs">
          <CheckCircle2 className="w-4.5 h-4.5 text-[#059669] mb-1 stroke-[2]" />
          <span className="text-base font-black text-slate-900 block leading-tight">{presentCount}</span>
          <span className="text-3xs font-bold text-[#059669] block mt-0.5">Present</span>
        </div>

        {/* Pending */}
        <div className="bg-[#fef9ee] border border-amber-100/80 rounded-2xl py-2.5 px-1.5 flex flex-col items-center justify-center text-center shadow-2xs">
          <Clock className="w-4.5 h-4.5 text-[#d97706] mb-1 stroke-[2]" />
          <span className="text-base font-black text-slate-900 block leading-tight">{notCheckedInCount}</span>
          <span className="text-3xs font-bold text-[#d97706] block mt-0.5">Pending</span>
        </div>

        {/* Absent */}
        <div className="bg-[#fff2f4] border border-rose-100/80 rounded-2xl py-2.5 px-1.5 flex flex-col items-center justify-center text-center shadow-2xs">
          <XCircle className="w-4.5 h-4.5 text-[#e11d48] mb-1 stroke-[2]" />
          <span className="text-base font-black text-slate-900 block leading-tight">{absentCount}</span>
          <span className="text-3xs font-bold text-[#e11d48] block mt-0.5">Absent</span>
        </div>
      </div>

      {/* 4. SCOPE FILTER ROW: All Scheduled | By Team | Individual Tasks */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-1 bg-slate-100/90 p-1 rounded-2xl border border-slate-200/80">
          <button
            type="button"
            onClick={() => setScopeFilter('ALL')}
            className={`flex-1 py-1.5 px-2 rounded-xl text-center text-3xs font-extrabold transition-all cursor-pointer ${
              scopeFilter === 'ALL'
                ? 'bg-white text-blue-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Scheduled ({totalCount})
          </button>

          <button
            type="button"
            onClick={() => setScopeFilter('TEAM')}
            className={`flex-1 py-1.5 px-2 rounded-xl text-center text-3xs font-extrabold transition-all cursor-pointer ${
              scopeFilter === 'TEAM'
                ? 'bg-white text-blue-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            By Team
          </button>

          <button
            type="button"
            onClick={() => setScopeFilter('INDIVIDUAL')}
            className={`flex-1 py-1.5 px-2 rounded-xl text-center text-3xs font-extrabold transition-all cursor-pointer ${
              scopeFilter === 'INDIVIDUAL'
                ? 'bg-white text-blue-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Individual Tasks
          </button>
        </div>

        {/* Team Sub-selector when "By Team" filter is active */}
        {scopeFilter === 'TEAM' && teams.length > 0 && (
          <div className="flex items-center justify-between bg-white px-3 py-1.5 rounded-2xl border border-slate-200/80 text-2xs">
            <span className="font-bold text-slate-600 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>Select Team:</span>
            </span>
            <select
              value={selectedTeamFilter}
              onChange={(e) => setSelectedTeamFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-slate-800 font-bold text-3xs focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">All Teams</option>
              {teams.map((t) => (
                <option key={t.teamId} value={t.teamId}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 5. REAL ATTENDANCE VERIFICATION CARDS LIST */}
      {loading ? (
        <LoadingSpinner message="Loading attendance records..." />
      ) : displayCards.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 py-10 shadow-sm border border-slate-100/90 text-center relative overflow-hidden flex flex-col items-center justify-center min-h-[220px]">
          {/* Subtle bottom corner wavy accents */}
          <div className="absolute -bottom-6 -left-6 w-32 h-24 bg-gradient-to-tr from-purple-100/40 to-transparent rounded-tr-full pointer-events-none" />
          <div className="absolute -bottom-6 -right-6 w-32 h-24 bg-gradient-to-tl from-purple-100/40 to-transparent rounded-tl-full pointer-events-none" />

          {/* Calendar Check illustration with sparkles */}
          <div className="relative mb-3">
            <span className="absolute -top-3 -left-4 text-purple-400 text-xs font-bold select-none">
              ✦
            </span>
            <span className="absolute -top-1.5 -right-4 text-purple-400 text-xs font-bold select-none">
              ✦
            </span>
            <span className="absolute -bottom-1 -left-3 text-purple-400 text-2xs font-bold select-none">
              ✦
            </span>
            <div className="w-20 h-14 bg-[#ede9fe] rounded-3xl flex items-center justify-center text-[#7c3aed] shadow-xs border border-purple-200/60">
              <CalendarCheck className="w-9 h-9 stroke-[2.2]" />
            </div>
          </div>

          <h3 className="text-base font-black text-slate-900 tracking-tight">
            No crew scheduled for this date.
          </h3>
          <p className="text-2xs text-slate-500 font-medium mt-1 max-w-[280px]">
            Only workers with scheduled assignments or recorded attendance for this date appear here.
          </p>

          {dateFilter !== getTodayLocal() && (
            <button
              type="button"
              onClick={() => setDateFilter(getTodayLocal())}
              className="mt-3 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-2xs rounded-full shadow-md shadow-blue-500/25 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Jump to Today ({getTodayLocal()})</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {displayCards.map((card) => (
            <div
              key={card.workerId}
              className="bg-white rounded-3xl p-3.5 border border-slate-100 shadow-2xs space-y-3 overflow-hidden"
            >
              {/* Top Row: Safe Avatar + Name/ID/Team + Stacked Badges */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <SafeAvatar src={card.avatarUrl} name={card.name} className="w-11 h-11" />

                  <div className="min-w-0">
                    <h3 className="text-xs font-black text-slate-900 leading-tight truncate">
                      {card.name}
                    </h3>

                    <div className="flex items-center gap-1 text-3xs text-slate-500 font-medium mt-0.5">
                      <span className="font-mono font-bold bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded border border-blue-100 shrink-0">
                        {card.workerId}
                      </span>
                      <span className="text-slate-300">|</span>
                      <span className="flex items-center gap-1 text-slate-500 truncate max-w-[125px]">
                        <Users className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{card.teamName}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="flex flex-col items-end shrink-0">
                  <span className={`px-2.5 py-1 rounded-full text-3xs font-black flex items-center gap-1 shadow-2xs ${card.statusPill}`}>
                    {card.status === 'Present' ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <Clock className="w-3.5 h-3.5" />
                    )}
                    <span>{card.status}</span>
                  </span>
                </div>
              </div>

              {/* Scheduled Work Banner */}
              {card.assignmentTitle && (
                <div className="bg-gradient-to-r from-blue-50/90 to-indigo-50/90 rounded-2xl p-2.5 px-3 border border-blue-100/90 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-black text-slate-900 text-xs truncate flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="truncate">{card.assignmentTitle}</span>
                    </div>
                    <div className="text-4xs text-slate-500 font-semibold mt-0.5 flex items-center gap-1.5">
                      <span className="text-blue-700 font-bold">{card.assignmentLocation}</span>
                      <span className="text-slate-300">•</span>
                      <span>{card.shiftHours}</span>
                    </div>
                  </div>

                  <span className="text-4xs font-black uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200 shrink-0">
                    {card.isTeamAssignment ? 'Team Task' : 'Individual'}
                  </span>
                </div>
              )}

              {/* 3 Metric Columns Container */}
              <div className="bg-slate-50/80 rounded-2xl p-2.5 border border-slate-100 grid grid-cols-3 divide-x divide-slate-200/60 text-center">
                {/* Check-In */}
                <div className="space-y-0.5">
                  <span className="text-4xs text-slate-500 font-semibold flex items-center justify-center gap-1">
                    <LogIn className="w-3 h-3 text-blue-600" />
                    <span>Check-In</span>
                  </span>
                  <strong className="text-xs font-black text-slate-900 block">
                    {card.checkIn}
                  </strong>
                </div>

                {/* Check-Out */}
                <div className="space-y-0.5 px-1">
                  <span className="text-4xs text-slate-500 font-semibold flex items-center justify-center gap-1">
                    <LogOut className="w-3 h-3 text-rose-500" />
                    <span>Check-Out</span>
                  </span>
                  <strong className="text-xs font-black text-slate-900 block">
                    {card.checkOut}
                  </strong>
                </div>

                {/* Duration */}
                <div className="space-y-0.5">
                  <span className="text-4xs text-slate-500 font-semibold flex items-center justify-center gap-1">
                    <Clock className="w-3 h-3 text-blue-600" />
                    <span>Duration</span>
                  </span>
                  <strong className={`text-xs font-black block ${card.durationColor}`}>
                    {card.duration}
                  </strong>
                </div>
              </div>

              {/* Verification & Distance Row */}
              <div className="flex items-center justify-between text-2xs px-0.5">
                <div className="flex items-center gap-1 text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>GPS Distance:</span>
                  <strong className="text-emerald-700 font-black">{card.gpsDistance}</strong>
                </div>

                <div className="flex items-center gap-1.5 font-bold">
                  {card.verificationType === 'VERIFIED' ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="text-emerald-700 text-3xs font-black">{card.siteVerification}</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="text-slate-600 text-3xs font-black">{card.siteVerification}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Action Buttons: Camera Verify & Audit / Adjust */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setTargetCameraWorkerId(card.workerId);
                    setCameraModalOpen(true);
                  }}
                  className="flex-1 min-h-[40px] py-2 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-98 text-white font-black text-2xs rounded-2xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Camera Verify (GPS)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAuditTarget(card);
                    setAuditStatus(card.status === 'Present' ? 'PRESENT' : 'PRESENT');
                  }}
                  className="min-h-[40px] py-2 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-2xs rounded-2xl transition-all border border-slate-200/80 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Adjust</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MARK MANUAL ATTENDANCE MODAL */}
      <Modal
        isOpen={manualModalOpen}
        onClose={() => setManualModalOpen(false)}
        title="Mark Manual Attendance"
      >
        <form onSubmit={handleManualSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1 text-2xs">Select Field Worker</label>
            <select
              value={manualWorkerId}
              onChange={(e) => setManualWorkerId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white font-semibold"
            >
              {workers.map((w) => (
                <option key={w.workerId} value={w.workerId}>
                  {w.name} ({w.workerId})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1 text-2xs">Duty Status</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setManualStatus('PRESENT')}
                className={`py-2 rounded-xl font-bold text-xs border ${
                  manualStatus === 'PRESENT'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                Mark Present
              </button>
              <button
                type="button"
                onClick={() => setManualStatus('ABSENT')}
                className={`py-2 rounded-xl font-bold text-xs border ${
                  manualStatus === 'ABSENT'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                Mark Absent
              </button>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1 text-2xs">Verification Reason / Note</label>
            <textarea
              required
              rows={2}
              value={manualReason}
              onChange={(e) => setManualReason(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
            />
          </div>

          <button
            type="submit"
            disabled={submittingManual}
            className="w-full min-h-[46px] py-2.5 bg-[#7c3aed] hover:bg-purple-700 text-white font-black rounded-2xl shadow-sm text-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <Send className="w-4 h-4" />
            <span>{submittingManual ? 'Recording...' : 'Confirm Manual Record'}</span>
          </button>
        </form>
      </Modal>

      {/* AUDIT / ADJUST MODAL */}
      <Modal
        isOpen={!!auditTarget}
        onClose={() => setAuditTarget(null)}
        title={auditTarget ? `Audit Record: ${auditTarget.name}` : ''}
      >
        {auditTarget && (
          <form onSubmit={handleAuditSubmit} className="space-y-3.5 text-xs">
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1 text-2xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Worker ID:</span>
                <span className="font-mono font-bold text-slate-900">{auditTarget.workerId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Recorded Distance:</span>
                <span className="font-bold text-emerald-700">{auditTarget.gpsDistance}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Logged Check-In:</span>
                <span className="font-bold text-slate-900">{auditTarget.checkIn}</span>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 text-2xs">Adjust Status</label>
              <div className="grid grid-cols-3 gap-2">
                {['PRESENT', 'LATE', 'ABSENT'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setAuditStatus(st)}
                    className={`py-2 rounded-xl font-bold text-2xs border ${
                      auditStatus === st
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 text-2xs">Leader Audit Notes</label>
              <textarea
                required
                rows={2}
                value={auditNotes}
                onChange={(e) => setAuditNotes(e.target.value)}
                placeholder="State reason for audit adjustment..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={submittingAudit}
              className="w-full min-h-[46px] py-2.5 bg-[#1752d5] hover:bg-blue-700 text-white font-black rounded-2xl shadow-sm text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{submittingAudit ? 'Saving...' : 'Save Audit Correction'}</span>
            </button>
          </form>
        )}
      </Modal>

      {/* CAMERA & AUTO GPS ATTENDANCE MODAL */}
      <LeaderAttendanceCameraModal
        isOpen={cameraModalOpen}
        onClose={() => setCameraModalOpen(false)}
        workers={workers}
        teams={teams}
        locations={locations}
        targetWorkerId={targetCameraWorkerId}
        onSuccess={() => {
          setCameraModalOpen(false);
          loadData();
        }}
      />
    </div>
  );
};
