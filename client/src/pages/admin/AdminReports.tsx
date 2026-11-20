import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import {
  BarChart3,
  Download,
  Calendar,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export const AdminReports: React.FC = () => {
  const [report, setReport] = useState<any>(null);
  const [assignmentReport, setAssignmentReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Date range filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [attData, asnData] = await Promise.all([
        api.getAttendanceReport({
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        }),
        api.getAssignmentReport(),
      ]);
      setReport(attData);
      setAssignmentReport(asnData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [startDate, endDate]);

  if (loading) return <LoadingSpinner message="Aggregating organizational reports..." />;

  const summary = report?.summary || {};
  const asnSummary = assignmentReport?.summary || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Reports & Analytics</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Attendance compliance, working-hours aggregation, and assignment completion metrics
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={api.getExportCsvUrl()}
            download
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            Export Complete CSV
          </a>
        </div>
      </div>

      {/* DATE RANGE BAR */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3 text-xs">
        <span className="font-semibold text-slate-700">Filter Range:</span>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          placeholder="Start date"
          className="px-2.5 py-1 border border-slate-200 rounded-lg text-slate-700"
        />
        <span className="text-slate-400">to</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          placeholder="End date"
          className="px-2.5 py-1 border border-slate-200 rounded-lg text-slate-700"
        />
        {(startDate || endDate) && (
          <button
            onClick={() => {
              setStartDate('');
              setEndDate('');
            }}
            className="text-xs text-blue-600 hover:underline font-semibold"
          >
            Reset Dates
          </button>
        )}
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-2xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Attendance Compliance
          </span>
          <span className="text-2xl font-bold text-blue-600">{summary.attendanceRate || 0}%</span>
          <span className="text-2xs text-slate-500 block mt-1">
            {summary.present || 0} present of {summary.totalRecords || 0}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-2xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Total Working Hours
          </span>
          <span className="text-2xl font-bold text-slate-900">{summary.totalWorkingHours || '0'} hrs</span>
          <span className="text-2xs text-slate-500 block mt-1">From verified check-in/outs</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-2xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Job Completion Rate
          </span>
          <span className="text-2xl font-bold text-emerald-600">{asnSummary.completionRate || 0}%</span>
          <span className="text-2xs text-slate-500 block mt-1">
            {asnSummary.completed || 0} of {asnSummary.total || 0} assignments
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-2xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Unexcused Absences
          </span>
          <span className="text-2xl font-bold text-rose-600">{summary.absent || 0}</span>
          <span className="text-2xs text-slate-500 block mt-1">Requiring HR review</span>
        </div>
      </div>

      {/* TEAM PERFORMANCE BREAKDOWN */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Team-by-Team Attendance Performance</h3>
          <span className="text-2xs text-slate-500">Live Database Computation</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 uppercase text-3xs font-semibold border-b border-slate-100">
              <tr>
                <th className="px-4 py-3">Team Name</th>
                <th className="px-4 py-3">Logged Shifts</th>
                <th className="px-4 py-3">Present</th>
                <th className="px-4 py-3">Absent</th>
                <th className="px-4 py-3">Compliance</th>
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
                      <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
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
