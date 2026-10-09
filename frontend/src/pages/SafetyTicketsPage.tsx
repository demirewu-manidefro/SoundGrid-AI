import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, MaintenanceTicket, User } from '../api/client';
import { StatusBadge } from '../components/common/StatusBadge';
import { useAuth } from '../context/AuthContext';
import {
  Wrench,
  CheckCircle,
  UserCheck,
  AlertTriangle,
  ShieldCheck,
  Clock,
  ArrowRight,
  UserPlus,
} from 'lucide-react';

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
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center border-b border-white/[0.08] pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400">
              <Wrench className="h-5 w-5" />
            </div>
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-white uppercase">
              Maintenance Work Orders & Safety Approval
            </h1>
          </div>
          <p className="text-xs font-sans text-slate-400 mt-1">
            Review acoustic failure alerts, assign technicians, and sign off recovery states
          </p>
        </div>
      </div>

      {/* Tickets List */}
      <div className="rounded-2xl border border-white/[0.08] bg-industrial-panel/80 shadow-2xl backdrop-blur-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-white/[0.08] bg-slate-900/60 text-[10px] uppercase tracking-wider text-slate-400">
                <th className="p-4 font-semibold">Priority</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Equipment Asset</th>
                <th className="p-4 font-semibold">Assigned Tech</th>
                <th className="p-4 font-semibold">Diagnosis Trigger</th>
                <th className="p-4 font-semibold">Created</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Loading maintenance work orders...
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-sans">
                    <CheckCircle className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                    Zero active maintenance alerts. Fleet operating within nominal acoustic thresholds.
                  </td>
                </tr>
              ) : (
                tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4">
                      <StatusBadge status={t.priority} size="sm" />
                    </td>
                    <td className="p-4">
                      <StatusBadge status={t.status} size="sm" />
                    </td>
                    <td className="p-4">
                      <p className="font-display font-bold text-sm text-white">{t.diagnostic?.machine?.name || 'Equipment Asset'}</p>
                      <p className="text-[11px] text-slate-400">
                        {t.diagnostic?.machine?.serialNumber} ({t.diagnostic?.machine?.location})
                      </p>
                    </td>
                    <td className="p-4 text-slate-300">
                      {t.assignedTo ? (
                        <span className="flex items-center gap-1.5 text-slate-200">
                          <UserCheck className="h-3.5 w-3.5 text-cyan-400" />
                          {t.assignedTo.fullName}
                        </span>
                      ) : (
                        <span className="text-amber-400/90 font-bold">Unassigned</span>
                      )}
                    </td>
                    <td className="p-4 text-slate-300 max-w-xs truncate">
                      {t.resolutionNotes || 'Acoustic anomaly detected by AI engine'}
                    </td>
                    <td className="p-4 text-slate-400">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      {t.status !== 'RESOLVED' && canApprove ? (
                        <button
                          id={`btn-triage-${t.id}`}
                          onClick={() => {
                            setSelectedTicket(t);
                            setResolutionNotes(
                              'Inspected bearing housing and retightened rotor assembly. Acoustic harmonics verified nominal.'
                            );
                          }}
                          className="rounded-xl border border-indigo-500/40 bg-indigo-950/40 px-3 py-1.5 text-xs font-mono font-bold text-indigo-300 hover:bg-indigo-600 hover:text-white transition-all shadow-[0_0_10px_-2px_rgba(99,102,241,0.3)]"
                        >
                          Triage & Approve
                        </button>
                      ) : (
                        <span className="text-xs font-mono text-emerald-400 font-bold flex items-center justify-end gap-1">
                          <CheckCircle className="h-3.5 w-3.5" /> Resolved
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0F1626] p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="font-display text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                Work Order Action: {selectedTicket.diagnostic?.machine?.name}
              </h3>
              <button
                onClick={() => setSelectedTicket(null)}
                className="h-7 w-7 rounded-lg border border-white/10 flex items-center justify-center text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 font-mono text-xs">
              {/* Assign to technician */}
              <div className="rounded-xl border border-white/10 bg-[#070A12] p-4">
                <p className="font-bold text-slate-200 mb-2">Assign Field Technician</p>
                <div className="flex gap-2">
                  <select
                    id="select-assign-tech"
                    value={assignedTechId}
                    onChange={(e) => setAssignedTechId(e.target.value)}
                    className="flex-1 rounded-xl border border-white/10 bg-slate-900 p-2.5 text-white text-xs focus:border-cyan-400 focus:outline-none"
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
                    className="rounded-xl bg-indigo-600 px-4 py-2 font-bold text-white hover:bg-indigo-500 disabled:opacity-50"
                  >
                    Assign
                  </button>
                </div>
              </div>

              {/* Approval / Resolve */}
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4">
                <p className="font-bold text-emerald-300 mb-1 flex items-center gap-1.5">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  Plant Administrator Sign-Off & Status Recovery
                </p>
                <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
                  Approving this resolution will automatically restore the machine status back to{' '}
                  <span className="text-emerald-400 font-bold">OPERATIONAL</span> and append a tamper-proof audit record.
                </p>

                <textarea
                  id="input-resolution-notes"
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Enter resolution actions, component replacements, and test sign-off..."
                  className="w-full rounded-xl border border-white/10 bg-[#070A12] p-3 text-white text-xs focus:border-emerald-400 focus:outline-none mb-3"
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
                  className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 py-3 font-bold text-white hover:brightness-110 shadow-[0_0_15px_-3px_rgba(16,185,129,0.4)] transition-all disabled:opacity-50"
                >
                  {resolveMutation.isPending
                    ? 'Recording Sign-Off...'
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
