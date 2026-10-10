import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, Machine } from '../api/client';
import { AudioRecorder } from '../components/audio/AudioRecorder';
import { HeatmapView } from '../components/common/HeatmapView';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  Radio,
  AlertCircle,
  CheckCircle,
  Upload,
  Zap,
  FileAudio,
  Clock,
  Activity,
  Cpu,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  BarChart2,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const TechnicianPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedMachineId, setSelectedMachineId] = useState<string>('');
  const [audioFile, setAudioFile] = useState<{ blob: Blob; name: string } | null>(null);
  const [technicianNotes, setTechnicianNotes] = useState('');
  const [evaluationResult, setEvaluationResult] = useState<any | null>(null);

  const { data: machinesRes, isLoading: loadingMachines } = useQuery({
    queryKey: ['machines'],
    queryFn: () => api.machines.list(),
  });

  const machines = machinesRes?.data || [];

  const diagnosticMutation = useMutation({
    mutationFn: async () => {
      if (!audioFile || !selectedMachineId) {
        throw new Error('Please select a target equipment asset and provide an audio signal.');
      }
      const formData = new FormData();
      formData.append('audio', audioFile.blob, audioFile.name);
      formData.append('machineId', selectedMachineId);
      if (technicianNotes) {
        formData.append('technicianNotes', technicianNotes);
      }
      return api.diagnostics.upload(formData);
    },
    onSuccess: (data) => {
      setEvaluationResult(data.data);
      queryClient.invalidateQueries({ queryKey: ['machines'] });
      queryClient.invalidateQueries({ queryKey: ['diagnostics'] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFile({ blob: file, name: file.name });
    }
  };

  const selectedMachine = machines.find((m) => m.id === selectedMachineId);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-r from-[#232323]/90 via-[#2A2A2A]/80 to-[#232323]/90 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#3ECF8E]/30 bg-[#2A2A2A]/40 px-3 py-1 font-mono text-[11px] font-semibold text-[#3ECF8E]">
              <Radio className="h-3.5 w-3.5 text-[#3ECF8E] animate-pulse" />
              <span>Acoustic Edge Terminal • Sub-10ms Inference</span>
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-extrabold tracking-tight text-white uppercase">
              Field Acoustic Diagnostic Console
            </h1>
            <p className="text-xs md:text-sm font-sans text-slate-300 max-w-2xl">
              Acquire sensor vibration audio, run deep magic-byte validation, and execute TorchScript Mel-Spectrogram anomaly classification in sub-second latency.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-slate-900/60 p-3 border border-white/5 font-mono text-xs">
            <Activity className="h-4 w-4 text-emerald-400" />
            <span className="text-slate-400">Model Engine:</span>
            <span className="text-white font-bold">TorchScript CNN v1.0</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: Acquisition & Controls */}
        <div className="space-y-6 lg:col-span-7">
          {/* Equipment Selection */}
          <div className="rounded-2xl border border-white/[0.08] bg-industrial-panel/90 p-6 backdrop-blur-xl shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#3ECF8E]/20 text-[#3ECF8E] text-xs">1</span>
                Target Equipment Asset
              </h3>
              {selectedMachine && (
                <StatusBadge status={selectedMachine.status} size="sm" />
              )}
            </div>

            {loadingMachines ? (
              <p className="text-xs font-mono text-slate-500">Loading equipment roster...</p>
            ) : (
              <select
                id="select-machine"
                value={selectedMachineId}
                onChange={(e) => setSelectedMachineId(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#1C1C1C] p-3.5 text-xs font-mono text-white focus:border-[#3ECF8E] focus:outline-none transition-colors"
              >
                <option value="">-- Choose Machinery Target to Inspect --</option>
                {machines.map((m: Machine) => (
                  <option key={m.id} value={m.id}>
                    {m.name} [{m.machineType}] • SN: {m.serialNumber} • {m.location} ({m.status})
                  </option>
                ))}
              </select>
            )}

            {selectedMachine && (
              <div className="mt-3.5 rounded-xl border border-white/5 bg-slate-900/40 p-3 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-400">
                <span>Asset: <strong className="text-white">{selectedMachine.name}</strong></span>
                <span>Type: <strong className="text-[#3ECF8E]">{selectedMachine.machineType}</strong></span>
                <span>Yard: <strong className="text-slate-200">{selectedMachine.location}</strong></span>
              </div>
            )}
          </div>

          {/* Audio Acquisition Component */}
          <AudioRecorder
            onAudioReady={(blob, name) => setAudioFile({ blob, name })}
            disabled={diagnosticMutation.isPending}
          />

          {/* Alternative File Dropzone */}
          <div className="rounded-2xl border border-dashed border-white/10 bg-industrial-panel/50 p-5 text-center hover:border-[#3ECF8E]/40 transition-colors">
            <label className="cursor-pointer block">
              <Upload className="mx-auto h-6 w-6 text-[#3ECF8E]/80 mb-2" />
              <span className="font-mono text-xs text-slate-200 font-semibold">
                Or upload pre-recorded 16kHz WAV file (Max 10 MB)
              </span>
              <p className="text-[10px] font-mono text-slate-400 mt-1">
                Protected by strict RIFF/WAVE header validation & executable defense
              </p>
              <input
                id="input-file-upload"
                type="file"
                accept=".wav,audio/wav"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {audioFile && (
              <div className="mt-3.5 inline-flex items-center gap-2 rounded-lg border border-[#3E3E3E]/80 bg-[#2A2A2A]/40 px-3 py-1.5 text-xs font-mono text-[#3ECF8E] shadow-[0_0_12px_-2px_rgba(62,207,142,0.3)]">
                <FileAudio className="h-4 w-4 text-[#3ECF8E]" />
                <span>Selected: {audioFile.name} ({(audioFile.blob.size / 1024).toFixed(1)} KB)</span>
              </div>
            )}
          </div>

          {/* Field Observation Notes & Trigger Button */}
          <div className="rounded-2xl border border-white/[0.08] bg-industrial-panel/90 p-6 backdrop-blur-xl shadow-xl space-y-4">
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#3ECF8E]/20 text-[#3ECF8E] text-xs">2</span>
              Field Observations & Notes
            </h3>
            <textarea
              id="input-tech-notes"
              rows={2}
              value={technicianNotes}
              onChange={(e) => setTechnicianNotes(e.target.value)}
              placeholder="e.g. Higher acoustic pitch heard near bearing seal during 80% throttle ramp test..."
              className="w-full rounded-xl border border-white/10 bg-[#1C1C1C] p-3 text-xs font-mono text-white placeholder-slate-500 focus:border-[#3ECF8E] focus:outline-none transition-colors"
            />

            <button
              id="btn-run-diagnostic"
              onClick={() => diagnosticMutation.mutate()}
              disabled={!audioFile || !selectedMachineId || diagnosticMutation.isPending}
              className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#3ECF8E] hover:bg-[#24B47E] text-[#1C1C1C] py-3.5 text-xs font-mono font-bold uppercase tracking-wider shadow-[0_0_20px_-3px_rgba(62,207,142,0.5)] hover:shadow-[0_0_25px_-2px_rgba(62,207,142,0.6)] transition-all disabled:opacity-40 disabled:pointer-events-none"
            >
              <Zap className="h-4 w-4 text-white" />
              {diagnosticMutation.isPending
                ? 'Running TorchScript ML Inference...'
                : 'Execute Sub-Second AI Diagnostic Inference'}
            </button>

            {diagnosticMutation.isError && (
              <p className="text-xs font-mono text-rose-400 flex items-center gap-1.5 pt-1">
                ⚠️ {(diagnosticMutation.error as any).message}
              </p>
            )}
          </div>
        </div>

        {/* Right Column: AI Telemetry & Evaluation Results */}
        <div className="space-y-6 lg:col-span-5">
          {evaluationResult ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              {/* Verdict Card */}
              <div
                className={`relative overflow-hidden rounded-2xl border p-6 backdrop-blur-xl shadow-2xl ${
                  evaluationResult.prediction.isAnomaly
                    ? 'border-rose-500/40 bg-gradient-to-b from-rose-950/60 to-[#232323]'
                    : 'border-emerald-500/40 bg-gradient-to-b from-emerald-950/60 to-[#232323]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs uppercase tracking-wider text-slate-300">
                    Model Inference Result
                  </span>
                  <span className="flex items-center gap-1.5 font-mono text-xs text-[#3ECF8E] bg-[#2A2A2A]/70 border border-[#3E3E3E]/60 rounded-full px-3 py-0.5">
                    <Clock className="h-3 w-3 text-[#3ECF8E]" />
                    {evaluationResult.prediction.inferenceLatencyMs} ms
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-4">
                  {evaluationResult.prediction.isAnomaly ? (
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 shadow-[0_0_20px_-3px_rgba(244,63,94,0.5)]">
                      <AlertCircle className="h-7 w-7" />
                    </div>
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 shadow-[0_0_20px_-3px_rgba(62,207,142,0.5)]">
                      <CheckCircle className="h-7 w-7" />
                    </div>
                  )}

                  <div>
                    <h2 className="font-display text-xl font-black tracking-tight text-white uppercase">
                      {evaluationResult.prediction.predictedClass === 'Anomaly'
                        ? 'CRITICAL ANOMALY DETECTED'
                        : 'NOMINAL / HEALTHY OPERATION'}
                    </h2>
                    <p className="text-xs font-mono text-slate-300 mt-1">
                      Confidence Score: <strong className="text-white">{(evaluationResult.prediction.confidenceScore * 100).toFixed(1)}%</strong>
                    </p>
                  </div>
                </div>

                {/* Probability Distribution Bar */}
                <div className="mt-6 space-y-1.5">
                  <div className="flex justify-between text-xs font-mono text-slate-300">
                    <span>Normal: {(evaluationResult.prediction.probabilities.normal * 100).toFixed(1)}%</span>
                    <span>Anomaly: {(evaluationResult.prediction.probabilities.anomaly * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-slate-900 border border-white/5 flex">
                    <div
                      style={{ width: `${evaluationResult.prediction.probabilities.normal * 100}%` }}
                      className="bg-emerald-500 h-full transition-all duration-700"
                    />
                    <div
                      style={{ width: `${evaluationResult.prediction.probabilities.anomaly * 100}%` }}
                      className="bg-rose-500 h-full transition-all duration-700"
                    />
                  </div>
                </div>

                {/* Auto Work Order Alert Banner */}
                {evaluationResult.ticket && (
                  <div className="mt-5 rounded-xl border border-rose-500/40 bg-rose-950/70 p-4 text-xs font-mono text-rose-200 shadow-lg">
                    <div className="flex items-center gap-2 font-bold text-rose-300 mb-1">
                      <ShieldAlert className="h-4 w-4" />
                      <span>Automatic Work Order Raised</span>
                    </div>
                    <p className="text-[11px] text-rose-200">
                      Ticket #{evaluationResult.ticket.id.slice(0, 8)} • Priority: {evaluationResult.ticket.priority}
                    </p>
                    <div className="mt-3">
                      <Link
                        to="/tickets"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1 text-xs font-mono font-bold text-white hover:bg-rose-500 transition-colors"
                      >
                        Review in Work Orders →
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Acoustic DSP Telemetry Cards */}
              <div className="rounded-2xl border border-white/[0.08] bg-industrial-panel/90 p-6 backdrop-blur-xl shadow-xl">
                <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-[#3ECF8E]" />
                  Acoustic DSP Frequency Telemetry
                </h3>

                <div className="grid grid-cols-2 gap-3.5 font-mono">
                  <div className="rounded-xl border border-white/5 bg-[#1C1C1C] p-3.5">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">RMS Energy</p>
                    <p className="text-xl font-bold text-white mt-1">
                      {evaluationResult.telemetry.rmsEnergyDb} <span className="text-xs text-slate-500">dB</span>
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-[#1C1C1C] p-3.5">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Spectral Centroid</p>
                    <p className="text-xl font-bold text-[#3ECF8E] mt-1">
                      {evaluationResult.telemetry.spectralCentroidHz} <span className="text-xs text-slate-500">Hz</span>
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-[#1C1C1C] p-3.5">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Dominant Peak</p>
                    <p className="text-xl font-bold text-amber-400 mt-1">
                      {evaluationResult.telemetry.dominantFrequencyHz} <span className="text-xs text-slate-500">Hz</span>
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-[#1C1C1C] p-3.5">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Zero-Crossing Rate</p>
                    <p className="text-xl font-bold text-emerald-400 mt-1">
                      {evaluationResult.telemetry.zeroCrossingRate}
                    </p>
                  </div>
                </div>
              </div>

              {/* Mel Spectrogram Heatmap */}
              <HeatmapView data={evaluationResult.telemetry.previewHeatmap} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-industrial-panel/50 p-12 text-center text-slate-500">
              <Cpu className="h-14 w-14 text-slate-600 mb-3" />
              <p className="font-mono text-sm text-slate-300 font-semibold">
                Awaiting Acoustic Signal Evaluation
              </p>
              <p className="text-xs font-sans text-slate-400 mt-1.5 max-w-xs leading-relaxed">
                Select an equipment asset, capture live audio or click one of the 3 simulated presets, and trigger diagnostic inference.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
