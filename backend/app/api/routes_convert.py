import os
import json
import uuid
import asyncio
import logging
from typing import Optional, List
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status, BackgroundTasks
from fastapi.responses import FileResponse
from app.services.validation_service import ValidationService
from app.services.file_service import FileService
from app.services.conversion_service import conversion_service
from app.services.merge_service import MergeService
from app.services.batch_service import batch_service
from app.models.conversion import ConversionJob, JobStatus, ErrorResponse, Category
from app.registry.conversion_registry import ConversionRegistry

router = APIRouter()
logger = logging.getLogger("routes_convert")

@router.post("/convert")
async def start_conversion(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    target_format: str = Form(...),
    options: Optional[str] = Form(None)
):
    """
    Start an asynchronous single-file conversion job.
    """
    sanitized_filename, source_ext, target_ext = ValidationService.validate_file_and_target(file, target_format)

    parsed_options = None
    if options:
        try:
            parsed_options = json.loads(options)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "INVALID_OPTIONS_JSON", "message": "The 'options' parameter must be a valid JSON string."}
            )

    job_id = str(uuid.uuid4())
    input_path, file_size_bytes = await FileService.save_uploaded_file(file, job_id, source_ext)

    job = conversion_service.create_job(
        job_id=job_id,
        original_filename=sanitized_filename,
        source_ext=source_ext,
        target_ext=target_ext,
        input_path=input_path,
        file_size_bytes=file_size_bytes
    )

    background_tasks.add_task(conversion_service.execute_conversion, job_id, parsed_options)

    return {
        "job_id": job_id,
        "status": job.status,
        "original_filename": sanitized_filename,
        "source_format": source_ext,
        "target_format": target_ext,
        "message": "Conversion job submitted successfully."
    }

@router.post("/convert-batch")
async def start_batch_conversion(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    target_format: str = Form(...),
    options: Optional[str] = Form(None)
):
    """
    Start an asynchronous multi-file batch conversion job (1 to N files).
    Converts all compatible uploaded files to the target format in one batch.
    """
    if not files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "NO_FILES", "message": "No files provided for batch conversion."}
        )

    parsed_options = None
    if options:
        try:
            parsed_options = json.loads(options)
        except Exception:
            pass

    batch_id = str(uuid.uuid4())
    created_jobs: List[ConversionJob] = []
    job_ids: List[str] = []

    target_ext = target_format.lower().lstrip(".")

    for uploaded_file in files:
        job_id = str(uuid.uuid4())
        filename = ValidationService.sanitize_filename(uploaded_file.filename or f"file_{job_id}")
        source_ext = ValidationService.extract_extension(filename)

        if not source_ext or not ConversionRegistry.is_conversion_supported(source_ext, target_ext):
            logger.warning(f"Skipping unsupported conversion in batch: {source_ext} -> {target_ext}")
            continue

        input_path, file_size_bytes = await FileService.save_uploaded_file(uploaded_file, job_id, source_ext)

        job = conversion_service.create_job(
            job_id=job_id,
            original_filename=filename,
            source_ext=source_ext,
            target_ext=target_ext,
            input_path=input_path,
            file_size_bytes=file_size_bytes
        )
        created_jobs.append(job)
        job_ids.append(job_id)

    if not created_jobs:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "NO_VALID_FILES", "message": f"None of the uploaded files can be converted to '{target_ext.upper()}'."}
        )

    batch_service.create_batch(batch_id, job_ids)

    # Async background task for executing batch conversions concurrently
    async def async_batch_worker():
        sem = asyncio.Semaphore(4)

        async def convert_worker(job):
            async with sem:
                await conversion_service.execute_conversion(job.job_id, parsed_options)

        await asyncio.gather(*(convert_worker(job) for job in created_jobs))

        # Build ZIP archive once all conversions complete
        batch_service.create_batch_zip(batch_id, created_jobs)

    background_tasks.add_task(async_batch_worker)

    return {
        "batch_id": batch_id,
        "total_files": len(created_jobs),
        "job_ids": job_ids,
        "target_format": target_ext,
        "message": f"Batch conversion job for {len(created_jobs)} files submitted."
    }

