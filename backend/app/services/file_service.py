import os
import uuid
import shutil
import logging
from pathlib import Path
from typing import Tuple
from fastapi import UploadFile, HTTPException, status
from app.core.config import settings

logger = logging.getLogger("file_service")

class FileService:
    @staticmethod
    async def save_uploaded_file(file: UploadFile, job_id: str, source_ext: str) -> Tuple[str, int]:
        """
        Saves uploaded file safely under storage/uploads/<job_id>.<source_ext> using chunked writing.
        Enforces maximum upload file size.
        Returns: (input_file_path, file_size_bytes)
        """
        dest_filename = f"{job_id}.{source_ext}"
        dest_path = settings.UPLOAD_DIR / dest_filename

        max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        bytes_written = 0

        try:
            with open(dest_path, "wb") as f_out:
                while chunk := await file.read(1024 * 1024):  # 1MB chunks
                    bytes_written += len(chunk)
                    if bytes_written > max_bytes:
                        dest_path.unlink(missing_ok=True)
                        raise HTTPException(
                            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                            detail={
                                "code": "FILE_TOO_LARGE",
                                "message": f"File size exceeds maximum allowed limit of {settings.MAX_UPLOAD_SIZE_MB}MB."
                            }
                        )
                    f_out.write(chunk)
            
            return str(dest_path), bytes_written
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to save upload for job {job_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={"code": "FILE_SAVE_ERROR", "message": f"Could not save uploaded file: {str(e)}"}
            )

    @staticmethod
    def get_output_path(job_id: str, target_ext: str) -> str:
        dest_filename = f"{job_id}.{target_ext}"
        return str(settings.OUTPUT_DIR / dest_filename)

    @staticmethod
    def cleanup_job_files(job_id: str):
        """Removes input and output files associated with a job ID."""
        for folder in [settings.UPLOAD_DIR, settings.PROCESSING_DIR, settings.OUTPUT_DIR]:
            for file in folder.glob(f"{job_id}.*"):
                try:
                    file.unlink(missing_ok=True)
                except Exception as e:
                    logger.warning(f"Could not delete {file}: {e}")
