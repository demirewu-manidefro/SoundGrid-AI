import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, RefreshCw, Cpu, Volume2 } from 'lucide-react';

interface AudioRecorderProps {
  onAudioReady: (blob: Blob, fileName: string) => void;
  disabled?: boolean;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ onAudioReady, disabled }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [decibels, setDecibels] = useState(-60);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const recordedChunksRef = useRef<Float32Array[]>([]);
  const timerIntervalRef = useRef<any>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopStreams();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const stopStreams = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  const startRecording = async () => {
    try {
      setAudioUrl(null);
      recordedChunksRef.current = [];
      setRecordingSeconds(0);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: false,
          noiseSuppression: false,
        },
      });

      mediaStreamRef.current = stream;
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000,
      });
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);
      analyserRef.current = analyser;

      // ScriptProcessor / AudioWorklet fallback for raw PCM capture
      const processor = audioCtx.createScriptProcessor(2048, 1, 1);
      source.connect(processor);
      processor.connect(audioCtx.destination);

      processor.onaudioprocess = (e) => {
        if (!isRecording) return;
        const channelData = e.inputBuffer.getChannelData(0);
        recordedChunksRef.current.push(new Float32Array(channelData));
      };

      setIsRecording(true);

      // Start recording timer
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 5) {
            // Auto stop at 5s (enough for 3s target model)
            stopRecording();
            return 5;
          }
          return prev + 1;
        });
      }, 1000);

      // Start visualizer loop
      drawWaveform();
    } catch (err: any) {
      alert(`Could not access microphone: ${err.message}. You can use "Simulate Acoustic Telemetry" below instead.`);
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    // Merge PCM chunks
    const totalLength = recordedChunksRef.current.reduce((acc, c) => acc + c.length, 0);
    const merged = new Float32Array(totalLength);
    let offset = 0;
    for (const chunk of recordedChunksRef.current) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }

    stopStreams();

    if (totalLength > 0) {
      const wavBlob = encodeWav(merged, 16000);
      const url = URL.createObjectURL(wavBlob);
      setAudioUrl(url);
      onAudioReady(wavBlob, `live_field_recording_${Date.now()}.wav`);
    }
  };

  const drawWaveform = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animFrameRef.current = requestAnimationFrame(render);
      analyser.getByteTimeDomainData(dataArray);

      // Compute approximate dB level
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        const val = (dataArray[i] - 128) / 128;
        sum += val * val;
      }
      const rms = Math.sqrt(sum / bufferLength);
      const db = Math.round(20 * Math.log10(Math.max(rms, 1e-4)));
      setDecibels(db);

      ctx.fillStyle = '#0B0F19';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 2;
      ctx.strokeStyle = '#38BDF8'; // Cyber Sky
      ctx.beginPath();

      const sliceWidth = (canvas.width * 1.0) / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };

    render();
  };

  /**
   * Encodes float32 PCM array into standard RIFF/WAVE 16-bit binary
   */
  const encodeWav = (samples: Float32Array, sampleRate = 16000): Blob => {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, 1, true); // Mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, samples.length * 2, true);

    let offset = 44;
    for (let i = 0; i < samples.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }

    return new Blob([buffer], { type: 'audio/wav' });
  };

  /**
   * Generates synthetic industrial acoustics (e.g. Pump Cavitation Anomaly or Normal Motor Hum)
   */
  const simulateAudio = (isAnomaly: boolean) => {
    const sampleRate = 16000;
    const duration = 3.0;
    const samples = new Float32Array(sampleRate * duration);

    for (let i = 0; i < samples.length; i++) {
      const t = i / sampleRate;
      if (isAnomaly) {
        // Friction + cavitation broadband harmonics
        samples[i] =
          0.4 * Math.sin(2 * Math.PI * 180 * t) +
          0.3 * Math.sin(2 * Math.PI * 540 * t) +
          0.3 * (Math.random() * 2 - 1);
      } else {
        // Clean 60Hz machine fundamental hum
        samples[i] =
          0.7 * Math.sin(2 * Math.PI * 60 * t) +
          0.2 * Math.sin(2 * Math.PI * 120 * t) +
          0.05 * (Math.random() * 2 - 1);
      }
    }

    const wavBlob = encodeWav(samples, sampleRate);
    const url = URL.createObjectURL(wavBlob);
    setAudioUrl(url);
    const name = isAnomaly ? 'simulated_fault_cavitation.wav' : 'simulated_normal_hum.wav';
    onAudioReady(wavBlob, name);
  };

  return (
    <div className="rounded-xl border border-industrial-border bg-industrial-panel p-5 shadow-lg">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Volume2 className="h-5 w-5 text-sky-400" />
          <h3 className="font-mono text-sm font-semibold tracking-wide text-white uppercase">
            Acoustic Signal Acquisition
          </h3>
        </div>
        <div className="flex items-center gap-3">
          {isRecording && (
            <span className="flex items-center gap-2 font-mono text-xs text-rose-400 font-bold animate-pulse">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              RECORDING {recordingSeconds}s / 5s
            </span>
          )}
          <span className="font-mono text-xs text-slate-400">
            {decibels} dB
          </span>
        </div>
      </div>

      {/* Waveform Canvas */}
      <div className="relative mb-4 h-28 w-full overflow-hidden rounded-lg border border-industrial-border bg-[#0B0F19]">
        <canvas
          ref={canvasRef}
          width={600}
          height={112}
          className="h-full w-full"
        />
        {!isRecording && !audioUrl && (
          <div className="absolute inset-0 flex items-center justify-center text-xs font-mono text-slate-500">
            Ready to capture live telemetry or simulate equipment audio
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {!isRecording ? (
            <button
              id="btn-start-record"
              onClick={startRecording}
              disabled={disabled}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-indigo-500 transition-colors disabled:opacity-50"
            >
              <Mic className="h-4 w-4" /> Start Live Mic (16kHz)
            </button>
          ) : (
            <button
              id="btn-stop-record"
              onClick={stopRecording}
              className="flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-rose-500 transition-colors"
            >
              <Square className="h-4 w-4" /> Stop & Process
            </button>
          )}

          {audioUrl && (
            <button
              id="btn-playback"
              onClick={() => {
                if (audioPlayerRef.current) {
                  if (isPlaying) {
                    audioPlayerRef.current.pause();
                    setIsPlaying(false);
                  } else {
                    audioPlayerRef.current.play();
                    setIsPlaying(true);
                  }
                }
              }}
              className="flex items-center gap-2 rounded-lg border border-industrial-border bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
            >
              {isPlaying ? <Pause className="h-4 w-4 text-amber-400" /> : <Play className="h-4 w-4 text-emerald-400" />}
              {isPlaying ? 'Pause' : 'Play Audio'}
            </button>
          )}

          <audio
            ref={audioPlayerRef}
            src={audioUrl || ''}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />
        </div>

        {/* Quick Simulation Options */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
            <Cpu className="h-3.5 w-3.5 text-slate-500" /> Quick Sim:
          </span>
          <button
            id="btn-sim-normal"
            onClick={() => simulateAudio(false)}
            disabled={isRecording || disabled}
            className="rounded border border-emerald-800/80 bg-emerald-950/40 px-2.5 py-1 text-[11px] font-mono text-emerald-300 hover:bg-emerald-900/60 transition-colors"
          >
            Healthy Hum
          </button>
          <button
            id="btn-sim-anomaly"
            onClick={() => simulateAudio(true)}
            disabled={isRecording || disabled}
            className="rounded border border-rose-800/80 bg-rose-950/40 px-2.5 py-1 text-[11px] font-mono text-rose-300 hover:bg-rose-900/60 transition-colors"
          >
            Fault Acoustic
          </button>
        </div>
      </div>
    </div>
  );
};
