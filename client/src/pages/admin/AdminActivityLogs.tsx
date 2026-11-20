import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { ActivityLog } from '../../types';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { History, Shield, Clock, FileText } from 'lucide-react';

export const AdminActivityLogs: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getActivityLogs().then((data) => {
      setLogs(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingSpinner message="Reading organizational activity audit log..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Organizational Audit Logs</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Immutable event log of administrative actions, roster changes, assignments, and corrections
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 uppercase text-3xs font-semibold border-b border-slate-100">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Actor & Role</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Target Entity</th>
                <th className="px-4 py-3">Event Details / Diff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-2xs">
              {logs.map((log) => (
                <tr key={log.logId} className="hover:bg-slate-50/60 font-sans">
                  <td className="px-4 py-3 text-slate-500 font-mono text-3xs whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>

                  <td className="px-4 py-3">
                    <span className="font-bold text-slate-900 block">{log.actorName}</span>
                    <span className="text-3xs text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-mono font-bold">
                      {log.actorRole}
                    </span>
                  </td>

                  <td className="px-4 py-3 font-semibold text-slate-800">
                    {log.action.replace(/_/g, ' ')}
                  </td>

                  <td className="px-4 py-3">
                    <span className="font-bold text-slate-700">{log.entityType}</span>
                    <span className="text-3xs text-slate-400 block font-mono">ID: {log.entityId}</span>
                  </td>

                  <td className="px-4 py-3 text-slate-600 max-w-xs truncate text-3xs font-mono">
                    {log.changes ? JSON.stringify(log.changes) : '--'}
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
