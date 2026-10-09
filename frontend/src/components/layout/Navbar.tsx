import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { Activity, Shield, LogOut, Users, CheckCircle2, AlertCircle } from 'lucide-react';

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
    { role: 'SUPER_ADMIN', label: 'Tier 1: Super Admin (Global Master)', user: 'superadmin@soundgrid.ai' },
    { role: 'ENTERPRISE_ADMIN', label: 'Tier 2: Plant Admin (Apex Power)', user: 'admin@apexpower.com' },
    { role: 'TECHNICIAN', label: 'Tier 3: Field Acoustic Tech', user: 'tech@apexpower.com' },
  ] as const;

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-industrial-border bg-industrial-panel/95 px-6 backdrop-blur-md">
      {/* Brand & System Health */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600/20 border border-indigo-500/40 text-indigo-400">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-bold tracking-wider text-white">SOUNDGRID</span>
              <span className="rounded bg-sky-950/80 border border-sky-800/80 px-1.5 py-0.5 text-[10px] font-mono font-bold text-sky-400">
                SENTINEL
              </span>
            </div>
            <p className="text-[10px] font-mono text-slate-400">Industrial Acoustic AI Platform</p>
          </div>
        </div>

        {/* Live Cluster Health Badge */}
        <div className="hidden items-center gap-4 border-l border-industrial-border pl-6 md:flex">
          <div className="flex items-center gap-2 text-xs font-mono">
            <span
              className={`h-2 w-2 rounded-full ${
                gatewayHealthy ? 'bg-emerald-400 shadow-[0_0_8px_#10B981]' : 'bg-rose-500 animate-ping'
              }`}
            />
            <span className="text-slate-300">API GATEWAY:</span>
            <span className={gatewayHealthy ? 'text-emerald-400' : 'text-rose-400 font-bold'}>
              {gatewayHealthy ? 'ONLINE' : 'DEGRADED'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10B981]" />
            <span className="text-slate-300">AI TORCH ENGINE:</span>
            <span className="text-emerald-400">ACTIVE (127.0.0.1:8001)</span>
          </div>
        </div>
      </div>

      {/* User Context & Role Switcher */}
      <div className="flex items-center gap-4">
        {/* Quick Role Switcher Button */}
        <button
          id="btn-role-switcher"
          onClick={() => setShowDemoModal(true)}
          className="flex items-center gap-2 rounded-lg border border-industrial-border bg-slate-800/80 px-3 py-1.5 text-xs font-mono text-slate-200 hover:border-indigo-500 hover:text-white transition-all shadow-sm"
          title="Switch role instantly to test multi-tenant RBAC permissions"
        >
          <Users className="h-3.5 w-3.5 text-indigo-400" />
          <span>Switch Tier Role</span>
        </button>

        {/* User Badge */}
        {user && (
          <div className="flex items-center gap-3 border-l border-industrial-border pl-4">
            <div className="text-right">
              <div className="flex items-center justify-end gap-2">
                <span className="text-xs font-semibold text-slate-200">{user.fullName}</span>
                <span className="rounded border border-indigo-800 bg-indigo-950/60 px-1.5 py-0.5 text-[10px] font-mono text-indigo-300 uppercase">
                  {user.role}
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-400">
                {user.tenant ? user.tenant.name : 'Platform Master Owner'}
              </p>
            </div>

            <button
              id="btn-logout"
              onClick={logout}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Role Switcher Modal */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-industrial-border bg-industrial-panel p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-industrial-border pb-3">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-indigo-400" />
                <h3 className="font-mono text-sm font-bold text-white uppercase">
                  Instant RBAC Tier Persona Switcher
                </h3>
              </div>
              <button
                onClick={() => setShowDemoModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>
            <p className="mb-4 text-xs text-slate-400">
              Select any of the 5 hierarchical enterprise roles to immediately test tenant isolation, read-only guards, work order approval, or AI diagnostic features:
            </p>

            <div className="space-y-2">
              {roles.map((r) => {
                const isCurrent = user?.role === r.role;
                return (
                  <button
                    key={r.role}
                    onClick={async () => {
                      await quickDemoLogin(r.role);
                      setShowDemoModal(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition-all ${
                      isCurrent
                        ? 'border-indigo-500 bg-indigo-950/40 text-white'
                        : 'border-industrial-border bg-slate-900/40 text-slate-300 hover:border-slate-700 hover:bg-slate-800/50'
                    }`}
                  >
                    <div>
                      <p className="font-mono text-xs font-semibold text-white">{r.label}</p>
                      <p className="text-[11px] font-mono text-slate-400">{r.user}</p>
                    </div>
                    {isCurrent && <CheckCircle2 className="h-4 w-4 text-indigo-400" />}
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
