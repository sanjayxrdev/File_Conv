import os
from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent.parent
STORAGE_DIR = BASE_DIR / "storage"

class Settings(BaseSettings):
    PROJECT_NAME: str = "FILE CONV"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Storage configuration
    STORAGE_DIR: Path = STORAGE_DIR
    UPLOAD_DIR: Path = STORAGE_DIR / "uploads"
    PROCESSING_DIR: Path = STORAGE_DIR / "processing"
    OUTPUT_DIR: Path = STORAGE_DIR / "outputs"
    FIXTURES_DIR: Path = BASE_DIR / "tests" / "fixtures"
    
    # Limits & Security
    MAX_UPLOAD_SIZE_MB: int = 250  # 250MB limit
    CONVERSION_TIMEOUT_SECONDS: int = 180  # 3 minutes
    CLEANUP_INTERVAL_MINUTES: int = 30
    FILE_RETENTION_MINUTES: int = 60
    
    # Executable paths
    FFMPEG_PATH: str = "ffmpeg"
    
    # CORS
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:8000"
    ]

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()

# Ensure directories exist
for folder in [settings.UPLOAD_DIR, settings.PROCESSING_DIR, settings.OUTPUT_DIR, settings.FIXTURES_DIR]:
    folder.mkdir(parents=True, exist_ok=True)
