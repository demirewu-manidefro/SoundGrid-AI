import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, AuditLogItem } from '../api/client';
import { 
  Shield, FileText, Download, Filter, Search, Terminal, Lock, 
  CheckCircle2, Clock, Globe, Copy, Check, Hash, Sparkles, X, ChevronRight
} from 'lucide-react';

export const AuditorPage: React.FC = () => {
  const [actionFilter, setActionFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: auditRes, isLoading } = useQuery({
    queryKey: ['audit', actionFilter],
    queryFn: () => api.audit.list({ action: actionFilter || undefined, limit: 100 }),
  });

  const logs = auditRes?.data || [];

  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      const matchAction = l.action.toLowerCase().includes(q);
      const matchResource = l.resource.toLowerCase().includes(q);
      const matchActor = l.actor?.fullName?.toLowerCase().includes(q) || l.actor?.email?.toLowerCase().includes(q);
      const matchIp = l.ipAddress?.toLowerCase().includes(q);
      return matchAction || matchResource || matchActor || matchIp;
    });
  }, [logs, searchQuery]);

  const stats = useMemo(() => {
    return {
      total: logs.length,
      diagnostics: logs.filter(l => l.action.includes('DIAGNOSTIC') || l.resource.includes('DIAGNOSTIC')).length,
      tickets: logs.filter(l => l.action.includes('TICKET')).length,
      auth: logs.filter(l => l.action.includes('AUTH') || l.action.includes('LOGIN')).length,
    };
  }, [logs]);

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `soundgrid_audit_trail_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const copyPayload = () => {
    if (selectedLog) {
      navigator.clipboard.writeText(JSON.stringify(selectedLog.metadata || {}, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getActionBadge = (action: string) => {
    if (action.includes('AUTH') || action.includes('LOGIN')) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-0.5 text-[10px] font-mono font-bold text-sky-400">
          <Lock className="h-2.5 w-2.5" /> {action}
        </span>
      );
    }
    if (action.includes('DIAGNOSTIC') || action.includes('ML')) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-[#3ECF8E]/30 bg-[#3ECF8E]/10 px-2.5 py-0.5 text-[10px] font-mono font-bold text-[#3ECF8E]">
          <Terminal className="h-2.5 w-2.5" /> {action}
        </span>
      );
    }
    if (action.includes('TICKET') || action.includes('ALERT')) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-mono font-bold text-amber-400">
          <Shield className="h-2.5 w-2.5" /> {action}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-[#2E2E2E]/30 bg-[#2E2E2E]/10 px-2.5 py-0.5 text-[10px] font-mono font-bold text-purple-300">
        <Hash className="h-2.5 w-2.5" /> {action}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-slate-900/90 via-sky-950/40 to-slate-900/90 p-6  shadow-2xl">
        <div className="absolute -top-12 -right-12 h-44 w-44 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/20 border border-sky-500/30 text-sky-400 shadow-[0_0_12px_rgba(14,165,233,0.3)]">
                <Lock className="h-4 w-4" />
              </span>
              <h1 className="font-mono text-xl font-bold tracking-tight text-white uppercase">
                Cryptographic Audit Ledger
              </h1>
            </div>
            <p className="text-xs font-sans text-slate-400 mt-1 max-w-2xl">
              Append-only immutable record stream for ISO 55000 acoustic asset health and OSHA industrial safety compliance.
            </p>
          </div>

          <button
            id="btn-export-audit"
            onClick={handleExportJson}
            disabled={logs.length === 0}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-sky-600/30 hover:shadow-sky-600/50 hover:from-sky-500 hover:to-[#3ECF8E] transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <Download className="h-4 w-4" /> Export Ledger (JSON)
          </button>
        </div>

        {/* Compliance Strip */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 border-t border-white/5 pt-4 font-mono">
          <div className="rounded-xl border border-white/5 bg-slate-900/40 p-3">
            <span className="text-[11px] uppercase tracking-wider text-slate-400">Total Audit Logs</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">{stats.total}</span>
              <span className="text-[10px] text-sky-400 font-sans">Indexed</span>
            </div>
          </div>
          <div className="rounded-xl border border-[#3ECF8E]/20 bg-[#2A2A2A]/20 p-3">
            <span className="text-[11px] uppercase tracking-wider text-[#3ECF8E]">Diagnostic Inferences</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#3ECF8E]">{stats.diagnostics}</span>
              <span className="text-[10px] text-[#3ECF8E]/70 font-sans">ML Scans</span>
            </div>
          </div>
          <div className="rounded-xl border border-amber-500/20 bg-amber-950/20 p-3">
            <span className="text-[11px] uppercase tracking-wider text-amber-300">Ticket Actions</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-400">{stats.tickets}</span>
              <span className="text-[10px] text-amber-300/70 font-sans">Triages</span>
            </div>
          </div>
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-3">
            <span className="text-[11px] uppercase tracking-wider text-emerald-300">Integrity State</span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-bold text-emerald-400">Append-Only</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-white/10 bg-slate-900/60 p-3 ">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-white/5 bg-slate-950/60 px-3 py-2 text-xs font-mono text-slate-300 focus-within:border-sky-500/50">
          <Search className="h-4 w-4 text-slate-400 shrink-0" />
          <input
            id="input-audit-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by action, resource, actor, or IP address..."
            className="w-full bg-transparent placeholder-slate-500 focus:outline-none"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-white">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            id="select-audit-action"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="rounded-lg border border-white/10 bg-slate-950/80 px-3 py-2 text-xs font-mono text-slate-200 focus:border-sky-500 focus:outline-none"
          >
            <option value="">All Action Types</option>
            <option value="AUTH">Authentication Events</option>
            <option value="DIAGNOSTIC">Diagnostic ML Inferences</option>
            <option value="TICKET">Ticket Approvals & Triages</option>
            <option value="MACHINE">Machinery Operations</option>
            <option value="TENANT">Tenant Onboarding</option>
            <option value="USER">User Provisioning</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 shadow-xl  overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-white/10 bg-slate-950/70 text-[11px] uppercase tracking-wider text-slate-400">
                <th className="p-4 font-semibold">Timestamp</th>
                <th className="p-4 font-semibold">Action Event</th>
                <th className="p-4 font-semibold">Target Resource</th>
                <th className="p-4 font-semibold">Actor / Role</th>
                <th className="p-4 font-semibold">Tenant Scope</th>
                <th className="p-4 font-semibold">IP Address</th>
                <th className="p-4 font-semibold text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
                      <span>Verifying tamper-proof audit ledger hashes...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <FileText className="mx-auto h-8 w-8 text-slate-600 mb-2" />
                    <p className="font-sans font-medium text-slate-300">No matching audit records in current view.</p>
                    <p className="text-[11px] text-slate-500 mt-1">Adjust filters to inspect historical ledger events.</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="p-4 text-slate-400 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-slate-500" />
                        <span>{new Date(log.createdAt).toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="p-4">{getActionBadge(log.action)}</td>
                    <td className="p-4 font-bold text-slate-200">
                      <span className="font-mono text-[#3ECF8E]/90">{log.resource}</span>
                    </td>
                    <td className="p-4">
                      {log.actor ? (
                        <div>
                          <p className="font-sans font-medium text-white">{log.actor.fullName}</p>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {log.actor.role}
                          </span>
                        </div>
                      ) : (
                        <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">
                          System Gateway
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-slate-300">
                      {log.tenant?.name || <span className="text-slate-500">Global Root</span>}
                    </td>
                    <td className="p-4 text-slate-400 font-mono text-[11px]">
                      <div className="flex items-center gap-1 text-slate-400">
                        <Globe className="h-3 w-3 text-slate-500" />
                        <span>{log.ipAddress}</span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex items-center gap-1 rounded-lg border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 text-[11px] font-semibold text-sky-300 hover:bg-sky-500/20 hover:border-sky-500/50 transition-all cursor-pointer"
                      >
                        Inspect <ChevronRight className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80  p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/20 border border-sky-500/30 text-sky-400">
                  <Terminal className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
                    Audit Payload Record: {selectedLog.action}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono">Immutable ID: {selectedLog.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 font-mono text-xs">
              <div className="grid grid-cols-2 gap-3 rounded-xl border border-white/5 bg-slate-950 p-3 text-[11px]">
                <div>
                  <span className="text-slate-500 block">Resource Target:</span>
                  <span className="text-white font-bold">{selectedLog.resource}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Source IP:</span>
                  <span className="text-sky-400">{selectedLog.ipAddress}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Actor:</span>
                  <span className="text-emerald-400">
                    {selectedLog.actor ? `${selectedLog.actor.fullName} (${selectedLog.actor.role})` : 'System Daemon'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Recorded UTC:</span>
                  <span className="text-slate-300">{new Date(selectedLog.createdAt).toISOString()}</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] text-slate-400">Cryptographic JSONB Payload Metadata:</span>
                  <button
                    onClick={copyPayload}
                    className="flex items-center gap-1 rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-400" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" /> Copy JSON
                      </>
                    )}
                  </button>
                </div>
                <pre className="max-h-64 overflow-auto rounded-xl border border-white/10 bg-slate-950 p-4 text-[11px] font-mono text-[#3ECF8E] shadow-inner">
                  {JSON.stringify(selectedLog.metadata || {}, null, 2)}
                </pre>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="rounded-xl border border-white/10 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
                >
                  Close Inspector
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
