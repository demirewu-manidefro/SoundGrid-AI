import React from 'react';

interface HeatmapViewProps {
  data?: number[][];
  title?: string;
}

export const HeatmapView: React.FC<HeatmapViewProps> = ({
  data,
  title = 'Acoustic Spectral Heatmap (32 Mel Bands x 20 Time Steps)',
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-48 w-full items-center justify-center rounded-lg border border-industrial-border bg-slate-900/50 text-xs text-slate-500 font-mono">
        No spectral heatmap telemetry available
      </div>
    );
  }

  // Find min and max for normalization
  const flat = data.flat();
  const min = Math.min(...flat);
  const max = Math.max(...flat);
  const range = max - min || 1;

  const getColor = (val: number) => {
    const ratio = Math.max(0, Math.min(1, (val - min) / range));
    if (ratio < 0.25) return 'bg-[#0f172a]'; // Very low (Dark blue)
    if (ratio < 0.5) return 'bg-[#0369a1]';  // Low (Sky/Blue)
    if (ratio < 0.75) return 'bg-[#0284c7]'; // Medium (Cyan)
    if (ratio < 0.9) return 'bg-[#f59e0b]';  // High (Amber)
    return 'bg-[#ef4444]';                   // Peak (Crimson)
  };

  return (
    <div className="rounded-xl border border-industrial-border bg-industrial-panel p-4 shadow-lg">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">
          {title}
        </h4>
        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
          <span>Low</span>
          <div className="flex h-2.5 w-20 overflow-hidden rounded">
            <div className="h-full w-1/4 bg-[#0f172a]" />
            <div className="h-full w-1/4 bg-[#0369a1]" />
            <div className="h-full w-1/4 bg-[#f59e0b]" />
            <div className="h-full w-1/4 bg-[#ef4444]" />
          </div>
          <span>Peak</span>
        </div>
      </div>

      <div className="relative overflow-x-auto">
        <div className="flex">
          {/* Y-axis label */}
          <div className="mr-2 flex flex-col justify-between py-1 text-[9px] font-mono text-slate-500">
            <span>8kHz</span>
            <span>4kHz</span>
            <span>2kHz</span>
            <span>60Hz</span>
          </div>

          {/* Matrix Grid */}
          <div className="grid flex-1 gap-[1px] bg-slate-900/80 p-1 rounded" style={{ gridTemplateRows: `repeat(${data.length}, minmax(4px, 1fr))` }}>
            {data.slice().reverse().map((row, rIdx) => (
              <div key={rIdx} className="flex gap-[1px] h-2">
                {row.map((val, cIdx) => (
                  <div
                    key={cIdx}
                    className={`flex-1 transition-colors duration-150 hover:opacity-80 rounded-[1px] ${getColor(val)}`}
                    title={`Band: ${data.length - rIdx}, Time: ${cIdx}, Energy: ${val} dB`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* X-axis label */}
        <div className="mt-1 flex justify-between pl-8 text-[9px] font-mono text-slate-500">
          <span>0.0s</span>
          <span>1.0s</span>
          <span>2.0s</span>
          <span>3.0s</span>
        </div>
      </div>
    </div>
  );
};
