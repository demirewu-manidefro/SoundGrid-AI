import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, Tenant } from '../api/client';
import { Building2, Plus, Shield, CheckCircle2, Server, Globe, Cpu } from 'lucide-react';

export const SuperAdminPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [tier, setTier] = useState('ENTERPRISE');

  const { data: tenantsRes, isLoading } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => api.tenants.list(),
  });

  const onboardMutation = useMutation({
    mutationFn: () => api.tenants.create({ name, slug, tier }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      setShowOnboardModal(false);
      setName('');
      setSlug('');
    },
  });

  const tenants = tenantsRes?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-indigo-400" />
            <h1 className="font-mono text-xl font-bold tracking-tight text-white uppercase">
              Global Platform Governance (Tier 1 Super Admin)
            </h1>
          </div>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Global multi-tenant visibility across all industrial organizations, system health metrics, and tenant onboarding
          </p>
        </div>

        <button
          id="btn-onboard-tenant"
          onClick={() => setShowOnboardModal(true)}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-indigo-500 transition-colors"
        >
          <Plus className="h-4 w-4" /> Onboard Enterprise Company
        </button>
      </div>

      {/* Global Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-industrial-border bg-industrial-panel p-5 shadow-lg">
          <p className="text-xs font-mono uppercase text-slate-400">Total Provisioned Tenants</p>
          <p className="text-3xl font-mono font-bold text-white mt-2">{tenants.length}</p>
          <p className="text-[11px] font-mono text-emerald-400 mt-1">100% Isolated via PostgreSQL</p>
        </div>

        <div className="rounded-xl border border-industrial-border bg-industrial-panel p-5 shadow-lg">
          <p className="text-xs font-mono uppercase text-slate-400">AI Model Version</p>
          <p className="text-3xl font-mono font-bold text-sky-400 mt-2">v1.0-TS</p>
          <p className="text-[11px] font-mono text-slate-400 mt-1">soundgrid_web_model.pt (1.67 MB)</p>
        </div>

        <div className="rounded-xl border border-industrial-border bg-industrial-panel p-5 shadow-lg">
          <p className="text-xs font-mono uppercase text-slate-400">Database Engine</p>
          <p className="text-3xl font-mono font-bold text-indigo-400 mt-2">PostgreSQL 18</p>
          <p className="text-[11px] font-mono text-slate-400 mt-1">Port 5432 (Local Service)</p>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="rounded-xl border border-industrial-border bg-industrial-panel shadow-lg overflow-hidden">
        <div className="border-b border-industrial-border p-4 flex items-center justify-between">
          <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-white">
            Active Tenant Organizations
          </h3>
          <span className="text-[11px] font-mono text-slate-400">Organization Boundaries Enforced</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-industrial-border bg-slate-900/60 text-[11px] uppercase text-slate-400">
                <th className="p-3.5 font-semibold">Organization Name</th>
                <th className="p-3.5 font-semibold">Tenant Slug</th>
                <th className="p-3.5 font-semibold">License Tier</th>
                <th className="p-3.5 font-semibold">Users</th>
                <th className="p-3.5 font-semibold">Machinery Fleet</th>
                <th className="p-3.5 font-semibold">Status</th>
                <th className="p-3.5 font-semibold">Onboarded</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-industrial-border">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Loading tenants list...
                  </td>
                </tr>
              ) : (
                tenants.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-3.5 font-bold text-white flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-indigo-400" />
                      {t.name}
                    </td>
                    <td className="p-3.5 text-sky-400 font-bold">{t.slug}</td>
                    <td className="p-3.5">
                      <span className="rounded bg-indigo-950/80 border border-indigo-800 px-2 py-0.5 text-[10px] text-indigo-300 font-bold">
                        {t.tier}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-300">{t._count?.users ?? 0} members</td>
                    <td className="p-3.5 text-slate-300">{t._count?.machines ?? 0} machines</td>
                    <td className="p-3.5">
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 text-[10px] text-emerald-300 font-bold">
                        <CheckCircle2 className="h-3 w-3" /> ACTIVE
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-400">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Onboard Modal */}
      {showOnboardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-industrial-border bg-industrial-panel p-6 shadow-2xl">
            <h3 className="font-mono text-sm font-bold text-white uppercase mb-4">
              Provision New Enterprise Tenant
            </h3>

            <div className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Company Name</label>
                <input
                  id="modal-tenant-name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
                  }}
                  placeholder="e.g. Siemens Energy Plant 7"
                  className="w-full rounded border border-industrial-border bg-[#0B0F19] p-2.5 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Tenant Slug (Isolation ID)</label>
                <input
                  id="modal-tenant-slug"
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. siemens-energy-p7"
                  className="w-full rounded border border-industrial-border bg-[#0B0F19] p-2.5 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Service Tier</label>
                <select
                  id="modal-tenant-tier"
                  value={tier}
                  onChange={(e) => setTier(e.target.value)}
                  className="w-full rounded border border-industrial-border bg-[#0B0F19] p-2.5 text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="STARTER">Starter</option>
                  <option value="PROFESSIONAL">Professional</option>
                  <option value="ENTERPRISE">Enterprise (Unlimited Telemetry)</option>
                </select>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowOnboardModal(false)}
                  className="flex-1 rounded border border-industrial-border bg-slate-800 py-2 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  id="modal-tenant-submit"
                  type="button"
                  onClick={() => onboardMutation.mutate()}
                  disabled={!name || !slug || onboardMutation.isPending}
                  className="flex-1 rounded bg-indigo-600 py-2 font-bold text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {onboardMutation.isPending ? 'Provisioning...' : 'Provision Tenant'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
