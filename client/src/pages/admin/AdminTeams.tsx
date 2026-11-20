import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Team, TeamLeader, Worker } from '../../types';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Building2, Plus, Edit2, Users, UserPlus, Trash2 } from 'lucide-react';

export const AdminTeams: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [leaders, setLeaders] = useState<TeamLeader[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Team Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedLeaderIds, setSelectedLeaderIds] = useState<string[]>([]);
  const [submittingCreate, setSubmittingCreate] = useState(false);

  // Add Member Modal
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [submittingMember, setSubmittingMember] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tList, lList, wList] = await Promise.all([
        api.getTeams(),
        api.getLeaders(),
        api.getWorkers(),
      ]);
      setTeams(tList);
      setLeaders(lList);
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

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingCreate(true);
    try {
      await api.createTeam({
        name,
        description,
        leaderIds: selectedLeaderIds,
        memberWorkerIds: [],
      });
      setCreateModalOpen(false);
      setName('');
      setDescription('');
      setSelectedLeaderIds([]);
      loadData();
      alert('Team created successfully.');
    } catch (err: any) {
      alert(err.message || 'Failed to create team');
    } finally {
      setSubmittingCreate(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam || !selectedWorkerId) return;
    setSubmittingMember(true);
    try {
      await api.addTeamMember(selectedTeam.teamId, selectedWorkerId);
      setSelectedTeam(null);
      setSelectedWorkerId('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to add member');
    } finally {
      setSubmittingMember(false);
    }
  };

  const handleRemoveMember = async (teamId: string, workerId: string) => {
    if (confirm('Remove worker from this team?')) {
      try {
        await api.removeTeamMember(teamId, workerId);
        loadData();
      } catch (err: any) {
        alert(err.message || 'Failed to remove member');
      }
    }
  };

  if (loading) return <LoadingSpinner message="Loading team directories..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Teams & Crew Units</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage operational units, designated team leaders, and field worker rosters
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Create Team
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {teams.map((team) => (
          <div
            key={team.teamId}
            className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col"
          >
            <div className="p-5 border-b border-slate-100 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xs font-mono font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                    {team.teamId}
                  </span>
                  <StatusBadge status={team.status} size="sm" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">{team.name}</h3>
                <p className="text-2xs text-slate-500 mt-1">{team.description}</p>
              </div>

              <button
                onClick={() => setSelectedTeam(team)}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Add Worker
              </button>
            </div>

            <div className="p-5 flex-1 bg-slate-50/50 space-y-4">
              <div>
                <span className="text-3xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Supervising Leaders ({team.leaderIds.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {team.leaders && team.leaders.length > 0 ? (
                    team.leaders.map((l) => (
                      <span
                        key={l.leaderId}
                        className="bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-2xs font-semibold text-slate-800"
                      >
                        {l.name} ({l.leaderId})
                      </span>
                    ))
                  ) : (
                    <span className="text-2xs text-slate-400 italic">No leader assigned</span>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-2xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
                  <span>Assigned Members ({team.memberWorkerIds.length})</span>
                  <Users className="w-3.5 h-3.5" />
                </h4>

                {team.workers && team.workers.length > 0 ? (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {team.workers.map((w) => (
                      <div
                        key={w.workerId}
                        className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-200/80 shadow-2xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <img
                            src={w.photoURL || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100'}
                            alt=""
                            className="w-7 h-7 rounded-full object-cover"
                          />
                          <div>
                            <span className="text-xs font-bold text-slate-800 block leading-tight">{w.name}</span>
                            <span className="text-3xs font-mono text-slate-400">{w.workerId}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleRemoveMember(team.teamId, w.workerId)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                    No field workers assigned to this team.
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE TEAM MODAL */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Create New Team">
        <form onSubmit={handleCreateTeam} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Team Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Metro Electrical Unit"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Scope of work, equipment focus, or location responsibility..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Assign Team Leader(s)</label>
            <div className="space-y-1.5 max-h-36 overflow-y-auto border border-slate-200 rounded-lg p-2">
              {leaders.map((l) => (
                <label key={l.leaderId} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedLeaderIds.includes(l.leaderId)}
                    onChange={() =>
                      setSelectedLeaderIds((prev) =>
                        prev.includes(l.leaderId) ? prev.filter((id) => id !== l.leaderId) : [...prev, l.leaderId]
                      )
                    }
                    className="accent-blue-600"
                  />
                  <span>
                    {l.name} ({l.leaderId})
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="flex-1 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingCreate}
              className="flex-1 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
            >
              {submittingCreate ? 'Creating...' : 'Create Team'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ADD MEMBER MODAL */}
      <Modal
        isOpen={!!selectedTeam}
        onClose={() => setSelectedTeam(null)}
        title={`Add Member to ${selectedTeam?.name || 'Team'}`}
      >
        <form onSubmit={handleAddMember} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Choose Worker *</label>
            <select
              required
              value={selectedWorkerId}
              onChange={(e) => setSelectedWorkerId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            >
              <option value="">-- Choose from roster --</option>
              {workers
                .filter((w) => !selectedTeam?.memberWorkerIds.includes(w.workerId))
                .map((w) => (
                  <option key={w.workerId} value={w.workerId}>
                    {w.name} ({w.workerId}) - Currently in: {w.primaryTeamName || 'Unassigned'}
                  </option>
                ))}
            </select>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setSelectedTeam(null)}
              className="flex-1 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingMember || !selectedWorkerId}
              className="flex-1 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {submittingMember ? 'Adding...' : 'Add Worker'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
