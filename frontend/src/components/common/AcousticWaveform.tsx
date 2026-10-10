import React, { useEffect, useRef } from 'react';

interface AcousticWaveformProps {
  isAnomaly?: boolean;
  isActive?: boolean;
  height?: number;
}

export const AcousticWaveform: React.FC<AcousticWaveformProps> = ({
  isAnomaly = false,
  isActive = true,
  height = 48,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const render = () => {
      phase += 0.05;
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      const numBars = 36;
      const barWidth = Math.floor(w / numBars) - 2;

      for (let i = 0; i < numBars; i++) {
        const x = i * (barWidth + 2);

        // Calculate synthetic harmonic amplitude
        let norm = Math.sin(phase + i * 0.3) * 0.5 + 0.5;
        if (isAnomaly) {
          // Sharp spikes for anomaly harmonics
          norm = Math.min(1, norm * 1.4 + (i % 5 === 0 ? 0.3 : 0));
        }

        const barHeight = Math.max(4, norm * (h - 8));
        const y = h - barHeight;

        // Gradient styling
        const gradient = ctx.createLinearGradient(0, y, 0, h);
        if (isAnomaly) {
          gradient.addColorStop(0, '#f43f5e'); // Rose
          gradient.addColorStop(1, 'rgba(244, 63, 94, 0.2)');
        } else {
          gradient.addColorStop(0, '#3ECF8E'); // Cyan
          gradient.addColorStop(1, 'rgba(62,207,142, 0.2)'); // Violet
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, [2, 2, 0, 0]);
        ctx.fill();
      }

      if (isActive) {
        animId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isAnomaly, isActive]);

  return (
    <div className="relative w-full overflow-hidden rounded-lg bg-slate-950/60 p-2 border border-white/5">
      <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 mb-1">
        <span className="flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${isAnomaly ? 'bg-rose-500 animate-ping' : 'bg-[#3ECF8E]'}`} />
          {isAnomaly ? 'ANOMALY HARMONICS DETECTED' : 'Acoustic Baseline (16 kHz Telemetry)'}
        </span>
        <span>0Hz — 8000Hz</span>
      </div>
      <canvas
        ref={canvasRef}
        width={360}
        height={height}
        className="w-full h-12 block"
      />
    </div>
  );
};
