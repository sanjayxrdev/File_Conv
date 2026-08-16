from typing import Dict, List, Optional, Any
from pydantic import BaseModel

class FormatOption(BaseModel):
    name: str
    label: str
    type: str  # "select", "number", "boolean", "range"
    default: Any
    options: Optional[List[Any]] = None
    min: Optional[float] = None
    max: Optional[float] = None
    step: Optional[float] = None
    description: Optional[str] = None

class TargetFormatInfo(BaseModel):
    target_ext: str
    label: str
    engine: str
    category: str
    is_lossy: bool = False
    options: List[FormatOption] = []

class SourceFormatInfo(BaseModel):
    ext: str
    label: str
    category: str
    mime_types: List[str]
    targets: List[TargetFormatInfo]

class FormatsRegistryResponse(BaseModel):
    categories: List[str]
    formats: Dict[str, SourceFormatInfo]
