import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, Machine } from '../api/client';
import { StatusBadge } from '../components/common/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { Cpu, Plus, Filter, Search, Zap, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const MachinesPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [machineType, setMachineType] = useState('PUMP');
  const [serialNumber, setSerialNumber] = useState('');
  const [location, setLocation] = useState('');

  const { data: machinesRes, isLoading } = useQuery({
    queryKey: ['machines', typeFilter, statusFilter],
    queryFn: () => api.machines.list({ type: typeFilter || undefined, status: statusFilter || undefined }),
  });

  const createMutation = useMutation({
    mutationFn: () => api.machines.create({ name, machineType, serialNumber, location }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['machines'] });
      setShowRegisterModal(false);
      setName('');
      setSerialNumber('');
      setLocation('');
    },
  });

  const machines = machinesRes?.data || [];
  const filtered = machines.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const canRegister = ['SUPER_ADMIN', 'ENTERPRISE_ADMIN'].includes(user?.role || '');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-indigo-400" />
            <h1 className="font-mono text-xl font-bold tracking-tight text-white uppercase">
              Industrial Machinery Fleet
            </h1>
          </div>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Registered industrial acoustic monitoring points across plant facilities
          </p>
        </div>

        {canRegister && (
          <button
            id="btn-register-machine-modal"
            onClick={() => setShowRegisterModal(true)}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-indigo-500 transition-colors"
          >
            <Plus className="h-4 w-4" /> Register Industrial Asset
          </button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-industrial-border bg-industrial-panel p-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            id="input-search-machines"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by serial number, name, or bay..."
            className="w-full rounded-lg border border-industrial-border bg-[#0B0F19] py-1.5 pl-9 pr-3 text-xs font-mono text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <select
          id="select-filter-type"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-industrial-border bg-[#0B0F19] px-3 py-1.5 text-xs font-mono text-slate-300 focus:border-indigo-500 focus:outline-none"
        >
          <option value="">All Equipment Types</option>
          <option value="TRANSFORMER">Transformer</option>
          <option value="PUMP">Heavy Pump</option>
          <option value="MOTOR">Induction Motor</option>
          <option value="FAN">Industrial Fan</option>
        </select>

        <select
          id="select-filter-status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-industrial-border bg-[#0B0F19] px-3 py-1.5 text-xs font-mono text-slate-300 focus:border-indigo-500 focus:outline-none"
        >
          <option value="">All Health States</option>
          <option value="OPERATIONAL">Operational</option>
          <option value="WARNING">Warning</option>
          <option value="CRITICAL">Critical Anomaly</option>
        </select>
      </div>

      {/* Machines Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <p className="text-xs font-mono text-slate-500 py-12 text-center col-span-3">
            Loading equipment telemetry assets...
          </p>
        ) : filtered.length === 0 ? (
          <p className="text-xs font-mono text-slate-500 py-12 text-center col-span-3">
            No machinery matched your search criteria.
          </p>
        ) : (
          filtered.map((m) => (
            <div
              key={m.id}
              className="flex flex-col justify-between rounded-xl border border-industrial-border bg-industrial-panel p-5 shadow-lg hover:border-slate-700 transition-all"
            >
              <div>
                <div className="flex items-start justify-between">
                  <span className="rounded bg-slate-800 border border-slate-700 px-2 py-0.5 text-[10px] font-mono text-slate-300">
                    {m.machineType}
                  </span>
                  <StatusBadge status={m.status} size="sm" />
                </div>

                <h3 className="font-mono text-sm font-bold text-white mt-3 line-clamp-1">{m.name}</h3>
                <p className="font-mono text-xs text-sky-400 mt-1">{m.serialNumber}</p>
                <p className="text-xs text-slate-400 mt-1">{m.location}</p>
              </div>

              <div className="mt-5 pt-4 border-t border-industrial-border flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-500">
                  Registered: {new Date(m.createdAt).toLocaleDateString()}
                </span>
                <Link
                  to="/diagnostics"
                  className="flex items-center gap-1 rounded bg-slate-800 hover:bg-indigo-600 hover:text-white px-2.5 py-1 text-xs font-mono text-slate-300 transition-colors"
                >
                  <Zap className="h-3 w-3" /> Inspect
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Register Machine Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-industrial-border bg-industrial-panel p-6 shadow-2xl">
            <h3 className="font-mono text-sm font-bold text-white uppercase mb-4">
              Register New Machinery Asset
            </h3>

            <div className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Equipment Name</label>
                <input
                  id="modal-input-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Auxiliary Glycol Pump 4"
                  className="w-full rounded border border-industrial-border bg-[#0B0F19] p-2.5 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Equipment Category</label>
                <select
                  id="modal-select-type"
                  value={machineType}
                  onChange={(e) => setMachineType(e.target.value)}
                  className="w-full rounded border border-industrial-border bg-[#0B0F19] p-2.5 text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="TRANSFORMER">Electric Transformer</option>
                  <option value="PUMP">Heavy-Duty Pump</option>
                  <option value="MOTOR">High-Torque Motor</option>
                  <option value="FAN">Industrial Exhaust Fan</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Serial Number / Asset Tag</label>
                <input
                  id="modal-input-serial"
                  type="text"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder="e.g. PM-990-SIGMA"
                  className="w-full rounded border border-industrial-border bg-[#0B0F19] p-2.5 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Installation Location / Bay</label>
                <input
                  id="modal-input-location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Turbine Building Section 2"
                  className="w-full rounded border border-industrial-border bg-[#0B0F19] p-2.5 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="flex-1 rounded border border-industrial-border bg-slate-800 py-2 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  id="modal-btn-submit"
                  type="button"
                  onClick={() => createMutation.mutate()}
                  disabled={!name || !serialNumber || !location || createMutation.isPending}
                  className="flex-1 rounded bg-indigo-600 py-2 font-bold text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Registering...' : 'Save Asset'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
