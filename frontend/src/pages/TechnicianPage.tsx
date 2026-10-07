import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, Machine } from '../api/client';
import { AudioRecorder } from '../components/audio/AudioRecorder';
import { HeatmapView } from '../components/common/HeatmapView';
import { StatusBadge } from '../components/common/StatusBadge';
import { Radio, AlertCircle, CheckCircle, Upload, Zap, FileAudio, Clock, Activity, Cpu } from 'lucide-react';

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
        throw new Error('Please select a machine and record or upload audio.');
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Radio className="h-5 w-5 text-sky-400" />
          <h1 className="font-mono text-xl font-bold tracking-tight text-white uppercase">
            Field Acoustic Diagnostic Console
          </h1>
        </div>
        <p className="text-xs font-mono text-slate-400 mt-1">
          Perform live vibration audio acquisition, deep magic-byte inspection, and TorchScript ML fault inference
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Acquisition & Inputs */}
        <div className="space-y-6 lg:col-span-7">
          {/* Machine Selection Card */}
          <div className="rounded-xl border border-industrial-border bg-industrial-panel p-5 shadow-lg">
            <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-white mb-3">
              1. Select Equipment to Inspect
            </h3>

            {loadingMachines ? (
              <p className="text-xs font-mono text-slate-500">Loading equipment roster...</p>
            ) : (
              <select
                id="select-machine"
                value={selectedMachineId}
                onChange={(e) => setSelectedMachineId(e.target.value)}
                className="w-full rounded-lg border border-industrial-border bg-[#0B0F19] p-3 text-xs font-mono text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="">-- Choose Machine Target --</option>
                {machines.map((m: Machine) => (
                  <option key={m.id} value={m.id}>
                    {m.name} [{m.machineType}] - {m.serialNumber} ({m.location})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Audio Acquisition */}
          <AudioRecorder
            onAudioReady={(blob, name) => setAudioFile({ blob, name })}
            disabled={diagnosticMutation.isPending}
          />

          {/* Or File Dropzone Upload */}
          <div className="rounded-xl border border-dashed border-industrial-border bg-industrial-panel p-5 text-center">
            <label className="cursor-pointer block">
              <Upload className="mx-auto h-6 w-6 text-slate-400 mb-2" />
              <span className="font-mono text-xs text-slate-300">
                Or upload pre-recorded 16kHz WAV file (Max 10 MB)
              </span>
              <p className="text-[10px] font-mono text-slate-500 mt-1">
                Enforces strict RIFF/WAVE magic byte verification
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
              <div className="mt-3 flex items-center justify-center gap-2 rounded-lg border border-sky-800 bg-sky-950/40 p-2 text-xs font-mono text-sky-300">
                <FileAudio className="h-4 w-4" />
                <span>Selected: {audioFile.name} ({(audioFile.blob.size / 1024).toFixed(1)} KB)</span>
              </div>
            )}
          </div>

          {/* Field Observation Notes */}
          <div className="rounded-xl border border-industrial-border bg-industrial-panel p-5 shadow-lg">
            <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-white mb-2">
              2. Technician Field Observations
            </h3>
            <textarea
              id="input-tech-notes"
              rows={2}
              value={technicianNotes}
              onChange={(e) => setTechnicianNotes(e.target.value)}
              placeholder="e.g. Higher acoustic pitch heard near bearing seal during 80% throttle test..."
              className="w-full rounded-lg border border-industrial-border bg-[#0B0F19] p-3 text-xs font-mono text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />

            <button
              id="btn-run-diagnostic"
              onClick={() => diagnosticMutation.mutate()}
              disabled={!audioFile || !selectedMachineId || diagnosticMutation.isPending}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-3 text-xs font-bold font-mono uppercase tracking-wider text-white shadow-lg hover:bg-indigo-500 transition-colors disabled:opacity-50"
            >
              <Zap className="h-4 w-4" />
              {diagnosticMutation.isPending
                ? 'Running TorchScript ML Inference...'
                : 'Execute Sub-Second AI Diagnostic'}
            </button>

            {diagnosticMutation.isError && (
              <p className="mt-2 text-xs font-mono text-rose-400">
                ⚠️ {(diagnosticMutation.error as any).message}
              </p>
            )}
          </div>
        </div>

        {/* Right Column: AI Telemetry & Evaluation Results */}
        <div className="space-y-6 lg:col-span-5">
          {evaluationResult ? (
            <>
              {/* Verdict Card */}
              <div
                className={`rounded-xl border p-6 shadow-xl ${
                  evaluationResult.prediction.isAnomaly
                    ? 'border-rose-800/80 bg-rose-950/30'
                    : 'border-emerald-800/80 bg-emerald-950/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs uppercase tracking-wider text-slate-400">
                    Diagnosis Classification
                  </span>
                  <span className="flex items-center gap-1 font-mono text-xs text-sky-400 bg-sky-950/60 border border-sky-800/60 rounded px-2 py-0.5">
                    <Clock className="h-3 w-3" />
                    {evaluationResult.prediction.inferenceLatencyMs} ms
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-3">
                  {evaluationResult.prediction.isAnomaly ? (
                    <AlertCircle className="h-8 w-8 text-rose-400 shrink-0" />
                  ) : (
                    <CheckCircle className="h-8 w-8 text-emerald-400 shrink-0" />
                  )}
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white font-mono">
                      {evaluationResult.prediction.predictedClass === 'Anomaly'
                        ? 'CRITICAL ANOMALY DETECTED'
                        : 'HEALTHY / NOMINAL OPERATION'}
                    </h2>
                    <p className="text-xs font-mono text-slate-300 mt-0.5">
                      Confidence Score: {(evaluationResult.prediction.confidenceScore * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* Probability Meter */}
                <div className="mt-5 space-y-1">
                  <div className="flex justify-between text-[11px] font-mono text-slate-400">
                    <span>Normal: {(evaluationResult.prediction.probabilities.normal * 100).toFixed(1)}%</span>
                    <span>Anomaly: {(evaluationResult.prediction.probabilities.anomaly * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800 flex">
                    <div
                      style={{ width: `${evaluationResult.prediction.probabilities.normal * 100}%` }}
                      className="bg-emerald-500 h-full transition-all duration-500"
                    />
                    <div
                      style={{ width: `${evaluationResult.prediction.probabilities.anomaly * 100}%` }}
                      className="bg-rose-500 h-full transition-all duration-500"
                    />
                  </div>
                </div>

                {/* Ticket Generation Notice */}
                {evaluationResult.ticket && (
                  <div className="mt-5 rounded-lg border border-rose-800 bg-rose-950/60 p-3 text-xs font-mono text-rose-300">
                    <p className="font-bold">🚨 Automatic Maintenance Work Order Created</p>
                    <p className="text-[11px] mt-1 text-rose-200">
                      Ticket ID: {evaluationResult.ticket.id} • Assigned priority: {evaluationResult.ticket.priority}
                    </p>
                  </div>
                )}
              </div>

              {/* Acoustic Metrics Grid */}
              <div className="rounded-xl border border-industrial-border bg-industrial-panel p-5 shadow-lg">
                <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-sky-400" /> Acoustic DSP Telemetry
                </h3>

                <div className="grid grid-cols-2 gap-3 font-mono">
                  <div className="rounded-lg border border-industrial-border bg-[#0B0F19] p-3">
                    <p className="text-[10px] text-slate-400">RMS Energy</p>
                    <p className="text-lg font-bold text-white mt-1">
                      {evaluationResult.telemetry.rmsEnergyDb} dB
                    </p>
                  </div>
                  <div className="rounded-lg border border-industrial-border bg-[#0B0F19] p-3">
                    <p className="text-[10px] text-slate-400">Spectral Centroid</p>
                    <p className="text-lg font-bold text-sky-400 mt-1">
                      {evaluationResult.telemetry.spectralCentroidHz} Hz
                    </p>
                  </div>
                  <div className="rounded-lg border border-industrial-border bg-[#0B0F19] p-3">
                    <p className="text-[10px] text-slate-400">Dominant Frequency</p>
                    <p className="text-lg font-bold text-amber-400 mt-1">
                      {evaluationResult.telemetry.dominantFrequencyHz} Hz
                    </p>
                  </div>
                  <div className="rounded-lg border border-industrial-border bg-[#0B0F19] p-3">
                    <p className="text-[10px] text-slate-400">Zero-Crossing Rate</p>
                    <p className="text-lg font-bold text-emerald-400 mt-1">
                      {evaluationResult.telemetry.zeroCrossingRate}
                    </p>
                  </div>
                </div>
              </div>

              {/* Heatmap */}
              <HeatmapView data={evaluationResult.telemetry.previewHeatmap} />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-industrial-border bg-industrial-panel p-12 text-center text-slate-500">
              <Cpu className="h-12 w-12 text-slate-600 mb-3" />
              <p className="font-mono text-xs text-slate-400">
                Awaiting acoustic signal evaluation
              </p>
              <p className="text-[11px] font-mono text-slate-600 mt-1 max-w-xs">
                Select machinery, record live audio or use a simulated sample, and trigger diagnostic inference.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
