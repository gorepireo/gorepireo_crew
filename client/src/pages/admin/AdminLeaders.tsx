import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { IndianPhoneInput } from '../../components/common/IndianPhoneInput';
import { formatIndianPhone } from '../../utils/phone';
import { TeamLeader, Team } from '../../types';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Users, Plus, Edit2, ShieldCheck, CheckSquare, Square, KeyRound, Power, Trash2 } from 'lucide-react';

export const AdminLeaders: React.FC = () => {
  const [leaders, setLeaders] = useState<TeamLeader[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [canAddWorkers, setCanAddWorkers] = useState(true);
  const [canCorrectAttendance, setCanCorrectAttendance] = useState(true);
  const [canCreateTeams, setCanCreateTeams] = useState(true);
  const [submittingAdd, setSubmittingAdd] = useState(false);

  // Reset Password Modal
  const [resetLeader, setResetLeader] = useState<TeamLeader | null>(null);
  const [resetPasswordVal, setResetPasswordVal] = useState('');
  const [submittingReset, setSubmittingReset] = useState(false);

  const [activeTab, setActiveTab] = useState<'ALL' | 'ASSIGNED' | 'UNASSIGNED'>('ALL');

  // Edit Modal
  const [editingLeader, setEditingLeader] = useState<TeamLeader | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editTeamIds, setEditTeamIds] = useState<string[]>([]);
  const [editPermissions, setEditPermissions] = useState<any>({});
  const [submittingEdit, setSubmittingEdit] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [lList, tList] = await Promise.all([api.getLeaders(), api.getTeams()]);
      setLeaders(lList);
      setTeams(tList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingAdd(true);
    try {
      await api.createLeader({
        name,
        phone,
        email: email || undefined,
        temporaryPassword,
        status,
        managedTeamIds: selectedTeamIds,
        permissions: {
          canAddWorkers,
          canAssignJobs: false,
          canCorrectAttendance,
          canCreateTeams,
        },
      } as any);
      setAddModalOpen(false);
      setName('');
      setPhone('');
      setEmail('');
      setTemporaryPassword('');
      setSelectedTeamIds([]);
      loadData();
      alert('Team Leader created successfully.');
    } catch (err: any) {
      alert(err.message || 'Failed to create leader');
    } finally {
      setSubmittingAdd(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLeader) return;
    setSubmittingEdit(true);
    try {
      await api.updateLeader(editingLeader.leaderId, {
        name: editName,
        phone: editPhone,
        managedTeamIds: editTeamIds,
        permissions: editPermissions,
      });
      setEditingLeader(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update leader');
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleToggleStatus = async (leader: TeamLeader) => {
    const nextStatus = leader.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    if (confirm(`Change account status of ${leader.name} (${leader.leaderId}) to ${nextStatus}?`)) {
      try {
        await api.updateLeader(leader.leaderId, { status: nextStatus });
        loadData();
      } catch (err: any) {
        alert(err.message || 'Failed to update status');
      }
    }
  };

  const handleDeleteLeader = async (leader: TeamLeader) => {
    if (confirm(`Permanently delete team leader ${leader.name} (${leader.leaderId}) from database? This cannot be undone.`)) {
      try {
        await api.deleteLeader(leader.leaderId);
        loadData();
      } catch (err: any) {
        alert(err.message || 'Failed to delete leader');
      }
    }
  };

  if (loading) return <LoadingSpinner message="Loading team leader management..." />;

  const assignedLeaders = leaders.filter((l) => l.managedTeamIds && l.managedTeamIds.length > 0);
  const unassignedLeaders = leaders.filter((l) => !l.managedTeamIds || l.managedTeamIds.length === 0);

  const displayedLeaders = leaders.filter((l) => {
    const isUnassigned = !l.managedTeamIds || l.managedTeamIds.length === 0;
    if (activeTab === 'ASSIGNED' && isUnassigned) return false;
    if (activeTab === 'UNASSIGNED' && !isUnassigned) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Team Leaders & Supervisors</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Total {leaders.length} registered leaders ({assignedLeaders.length} assigned, {unassignedLeaders.length} unassigned)
          </p>
        </div>

        <button
          onClick={() => setAddModalOpen(true)}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Add Team Leader
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
          All Leaders ({leaders.length})
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
          Assigned ({assignedLeaders.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('UNASSIGNED')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'UNASSIGNED'
              ? 'bg-amber-600 text-white shadow-2xs'
              : unassignedLeaders.length > 0
              ? 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span>Unassigned Leaders</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-3xs font-black ${
              activeTab === 'UNASSIGNED'
                ? 'bg-white text-amber-700'
                : 'bg-amber-200 text-amber-900'
            }`}
          >
            {unassignedLeaders.length}
          </span>
        </button>
      </div>

      {/* UNASSIGNED NOTICE */}
      {activeTab === 'UNASSIGNED' && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
          <div className="p-2 bg-amber-100 text-amber-800 rounded-xl shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-amber-900">
              Unassigned Team Leaders ({unassignedLeaders.length})
            </h3>
            <p className="text-2xs text-amber-700 mt-0.5">
              These team leaders have active supervisor accounts but have not been assigned to any operational teams yet. Click <strong>"Assign Teams"</strong> on any leader card below to delegate operational teams.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayedLeaders.length === 0 ? (
          <div className="col-span-2 p-8 bg-white rounded-2xl border border-slate-200 text-center text-slate-400 text-xs font-medium">
            No team leaders found in this view.
          </div>
        ) : (
          displayedLeaders.map((leader) => {
            const isUnassigned = !leader.managedTeamIds || leader.managedTeamIds.length === 0;
            return (
              <div
                key={leader.leaderId}
                className={`bg-white rounded-2xl border shadow-2xs p-5 space-y-4 ${
                  isUnassigned ? 'border-amber-200' : 'border-slate-200/90'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-sm border border-indigo-100">
                      {leader.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{leader.name}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-3xs font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                          {leader.leaderId}
                        </span>
                        <StatusBadge status={leader.status} size="sm" />
                        {isUnassigned && (
                          <span className="px-2 py-0.5 rounded-full text-4xs font-black bg-amber-50 text-amber-700 border border-amber-200">
                            UNASSIGNED
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      title="Reset Leader Password"
                      onClick={() => {
                        setResetLeader(leader);
                        setResetPasswordVal('');
                      }}
                      className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                    >
                      <KeyRound className="w-4 h-4" />
                    </button>
                    <button
                      title="Edit Leader & Team Assignments"
                      onClick={() => {
                        setEditingLeader(leader);
                        setEditName(leader.name);
                        setEditPhone(leader.phone);
                        setEditTeamIds(leader.managedTeamIds || []);
                        setEditPermissions({ ...leader.permissions });
                      }}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      title={leader.status === 'ACTIVE' ? 'Deactivate Account' : 'Activate Account'}
                      onClick={() => handleToggleStatus(leader)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        leader.status === 'ACTIVE'
                          ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                          : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                      }`}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                    <button
                      title="Permanently Delete Team Leader"
                      onClick={() => handleDeleteLeader(leader)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl text-2xs space-y-1.5 border border-slate-100">
                  <p className="text-slate-600">
                    <strong>Phone:</strong> {formatIndianPhone(leader.phone)} · <strong>Email:</strong> {leader.email || '--'}
                  </p>
                  <div className="pt-1.5 border-t border-slate-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-700 block">
                        Managed Teams ({leader.managedTeamIds ? leader.managedTeamIds.length : 0}):
                      </span>
                      {isUnassigned && (
                        <button
                          onClick={() => {
                            setEditingLeader(leader);
                            setEditName(leader.name);
                            setEditPhone(leader.phone);
                            setEditTeamIds(leader.managedTeamIds || []);
                            setEditPermissions({ ...leader.permissions });
                          }}
                          className="text-3xs font-bold text-blue-600 hover:underline"
                        >
                          + Assign Teams
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {leader.managedTeamIds && leader.managedTeamIds.length > 0 ? (
                        leader.managedTeamIds.map((tid) => {
                          const team = teams.find((t) => t.teamId === tid);
                          return (
                            <span
                              key={tid}
                              className="bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md text-3xs font-medium"
                            >
                              {team?.name || tid}
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-3xs text-amber-700 italic font-semibold">
                          No teams assigned (Leader unassigned)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <span className="text-3xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Permission Rights
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 text-3xs">
                    <span className={leader.permissions.canAddWorkers ? 'text-emerald-700 font-semibold' : 'text-slate-400'}>
                      ✓ Register Workers
                    </span>
                    <span className={leader.permissions.canCorrectAttendance ? 'text-emerald-700 font-semibold' : 'text-slate-400'}>
                      ✓ Correct Attendance
                    </span>
                    <span className={leader.permissions.canCreateTeams ? 'text-emerald-700 font-semibold' : 'text-slate-400'}>
                      ✓ Create Teams
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ADD LEADER MODAL */}
      <Modal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} title="Add Team Leader">
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Vikram Malhotra"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone Number *</label>
              <IndianPhoneInput
                required
                value={phone}
                onChange={setPhone}
                placeholder="9876500000"
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
                value={temporaryPassword}
                onChange={(e) => setTemporaryPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email (Optional)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="leader@workcrew.com"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Assign Managed Teams</label>
            <div className="space-y-1.5 max-h-36 overflow-y-auto border border-slate-200 rounded-lg p-2">
              {teams.map((t) => (
                <label key={t.teamId} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedTeamIds.includes(t.teamId)}
                    onChange={() =>
                      setSelectedTeamIds((prev) =>
                        prev.includes(t.teamId) ? prev.filter((id) => id !== t.teamId) : [...prev, t.teamId]
                      )
                    }
                    className="accent-blue-600"
                  />
                  <span>
                    {t.name} ({t.memberWorkerIds.length} members)
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-2">Granted Permissions</label>
            <div className="grid grid-cols-2 gap-2 text-2xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={canAddWorkers}
                  onChange={(e) => setCanAddWorkers(e.target.checked)}
                  className="accent-blue-600"
                />
                <span>Can Register Workers</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={canCorrectAttendance}
                  onChange={(e) => setCanCorrectAttendance(e.target.checked)}
                  className="accent-blue-600"
                />
                <span>Can Correct Attendance</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={canCreateTeams}
                  onChange={(e) => setCanCreateTeams(e.target.checked)}
                  className="accent-blue-600"
                />
                <span>Can Create Teams</span>
              </label>
            </div>
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
              {submittingAdd ? 'Saving...' : 'Create Team Leader'}
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT LEADER MODAL */}
      <Modal isOpen={!!editingLeader} onClose={() => setEditingLeader(null)} title="Edit Leader Permissions">
        <form onSubmit={handleEdit} className="space-y-4 text-xs">
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
              <IndianPhoneInput
                required
                value={editPhone}
                onChange={setEditPhone}
                placeholder="9876500000"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Managed Teams</label>
            <div className="space-y-1.5 max-h-36 overflow-y-auto border border-slate-200 rounded-lg p-2">
              {teams.map((t) => (
                <label key={t.teamId} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editTeamIds.includes(t.teamId)}
                    onChange={() =>
                      setEditTeamIds((prev) =>
                        prev.includes(t.teamId) ? prev.filter((id) => id !== t.teamId) : [...prev, t.teamId]
                      )
                    }
                    className="accent-blue-600"
                  />
                  <span>
                    {t.name} ({t.memberWorkerIds.length} members)
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setEditingLeader(null)}
              className="flex-1 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingEdit}
              className="flex-1 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
            >
              {submittingEdit ? 'Saving...' : 'Update Leader'}
            </button>
          </div>
        </form>
      </Modal>

      {/* RESET LEADER PASSWORD MODAL */}
      <Modal
        isOpen={!!resetLeader}
        onClose={() => setResetLeader(null)}
        title={resetLeader ? `Reset Password: ${resetLeader.name}` : ''}
      >
        {resetLeader && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setSubmittingReset(true);
              try {
                await api.resetPassword({
                  targetUserId: resetLeader.userId,
                  temporaryPassword: resetPasswordVal,
                });
                alert(`Password reset for ${resetLeader.name}. Temporary password: ${resetPasswordVal}`);
                setResetLeader(null);
              } catch (err: any) {
                alert(err.message || 'Failed to reset password');
              } finally {
                setSubmittingReset(false);
              }
            }}
            className="space-y-4 text-xs"
          >
            <p className="text-2xs text-slate-500">
              Set a temporary password. The Team Leader will be required to change it on next login.
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
                onClick={() => setResetLeader(null)}
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
    </div>
  );
};
