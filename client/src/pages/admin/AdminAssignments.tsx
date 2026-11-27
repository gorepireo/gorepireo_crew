import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Assignment, Team, Worker, WorkLocation } from '../../types';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import {
  Briefcase,
  Plus,
  MapPin,
  Clock,
  Calendar,
  Users,
  Search,
  Filter,
  CheckCircle2,
} from 'lucide-react';

export const AdminAssignments: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [locations, setLocations] = useState<WorkLocation[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  // Create Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [locationId, setLocationId] = useState('');
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('17:00');
  const [submitting, setSubmitting] = useState(false);

  // Detail & Edit Modals
  const [viewingAssignment, setViewingAssignment] = useState<Assignment | null>(null);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [editLocationId, setEditLocationId] = useState('');
  const [editTeamIds, setEditTeamIds] = useState<string[]>([]);
  const [editDate, setEditDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editPriority, setEditPriority] = useState<Assignment['priority']>('MEDIUM');
  const [editStatus, setEditStatus] = useState<Assignment['status']>('ASSIGNED');
  const [submittingEdit, setSubmittingEdit] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [aList, tList, wList, lList] = await Promise.all([
        api.getAssignments({ status: statusFilter || undefined }),
        api.getTeams(),
        api.getWorkers(),
        api.getLocations(),
      ]);
      setAssignments(aList);
      setTeams(tList);
      setWorkers(wList);
      setLocations(lList);
      if (lList.length > 0 && !locationId) setLocationId(lList[0].locationId);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedLoc = locations.find((l) => l.locationId === locationId);
    if (!locationId || !selectedLoc || !selectedTeamIds.length) {
      alert('Please select a work location and at least one team.');
      return;
    }
    if (endDate < date) {
      alert('End date cannot be before start date.');
      return;
    }
    if (endDate === date && startTime >= endTime) {
      alert('End time must be after start time.');
      return;
    }
    setSubmitting(true);
    try {
      await api.createAssignment({
        title: selectedLoc.name,
        description: '',
        locationId,
        teamIds: selectedTeamIds,
        workerIds: [],
        date,
        endDate,
        startTime,
        endTime,
        priority: 'MEDIUM',
      });
      setCreateModalOpen(false);
      setSelectedTeamIds([]);
      loadData();
      alert('Work assignment dispatched to crew members.');
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch work');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (asn: Assignment) => {
    setEditingAssignment(asn);
    setEditLocationId(asn.locationId);
    setEditTeamIds(asn.teamIds || []);
    setEditDate(asn.date);
    setEditEndDate(asn.endDate || asn.date);
    setEditStartTime(asn.startTime);
    setEditEndTime(asn.endTime);
    setEditPriority(asn.priority);
    setEditStatus(asn.status);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAssignment) return;
    const selectedLoc = locations.find((l) => l.locationId === editLocationId);
    if (!editLocationId || !selectedLoc || !editTeamIds.length) {
      alert('Please select a work location and at least one team.');
      return;
    }
    if (editEndDate < editDate) {
      alert('End date cannot be before start date.');
      return;
    }
    if (editEndDate === editDate && editStartTime >= editEndTime) {
      alert('End time must be after start time.');
      return;
    }
    setSubmittingEdit(true);
    try {
      await api.updateAssignment(editingAssignment.assignmentId, {
        title: selectedLoc.name,
        locationId: editLocationId,
        teamIds: editTeamIds,
        date: editDate,
        endDate: editEndDate,
        startTime: editStartTime,
        endTime: editEndTime,
        priority: editPriority,
        status: editStatus,
      });
      setEditingAssignment(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update assignment');
    } finally {
      setSubmittingEdit(false);
    }
  };

  const filtered = assignments.filter((a) => {
    if (search) {
      const q = search.toLowerCase();
      return (
        a.title.toLowerCase().includes(q) ||
        a.assignmentId.toLowerCase().includes(q) ||
        (a.locationName && a.locationName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  if (loading) return <LoadingSpinner message="Loading work assignments..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Work Assignments</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Centralized dispatch, job progress tracking, and site safety instructions
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Create Assignment
        </button>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search assignments by title or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-700 bg-white"
        >
          <option value="">All Statuses</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="ACCEPTED">Accepted</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Done</option>
          <option value="NOT_DONE">Not Done</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* ASSIGNMENTS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 uppercase text-3xs font-semibold border-b border-slate-100">
              <tr>
                <th className="px-4 py-3">Job ID & Title</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Schedule</th>
                <th className="px-4 py-3">Target Crew</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((asn) => (
                <tr key={asn.assignmentId} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3">
                    <span className="text-3xs font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                      {asn.assignmentId}
                    </span>
                    <div className="font-bold text-slate-900 mt-1">{asn.title}</div>
                    <span className="text-3xs text-slate-400">By {asn.assignedByName || 'Admin'}</span>
                  </td>

                  <td className="px-4 py-3 text-slate-700">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="truncate max-w-[180px]">{asn.locationName}</span>
                    </div>
                  </td>

                  <td className="px-4 py-3 font-mono text-slate-700 text-2xs">
                    <div>
                      {asn.endDate && asn.endDate !== asn.date ? `${asn.date} → ${asn.endDate}` : asn.date}
                    </div>
                    <div className="text-slate-400">
                      {asn.startTime} - {asn.endTime}
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <span className="font-semibold text-slate-800">
                      {asn.workerIds.length} Workers
                    </span>
                    {asn.teamIds.length > 0 && (
                      <span className="text-3xs text-slate-500 block">
                        ({asn.teamIds.length} Teams)
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <StatusBadge status={asn.priority} size="sm" />
                  </td>

                  <td className="px-4 py-3">
                    <StatusBadge status={asn.status} size="sm" />
                  </td>

                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openEditModal(asn)}
                        className="px-2.5 py-1 text-2xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setViewingAssignment(asn)}
                        className="px-2.5 py-1 text-2xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                      >
                        View Order
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE ASSIGNMENT MODAL (Compact: Location, Date/Time & Team) */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Create Work Assignment" maxWidth="md">
        <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Work Location *</label>
            <select
              required
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            >
              {locations.length === 0 ? (
                <option value="">No work locations found — add one in Locations first</option>
              ) : (
                <>
                  <option value="" disabled>
                    Select a work location...
                  </option>
                  {locations.map((loc) => (
                    <option key={loc.locationId} value={loc.locationId} className="text-slate-900 bg-white">
                      {loc.name}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Start Date *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => {
                  const next = e.target.value;
                  if (endDate === date || endDate < next) setEndDate(next);
                  setDate(next);
                }}
                className="w-full px-2.5 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Start Time *</label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-2.5 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">End Date *</label>
              <input
                type="date"
                required
                min={date}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-2.5 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">End Time *</label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-2.5 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Assign to Teams *</label>
            <div className="space-y-1 max-h-28 overflow-y-auto border border-slate-200 rounded-lg p-2">
              {teams.length === 0 ? (
                <p className="text-3xs text-slate-400">No teams available.</p>
              ) : (
                teams.map((t) => (
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
                      {t.name} ({t.memberWorkerIds.length} workers)
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="flex-1 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
            >
              {submitting ? 'Publishing...' : 'Publish Assignment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* DETAIL MODAL */}
      <Modal isOpen={!!viewingAssignment} onClose={() => setViewingAssignment(null)} title="Assignment Order Summary">
        {viewingAssignment && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="font-mono text-2xs font-bold text-slate-500">{viewingAssignment.assignmentId}</span>
              <StatusBadge status={viewingAssignment.status} />
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-900">{viewingAssignment.title}</h4>
              <p className="text-slate-600 mt-1">{viewingAssignment.description}</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-2xs">
              <p>
                <strong>Location:</strong> {viewingAssignment.locationName}
              </p>
              <p>
                <strong>Schedule:</strong> {viewingAssignment.date} ({viewingAssignment.startTime}) → {viewingAssignment.endDate || viewingAssignment.date} ({viewingAssignment.endTime})
              </p>
              <p>
                <strong>Total Assigned Workers:</strong> {viewingAssignment.workerIds.length}
              </p>
            </div>

            {viewingAssignment.instructions && (
              <div className="p-3 bg-amber-50 text-amber-900 rounded-xl border border-amber-200 text-2xs">
                <strong>Site Instructions:</strong> {viewingAssignment.instructions}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* EDIT ASSIGNMENT MODAL */}
      <Modal
        isOpen={!!editingAssignment}
        onClose={() => setEditingAssignment(null)}
        title={editingAssignment ? `Edit Assignment (${editingAssignment.assignmentId})` : 'Edit Assignment'}
        maxWidth="md"
      >
        <form onSubmit={handleUpdate} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Work Location *</label>
            <select
              required
              value={editLocationId}
              onChange={(e) => setEditLocationId(e.target.value)}
              className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            >
              {locations.map((loc) => (
                <option key={loc.locationId} value={loc.locationId} className="text-slate-900 bg-white">
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Start Date *</label>
              <input
                type="date"
                required
                value={editDate}
                onChange={(e) => {
                  const next = e.target.value;
                  if (editEndDate === editDate || editEndDate < next) setEditEndDate(next);
                  setEditDate(next);
                }}
                className="w-full px-2.5 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Start Time *</label>
              <input
                type="time"
                required
                value={editStartTime}
                onChange={(e) => setEditStartTime(e.target.value)}
                className="w-full px-2.5 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">End Date *</label>
              <input
                type="date"
                required
                min={editDate}
                value={editEndDate}
                onChange={(e) => setEditEndDate(e.target.value)}
                className="w-full px-2.5 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">End Time *</label>
              <input
                type="time"
                required
                value={editEndTime}
                onChange={(e) => setEditEndTime(e.target.value)}
                className="w-full px-2.5 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Priority</label>
              <select
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value as Assignment['priority'])}
                className="w-full px-2.5 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as Assignment['status'])}
                className="w-full px-2.5 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              >
                <option value="ASSIGNED">Assigned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Done</option>
                <option value="NOT_DONE">Not Done</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Assign to Teams *</label>
            <div className="space-y-1 max-h-28 overflow-y-auto border border-slate-200 rounded-lg p-2">
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
                    {t.name} ({t.memberWorkerIds.length} workers)
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setEditingAssignment(null)}
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
    </div>
  );
};
