import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Worker, Team } from '../../types';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import {
  UserCheck,
  Search,
  Filter,
  Plus,
  Edit2,
  Power,
  Eye,
  Building,
  Phone,
  Mail,
  Calendar,
  KeyRound,
  Users,
} from 'lucide-react';
import { SafeAvatar } from '../../components/common/SafeAvatar';

export const AdminWorkers: React.FC = () => {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [activeTab, setActiveTab] = useState<'ALL' | 'ASSIGNED' | 'UNASSIGNED'>('ALL');
  const [search, setSearch] = useState('');
  const [teamFilter, setTeamFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Assign Team Modal
  const [assignModalWorker, setAssignModalWorker] = useState<Worker | null>(null);
  const [assignTeamId, setAssignTeamId] = useState('');
  const [submittingAssign, setSubmittingAssign] = useState(false);

  // Add Worker Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('+91 ');
  const [newEmail, setNewEmail] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newTeamId, setNewTeamId] = useState('');
  const [newJoiningDate, setNewJoiningDate] = useState(new Date().toISOString().slice(0, 10));
  const [newTemporaryPassword, setNewTemporaryPassword] = useState('');
  const [submittingAdd, setSubmittingAdd] = useState(false);

  // Reset Password Modal
  const [resetWorker, setResetWorker] = useState<Worker | null>(null);
  const [resetPasswordVal, setResetPasswordVal] = useState('');
  const [submittingReset, setSubmittingReset] = useState(false);

  // Edit Worker Modal
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editTeamId, setEditTeamId] = useState('');
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Profile View Modal
  const [viewingWorkerDetails, setViewingWorkerDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [wList, tList] = await Promise.all([
        api.getWorkers({
          search: search || undefined,
          teamId: teamFilter || undefined,
          status: statusFilter || undefined,
        }),
        api.getTeams(),
      ]);
      setWorkers(wList);
      setTeams(tList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, teamFilter, statusFilter]);

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

  const handleCreateWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingAdd(true);
    try {
      await api.createWorker({
        name: newName,
        phone: newPhone,
        email: newEmail || undefined,
        address: newAddress || undefined,
        primaryTeamId: newTeamId || undefined,
        joiningDate: newJoiningDate,
        temporaryPassword: newTemporaryPassword,
      } as any);
      setAddModalOpen(false);
      setNewName('');
      setNewPhone('+91 ');
      setNewEmail('');
      setNewAddress('');
      setNewTemporaryPassword('');
      loadData();
      alert('Worker successfully created with unique sequential ID!');
    } catch (err: any) {
      alert(err.message || 'Failed to register worker');
    } finally {
      setSubmittingAdd(false);
    }
  };

  const handleEditWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWorker) return;
    setSubmittingEdit(true);
    try {
      await api.updateWorker(editingWorker.workerId, {
        name: editName,
        phone: editPhone,
        email: editEmail || undefined,
        address: editAddress || undefined,
        primaryTeamId: editTeamId || undefined,
      });
      setEditingWorker(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update worker');
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleToggleStatus = async (worker: Worker) => {
    const nextStatus = worker.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    if (confirm(`Change status of ${worker.name} to ${nextStatus}?`)) {
      try {
        await api.updateWorkerStatus(worker.workerId, nextStatus);
        loadData();
      } catch (err: any) {
        alert(err.message || 'Failed to change status');
      }
    }
  };

  const handleViewProfile = async (id: string) => {
    setLoadingDetails(true);
    try {
      const details = await api.getWorker(id);
      setViewingWorkerDetails(details);
    } catch (err: any) {
      alert(err.message || 'Failed to load details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const unassignedWorkers = workers.filter(
    (w) => w.teamAssignmentStatus === 'UNASSIGNED' || !w.primaryTeamId
  );
  const assignedWorkers = workers.filter(
    (w) => w.teamAssignmentStatus === 'ASSIGNED' && !!w.primaryTeamId
  );

  const displayedWorkers = workers.filter((w) => {
    const isUnassigned = w.teamAssignmentStatus === 'UNASSIGNED' || !w.primaryTeamId;
    if (activeTab === 'ASSIGNED' && isUnassigned) return false;
    if (activeTab === 'UNASSIGNED' && !isUnassigned) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Worker Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Total {workers.length} registered field personnel ({assignedWorkers.length} assigned, {unassignedWorkers.length} unassigned)
          </p>
        </div>

        <button
          onClick={() => setAddModalOpen(true)}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Add Worker
        </button>
      </div>

      {/* TABS: ALL / ASSIGNED / UNASSIGNED */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('ALL')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'ALL'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          All Workers ({workers.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('ASSIGNED')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'ASSIGNED'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Assigned ({assignedWorkers.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('UNASSIGNED')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'UNASSIGNED'
              ? 'bg-amber-600 text-white shadow-2xs'
              : unassignedWorkers.length > 0
              ? 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span>Unassigned</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-3xs font-black ${
              activeTab === 'UNASSIGNED'
                ? 'bg-white text-amber-700'
                : 'bg-amber-200 text-amber-900'
            }`}
          >
            {unassignedWorkers.length}
          </span>
        </button>
      </div>

      {/* UNASSIGNED NOTICE BANNER */}
      {activeTab === 'UNASSIGNED' && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
          <div className="p-2 bg-amber-100 text-amber-800 rounded-xl shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-amber-900">
              Unassigned Workers Management ({unassignedWorkers.length})
            </h3>
            <p className="text-2xs text-amber-700 mt-0.5">
              These workers have active accounts and can log in normally, but cannot check in or receive work assignments until assigned to a team, site location, and authorized shift. Click <strong>"Assign Team"</strong> below to activate their field assignment.
            </p>
          </div>
        </div>
      )}

      {/* SEARCH AND FILTER BAR */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by worker name, ID (e.g. WC-2026-001), or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600"
          />
        </div>

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

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-700 bg-white"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="ON_LEAVE">On Leave</option>
        </select>
      </div>

      {/* WORKERS TABLE */}
      {loading ? (
        <LoadingSpinner message="Querying workforce database..." />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 uppercase text-3xs font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3">Worker ID & Name</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Team & Assignment Status</th>
                  <th className="px-4 py-3">Joining Date</th>
                  <th className="px-4 py-3">Account Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedWorkers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                      No workers found matching your filter criteria.
                    </td>
                  </tr>
                ) : (
                  displayedWorkers.map((w) => {
                    const isUnassigned = w.teamAssignmentStatus === 'UNASSIGNED' || !w.primaryTeamId;
                    return (
                      <tr key={w.workerId} className="hover:bg-slate-50/60">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <SafeAvatar
                              src={w.photoURL}
                              name={w.name}
                              className="w-8 h-8"
                            />
                            <div>
                              <div className="font-bold text-slate-900">{w.name}</div>
                              <span className="text-3xs font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                                {w.workerId}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3 text-slate-600">
                          <div className="font-semibold text-slate-800">{w.phone}</div>
                          <div className="text-3xs text-slate-400">{w.email || '--'}</div>
                        </td>

                        <td className="px-4 py-3">
                          {isUnassigned ? (
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-full text-3xs font-black bg-amber-50 text-amber-700 border border-amber-200">
                                UNASSIGNED
                              </span>
                              <button
                                onClick={() => {
                                  setAssignModalWorker(w);
                                  setAssignTeamId(teams[0]?.teamId || '');
                                }}
                                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-3xs font-bold transition-all shadow-2xs flex items-center gap-1"
                              >
                                Assign Team
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-800">{w.primaryTeamName}</span>
                              <span className="px-1.5 py-0.2 rounded-full text-4xs font-black bg-emerald-50 text-emerald-700 border border-emerald-100">
                                ASSIGNED
                              </span>
                              <button
                                onClick={() => {
                                  setAssignModalWorker(w);
                                  setAssignTeamId(w.primaryTeamId || teams[0]?.teamId || '');
                                }}
                                className="text-3xs text-blue-600 hover:underline font-semibold ml-1"
                                title="Change Team"
                              >
                                Change
                              </button>
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-3 text-slate-500 font-medium">{w.joiningDate}</td>

                        <td className="px-4 py-3">
                          <StatusBadge status={w.status} size="sm" />
                        </td>

                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleViewProfile(w.workerId)}
                              title="View Profile & Attendance History"
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => {
                                setResetWorker(w);
                                setResetPasswordVal('');
                              }}
                              title="Reset Password"
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            >
                              <KeyRound className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => {
                                setEditingWorker(w);
                                setEditName(w.name);
                                setEditPhone(w.phone);
                                setEditEmail(w.email || '');
                                setEditAddress(w.address || '');
                                setEditTeamId(w.primaryTeamId || '');
                              }}
                              title="Edit Details"
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleToggleStatus(w)}
                              title={w.status === 'ACTIVE' ? 'Deactivate Account' : 'Activate Account'}
                              className={`p-1.5 rounded-lg transition-colors ${
                                w.status === 'ACTIVE'
                                  ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                  : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                              }`}
                            >
                              <Power className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD WORKER MODAL */}
      <Modal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} title="Register Field Worker">
        <form onSubmit={handleCreateWorker} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ramesh Kumar"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone Number *</label>
              <input
                type="tel"
                required
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Temporary Password *</label>
              <input
                type="text"
                required
                minLength={6}
                value={newTemporaryPassword}
                onChange={(e) => setNewTemporaryPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Joining Date *</label>
              <input
                type="date"
                required
                value={newJoiningDate}
                onChange={(e) => setNewJoiningDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Assign Initial Team</label>
            <select
              value={newTeamId}
              onChange={(e) => setNewTeamId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            >
              <option value="">-- No Team (Unassigned) --</option>
              {teams.map((t) => (
                <option key={t.teamId} value={t.teamId}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Residential Address</label>
            <textarea
              rows={2}
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="flex-1 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingAdd}
              className="flex-1 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
            >
              {submittingAdd ? 'Generating ID...' : 'Register Worker'}
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT WORKER MODAL */}
      <Modal isOpen={!!editingWorker} onClose={() => setEditingWorker(null)} title="Edit Worker Profile">
        <form onSubmit={handleEditWorker} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone Number *</label>
              <input
                type="tel"
                required
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Change Team</label>
            <select
              value={editTeamId}
              onChange={(e) => setEditTeamId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            >
              <option value="">-- No Team (Unassigned) --</option>
              {teams.map((t) => (
                <option key={t.teamId} value={t.teamId}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setEditingWorker(null)}
              className="flex-1 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingEdit}
              className="flex-1 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
            >
              {submittingEdit ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* VIEW WORKER PROFILE & HISTORY MODAL */}
      <Modal
        isOpen={!!viewingWorkerDetails}
        onClose={() => setViewingWorkerDetails(null)}
        title="Worker Profile & Attendance History"
        maxWidth="xl"
      >
        {viewingWorkerDetails && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <img
                src={viewingWorkerDetails.worker.photoURL || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100'}
                alt=""
                className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-xs"
              />
              <div>
                <h4 className="text-sm font-bold text-slate-900">{viewingWorkerDetails.worker.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-2xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                    {viewingWorkerDetails.worker.workerId}
                  </span>
                  <StatusBadge status={viewingWorkerDetails.worker.status} size="sm" />
                </div>
                <p className="text-2xs text-slate-500 mt-1">
                  Team: <strong>{viewingWorkerDetails.worker.primaryTeamName || 'Unassigned'}</strong> · Phone: {viewingWorkerDetails.worker.phone}
                </p>
              </div>
            </div>

            <div>
              <h5 className="font-bold text-slate-800 mb-2">Past Attendance Records</h5>
              <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                {viewingWorkerDetails.attendanceHistory.length === 0 ? (
                  <div className="p-4 text-center text-slate-400">No attendance history logged.</div>
                ) : (
                  viewingWorkerDetails.attendanceHistory.map((att: any) => (
                    <div key={att.attendanceId} className="p-2.5 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-800">{att.date}</span>
                        <span className="text-3xs text-slate-400 block font-mono">
                          In: {att.checkInTime ? new Date(att.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'} · Out: {att.checkOutTime ? new Date(att.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <StatusBadge status={att.verificationStatus} size="sm" />
                        <StatusBadge status={att.status} size="sm" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
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
            className="space-y-4 text-xs"
          >
            <p className="text-2xs text-slate-500">
              Set a temporary password. The worker will be required to change it on their next login.
            </p>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Temporary Password *</label>
              <input
                type="text"
                required
                minLength={6}
                value={resetPasswordVal}
                onChange={(e) => setResetPasswordVal(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 font-mono"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setResetWorker(null)}
                className="flex-1 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingReset}
                className="flex-1 py-2 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 disabled:opacity-50"
              >
                {submittingReset ? 'Resetting...' : 'Confirm Reset'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ASSIGN WORKER TO TEAM MODAL */}
      <Modal
        isOpen={!!assignModalWorker}
        onClose={() => setAssignModalWorker(null)}
        title={assignModalWorker ? `Assign Worker to Team: ${assignModalWorker.name}` : ''}
      >
        {assignModalWorker && (
          <form onSubmit={handleAssignTeam} className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
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
                <span className="text-slate-500 font-medium">Current Status:</span>
                <span className="px-2 py-0.5 rounded-full text-4xs font-black bg-amber-50 text-amber-700 border border-amber-200">
                  {assignModalWorker.teamAssignmentStatus || 'UNASSIGNED'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Joining Date:</span>
                <span className="text-slate-700">{assignModalWorker.joiningDate}</span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Select Authorized Team *</label>
              <select
                required
                value={assignTeamId}
                onChange={(e) => setAssignTeamId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 text-xs font-semibold"
              >
                <option value="">-- Choose Team to Assign --</option>
                {teams.map((t) => (
                  <option key={t.teamId} value={t.teamId}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <p className="text-3xs text-slate-500 leading-relaxed">
              Assigning this worker updates their status to <strong>ASSIGNED</strong>, connects them to the authorized team leader, and grants permission to log attendance and view team assignments.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAssignModalWorker(null)}
                className="flex-1 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingAssign || !assignTeamId}
                className="flex-1 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {submittingAssign ? 'Assigning...' : 'Confirm Assignment'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
