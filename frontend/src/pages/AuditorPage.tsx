import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, AuditLogItem } from '../api/client';
import { Shield, FileText, Download, Filter, Search, Terminal, Lock } from 'lucide-react';

export const AuditorPage: React.FC = () => {
  const [actionFilter, setActionFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const { data: auditRes, isLoading } = useQuery({
    queryKey: ['audit', actionFilter],
    queryFn: () => api.audit.list({ action: actionFilter || undefined, limit: 50 }),
  });

  const logs = auditRes?.data || [];

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `soundgrid_audit_trail_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-sky-400" />
            <h1 className="font-mono text-xl font-bold tracking-tight text-white uppercase">
              Immutable Audit Trail (Tier 5 Compliance Auditor)
            </h1>
          </div>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Tamper-proof append-only ledger for ISO 55000 asset management and OSHA industrial safety compliance
          </p>
        </div>

        <button
          id="btn-export-audit"
          onClick={handleExportJson}
          disabled={logs.length === 0}
          className="flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-sky-500 transition-colors disabled:opacity-50"
        >
          <Download className="h-4 w-4" /> Export Tamper-Proof Audit Log (JSON)
        </button>
      </div>

      {/* Compliance Banner */}
      <div className="rounded-xl border border-sky-800/80 bg-sky-950/30 p-4 shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-sky-400 shrink-0" />
          <div>
            <p className="font-mono text-xs font-bold text-sky-300 uppercase">
              Regulatory Audit Scoping Active
            </p>
            <p className="font-mono text-[11px] text-slate-400 mt-0.5">
              All records cryptographically timestamped and append-only. Mutation methods are blocked by HTTP 403 Auditor Read-Only guard.
            </p>
          </div>
        </div>
        <span className="rounded bg-sky-900/80 border border-sky-700 px-2 py-0.5 text-[10px] font-mono text-sky-300 uppercase font-bold">
          READ-ONLY
        </span>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3 rounded-xl border border-industrial-border bg-industrial-panel p-3">
        <select
          id="select-audit-action"
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="rounded-lg border border-industrial-border bg-[#0B0F19] px-3 py-1.5 text-xs font-mono text-slate-300 focus:border-sky-500 focus:outline-none"
        >
          <option value="">All Security & Operational Actions</option>
          <option value="AUTH">Authentication Events (Login/SSO/Refresh)</option>
          <option value="DIAGNOSTIC">Diagnostic ML Evaluations</option>
          <option value="TICKET">Ticket Approvals & Resolutions</option>
          <option value="MACHINE">Machinery Fleet Alterations</option>
          <option value="TENANT">Tenant Onboarding</option>
          <option value="USER">User Role Modifications</option>
        </select>
        <span className="text-xs font-mono text-slate-500">
          Showing {logs.length} audit records
        </span>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-xl border border-industrial-border bg-industrial-panel shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-industrial-border bg-slate-900/60 text-[11px] uppercase text-slate-400">
                <th className="p-3.5 font-semibold">Timestamp</th>
                <th className="p-3.5 font-semibold">Action</th>
                <th className="p-3.5 font-semibold">Resource</th>
                <th className="p-3.5 font-semibold">Actor</th>
                <th className="p-3.5 font-semibold">Tenant</th>
                <th className="p-3.5 font-semibold">IP Address</th>
                <th className="p-3.5 font-semibold text-right">Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-industrial-border">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Loading audit trail ledger...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No matching audit trail records found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-3.5 text-slate-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="p-3.5 font-bold text-sky-400">{log.action}</td>
                    <td className="p-3.5 text-slate-300">{log.resource}</td>
                    <td className="p-3.5 text-slate-300">
                      {log.actor ? (
                        <span>
                          {log.actor.fullName} <span className="text-slate-500">({log.actor.role})</span>
                        </span>
                      ) : (
                        <span className="text-slate-500">System Gateway</span>
                      )}
                    </td>
                    <td className="p-3.5 text-slate-400">{log.tenant?.name || 'Global'}</td>
                    <td className="p-3.5 text-slate-500">{log.ipAddress}</td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="rounded border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 hover:border-sky-500 hover:text-sky-300"
                      >
                        Inspect Payload
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-xl border border-industrial-border bg-industrial-panel p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-industrial-border pb-3">
              <h3 className="font-mono text-sm font-bold text-white uppercase flex items-center gap-2">
                <Terminal className="h-4 w-4 text-sky-400" />
                Audit Record Payload: {selectedLog.action}
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                <p>Record ID: <span className="text-white">{selectedLog.id}</span></p>
                <p>Resource: <span className="text-white">{selectedLog.resource}</span></p>
                <p>IP Address: <span className="text-white">{selectedLog.ipAddress}</span></p>
                <p>Created: <span className="text-white">{new Date(selectedLog.createdAt).toISOString()}</span></p>
              </div>

              <div className="mt-3">
                <p className="text-[11px] text-slate-400 mb-1">Raw JSONB Metadata:</p>
                <pre className="max-h-60 overflow-auto rounded border border-industrial-border bg-[#0B0F19] p-3 text-[11px] text-emerald-400">
                  {JSON.stringify(selectedLog.metadata || {}, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
