import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Cpu, Volume2, Sparkles, CheckCircle2, AlertTriangle, Radio } from 'lucide-react';

interface AudioRecorderProps {
  onAudioReady: (blob: Blob, fileName: string) => void;
  disabled?: boolean;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ onAudioReady, disabled }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioFileName, setAudioFileName] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [decibels, setDecibels] = useState(-54);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const recordedChunksRef = useRef<Float32Array[]>([]);
  const timerIntervalRef = useRef<any>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

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
      setAudioFileName(null);
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

      const processor = audioCtx.createScriptProcessor(2048, 1, 1);
      source.connect(processor);
      processor.connect(audioCtx.destination);

      processor.onaudioprocess = (e) => {
        if (!isRecording) return;
        const channelData = e.inputBuffer.getChannelData(0);
        recordedChunksRef.current.push(new Float32Array(channelData));
      };

      setIsRecording(true);

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 4) {
            stopRecording();
            return 4;
          }
          return prev + 1;
        });
      }, 1000);

      drawWaveform();
    } catch (err: any) {
      alert(`Microphone notice: ${err.message}. You can use the "⚡ 1-Click Simulation Presets" below to test the AI model instantly!`);
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

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
      const name = `live_mic_capture_${Date.now()}.wav`;
      setAudioUrl(url);
      setAudioFileName(name);
      onAudioReady(wavBlob, name);
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

      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        const val = (dataArray[i] - 128) / 128;
        sum += val * val;
      }
      const rms = Math.sqrt(sum / bufferLength);
      const db = Math.round(20 * Math.log10(Math.max(rms, 1e-4)));
      setDecibels(db);

      ctx.fillStyle = '#1C1C1C';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Oscilloscope Grid Lines
      ctx.strokeStyle = 'rgba(28, 39, 64, 0.4)';
      ctx.lineWidth = 1;
      for (let y = 20; y < canvas.height; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Neon Waveform Line
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#3ECF8E';
      ctx.shadowColor = '#3ECF8E';
      ctx.shadowBlur = 10;
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
      ctx.shadowBlur = 0;
    };

    render();
  };

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
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
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

  const simulateAudio = (type: 'healthy' | 'cavitation' | 'bearing') => {
    const sampleRate = 16000;
    const duration = 3.0;
    const samples = new Float32Array(sampleRate * duration);

    for (let i = 0; i < samples.length; i++) {
      const t = i / sampleRate;
      if (type === 'cavitation') {
        // High frequency turbulent bubble collapse and broadband noise
        samples[i] =
          0.35 * Math.sin(2 * Math.PI * 180 * t) +
          0.3 * Math.sin(2 * Math.PI * 540 * t) +
          0.25 * Math.sin(2 * Math.PI * 1420 * t) +
          0.3 * (Math.random() * 2 - 1);
      } else if (type === 'bearing') {
        // Impact friction spikes simulating spalled outer race fault
        const pulse = (i % (sampleRate / 25)) < 120 ? 0.6 : 0;
        samples[i] =
          0.4 * Math.sin(2 * Math.PI * 350 * t) +
          pulse +
          0.2 * (Math.random() * 2 - 1);
      } else {
        // Clean, nominal 60Hz machine fundamental hum with minimal harmonics
        samples[i] =
          0.75 * Math.sin(2 * Math.PI * 60 * t) +
          0.2 * Math.sin(2 * Math.PI * 120 * t) +
          0.04 * (Math.random() * 2 - 1);
      }
    }

    const wavBlob = encodeWav(samples, sampleRate);
    const url = URL.createObjectURL(wavBlob);
    const names = {
      healthy: 'simulated_nominal_hum.wav',
      cavitation: 'simulated_pump_cavitation_fault.wav',
      bearing: 'simulated_bearing_friction_fault.wav',
    };
    const chosenName = names[type];
    setAudioUrl(url);
    setAudioFileName(chosenName);
    onAudioReady(wavBlob, chosenName);
  };

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#232323] p-6  shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2A2A2A]/60 border border-[#3E3E3E]/60 text-[#3ECF8E]">
            <Volume2 className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-display text-sm font-bold tracking-wide text-white uppercase">
              Acoustic Signal Acquisition
            </h3>
            <p className="text-[10px] font-mono text-slate-400">16,000 Hz Mono PCM Sensor Feed</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isRecording && (
            <span className="flex items-center gap-2 font-mono text-xs text-rose-400 font-bold animate-pulse bg-rose-950/50 border border-rose-800/60 px-3 py-1 rounded-full">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              LIVE CAPTURE: {recordingSeconds}s / 4s
            </span>
          )}
          <span className="rounded-md border border-white/5 bg-[#1C1C1C] px-2.5 py-1 font-mono text-xs text-[#3ECF8E]">
            {decibels} dB
          </span>
        </div>
      </div>

      {/* High-Tech Oscilloscope Canvas */}
      <div className="relative h-32 w-full overflow-hidden rounded-xl border border-white/[0.08] bg-[#1C1C1C] shadow-inner">
        <canvas
          ref={canvasRef}
          width={640}
          height={128}
          className="h-full w-full block"
        />

        {!isRecording && !audioUrl && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-xs font-mono text-slate-400 bg-[#1C1C1C]/40 backdrop-blur-[1px]">
            <Radio className="h-5 w-5 text-[#3ECF8E]/60 animate-pulse" />
            <span>Ready for acoustic signal capture or 1-click test preset</span>
          </div>
        )}

        {audioFileName && !isRecording && (
          <div className="absolute top-2 left-2 flex items-center gap-2 rounded-md bg-slate-900/80 border border-white/10 px-2.5 py-1 text-[10px] font-mono text-[#3ECF8E] ">
            <CheckCircle2 className="h-3 w-3 text-[#3ECF8E]" />
            <span>Loaded: {audioFileName}</span>
          </div>
        )}
      </div>

      {/* Main Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2">
          {!isRecording ? (
            <button
              id="btn-start-record"
              onClick={startRecording}
              disabled={disabled}
              className="flex items-center gap-2 rounded-xl bg-[#3E3E3E] hover:bg-[#4E4E4E] text-white px-4 py-2.5 text-xs font-mono font-bold shadow-[0_0_15px_-3px_rgba(62,207,142,0.4)] transition-all disabled:opacity-50"
            >
              <Mic className="h-4 w-4 text-white" /> Capture Microphone (16kHz)
            </button>
          ) : (
            <button
              id="btn-stop-record"
              onClick={stopRecording}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-500 px-4 py-2.5 text-xs font-mono font-bold text-white shadow-[0_0_15px_-3px_rgba(244,63,94,0.4)] hover:brightness-110 transition-all"
            >
              <Square className="h-4 w-4" /> Stop & Finalize WAV
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
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/80 px-3.5 py-2.5 text-xs font-mono font-semibold text-slate-200 hover:border-[#3ECF8E]/40 hover:text-white transition-all"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4 text-amber-400" />
              ) : (
                <Play className="h-4 w-4 text-emerald-400" />
              )}
              {isPlaying ? 'Pause Audio' : 'Preview WAV'}
            </button>
          )}

          <audio
            ref={audioPlayerRef}
            src={audioUrl || ''}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />
        </div>

        {/* 1-Click Simulation Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-[#3ECF8E]" /> 1-Click Presets:
          </span>
          <button
            id="btn-sim-normal"
            onClick={() => simulateAudio('healthy')}
            disabled={isRecording || disabled}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-950/40 px-3 py-1.5 text-[11px] font-mono font-bold text-emerald-300 hover:bg-emerald-900/60 hover:border-emerald-400 shadow-[0_0_10px_-3px_rgba(62,207,142,0.2)] transition-all"
          >
            <CheckCircle2 className="h-3 w-3" /> Nominal Hum
          </button>
          <button
            id="btn-sim-cavitation"
            onClick={() => simulateAudio('cavitation')}
            disabled={isRecording || disabled}
            className="flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-950/40 px-3 py-1.5 text-[11px] font-mono font-bold text-rose-300 hover:bg-rose-900/60 hover:border-rose-400 shadow-[0_0_10px_-3px_rgba(244,63,94,0.2)] transition-all"
          >
            <AlertTriangle className="h-3 w-3" /> Pump Cavitation Fault
          </button>
          <button
            id="btn-sim-bearing"
            onClick={() => simulateAudio('bearing')}
            disabled={isRecording || disabled}
            className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-950/40 px-3 py-1.5 text-[11px] font-mono font-bold text-amber-300 hover:bg-amber-900/60 hover:border-amber-400 shadow-[0_0_10px_-3px_rgba(245,158,11,0.2)] transition-all"
          >
            <AlertTriangle className="h-3 w-3" /> Bearing Friction Fault
          </button>
        </div>
      </div>
    </div>
  );
};
