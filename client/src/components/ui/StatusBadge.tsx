import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const s = (status || '').toUpperCase();

  let styles = 'bg-slate-100 text-slate-700 border-slate-200';
  let dotColor = 'bg-slate-400';
  let label = status;

  switch (s) {
    case 'PRESENT':
      styles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      dotColor = 'bg-emerald-500';
      label = 'Present';
      break;
    case 'ABSENT':
      styles = 'bg-rose-50 text-rose-700 border-rose-200';
      dotColor = 'bg-rose-500';
      label = 'Absent';
      break;
    case 'LATE':
      styles = 'bg-amber-50 text-amber-700 border-amber-200';
      dotColor = 'bg-amber-500';
      label = 'Late';
      break;
    case 'HALF_DAY':
      styles = 'bg-orange-50 text-orange-700 border-orange-200';
      dotColor = 'bg-orange-500';
      label = 'Half Day';
      break;
    case 'APPROVED_LEAVE':
      styles = 'bg-purple-50 text-purple-700 border-purple-200';
      dotColor = 'bg-purple-500';
      label = 'Approved Leave';
      break;
    case 'VERIFIED':
      styles = 'bg-blue-50 text-blue-700 border-blue-200';
      dotColor = 'bg-blue-500';
      label = 'GPS Verified';
      break;
    case 'FLAGGED':
      styles = 'bg-amber-50 text-amber-800 border-amber-300';
      dotColor = 'bg-amber-500';
      label = 'Location Flagged';
      break;
    case 'MANUAL_OVERRIDE':
      styles = 'bg-indigo-50 text-indigo-700 border-indigo-200';
      dotColor = 'bg-indigo-500';
      label = 'Leader Override';
      break;
    case 'ASSIGNED':
      styles = 'bg-blue-50 text-blue-700 border-blue-200';
      dotColor = 'bg-blue-500';
      label = 'Assigned';
      break;
    case 'ACCEPTED':
      styles = 'bg-cyan-50 text-cyan-700 border-cyan-200';
      dotColor = 'bg-cyan-500';
      label = 'Accepted';
      break;
    case 'IN_PROGRESS':
      styles = 'bg-amber-50 text-amber-700 border-amber-200';
      dotColor = 'bg-amber-500';
      label = 'In Progress';
      break;
    case 'COMPLETED':
      styles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      dotColor = 'bg-emerald-500';
      label = 'Completed';
      break;
    case 'CANCELLED':
      styles = 'bg-slate-100 text-slate-500 border-slate-200';
      dotColor = 'bg-slate-400';
      label = 'Cancelled';
      break;
    case 'ACTIVE':
      styles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      dotColor = 'bg-emerald-500';
      label = 'Active';
      break;
    case 'INACTIVE':
      styles = 'bg-slate-100 text-slate-600 border-slate-200';
      dotColor = 'bg-slate-400';
      label = 'Inactive';
      break;
    case 'HIGH':
    case 'CRITICAL':
      styles = 'bg-rose-50 text-rose-700 border-rose-200';
      dotColor = 'bg-rose-500';
      label = s;
      break;
    case 'MEDIUM':
      styles = 'bg-amber-50 text-amber-700 border-amber-200';
      dotColor = 'bg-amber-500';
      label = 'Medium';
      break;
    case 'LOW':
      styles = 'bg-slate-100 text-slate-700 border-slate-200';
      dotColor = 'bg-slate-400';
      label = 'Low';
      break;
    default:
      break;
  }

  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs font-medium px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${styles} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <span>{label}</span>
    </span>
  );
};
