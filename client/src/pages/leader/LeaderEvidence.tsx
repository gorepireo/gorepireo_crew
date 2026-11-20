import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Attendance, WorkEvidence, Team, Worker } from '../../types';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  Camera,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Calendar,
  ExternalLink,
  ShieldCheck,
  Filter,
  Eye,
  Check,
  X,
  MessageSquare,
  Sparkles,
  User,
  History,
} from 'lucide-react';

export const LeaderEvidence: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'WORK_EVIDENCE' | 'ATTENDANCE_SELFIES'>('WORK_EVIDENCE');
  const [evidenceList, setEvidenceList] = useState<WorkEvidence[]>([]);
  const [attendanceList, setAttendanceList] = useState<Attendance[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedReviewStatus, setSelectedReviewStatus] = useState<string>('ALL');
  const [filterWorkerId, setFilterWorkerId] = useState<string>('');
  const [filterDate, setFilterDate] = useState<string>(new Date().toISOString().slice(0, 10));

  // Review Modal state
  const [reviewingEvidence, setReviewingEvidence] = useState<WorkEvidence | null>(null);
  const [reviewAction, setReviewAction] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // Lightbox & Attendance Profile Modal
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);
  const [selectedAttendanceDetail, setSelectedAttendanceDetail] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [evList, attList, tList, wList] = await Promise.all([
        api.getWorkEvidence(),
        api.getAttendance(),
        api.getTeams(true),
        api.getWorkers(),
      ]);
      setEvidenceList(evList);
      setAttendanceList(attList);
      setTeams(tList);
      setWorkers(wList);
    } catch (e) {
      console.error('Failed to load evidence data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenReview = (ev: WorkEvidence, action: 'APPROVED' | 'REJECTED') => {
    setReviewingEvidence(ev);
    setReviewAction(action);
    setReviewNotes(action === 'APPROVED' ? 'Work meets site safety and quality standards.' : '');
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingEvidence) return;
    setReviewSubmitting(true);
    try {
      await api.reviewWorkEvidence(reviewingEvidence.evidenceId, reviewAction, reviewNotes);
      setReviewingEvidence(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to review evidence');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleViewAttendanceDetail = async (attId: string) => {
    setLoadingDetail(true);
    try {
      const detail = await api.getAttendanceDetail(attId);
      setSelectedAttendanceDetail(detail);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Filtered lists
  const filteredEvidence = evidenceList.filter((ev) => {
    if (selectedCategory !== 'ALL' && ev.category !== selectedCategory) return false;
    if (selectedReviewStatus !== 'ALL' && ev.reviewStatus !== selectedReviewStatus) return false;
    if (filterWorkerId && ev.workerId !== filterWorkerId) return false;
    return true;
  });

  const filteredAttendance = attendanceList.filter((att) => {
    if (filterDate && att.date !== filterDate) return false;
    if (filterWorkerId && att.workerId !== filterWorkerId) return false;
    return true;
  });

  if (loading) return <LoadingSpinner message="Loading attendance & work evidence..." />;

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Attendance & Work Evidence</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Review worker attendance selfies, check-in GPS verification, and work completion photos
        </p>
      </div>

      {/* TOP SEGMENTED TABS */}
      <div className="flex bg-white p-1 rounded-2xl border border-slate-200 text-xs font-semibold shadow-2xs">
        <button
          onClick={() => setActiveTab('WORK_EVIDENCE')}
          className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'WORK_EVIDENCE'
              ? 'bg-indigo-600 text-white font-bold shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Work Photos ({evidenceList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('ATTENDANCE_SELFIES')}
          className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'ATTENDANCE_SELFIES'
              ? 'bg-indigo-600 text-white font-bold shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Attendance Selfies ({attendanceList.length})</span>
        </button>
      </div>

      {/* --- TAB 1: WORK EVIDENCE PHOTOGRAPHS --- */}
      {activeTab === 'WORK_EVIDENCE' && (
        <div className="space-y-3">
          {/* CATEGORY & STATUS FILTER BAR */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-3xs font-bold">
              {(['ALL', 'BEFORE', 'DURING', 'AFTER', 'OTHER'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl transition-all shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-indigo-50 text-indigo-700 font-extrabold border border-indigo-200'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat === 'ALL' ? 'All Categories' : cat}
                </button>
              ))}

              <div className="h-4 w-px bg-slate-200 mx-1 shrink-0" />

              {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setSelectedReviewStatus(st)}
                  className={`px-3 py-1.5 rounded-xl transition-all shrink-0 ${
                    selectedReviewStatus === st
                      ? 'bg-slate-900 text-white font-extrabold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {filteredEvidence.length === 0 ? (
            <EmptyState
              icon={Camera}
              title="No work photographs found"
              description="No work evidence matches your current category or status filter."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredEvidence.map((ev) => (
                <div
                  key={ev.evidenceId}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col justify-between"
                >
                  {/* PHOTO VIEWPORT */}
                  <div className="relative bg-slate-900 cursor-pointer group" onClick={() => setSelectedPhotoUrl(ev.watermarkUrl || ev.photoUrl)}>
                    <img
                      src={ev.watermarkUrl || ev.photoUrl}
                      alt="Work Evidence"
                      className="w-full h-48 object-cover"
                    />

                    {/* Category pill */}
                    <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-3xs font-extrabold bg-black/75 text-white backdrop-blur-xs shadow-md">
                      {ev.category}
                    </span>

                    {/* Review Status pill */}
                    <span
                      className={`absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full text-3xs font-extrabold shadow-md ${
                        ev.reviewStatus === 'APPROVED'
                          ? 'bg-emerald-500 text-white'
                          : ev.reviewStatus === 'REJECTED'
                          ? 'bg-rose-500 text-white'
                          : 'bg-amber-400 text-slate-900'
                      }`}
                    >
                      {ev.reviewStatus}
                    </span>

                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                      <Eye className="w-4 h-4" />
                      <span>View Watermarked Photo</span>
                    </div>
                  </div>

                  {/* METADATA CONTENT */}
                  <div className="p-3.5 space-y-2 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 leading-snug">{ev.assignmentTitle}</h4>
                        <p className="text-3xs text-slate-500 font-mono mt-0.5">
                          {ev.workerName} ({ev.workerId})
                        </p>
                      </div>
                      <span className="text-4xs font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded shrink-0">
                        {ev.evidenceId}
                      </span>
                    </div>

                    {ev.description && (
                      <p className="text-2xs text-slate-700 bg-slate-50 p-2 rounded-xl italic">
                        "{ev.description}"
                      </p>
                    )}

                    <div className="space-y-1 text-3xs text-slate-500 pt-1 border-t border-slate-100">
                      <div className="flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 text-blue-600 shrink-0" />
                        <span className="truncate">{ev.detectedAddress}</span>
                      </div>
                      <div className="flex items-center justify-between text-4xs">
                        <span>🛰️ GPS: ±{ev.accuracyMeters}m</span>
                        <span>🕒 {new Date(ev.capturedAt).toLocaleString()}</span>
                      </div>
                    </div>

                    {ev.reviewNotes && (
                      <div className="p-2 bg-indigo-50/70 border border-indigo-100 rounded-xl text-3xs text-indigo-900">
                        <strong>Review Note:</strong> {ev.reviewNotes}
                      </div>
                    )}
                  </div>

                  {/* REVIEW ACTIONS */}
                  <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                    {ev.reviewStatus === 'PENDING' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenReview(ev, 'REJECTED')}
                          className="flex-1 py-2 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 shadow-2xs"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Request Another Photo</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenReview(ev, 'APPROVED')}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 shadow-2xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                      </>
                    ) : (
                      <div className="w-full flex items-center justify-between text-2xs text-slate-500">
                        <span>Reviewed by: <strong>{ev.reviewedByName || 'Team Leader'}</strong></span>
                        <button
                          type="button"
                          onClick={() => handleOpenReview(ev, ev.reviewStatus === 'APPROVED' ? 'REJECTED' : 'APPROVED')}
                          className="text-indigo-600 hover:underline font-bold text-3xs"
                        >
                          Change Status
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- TAB 2: ATTENDANCE SELFIES & GPS VERIFICATION --- */}
      {activeTab === 'ATTENDANCE_SELFIES' && (
        <div className="space-y-3">
          {/* DATE & WORKER FILTER */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-1 focus:ring-indigo-600"
              />
            </div>

            <select
              value={filterWorkerId}
              onChange={(e) => setFilterWorkerId(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-1 focus:ring-indigo-600"
            >
              <option value="">All Field Workers</option>
              {workers.map((w) => (
                <option key={w.workerId} value={w.workerId}>
                  {w.name} ({w.workerId})
                </option>
              ))}
            </select>
          </div>

          {filteredAttendance.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="No attendance records for this date"
              description="No worker punch-in records found matching your selected date."
            />
          ) : (
            <div className="space-y-3">
              {filteredAttendance.map((rec) => (
                <div
                  key={rec.attendanceId}
                  className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-2xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                        {rec.workerName?.split(' ').map((n) => n[0]).join('') || 'WK'}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{rec.workerName}</h4>
                        <span className="text-3xs font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                          {rec.workerId} · {rec.teamName || 'Field Unit'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <StatusBadge status={rec.status} size="sm" />
                      <span
                        className={`text-3xs font-bold px-2 py-0.5 rounded-full ${
                          rec.verificationStatus === 'VERIFIED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {rec.verificationStatus}
                      </span>
                    </div>
                  </div>

                  {/* SIDE-BY-SIDE SELFIES: CHECK-IN & CHECK-OUT */}
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* CHECK IN SELFIE */}
                    <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                      <div className="flex items-center justify-between text-3xs font-bold text-slate-500">
                        <span>Check-In Selfie</span>
                        <span className="text-slate-800 font-mono">
                          {rec.checkInTime ? new Date(rec.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </span>
                      </div>

                      {rec.checkInPhotoUrl ? (
                        <div
                          onClick={() => setSelectedPhotoUrl(rec.checkInPhotoUrl!)}
                          className="relative rounded-xl overflow-hidden cursor-pointer group shadow-2xs border border-slate-200"
                        >
                          <img
                            src={rec.checkInPhotoUrl}
                            alt="Check-in Selfie"
                            className="w-full h-28 object-cover"
                          />
                          <span className="absolute bottom-1 right-1 bg-black/60 text-white text-4xs px-1.5 py-0.5 rounded">
                            ±{rec.checkInAccuracy || 10}m
                          </span>
                        </div>
                      ) : (
                        <div className="h-28 bg-slate-100 rounded-xl flex items-center justify-center text-4xs text-slate-400 border border-dashed border-slate-200">
                          No selfie photo
                        </div>
                      )}

                      {rec.checkInAddress && (
                        <p className="text-3xs text-slate-600 truncate flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-blue-600 shrink-0" />
                          <span className="truncate">{rec.checkInAddress}</span>
                        </p>
                      )}
                    </div>

                    {/* CHECK OUT SELFIE */}
                    <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                      <div className="flex items-center justify-between text-3xs font-bold text-slate-500">
                        <span>Check-Out Selfie</span>
                        <span className="text-slate-800 font-mono">
                          {rec.checkOutTime ? new Date(rec.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </span>
                      </div>

                      {rec.checkOutPhotoUrl ? (
                        <div
                          onClick={() => setSelectedPhotoUrl(rec.checkOutPhotoUrl!)}
                          className="relative rounded-xl overflow-hidden cursor-pointer group shadow-2xs border border-slate-200"
                        >
                          <img
                            src={rec.checkOutPhotoUrl}
                            alt="Check-out Selfie"
                            className="w-full h-28 object-cover"
                          />
                          <span className="absolute bottom-1 right-1 bg-black/60 text-white text-4xs px-1.5 py-0.5 rounded">
                            ±{rec.checkOutAccuracy || 10}m
                          </span>
                        </div>
                      ) : (
                        <div className="h-28 bg-slate-100 rounded-xl flex items-center justify-center text-4xs text-slate-400 border border-dashed border-slate-200">
                          {rec.checkInTime && !rec.checkOutTime ? 'Shift In Progress' : 'No checkout selfie'}
                        </div>
                      )}

                      <p className="text-3xs text-slate-600">
                        {rec.workingMinutes ? (
                          <strong className="text-emerald-700">
                            {Math.floor(rec.workingMinutes / 60)}h {rec.workingMinutes % 60}m duration
                          </strong>
                        ) : (
                          'Active on site'
                        )}
                      </p>
                    </div>
                  </div>

                  {rec.remarks && (
                    <p className="text-2xs text-slate-600 bg-slate-50 p-2 rounded-xl italic">
                      "{rec.remarks}"
                    </p>
                  )}

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-3xs text-slate-400">
                      Geofence: <strong>{rec.checkInDistanceMeters !== undefined ? `${rec.checkInDistanceMeters}m from site` : 'GPS Verified'}</strong>
                    </span>

                    <button
                      type="button"
                      onClick={() => handleViewAttendanceDetail(rec.attendanceId)}
                      className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                    >
                      <span>Full Attendance Profile</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* REVIEW WORK EVIDENCE MODAL */}
      {reviewingEvidence && (
        <Modal
          isOpen={!!reviewingEvidence}
          onClose={() => setReviewingEvidence(null)}
          title={`Review Work Evidence (${reviewAction})`}
        >
          <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-2xl space-y-1">
              <span className="text-3xs uppercase font-bold text-slate-400">Assignment</span>
              <h4 className="font-bold text-slate-900">{reviewingEvidence.assignmentTitle}</h4>
              <p className="text-3xs text-slate-500">Worker: {reviewingEvidence.workerName} ({reviewingEvidence.workerId})</p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Review Notes & Feedback for Worker *
              </label>
              <textarea
                required
                rows={3}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Explain approval confirmation or why photograph evidence was rejected..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReviewingEvidence(null)}
                className="flex-1 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={reviewSubmitting}
                className={`flex-1 py-2.5 text-white font-bold rounded-xl transition-colors ${
                  reviewAction === 'APPROVED' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {reviewSubmitting
                  ? 'Saving...'
                  : reviewAction === 'APPROVED'
                  ? 'Confirm Approval'
                  : 'Request Retake'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* FULL ATTENDANCE PROFILE MODAL */}
      {selectedAttendanceDetail && (
        <Modal
          isOpen={!!selectedAttendanceDetail}
          onClose={() => setSelectedAttendanceDetail(null)}
          title={`Attendance Profile: ${selectedAttendanceDetail.workerName}`}
        >
          <div className="space-y-3.5 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <span className="font-mono text-2xs text-slate-500 font-bold">{selectedAttendanceDetail.attendanceId}</span>
                <p className="text-3xs text-slate-500">Date: {selectedAttendanceDetail.date}</p>
              </div>
              <StatusBadge status={selectedAttendanceDetail.status} />
            </div>

            <div className="grid grid-cols-2 gap-2 text-2xs">
              <div className="p-3 bg-slate-50 rounded-2xl">
                <span className="text-3xs text-slate-400 uppercase font-bold block">In Time</span>
                <span className="text-sm font-bold text-slate-900">
                  {selectedAttendanceDetail.checkInTime ? new Date(selectedAttendanceDetail.checkInTime).toLocaleTimeString() : '--:--'}
                </span>
                <p className="text-3xs text-slate-500 mt-1">📍 {selectedAttendanceDetail.checkInAddress || 'On Site'}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl">
                <span className="text-3xs text-slate-400 uppercase font-bold block">Out Time</span>
                <span className="text-sm font-bold text-slate-900">
                  {selectedAttendanceDetail.checkOutTime ? new Date(selectedAttendanceDetail.checkOutTime).toLocaleTimeString() : '--:--'}
                </span>
                <p className="text-3xs text-slate-500 mt-1">
                  Duration: {selectedAttendanceDetail.workingMinutes ? `${Math.floor(selectedAttendanceDetail.workingMinutes / 60)}h ${selectedAttendanceDetail.workingMinutes % 60}m` : 'In Progress'}
                </p>
              </div>
            </div>

            {/* AUDIT EVENTS STREAM */}
            {selectedAttendanceDetail.events && selectedAttendanceDetail.events.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <h5 className="text-3xs font-bold uppercase tracking-wider text-slate-400">
                  Audit History Events ({selectedAttendanceDetail.events.length})
                </h5>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {selectedAttendanceDetail.events.map((ev: any) => (
                    <div key={ev.eventId} className="p-2 bg-slate-50 rounded-xl text-3xs border border-slate-100">
                      <div className="flex items-center justify-between">
                        <strong className="text-slate-800">{ev.eventType}</strong>
                        <span className="text-slate-400 font-mono">{new Date(ev.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-slate-600 mt-0.5">{ev.reason || 'Event verified'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* PHOTO LIGHTBOX MODAL */}
      {selectedPhotoUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
          onClick={() => setSelectedPhotoUrl(null)}
        >
          <div className="relative max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl shadow-2xl border border-white/20">
            <img src={selectedPhotoUrl} alt="Enlarged" className="w-full h-auto object-contain" />
            <button
              onClick={() => setSelectedPhotoUrl(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/70 text-white hover:bg-black transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
