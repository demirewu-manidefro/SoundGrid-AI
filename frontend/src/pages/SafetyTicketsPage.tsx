import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, MaintenanceTicket, User } from '../api/client';
import { StatusBadge } from '../components/common/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { Wrench, CheckCircle, UserCheck, AlertTriangle, ShieldCheck, Clock } from 'lucide-react';

export const SafetyTicketsPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTicket, setSelectedTicket] = useState<MaintenanceTicket | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [assignedTechId, setAssignedTechId] = useState('');

  const { data: ticketsRes, isLoading } = useQuery({
    queryKey: ['tickets'],
    queryFn: () => api.tickets.list(),
  });

  const { data: usersRes } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.users.list(),
    enabled: ['SUPER_ADMIN', 'ENTERPRISE_ADMIN'].includes(user?.role || ''),
  });

  const tickets = ticketsRes?.data || [];
  const users = usersRes?.data || [];
  const technicians = users.filter((u: User) => u.role === 'TECHNICIAN');

  const assignMutation = useMutation({
    mutationFn: ({ ticketId, techId }: { ticketId: string; techId: string }) =>
      api.tickets.assign(ticketId, techId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      setSelectedTicket(null);
    },
  });

  const resolveMutation = useMutation({
    mutationFn: ({ ticketId, notes }: { ticketId: string; notes: string }) =>
      api.tickets.resolve(ticketId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['machines'] });
      setSelectedTicket(null);
      setResolutionNotes('');
    },
  });

  const canApprove = ['SUPER_ADMIN', 'ENTERPRISE_ADMIN'].includes(user?.role || '');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-amber-400" />
          <h1 className="font-mono text-xl font-bold tracking-tight text-white uppercase">
            Maintenance Work Orders & Safety Approval
          </h1>
        </div>
        <p className="text-xs font-mono text-slate-400 mt-1">
          Review automated acoustic failure alerts, assign repair orders, and approve machine recovery states
        </p>
      </div>

      {/* Tickets List */}
      <div className="rounded-xl border border-industrial-border bg-industrial-panel shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-industrial-border bg-slate-900/60 text-[11px] uppercase text-slate-400">
                <th className="p-3.5 font-semibold">Priority</th>
                <th className="p-3.5 font-semibold">Status</th>
                <th className="p-3.5 font-semibold">Equipment Asset</th>
                <th className="p-3.5 font-semibold">Assigned Tech</th>
                <th className="p-3.5 font-semibold">Diagnosis Trigger</th>
                <th className="p-3.5 font-semibold">Created</th>
                <th className="p-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-industrial-border">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Loading maintenance tickets...
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No active maintenance tickets recorded. Fleet operating within nominal acoustic thresholds.
                  </td>
                </tr>
              ) : (
                tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-3.5">
                      <StatusBadge status={t.priority} size="sm" />
                    </td>
                    <td className="p-3.5">
                      <StatusBadge status={t.status} size="sm" />
                    </td>
                    <td className="p-3.5">
                      <p className="font-bold text-white">{t.diagnostic?.machine?.name || 'Equipment'}</p>
                      <p className="text-[10px] text-slate-400">
                        {t.diagnostic?.machine?.serialNumber} ({t.diagnostic?.machine?.location})
                      </p>
                    </td>
                    <td className="p-3.5 text-slate-300">
                      {t.assignedTo ? (
                        <span className="flex items-center gap-1.5 text-slate-200">
                          <UserCheck className="h-3.5 w-3.5 text-indigo-400" />
                          {t.assignedTo.fullName}
                        </span>
                      ) : (
                        <span className="text-amber-400/80 font-mono">Unassigned</span>
                      )}
                    </td>
                    <td className="p-3.5 text-slate-300 max-w-xs truncate">
                      {t.resolutionNotes || 'Acoustic anomaly detected by AI engine'}
                    </td>
                    <td className="p-3.5 text-slate-400">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3.5 text-right">
                      {t.status !== 'RESOLVED' && canApprove ? (
                        <button
                          id={`btn-triage-${t.id}`}
                          onClick={() => {
                            setSelectedTicket(t);
                            setResolutionNotes(
                              'Inspected bearing housing and retightened rotor assembly. Acoustic harmonics verified nominal.'
                            );
                          }}
                          className="rounded bg-indigo-600/30 border border-indigo-500/50 px-2.5 py-1 text-xs font-mono font-semibold text-indigo-300 hover:bg-indigo-600 hover:text-white transition-colors"
                        >
                          Triage & Approve
                        </button>
                      ) : (
                        <span className="text-[11px] font-mono text-emerald-400 flex items-center justify-end gap-1">
                          <CheckCircle className="h-3 w-3" /> Resolved
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Safety Resolution & Approval Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-industrial-border bg-industrial-panel p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-industrial-border pb-3">
              <h3 className="font-mono text-sm font-bold text-white uppercase flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                Work Order Action: {selectedTicket.diagnostic?.machine?.name}
              </h3>
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 font-mono text-xs">
              {/* Assign to technician */}
              <div className="rounded-lg border border-industrial-border bg-[#0B0F19] p-3.5">
                <p className="font-bold text-slate-300 mb-2">Assign Field Technician</p>
                <div className="flex gap-2">
                  <select
                    id="select-assign-tech"
                    value={assignedTechId}
                    onChange={(e) => setAssignedTechId(e.target.value)}
                    className="flex-1 rounded border border-industrial-border bg-slate-900 p-2 text-white text-xs focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="">-- Choose Field Technician --</option>
                    {technicians.map((t: User) => (
                      <option key={t.id} value={t.id}>
                        {t.fullName} ({t.email})
                      </option>
                    ))}
                  </select>
                  <button
                    id="btn-confirm-assign"
                    onClick={() =>
                      assignMutation.mutate({
                        ticketId: selectedTicket.id,
                        techId: assignedTechId,
                      })
                    }
                    disabled={!assignedTechId || assignMutation.isPending}
                    className="rounded bg-indigo-600 px-3 py-1.5 text-xs text-white hover:bg-indigo-500 disabled:opacity-50"
                  >
                    Assign
                  </button>
                </div>
              </div>

              {/* Safety Approval / Resolve */}
              <div className="rounded-lg border border-emerald-900/60 bg-emerald-950/20 p-3.5">
                <p className="font-bold text-emerald-300 mb-1 flex items-center gap-1.5">
                  <CheckCircle className="h-4 w-4" />
                  Plant Safety Manager / Chief Engineer Sign-Off
                </p>
                <p className="text-[11px] text-slate-400 mb-3">
                  Approving this resolution will automatically restore the machine status back to{' '}
                  <span className="text-emerald-400 font-bold">OPERATIONAL</span> and append a tamper-proof audit record.
                </p>

                <textarea
                  id="input-resolution-notes"
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Enter resolution actions, component replacements, and test sign-off..."
                  className="w-full rounded border border-industrial-border bg-[#0B0F19] p-2.5 text-white text-xs focus:border-emerald-500 focus:outline-none mb-3"
                />

                <button
                  id="btn-confirm-resolve"
                  onClick={() =>
                    resolveMutation.mutate({
                      ticketId: selectedTicket.id,
                      notes: resolutionNotes,
                    })
                  }
                  disabled={!resolutionNotes || resolveMutation.isPending}
                  className="w-full rounded bg-emerald-600 py-2.5 font-bold text-white hover:bg-emerald-500 transition-colors disabled:opacity-50"
                >
                  {resolveMutation.isPending
                    ? 'Recording Approval...'
                    : 'Approve Resolution & Restore Machinery Status'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
