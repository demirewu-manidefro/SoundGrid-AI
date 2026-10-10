import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, User } from '../api/client';
import { 
  Users, UserPlus, Shield, CheckCircle2, Search, Filter, 
  Building2, Key, Mail, UserCheck, ShieldCheck, Wrench, X, Sparkles
} from 'lucide-react';

export const UsersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('TECHNICIAN');
  const [password, setPassword] = useState('Password123!');

  const { data: usersRes, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.users.list(),
  });

  const createMutation = useMutation({
    mutationFn: () => api.users.create({ email, fullName, role, password }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowAddModal(false);
      setEmail('');
      setFullName('');
      setPassword('Password123!');
    },
  });

  const users = usersRes?.data || [];

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u: User) => {
      const matchesSearch = 
        u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  const stats = useMemo(() => {
    return {
      total: users.length,
      superAdmins: users.filter((u: User) => u.role === 'SUPER_ADMIN').length,
      enterpriseAdmins: users.filter((u: User) => u.role === 'ENTERPRISE_ADMIN').length,
      technicians: users.filter((u: User) => u.role === 'TECHNICIAN').length,
    };
  }, [users]);

  const getRoleBadge = (userRole: string) => {
    switch (userRole) {
      case 'SUPER_ADMIN':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 text-[10px] font-mono font-bold text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.15)]">
            <Shield className="h-3 w-3 text-rose-400" />
            SUPER ADMIN (T1)
          </span>
        );
      case 'ENTERPRISE_ADMIN':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#2E2E2E]/30 bg-[#2E2E2E]/10 px-2.5 py-0.5 text-[10px] font-mono font-bold text-indigo-300 shadow-[0_0_10px_rgba(62,207,142,0.15)]">
            <Building2 className="h-3 w-3 text-[#2E2E2E]" />
            ENTERPRISE ADMIN (T2)
          </span>
        );
      case 'TECHNICIAN':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#3ECF8E]/30 bg-[#3ECF8E]/10 px-2.5 py-0.5 text-[10px] font-mono font-bold text-[#3ECF8E] shadow-[0_0_10px_rgba(6,182,212,0.15)]">
            <Wrench className="h-3 w-3 text-[#3ECF8E]" />
            TECHNICIAN (T3)
          </span>
        );
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-slate-900/90 via-indigo-950/40 to-slate-900/90 p-6  shadow-2xl">
        <div className="absolute -top-12 -right-12 h-44 w-44 rounded-full bg-[#2E2E2E]/10 blur-3xl pointer-events-none" />
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#2E2E2E]/20 border border-[#2E2E2E]/30 text-[#2E2E2E] shadow-[0_0_12px_rgba(62,207,142,0.3)]">
                <Users className="h-4 w-4" />
              </span>
              <h1 className="font-mono text-xl font-bold tracking-tight text-white uppercase">
                Facility Roster & Personnel RBAC
              </h1>
            </div>
            <p className="text-xs font-sans text-slate-400 mt-1 max-w-2xl">
              Multi-tenant Role-Based Access Control matrix (3-Tier architecture: Super Admin, Enterprise Admin, Field Acoustic Technician).
            </p>
          </div>

          <button
            id="btn-add-user"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-xl bg-[#3ECF8E] hover:bg-[#24B47E] text-[#1C1C1C] px-4 py-2.5 text-xs font-semibold shadow-lg shadow-[#3ECF8E]/30 hover:shadow-[#3ECF8E]/50 transition-all cursor-pointer active:scale-95"
          >
            <UserPlus className="h-4 w-4" /> Provision Team Member
          </button>
        </div>

        {/* Quick Stats Strip */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 border-t border-white/5 pt-4 font-mono">
          <div className="rounded-xl border border-white/5 bg-slate-900/40 p-3">
            <span className="text-[11px] uppercase tracking-wider text-slate-400">Total Personnel</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">{stats.total}</span>
              <span className="text-[10px] text-emerald-400 font-sans">Active</span>
            </div>
          </div>
          <div className="rounded-xl border border-[#2E2E2E]/20 bg-indigo-950/20 p-3">
            <span className="text-[11px] uppercase tracking-wider text-indigo-300">Enterprise Admins</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#2E2E2E]">{stats.enterpriseAdmins}</span>
              <span className="text-[10px] text-indigo-300/70 font-sans">Tier 2</span>
            </div>
          </div>
          <div className="rounded-xl border border-[#3ECF8E]/20 bg-[#2A2A2A]/20 p-3">
            <span className="text-[11px] uppercase tracking-wider text-[#3ECF8E]">Technicians</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#3ECF8E]">{stats.technicians}</span>
              <span className="text-[10px] text-[#3ECF8E]/70 font-sans">Tier 3</span>
            </div>
          </div>
          <div className="rounded-xl border border-rose-500/20 bg-rose-950/20 p-3">
            <span className="text-[11px] uppercase tracking-wider text-rose-300">Super Admins</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-rose-400">{stats.superAdmins}</span>
              <span className="text-[10px] text-rose-300/70 font-sans">Tier 1 Root</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-white/10 bg-slate-900/60 p-3 ">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-white/5 bg-slate-950/60 px-3 py-2 text-xs font-mono text-slate-300 focus-within:border-[#2E2E2E]/50">
          <Search className="h-4 w-4 text-slate-400 shrink-0" />
          <input
            id="input-user-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by personnel name or email address..."
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
          <div className="flex rounded-lg border border-white/5 bg-slate-950/60 p-1 text-[11px] font-mono">
            {['ALL', 'SUPER_ADMIN', 'ENTERPRISE_ADMIN', 'TECHNICIAN'].map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`rounded px-2.5 py-1 transition-all ${
                  roleFilter === r
                    ? 'bg-[#232323] text-white font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {r === 'ALL' ? 'All Roles' : r.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 shadow-xl  overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-white/10 bg-slate-950/70 text-[11px] uppercase tracking-wider text-slate-400">
                <th className="p-4 font-semibold">Personnel Member</th>
                <th className="p-4 font-semibold">Email Contact</th>
                <th className="p-4 font-semibold">RBAC Tier</th>
                <th className="p-4 font-semibold">Tenant Organization</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Access Scope</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#2E2E2E] border-t-transparent" />
                      <span>Loading authorized personnel records...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Users className="mx-auto h-8 w-8 text-slate-600 mb-2" />
                    <p className="font-sans font-medium text-slate-300">No personnel members match current criteria.</p>
                    <p className="text-[11px] text-slate-500 mt-1">Try resetting the role filter or search query.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u: User) => (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-[#2E2E2E]/20 to-[#2E2E2E]/10 font-mono text-xs font-bold text-indigo-300 shadow">
                          {getInitials(u.fullName)}
                        </div>
                        <div>
                          <p className="font-bold text-white font-sans text-sm group-hover:text-indigo-300 transition-colors">
                            {u.fullName}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono">ID: {u.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-[#3ECF8E]">
                        <Mail className="h-3 w-3 text-[#3ECF8E]/70" />
                        <span>{u.email}</span>
                      </div>
                    </td>
                    <td className="p-4">{getRoleBadge(u.role)}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-slate-300 font-sans">
                        <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>{u.tenant?.name || 'Platform Super Admin (Global)'}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] text-emerald-300 font-bold">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        ACTIVE
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="font-mono text-[11px] text-slate-400">
                        {u.role === 'SUPER_ADMIN' ? 'Cross-Tenant RWX' : u.role === 'ENTERPRISE_ADMIN' ? 'Plant-Scoped RW' : 'Acoustic-Diagnostic RO+'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provision Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80  p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2E2E2E]/20 border border-[#2E2E2E]/30 text-[#2E2E2E]">
                  <UserPlus className="h-4 w-4" />
                </div>
                <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
                  Provision New Personnel
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-slate-400 mb-1.5">Full Name</label>
                <input
                  id="modal-user-fullname"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rachel Chen"
                  className="w-full rounded-xl border border-white/10 bg-slate-950 p-2.5 text-white placeholder-slate-600 focus:border-[#2E2E2E] focus:ring-1 focus:ring-[#2E2E2E] focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1.5">Email Address</label>
                <input
                  id="modal-user-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. rachel@apexpower.com"
                  className="w-full rounded-xl border border-white/10 bg-slate-950 p-2.5 text-white placeholder-slate-600 focus:border-[#2E2E2E] focus:ring-1 focus:ring-[#2E2E2E] focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1.5">Role Hierarchy (3 Tiers)</label>
                <select
                  id="modal-user-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 p-2.5 text-white focus:border-[#2E2E2E] focus:ring-1 focus:ring-[#2E2E2E] focus:outline-none transition-all"
                >
                  <option value="TECHNICIAN">Tier 3: Field Acoustic Technician</option>
                  <option value="ENTERPRISE_ADMIN">Tier 2: Plant Owner / Enterprise Admin</option>
                  <option value="SUPER_ADMIN">Tier 1: Global Platform Super Admin</option>
                </select>
                <p className="text-[10px] text-slate-500 mt-1 font-sans">
                  {role === 'TECHNICIAN' && 'Grants access to record diagnostics and trigger AI engine inferences.'}
                  {role === 'ENTERPRISE_ADMIN' && 'Full facility control: machine fleet, dispatch tickets, and user roster.'}
                  {role === 'SUPER_ADMIN' && 'Global root access across all isolated tenant organizations.'}
                </p>
              </div>

              <div>
                <label className="block text-slate-400 mb-1.5">Temporary Password</label>
                <input
                  id="modal-user-pass"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 p-2.5 text-white focus:border-[#2E2E2E] focus:ring-1 focus:ring-[#2E2E2E] focus:outline-none transition-all"
                />
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 rounded-xl border border-white/10 bg-slate-800/80 py-2.5 text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="modal-user-submit"
                  type="button"
                  onClick={() => createMutation.mutate()}
                  disabled={!email || !fullName || createMutation.isPending}
                  className="flex-1 rounded-xl bg-[#3ECF8E] hover:bg-[#24B47E] text-[#1C1C1C] py-2.5 font-bold shadow-lg shadow-[#3ECF8E]/30 transition-all disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Provisioning...' : 'Provision User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
