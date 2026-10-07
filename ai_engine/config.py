import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

class AIConfig:
    HOST: str = os.getenv("AI_ENGINE_HOST", "127.0.0.1")
    PORT: int = int(os.getenv("AI_ENGINE_PORT", "8001"))
    MODEL_PATH: Path = BASE_DIR / "models" / "soundgrid_web_model.pt"
    
    # Audio Feature Extraction Parameters (matches trained TorchScript CNN)
    SAMPLE_RATE: int = 16000
    TARGET_DURATION: float = 3.0  # seconds
    TARGET_SAMPLES: int = int(SAMPLE_RATE * TARGET_DURATION)  # 48,000 samples
    N_MELS: int = 128
    HOP_LENGTH: int = 512
    N_FFT: int = 2048
    TOP_DB_TRIM: float = 25.0
    
    # Expected model input shape: (1, 1, 128, 94)
    EXPECTED_TIME_FRAMES: int = 94
    
    # Classification Classes
    CLASSES = ["Normal", "Anomaly"]
