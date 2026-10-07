import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const norm = status?.toUpperCase() || 'UNKNOWN';

  let styles = 'bg-slate-800 text-slate-300 border-slate-700';
  let dotColor = 'bg-slate-400';

  if (norm === 'OPERATIONAL' || norm === 'HEALTHY' || norm === 'RESOLVED') {
    styles = 'bg-emerald-950/70 text-emerald-300 border-emerald-800/80 shadow-sm shadow-emerald-950';
    dotColor = 'bg-emerald-400';
  } else if (norm === 'WARNING' || norm === 'IN_PROGRESS' || norm === 'HIGH') {
    styles = 'bg-amber-950/70 text-amber-300 border-amber-800/80 shadow-sm shadow-amber-950';
    dotColor = 'bg-amber-400';
  } else if (norm === 'CRITICAL' || norm === 'ANOMALY' || norm === 'OPEN') {
    styles = 'bg-rose-950/70 text-rose-300 border-rose-800/80 shadow-sm shadow-rose-950 animate-pulse';
    dotColor = 'bg-rose-400';
  }

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border uppercase tracking-wider font-mono ${sizeClasses} ${styles}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
      {status}
    </span>
  );
};
