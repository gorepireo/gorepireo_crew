import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { Attendance, Assignment, WorkLocation } from '../../types';
import { Modal } from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { AttendanceCameraModal } from '../../components/camera/AttendanceCameraModal';
import {
  Calendar,
  Clock,
  Plus,
  LogIn,
  LogOut,
  MapPin,
  CheckCircle2,
  BarChart2,
  ChevronRight,
  Send,
} from 'lucide-react';

export const WorkerAttendance: React.FC = () => {
  const { t } = useLanguage();
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllHistory, setShowAllHistory] = useState(false);

  // Leave modal state
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [leaveType, setLeaveType] = useState('CASUAL');
  const [leaveReason, setLeaveReason] = useState('');
  const [submittingLeave, setSubmittingLeave] = useState(false);

  // Attendance Camera Modal state
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [attendanceMode, setAttendanceMode] = useState<'CHECK_IN' | 'CHECK_OUT'>('CHECK_IN');
  const [todayAssignment, setTodayAssignment] = useState<Assignment | null>(null);
  const [locations, setLocations] = useState<WorkLocation[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().slice(0, 10);
      const [attData, asns, locs] = await Promise.all([
        api.getAttendanceHistory(),
        api.getAssignments({ date: today }).catch(() => []),
        api.getLocations().catch(() => []),
      ]);
      attData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setAttendance(attData);
      setTodayAssignment(asns[0] || null);
      setLocations(locs);
    } catch (e) {
      console.error('Failed to load attendance history', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingLeave(true);
    try {
      await api.applyLeave({
        startDate,
        endDate,
        leaveType,
        reason: leaveReason,
      });
      alert('Leave application submitted for approval.');
      setLeaveModalOpen(false);
      setStartDate('');
      setEndDate('');
      setLeaveReason('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to submit leave');
    } finally {
      setSubmittingLeave(false);
    }
  };

  const handleStartCheckIn = () => {
    setAttendanceMode('CHECK_IN');
    setAttendanceModalOpen(true);
  };

  const handleStartCheckOut = () => {
    setAttendanceMode('CHECK_OUT');
    setAttendanceModalOpen(true);
  };

  const handleAttendanceSuccess = () => {
    setAttendanceModalOpen(false);
    loadData();
  };

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayRecord = attendance.find((a) => a.date === todayStr) || null;

  const formatTime = (iso?: string) => {
    if (!iso) return '--:--';
    try {
      return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '--:--';
    }
  };

  const formatDuration = (mins?: number, start?: string, end?: string) => {
    if (mins && mins > 0) {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return `${h}h ${m}m`;
    }
    if (start && end) {
      const diff = Math.max(0, new Date(end).getTime() - new Date(start).getTime());
      const totalMinutes = Math.floor(diff / 60000);
      const h = Math.floor(totalMinutes / 60);
      const m = totalMinutes % 60;
      return `${h}h ${m}m`;
    }
    return '--:--';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return { label: 'Present', class: 'bg-[#ecfdf5] text-[#16a34a] border border-emerald-200' };
      case 'ABSENT':
        return { label: 'Absent', class: 'bg-[#fef2f2] text-[#dc2626] border border-rose-200' };
      case 'HALF_DAY':
        return { label: 'Half Day', class: 'bg-[#fffbeb] text-[#d97706] border border-amber-200' };
      case 'LATE':
        return { label: 'Late', class: 'bg-[#fff7ed] text-[#ea580c] border border-orange-200' };
      default:
        return { label: status, class: 'bg-slate-100 text-slate-700 border border-slate-200' };
    }
  };

  // Format today's date like "Thu, 19 Nov, 2026"
  const todayDateFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const checkInDisplay = formatTime(todayRecord?.checkInTime);
  const checkOutDisplay = formatTime(todayRecord?.checkOutTime);
  const totalHoursDisplay = formatDuration(
    todayRecord?.workingMinutes,
    todayRecord?.checkInTime,
    todayRecord?.checkOutTime
  );

  const displayedHistory = showAllHistory ? attendance : attendance.slice(0, 5);

  return (
    <div className="space-y-3.5 pb-4">
      {/* 1. TOP HERO HEADER (Full-Bleed Exact Match) */}
      <div className="-mx-3 -mt-4 bg-[#3b52ec] text-white pt-5 pb-6 px-4 rounded-b-[28px] shadow-sm relative overflow-hidden flex items-center justify-between">
        {/* Real Wavy Ribbon Background Banner */}
        <img
          src="/header-bg-wave.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none"
        />

        <div className="space-y-1 relative z-10 min-w-0 pr-2">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-6 h-6 text-white stroke-[2.4]" />
            <h1 className="text-xl font-black text-white tracking-tight leading-tight">
              Attendance
            </h1>
          </div>
          <p className="text-xs text-blue-100/90 font-medium">
            Daily duty history & working hours
          </p>
        </div>

        {/* 3D Calendar Illustration with checkmark */}
        <div className="relative z-10 shrink-0 -my-1">
          <img
            src="/attendance-header-graphic.png"
            alt="Attendance"
            className="w-28 sm:w-32 h-auto object-contain drop-shadow-md select-none transform translate-x-1"
          />
        </div>
      </div>

      {/* 2. APPLY LEAVE BUTTON (Top-Right Floating Pill) */}
      <div className="flex justify-end pt-1">
        <button
          type="button"
          onClick={() => setLeaveModalOpen(true)}
          className="min-h-[38px] px-4 py-2 bg-gradient-to-r from-[#4352f5] to-[#5f49f8] hover:opacity-95 active:scale-95 text-white font-bold text-xs rounded-full shadow-sm shadow-indigo-500/20 flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Apply Leave</span>
        </button>
      </div>

      {/* 3. TODAY'S ATTENDANCE CARD */}
      <div className="bg-white rounded-[26px] p-4.5 border border-slate-100 shadow-xs space-y-3.5">
        {/* Card Header: Date & Status Pill */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-[#4352f5] flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-sm font-black text-slate-800 leading-tight">
                {todayDateFormatted}
              </div>
              <div className="text-3xs text-slate-400 font-medium mt-0.5">
                Today's Attendance
              </div>
            </div>
          </div>

          {todayRecord?.status === 'PRESENT' ? (
            <span className="bg-[#16a34a] text-white px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Present</span>
            </span>
          ) : todayRecord?.status === 'HALF_DAY' ? (
            <span className="bg-[#f59e0b] text-white px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-2xs">
              <Clock className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Half Day</span>
            </span>
          ) : (
            <span className="bg-[#f97316] text-white px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-2xs">
              <Clock className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Not Checked In</span>
            </span>
          )}
        </div>

        {/* 3 Metric Columns Container */}
        <div className="bg-[#f8f9ff] rounded-2xl p-3 border border-indigo-50/70 grid grid-cols-3 gap-2 text-center">
          {/* Check-In */}
          <div className="space-y-1">
            <div className="w-7 h-7 rounded-full bg-emerald-100/70 text-emerald-600 flex items-center justify-center mx-auto">
              <LogIn className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
            <span className="text-3xs font-medium text-slate-400 block mt-1">
              Check-In
            </span>
            <strong className="text-xs font-black text-slate-800 block mt-0.5">
              {checkInDisplay}
            </strong>
          </div>

          {/* Check-Out */}
          <div className="space-y-1 border-x border-slate-100/80 px-1">
            <div className="w-7 h-7 rounded-full bg-rose-100/70 text-rose-500 flex items-center justify-center mx-auto">
              <LogOut className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
            <span className="text-3xs font-medium text-slate-400 block mt-1">
              Check-Out
            </span>
            <strong className="text-xs font-black text-slate-800 block mt-0.5">
              {checkOutDisplay}
            </strong>
          </div>

          {/* Total Hours */}
          <div className="space-y-1">
            <div className="w-7 h-7 rounded-full bg-indigo-100/70 text-[#4352f5] flex items-center justify-center mx-auto">
              <Clock className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
            <span className="text-3xs font-medium text-slate-400 block mt-1">
              Total Hours
            </span>
            <strong className="text-xs font-black text-slate-800 block mt-0.5">
              {totalHoursDisplay}
            </strong>
          </div>
        </div>

        {/* Data-Driven Site Verification Row */}
        {todayRecord?.checkInTime ? (
          todayRecord.verificationStatus === 'VERIFIED' ? (
            <div className="bg-[#e6f9f0] border border-emerald-100 rounded-full py-2.5 px-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 min-w-0">
                <MapPin className="w-4 h-4 text-[#16a34a] fill-[#16a34a]/20 shrink-0" />
                <span className="truncate">
                  {todayRecord.checkInAddress || 'Verified Site Attendance'}
                </span>
              </div>
              <div className="w-4.5 h-4.5 rounded-full bg-[#16a34a] text-white flex items-center justify-center shrink-0 ml-2">
                <CheckCircle2 className="w-3 h-3 stroke-[3]" />
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200/80 rounded-full py-2.5 px-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900 min-w-0">
                <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="truncate">
                  {todayRecord.checkInAddress || 'Checked in (verification pending)'}
                </span>
              </div>
              <div className="w-4.5 h-4.5 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 ml-2">
                <Clock className="w-3 h-3 stroke-[3]" />
              </div>
            </div>
          )
        ) : (
          <div className="bg-slate-50 border border-slate-200/80 rounded-full py-2.5 px-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 min-w-0">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate">No check-in recorded for today</span>
            </div>
            <Clock className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
          </div>
        )}

        {/* Action Buttons: Check In & Check Out */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={handleStartCheckIn}
            className="min-h-[44px] py-3 px-4 bg-[#2f55d4] hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-xs rounded-2xl shadow-sm shadow-blue-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <LogIn className="w-4 h-4 stroke-[2.5]" />
            <span>Check In</span>
          </button>

          <button
            type="button"
            onClick={handleStartCheckOut}
            className="min-h-[44px] py-3 px-4 bg-[#eef1fa] hover:bg-[#e4e8f7] active:scale-[0.98] text-[#374151] font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4 stroke-[2.5]" />
            <span>Check Out</span>
          </button>
        </div>
      </div>

      {/* 4. ATTENDANCE HISTORY CARD */}
      <div className="bg-white rounded-[26px] p-5 border border-slate-100 shadow-xs space-y-4">
        {/* Header Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4.5 h-4.5 text-[#4352f5] stroke-[2.5]" />
            <h3 className="text-sm font-black text-slate-800">Attendance History</h3>
          </div>

          <button
            type="button"
            onClick={() => setShowAllHistory(!showAllHistory)}
            className="text-xs font-bold text-[#4352f5] hover:text-blue-700 flex items-center gap-0.5 transition-colors"
          >
            <span>{showAllHistory ? 'Show Less' : 'View All'}</span>
            <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>

        {/* Content: Empty State or Historical List */}
        {attendance.length === 0 ? (
          <div className="py-6 flex flex-col items-center justify-center text-center">
            <img
              src="/no-attendance.png"
              alt="No Attendance History"
              className="w-52 max-w-[220px] h-auto object-contain mx-auto mb-3 select-none"
            />
            <h4 className="text-sm font-black text-slate-800">
              No Attendance History Yet
            </h4>
            <p className="text-xs text-slate-400 font-normal mt-1 max-w-[260px]">
              Your check-in and check-out records will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3 divide-y divide-slate-100">
            {displayedHistory.map((row, idx) => {
              const d = new Date(row.date + 'T00:00:00');
              const monthStr = d.toLocaleDateString([], { month: 'short' });
              const dayStr = d.getDate();
              const fullDateStr = d.toLocaleDateString([], {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              const cIn = formatTime(row.checkInTime);
              const cOut = formatTime(row.checkOutTime);
              const dur = formatDuration(row.workingMinutes, row.checkInTime, row.checkOutTime);
              const subtitle =
                cIn !== '--:--'
                  ? `${cIn}${cOut !== '--:--' ? ` – ${cOut}` : ''}${dur !== '--:--' ? ` (${dur})` : ''}`
                  : '—';

              const badge = getStatusBadge(row.status);

              return (
                <div
                  key={row.attendanceId || idx}
                  className={`flex items-center justify-between gap-3 ${idx > 0 ? 'pt-3' : ''}`}
                >
                  {/* Date Box Badge */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 bg-[#eef2f7] rounded-2xl flex flex-col items-center justify-center text-center shrink-0">
                      <span className="text-4xs font-bold text-slate-500 uppercase leading-none">
                        {monthStr}
                      </span>
                      <span className="text-base font-black text-slate-900 leading-tight">
                        {dayStr}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="min-w-0">
                      <h4 className="text-xs font-black text-slate-900 leading-snug truncate">
                        {fullDateStr}
                      </h4>
                      <p className="text-3xs text-slate-500 font-medium mt-0.5 truncate">
                        {subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Status Pill */}
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-extrabold shrink-0 ${badge.class}`}
                  >
                    {badge.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. ATTENDANCE CAMERA MODAL (GPS + Selfie verification) */}
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
        attendanceId={todayRecord?.attendanceId}
        onSuccess={handleAttendanceSuccess}
      />

      {/* 6. APPLY LEAVE MODAL */}
      <Modal
        isOpen={leaveModalOpen}
        onClose={() => setLeaveModalOpen(false)}
        title="Apply for Leave"
      >
        <form onSubmit={handleApplyLeave} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1 text-2xs">Leave Type</label>
            <div className="grid grid-cols-3 gap-2">
              {['CASUAL', 'SICK', 'EARNED'].map((tType) => (
                <button
                  key={tType}
                  type="button"
                  onClick={() => setLeaveType(tType)}
                  className={`min-h-[44px] rounded-2xl font-bold text-2xs transition-all border ${
                    leaveType === tType
                      ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {tType}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-2xs">From Date</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-2xs">To Date</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1 text-2xs">Reason</label>
            <textarea
              required
              rows={2}
              value={leaveReason}
              onChange={(e) => setLeaveReason(e.target.value)}
              placeholder="State reason for absence..."
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
            />
          </div>

          <button
            type="submit"
            disabled={submittingLeave}
            className="w-full min-h-[48px] py-3 bg-[#1752d5] hover:bg-blue-700 text-white font-black rounded-2xl shadow-sm text-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <Send className="w-4 h-4" />
            <span>{submittingLeave ? 'Submitting...' : 'Submit Leave Application'}</span>
          </button>
        </form>
      </Modal>
    </div>
  );
};
