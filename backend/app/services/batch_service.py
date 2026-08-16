import os
import zipfile
import logging
from typing import Dict, List, Optional, Tuple
from app.models.conversion import ConversionJob, JobStatus
from app.core.config import settings

logger = logging.getLogger("batch_service")

class BatchJob:
    def __init__(self, batch_id: str, job_ids: List[str]):
        self.batch_id = batch_id
        self.job_ids = job_ids
        self.total_files = len(job_ids)
        self.zip_path = str(settings.OUTPUT_DIR / f"batch_{batch_id}.zip")
        self.zip_download_url = f"/api/download-batch/{batch_id}"

class BatchService:
    def __init__(self):
        self.batches: Dict[str, BatchJob] = {}

    def create_batch(self, batch_id: str, job_ids: List[str]) -> BatchJob:
        batch = BatchJob(batch_id, job_ids)
        self.batches[batch_id] = batch
        return batch

    def get_batch(self, batch_id: str) -> Optional[BatchJob]:
        return self.batches.get(batch_id)

    def create_batch_zip(self, batch_id: str, jobs: List[ConversionJob]) -> Tuple[bool, Optional[str]]:
        batch = self.get_batch(batch_id)
        if not batch:
            return False, "Batch job not found."

        try:
            with zipfile.ZipFile(batch.zip_path, "w", zipfile.ZIP_DEFLATED) as zip_file:
                used_names = set()
                for job in jobs:
                    if job.status == JobStatus.COMPLETED and job.output_path and os.path.exists(job.output_path):
                        base_name = job.original_filename.rsplit(".", 1)[0]
                        out_name = f"{base_name}.{job.target_format}"
                        
                        # Handle duplicate filenames in batch
                        idx = 1
                        orig_out_name = out_name
                        while out_name in used_names:
                            out_name = f"{base_name}_{idx}.{job.target_format}"
                            idx += 1
                        used_names.add(out_name)

                        zip_file.write(job.output_path, arcname=out_name)

            if os.path.exists(batch.zip_path) and os.path.getsize(batch.zip_path) > 0:
                return True, None
            else:
                return False, "Generated ZIP file is empty."

        except Exception as e:
            logger.error(f"Failed to create batch ZIP archive for {batch_id}: {e}")
            return False, f"ZIP archive creation error: {str(e)}"

batch_service = BatchService()
