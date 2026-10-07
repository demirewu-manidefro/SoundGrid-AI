import io
from typing import Dict, Any, Tuple
import numpy as np
import soundfile as sf
import scipy.signal
import torch

from config import AIConfig

def hz_to_mel(hz: float) -> float:
    return 2595.0 * np.log10(1.0 + hz / 700.0)

def mel_to_hz(mel: float) -> float:
    return 700.0 * (10.0 ** (mel / 2595.0) - 1.0)

def create_mel_filterbank(sr: int = 16000, n_fft: int = 2048, n_mels: int = 128) -> torch.Tensor:
    fmin, fmax = 0.0, sr / 2.0
    mel_points = np.linspace(hz_to_mel(fmin), hz_to_mel(fmax), n_mels + 2)
    hz_points = mel_to_hz(mel_points)
    bin_points = np.floor((n_fft + 1) * hz_points / sr).astype(int)

    weights = np.zeros((n_mels, n_fft // 2 + 1), dtype=np.float32)
    for i in range(n_mels):
        left, center, right = bin_points[i], bin_points[i + 1], bin_points[i + 2]
        for j in range(left, center):
            if center > left:
                weights[i, j] = (j - left) / (center - left)
        for j in range(center, right):
            if right > center:
                weights[i, j] = (right - j) / (right - center)
        enorm = 2.0 / (hz_points[i + 2] - hz_points[i] + 1e-6)
        weights[i] *= enorm

    return torch.tensor(weights, dtype=torch.float32)

# Precomputed Mel Basis matrix
MEL_FILTERBANK = create_mel_filterbank(
    sr=AIConfig.SAMPLE_RATE,
    n_fft=AIConfig.N_FFT,
    n_mels=AIConfig.N_MELS,
)

class AudioProcessor:
    @staticmethod
    def load_audio_from_bytes(file_bytes: bytes) -> Tuple[np.ndarray, int]:
        """
        Loads raw audio bytes into normalized mono NumPy array at 16,000 Hz.
        """
        bio = io.BytesIO(file_bytes)
        audio, sr = sf.read(bio, dtype='float32')

        # Convert stereo to mono
        if audio.ndim > 1:
            audio = np.mean(audio, axis=1)

        # Resample to 16,000 Hz if needed
        if sr != AIConfig.SAMPLE_RATE:
            target_len = int(len(audio) * AIConfig.SAMPLE_RATE / sr)
            audio = scipy.signal.resample(audio, target_len).astype(np.float32)
            sr = AIConfig.SAMPLE_RATE

        return audio, sr

    @staticmethod
    def preprocess_spectrogram(audio: np.ndarray, sr: int = AIConfig.SAMPLE_RATE) -> torch.Tensor:
        """
        Processes audio waveform into the exact Mel-Spectrogram shape (1, 1, 128, 94)
        expected by the pre-trained TorchScript SoundGrid CNN.
        """
        # Trim silence (simple thresholding)
        abs_audio = np.abs(audio)
        threshold = 10 ** (-AIConfig.TOP_DB_TRIM / 20.0) * np.max(abs_audio) if np.max(abs_audio) > 0 else 0
        non_silent = np.where(abs_audio > threshold)[0]
        if len(non_silent) > 0:
            start_idx = max(0, non_silent[0] - 512)
            end_idx = min(len(audio), non_silent[-1] + 512)
            audio = audio[start_idx:end_idx]

        # Fix length to 48,000 samples (3.0s)
        if len(audio) > AIConfig.TARGET_SAMPLES:
            audio = audio[:AIConfig.TARGET_SAMPLES]
        else:
            audio = np.pad(audio, (0, AIConfig.TARGET_SAMPLES - len(audio)))

        audio_tensor = torch.tensor(audio, dtype=torch.float32)

        # PyTorch STFT with Hann Window -> (1025, 94) frames
        window = torch.hann_window(AIConfig.N_FFT)
        stft = torch.stft(
            audio_tensor,
            n_fft=AIConfig.N_FFT,
            hop_length=AIConfig.HOP_LENGTH,
            win_length=AIConfig.N_FFT,
            window=window,
            center=True,
            return_complex=True,
        )

        power = torch.abs(stft) ** 2
        mel_spec = torch.matmul(MEL_FILTERBANK, power)

        # Power to dB
        spec_db = 10.0 * torch.log10(torch.clamp(mel_spec, min=1e-10))

        # Min-Max Normalization to [0, 1]
        spec_min = spec_db.min()
        spec_max = spec_db.max()
        spec_norm = (spec_db - spec_min) / (spec_max - spec_min + 1e-6)

        # Exact shape alignment: (1, 1, 128, 94)
        if spec_norm.shape[1] > AIConfig.EXPECTED_TIME_FRAMES:
            spec_norm = spec_norm[:, :AIConfig.EXPECTED_TIME_FRAMES]
        elif spec_norm.shape[1] < AIConfig.EXPECTED_TIME_FRAMES:
            diff = AIConfig.EXPECTED_TIME_FRAMES - spec_norm.shape[1]
            spec_norm = torch.nn.functional.pad(spec_norm, (0, diff))

        return spec_norm.unsqueeze(0).unsqueeze(0)

    @staticmethod
    def extract_telemetry_features(audio: np.ndarray, sr: int = AIConfig.SAMPLE_RATE) -> Dict[str, Any]:
        """
        Calculates industrial telemetry metrics: RMS energy, spectral centroid,
        dominant frequency, zero-crossing rate, and downsampled spectrogram heatmap.
        """
        # 1. RMS Energy
        rms = float(np.sqrt(np.mean(audio**2) + 1e-9))
        rms_db = float(20 * np.log10(max(rms, 1e-5)))

        # 2. FFT Spectral Analysis
        n = len(audio)
        if n > 0:
            fft_vals = np.abs(np.fft.rfft(audio))
            freqs = np.fft.rfftfreq(n, d=1.0 / sr)

            sum_fft = np.sum(fft_vals) + 1e-9
            spectral_centroid = float(np.sum(freqs * fft_vals) / sum_fft)
            spectral_bandwidth = float(np.sqrt(np.sum(((freqs - spectral_centroid) ** 2) * fft_vals) / sum_fft))

            peak_idx = int(np.argmax(fft_vals))
            dominant_frequency = float(freqs[peak_idx])
        else:
            spectral_centroid = 0.0
            spectral_bandwidth = 0.0
            dominant_frequency = 0.0

        # 3. Zero Crossing Rate
        zero_crossings = np.nonzero(np.diff(audio > 0))[0]
        zero_crossing_rate = float(len(zero_crossings) / max(1, len(audio)))

        # 4. Downsampled 32x20 Heatmap Preview for UI
        audio_tensor = torch.tensor(audio[:AIConfig.TARGET_SAMPLES], dtype=torch.float32)
        window = torch.hann_window(1024)
        stft = torch.stft(
            audio_tensor,
            n_fft=1024,
            hop_length=max(1, len(audio_tensor) // 20),
            win_length=1024,
            window=window,
            center=True,
            return_complex=True,
        )
        spec = torch.abs(stft)[:32, :20]
        preview_grid = np.round(spec.numpy(), 2).tolist()

        return {
            "rmsEnergyDb": round(rms_db, 2),
            "spectralCentroidHz": round(spectral_centroid, 1),
            "spectralBandwidthHz": round(spectral_bandwidth, 1),
            "dominantFrequencyHz": round(dominant_frequency, 1),
            "zeroCrossingRate": round(zero_crossing_rate, 4),
            "previewHeatmap": preview_grid,
        }
