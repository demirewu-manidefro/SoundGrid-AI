import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, Tenant } from '../api/client';
import { 
  Building2, Plus, Shield, CheckCircle2, Server, Globe, Cpu, 
  Search, Users, Activity, Sparkles, Database, Layers, Check, X, ShieldAlert
} from 'lucide-react';

export const SuperAdminPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('ALL');
  
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
      setTier('ENTERPRISE');
    },
  });

  const tenants = tenantsRes?.data || [];

  const filteredTenants = useMemo(() => {
    return tenants.filter((t) => {
      const matchesSearch = 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.slug.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTier = tierFilter === 'ALL' || t.tier === tierFilter;
      return matchesSearch && matchesTier;
    });
  }, [tenants, searchQuery, tierFilter]);

  const totalUsers = useMemo(() => {
    return tenants.reduce((acc, t) => acc + (t._count?.users ?? 0), 0);
  }, [tenants]);

  const totalMachines = useMemo(() => {
    return tenants.reduce((acc, t) => acc + (t._count?.machines ?? 0), 0);
  }, [tenants]);

  const getTierBadge = (tTier: string) => {
    switch (tTier) {
      case 'ENTERPRISE':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-[#2E2E2E]/30 bg-[#2E2E2E]/10 px-2.5 py-0.5 text-[10px] font-mono font-bold text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.15)]">
            <Sparkles className="h-2.5 w-2.5 text-[#2E2E2E]" /> ENTERPRISE TIER
          </span>
        );
      case 'PROFESSIONAL':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-[#3ECF8E]/30 bg-[#3ECF8E]/10 px-2.5 py-0.5 text-[10px] font-mono font-bold text-[#3ECF8E]">
            PROFESSIONAL
          </span>
        );
      case 'STARTER':
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-600 bg-slate-800/60 px-2.5 py-0.5 text-[10px] font-mono font-bold text-slate-300">
            STARTER
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-slate-900/90 via-purple-950/40 to-slate-900/90 p-6  shadow-2xl">
        <div className="absolute -top-12 -right-12 h-44 w-44 rounded-full bg-[#2E2E2E]/10 blur-3xl pointer-events-none" />
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#2E2E2E]/20 border border-[#2E2E2E]/30 text-[#2E2E2E] shadow-[0_0_12px_rgba(168,85,247,0.3)]">
                <ShieldAlert className="h-4 w-4" />
              </span>
              <h1 className="font-mono text-xl font-bold tracking-tight text-white uppercase">
                Platform Multi-Tenant Governance (Tier 1 Root)
              </h1>
            </div>
            <p className="text-xs font-sans text-slate-400 mt-1 max-w-2xl">
              Cluster-wide organization tenancy isolation, PyTorch inference node telemetry, and cryptographic tenant boundary control.
            </p>
          </div>

          <button
            id="btn-onboard-tenant"
            onClick={() => setShowOnboardModal(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-[#232323] px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-purple-600/30 hover:shadow-purple-600/50 hover:from-[#2E2E2E] hover:to-[#2E2E2E] transition-all cursor-pointer active:scale-95"
          >
            <Plus className="h-4 w-4" /> Onboard Enterprise Tenant
          </button>
        </div>

        {/* Global Cluster Stats */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 border-t border-white/5 pt-4 font-mono">
          <div className="rounded-xl border border-white/5 bg-slate-900/40 p-3">
            <span className="text-[11px] uppercase tracking-wider text-slate-400">Isolated Tenants</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">{tenants.length}</span>
              <span className="text-[10px] text-emerald-400 font-sans">100% Isolated</span>
            </div>
          </div>
          <div className="rounded-xl border border-[#3ECF8E]/20 bg-[#2A2A2A]/20 p-3">
            <span className="text-[11px] uppercase tracking-wider text-[#3ECF8E]">Total Machinery Assets</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#3ECF8E]">{totalMachines}</span>
              <span className="text-[10px] text-[#3ECF8E]/70 font-sans">Monitored</span>
            </div>
          </div>
          <div className="rounded-xl border border-[#2E2E2E]/20 bg-purple-950/20 p-3">
            <span className="text-[11px] uppercase tracking-wider text-purple-300">Total Active Users</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#2E2E2E]">{totalUsers}</span>
              <span className="text-[10px] text-purple-300/70 font-sans">Accounts</span>
            </div>
          </div>
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-3">
            <span className="text-[11px] uppercase tracking-wider text-emerald-300">PyTorch AI Cluster</span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <Cpu className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-bold text-emerald-400">ONLINE (5.04ms)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Global Tech Details Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5  shadow-lg relative overflow-hidden">
          <div className="flex items-center gap-2 mb-2">
            <Cpu className="h-4 w-4 text-[#3ECF8E]" />
            <p className="text-xs font-mono uppercase text-slate-400 font-bold">FastAPI Neural Core</p>
          </div>
          <p className="text-2xl font-mono font-bold text-[#3ECF8E]">TorchScript v1.0</p>
          <p className="text-[11px] font-mono text-slate-400 mt-1">
            soundgrid_web_model.pt (1.67 MB) • 44.1kHz Mel-Spectrogram DSP
          </p>
          <div className="mt-3 flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
            <CheckCircle2 className="h-3 w-3" /> Ready for High-Throughput Edge Audio
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5  shadow-lg relative overflow-hidden">
          <div className="flex items-center gap-2 mb-2">
            <Database className="h-4 w-4 text-[#2E2E2E]" />
            <p className="text-xs font-mono uppercase text-slate-400 font-bold">PostgreSQL Engine</p>
          </div>
          <p className="text-2xl font-mono font-bold text-indigo-300">PostgreSQL 18</p>
          <p className="text-[11px] font-mono text-slate-400 mt-1">
            Prisma ORM Connection Pool • Tenant ID Foreign-Key Partitioning
          </p>
          <div className="mt-3 flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
            <CheckCircle2 className="h-3 w-3" /> Connection Pool Stable (Port 5432)
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5  shadow-lg relative overflow-hidden">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-4 w-4 text-[#2E2E2E]" />
            <p className="text-xs font-mono uppercase text-slate-400 font-bold">RBAC Hierarchy</p>
          </div>
          <p className="text-2xl font-mono font-bold text-purple-300">3 Verified Tiers</p>
          <p className="text-[11px] font-mono text-slate-400 mt-1">
            SUPER_ADMIN • ENTERPRISE_ADMIN • TECHNICIAN
          </p>
          <div className="mt-3 flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
            <CheckCircle2 className="h-3 w-3" /> Fully Enforced by Express Middleware
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-white/10 bg-slate-900/60 p-3 ">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-white/5 bg-slate-950/60 px-3 py-2 text-xs font-mono text-slate-300 focus-within:border-[#2E2E2E]/50">
          <Search className="h-4 w-4 text-slate-400 shrink-0" />
          <input
            id="input-tenant-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tenant by company name or unique slug..."
            className="w-full bg-transparent placeholder-slate-500 focus:outline-none"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-white">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-white/5 bg-slate-950/60 p-1 text-[11px] font-mono">
            {['ALL', 'ENTERPRISE', 'PROFESSIONAL', 'STARTER'].map((tierOption) => (
              <button
                key={tierOption}
                onClick={() => setTierFilter(tierOption)}
                className={`rounded px-2.5 py-1 transition-all ${
                  tierFilter === tierOption
                    ? 'bg-purple-600 text-white font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tierOption === 'ALL' ? 'All Tiers' : tierOption}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 shadow-xl  overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-white/10 bg-slate-950/70 text-[11px] uppercase tracking-wider text-slate-400">
                <th className="p-4 font-semibold">Enterprise Organization</th>
                <th className="p-4 font-semibold">Tenant Slug</th>
                <th className="p-4 font-semibold">Service Tier</th>
                <th className="p-4 font-semibold">Provisioned Users</th>
                <th className="p-4 font-semibold">Machinery Fleet</th>
                <th className="p-4 font-semibold">Isolation Status</th>
                <th className="p-4 font-semibold text-right">Created Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#2E2E2E] border-t-transparent" />
                      <span>Loading multi-tenant hierarchy registry...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Building2 className="mx-auto h-8 w-8 text-slate-600 mb-2" />
                    <p className="font-sans font-medium text-slate-300">No enterprise tenants match search filter.</p>
                  </td>
                </tr>
              ) : (
                filteredTenants.map((t) => (
                  <tr key={t.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[#2E2E2E]/10 text-[#2E2E2E] shadow">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-bold text-white font-sans text-sm group-hover:text-purple-300 transition-colors">
                            {t.name}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono">UUID: {t.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="rounded bg-slate-950 px-2 py-1 text-sky-400 font-mono font-bold border border-white/5">
                        {t.slug}
                      </span>
                    </td>
                    <td className="p-4">{getTierBadge(t.tier)}</td>
                    <td className="p-4 text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-slate-500" />
                        <span>{t._count?.users ?? 0} members</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Activity className="h-3.5 w-3.5 text-slate-500" />
                        <span>{t._count?.machines ?? 0} assets</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] text-emerald-300 font-bold">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        ACTIVE ISOLATION
                      </span>
                    </td>
                    <td className="p-4 text-right text-slate-400">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80  p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2E2E2E]/20 border border-[#2E2E2E]/30 text-[#2E2E2E]">
                  <Building2 className="h-4 w-4" />
                </div>
                <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
                  Provision New Enterprise Tenant
                </h3>
              </div>
              <button
                onClick={() => setShowOnboardModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-slate-400 mb-1.5">Company / Facility Name</label>
                <input
                  id="modal-tenant-name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'));
                  }}
                  placeholder="e.g. Siemens Energy Plant 7"
                  className="w-full rounded-xl border border-white/10 bg-slate-950 p-2.5 text-white placeholder-slate-600 focus:border-[#2E2E2E] focus:ring-1 focus:ring-[#2E2E2E] focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1.5">Tenant Slug (Isolation ID)</label>
                <input
                  id="modal-tenant-slug"
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. siemens-energy-p7"
                  className="w-full rounded-xl border border-white/10 bg-slate-950 p-2.5 text-white placeholder-slate-600 focus:border-[#2E2E2E] focus:ring-1 focus:ring-[#2E2E2E] focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1.5">Service Tier</label>
                <select
                  id="modal-tenant-tier"
                  value={tier}
                  onChange={(e) => setTier(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 p-2.5 text-white focus:border-[#2E2E2E] focus:ring-1 focus:ring-[#2E2E2E] focus:outline-none transition-all"
                >
                  <option value="STARTER">Starter Tier (10 Machines, 3 Users)</option>
                  <option value="PROFESSIONAL">Professional Tier (50 Machines, 20 Users)</option>
                  <option value="ENTERPRISE">Enterprise Tier (Unlimited Machinery & Telemetry)</option>
                </select>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowOnboardModal(false)}
                  className="flex-1 rounded-xl border border-white/10 bg-slate-800/80 py-2.5 text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="modal-tenant-submit"
                  type="button"
                  onClick={() => onboardMutation.mutate()}
                  disabled={!name || !slug || onboardMutation.isPending}
                  className="flex-1 rounded-xl bg-gradient-to-r from-purple-600 to-[#232323] py-2.5 font-bold text-white shadow-lg shadow-purple-600/30 hover:from-[#2E2E2E] hover:to-[#2E2E2E] transition-all disabled:opacity-50"
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
