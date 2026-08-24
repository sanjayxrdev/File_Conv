import os
import time
import asyncio
import logging
from typing import Dict, Optional, Any
from app.models.conversion import ConversionJob, JobStatus, Category
from app.registry.conversion_registry import ConversionRegistry
from app.converters.ffmpeg_converter import FFmpegConverter
from app.converters.pdf_converter import PDFConverter
from app.converters.image_converter import ImageConverter
from app.converters.document_converter import DocumentConverter
from app.converters.pptx_converter import PPTXConverter
from app.converters.html_converter import HTMLConverter
from app.converters.spreadsheet_converter import SpreadsheetConverter
from app.converters.ocr_converter import DoclingOCRConverter
from app.services.file_service import FileService

logger = logging.getLogger("conversion_service")

class ConversionService:
    def __init__(self):
        self.jobs: Dict[str, ConversionJob] = {}
        self.ffmpeg_engine = FFmpegConverter()
        self.pdf_engine = PDFConverter()
        self.image_engine = ImageConverter()
        self.doc_engine = DocumentConverter()
        self.pptx_engine = PPTXConverter()
        self.html_engine = HTMLConverter()
        self.spreadsheet_engine = SpreadsheetConverter()
        self.ocr_engine = DoclingOCRConverter()

    def create_job(
        self,
        job_id: str,
        original_filename: str,
        source_ext: str,
        target_ext: str,
        input_path: str,
        file_size_bytes: int
    ) -> ConversionJob:
        source_info = ConversionRegistry.get_source_info(source_ext)
        category_str = source_info.category if source_info else "document"
        category = Category(category_str) if category_str in Category.__members__.values() else Category.DOCUMENT

        job = ConversionJob(
            job_id=job_id,
            original_filename=original_filename,
            source_format=source_ext,
            target_format=target_ext,
            category=category,
            status=JobStatus.QUEUED,
            progress=0,
            message="Conversion job queued",
            input_path=input_path,
            output_path=FileService.get_output_path(job_id, target_ext),
            download_url=f"/api/download/{job_id}",
            created_at=time.time(),
            file_size_bytes=file_size_bytes
        )

        self.jobs[job_id] = job
        return job

    def get_job(self, job_id: str) -> Optional[ConversionJob]:
        return self.jobs.get(job_id)

    async def execute_conversion(self, job_id: str, options: Optional[Dict[str, Any]] = None):
        job = self.get_job(job_id)
        if not job:
            logger.error(f"Job {job_id} not found for execution")
            return

        job.status = JobStatus.PROCESSING
        job.progress = 5
        job.message = "Initializing engine..."

        target_info = ConversionRegistry.get_target_info(job.source_format, job.target_format)
        if not target_info:
            job.status = JobStatus.FAILED
            job.error = f"Unsupported conversion route: {job.source_format} -> {job.target_format}"
            return

        engine_name = target_info["engine"]

        def progress_callback(pct: int, msg: str):
            job.progress = max(job.progress, min(99, pct))
            job.message = msg

        try:
            if engine_name == "ffmpeg":
                success, err = await self.ffmpeg_engine.convert(
                    job.input_path, job.output_path, job.source_format, job.target_format, options, progress_callback
                )
            elif engine_name == "pdf":
                success, err = await self.pdf_engine.convert(
                    job.input_path, job.output_path, job.source_format, job.target_format, options, progress_callback
                )
            elif engine_name == "image":
                success, err = await self.image_engine.convert(
                    job.input_path, job.output_path, job.source_format, job.target_format, options, progress_callback
                )
            elif engine_name == "document":
                success, err = await self.doc_engine.convert(
                    job.input_path, job.output_path, job.source_format, job.target_format, options, progress_callback
                )
            elif engine_name == "pptx":
                success, err = await self.pptx_engine.convert(
                    job.input_path, job.output_path, job.source_format, job.target_format, options, progress_callback
                )
            elif engine_name == "html":
                success, err = await self.html_engine.convert(
                    job.input_path, job.output_path, job.source_format, job.target_format, options, progress_callback
                )
            elif engine_name == "spreadsheet":
                success, err = await self.spreadsheet_engine.convert(
                    job.input_path, job.output_path, job.source_format, job.target_format, options, progress_callback
                )
            elif engine_name in ["ocr", "docling"]:
                success, err = await self.ocr_engine.convert(
                    job.input_path, job.output_path, job.source_format, job.target_format, options, progress_callback
                )
            else:
                success, err = False, f"Unknown conversion engine: {engine_name}"

            if success and os.path.exists(job.output_path):
                job.status = JobStatus.COMPLETED
                job.progress = 100
                job.message = "Conversion successful"
                job.completed_at = time.time()
                job.output_size_bytes = os.path.getsize(job.output_path)
            else:
                job.status = JobStatus.FAILED
                job.progress = 0
                job.error = err or "Conversion failed with unknown error"
                job.message = "Conversion failed"

        except Exception as e:
            logger.exception(f"Unhandled exception during job {job_id} execution")
            job.status = JobStatus.FAILED
            job.error = str(e)
            job.message = "System error during conversion"

conversion_service = ConversionService()
