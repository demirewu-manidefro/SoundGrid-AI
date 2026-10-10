import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Cpu,
  Radio,
  Wrench,
  FileText,
  Building2,
  Users,
  ShieldAlert,
  Terminal,
  Activity,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  if (!user) return null;

  const role = user.role;

  const navItems = [
    {
      to: '/dashboard',
      label: 'Telemetry Overview',
      icon: LayoutDashboard,
      allowed: true,
      badge: 'Live',
    },
    {
      to: '/diagnostics',
      label: 'Acoustic Diagnostics',
      icon: Radio,
      allowed: ['SUPER_ADMIN', 'ENTERPRISE_ADMIN', 'TECHNICIAN'].includes(role),
      badge: 'AI Core',
    },
    {
      to: '/machines',
      label: 'Machinery Fleet',
      icon: Cpu,
      allowed: true,
    },
    {
      to: '/tickets',
      label: 'Work Orders & Approval',
      icon: Wrench,
      allowed: ['SUPER_ADMIN', 'ENTERPRISE_ADMIN', 'TECHNICIAN'].includes(role),
    },
    {
      to: '/audit',
      label: 'Immutable Audit Trail',
      icon: FileText,
      allowed: ['SUPER_ADMIN', 'ENTERPRISE_ADMIN'].includes(role),
    },
    {
      to: '/tenants',
      label: 'Tenant Provisioning',
      icon: Building2,
      allowed: role === 'SUPER_ADMIN',
    },
    {
      to: '/users',
      label: 'Team & Personnel',
      icon: Users,
      allowed: ['SUPER_ADMIN', 'ENTERPRISE_ADMIN'].includes(role),
    },
  ];

  return (
    <aside className="w-64 border-r border-white/[0.08] bg-[#1C1C1C]/90 p-4 flex flex-col justify-between shrink-0 ">
      <div className="space-y-6">
        <div>
          <div className="px-3 py-2 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
            Control Console
          </div>
          <div className="space-y-1 mt-1">
            {navItems
              .filter((item) => item.allowed)
              .map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `group relative flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-mono font-medium transition-all ${isActive
                        ? 'bg-gradient-to-r from-[#3ECF8E]/15 via-[#2E2E2E]/10 to-transparent text-[#3ECF8E] border border-[#3ECF8E]/30 shadow-[0_0_15px_-3px_rgba(62,207,142,0.15)]'
                        : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200 border border-transparent'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className="flex items-center gap-3">
                          <Icon
                            className={`h-4 w-4 shrink-0 transition-colors ${isActive ? 'text-[#3ECF8E]' : 'text-slate-500 group-hover:text-slate-300'
                              }`}
                          />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span
                            className={`rounded-full px-1.5 py-0.2 text-[9px] font-mono font-bold tracking-tight ${isActive
                                ? 'bg-[#2A2A2A]/80 text-[#3ECF8E] border border-[#3E3E3E]'
                                : 'bg-slate-800 text-slate-400'
                              }`}
                          >
                            {item.badge}
                          </span>
                        )}
                        {isActive && (
                          <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[#3ECF8E] shadow-[0_0_8px_#3ECF8E]" />
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
          </div>
        </div>
      </div>

      {/* Hardware Telemetry & Tenant State Card */}
      <div className="space-y-3">
        <div className="rounded-xl border border-white/[0.08] bg-[#232323] p-3.5 ">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-[#3ECF8E] font-mono text-[10px] font-bold uppercase tracking-wider">
              <Activity className="h-3.5 w-3.5 animate-pulse" />
              <span>Edge Telemetry</span>
            </div>
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#3ECF8E]" />
          </div>

          <div className="space-y-1 font-mono text-[10px] text-slate-400">
            <div className="flex justify-between">
              <span className="text-slate-500">Sample Rate:</span>
              <span className="text-slate-300 font-semibold">16.0 kHz</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Engine:</span>
              <span className="text-[#3ECF8E] font-semibold">TorchScript</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Tenant:</span>
              <span className="text-slate-200 truncate max-w-[90px]">
                {user.tenant ? user.tenant.slug : 'Global Admin'}
              </span>
            </div>
          </div>

          {/* Mini dynamic Equalizer */}
          <div className="mt-3 flex items-end gap-1 h-3.5 pt-1 border-t border-white/5">
            {[40, 75, 55, 90, 60, 30, 85, 45, 95, 70, 50, 80].map((h, idx) => (
              <span
                key={idx}
                className="flex-1 rounded-t-sm bg-[#3ECF8E] animate-pulse"
                style={{
                  height: `${h}%`,
                  animationDelay: `${idx * 120}ms`,
                  animationDuration: '1.2s',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};
