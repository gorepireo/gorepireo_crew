import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Assignment } from '../../types';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import {
  Briefcase,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  ExternalLink,
  Users,
  FileText,
} from 'lucide-react';

export const LeaderMonitoring: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'IN_PROGRESS' | 'COMPLETED'>('ALL');
  const [loading, setLoading] = useState(true);
  const [selectedAsn, setSelectedAsn] = useState<Assignment | null>(null);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const list = await api.getAssignments();
      setAssignments(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssignments();
  }, []);

  const filtered = assignments.filter((a) => {
    if (filter === 'IN_PROGRESS') return a.status === 'IN_PROGRESS' || a.status === 'ACCEPTED';
    if (filter === 'COMPLETED') return a.status === 'COMPLETED';
    return true;
  });

  if (loading) return <LoadingSpinner message="Loading work progress stream..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Work Monitoring & Proofs</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time tracking of work orders, deliverables, and worker completion notes
          </p>
        </div>

        <div className="grid grid-cols-3 bg-white p-1 rounded-xl border border-slate-200 text-xs font-semibold shadow-2xs">
          <button
            onClick={() => setFilter('ALL')}
            className={`py-1.5 px-2 text-center rounded-lg transition-all ${
              filter === 'ALL' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-500'
            }`}
          >
            All ({assignments.length})
          </button>
          <button
            onClick={() => setFilter('IN_PROGRESS')}
            className={`py-1.5 px-2 text-center rounded-lg transition-all ${
              filter === 'IN_PROGRESS' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-500'
            }`}
          >
            Active ({assignments.filter((a) => a.status === 'IN_PROGRESS' || a.status === 'ACCEPTED').length})
          </button>
          <button
            onClick={() => setFilter('COMPLETED')}
            className={`py-1.5 px-2 text-center rounded-lg transition-all ${
              filter === 'COMPLETED' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-500'
            }`}
          >
            Done ({assignments.filter((a) => a.status === 'COMPLETED').length})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((item) => (
          <div
            key={item.assignmentId}
            onClick={() => setSelectedAsn(item)}
            className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 hover:border-indigo-400 cursor-pointer transition-all space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-2xs font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                {item.assignmentId}
              </span>
              <div className="flex items-center gap-1.5">
                <StatusBadge status={item.status} size="sm" />
                <StatusBadge status={item.priority} size="sm" />
              </div>
            </div>

            <h3 className="text-sm font-bold text-slate-900 leading-snug">{item.title}</h3>
            <p className="text-2xs text-slate-600 line-clamp-2">{item.description}</p>

            <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-2xs text-slate-600 border border-slate-100">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="truncate">{item.locationName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>
                  {item.date} · {item.startTime} - {item.endTime}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{item.workerIds.length} Assigned Workers</span>
              </div>
            </div>

            {item.completionNote && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-2xs">
                <span className="font-bold text-emerald-800 block mb-0.5">Completion Note:</span>
                <span className="text-emerald-700 italic">"{item.completionNote}"</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* DETAIL MODAL */}
      <Modal isOpen={!!selectedAsn} onClose={() => setSelectedAsn(null)} title="Assignment Progress Details">
        {selectedAsn && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-mono text-xs text-slate-500 font-bold">{selectedAsn.assignmentId}</span>
              <StatusBadge status={selectedAsn.status} />
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-900">{selectedAsn.title}</h4>
              <p className="text-slate-600 mt-1 leading-relaxed">{selectedAsn.description}</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-2xs">
              <p>
                <strong>Location:</strong> {selectedAsn.locationName} ({selectedAsn.locationAddress})
              </p>
              <p>
                <strong>Schedule:</strong> {selectedAsn.date} · {selectedAsn.startTime} - {selectedAsn.endTime}
              </p>
              <p>
                <strong>Assigned By:</strong> {selectedAsn.assignedByName || 'Leader'}
              </p>
            </div>

            {selectedAsn.instructions && (
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-2xs text-amber-900">
                <strong>Site Instructions:</strong> {selectedAsn.instructions}
              </div>
            )}

            {selectedAsn.completionNote && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-2xs">
                <strong className="text-emerald-900 block">Completion Notes & Sign-off:</strong>
                <p className="text-emerald-800">{selectedAsn.completionNote}</p>
                {selectedAsn.completionEvidenceUrl && (
                  <div className="mt-2 pt-2 border-t border-emerald-200">
                    <span className="font-semibold text-emerald-900 block mb-1">Attached Evidence:</span>
                    <a
                      href={selectedAsn.completionEvidenceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <span>View Uploaded File / Photo</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
