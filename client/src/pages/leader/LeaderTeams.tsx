import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { Team, Worker, Assignment, Attendance } from '../../types';
import { Modal } from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import {
  Users,
  UserPlus,
  Eye,
  Edit2,
  Trash2,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  MapPin,
  ChevronRight,
  ChevronDown,
  KeyRound,
  UserCheck,
  Plus,
  Building2,
  ClipboardList,
  HardDrive,
  ExternalLink,
} from 'lucide-react';
import { SafeAvatar } from '../../components/common/SafeAvatar';

export const LeaderTeams: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [workers, setWorkers] = useState<Worker[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [activeTab, setActiveTab] = useState<'ASSIGNED' | 'UNASSIGNED'>('ASSIGNED');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState('ALL');
  const [teamFilterOpen, setTeamFilterOpen] = useState(false);

  // Create Team Modal state
  const [createTeamModalOpen, setCreateTeamModalOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDesc, setNewTeamDesc] = useState('');
  const [submittingCreateTeam, setSubmittingCreateTeam] = useState(false);

  // Add Existing Worker Modal state
  const [addExistingModalOpen, setAddExistingModalOpen] = useState(false);
  const [existingWorkerSearch, setExistingWorkerSearch] = useState('');
  const [existingTargetTeamId, setExistingTargetTeamId] = useState('');
  const [searchingWorker, setSearchingWorker] = useState(false);
  const [foundWorker, setFoundWorker] = useState<Worker | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [submittingAddExisting, setSubmittingAddExisting] = useState(false);

  // Assign Team Modal state
  const [assignModalWorker, setAssignModalWorker] = useState<any | null>(null);
  const [assignTeamId, setAssignTeamId] = useState('');
  const [submittingAssign, setSubmittingAssign] = useState(false);

  // Modals state
  const [viewWorker, setViewWorker] = useState<any | null>(null);
  const [editWorker, setEditWorker] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editTeamId, setEditTeamId] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Password reset state
  const [resetWorker, setResetWorker] = useState<any | null>(null);
  const [resetPasswordVal, setResetPasswordVal] = useState('password123');
  const [submittingReset, setSubmittingReset] = useState(false);

  // Automatic Google Drive batch sync
  const [syncingDrive, setSyncingDrive] = useState(false);

  const handleSyncAllToDrive = async () => {
    try {
      setSyncingDrive(true);
      const res = await api.syncAllWorkersToDrive();
      alert(res.message || 'Worker photos synced to Google Drive folder successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to sync with Google Drive');
    } finally {
      setSyncingDrive(false);
    }
  };

  const today = new Date().toISOString().slice(0, 10);

  const loadData = async () => {
    try {
      setLoading(true);
      const [wList, tList, aList, attList] = await Promise.all([
        api.getWorkers(),
        api.getTeams(true),
        api.getAssignments(),
        api.getAttendance({ date: today }),
      ]);
      setWorkers(wList);
      setTeams(tList);
      setAssignments(aList);
      setTodayAttendance(attList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Purely dynamic worker list derived 100% from live backend database
  const workerCards = workers.map((w) => {
    const att = todayAttendance.find((a) => a.workerId === w.workerId);
    const assignment = assignments.find((a) => a.workerIds.includes(w.workerId));

    let statusText = 'Not Checked In';
    let statusType = 'NOT_CHECKED_IN';
    if (att) {
      if (att.status === 'PRESENT') {
        statusText = 'Present';
        statusType = 'PRESENT';
      } else if (att.status === 'ABSENT') {
        statusText = 'Absent';
        statusType = 'ABSENT';
      } else if (att.status === 'HALF_DAY') {
        statusText = 'Half Day';
        statusType = 'HALF_DAY';
      } else if (att.status === 'LATE') {
        statusText = 'Late';
        statusType = 'LATE';
      }
    }

    const isUnassigned = w.teamAssignmentStatus === 'UNASSIGNED' || !w.primaryTeamId;

    return {
      workerId: w.workerId,
      name: w.name,
      teamId: w.primaryTeamId,
      teamName: isUnassigned ? 'Unassigned' : w.primaryTeamName || 'General Crew',
      isUnassigned,
      teamAssignmentStatus: w.teamAssignmentStatus || (isUnassigned ? 'UNASSIGNED' : 'ASSIGNED'),
      accountStatus: w.status || 'ACTIVE',
      status: statusText,
      statusType: statusType,
      jobTitle: assignment ? assignment.title : 'No assignment today',
      location: assignment
        ? assignment.locationName || assignment.locationAddress || 'Assigned Site'
        : 'None',
      avatarUrl: w.photoURL,
      phone: w.phone || '',
      email: w.email || '',
      address: w.address || '',
      joiningDate: w.joiningDate || '',
      initials: w.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase(),
    };
  });

  const assignedWorkerCards = workerCards.filter((w) => !w.isUnassigned);
  const unassignedWorkerCards = workerCards.filter((w) => w.isUnassigned);

  const displayedWorkers = (activeTab === 'ASSIGNED' ? assignedWorkerCards : unassignedWorkerCards).filter((w) => {
    const matchesSearch =
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.workerId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTeam =
      selectedTeamFilter === 'ALL' ||
      w.teamId === selectedTeamFilter ||
      w.teamName.toLowerCase().includes(selectedTeamFilter.toLowerCase());
    return matchesSearch && matchesTeam;
  });

  const totalCount = assignedWorkerCards.length;
  const presentCount = assignedWorkerCards.filter((w) => w.statusType === 'PRESENT').length;
  const notCheckedInCount = assignedWorkerCards.filter((w) => w.statusType === 'NOT_CHECKED_IN').length;
  const absentCount = assignedWorkerCards.filter((w) => w.statusType === 'ABSENT').length;

  const handleAssignTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignModalWorker || !assignTeamId) return;
    setSubmittingAssign(true);
    try {
      await api.assignWorkerToTeam(assignModalWorker.workerId, assignTeamId);
      setAssignModalWorker(null);
      setAssignTeamId('');
      loadData();
      alert(`Worker ${assignModalWorker.name} (${assignModalWorker.workerId}) assigned to team!`);
    } catch (err: any) {
      alert(err.message || 'Failed to assign team');
    } finally {
      setSubmittingAssign(false);
    }
  };

  const handleOpenEdit = (w: any) => {
    setEditWorker(w);
    setEditName(w.name);
    setEditPhone(w.phone || '');
    setEditTeamId(w.teamName);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editWorker) return;
    setSavingEdit(true);
    try {
      await api.updateWorker(editWorker.workerId, {
        name: editName,
        phone: editPhone,
      });
      alert('Worker updated successfully');
      setEditWorker(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update worker details');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    setSubmittingCreateTeam(true);
    try {
      await api.createTeam({
        name: newTeamName.trim(),
        description: newTeamDesc.trim() || undefined,
        leaderIds: [],
        memberWorkerIds: [],
      });
      alert(`Team "${newTeamName.trim()}" created successfully!`);
      setCreateTeamModalOpen(false);
      setNewTeamName('');
      setNewTeamDesc('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create team');
    } finally {
      setSubmittingCreateTeam(false);
    }
  };

  const handleSearchExistingWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = existingWorkerSearch.trim();
    if (!query) return;
    setSearchingWorker(true);
    setSearchError(null);
    setFoundWorker(null);
    try {
      const results = await api.getWorkers({ search: query, searchAll: 'true' } as any);
      const cleanQ = query.toLowerCase().replace(/\s+/g, '');
      const match = results.find(
        (w: Worker) =>
          w.workerId.toLowerCase() === query.toLowerCase() ||
          w.userId === query ||
          w.phone.replace(/\s+/g, '') === cleanQ ||
          w.name.toLowerCase().includes(query.toLowerCase())
      ) || (results.length > 0 ? results[0] : null);

      if (!match) {
        setSearchError(`No worker account found matching "${query}". Please verify the Worker ID (e.g. WC-2026-001) or mobile number.`);
      } else {
        setFoundWorker(match);
      }
    } catch (err: any) {
      setSearchError(err.message || 'Error looking up worker');
    } finally {
      setSearchingWorker(false);
    }
  };

  const handleAddExistingToTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foundWorker || !existingTargetTeamId) return;
    setSubmittingAddExisting(true);
    try {
      await api.addTeamMember(existingTargetTeamId, foundWorker.workerId);
      const targetTeam = teams.find((t) => t.teamId === existingTargetTeamId);
      alert(`Worker ${foundWorker.name} (${foundWorker.workerId}) added to ${targetTeam?.name || 'team'}!`);
      setAddExistingModalOpen(false);
      setFoundWorker(null);
      setExistingWorkerSearch('');
      setExistingTargetTeamId('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to add worker to team');
    } finally {
      setSubmittingAddExisting(false);
    }
  };

  const handleRemove = async (w: any) => {
    if (confirm(`Remove worker ${w.name} (${w.workerId}) from ${w.teamName}? Their account and historical records will remain safe.`)) {
      try {
        await api.removeTeamMember(w.teamId, w.workerId);
        alert(`Worker ${w.name} removed from ${w.teamName}. Status updated to Unassigned.`);
        loadData();
      } catch (err: any) {
        alert(err.message || 'Failed to remove worker from team');
      }
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
              fill="url(#team-wave-grad)"
            />
            <defs>
              <linearGradient id="team-wave-grad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#818cf8" stopOpacity="0.1" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/25 flex items-center justify-center text-white shrink-0 shadow-2xs">
            <Users className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white leading-tight tracking-tight">
              My Team
            </h1>
            <p className="text-xs text-white/80 font-medium mt-0.5">
              {totalCount} Field Workers across {teams.length} Teams
            </p>
          </div>
        </div>
      </div>

      {/* 2. ACTION BUTTONS ROW (Exact Match Image 1) */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setCreateTeamModalOpen(true)}
          className="flex-1 py-2 px-2.5 bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-800 rounded-full text-xs font-bold flex items-center justify-center gap-1 shadow-2xs active:scale-95 transition-all cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5 text-slate-700 stroke-[2.5]" />
          <span>Create Team</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setAddExistingModalOpen(true);
            setExistingTargetTeamId(teams[0]?.teamId || '');
            setFoundWorker(null);
            setSearchError(null);
          }}
          className="flex-1 py-2 px-2.5 bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-800 rounded-full text-xs font-bold flex items-center justify-center gap-1 shadow-2xs active:scale-95 transition-all cursor-pointer whitespace-nowrap"
        >
          <UserPlus className="w-3.5 h-3.5 text-blue-600 stroke-[2.2]" />
          <span>Add Existing</span>
        </button>

        <Link
          to="/leader/assign-work"
          className="flex-1 py-2 px-2.5 bg-[#2b44e7] hover:bg-blue-700 active:scale-95 text-white rounded-full text-xs font-bold flex items-center justify-center gap-1 shadow-md shadow-blue-500/25 transition-all cursor-pointer whitespace-nowrap"
        >
          <ClipboardList className="w-3.5 h-3.5 text-white stroke-[2.2]" />
          <span>Assign Assignment</span>
        </Link>
      </div>

      {/* 3. SEGMENTED TAB SWITCHER (Exact Match Image 1) */}
      <div className="bg-white p-1 rounded-full border border-slate-200/80 shadow-2xs flex items-center">
        <button
          type="button"
          onClick={() => setActiveTab('ASSIGNED')}
          className={`flex-1 py-2 px-4 rounded-full text-xs font-extrabold transition-all text-center cursor-pointer ${
            activeTab === 'ASSIGNED'
              ? 'bg-[#2b35d8] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Assigned Crew ({assignedWorkerCards.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('UNASSIGNED')}
          className={`flex-1 py-2 px-4 rounded-full text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'UNASSIGNED'
              ? 'bg-[#2b35d8] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Unassigned</span>
          <span
            className={`px-2 py-0.5 rounded-full text-3xs font-black ${
              activeTab === 'UNASSIGNED'
                ? 'bg-white text-[#2b35d8]'
                : 'bg-[#fef3c7] text-[#b45309]'
            }`}
          >
            {unassignedWorkerCards.length}
          </span>
        </button>
      </div>

      {/* 4. 4 METRIC MINI CARDS (Exact Match Image 1) */}
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

      {/* 5. SEARCH AND FILTER BAR (Exact Match Image 1) */}
      <div className="flex items-center gap-2">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search worker by name or ID"
            className="w-full h-10 pl-9 pr-3 bg-white rounded-full border border-slate-200/90 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 shadow-2xs font-medium"
          />
        </div>

        {/* Filter Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setTeamFilterOpen(!teamFilterOpen)}
            className="h-10 px-3.5 bg-white rounded-full border border-slate-200/90 text-xs font-bold text-slate-700 flex items-center gap-1.5 shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Filter className="w-3.5 h-3.5 text-slate-600" />
            <span>Team</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {teamFilterOpen && (
            <div className="absolute right-0 mt-1 w-52 max-h-60 overflow-y-auto no-scrollbar bg-white rounded-2xl shadow-xl border border-slate-100 p-1.5 z-20 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setSelectedTeamFilter('ALL');
                  setTeamFilterOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 rounded-xl ${
                  selectedTeamFilter === 'ALL' ? 'bg-blue-50 text-blue-600 font-bold' : 'hover:bg-slate-50'
                }`}
              >
                All Teams
              </button>
              {teams.map((t) => (
                <button
                  key={t.teamId}
                  type="button"
                  onClick={() => {
                    setSelectedTeamFilter(t.teamId);
                    setTeamFilterOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 rounded-xl truncate ${
                    selectedTeamFilter === t.teamId || selectedTeamFilter === t.name
                      ? 'bg-blue-50 text-blue-600 font-bold'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* GOOGLE DRIVE WORKER PHOTOS REPOSITORY BAR */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-gradient-to-r from-blue-50/90 to-indigo-50/90 border border-blue-200/80 rounded-2xl shadow-2xs">
        <div className="flex items-center gap-2 min-w-0">
          <HardDrive className="w-4 h-4 text-blue-600 shrink-0" />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-3xs font-extrabold text-blue-900 truncate">
                Worker Photos Google Drive
              </span>
              <span className="text-4xs font-bold uppercase bg-blue-200/80 text-blue-800 px-1.5 py-0.2 rounded-full shrink-0">
                Automatic
              </span>
            </div>
            <span className="text-4xs text-blue-600/90 font-mono block truncate">
              ID: 1xBiZLYm1gGaMJ5KZWNvlO1mOkhI0wcZN
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleSyncAllToDrive}
            disabled={syncingDrive}
            className="flex items-center gap-1 text-3xs font-black text-blue-700 hover:text-blue-900 bg-white border border-blue-200 px-2 py-1 rounded-lg shadow-2xs hover:bg-blue-50 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <span>{syncingDrive ? 'Syncing...' : 'Sync All'}</span>
          </button>
          <a
            href="https://drive.google.com/drive/folders/1xBiZLYm1gGaMJ5KZWNvlO1mOkhI0wcZN?usp=sharing"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-3xs font-black text-white bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded-lg shadow-2xs transition-colors"
          >
            <span>Open</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </div>

      {/* 4. WORKER CARDS LIST */}
      <div className="space-y-3">
        {displayedWorkers.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 py-10 shadow-sm border border-slate-100/90 text-center relative overflow-hidden flex flex-col items-center justify-center min-h-[220px]">
            {/* Subtle bottom corner wavy accents */}
            <div className="absolute -bottom-6 -left-6 w-32 h-24 bg-gradient-to-tr from-purple-100/40 to-transparent rounded-tr-full pointer-events-none" />
            <div className="absolute -bottom-6 -right-6 w-32 h-24 bg-gradient-to-tl from-purple-100/40 to-transparent rounded-tl-full pointer-events-none" />

            {/* Cloud illustration with people icons + sparkles */}
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
                <Users className="w-9 h-9 stroke-[2.2]" />
              </div>
            </div>

            <h3 className="text-base font-black text-slate-900 tracking-tight">
              {activeTab === 'UNASSIGNED' ? 'No unassigned workers' : 'No assigned workers found'}
            </h3>
            <p className="text-2xs text-slate-500 font-medium mt-1 max-w-[260px]">
              {activeTab === 'UNASSIGNED'
                ? 'All field personnel are currently assigned to active teams.'
                : 'Try adjusting your search query or team filter.'}
            </p>
          </div>
        ) : (
          displayedWorkers.map((w) =>
            w.isUnassigned ? (
              /* UNASSIGNED WORKER CARD */
              <div
                key={w.workerId}
                className="bg-white rounded-3xl p-3.5 border border-amber-200/90 shadow-2xs space-y-3"
              >
                {/* Top Row: Avatar + Name + ID + UNASSIGNED Badge */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <SafeAvatar src={w.avatarUrl} name={w.name} initials={w.initials} className="w-10 h-10" />
                    <div className="min-w-0">
                      <h3 className="text-xs font-black text-slate-900 leading-tight truncate">
                        {w.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-3xs font-medium mt-0.5">
                        <span className="font-mono font-bold bg-blue-50 text-blue-700 px-1 py-0.2 rounded border border-blue-100">
                          {w.workerId}
                        </span>
                        <span className="text-slate-300">·</span>
                        <span className="text-slate-600 font-semibold">{w.phone}</span>
                      </div>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-full text-4xs font-black bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                    UNASSIGNED
                  </span>
                </div>

                {/* Details Row: Account Status + Joining Date */}
                <div className="bg-slate-50/80 rounded-2xl p-2.5 border border-slate-100 flex items-center justify-between text-2xs">
                  <div className="space-y-0.5">
                    <span className="text-4xs text-slate-400 font-bold block uppercase">Account Status</span>
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-black text-3xs">
                      <CheckCircle2 className="w-3 h-3" />
                      {w.accountStatus}
                    </span>
                  </div>
                  <div className="text-right space-y-0.5">
                    <span className="text-4xs text-slate-400 font-bold block uppercase">Joining Date</span>
                    <span className="text-slate-700 font-bold text-3xs">{w.joiningDate || '--'}</span>
                  </div>
                </div>

                {/* Assign to Team Action Button */}
                <button
                  type="button"
                  onClick={() => {
                    setAssignModalWorker(w);
                    setAssignTeamId(teams[0]?.teamId || '');
                  }}
                  className="w-full min-h-[40px] px-3 py-2 bg-[#1752d5] hover:bg-blue-700 active:scale-98 text-white font-extrabold text-2xs rounded-2xl shadow-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Assign to Authorized Team</span>
                </button>
              </div>
            ) : (
              /* ASSIGNED WORKER CARD */
              <div
                key={w.workerId}
                className="bg-white rounded-3xl p-3.5 border border-slate-100 shadow-2xs space-y-2.5"
              >
                {/* Top Row: Avatar, Name, ID, Team & Status Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <SafeAvatar src={w.avatarUrl} name={w.name} initials={w.initials} className="w-10 h-10" />

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-xs font-black text-slate-900 leading-tight truncate">
                          {w.name}
                        </h3>
                      </div>

                      <div className="flex items-center gap-1 text-3xs text-slate-500 font-medium mt-0.5">
                        <span className="font-mono font-bold bg-blue-50 text-blue-700 px-1 py-0.2 rounded border border-blue-100 shrink-0">
                          {w.workerId}
                        </span>
                        <span className="text-slate-300">|</span>
                        <span className="flex items-center gap-1 text-slate-500 truncate max-w-[170px]">
                          <Users className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{w.teamName}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status Pill */}
                  {w.statusType === 'PRESENT' ? (
                    <span className="bg-[#16a34a] text-white px-2.5 py-0.5 rounded-full text-3xs font-extrabold flex items-center gap-1 shadow-2xs shrink-0">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Present</span>
                    </span>
                  ) : (
                    <span className="bg-[#fef3c7] text-[#b45309] px-2.5 py-0.5 rounded-full text-3xs font-extrabold flex items-center gap-1 shadow-2xs shrink-0">
                      <Clock className="w-3 h-3" />
                      <span>Not Checked In</span>
                    </span>
                  )}
                </div>

                {/* Middle Row: Current Assignment */}
                <div className="bg-slate-50/70 p-2.5 rounded-2xl border border-slate-100 flex items-center justify-between gap-2">
                  <div className="space-y-0.5 text-2xs text-slate-700 min-w-0">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 truncate">
                      <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="truncate">{w.jobTitle}</span>
                    </div>
                    <div className="flex items-center gap-1 text-3xs text-slate-500">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{w.location}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                </div>

                {/* Bottom Row: Actions (View, Edit, Reset Password, Remove) */}
                <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-2xs font-extrabold">
                  <button
                    type="button"
                    onClick={() => setViewWorker(w)}
                    className="py-1 px-2.5 text-slate-700 hover:text-blue-600 hover:bg-slate-50 rounded-xl flex items-center gap-1 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    <span>View</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(w)}
                    className="py-1 px-2.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50/60 rounded-xl flex items-center gap-1 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAssignModalWorker(w);
                      setAssignTeamId(w.teamId || teams[0]?.teamId || '');
                    }}
                    className="py-1 px-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50/60 rounded-xl flex items-center gap-1 transition-colors"
                    title="Change Team"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Change</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setResetWorker(w);
                      setResetPasswordVal('password123');
                    }}
                    className="py-1 px-2.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50/60 rounded-xl flex items-center gap-1 transition-colors"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Reset Pwd</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemove(w)}
                    className="py-1 px-2.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50/60 rounded-xl flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            )
          )
        )}
      </div>

      {/* VIEW WORKER MODAL */}
      <Modal
        isOpen={!!viewWorker}
        onClose={() => setViewWorker(null)}
        title={viewWorker ? `${viewWorker.name} (${viewWorker.workerId})` : ''}
      >
        {viewWorker && (
          <div className="space-y-4 text-xs">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Worker ID</span>
                <span className="font-mono font-bold text-blue-600">{viewWorker.workerId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Assigned Unit</span>
                <span className="font-bold text-slate-900">{viewWorker.teamName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Attendance Status</span>
                <span className="font-bold text-emerald-600">{viewWorker.status}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Current Job</span>
                <span className="font-bold text-slate-900 text-right truncate max-w-[180px]">
                  {viewWorker.jobTitle}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Site Location</span>
                <span className="font-bold text-slate-700 text-right truncate max-w-[180px]">
                  {viewWorker.location}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setViewWorker(null)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </Modal>

      {/* EDIT WORKER MODAL */}
      <Modal
        isOpen={!!editWorker}
        onClose={() => setEditWorker(null)}
        title={editWorker ? `Edit ${editWorker.name}` : ''}
      >
        {editWorker && (
          <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-2xs">Worker Name</label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 text-2xs">Phone Number</label>
              <input
                type="tel"
                required
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 text-2xs">Primary Team</label>
              <input
                type="text"
                value={editTeamId}
                disabled
                className="w-full px-3 py-2 border border-slate-200 bg-slate-100 rounded-xl text-xs text-slate-500"
              />
            </div>

            <button
              type="submit"
              disabled={savingEdit}
              className="w-full min-h-[46px] py-2.5 bg-[#1752d5] hover:bg-blue-700 text-white font-black rounded-2xl shadow-sm text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <span>{savingEdit ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </form>
        )}
      </Modal>

      {/* RESET WORKER PASSWORD MODAL */}
      <Modal
        isOpen={!!resetWorker}
        onClose={() => setResetWorker(null)}
        title={resetWorker ? `Reset Password: ${resetWorker.name}` : ''}
      >
        {resetWorker && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setSubmittingReset(true);
              try {
                await api.resetPassword({
                  targetUserId: resetWorker.userId,
                  temporaryPassword: resetPasswordVal,
                });
                alert(`Password reset for ${resetWorker.name}. Temporary password: ${resetPasswordVal}`);
                setResetWorker(null);
              } catch (err: any) {
                alert(err.message || 'Failed to reset password');
              } finally {
                setSubmittingReset(false);
              }
            }}
            className="space-y-3.5 text-xs"
          >
            <p className="text-2xs text-slate-500">
              Set a temporary password. The worker will be required to change it on their next login.
            </p>

            <div>
              <label className="block font-bold text-slate-700 mb-1 text-2xs">Temporary Password</label>
              <input
                type="text"
                required
                minLength={6}
                value={resetPasswordVal}
                onChange={(e) => setResetPasswordVal(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={submittingReset}
              className="w-full min-h-[46px] py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-2xl shadow-sm text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60"
            >
              <KeyRound className="w-4 h-4" />
              <span>{submittingReset ? 'Resetting...' : 'Confirm Reset Password'}</span>
            </button>
          </form>
        )}
      </Modal>

      {/* ASSIGN WORKER TO TEAM MODAL (LEADER) */}
      <Modal
        isOpen={!!assignModalWorker}
        onClose={() => setAssignModalWorker(null)}
        title={assignModalWorker ? `Assign to Team: ${assignModalWorker.name}` : ''}
      >
        {assignModalWorker && (
          <form onSubmit={handleAssignTeam} className="space-y-3.5 text-xs">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Worker ID:</span>
                <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                  {assignModalWorker.workerId}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Mobile Number:</span>
                <span className="font-semibold text-slate-800">{assignModalWorker.phone}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Joining Date:</span>
                <span className="text-slate-700">{assignModalWorker.joiningDate || '--'}</span>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 text-2xs">Select Authorized Team *</label>
              <select
                required
                value={assignTeamId}
                onChange={(e) => setAssignTeamId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-blue-500"
              >
                <option value="">-- Choose Authorized Team --</option>
                {teams.map((t) => (
                  <option key={t.teamId} value={t.teamId}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <p className="text-3xs text-slate-500 leading-relaxed">
              Assigning this worker adds them to your team roster, records your authorization in audit logs, and allows the worker to view daily assignments and record GPS attendance.
            </p>

            <button
              type="submit"
              disabled={submittingAssign || !assignTeamId}
              className="w-full min-h-[46px] py-2.5 bg-[#1752d5] hover:bg-blue-700 active:scale-98 text-white font-black rounded-2xl shadow-sm text-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Users className="w-4 h-4" />
              <span>{submittingAssign ? 'Assigning...' : 'Confirm Assignment'}</span>
            </button>
          </form>
        )}
      </Modal>

      {/* CREATE TEAM MODAL (LEADER) */}
      <Modal
        isOpen={createTeamModalOpen}
        onClose={() => setCreateTeamModalOpen(false)}
        title="Create Team"
      >
        <form onSubmit={handleCreateTeam} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1 text-2xs">
              Team Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              placeholder="e.g. South Wing Masonry Team"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1 text-2xs">
              Description <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <textarea
              rows={2}
              value={newTeamDesc}
              onChange={(e) => setNewTeamDesc(e.target.value)}
              placeholder="Operational scope, trade discipline, or job responsibility..."
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-blue-500"
            />
          </div>

          <p className="text-3xs text-slate-500 leading-relaxed">
            As a Team Leader, you will automatically be assigned as the supervising leader of this team. You can add workers immediately or leave the team unpopulated.
          </p>

          <button
            type="submit"
            disabled={submittingCreateTeam || !newTeamName.trim()}
            className="w-full min-h-[46px] py-2.5 bg-[#1752d5] hover:bg-blue-700 active:scale-98 text-white font-black rounded-2xl shadow-sm text-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{submittingCreateTeam ? 'Creating Team...' : 'Create Team'}</span>
          </button>
        </form>
      </Modal>

      {/* ADD EXISTING WORKER MODAL (LEADER) */}
      <Modal
        isOpen={addExistingModalOpen}
        onClose={() => setAddExistingModalOpen(false)}
        title="Add Existing Worker to Team"
      >
        <div className="space-y-4 text-xs">
          {/* STEP 1: SELECT TARGET TEAM */}
          <div>
            <label className="block font-bold text-slate-700 mb-1 text-2xs">
              Target Team <span className="text-rose-500">*</span>
            </label>
            <select
              value={existingTargetTeamId}
              onChange={(e) => setExistingTargetTeamId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-blue-500"
            >
              {teams.map((t) => (
                <option key={t.teamId} value={t.teamId}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* STEP 2: SEARCH WORKER */}
          <form onSubmit={handleSearchExistingWorker} className="space-y-2">
            <label className="block font-bold text-slate-700 text-2xs">
              Search by Worker ID, UID, or Mobile Number <span className="text-rose-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={existingWorkerSearch}
                onChange={(e) => setExistingWorkerSearch(e.target.value)}
                placeholder="e.g. WC-2026-001 or +91 98765..."
                className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={searchingWorker || !existingWorkerSearch.trim()}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors shrink-0 disabled:opacity-50"
              >
                {searchingWorker ? 'Searching...' : 'Find Worker'}
              </button>
            </div>
          </form>

          {/* SEARCH ERROR */}
          {searchError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-2xs font-semibold rounded-xl">
              {searchError}
            </div>
          )}

          {/* FOUND WORKER PREVIEW & CONFIRMATION */}
          {foundWorker && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center gap-2.5">
                <SafeAvatar src={foundWorker.photoURL} name={foundWorker.name} className="w-10 h-10" />
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-black text-slate-900 truncate">{foundWorker.name}</h4>
                  <div className="flex items-center gap-1.5 text-3xs text-slate-500 font-medium mt-0.5">
                    <span className="font-mono font-bold bg-blue-50 text-blue-700 px-1 py-0.2 rounded border border-blue-100">
                      {foundWorker.workerId}
                    </span>
                    <span>·</span>
                    <span>{foundWorker.phone}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-3xs pt-1 border-t border-slate-200">
                <div>
                  <span className="text-slate-400 block font-semibold uppercase">Account Status</span>
                  <span className="font-bold text-emerald-700">{foundWorker.status}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold uppercase">Current Assignment</span>
                  <span className="font-bold text-slate-800">
                    {foundWorker.primaryTeamName || 'Unassigned'}
                  </span>
                </div>
              </div>

              {foundWorker.status !== 'ACTIVE' ? (
                <p className="text-3xs text-rose-600 font-bold">
                  ⚠ This worker's account is {foundWorker.status}. Only active accounts can be assigned.
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleAddExistingToTeam}
                  disabled={submittingAddExisting || !existingTargetTeamId}
                  className="w-full min-h-[42px] py-2 bg-[#1752d5] hover:bg-blue-700 text-white font-black rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>{submittingAddExisting ? 'Adding to Team...' : 'Confirm Add to Team'}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
