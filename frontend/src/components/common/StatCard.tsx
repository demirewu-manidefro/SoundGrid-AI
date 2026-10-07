import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon: React.ReactNode;
  accentColor?: 'accent' | 'primary' | 'healthy' | 'warning' | 'critical';
  trend?: {
    value: string;
    isUpward: boolean;
    isGood: boolean;
  };
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subValue,
  icon,
  accentColor = 'accent',
  trend,
}) => {
  const borderAccents: Record<string, string> = {
    accent: 'hover:border-sky-500/50',
    primary: 'hover:border-indigo-500/50',
    healthy: 'hover:border-emerald-500/50',
    warning: 'hover:border-amber-500/50',
    critical: 'hover:border-rose-500/50',
  };

  const iconColors: Record<string, string> = {
    accent: 'text-sky-400 bg-sky-950/40 border-sky-800/50',
    primary: 'text-indigo-400 bg-indigo-950/40 border-indigo-800/50',
    healthy: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/50',
    warning: 'text-amber-400 bg-amber-950/40 border-amber-800/50',
    critical: 'text-rose-400 bg-rose-950/40 border-rose-800/50',
  };

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-industrial-border bg-industrial-panel p-5 transition-all duration-200 ${borderAccents[accentColor]} shadow-lg`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{label}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold tracking-tight text-white">{value}</span>
            {subValue && <span className="text-xs font-mono text-slate-400">{subValue}</span>}
          </div>
          {trend && (
            <div className="mt-2 flex items-center gap-1.5 text-xs">
              <span
                className={`font-mono font-medium ${
                  trend.isGood ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {trend.isUpward ? '↑' : '↓'} {trend.value}
              </span>
              <span className="text-slate-500">vs last 24h</span>
            </div>
          )}
        </div>
        <div className={`rounded-lg border p-3 ${iconColors[accentColor]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};
