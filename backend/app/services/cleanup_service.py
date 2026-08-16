import time
import logging
from pathlib import Path
from app.core.config import settings

logger = logging.getLogger("cleanup_service")

class CleanupService:
    @staticmethod
    def cleanup_old_files():
        """Removes output and upload files older than settings.FILE_RETENTION_MINUTES."""
        retention_seconds = settings.FILE_RETENTION_MINUTES * 60
        now = time.time()
        cleaned_count = 0

        for folder in [settings.UPLOAD_DIR, settings.PROCESSING_DIR, settings.OUTPUT_DIR]:
            if not folder.exists():
                continue
            for file_path in folder.iterdir():
                if file_path.is_file():
                    try:
                        file_age = now - file_path.stat().st_mtime
                        if file_age > retention_seconds:
                            file_path.unlink(missing_ok=True)
                            cleaned_count += 1
                    except Exception as e:
                        logger.warning(f"Failed to clean up {file_path}: {e}")

        if cleaned_count > 0:
            logger.info(f"Cleaned up {cleaned_count} expired temporary files.")
