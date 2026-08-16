import os
import re
import mimetypes
from typing import Tuple, Optional
from fastapi import UploadFile, HTTPException, status
from app.core.config import settings
from app.registry.conversion_registry import ConversionRegistry

FILENAME_CLEAN_REGEX = re.compile(r"[^a-zA-Z0-9_\-\.]")

class ValidationService:
    @staticmethod
    def sanitize_filename(filename: str) -> str:
        """Strip directory traversal elements and unsafe characters."""
        base_name = os.path.basename(filename)
        sanitized = FILENAME_CLEAN_REGEX.sub("_", base_name)
        return sanitized or "uploaded_file"

    @staticmethod
    def extract_extension(filename: str) -> str:
        parts = filename.rsplit(".", 1)
        if len(parts) > 1:
            return parts[1].lower()
        return ""

    @staticmethod
    def validate_file_and_target(
        file: UploadFile,
        target_format: str
    ) -> Tuple[str, str, str]:
        """
        Validates source file and target format.
        Returns: (sanitized_filename, source_ext, target_ext)
        """
        if not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "INVALID_FILENAME", "message": "Uploaded file has no filename."}
            )

        sanitized_name = ValidationService.sanitize_filename(file.filename)
        source_ext = ValidationService.extract_extension(sanitized_name)
        target_ext = target_format.lower().lstrip(".")

        if not source_ext:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "MISSING_EXTENSION", "message": f"File '{sanitized_name}' has no extension."}
            )

        # Check source support in ConversionRegistry
        supported_sources = ConversionRegistry.get_supported_source_formats()
        if source_ext not in supported_sources:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "UNSUPPORTED_SOURCE_FORMAT",
                    "message": f"Source format '{source_ext}' is not supported.",
                    "supported_sources": supported_sources
                }
            )

        # Check conversion route in ConversionRegistry
        if not ConversionRegistry.is_conversion_supported(source_ext, target_ext):
            source_info = ConversionRegistry.get_source_info(source_ext)
            valid_targets = [t.target_ext for t in source_info.targets] if source_info else []
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "UNSUPPORTED_CONVERSION_ROUTE",
                    "message": f"Cannot convert '{source_ext.upper()}' to '{target_ext.upper()}'. This conversion is not supported.",
                    "valid_targets": valid_targets
                }
            )

        return sanitized_name, source_ext, target_ext
