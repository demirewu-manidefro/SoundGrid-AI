import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { StatCard } from '../components/common/StatCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { Cpu, AlertTriangle, CheckCircle2, Zap, ArrowUpRight, Activity } from 'lucide-react';
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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-mono text-xl font-bold tracking-tight text-white uppercase">
            Industrial Telemetry Overview
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Real-time acoustic vibration and fault classification telemetry
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/diagnostics"
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-indigo-500 transition-colors"
          >
            <Zap className="h-4 w-4" /> Trigger Acoustic Inspection
          </Link>
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
          label="Critical Anomalies"
          value={loadingMachines ? '...' : criticalCount}
          subValue={`${warningCount} warning`}
          icon={<AlertTriangle className="h-5 w-5" />}
          accentColor={criticalCount > 0 ? 'critical' : 'healthy'}
        />
        <StatCard
          label="Avg AI Latency"
          value="23.2 ms"
          subValue="TorchScript"
          icon={<Activity className="h-5 w-5" />}
          accentColor="primary"
          trend={{ value: 'sub-second', isUpward: false, isGood: true }}
        />
      </div>

      {/* Fleet Status Grid & Open Tickets */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Machinery Status Overview */}
        <div className="rounded-xl border border-industrial-border bg-industrial-panel p-5 shadow-lg lg:col-span-2">
          <div className="mb-4 flex items-center justify-between border-b border-industrial-border pb-3">
            <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-white">
              Machinery Telemetry Fleet
            </h3>
            <Link to="/machines" className="flex items-center gap-1 text-xs font-mono text-indigo-400 hover:text-indigo-300">
              View Fleet <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {machines.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-lg border border-industrial-border bg-[#0B0F19] p-3.5 hover:border-slate-700 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-white">{m.name}</span>
                  </div>
                  <p className="font-mono text-[11px] text-slate-400 mt-0.5">
                    {m.serialNumber} • {m.location}
                  </p>
                </div>
                <StatusBadge status={m.status} size="sm" />
              </div>
            ))}
          </div>
        </div>

        {/* Actionable Work Orders */}
        <div className="rounded-xl border border-industrial-border bg-industrial-panel p-5 shadow-lg">
          <div className="mb-4 flex items-center justify-between border-b border-industrial-border pb-3">
            <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-white">
              Active Work Orders ({openTickets})
            </h3>
            <Link to="/tickets" className="flex items-center gap-1 text-xs font-mono text-indigo-400 hover:text-indigo-300">
              Triage <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {tickets.length === 0 ? (
            <p className="text-xs font-mono text-slate-500 py-6 text-center">
              No active maintenance tickets
            </p>
          ) : (
            <div className="space-y-3">
              {tickets.slice(0, 4).map((t) => (
                <div
                  key={t.id}
                  className="rounded-lg border border-industrial-border bg-[#0B0F19] p-3 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <StatusBadge status={t.priority} size="sm" />
                    <span className="font-mono text-[10px] text-slate-400">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="font-mono text-xs font-medium text-slate-200 mt-2 line-clamp-1">
                    {t.diagnostic?.machine?.name || 'Equipment Work Order'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                    {t.resolutionNotes || 'Automatic anomaly alert ticket pending review.'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Diagnostic Stream Table */}
      <div className="rounded-xl border border-industrial-border bg-industrial-panel p-5 shadow-lg">
        <div className="mb-4 flex items-center justify-between border-b border-industrial-border pb-3">
          <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-white">
            Recent Acoustic Diagnostic Feed
          </h3>
          <span className="text-[11px] font-mono text-slate-400">
            Real-Time Edge Forwarding
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-industrial-border text-[11px] uppercase text-slate-400">
                <th className="pb-3 font-semibold">Timestamp</th>
                <th className="pb-3 font-semibold">Machine</th>
                <th className="pb-3 font-semibold">Diagnosis</th>
                <th className="pb-3 font-semibold">Confidence</th>
                <th className="pb-3 font-semibold">RMS Energy</th>
                <th className="pb-3 font-semibold">Spectral Centroid</th>
                <th className="pb-3 font-semibold">Technician</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-industrial-border">
              {diagnostics.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No diagnostic records found. Run an inspection to populate telemetry.
                  </td>
                </tr>
              ) : (
                diagnostics.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3 text-slate-400">
                      {new Date(d.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-3 font-bold text-white">
                      {d.machine?.name || 'Machinery'}
                    </td>
                    <td className="py-3">
                      <StatusBadge status={d.isAnomaly ? 'CRITICAL' : 'OPERATIONAL'} size="sm" />
                    </td>
                    <td className="py-3 font-bold text-sky-400">
                      {(d.confidenceScore * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 text-slate-300">
                      {d.frequencyData?.rmsEnergyDb ? `${d.frequencyData.rmsEnergyDb} dB` : 'N/A'}
                    </td>
                    <td className="py-3 text-slate-300">
                      {d.frequencyData?.spectralCentroidHz ? `${d.frequencyData.spectralCentroidHz} Hz` : 'N/A'}
                    </td>
                    <td className="py-3 text-slate-400">
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
