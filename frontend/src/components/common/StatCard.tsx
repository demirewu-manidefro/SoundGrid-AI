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
  const colorConfigs = {
    accent: {
      border: 'hover:border-[#3ECF8E]/50',
      iconBox: 'text-[#3ECF8E] bg-[#2A2A2A]/40 border-[#3ECF8E]/30 shadow-[0_0_15px_-3px_rgba(62,207,142,0.3)]',
      glow: 'from-[#3ECF8E]/10 via-transparent to-transparent',
      valueColor: 'text-white',
    },
    primary: {
      border: 'hover:border-[#3ECF8E]/50',
      iconBox: 'text-[#3ECF8E] bg-[#3ECF8E]/10 border-[#3ECF8E]/30 shadow-[0_0_15px_-3px_rgba(62,207,142,0.3)]',
      glow: 'from-[#3ECF8E]/10 via-transparent to-transparent',
      valueColor: 'text-white',
    },
    healthy: {
      border: 'hover:border-emerald-400/50',
      iconBox: 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30 shadow-[0_0_15px_-3px_rgba(62,207,142,0.3)]',
      glow: 'from-emerald-500/10 via-transparent to-transparent',
      valueColor: 'text-emerald-300',
    },
    warning: {
      border: 'hover:border-amber-400/50',
      iconBox: 'text-amber-400 bg-amber-950/40 border-amber-500/30 shadow-[0_0_15px_-3px_rgba(245,158,11,0.3)]',
      glow: 'from-amber-500/10 via-transparent to-transparent',
      valueColor: 'text-amber-300',
    },
    critical: {
      border: 'hover:border-rose-400/50',
      iconBox: 'text-rose-400 bg-rose-950/40 border-rose-500/30 shadow-[0_0_20px_-3px_rgba(244,63,94,0.4)] animate-pulse',
      glow: 'from-rose-500/15 via-transparent to-transparent',
      valueColor: 'text-rose-300',
    },
  };

  const cfg = colorConfigs[accentColor] || colorConfigs.accent;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-[#3E3E3E] bg-[#232323] p-5  transition-all duration-300 ${cfg.border} shadow-xl hover:-translate-y-1 hover:shadow-2xl group`}
    >


      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {label}
          </p>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className={`font-display text-3xl font-extrabold tracking-tight ${cfg.valueColor}`}>
              {value}
            </span>
            {subValue && (
              <span className="font-mono text-xs text-slate-400 font-medium">{subValue}</span>
            )}
          </div>

          {trend && (
            <div className="mt-3 flex items-center gap-2 font-mono text-xs">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  trend.isGood
                    ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                    : 'bg-rose-950/80 text-rose-400 border border-rose-800/60'
                }`}
              >
                {trend.isUpward ? '▲' : '▼'} {trend.value}
              </span>
              <span className="text-[11px] text-slate-500">telemetry window</span>
            </div>
          )}
        </div>

        <div className={`rounded-xl border p-3 transition-transform duration-300 group-hover:scale-110 ${cfg.iconBox}`}>
          {icon}
        </div>
      </div>

      {/* Bottom glowing accent line */}
      <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:via-[#3ECF8E]/50 transition-colors duration-500" />
    </div>
  );
};
