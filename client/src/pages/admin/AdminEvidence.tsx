import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Attendance, WorkEvidence, Team, WorkLocation, Worker } from '../../types';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  Camera,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  ExternalLink,
  ShieldCheck,
  Search,
  Sliders,
  Filter,
  Eye,
  X,
  Radio,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminEvidence: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'WORK_EVIDENCE' | 'ATTENDANCE_SELFIES'>('WORK_EVIDENCE');
  const [evidenceList, setEvidenceList] = useState<WorkEvidence[]>([]);
  const [attendanceList, setAttendanceList] = useState<Attendance[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [locations, setLocations] = useState<WorkLocation[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedDate, setSelectedDate] = useState('');

  // Lightbox
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [evList, attList, tList, lList, wList] = await Promise.all([
        api.getWorkEvidence(),
        api.getAttendance(),
        api.getTeams(),
        api.getLocations(),
        api.getWorkers(),
      ]);
      setEvidenceList(evList);
      setAttendanceList(attList);
      setTeams(tList);
      setLocations(lList);
      setWorkers(wList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredEvidence = evidenceList.filter((ev) => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchWorker = ev.workerName?.toLowerCase().includes(term) || ev.workerId.toLowerCase().includes(term);
      const matchAssignment = ev.assignmentTitle?.toLowerCase().includes(term) || ev.assignmentId.toLowerCase().includes(term);
      if (!matchWorker && !matchAssignment) return false;
    }
    if (selectedTeamId && ev.teamId !== selectedTeamId) return false;
    if (selectedLocationId && ev.locationId !== selectedLocationId) return false;
    if (selectedCategory !== 'ALL' && ev.category !== selectedCategory) return false;
    if (selectedDate && !ev.capturedAt.startsWith(selectedDate)) return false;
    return true;
  });

  const filteredAttendance = attendanceList.filter((att) => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchWorker = att.workerName?.toLowerCase().includes(term) || att.workerId.toLowerCase().includes(term);
      if (!matchWorker) return false;
    }
    if (selectedTeamId && att.teamId !== selectedTeamId) return false;
    if (selectedDate && att.date !== selectedDate) return false;
    return true;
  });

  if (loading) return <LoadingSpinner message="Loading organization-wide evidence repository..." />;

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Attendance & Work Evidence Repository</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Organization-wide inspection of worker selfies, GPS stamps, and watermarked work photographs
          </p>
        </div>

        <Link
          to="/admin/settings"
          className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Sliders className="w-4 h-4 text-blue-600" />
          <span>Evidence Settings</span>
        </Link>
      </div>

      {/* SEARCH & FILTERS BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Worker ID, Name, or Assignment ID..."
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <select
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-600"
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
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>

        {/* TABS */}
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('WORK_EVIDENCE')}
            className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'WORK_EVIDENCE'
                ? 'bg-white text-slate-900 font-bold shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Work Photographs ({filteredEvidence.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('ATTENDANCE_SELFIES')}
            className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'ATTENDANCE_SELFIES'
                ? 'bg-white text-slate-900 font-bold shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Attendance Selfies ({filteredAttendance.length})</span>
          </button>
        </div>
      </div>

      {/* --- TAB 1: WORK EVIDENCE --- */}
      {activeTab === 'WORK_EVIDENCE' && (
        <div className="space-y-3">
          {filteredEvidence.length === 0 ? (
            <EmptyState
              icon={Camera}
              title="No evidence records found"
              description="No work evidence photographs match the search and filter criteria."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {filteredEvidence.map((ev) => (
                <div
                  key={ev.evidenceId}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col justify-between"
                >
                  <div
                    onClick={() => setSelectedPhotoUrl(ev.watermarkUrl || ev.photoUrl)}
                    className="relative bg-slate-900 cursor-pointer group"
                  >
                    <img
                      src={ev.watermarkUrl || ev.photoUrl}
                      alt="Evidence"
                      className="w-full h-44 object-cover"
                    />

                    <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-3xs font-extrabold bg-black/75 text-white backdrop-blur-xs">
                      {ev.category}
                    </span>

                    <span
                      className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-3xs font-extrabold ${
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
                      <span>Inspect Watermark</span>
                    </div>
                  </div>

                  <div className="p-3.5 space-y-2 flex-1">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 leading-snug">{ev.assignmentTitle}</h4>
                      <p className="text-3xs text-slate-500 font-mono mt-0.5">
                        Worker: {ev.workerName} ({ev.workerId})
                      </p>
                    </div>

                    {ev.description && (
                      <p className="text-2xs text-slate-700 bg-slate-50 p-2 rounded-xl italic">
                        "{ev.description}"
                      </p>
                    )}

                    <div className="space-y-0.5 text-3xs text-slate-500 pt-1 border-t border-slate-100">
                      <p className="truncate">📍 {ev.detectedAddress}</p>
                      <p>🛰️ {ev.latitude.toFixed(5)}° N, {ev.longitude.toFixed(5)}° E (±{ev.accuracyMeters}m)</p>
                      <p>🕒 {new Date(ev.capturedAt).toLocaleString()}</p>
                    </div>

                    {ev.reviewNotes && (
                      <div className="p-2 bg-slate-50 rounded-xl text-3xs text-slate-600 border border-slate-100">
                        <strong>Review Note:</strong> {ev.reviewNotes}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- TAB 2: ATTENDANCE SELFIES --- */}
      {activeTab === 'ATTENDANCE_SELFIES' && (
        <div className="space-y-3">
          {filteredAttendance.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="No attendance records"
              description="No attendance records match your filter criteria."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAttendance.map((att) => (
                <div
                  key={att.attendanceId}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{att.workerName}</h4>
                      <span className="text-3xs font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                        {att.workerId} · {att.teamName || 'Site Crew'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <StatusBadge status={att.status} size="sm" />
                      <span
                        className={`text-3xs font-bold px-2 py-0.5 rounded-full ${
                          att.verificationStatus === 'VERIFIED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {att.verificationStatus}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Check-In Selfie */}
                    <div className="p-2 bg-slate-50 rounded-xl space-y-1">
                      <span className="text-3xs font-bold text-slate-500 block">Check-In Selfie</span>
                      {att.checkInPhotoUrl ? (
                        <img
                          src={att.checkInPhotoUrl}
                          alt="Check-in"
                          onClick={() => setSelectedPhotoUrl(att.checkInPhotoUrl!)}
                          className="w-full h-28 object-cover rounded-lg cursor-pointer hover:opacity-90"
                        />
                      ) : (
                        <div className="h-28 bg-slate-100 rounded-lg flex items-center justify-center text-4xs text-slate-400 border border-dashed border-slate-200">
                          No selfie
                        </div>
                      )}
                      <p className="text-3xs text-slate-600 font-mono">
                        {att.checkInTime ? new Date(att.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                      </p>
                    </div>

                    {/* Check-Out Selfie */}
                    <div className="p-2 bg-slate-50 rounded-xl space-y-1">
                      <span className="text-3xs font-bold text-slate-500 block">Check-Out Selfie</span>
                      {att.checkOutPhotoUrl ? (
                        <img
                          src={att.checkOutPhotoUrl}
                          alt="Check-out"
                          onClick={() => setSelectedPhotoUrl(att.checkOutPhotoUrl!)}
                          className="w-full h-28 object-cover rounded-lg cursor-pointer hover:opacity-90"
                        />
                      ) : (
                        <div className="h-28 bg-slate-100 rounded-lg flex items-center justify-center text-4xs text-slate-400 border border-dashed border-slate-200">
                          No checkout photo
                        </div>
                      )}
                      <p className="text-3xs text-slate-600 font-mono">
                        {att.checkOutTime ? new Date(att.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-0.5 text-3xs text-slate-500 pt-1 border-t border-slate-100">
                    <p className="truncate">📍 {att.checkInAddress || 'Worksite'}</p>
                    <p>
                      Working Duration:{' '}
                      <strong className="text-slate-800">
                        {att.workingMinutes ? `${Math.floor(att.workingMinutes / 60)}h ${att.workingMinutes % 60}m` : 'In Progress'}
                      </strong>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* LIGHTBOX MODAL */}
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
