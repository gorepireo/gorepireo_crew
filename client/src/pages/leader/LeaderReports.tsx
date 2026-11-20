import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { BarChart3, Download, Users, Clock, CalendarCheck, CheckCircle2 } from 'lucide-react';

export const LeaderReports: React.FC = () => {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAttendanceReport().then((data) => {
      setReport(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingSpinner message="Calculating team metrics..." />;

  const summary = report?.summary || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Leader Performance Reports</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Attendance analytics, hours worked, and completion rates across your managed teams
          </p>
        </div>

        <a
          href={api.getExportCsvUrl()}
          download
          className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5"
        >
          <Download className="w-4 h-4 text-blue-600" />
          Export Team CSV Report
        </a>
      </div>

      {/* METRIC TILES */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-2xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Attendance Rate
          </span>
          <span className="text-2xl font-bold text-blue-600">{summary.attendanceRate || 0}%</span>
          <span className="text-2xs text-slate-500 block mt-1">Verified on site</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-2xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Total Working Hours
          </span>
          <span className="text-2xl font-bold text-slate-900">{summary.totalWorkingHours || '0'} hrs</span>
          <span className="text-2xs text-slate-500 block mt-1">Logged shifts</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-2xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Avg Daily Hours / Worker
          </span>
          <span className="text-2xl font-bold text-emerald-600">{summary.averageHoursPerDay || '0'} hrs</span>
          <span className="text-2xs text-slate-500 block mt-1">Productive time</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-2xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Late Arrivals
          </span>
          <span className="text-2xl font-bold text-amber-600">{summary.late || 0}</span>
          <span className="text-2xs text-slate-500 block mt-1">Beyond grace period</span>
        </div>
      </div>

      {/* TEAM BREAKDOWN: RESPONSIVE CARDS FOR MOBILE & TABLE FOR TABLETS */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Managed Teams Performance Breakdown</h3>
          <span className="text-3xs text-slate-500 font-mono">Live Roster Sync</span>
        </div>

        {/* MOBILE CARDS VIEW */}
        <div className="p-3 space-y-2.5 block sm:hidden">
          {report?.teamBreakdown?.map((tb: any) => (
            <div
              key={tb.teamId}
              className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">{tb.teamName}</span>
                <span className="text-xs font-black text-indigo-600">{tb.rate}%</span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all"
                  style={{ width: `${tb.rate}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-3xs text-slate-500 pt-1">
                <span>Total Shifts: <strong className="text-slate-800">{tb.total}</strong></span>
                <span className="text-emerald-600 font-bold">Present: {tb.present}</span>
                <span className="text-rose-600">Absent: {tb.absent}</span>
              </div>
            </div>
          ))}
        </div>

        {/* TABLE VIEW FOR LARGER SCREENS */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 uppercase text-3xs font-semibold border-b border-slate-100">
              <tr>
                <th className="px-4 py-3">Team Name</th>
                <th className="px-4 py-3">Total Shifts</th>
                <th className="px-4 py-3">Present</th>
                <th className="px-4 py-3">Absent</th>
                <th className="px-4 py-3">Compliance Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {report?.teamBreakdown?.map((tb: any) => (
                <tr key={tb.teamId} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-bold text-slate-900">{tb.teamName}</td>
                  <td className="px-4 py-3 text-slate-700">{tb.total}</td>
                  <td className="px-4 py-3 text-emerald-600 font-bold">{tb.present}</td>
                  <td className="px-4 py-3 text-rose-600">{tb.absent}</td>
                  <td className="px-4 py-3 font-bold text-slate-900">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full"
                          style={{ width: `${tb.rate}%` }}
                        />
                      </div>
                      <span>{tb.rate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
