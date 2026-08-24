from enum import Enum
from typing import Optional, Any, Dict
from pydantic import BaseModel, Field

class JobStatus(str, Enum):
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class Category(str, Enum):
    VIDEO = "video"
    AUDIO = "audio"
    IMAGE = "image"
    DOCUMENT = "document"
    TEXT = "text"
    OCR = "ocr"

class ConversionRequest(BaseModel):
    target_format: str
    conversion_options: Optional[Dict[str, Any]] = None

class ConversionJob(BaseModel):
    job_id: str
    original_filename: str
    source_format: str
    target_format: str
    category: Category
    status: JobStatus = JobStatus.QUEUED
    progress: int = Field(default=0, ge=0, le=100)
    message: Optional[str] = "Job queued"
    error: Optional[str] = None
    input_path: Optional[str] = None
    output_path: Optional[str] = None
    download_url: Optional[str] = None
    created_at: float
    completed_at: Optional[float] = None
    file_size_bytes: Optional[int] = None
    output_size_bytes: Optional[int] = None

class ErrorDetail(BaseModel):
    code: str
    message: str
    details: Optional[Any] = None

class ErrorResponse(BaseModel):
    error: ErrorDetail
