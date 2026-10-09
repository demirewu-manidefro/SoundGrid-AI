import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const norm = status?.toUpperCase() || 'UNKNOWN';

  let styles = 'bg-slate-800/80 text-slate-300 border-slate-700/80';
  let dotColor = 'bg-slate-400';
  let isPulsing = false;

  if (norm === 'OPERATIONAL' || norm === 'HEALTHY' || norm === 'RESOLVED') {
    styles = 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30 shadow-[0_0_12px_-3px_rgba(16,185,129,0.3)]';
    dotColor = 'bg-emerald-400';
  } else if (norm === 'WARNING' || norm === 'IN_PROGRESS' || norm === 'HIGH') {
    styles = 'bg-amber-950/60 text-amber-300 border-amber-500/30 shadow-[0_0_12px_-3px_rgba(245,158,11,0.3)]';
    dotColor = 'bg-amber-400';
  } else if (norm === 'CRITICAL' || norm === 'ANOMALY' || norm === 'OPEN') {
    styles = 'bg-rose-950/70 text-rose-300 border-rose-500/40 shadow-[0_0_16px_-2px_rgba(244,63,94,0.4)]';
    dotColor = 'bg-rose-400';
    isPulsing = true;
  }

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs font-semibold';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border uppercase tracking-wider font-mono backdrop-blur-md transition-all ${sizeClasses} ${styles}`}
    >
      <span className="relative flex h-2 w-2">
        {isPulsing && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${dotColor} opacity-75`} />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`} />
      </span>
      {status}
    </span>
  );
};
