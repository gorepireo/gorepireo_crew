import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../services/api';
import { Assignment, Attendance, WorkLocation } from '../../types';
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
      const [assignments, attendanceList, locs] = await Promise.all([
        api.getAssignments({ date: today }),
        api.getAttendance({ date: today }),
        api.getLocations().catch(() => []),
      ]);

      setLocations(locs);

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

  const isUnassigned = worker?.teamAssignmentStatus === 'UNASSIGNED' || !worker?.primaryTeamId;

  const currentHour = new Date().getHours();
  const timeGreeting =
    currentHour < 12 ? 'Good morning' : currentHour < 17 ? 'Good afternoon' : 'Good evening';

  const handleRefreshStatus = async () => {
    setIsRefreshing(true);
    try {
      if (refreshMe) {
        await refreshMe();
      }
      await loadData();
    } catch (e) {
      console.error('Refresh status error', e);
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
    }
  };

  if (isUnassigned) {
    return (
      <div className="space-y-4 pb-4">
        {/* TOP GREETING & STATUS ROW */}
        <div className="flex items-center justify-between pt-1 pb-0.5">
          <div className="flex items-center gap-3">
            <div className="relative">
              <SafeAvatar
                src={worker?.photoURL || user?.photoURL}
                name={workerName}
                className="w-12 h-12 rounded-full border-2 border-white shadow-xs"
              />
              <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">
                {timeGreeting},
              </p>
              <h2 className="text-xl font-black text-slate-900 leading-tight">
                {workerName}
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500 font-medium">
                <Contact className="w-3.5 h-3.5 text-slate-400" />
                <span>Worker ID</span>
                <span className="text-blue-600 font-bold font-mono">
                  {worker?.workerId || 'WC-2026-016'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-3 py-1 rounded-full text-xs font-extrabold shadow-2xs">
            <Navigation className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
            <span>GPS Ready</span>
          </div>
        </div>

        {/* 1. NOT ASSIGNED YET CARD (Exact Match Reference 448db8fb) */}
        <div className="bg-[#fef9f3] border border-[#fde8cc]/90 rounded-[28px] p-3.5 pr-4 shadow-xs flex items-stretch gap-2.5 sm:gap-3.5">
          {/* Left Column: Worker Illustration */}
          <div className="w-[34%] shrink-0 flex items-center justify-center relative">
            <img
              src="/worker-illustration.png"
              alt="Worker"
              className="w-full h-full max-h-[140px] object-contain object-bottom select-none"
            />
          </div>

          {/* Subtle Vertical Divider */}
          <div className="w-px bg-[#f3e5cd]/80 my-1 shrink-0" />

          {/* Right Column: Title, Subtitle, and Contact Notice Box */}
          <div className="flex-1 min-w-0 py-0.5 flex flex-col justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-black text-[#381e05] tracking-tight leading-tight">
                Not assigned yet
              </h3>
              <p className="text-2xs sm:text-xs text-[#526077] font-semibold leading-relaxed mt-1">
                Your account is active, but you haven't been assigned to a team yet.
              </p>
            </div>

            {/* Yellow Contact Notice Callout */}
            <div className="bg-[#fdedc7] rounded-2xl py-2 px-2.5 sm:px-3 flex items-center gap-2 mt-2">
              <Users className="w-4.5 h-4.5 text-[#78350f] stroke-[2.2] shrink-0" />
              <div className="text-3xs sm:text-2xs font-bold text-[#78350f] leading-snug">
                <div>Please contact your administrator</div>
                <div>or team leader.</div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. WHAT HAPPENS NEXT? CARD */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-4">
          <h3 className="text-sm font-black text-slate-900">
            What happens next?
          </h3>

          <div className="flex items-center justify-between px-1">
            {/* Step 1 */}
            <div className="flex flex-col items-center flex-1 max-w-[85px]">
              <div className="w-14 h-14 rounded-full bg-blue-50/80 text-blue-600 flex items-center justify-center relative shadow-xs">
                <span className="absolute -top-1 -left-1 w-5 h-5 bg-blue-600 text-white rounded-full text-3xs font-black flex items-center justify-center shadow-xs">
                  1
                </span>
                <Users className="w-6 h-6 stroke-[2]" />
              </div>
              <p className="text-xs font-bold text-slate-700 text-center mt-2.5 leading-tight">
                Get assigned<br />to a team
              </p>
            </div>

            {/* Connector Arrow 1 */}
            <ChevronRight className="w-4 h-4 text-slate-300 shrink-0 mx-1 -mt-5" />

            {/* Step 2 */}
            <div className="flex flex-col items-center flex-1 max-w-[85px]">
              <div className="w-14 h-14 rounded-full bg-purple-50/80 text-purple-600 flex items-center justify-center relative shadow-xs">
                <span className="absolute -top-1 -left-1 w-5 h-5 bg-purple-600 text-white rounded-full text-3xs font-black flex items-center justify-center shadow-xs">
                  2
                </span>
                <Calendar className="w-6 h-6 stroke-[2]" />
              </div>
              <p className="text-xs font-bold text-slate-700 text-center mt-2.5 leading-tight">
                Receive your<br />daily work
              </p>
            </div>

            {/* Connector Arrow 2 */}
            <ChevronRight className="w-4 h-4 text-slate-300 shrink-0 mx-1 -mt-5" />

            {/* Step 3 */}
            <div className="flex flex-col items-center flex-1 max-w-[85px]">
              <div className="w-14 h-14 rounded-full bg-blue-50/80 text-blue-600 flex items-center justify-center relative shadow-xs">
                <span className="absolute -top-1 -left-1 w-5 h-5 bg-blue-600 text-white rounded-full text-3xs font-black flex items-center justify-center shadow-xs">
                  3
                </span>
                <MapPin className="w-6 h-6 stroke-[2]" />
              </div>
              <p className="text-xs font-bold text-slate-700 text-center mt-2.5 leading-tight">
                Check in and<br />start work
              </p>
            </div>
          </div>
        </div>

        {/* 3. ACCOUNT DETAILS CARD */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
              <User className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-black text-slate-900">
              Account Details
            </h3>
          </div>

          <div className="space-y-3.5 divide-y divide-slate-100">
            {/* Worker ID */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2.5 text-xs font-medium text-slate-600">
                <Contact className="w-4 h-4 text-slate-400" />
                <span>Worker ID</span>
              </div>
              <span className="font-mono font-bold text-blue-600 text-xs">
                {worker?.workerId || 'WC-2026-016'}
              </span>
            </div>

            {/* Account Status */}
            <div className="flex items-center justify-between pt-3">
              <div className="flex items-center gap-2.5 text-xs font-medium text-slate-600">
                <ShieldCheck className="w-4 h-4 text-slate-400" />
                <span>Account Status</span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Active
              </span>
            </div>

            {/* Team */}
            <div className="flex items-center justify-between pt-3">
              <div className="flex items-center gap-2.5 text-xs font-medium text-slate-600">
                <Users className="w-4 h-4 text-slate-400" />
                <span>Team</span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-extrabold bg-amber-50 text-amber-800 border border-amber-200/60">
                <Users className="w-3.5 h-3.5 text-amber-600" />
                Unassigned
              </span>
            </div>
          </div>

          {/* Refresh Status Button */}
          <div className="pt-1">
            <button
              type="button"
              disabled={isRefreshing}
              onClick={handleRefreshStatus}
              className="w-full py-3 px-4 bg-blue-50/70 hover:bg-blue-100 text-blue-600 font-extrabold text-xs rounded-2xl border border-blue-100/80 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
            >
              <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh status</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
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

      {/* 1. BLUE TODAY STATUS BANNER (Exact Match Image 1) */}
      <div className="bg-gradient-to-r from-[#1752d5] via-[#1a58dd] to-[#1244b7] text-white p-4.5 rounded-3xl shadow-sm relative overflow-hidden">
        {/* Subtle decorative wave */}
        <div className="absolute -bottom-8 -left-8 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start justify-between relative z-10">
          {/* Left Column: Date & Greeting */}
          <div>
            <div className="flex items-center gap-1.5 text-blue-100 text-2xs font-semibold">
              <Calendar className="w-3.5 h-3.5" />
              <span>{todayDateFormatted}</span>
            </div>

            <h2 className="text-lg font-black text-white mt-1.5 leading-snug tracking-tight">
              Good Morning,<br />
              {workerName}
            </h2>
          </div>

          {/* Right Column: Present Badge & Work Time */}
          <div className="text-right flex flex-col items-end">
            <span className="bg-[#bbf7d0] text-[#14532d] px-3 py-0.5 rounded-full text-2xs font-black uppercase tracking-wider shadow-2xs">
              {todayAttendance?.status === 'PRESENT' || isCheckedIn ? 'PRESENT' : 'READY'}
            </span>

            <div className="mt-2 text-right">
              <span className="text-3xs text-blue-100 flex items-center justify-end gap-1 font-semibold">
                <Clock className="w-3 h-3" />
                <span>Work Time</span>
              </span>
              <div className="text-xl font-black text-white tracking-tight mt-0.5">
                {checkInDisplayTime}
              </div>
              <span className="text-4xs text-blue-100/90 font-medium block mt-0.5">
                Shift: {todayAssignment?.startTime || '09:00 AM'} – {todayAssignment?.endTime || '05:30 PM'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. DUAL ACTION CARDS (Start Work Check In & End Work Check Out) (Exact Match Image 1) */}
      <div className="grid grid-cols-2 gap-3">
        {/* Start Work (Check In) */}
        <button
          type="button"
          onClick={handleStartWork}
          disabled={isCheckedIn}
          className={`min-h-[96px] p-4 rounded-3xl text-left flex flex-col items-center justify-center gap-1.5 transition-all shadow-xs ${
            !isCheckedIn
              ? 'bg-[#16a34a] hover:bg-[#15803d] active:scale-98 text-white'
              : 'bg-[#16a34a]/85 text-white opacity-90'
          }`}
        >
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
            <Play className="w-4 h-4 fill-white text-white translate-x-0.5" />
          </div>
          <div className="text-center">
            <span className="block font-black text-sm text-white leading-tight">
              Start Work
            </span>
            <span className="text-3xs text-white/90 font-medium">
              (Check In)
            </span>
          </div>
        </button>

        {/* End Work (Check Out) */}
        <button
          type="button"
          onClick={handleEndWork}
          disabled={!isCheckedIn || isCheckedOut}
          className={`min-h-[96px] p-4 rounded-3xl text-left flex flex-col items-center justify-center gap-1.5 transition-all shadow-xs ${
            isCheckedIn && !isCheckedOut
              ? 'bg-slate-900 hover:bg-slate-800 text-white active:scale-98'
              : 'bg-[#eaedf4] text-[#64748b] cursor-default'
          }`}
        >
          <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
            isCheckedIn && !isCheckedOut ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-400'
          }`}>
            <Square className="w-3.5 h-3.5 fill-current" />
          </div>
          <div className="text-center">
            <span className={`block font-black text-sm leading-tight ${
              isCheckedIn && !isCheckedOut ? 'text-white' : 'text-[#64748b]'
            }`}>
              End Work
            </span>
            <span className={`text-3xs font-medium ${
              isCheckedIn && !isCheckedOut ? 'text-slate-300' : 'text-[#94a3b8]'
            }`}>
              (Check Out)
            </span>
          </div>
        </button>
      </div>

      {/* 3. LOCATION VERIFICATION CARD (Dynamic GPS & Assignment Link) */}
      <div
        className={`${
          todayAttendance?.status === 'PRESENT'
            ? 'bg-[#eafaf1] border-[#bbf7d0]'
            : 'bg-[#f8fafc] border-slate-200'
        } border rounded-2xl p-3 flex items-center justify-between shadow-2xs`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-6 h-6 rounded-full ${
              todayAttendance?.status === 'PRESENT'
                ? 'bg-[#16a34a] text-white'
                : 'bg-slate-200 text-slate-500'
            } flex items-center justify-center shrink-0`}
          >
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-black text-slate-900 leading-tight">
              {todayAttendance?.status === 'PRESENT'
                ? todayAttendance.verificationStatus === 'VERIFIED'
                  ? 'You are at the work location'
                  : 'Attendance Recorded'
                : todayAssignment
                ? 'Assigned Work Location'
                : 'No Work Location Assigned'}
            </h4>
            <p className="text-2xs text-slate-500 font-medium mt-0.5 truncate">
              {todayAttendance?.checkInAddress
                ? todayAttendance.checkInAddress
                : todayAssignment
                ? todayAssignment.locationName || todayAssignment.locationAddress || 'Assigned Site'
                : 'Standby for team dispatch'}
            </p>
          </div>
        </div>

        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
      </div>

      {/* 4. TODAY'S ASSIGNMENT CARD (Derived 100% from Live Data) */}
      <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-black text-slate-900">Today's Assignment</h3>
          </div>

          <button
            type="button"
            onClick={() => navigate('/worker/work')}
            className="text-2xs font-extrabold text-blue-600 hover:underline flex items-center gap-0.5"
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
              <div className="flex items-center justify-between">
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
                  <div className={`p-1.5 rounded-xl text-3xs font-extrabold flex flex-col items-center border ${
                    isCheckedIn
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}>
                    <span>{isCheckedIn ? '✓ 1. Attendance' : '1. Attendance'}</span>
                    <span className="text-4xs opacity-75 font-normal">
                      {isCheckedIn ? 'Verified' : 'Required'}
                    </span>
                  </div>

                  {/* Step 2: Before Photo */}
                  <div className={`p-1.5 rounded-xl text-3xs font-extrabold flex flex-col items-center border ${
                    hasBeforeWorkPhoto
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : isCheckedIn
                      ? 'bg-amber-50 text-amber-800 border-amber-300 ring-1 ring-amber-400/50'
                      : 'bg-slate-50 text-slate-400 border-slate-200'
                  }`}>
                    <span>{hasBeforeWorkPhoto ? '✓ 2. Before Pic' : '2. Before Pic'}</span>
                    <span className="text-4xs opacity-75 font-normal">
                      {hasBeforeWorkPhoto ? 'Recorded' : isCheckedIn ? 'Next Step' : 'Step 2'}
                    </span>
                  </div>

                  {/* Step 3: After Photo / Auto-Verify */}
                  <div className={`p-1.5 rounded-xl text-3xs font-extrabold flex flex-col items-center border ${
                    hasAfterWorkPhoto
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : hasBeforeWorkPhoto
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-300 ring-1 ring-indigo-400/50'
                      : 'bg-slate-50 text-slate-400 border-slate-200'
                  }`}>
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
                      className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-2xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 active:scale-98 transition-all"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Step 1: Check In with Attendance Selfie</span>
                    </button>
                  ) : !hasBeforeWorkPhoto ? (
                    <button
                      type="button"
                      onClick={() => setWorkCameraModalOpen(true)}
                      className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white font-black text-2xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 active:scale-98 transition-all"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Step 2: Snap Before-Cleaning Photo</span>
                    </button>
                  ) : !hasAfterWorkPhoto ? (
                    <button
                      type="button"
                      onClick={() => setWorkCameraModalOpen(true)}
                      className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-2xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 active:scale-98 transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Step 3: Complete Work (After Photo & Auto-Verify)</span>
                    </button>
                  ) : (
                    <div className="w-full py-1.5 px-3 bg-emerald-50 text-emerald-800 border border-emerald-200 font-extrabold text-2xs rounded-xl flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Duty Completed & Auto-Verified ✓</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 text-center text-slate-400 text-xs font-medium">
            No assignment scheduled for today. Tap 'My Work' to review all jobs.
          </div>
        )}
      </div>

      {/* 5. THREE QUICK ACTION CARDS */}
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
              if (window.confirm('Step 1 is Attendance Check-In! You should verify attendance first before recording work photos. Open Attendance Check-In now?')) {
                handleStartWork();
                return;
              }
            }
            setWorkCameraModalOpen(true);
          }}
          className="p-3 bg-[#eef2ff] hover:bg-[#e0e7ff] rounded-2xl border border-indigo-100 flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 shadow-2xs"
        >
          <div className="w-9 h-9 rounded-xl bg-[#6366f1] text-white flex items-center justify-center shadow-xs">
            <Camera className="w-5 h-5" />
          </div>
          <span className="text-3xs font-extrabold text-slate-800 text-center leading-tight">
            Take Work<br />Photo
          </span>
        </button>

        {/* 2. Directions */}
        {todayAssignment?.locationLatitude && todayAssignment?.locationLongitude ? (
          <a
            href={`https://maps.google.com/?q=${todayAssignment.locationLatitude},${todayAssignment.locationLongitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 bg-[#eff6ff] hover:bg-[#dbeafe] rounded-2xl border border-blue-100 flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 shadow-2xs text-center"
          >
            <div className="w-9 h-9 rounded-xl bg-[#2563eb] text-white flex items-center justify-center shadow-xs">
              <MapPin className="w-5 h-5 fill-white text-white" />
            </div>
            <span className="text-3xs font-extrabold text-slate-800 text-center leading-tight">
              Directions
            </span>
          </a>
        ) : (
          <div
            onClick={() => alert('No site GPS coordinates on file for today.')}
            className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center gap-1.5 shadow-2xs text-center opacity-70 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-slate-200 text-slate-400 flex items-center justify-center shadow-xs">
              <MapPin className="w-5 h-5" />
            </div>
            <span className="text-3xs font-extrabold text-slate-400 text-center leading-tight">
              Directions<br />Unavailable
            </span>
          </div>
        )}

        {/* 3. Call Team Leader */}
        {leaderPhone ? (
          <a
            href={`tel:${leaderPhone}`}
            className="p-3 bg-[#faf5ff] hover:bg-[#f3e8ff] rounded-2xl border border-purple-100 flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 shadow-2xs text-center"
          >
            <div className="w-9 h-9 rounded-xl bg-[#9333ea] text-white flex items-center justify-center shadow-xs">
              <Phone className="w-5 h-5 fill-white text-white" />
            </div>
            <span className="text-3xs font-extrabold text-slate-800 text-center leading-tight">
              Call<br />Team Leader
            </span>
          </a>
        ) : (
          <div
            onClick={() => alert('No team leader phone number registered.')}
            className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center gap-1.5 shadow-2xs text-center opacity-70 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-slate-200 text-slate-400 flex items-center justify-center shadow-xs">
              <Phone className="w-5 h-5" />
            </div>
            <span className="text-3xs font-extrabold text-slate-400 text-center leading-tight">
              Leader<br />Unavailable
            </span>
          </div>
        )}
      </div>

      {/* 6. RECENT UPDATES SECTION (Exact Match Image 1) */}
      <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-black text-slate-900">Recent Updates</h3>
          </div>

          <button
            type="button"
            className="text-2xs font-extrabold text-blue-600 hover:underline flex items-center gap-0.5"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2.5">
          {!todayAssignment && !todayAttendance ? (
            <div className="p-4 text-center text-slate-400 text-2xs font-medium">
              No recent updates for today yet.
            </div>
          ) : (
            <>
              {/* Update Item 1: New Work Assignment */}
              {todayAssignment && (
                <div className="flex items-center justify-between gap-2 p-1">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-black text-slate-900 leading-tight">
                        New Work Assignment
                      </h4>
                      <p className="text-3xs text-slate-500 font-medium mt-0.5 truncate max-w-[200px]">
                        {todayAssignment.title} at {todayAssignment.locationName || todayAssignment.locationAddress || 'Site'}
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
                      <h4 className="text-xs font-black text-slate-900 leading-tight">
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
