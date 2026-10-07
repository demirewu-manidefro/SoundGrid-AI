import sys
import time
from contextlib import asynccontextmanager
from typing import Dict, Any

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

from fastapi import FastAPI, UploadFile, File, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
import torch
import torch.nn.functional as F
import numpy as np

from config import AIConfig
from utils.audio_processor import AudioProcessor

# Global model holder
model_state: Dict[str, Any] = {
    "model": None,
    "device": "cpu",
    "version": "1.0.0-torchscript",
    "is_ready": False,
}

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load TorchScript model
    device = torch.device("cpu")
    model_state["device"] = str(device)
    
    if not AIConfig.MODEL_PATH.exists():
        raise RuntimeError(f"TorchScript model file not found at {AIConfig.MODEL_PATH}")

    try:
        print(f"[LOAD] Loading TorchScript model from {AIConfig.MODEL_PATH}...")
        model = torch.jit.load(str(AIConfig.MODEL_PATH), map_location=device)
        model.eval()

        # Warmup forward pass with dummy input
        dummy_input = torch.randn(1, 1, AIConfig.N_MELS, AIConfig.EXPECTED_TIME_FRAMES, device=device)
        with torch.no_grad():
            warmup_out = model(dummy_input)
            print(f"[WARMUP] Model warmed up successfully. Test logits: {warmup_out.tolist()}")

        model_state["model"] = model
        model_state["is_ready"] = True
        print(f"[READY] SoundGrid AI Inference Engine initialized on port {AIConfig.PORT}")
    except Exception as e:
        print(f"[ERROR] Failed to load TorchScript model: {e}")
        raise e

    yield

    # Teardown
    model_state["is_ready"] = False
    model_state["model"] = None

app = FastAPI(
    title="SoundGrid Sentinel AI Inference Microservice",
    description="Sub-second TorchScript acoustic feature extraction and anomaly classification engine",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/internal/health")
async def health():
    return {
        "status": "HEALTHY" if model_state["is_ready"] else "UNREADY",
        "engine": "SoundGrid TorchScript Runtime",
        "modelPath": str(AIConfig.MODEL_PATH.name),
        "device": model_state["device"],
        "sampleRate": AIConfig.SAMPLE_RATE,
        "classes": AIConfig.CLASSES,
    }

@app.post("/internal/predict")
async def predict_acoustic_anomaly(file: UploadFile = File(...)):
    if not model_state["is_ready"] or model_state["model"] is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI inference engine is not ready or model failed to load",
        )

    t0 = time.perf_counter()

    # Read audio bytes
    audio_bytes = await file.read()
    if not audio_bytes or len(audio_bytes) < 44:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or empty audio payload provided",
        )

    try:
        # 1. Load and resample audio
        audio_data, sr = AudioProcessor.load_audio_from_bytes(audio_bytes)

        # 2. Extract Spectrogram tensor (1, 1, 128, 94)
        input_tensor = AudioProcessor.preprocess_spectrogram(audio_data, sr=sr)

        # 3. Model Inference (TorchScript runtime)
        with torch.no_grad():
            logits = model_state["model"](input_tensor)
            probs = F.softmax(logits, dim=1).squeeze(0)

        prob_normal = float(probs[0].item())
        prob_anomaly = float(probs[1].item())

        is_anomaly = prob_anomaly > 0.5
        predicted_class = "Anomaly" if is_anomaly else "Normal"
        confidence_score = float(max(prob_normal, prob_anomaly))

        # 4. Extract Acoustic Telemetry
        telemetry = AudioProcessor.extract_telemetry_features(audio_data, sr=sr)

        latency_ms = (time.perf_counter() - t0) * 1000.0

        return {
            "success": True,
            "prediction": {
                "isAnomaly": is_anomaly,
                "predictedClass": predicted_class,
                "confidenceScore": round(confidence_score, 4),
                "probabilities": {
                    "normal": round(prob_normal, 4),
                    "anomaly": round(prob_anomaly, 4),
                },
                "inferenceLatencyMs": round(latency_ms, 2),
            },
            "telemetry": telemetry,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference error during feature processing: {str(e)}",
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=AIConfig.HOST, port=AIConfig.PORT)