@router.get("/convert-batch/{batch_id}")
async def get_batch_status(batch_id: str):
    """
    Get overall status and progress for a batch conversion job.
    """
    batch = batch_service.get_batch(batch_id)
    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "BATCH_NOT_FOUND", "message": f"Batch job '{batch_id}' not found."}
        )

    jobs = [conversion_service.get_job(jid) for jid in batch.job_ids if conversion_service.get_job(jid)]
    completed_count = sum(1 for j in jobs if j and j.status == JobStatus.COMPLETED)
    failed_count = sum(1 for j in jobs if j and j.status == JobStatus.FAILED)
    total = len(jobs)

    if total == 0:
        overall_pct = 0
        status_str = "queued"
    else:
        overall_pct = int(sum(j.progress for j in jobs if j) / total)
        if completed_count + failed_count == total:
            status_str = "completed" if completed_count > 0 else "failed"
        else:
            status_str = "processing"

    sub_jobs_data = []
    for j in jobs:
        if j:
            sub_jobs_data.append({
                "job_id": j.job_id,
                "original_filename": j.original_filename,
                "source_format": j.source_format,
                "target_format": j.target_format,
                "status": j.status,
                "progress": j.progress,
                "error": j.error,
                "download_url": j.download_url if j.status == JobStatus.COMPLETED else None
            })

    res = {
        "batch_id": batch_id,
        "status": status_str,
        "progress": overall_pct,
        "total_files": total,
        "completed_files": completed_count,
        "failed_files": failed_count,
        "files": sub_jobs_data,
        "zip_download_url": batch.zip_download_url if status_str == "completed" else None
    }
    return res

@router.get("/download-batch/{batch_id}")
async def download_batch_zip(batch_id: str):
    """
    Download all converted files in the batch as a single ZIP archive.
    """
    batch = batch_service.get_batch(batch_id)
    if not batch or not os.path.exists(batch.zip_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "ZIP_NOT_FOUND", "message": f"ZIP archive for batch '{batch_id}' is not ready."}
        )

    return FileResponse(
        path=batch.zip_path,
        filename=f"converted_files_batch_{batch_id[:8]}.zip",
        media_type="application/zip"
    )

@router.post("/merge")
async def merge_files(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    merge_type: str = Form(...)  # "pdf", "ppt", "docx"
):
    """
    Merge multiple PDF, PPT/PPTX, or DOCX files into a single unified file.
    """
    merge_type = merge_type.lower().strip()
    if merge_type not in ["pdf", "ppt", "pptx", "docx"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_MERGE_TYPE", "message": "Merge type must be one of: 'pdf', 'ppt', 'docx'."}
        )

    if not files or len(files) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INSUFFICIENT_FILES", "message": "At least 2 files are required to perform a merge operation."}
        )

    job_id = str(uuid.uuid4())
    saved_file_paths = []
    total_bytes = 0

    target_ext = "pdf" if merge_type == "pdf" else ("pptx" if merge_type in ["ppt", "pptx"] else "docx")

    for idx, uploaded_file in enumerate(files):
        sub_id = f"{job_id}_{idx}"
        ext = ValidationService.extract_extension(uploaded_file.filename or f"file_{idx}.{target_ext}")
        saved_path, bytes_len = await FileService.save_uploaded_file(uploaded_file, sub_id, ext)
        saved_file_paths.append(saved_path)
        total_bytes += bytes_len

    job = conversion_service.create_job(
        job_id=job_id,
        original_filename=f"merged_document.{target_ext}",
        source_ext=target_ext,
        target_ext=target_ext,
        input_path=saved_file_paths[0],
        file_size_bytes=total_bytes
    )

    async def async_merge_worker():
        job.status = JobStatus.PROCESSING
        job.progress = 20
        job.message = f"Merging {len(saved_file_paths)} {target_ext.upper()} files..."

        if target_ext == "pdf":
            success, err = MergeService.merge_pdf_files(saved_file_paths, job.output_path)
        elif target_ext == "pptx":
            success, err = MergeService.merge_pptx_files(saved_file_paths, job.output_path)
        elif target_ext == "docx":
            success, err = MergeService.merge_docx_files(saved_file_paths, job.output_path)
        else:
            success, err = False, f"Unsupported merge type: {target_ext}"

        for p in saved_file_paths:
            try:
                os.remove(p)
            except Exception:
                pass

        if success and os.path.exists(job.output_path):
            job.status = JobStatus.COMPLETED
            job.progress = 100
            job.message = "Files merged successfully!"
            job.output_size_bytes = os.path.getsize(job.output_path)
        else:
            job.status = JobStatus.FAILED
            job.progress = 0
            job.error = err or "Merge failed"
            job.message = "Merge failed"

    background_tasks.add_task(async_merge_worker)

    return {
        "job_id": job_id,
        "status": job.status,
        "target_format": target_ext,
        "message": f"Merge job for {len(files)} files submitted successfully."
    }

