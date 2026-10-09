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
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  if (!user) return null;

  const role = user.role;

  const navItems = [
    {
      to: '/',
      label: 'Telemetry Overview',
      icon: LayoutDashboard,
      allowed: true,
    },
    {
      to: '/diagnostics',
      label: 'Acoustic Diagnostics',
      icon: Radio,
      allowed: ['SUPER_ADMIN', 'ENTERPRISE_ADMIN', 'TECHNICIAN'].includes(role),
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
      label: 'Team & Technicians',
      icon: Users,
      allowed: ['SUPER_ADMIN', 'ENTERPRISE_ADMIN'].includes(role),
    },
  ];

  return (
    <aside className="w-64 border-r border-industrial-border bg-industrial-canvas p-4 flex flex-col justify-between shrink-0">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-500">
          Navigation Control
        </div>
        {navItems
          .filter((item) => item.allowed)
          .map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-mono font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                      : 'text-slate-400 hover:bg-industrial-panel hover:text-slate-200'
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
      </div>

      {/* Compliance / Role Watermark */}
      <div className="rounded-lg border border-industrial-border bg-industrial-panel p-3">
        <div className="flex items-center gap-2 mb-1">
          <ShieldAlert className="h-3.5 w-3.5 text-sky-400" />
          <span className="font-mono text-[10px] uppercase font-bold text-slate-300">
            Tenant Isolation
          </span>
        </div>
        <p className="font-mono text-[10px] text-slate-400">
          {user.tenant ? `Tenant: ${user.tenant.slug}` : 'Scope: Global Super Admin'}
        </p>
        <p className="font-mono text-[10px] text-slate-500 mt-1">
          Enforced by JWT RBAC & PostgreSQL
        </p>
      </div>
    </aside>
  );
};
