import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { Team, Worker, WorkLocation } from '../../types';
import {
  Briefcase,
  MapPin,
  Calendar,
  Clock,
  Users,
  User,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  Send,
} from 'lucide-react';

export const LeaderAssignWork: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [teams, setTeams] = useState<Team[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [locations, setLocations] = useState<WorkLocation[]>([]);
  const [loading, setLoading] = useState(true);

  // Common quick-select job types for easy 1-tap selection
  const commonWorkTypes = [
    'Pier Reinforcement Rebar',
    'Column & Beam Shuttering',
    'Cable Tray & Grounding',
    'Site Cleaning & Housekeeping',
    'Pre-Pour Concrete Inspection',
  ];

  // Form State with sensible defaults
  const [title, setTitle] = useState('Pier Reinforcement Rebar');
  const [description, setDescription] = useState('Complete reinforcement binding and verify alignment with site supervisor.');
  const [workerMode, setWorkerMode] = useState<'TEAM' | 'INDIVIDUAL'>('TEAM');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [selectedWorkerIds, setSelectedWorkerIds] = useState<string[]>([]);
  const [locationId, setLocationId] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState('08:00 AM');
  const [endTime, setEndTime] = useState('05:00 PM');

  // Submit State
  const [submitting, setSubmitting] = useState(false);
  const [assignedId, setAssignedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.getTeams(true), api.getWorkers(), api.getLocations()]).then(
      ([tList, wList, lList]) => {
        setTeams(tList);
        setWorkers(wList);
        setLocations(lList);
        if (tList.length > 0) setSelectedTeamId(tList[0].teamId);
        if (lList.length > 0) setLocationId(lList[0].locationId);
        if (wList.length > 0) setSelectedWorkerIds([wList[0].workerId]);
        setLoading(false);
      }
    );
  }, []);

  const toggleWorker = (id: string) => {
    setSelectedWorkerIds((prev) =>
      prev.includes(id) ? prev.filter((w) => w !== id) : [...prev, id]
    );
  };

  const handleAssignWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please select or enter a work name.');
      return;
    }
    if (!locationId) {
      setError('Please select a work location.');
      return;
    }

    let finalWorkerIds = selectedWorkerIds;
    let finalTeamIds: string[] = [];

    if (workerMode === 'TEAM') {
      if (!selectedTeamId) {
        setError('Please select a team.');
        return;
      }
      finalTeamIds = [selectedTeamId];
      const targetTeam = teams.find((t) => t.teamId === selectedTeamId);
      finalWorkerIds = targetTeam?.memberWorkerIds || [];
    } else {
      if (selectedWorkerIds.length === 0) {
        setError('Please select at least one worker.');
        return;
      }
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await api.createAssignment({
        title: title.trim(),
        description: description.trim() || undefined,
        locationId,
        teamIds: finalTeamIds,
        workerIds: finalWorkerIds,
        date,
        startTime,
        endTime,
        priority: 'HIGH',
      });

      setAssignedId(res.assignmentId);
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch work order.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setAssignedId(null);
    setTitle('Column & Beam Shuttering');
    setDescription('');
    setError(null);
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-slate-500 font-medium">
        Loading assignment options...
      </div>
    );
  }

  const selectedLoc = locations.find((l) => l.locationId === locationId);

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-black text-slate-900 tracking-tight">Assign Work</h1>
          <p className="text-2xs text-slate-500 font-medium">Quick dispatch for your field workers</p>
        </div>
      </div>

      {/* CONFIRMATION / SUCCESS */}
      {assignedId ? (
        <div className="bg-white p-6 rounded-3xl border border-emerald-200 shadow-sm text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200 shadow-xs">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div>
            <span className="text-3xs font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
              Work Assigned Successfully
            </span>
            <h2 className="text-lg font-black text-slate-900 mt-2">{title}</h2>
            <div className="mt-2 inline-block px-4 py-1.5 bg-slate-900 text-white rounded-xl font-mono text-xs font-black tracking-widest shadow-xs">
              ORDER: {assignedId}
            </div>
            <p className="text-2xs text-emerald-700 font-semibold mt-2">
              ✓ Dispatched immediately to worker dashboards.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl text-xs text-slate-600 space-y-1.5 text-left border border-slate-200">
            <p className="flex justify-between">
              <span className="text-slate-400 font-medium">Worksite:</span>
              <strong className="text-slate-800">{selectedLoc?.name || 'Central Metro Hub'}</strong>
            </p>
            <p className="flex justify-between">
              <span className="text-slate-400 font-medium">Schedule:</span>
              <strong className="text-slate-800">{date} ({startTime} – {endTime})</strong>
            </p>
            <p className="flex justify-between">
              <span className="text-slate-400 font-medium">Assigned To:</span>
              <strong className="text-slate-800">
                {workerMode === 'TEAM'
                  ? teams.find((t) => t.teamId === selectedTeamId)?.name || 'Alpha Site Civil Team'
                  : `${selectedWorkerIds.length} Workers`}
              </strong>
            </p>
          </div>

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={resetForm}
              className="flex-1 min-h-[46px] py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-bold text-xs transition-colors"
            >
              + Another Job
            </button>
            <Link
              to="/leader/dashboard"
              className="flex-1 min-h-[46px] py-2.5 bg-[#1752d5] hover:bg-blue-700 text-white rounded-2xl font-bold text-xs transition-colors flex items-center justify-center shadow-xs"
            >
              Return Home
            </Link>
          </div>
        </div>
      ) : (
        /* SINGLE SIMPLE MOBILE FORM */
        <form onSubmit={handleAssignWork} className="space-y-3.5 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-2xs font-semibold">
              {error}
            </div>
          )}

          {/* 1. SELECT WORK TYPE OR ENTER NAME */}
          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-2xs space-y-2.5">
            <label className="block font-black text-slate-900 text-xs">
              1. Work Type or Job Name <span className="text-rose-500">*</span>
            </label>

            {/* Quick 1-tap chips */}
            <div className="flex flex-wrap gap-1.5 pb-1">
              {commonWorkTypes.map((wt) => (
                <button
                  key={wt}
                  type="button"
                  onClick={() => setTitle(wt)}
                  className={`px-2.5 py-1 rounded-full text-3xs font-extrabold transition-all border ${
                    title === wt
                      ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100'
                  }`}
                >
                  {wt}
                </button>
              ))}
            </div>

            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Pier Reinforcement Rebar"
              className="w-full px-3.5 min-h-[46px] border border-slate-300 rounded-2xl text-xs font-semibold focus:outline-hidden focus:border-blue-600"
            />
          </div>

          {/* 2. SELECT WORKERS OR TEAM */}
          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-2xs space-y-2.5">
            <label className="block font-black text-slate-900 text-xs">
              2. Who Will Work?
            </label>

            {/* Mode switch */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setWorkerMode('TEAM')}
                className={`py-2 px-3 rounded-2xl border font-black text-xs transition-all flex items-center justify-center gap-1.5 ${
                  workerMode === 'TEAM'
                    ? 'bg-[#1752d5] text-white border-[#1752d5] shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Entire Team</span>
              </button>

              <button
                type="button"
                onClick={() => setWorkerMode('INDIVIDUAL')}
                className={`py-2 px-3 rounded-2xl border font-black text-xs transition-all flex items-center justify-center gap-1.5 ${
                  workerMode === 'INDIVIDUAL'
                    ? 'bg-[#1752d5] text-white border-[#1752d5] shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Individual</span>
              </button>
            </div>

            {workerMode === 'TEAM' ? (
              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                className="w-full px-3 min-h-[46px] border border-slate-300 rounded-2xl text-xs font-semibold bg-white"
              >
                {teams.map((t) => (
                  <option key={t.teamId} value={t.teamId}>
                    {t.name} ({t.memberWorkerIds?.length || 0} Workers)
                  </option>
                ))}
              </select>
            ) : (
              <div className="max-h-36 overflow-y-auto space-y-1 p-2 bg-slate-50 rounded-2xl border border-slate-200">
                {workers.map((w) => {
                  const selected = selectedWorkerIds.includes(w.workerId);
                  return (
                    <button
                      key={w.workerId}
                      type="button"
                      onClick={() => toggleWorker(w.workerId)}
                      className={`w-full p-2 rounded-xl text-left text-2xs font-bold flex items-center justify-between border transition-all ${
                        selected
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      <span>{w.name} ({w.workerId})</span>
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-3xs ${
                        selected ? 'bg-blue-600 text-white font-black' : 'border border-slate-300'
                      }`}>
                        {selected ? '✓' : ''}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3. SELECT SAVED LOCATION */}
          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-2xs space-y-2">
            <label className="block font-black text-slate-900 text-xs">
              3. Saved Location
            </label>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="w-full px-3 min-h-[46px] border border-slate-300 rounded-2xl text-xs font-semibold bg-white"
            >
              {locations.map((loc) => (
                <option key={loc.locationId} value={loc.locationId}>
                  {loc.name} — {loc.address}
                </option>
              ))}
            </select>
          </div>

          {/* 4. DATE AND TIME */}
          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-2xs space-y-2">
            <label className="block font-black text-slate-900 text-xs">
              4. Date & Working Time
            </label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <span className="text-4xs font-bold text-slate-500 uppercase block mb-1">Date</span>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-2 py-2 border border-slate-300 rounded-xl text-2xs font-semibold"
                />
              </div>
              <div>
                <span className="text-4xs font-bold text-slate-500 uppercase block mb-1">Start</span>
                <input
                  type="text"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-2 py-2 border border-slate-300 rounded-xl text-2xs font-semibold"
                />
              </div>
              <div>
                <span className="text-4xs font-bold text-slate-500 uppercase block mb-1">End</span>
                <input
                  type="text"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-2 py-2 border border-slate-300 rounded-xl text-2xs font-semibold"
                />
              </div>
            </div>
          </div>

          {/* 5. LARGE TAP TO ASSIGN WORK BUTTON */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full min-h-[52px] py-3.5 bg-[#1752d5] hover:bg-blue-700 active:scale-98 text-white font-black text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>{submitting ? 'Assigning Work...' : 'Assign Work'}</span>
          </button>
        </form>
      )}
    </div>
  );
};
