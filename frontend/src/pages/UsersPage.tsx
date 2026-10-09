import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, User } from '../api/client';
import { Users, Plus, Shield, CheckCircle2, UserPlus } from 'lucide-react';

export const UsersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
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
    },
  });

  const users = usersRes?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-400" />
            <h1 className="font-mono text-xl font-bold tracking-tight text-white uppercase">
              Facility Roster & Personnel RBAC
            </h1>
          </div>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Manage organization technicians, safety managers, and auditors with tenant scoping
          </p>
        </div>

        <button
          id="btn-add-user"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-indigo-500 transition-colors"
        >
          <UserPlus className="h-4 w-4" /> Provision Team Member
        </button>
      </div>

      {/* Users Table */}
      <div className="rounded-xl border border-industrial-border bg-industrial-panel shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-industrial-border bg-slate-900/60 text-[11px] uppercase text-slate-400">
                <th className="p-3.5 font-semibold">Full Name</th>
                <th className="p-3.5 font-semibold">Email</th>
                <th className="p-3.5 font-semibold">Hierarchical Role</th>
                <th className="p-3.5 font-semibold">Tenant Organization</th>
                <th className="p-3.5 font-semibold">Status</th>
                <th className="p-3.5 font-semibold">Last Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-industrial-border">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Loading personnel roster...
                  </td>
                </tr>
              ) : (
                users.map((u: User) => (
                  <tr key={u.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-3.5 font-bold text-white">{u.fullName}</td>
                    <td className="p-3.5 text-sky-400">{u.email}</td>
                    <td className="p-3.5">
                      <span className="rounded bg-indigo-950/80 border border-indigo-800 px-2 py-0.5 text-[10px] text-indigo-300 font-bold uppercase">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-300">{u.tenant?.name || 'Platform Super Admin'}</td>
                    <td className="p-3.5">
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 text-[10px] text-emerald-300 font-bold">
                        <CheckCircle2 className="h-3 w-3" /> ACTIVE
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-400">Recently</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-industrial-border bg-industrial-panel p-6 shadow-2xl">
            <h3 className="font-mono text-sm font-bold text-white uppercase mb-4">
              Provision New Personnel
            </h3>

            <div className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Full Name</label>
                <input
                  id="modal-user-fullname"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rachel Chen"
                  className="w-full rounded border border-industrial-border bg-[#0B0F19] p-2.5 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Email Address</label>
                <input
                  id="modal-user-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. rachel@apexpower.com"
                  className="w-full rounded border border-industrial-border bg-[#0B0F19] p-2.5 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Role Hierarchy</label>
                <select
                  id="modal-user-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded border border-industrial-border bg-[#0B0F19] p-2.5 text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="TECHNICIAN">Tier 3: Field Maintenance Technician</option>
                  <option value="ENTERPRISE_ADMIN">Tier 2: Plant Owner / Enterprise Admin</option>
                  <option value="SUPER_ADMIN">Tier 1: Platform Super Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Initial Password</label>
                <input
                  id="modal-user-pass"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded border border-industrial-border bg-[#0B0F19] p-2.5 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 rounded border border-industrial-border bg-slate-800 py-2 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  id="modal-user-submit"
                  type="button"
                  onClick={() => createMutation.mutate()}
                  disabled={!email || !fullName || createMutation.isPending}
                  className="flex-1 rounded bg-indigo-600 py-2 font-bold text-white hover:bg-indigo-500 disabled:opacity-50"
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