@router.get("/convert/{job_id}")
async def get_conversion_status(job_id: str):
    """
    Get job status, progress percentage, and download URL.
    """
    job = conversion_service.get_job(job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "JOB_NOT_FOUND", "message": f"Conversion job '{job_id}' was not found."}
        )

    res = {
        "job_id": job.job_id,
        "status": job.status,
        "progress": job.progress,
        "message": job.message,
        "source_format": job.source_format,
        "target_format": job.target_format,
        "original_filename": job.original_filename,
    }

    if job.status == JobStatus.COMPLETED:
        res["download_url"] = job.download_url
        res["output_size_bytes"] = job.output_size_bytes
    elif job.status == JobStatus.FAILED:
        res["error"] = job.error

    return res

@router.get("/download/{job_id}")
async def download_converted_file(job_id: str, custom_filename: Optional[str] = None):
    """
    Download converted file with optional custom download filename.
    """
    job = conversion_service.get_job(job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "JOB_NOT_FOUND", "message": f"Job '{job_id}' not found."}
        )

    if job.status != JobStatus.COMPLETED or not job.output_path or not os.path.exists(job.output_path):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "FILE_NOT_READY", "message": "Converted file is not ready for download."}
        )

    import zipfile
    base_name = job.original_filename.rsplit(".", 1)[0]
    is_zip = zipfile.is_zipfile(job.output_path)

    if is_zip:
        output_filename = f"{base_name}_all_pages.zip"
        media_type = "application/zip"
    elif custom_filename:
        # Sanitize custom filename and ensure correct extension
        clean_name = custom_filename.replace("/", "_").replace("\\", "_").replace(":", "_").replace("*", "_").replace("?", "_").replace('"', "_").replace("<", "_").replace(">", "_").replace("|", "_").strip()
        target_ext = f".{job.target_format.lower()}"
        # Strip repeated target extension
        while clean_name.lower().endswith(f"{target_ext}{target_ext}"):
            clean_name = clean_name[:-len(target_ext)]
        if not clean_name.lower().endswith(target_ext):
            if "." in clean_name and clean_name.rsplit(".", 1)[1].lower() == job.target_format.lower():
                pass
            else:
                clean_name = f"{clean_name.rsplit('.', 1)[0] if '.' in clean_name else clean_name}{target_ext}"
        output_filename = clean_name
        media_type = "application/octet-stream"
    else:
        output_filename = f"{base_name}.{job.target_format}"
        media_type = "application/octet-stream"

    return FileResponse(
        path=job.output_path,
        filename=output_filename,
        media_type=media_type
    )

@router.delete("/convert/{job_id}")
async def delete_job_files(job_id: str):
    """
    Manually purge conversion job temporary files.
    """
    FileService.cleanup_job_files(job_id)
    if job_id in conversion_service.jobs:
        del conversion_service.jobs[job_id]
    return {"status": "success", "message": f"Job '{job_id}' files purged."}
