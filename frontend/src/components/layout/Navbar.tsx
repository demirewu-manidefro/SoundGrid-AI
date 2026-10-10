import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { Activity, Shield, LogOut, Users, CheckCircle2, Zap, Sparkles } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, quickDemoLogin } = useAuth();
  const [gatewayHealthy, setGatewayHealthy] = useState<boolean>(true);
  const [showDemoModal, setShowDemoModal] = useState<boolean>(false);

  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await api.health.check();
        setGatewayHealthy(res.status === 'HEALTHY');
      } catch {
        setGatewayHealthy(false);
      }
    }
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const roles = [
    {
      role: 'SUPER_ADMIN',
      tier: 'Tier 1',
      title: 'Platform Super Admin',
      label: 'Global Master Governance',
      user: 'superadmin@soundgrid.ai',
      badgeColor: 'border-violet-500/40 bg-violet-950/60 text-violet-300',
    },
    {
      role: 'ENTERPRISE_ADMIN',
      tier: 'Tier 2',
      title: 'Enterprise Admin',
      label: 'Plant Director (Apex Power)',
      user: 'admin@apexpower.com',
      badgeColor: 'border-[#3ECF8E]/40 bg-[#2A2A2A]/60 text-[#3ECF8E]',
    },
    {
      role: 'TECHNICIAN',
      tier: 'Tier 3',
      title: 'Field Acoustic Technician',
      label: 'Diagnostic Operator',
      user: 'tech@apexpower.com',
      badgeColor: 'border-emerald-500/40 bg-emerald-950/60 text-emerald-300',
    },
  ] as const;

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-white/[0.08] bg-[#1C1C1C]/80 px-6  shadow-lg">
      {/* Brand & System Health */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-[#232323] border border-[#3E3E3E] text-[#3ECF8E] shadow-[0_0_15px_-3px_rgba(62,207,142,0.3)] group cursor-pointer">
            <Activity className="h-5 w-5 transition-transform group-hover:scale-110" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3ECF8E] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#3ECF8E]" />
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-base font-extrabold tracking-wider text-white">
                SOUNDGRID
              </span>
              <span className="rounded-full bg-[#2A2A2A]/80 border border-[#3E3E3E]/80 px-2 py-0.5 text-[9px] font-mono font-bold tracking-widest text-[#3ECF8E] shadow-[0_0_10px_-2px_rgba(62,207,142,0.5)]">
                SENTINEL
              </span>
            </div>
            <p className="text-[10px] font-mono text-slate-400">Industrial Acoustic AI Platform</p>
          </div>
        </div>

        {/* Live Cluster Health Badge */}
        <div className="hidden items-center gap-4 border-l border-white/[0.08] pl-6 lg:flex">
          <div className="flex items-center gap-2 rounded-full bg-slate-900/60 px-3 py-1 border border-white/5 text-xs font-mono">
            <span
              className={`h-2 w-2 rounded-full ${
                gatewayHealthy ? 'bg-emerald-400 shadow-[0_0_8px_#3ECF8E]' : 'bg-rose-500 animate-ping'
              }`}
            />
            <span className="text-slate-400">API GATEWAY:</span>
            <span className={gatewayHealthy ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-bold'}>
              {gatewayHealthy ? 'ONLINE' : 'DEGRADED'}
            </span>
          </div>

          <div className="flex items-center gap-2 rounded-full bg-[#2A2A2A]/30 px-3 py-1 border border-[#3E3E3E]/30 text-xs font-mono">
            <span className="h-2 w-2 rounded-full bg-[#3ECF8E] shadow-[0_0_8px_#3ECF8E]" />
            <span className="text-slate-400">AI TORCH ENGINE:</span>
            <span className="text-[#3ECF8E] font-semibold">127.0.0.1:8001 (5.04ms)</span>
          </div>
        </div>
      </div>

      {/* User Context & Role Switcher */}
      <div className="flex items-center gap-3">
        {/* Quick Role Switcher Button */}
        <button
          id="btn-role-switcher"
          onClick={() => setShowDemoModal(true)}
          className="flex items-center gap-2 rounded-xl border border-[#3E3E3E] bg-[#232323] px-3.5 py-1.5 text-xs font-mono font-medium text-[#EDEDED] hover:border-[#3ECF8E] hover:bg-[#2A2A2A] hover:text-white transition-all shadow-[0_0_12px_-3px_rgba(62,207,142,0.25)]"
          title="Switch role instantly to test multi-tenant RBAC permissions"
        >
          <Sparkles className="h-3.5 w-3.5 text-[#2E2E2E] animate-pulse" />
          <span>Switch Tier Role</span>
        </button>

        {/* User Badge */}
        {user && (
          <div className="flex items-center gap-3 border-l border-white/[0.08] pl-3">
            <div className="text-right">
              <div className="flex items-center justify-end gap-2">
                <span className="text-xs font-semibold text-slate-200">{user.fullName}</span>
                <span className="rounded-full border border-[#3E3E3E]/60 bg-[#2A2A2A]/60 px-2 py-0.5 text-[10px] font-mono text-[#3ECF8E] font-bold uppercase">
                  {user.role}
                </span>
              </div>
              <p className="text-[10px] font-mono text-slate-400">
                {user.tenant ? user.tenant.name : 'Platform Master Owner'}
              </p>
            </div>

            <button
              id="btn-logout"
              onClick={logout}
              className="rounded-xl p-2 text-slate-400 hover:bg-rose-950/40 hover:text-rose-400 border border-transparent hover:border-rose-800/40 transition-all"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Role Switcher Modal */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80  p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#232323] p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2.5">
                <Shield className="h-5 w-5 text-[#3ECF8E]" />
                <h3 className="font-display text-base font-bold text-white uppercase tracking-wider">
                  Select RBAC Role Persona
                </h3>
              </div>
              <button
                onClick={() => setShowDemoModal(false)}
                className="h-7 w-7 rounded-lg border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 text-sm"
              >
                ✕
              </button>
            </div>
            <p className="mb-5 text-xs font-sans text-slate-300 leading-relaxed">
              Instantly impersonate any of the 3 active hierarchical roles to test tenant isolation, ticket approvals, and acoustic AI tools:
            </p>

            <div className="space-y-3">
              {roles.map((r) => {
                const isCurrent = user?.role === r.role;
                return (
                  <button
                    key={r.role}
                    onClick={async () => {
                      await quickDemoLogin(r.role);
                      setShowDemoModal(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition-all ${
                      isCurrent
                        ? 'border-[#3ECF8E]/80 bg-[#2A2A2A]/40 shadow-[0_0_20px_-3px_rgba(62,207,142,0.25)]'
                        : 'border-white/[0.08] bg-slate-900/60 hover:border-white/20 hover:bg-slate-800/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase border ${r.badgeColor}`}>
                          {r.tier}
                        </span>
                        <p className="font-display text-sm font-bold text-white">{r.title}</p>
                      </div>
                      <p className="text-xs text-slate-300 font-sans">{r.label}</p>
                      <p className="text-[11px] font-mono text-[#3ECF8E]/80 mt-1">{r.user}</p>
                    </div>
                    {isCurrent ? (
                      <span className="flex items-center gap-1 text-xs font-mono text-[#3ECF8E] font-bold">
                        <CheckCircle2 className="h-4 w-4" /> ACTIVE
                      </span>
                    ) : (
                      <span className="text-xs font-mono text-slate-500 group-hover:text-white">
                        Switch →
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
