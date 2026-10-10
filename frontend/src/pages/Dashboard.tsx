import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { StatCard } from '../components/common/StatCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { AcousticWaveform } from '../components/common/AcousticWaveform';
import {
  Cpu,
  AlertTriangle,
  CheckCircle2,
  Zap,
  ArrowUpRight,
  Activity,
  Radio,
  Clock,
  Sparkles,
  Layers,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { data: machinesRes, isLoading: loadingMachines } = useQuery({
    queryKey: ['machines'],
    queryFn: () => api.machines.list(),
  });

  const { data: diagnosticsRes, isLoading: loadingDiagnostics } = useQuery({
    queryKey: ['diagnostics'],
    queryFn: () => api.diagnostics.list({ limit: 10 }),
  });

  const { data: ticketsRes } = useQuery({
    queryKey: ['tickets'],
    queryFn: () => api.tickets.list(),
  });

  const machines = machinesRes?.data || [];
  const diagnostics = diagnosticsRes?.data || [];
  const tickets = ticketsRes?.data || [];

  const operationalCount = machines.filter((m) => m.status === 'OPERATIONAL').length;
  const warningCount = machines.filter((m) => m.status === 'WARNING').length;
  const criticalCount = machines.filter((m) => m.status === 'CRITICAL').length;
  const healthRate = machines.length > 0 ? Math.round((operationalCount / machines.length) * 100) : 100;
  const openTickets = tickets.filter((t) => t.status !== 'RESOLVED').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-r from-[#232323]/90 via-[#2A2A2A]/80 to-[#232323]/90 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-72 w-72 rounded-full bg-gradient-to-br from-[#3ECF8E]/10 via-[#2E2E2E]/10 to-transparent blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#3ECF8E]/30 bg-[#2A2A2A]/40 px-3 py-1 font-mono text-[11px] font-semibold text-[#3ECF8E] shadow-[0_0_12px_-2px_rgba(62,207,142,0.3)]">
              <span className="h-2 w-2 rounded-full bg-[#3ECF8E] animate-pulse" />
              TorchScript CNN Runtime • Sub-10ms Inference Active
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-extrabold tracking-tight text-white uppercase">
              Industrial Telemetry Control Room
            </h1>
            <p className="max-w-xl text-xs md:text-sm font-sans text-slate-300 leading-relaxed">
              Predictive acoustic anomaly detection for transformers, heavy pumps, induction motors, and industrial ventilation fans.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/diagnostics"
              className="group relative flex items-center gap-2.5 overflow-hidden rounded-xl bg-[#3ECF8E] hover:bg-[#24B47E] text-[#1C1C1C] px-5 py-3 text-xs font-mono font-bold shadow-[0_0_20px_-3px_rgba(62,207,142,0.5)] hover:shadow-[0_0_25px_-2px_rgba(62,207,142,0.6)] transition-all hover:scale-[1.02]"
            >
              <Zap className="h-4 w-4 text-white transition-transform group-hover:rotate-12" />
              <span>Launch Acoustic Diagnostics</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Machinery Fleet"
          value={loadingMachines ? '...' : machines.length}
          subValue="assets active"
          icon={<Cpu className="h-5 w-5" />}
          accentColor="accent"
        />
        <StatCard
          label="Fleet Health Index"
          value={loadingMachines ? '...' : `${healthRate}%`}
          subValue={`${operationalCount}/${machines.length} nominal`}
          icon={<CheckCircle2 className="h-5 w-5" />}
          accentColor="healthy"
          trend={{ value: '100% target', isUpward: true, isGood: true }}
        />
        <StatCard
          label="Anomalies & Warnings"
          value={loadingMachines ? '...' : criticalCount + warningCount}
          subValue={`${criticalCount} critical • ${warningCount} warning`}
          icon={<AlertTriangle className="h-5 w-5" />}
          accentColor={criticalCount > 0 ? 'critical' : warningCount > 0 ? 'warning' : 'healthy'}
        />
        <StatCard
          label="Avg AI Latency"
          value="5.04 ms"
          subValue="TorchScript CNN"
          icon={<Activity className="h-5 w-5" />}
          accentColor="primary"
          trend={{ value: 'sub-10ms', isUpward: false, isGood: true }}
        />
      </div>

      {/* Live Acoustic Waveform Visualizer Banner */}
      <div className="rounded-2xl border border-white/[0.08] bg-industrial-panel/80 p-5 backdrop-blur-xl shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-[#3ECF8E]" />
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white">
              Real-Time Acoustic Telemetry Wave Spectrum
            </h3>
          </div>
          <span className="text-[11px] font-mono text-[#3ECF8E]/90 font-semibold flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#3ECF8E] animate-pulse" />
            Sampling 16 kHz • 128 Mel Filters
          </span>
        </div>
        <AcousticWaveform isAnomaly={criticalCount > 0} isActive={true} height={52} />
      </div>

      {/* Fleet Status Grid & Open Work Orders */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Machinery Status Overview */}
        <div className="rounded-2xl border border-white/[0.08] bg-industrial-panel/80 p-6 backdrop-blur-xl shadow-xl lg:col-span-2">
          <div className="mb-5 flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div>
              <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white">
                Equipment Fleet Status
              </h3>
              <p className="font-mono text-[11px] text-slate-400 mt-0.5">
                Continuous acoustic diagnostic monitoring
              </p>
            </div>
            <Link
              to="/machines"
              className="flex items-center gap-1 text-xs font-mono text-[#3ECF8E] hover:text-[#3ECF8E] font-semibold transition-colors"
            >
              All Assets <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            {machines.map((m) => (
              <div
                key={m.id}
                className="group relative flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#1C1C1C]/60 p-4 hover:border-[#3ECF8E]/40 hover:bg-[#1C1C1C]/80 transition-all duration-200"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-sm font-bold text-white group-hover:text-[#3ECF8E] transition-colors">
                      {m.name}
                    </span>
                  </div>
                  <p className="font-mono text-[11px] text-slate-400 mt-1">
                    {m.serialNumber} • <span className="text-slate-300">{m.location}</span>
                  </p>
                </div>
                <StatusBadge status={m.status} size="sm" />
              </div>
            ))}
          </div>
        </div>

        {/* Actionable Work Orders */}
        <div className="rounded-2xl border border-white/[0.08] bg-industrial-panel/80 p-6 backdrop-blur-xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="mb-5 flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div>
                <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white">
                  Active Work Orders ({openTickets})
                </h3>
                <p className="font-mono text-[11px] text-slate-400 mt-0.5">
                  Automated anomaly recovery
                </p>
              </div>
              <Link
                to="/tickets"
                className="flex items-center gap-1 text-xs font-mono text-[#2E2E2E] hover:text-indigo-300 font-semibold transition-colors"
              >
                Triage <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {tickets.length === 0 ? (
              <div className="py-12 text-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-400/80 mx-auto mb-2" />
                <p className="text-xs font-mono text-slate-400 font-medium">
                  Zero active maintenance alerts
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  All equipment nominal
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {tickets.slice(0, 3).map((t) => (
                  <div
                    key={t.id}
                    className="rounded-xl border border-white/[0.06] bg-[#1C1C1C]/60 p-3.5 text-xs hover:border-white/10 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <StatusBadge status={t.priority} size="sm" />
                      <span className="font-mono text-[10px] text-slate-400">
                        {new Date(t.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="font-mono text-xs font-bold text-slate-100 mt-2 line-clamp-1">
                      {t.diagnostic?.machine?.name || 'Equipment Alert'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {t.resolutionNotes || 'Automatic anomaly alert ticket pending approval.'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-white/[0.08] mt-4">
            <Link
              to="/tickets"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#2E2E2E]/30 bg-indigo-950/40 py-2.5 text-xs font-mono font-semibold text-indigo-300 hover:bg-indigo-900/50 hover:text-white transition-all"
            >
              Manage & Approve Work Orders →
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Diagnostic Stream Table */}
      <div className="rounded-2xl border border-white/[0.08] bg-industrial-panel/80 p-6 backdrop-blur-xl shadow-xl">
        <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
          <div>
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white">
              Recent Acoustic Inspection Stream
            </h3>
            <p className="font-mono text-[11px] text-slate-400 mt-0.5">
              Live edge inference history processed by TorchScript CNN
            </p>
          </div>
          <Link
            to="/diagnostics"
            className="flex items-center gap-1.5 text-xs font-mono font-semibold text-[#3ECF8E] hover:text-[#3ECF8E]"
          >
            Run New Inspection <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-white/[0.08] text-[10px] uppercase tracking-wider text-slate-400">
                <th className="pb-3 font-semibold">Timestamp</th>
                <th className="pb-3 font-semibold">Equipment Asset</th>
                <th className="pb-3 font-semibold">AI Classification</th>
                <th className="pb-3 font-semibold">Confidence</th>
                <th className="pb-3 font-semibold">RMS Energy</th>
                <th className="pb-3 font-semibold">Spectral Centroid</th>
                <th className="pb-3 font-semibold">Technician</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {diagnostics.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No diagnostic records found. Run an inspection to populate telemetry.
                  </td>
                </tr>
              ) : (
                diagnostics.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 text-slate-400">
                      {new Date(d.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-3.5 font-bold text-white">
                      {d.machine?.name || 'Machinery'}
                    </td>
                    <td className="py-3.5">
                      <StatusBadge status={d.isAnomaly ? 'CRITICAL' : 'OPERATIONAL'} size="sm" />
                    </td>
                    <td className="py-3.5 font-bold text-[#3ECF8E]">
                      <div className="flex items-center gap-2">
                        <span>{(d.confidenceScore * 100).toFixed(1)}%</span>
                        <div className="h-1.5 w-12 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full ${d.isAnomaly ? 'bg-rose-500' : 'bg-[#3ECF8E]'}`}
                            style={{ width: `${d.confidenceScore * 100}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 text-slate-300">
                      {d.frequencyData?.rmsEnergyDb ? `${d.frequencyData.rmsEnergyDb} dB` : 'N/A'}
                    </td>
                    <td className="py-3.5 text-slate-300">
                      {d.frequencyData?.spectralCentroidHz ? `${d.frequencyData.spectralCentroidHz} Hz` : 'N/A'}
                    </td>
                    <td className="py-3.5 text-slate-400">
                      {d.technician?.fullName || 'Technician'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
