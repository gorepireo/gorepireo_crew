import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Attendance, Team, Worker } from '../../types';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import {
  CalendarCheck,
  Download,
  Filter,
  Plus,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';

export const AdminAttendance: React.FC = () => {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().slice(0, 10));
  const [teamFilter, setTeamFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Manual Attendance Modal
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manualWorkerId, setManualWorkerId] = useState('');
  const [manualStatus, setManualStatus] = useState('PRESENT');
  const [manualReason, setManualReason] = useState('');
  const [submittingManual, setSubmittingManual] = useState(false);

  // Correction Review Modal
  const [selectedRecord, setSelectedRecord] = useState<Attendance | null>(null);
  const [correctionRemarks, setCorrectionRemarks] = useState('');
  const [reviewing, setReviewing] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [attList, tList, wList] = await Promise.all([
        api.getAttendance({
          date: dateFilter || undefined,
          teamId: teamFilter || undefined,
          status: statusFilter || undefined,
        }),
        api.getTeams(),
        api.getWorkers(),
      ]);
      setAttendance(attList);
      setTeams(tList);
      setWorkers(wList);
      if (wList.length > 0 && !manualWorkerId) setManualWorkerId(wList[0].workerId);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [dateFilter, teamFilter, statusFilter]);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualWorkerId || !manualReason) return;
    setSubmittingManual(true);
    try {
      await api.markManualAttendance({
        workerId: manualWorkerId,
        date: dateFilter,
        status: manualStatus,
        reason: manualReason,
      });
      setManualModalOpen(false);
      setManualReason('');
      loadData();
      alert('Manual attendance recorded with complete administrator audit log.');
    } catch (err: any) {
      alert(err.message || 'Failed to mark attendance');
    } finally {
      setSubmittingManual(false);
    }
  };

  const handleCorrectionReview = async (approved: boolean) => {
    if (!selectedRecord) return;
    setReviewing(true);
    try {
      await api.reviewCorrection(selectedRecord.attendanceId, {
        approved,
        status: approved ? 'PRESENT' : selectedRecord.status,
        remarks: correctionRemarks || (approved ? 'Correction approved by admin' : 'Correction rejected by admin'),
      });
      setSelectedRecord(null);
      setCorrectionRemarks('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to review correction');
    } finally {
      setReviewing(false);
    }
  };

  if (loading) return <LoadingSpinner message="Querying master attendance records..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Attendance Master Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit GPS check-ins, verify geofence distance logs, and enforce attendance governance
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={api.getExportCsvUrl()}
            download
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5"
          >
            <Download className="w-4 h-4 text-blue-600" />
            Export CSV
          </a>
          <button
            onClick={() => setManualModalOpen(true)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Mark Manual Attendance
          </button>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center gap-3">
        <div>
          <label className="block text-3xs font-bold uppercase text-slate-400 mb-0.5">Date</label>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-700 bg-white"
          />
        </div>

        <div>
          <label className="block text-3xs font-bold uppercase text-slate-400 mb-0.5">Team</label>
          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-700 bg-white"
          >
            <option value="">All Teams</option>
            {teams.map((t) => (
              <option key={t.teamId} value={t.teamId}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-3xs font-bold uppercase text-slate-400 mb-0.5">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-700 bg-white"
          >
            <option value="">All Statuses</option>
            <option value="PRESENT">Present</option>
            <option value="ABSENT">Absent</option>
            <option value="LATE">Late Arrival</option>
            <option value="HALF_DAY">Half Day</option>
            <option value="APPROVED_LEAVE">Approved Leave</option>
          </select>
        </div>
      </div>

      {/* ATTENDANCE TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 uppercase text-3xs font-semibold border-b border-slate-100">
              <tr>
                <th className="px-4 py-3">Worker ID & Name</th>
                <th className="px-4 py-3">Team</th>
                <th className="px-4 py-3">In / Out Time</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">Method & GPS Evidence</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Audit & Adjust</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {attendance.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-xs text-slate-400">
                    No attendance records found matching filters.
                  </td>
                </tr>
              ) : (
                attendance.map((rec) => (
                  <tr key={rec.attendanceId} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{rec.workerName}</div>
                      <span className="text-3xs font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                        {rec.workerCode}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-slate-600">{rec.teamName || 'Unassigned'}</td>

                    <td className="px-4 py-3 font-mono text-slate-700">
                      <div>
                        In:{' '}
                        {rec.checkInTime
                          ? new Date(rec.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : '--:--'}
                      </div>
                      <div>
                        Out:{' '}
                        {rec.checkOutTime
                          ? new Date(rec.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : '--:--'}
                      </div>
                    </td>

                    <td className="px-4 py-3 font-bold text-emerald-600">
                      {rec.workingMinutes ? (
                        `${Math.floor(rec.workingMinutes / 60)}h ${rec.workingMinutes % 60}m`
                      ) : (
                        <span className="text-3xs text-slate-400 font-normal">In progress</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-3xs font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                          {rec.checkInMethod || 'GPS'}
                        </span>
                        <StatusBadge status={rec.verificationStatus} size="sm" />
                      </div>
                      {rec.checkInDistanceMeters !== undefined && (
                        <span className="text-3xs text-slate-500 block">
                          GPS Distance: {rec.checkInDistanceMeters}m from site
                        </span>
                      )}
                      {rec.correctionRequested && (
                        <span className="text-3xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full inline-block mt-0.5">
                          Worker Correction Requested
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <StatusBadge status={rec.status} />
                    </td>

                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedRecord(rec)}
                        className="px-2.5 py-1 text-2xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                      >
                        Audit / Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MANUAL MODAL */}
      <Modal isOpen={manualModalOpen} onClose={() => setManualModalOpen(false)} title="Record Admin Manual Attendance">
        <form onSubmit={handleManualSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Worker *</label>
            <select
              required
              value={manualWorkerId}
              onChange={(e) => setManualWorkerId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            >
              {workers.map((w) => (
                <option key={w.workerId} value={w.workerId}>
                  {w.name} ({w.workerId}) - {w.primaryTeamName || 'Unassigned'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Attendance Status *</label>
            <select
              value={manualStatus}
              onChange={(e) => setManualStatus(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            >
              <option value="PRESENT">Present (Full Day)</option>
              <option value="LATE">Late Arrival</option>
              <option value="HALF_DAY">Half Day</option>
              <option value="ABSENT">Absent</option>
              <option value="APPROVED_LEAVE">Approved Leave</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Administrative Audit Reason *</label>
            <textarea
              required
              rows={3}
              value={manualReason}
              onChange={(e) => setManualReason(e.target.value)}
              placeholder="Record operational reason for manual override..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setManualModalOpen(false)}
              className="flex-1 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingManual}
              className="flex-1 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
            >
              {submittingManual ? 'Recording...' : 'Save Manual Record'}
            </button>
          </div>
        </form>
      </Modal>

      {/* CORRECTION / AUDIT MODAL */}
      <Modal isOpen={!!selectedRecord} onClose={() => setSelectedRecord(null)} title="Attendance Governance & Adjustment">
        {selectedRecord && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <p>
                <strong>Worker:</strong> {selectedRecord.workerName} ({selectedRecord.workerId})
              </p>
              <p>
                <strong>Date:</strong> {selectedRecord.date} · <strong>Current Status:</strong> {selectedRecord.status}
              </p>
              {selectedRecord.checkInDistanceMeters !== undefined && (
                <p>
                  <strong>GPS Verification:</strong> {selectedRecord.checkInDistanceMeters}m from geofence center
                </p>
              )}
            </div>

            {selectedRecord.correctionRequested && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <span className="font-bold text-amber-900 block mb-1">Worker's Correction Request:</span>
                <p className="text-amber-800 text-2xs italic">"{selectedRecord.correctionReason}"</p>
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Admin Audit Remarks</label>
              <textarea
                rows={2}
                value={correctionRemarks}
                onChange={(e) => setCorrectionRemarks(e.target.value)}
                placeholder="Remarks recorded into permanent event history..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={reviewing}
                onClick={() => handleCorrectionReview(false)}
                className="flex-1 py-2 bg-rose-50 text-rose-700 border border-rose-200 font-semibold rounded-lg hover:bg-rose-100 flex items-center justify-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                Reject Request
              </button>
              <button
                type="button"
                disabled={reviewing}
                onClick={() => handleCorrectionReview(true)}
                className="flex-1 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 flex items-center justify-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                Approve & Mark Present
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
