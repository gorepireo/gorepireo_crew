import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { Assignment, WorkEvidence, WorkLocation } from '../../types';
import { Modal } from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { WorkCameraModal } from '../../components/camera/WorkCameraModal';
import {
  Briefcase,
  MapPin,
  Clock,
  Calendar,
  Layers,
  PlayCircle,
  CheckCircle2,
  Camera,
  FileText,
  ArrowUp,
  ExternalLink,
  ChevronRight,
  User,
  Info,
  Building2,
} from 'lucide-react';

export const WorkerWork: React.FC = () => {
  const { t } = useLanguage();

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [locations, setLocations] = useState<WorkLocation[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ALL');
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

  // Evidence photos for selected assignment
  const [evidenceList, setEvidenceList] = useState<WorkEvidence[]>([]);
  const [loadingEvidence, setLoadingEvidence] = useState(false);
  const [workCameraOpen, setWorkCameraOpen] = useState(false);
  const [activeCameraAssignment, setActiveCameraAssignment] = useState<Assignment | null>(null);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const [data, locs] = await Promise.all([
        api.getAssignments(),
        api.getLocations().catch(() => []),
      ]);
      setAssignments(data);
      setLocations(locs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadEvidenceForAssignment = async (asnId: string) => {
    setLoadingEvidence(true);
    try {
      const data = await api.getWorkEvidence({ assignmentId: asnId });
      setEvidenceList(data);
    } catch (e) {
      console.warn('Failed to load evidence', e);
    } finally {
      setLoadingEvidence(false);
    }
  };

  const handleOpenDetail = (asn: Assignment) => {
    setSelectedAssignment(asn);
    loadEvidenceForAssignment(asn.assignmentId);
  };

  const handleTriggerWorkCamera = (asn: Assignment, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveCameraAssignment(asn);
    setWorkCameraOpen(true);
  };

  const handleWorkCameraSuccess = (newEv: WorkEvidence) => {
    setEvidenceList((prev) => [newEv, ...prev]);
    loadAssignments();
  };

  const filtered = assignments.filter((a) => {
    if (filter === 'ACTIVE') return a.status !== 'COMPLETED' && a.status !== 'CANCELLED';
    if (filter === 'COMPLETED') return a.status === 'COMPLETED';
    return true;
  });

  const activeCount = assignments.filter((a) => a.status !== 'COMPLETED' && a.status !== 'CANCELLED').length;
  const doneCount = assignments.filter((a) => a.status === 'COMPLETED').length;

  return (
    <div className="space-y-3.5 pb-4">
      {/* 1. TOP HERO HEADER (Full-Bleed Exact Match) */}
      <div className="-mx-3 -mt-4 bg-[#1752d5] text-white pt-5 pb-6 px-4 rounded-b-[28px] shadow-sm relative overflow-hidden flex items-center justify-between">
        {/* Real Wavy Ribbon Background Banner */}
        <img
          src="/header-bg-wave.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none"
        />

        <div className="space-y-1 relative z-10 min-w-0 pr-2">
          <div className="flex items-center gap-2.5">
            <Briefcase className="w-6 h-6 text-white stroke-[2.4]" />
            <h1 className="text-xl font-black text-white tracking-tight leading-tight">
              My Work Assignments
            </h1>
          </div>
          <p className="text-xs text-blue-100 font-medium">
            Track and complete your assigned work
          </p>
        </div>

        {/* 3D Clipboard & Hard Hat Graphic */}
        <div className="relative w-24 h-20 shrink-0 z-10 flex items-center justify-end select-none pointer-events-none">
          <img
            src="/work-header-graphic.png"
            alt="Work Assignments"
            className="w-full h-full object-contain drop-shadow-md select-none"
          />
        </div>
      </div>

      {/* 2. WHITE CONTAINER WITH FILTER PILLS (Exact Match Image) */}
      <div className="bg-white rounded-[26px] p-2 shadow-xs border border-slate-100 flex items-center justify-between gap-2 relative z-10">
        {/* All Tab */}
        <button
          type="button"
          onClick={() => setFilter('ALL')}
          className={`flex-1 py-3 px-3 rounded-[20px] text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            filter === 'ALL'
              ? 'bg-[#1e48e8] text-white shadow-sm'
              : 'bg-[#f1f4f9] text-slate-800 hover:bg-slate-200/80'
          }`}
        >
          <Layers className="w-4 h-4 stroke-[2.2]" />
          <span>All ({assignments.length})</span>
        </button>

        {/* Active Tab */}
        <button
          type="button"
          onClick={() => setFilter('ACTIVE')}
          className={`flex-1 py-3 px-3 rounded-[20px] text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            filter === 'ACTIVE'
              ? 'bg-[#1e48e8] text-white shadow-sm'
              : 'bg-[#f1f4f9] text-slate-800 hover:bg-slate-200/80'
          }`}
        >
          <PlayCircle className="w-4 h-4 stroke-[2.2]" />
          <span>Active ({activeCount})</span>
        </button>

        {/* Done Tab */}
        <button
          type="button"
          onClick={() => setFilter('COMPLETED')}
          className={`flex-1 py-3 px-3 rounded-[20px] text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            filter === 'COMPLETED'
              ? 'bg-[#1e48e8] text-white shadow-sm'
              : 'bg-[#f1f4f9] text-slate-800 hover:bg-slate-200/80'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 stroke-[2.2]" />
          <span>Done ({doneCount})</span>
        </button>
      </div>

      {/* 3. ASSIGNMENT CARDS LIST OR EMPTY STATE (Exact Match Image) */}
      {loading ? (
        <LoadingSpinner message={t('loading')} />
      ) : filtered.length === 0 ? (
        <div className="space-y-4">
          {/* EMPTY STATE CARD */}
          <div className="bg-white rounded-3xl p-7 border border-slate-100 shadow-xs text-center space-y-3.5">
            {/* Clipboard with Magnifying Glass Illustration */}
            <div className="relative w-48 h-36 mx-auto flex items-center justify-center select-none pointer-events-none">
              <img
                src="/no-assignments.png"
                alt="No Assignments"
                className="w-full h-full object-contain select-none"
              />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-lg font-black text-slate-900">
                No Assignments Yet
              </h2>
              <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-xs mx-auto">
                You don’t have any work assigned at the moment.<br />
                Once a team leader assigns work to you, it will appear here.
              </p>
            </div>
          </div>

          {/* WHAT'S NEXT INFO CARD */}
          <div className="bg-[#f0f4ff] rounded-2xl p-4 border border-blue-100/70 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100/70 flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
              <Info className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-xs font-black text-blue-900 leading-tight">
                What's next?
              </h3>
              <p className="text-xs text-slate-600 font-medium leading-relaxed mt-1">
                You will receive your work assignments, <strong className="text-slate-900 font-bold">location</strong>, and task details here.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filtered.map((item) => (
            <div
              key={item.assignmentId}
              className="bg-white rounded-3xl p-4 border border-slate-100 shadow-2xs space-y-3.5"
            >
              {/* TOP SECTION: THUMBNAIL + TITLE + BADGES */}
              <div className="flex items-start gap-3">
                {/* Construction / Location Photo Thumbnail */}
                {(() => {
                  const loc = item.locationId ? locations.find((l) => l.locationId === item.locationId) : undefined;
                  const thumb = item.locationPhotoURL || loc?.photoURL;
                  return (
                    <>
                      {thumb ? (
                        <img
                          src={thumb}
                          alt=""
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                            const sibling = (e.currentTarget as HTMLElement).nextElementSibling;
                            if (sibling) (sibling as HTMLElement).style.display = 'flex';
                          }}
                          className="w-24 h-24 rounded-2xl object-cover shrink-0 border border-slate-100 shadow-2xs"
                        />
                      ) : null}
                      <div
                        style={{ display: thumb ? 'none' : 'flex' }}
                        className="w-24 h-24 rounded-2xl bg-blue-50 border border-blue-100 items-center justify-center shrink-0 text-blue-600 shadow-2xs"
                      >
                        <Building2 className="w-9 h-9 text-blue-600" />
                      </div>
                    </>
                  );
                })()}

                <div className="flex-1 min-w-0 space-y-1">
                  {/* Badges: ASN code, In Progress, High Priority */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-mono text-3xs font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                      {item.assignmentId}
                    </span>
                    <span
                      className={`font-black px-2 py-0.5 rounded-full text-3xs flex items-center gap-1 ${
                        item.status === 'COMPLETED'
                          ? 'bg-[#dcfce7] text-[#15803d]'
                          : item.status === 'ASSIGNED'
                          ? 'bg-[#eff6ff] text-[#2563eb]'
                          : 'bg-[#fef3c7] text-[#b45309]'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          item.status === 'COMPLETED'
                            ? 'bg-[#22c55e]'
                            : item.status === 'ASSIGNED'
                            ? 'bg-[#3b82f6]'
                            : 'bg-[#f59e0b]'
                        }`}
                      />
                      <span>
                        {item.status === 'IN_PROGRESS'
                          ? 'In Progress'
                          : item.status === 'COMPLETED'
                          ? 'Completed'
                          : item.status === 'ASSIGNED'
                          ? 'Assigned'
                          : item.status}
                      </span>
                    </span>
                    <span
                      className={`font-black px-2 py-0.5 rounded-full text-3xs flex items-center gap-0.5 ${
                        item.priority === 'CRITICAL' || item.priority === 'HIGH'
                          ? 'bg-[#fee2e2] text-[#b91c1c]'
                          : 'bg-[#fef3c7] text-[#b45309]'
                      }`}
                    >
                      <ArrowUp className="w-3 h-3" />
                      <span>{item.priority || 'Normal'}</span>
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-sm font-black text-slate-900 leading-snug mt-1">
                    {item.title}
                  </h3>
                  <p className="text-2xs text-slate-600 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>

              {/* MIDDLE DETAILS ROW: LOCATION, DATE, TIME */}
              <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-2 text-2xs text-slate-700">
                <div className="flex items-start gap-1.5">
                  <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-slate-900 text-2xs leading-tight">
                      {item.locationName || 'Assigned Site'}
                    </strong>
                    <span className="text-3xs text-slate-500">
                      {item.locationAddress || 'Address on file'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-2xs font-bold text-slate-800">
                  <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    {item.date
                      ? new Date(item.date + 'T00:00:00').toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : 'Today'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-2xs font-bold text-slate-800">
                  <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    {item.startTime && item.endTime ? `${item.startTime} – ${item.endTime}` : 'Full Day'}
                  </span>
                </div>
              </div>

              {/* BOTTOM ACTIONS: WORK CAMERA & VIEW DETAILS */}
              <div className="pt-2 border-t border-slate-100 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={(e) => handleTriggerWorkCamera(item, e)}
                  className="flex-1 min-h-[46px] py-2.5 px-4 bg-[#1752d5] hover:bg-blue-700 active:scale-98 text-white font-black text-xs rounded-2xl transition-all shadow-xs flex items-center justify-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  <span>Work Camera</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenDetail(item)}
                  className="flex-1 min-h-[46px] py-2.5 px-4 bg-[#eef2f7] hover:bg-slate-200 active:scale-98 text-slate-800 font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4 text-slate-700" />
                  <span>View Details</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DETAIL MODAL */}
      <Modal
        isOpen={!!selectedAssignment}
        onClose={() => setSelectedAssignment(null)}
        title={selectedAssignment?.title || 'Assignment Details'}
      >
        {selectedAssignment && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="font-mono text-3xs font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                {selectedAssignment.assignmentId}
              </span>
              <span
                className={`font-black px-2.5 py-0.5 rounded-full text-3xs ${
                  selectedAssignment.status === 'COMPLETED'
                    ? 'bg-[#dcfce7] text-[#15803d]'
                    : selectedAssignment.status === 'ASSIGNED'
                    ? 'bg-[#eff6ff] text-[#2563eb]'
                    : 'bg-[#fef3c7] text-[#b45309]'
                }`}
              >
                {selectedAssignment.status === 'IN_PROGRESS'
                  ? 'In Progress'
                  : selectedAssignment.status === 'COMPLETED'
                  ? 'Completed'
                  : selectedAssignment.status === 'ASSIGNED'
                  ? 'Assigned'
                  : selectedAssignment.status}
              </span>
            </div>

            <div>
              <h4 className="text-sm font-black text-slate-900">{selectedAssignment.title}</h4>
              <p className="text-slate-600 mt-1 text-2xs leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100">
                {selectedAssignment.description}
              </p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-2 text-2xs">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-slate-900 text-xs">{selectedAssignment.locationName}</strong>
                  <span className="text-3xs text-slate-500">{selectedAssignment.locationAddress}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-3xs text-slate-600 pt-1 border-t border-slate-200/60 font-semibold">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>{selectedAssignment.date} ({selectedAssignment.startTime} – {selectedAssignment.endTime})</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const target = selectedAssignment;
                setSelectedAssignment(null);
                handleTriggerWorkCamera(target);
              }}
              className="w-full min-h-[50px] py-3 bg-[#1752d5] hover:bg-blue-700 text-white font-black text-xs rounded-2xl transition-all shadow-xs flex items-center justify-center gap-2"
            >
              <Camera className="w-4 h-4" />
              <span>Open Work Camera</span>
            </button>
          </div>
        )}
      </Modal>

      {/* WORK CAMERA MODAL */}
      {activeCameraAssignment && (
        <WorkCameraModal
          isOpen={workCameraOpen}
          onClose={() => {
            setWorkCameraOpen(false);
            setActiveCameraAssignment(null);
          }}
          assignment={activeCameraAssignment}
          onSuccess={handleWorkCameraSuccess}
        />
      )}
    </div>
  );
};
