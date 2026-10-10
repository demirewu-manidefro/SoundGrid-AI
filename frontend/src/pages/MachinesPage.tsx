import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, Machine } from '../api/client';
import { StatusBadge } from '../components/common/StatusBadge';
import { useAuth } from '../context/AuthContext';
import {
  Cpu,
  Plus,
  Search,
  Zap,
  Activity,
  Radio,
  Fan,
  Layers,
  ArrowRight,
  Shield,
  MapPin,
  Barcode,
} from 'lucide-react';
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

  const getMachineIcon = (type: string) => {
    switch (type) {
      case 'TRANSFORMER':
        return <Zap className="h-5 w-5 text-amber-400" />;
      case 'PUMP':
        return <Activity className="h-5 w-5 text-[#3ECF8E]" />;
      case 'MOTOR':
        return <Cpu className="h-5 w-5 text-[#2E2E2E]" />;
      case 'FAN':
        return <Fan className="h-5 w-5 text-emerald-400" />;
      default:
        return <Cpu className="h-5 w-5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center border-b border-white/[0.08] pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#232323]/20 border border-[#2E2E2E]/30 text-[#2E2E2E]">
              <Cpu className="h-5 w-5" />
            </div>
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-white uppercase">
              Machinery Telemetry Fleet
            </h1>
          </div>
          <p className="text-xs font-sans text-slate-400 mt-1">
            Registered industrial acoustic sensor nodes across plant facilities
          </p>
        </div>

        {canRegister && (
          <button
            id="btn-register-machine-modal"
            onClick={() => setShowRegisterModal(true)}
            className="flex items-center gap-2 rounded-xl bg-[#3ECF8E] hover:bg-[#24B47E] text-[#1C1C1C] px-4 py-2.5 text-xs font-mono font-bold shadow-[0_0_15px_-3px_rgba(62,207,142,0.4)] transition-all"
          >
            <Plus className="h-4 w-4" /> Register Industrial Asset
          </button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-3.5 rounded-2xl border border-white/[0.08] bg-industrial-panel/80 p-3.5 backdrop-blur-xl shadow-lg">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
          <input
            id="input-search-machines"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by serial number, asset name, or location..."
            className="w-full rounded-xl border border-white/10 bg-[#1C1C1C] py-2 pl-10 pr-3.5 text-xs font-mono text-white placeholder-slate-500 focus:border-[#3ECF8E] focus:outline-none transition-colors"
          />
        </div>

        <select
          id="select-filter-type"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-xl border border-white/10 bg-[#1C1C1C] px-3.5 py-2 text-xs font-mono text-slate-300 focus:border-[#3ECF8E] focus:outline-none transition-colors"
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
          className="rounded-xl border border-white/10 bg-[#1C1C1C] px-3.5 py-2 text-xs font-mono text-slate-300 focus:border-[#3ECF8E] focus:outline-none transition-colors"
        >
          <option value="">All Health States</option>
          <option value="OPERATIONAL">Operational (Healthy)</option>
          <option value="WARNING">Warning</option>
          <option value="CRITICAL">Critical Anomaly</option>
        </select>
      </div>

      {/* Machines Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-3 py-16 text-center font-mono text-xs text-slate-500">
            Synchronizing telemetry assets...
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-3 py-16 text-center font-mono text-xs text-slate-500">
            No equipment matched your filter criteria.
          </div>
        ) : (
          filtered.map((m) => (
            <div
              key={m.id}
              className="group relative flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-industrial-panel/80 p-5 backdrop-blur-xl shadow-xl hover:border-[#3ECF8E]/40 hover:-translate-y-1 transition-all duration-300"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 border border-white/10 group-hover:scale-105 transition-transform">
                      {getMachineIcon(m.machineType)}
                    </div>
                    <div>
                      <span className="rounded-full bg-slate-900/80 border border-white/10 px-2 py-0.5 text-[9px] font-mono font-bold text-slate-300 uppercase">
                        {m.machineType}
                      </span>
                    </div>
                  </div>
                  <StatusBadge status={m.status} size="sm" />
                </div>

                <h3 className="font-display text-base font-bold text-white mt-1 group-hover:text-[#3ECF8E] transition-colors line-clamp-1">
                  {m.name}
                </h3>

                <div className="mt-3 space-y-1.5 font-mono text-xs text-slate-400">
                  <p className="flex items-center gap-1.5 text-[#3ECF8E]/80 font-semibold">
                    <Barcode className="h-3.5 w-3.5 text-slate-500" />
                    <span>{m.serialNumber}</span>
                  </p>
                  <p className="flex items-center gap-1.5 text-slate-400">
                    <MapPin className="h-3.5 w-3.5 text-slate-500" />
                    <span>{m.location}</span>
                  </p>
                </div>
              </div>

              <div className="mt-5 pt-3.5 border-t border-white/[0.06] flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-500">
                  Added: {new Date(m.createdAt).toLocaleDateString()}
                </span>
                <Link
                  to="/diagnostics"
                  className="flex items-center gap-1.5 rounded-lg border border-[#3ECF8E]/30 bg-[#2A2A2A]/40 px-3 py-1 text-xs font-mono font-bold text-[#3ECF8E] hover:bg-cyan-900/60 transition-colors"
                >
                  <Zap className="h-3 w-3" /> Inspect Audio
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Register Machine Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#232323] p-6 shadow-2xl">
            <h3 className="font-display text-base font-bold text-white uppercase tracking-wider mb-4">
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
                  placeholder="e.g. Auxiliary High-Torque Pump 4"
                  className="w-full rounded-xl border border-white/10 bg-[#1C1C1C] p-3 text-white focus:border-[#3ECF8E] focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Asset Classification</label>
                <select
                  id="modal-select-type"
                  value={machineType}
                  onChange={(e) => setMachineType(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#1C1C1C] p-3 text-white focus:border-[#3ECF8E] focus:outline-none transition-colors"
                >
                  <option value="TRANSFORMER">Transformer (Substation / Step-Up)</option>
                  <option value="PUMP">Centrifugal Slurry/Cooling Pump</option>
                  <option value="MOTOR">High-Torque Induction Motor</option>
                  <option value="FAN">Industrial Aerodynamic Fan</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Serial Number / Asset Tag</label>
                <input
                  id="modal-input-serial"
                  type="text"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder="e.g. PU-920-BETA"
                  className="w-full rounded-xl border border-white/10 bg-[#1C1C1C] p-3 text-white focus:border-[#3ECF8E] focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Facility Bay / Yard Location</label>
                <input
                  id="modal-input-location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Turbine Hall Bay 3"
                  className="w-full rounded-xl border border-white/10 bg-[#1C1C1C] p-3 text-white focus:border-[#3ECF8E] focus:outline-none transition-colors"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="rounded-xl px-4 py-2 text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="modal-btn-submit-machine"
                  type="button"
                  onClick={() => createMutation.mutate()}
                  disabled={!name || !serialNumber || !location || createMutation.isPending}
                  className="rounded-xl bg-[#3ECF8E] hover:bg-[#24B47E] text-[#1C1C1C] px-5 py-2 font-bold transition-all disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Provisioning...' : 'Provision Asset'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
