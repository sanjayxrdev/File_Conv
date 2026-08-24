from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime

class UserBase(BaseModel):
    email: str = Field(..., description="User email address")
    name: str

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(UserBase):
    id: str
    created_at: str
    total_conversions: int = 0
    plan: str = "Free Community"

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class HistoryItem(BaseModel):
    id: str
    job_id: str
    original_filename: str
    source_format: str
    target_format: str
    status: str
    download_url: Optional[str] = None
    output_size_bytes: Optional[int] = None
    created_at: str
    user_id: Optional[str] = None
    session_id: Optional[str] = None

class AddHistoryRequest(BaseModel):
    job_id: str
    original_filename: str
    source_format: str
    target_format: str
    status: str
    download_url: Optional[str] = None
    output_size_bytes: Optional[int] = None
    session_id: Optional[str] = None
