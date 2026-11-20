import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Worker, TeamLeader, Team, WorkLocation, Assignment, Attendance, ActivityLog } from '../../types';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import {
  Users,
  UserCheck,
  Building2,
  MapPin,
  Briefcase,
  CalendarCheck,
  TrendingUp,
  Clock,
  ArrowRight,
  Plus,
  Shield,
  Activity,
} from 'lucide-react';

export const AdminOverview: React.FC = () => {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [leaders, setLeaders] = useState<TeamLeader[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [locations, setLocations] = useState<WorkLocation[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    Promise.all([
      api.getWorkers(),
      api.getLeaders(),
      api.getTeams(),
      api.getLocations(),
      api.getAssignments(),
      api.getAttendance({ date: today }),
      api.getActivityLogs(),
    ]).then(([wList, lList, tList, locList, aList, attList, logList]) => {
      setWorkers(wList);
      setLeaders(lList);
      setTeams(tList);
      setLocations(locList);
      setAssignments(aList);
      setAttendance(attList);
      setActivityLogs(logList);
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingSpinner message="Calculating organization statistics..." />;

  const activeWorkers = workers.filter((w) => w.status === 'ACTIVE').length;
  const presentToday = attendance.filter((a) => a.status === 'PRESENT').length;
  const absentToday = attendance.filter((a) => a.status === 'ABSENT').length;
  const pendingAttendance = Math.max(0, activeWorkers - attendance.length);
  const activeAssignments = assignments.filter((a) => a.status !== 'COMPLETED' && a.status !== 'CANCELLED').length;
  const completedAssignments = assignments.filter((a) => a.status === 'COMPLETED').length;

  return (
    <div className="space-y-6">
      {/* HEADER & TOP QUICK ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Organization Overview</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time workforce health, active assignments, and today's GPS attendance
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/workers"
            className="px-3.5 py-2 bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-blue-600" />
            Add Worker
          </Link>
          <Link
            to="/admin/assignments"
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
          >
            <Briefcase className="w-4 h-4" />
            Create Assignment
          </Link>
        </div>
      </div>

      {/* METRIC TILES GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">Total Workforce</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-slate-900">{workers.length}</span>
            <span className="text-2xs text-emerald-600 font-semibold">({activeWorkers} active)</span>
          </div>
          <span className="text-2xs text-slate-500 block mt-1">Across all sites</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">Leaders & Teams</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{leaders.length}</span>
            <span className="text-xs text-slate-500">leaders · {teams.length} teams</span>
          </div>
          <span className="text-2xs text-slate-500 block mt-1">Operational structure</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">Today's Present</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-emerald-600">{presentToday}</span>
            <span className="text-2xs text-slate-400">/ {activeWorkers} workers</span>
          </div>
          <span className="text-2xs text-slate-500 block mt-1">
            {pendingAttendance} pending check-in
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">Work Duties</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-slate-900">{activeAssignments}</span>
            <span className="text-2xs text-slate-500">active ({completedAssignments} completed)</span>
          </div>
          <span className="text-2xs text-slate-500 block mt-1">{locations.length} work sites</span>
        </div>
      </div>

      {/* TODAY'S ATTENDANCE BREAKDOWN & QUICK SUMMARY */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Today's Workforce Attendance Status</h3>
          </div>
          <Link
            to="/admin/attendance"
            className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
          >
            <span>View Full Master Sheet</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200">
            <span className="text-2xs font-bold text-emerald-800 uppercase tracking-wider block">
              Present on Site
            </span>
            <span className="text-xl font-bold text-emerald-700">{presentToday} Workers</span>
            <span className="text-3xs text-emerald-600 block mt-0.5">
              Verified via Geofence GPS or Leader Override
            </span>
          </div>

          <div className="p-3 bg-rose-50/70 rounded-xl border border-rose-200">
            <span className="text-2xs font-bold text-rose-800 uppercase tracking-wider block">
              Marked Absent
            </span>
            <span className="text-xl font-bold text-rose-700">{absentToday} Workers</span>
            <span className="text-3xs text-rose-600 block mt-0.5">
              Unaccounted absence recorded for today
            </span>
          </div>

          <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200">
            <span className="text-2xs font-bold text-amber-800 uppercase tracking-wider block">
              Pending Check-In
            </span>
            <span className="text-xl font-bold text-amber-700">{pendingAttendance} Workers</span>
            <span className="text-3xs text-amber-600 block mt-0.5">
              Assigned to duty, awaiting arrival confirmation
            </span>
          </div>
        </div>
      </div>

      {/* TWO COLUMN SECTION: RECENT ASSIGNMENTS & ACTIVITY LOGS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* RECENT ASSIGNMENTS */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-blue-600" />
              Recent Work Assignments
            </h3>
            <Link to="/admin/assignments" className="text-xs font-semibold text-blue-600 hover:underline">
              View All
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {assignments.slice(0, 5).map((asn) => (
              <div key={asn.assignmentId} className="p-3.5 hover:bg-slate-50/60 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-3xs font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                      {asn.assignmentId}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 mt-1">{asn.title}</h4>
                    <p className="text-2xs text-slate-500 mt-0.5">{asn.locationName}</p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={asn.status} size="sm" />
                    <span className="text-3xs text-slate-400 block mt-1">{asn.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RECENT ACTIVITY LOGS */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600" />
              Recent Organizational Audit Stream
            </h3>
            <Link to="/admin/activity-logs" className="text-xs font-semibold text-blue-600 hover:underline">
              Full Log
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {activityLogs.slice(0, 5).map((log) => (
              <div key={log.logId} className="p-3.5 hover:bg-slate-50/60 transition-colors text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-slate-800">{log.action.replace(/_/g, ' ')}</span>
                  <span className="text-3xs text-slate-400 font-mono">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-2xs text-slate-500">
                  By <strong className="text-slate-700">{log.actorName}</strong> ({log.actorRole}) · Target: {log.entityType} ({log.entityId})
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
