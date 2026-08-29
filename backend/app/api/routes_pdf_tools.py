import os
import json
import uuid
import zipfile
import logging
from typing import Optional, List
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status, BackgroundTasks
from fastapi.responses import FileResponse, JSONResponse

from app.services.validation_service import ValidationService
from app.services.file_service import FileService
from app.services.conversion_service import conversion_service
from app.services.pdf_tools_service import PdfToolsService
from app.models.conversion import JobStatus

router = APIRouter()
logger = logging.getLogger("routes_pdf_tools")

@router.post("/pdf/info")
async def get_pdf_info(file: UploadFile = File(...)):
    """Analyze uploaded PDF and return page metadata and thumbnails."""
    job_id = str(uuid.uuid4())
    filename = ValidationService.sanitize_filename(file.filename or "document.pdf")
    ext = ValidationService.extract_extension(filename)

    if ext != "pdf":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_FILE_TYPE", "message": "Only PDF files are supported."}
        )

    saved_path, _ = await FileService.save_uploaded_file(file, job_id, "pdf")

    try:
        info = PdfToolsService.get_pdf_info(saved_path)
        thumbnails = PdfToolsService.render_thumbnails(saved_path, max_pages=200)
        info["thumbnails"] = thumbnails
        info["job_id"] = job_id
        return info
    except Exception as e:
        logger.error(f"Error fetching PDF info: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "PDF_INFO_ERROR", "message": f"Could not analyze PDF: {str(e)}"}
        )
    finally:
        try:
            os.remove(saved_path)
        except Exception:
            pass

@router.post("/pdf/rearrange")
async def rearrange_pdf(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    page_order: str = Form(...)  # JSON array of ints e.g. "[2,0,1]"
):
    """Rearrange pages in a PDF document."""
    try:
        order_list = json.loads(page_order)
        if not isinstance(order_list, list):
            raise ValueError()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_PAGE_ORDER", "message": "'page_order' must be a valid JSON array of page numbers."}
        )

    job_id = str(uuid.uuid4())
    filename = ValidationService.sanitize_filename(file.filename or "rearranged.pdf")
    input_path, bytes_len = await FileService.save_uploaded_file(file, job_id, "pdf")

    job = conversion_service.create_job(
        job_id=job_id,
        original_filename=f"rearranged_{filename}",
        source_ext="pdf",
        target_ext="pdf",
        input_path=input_path,
        file_size_bytes=bytes_len
    )

    async def async_worker():
        job.status = JobStatus.PROCESSING
        job.progress = 30
        job.message = "Rearranging PDF pages..."

        success, err = PdfToolsService.rearrange_pdf(input_path, order_list, job.output_path)

        try:
            os.remove(input_path)
        except Exception:
            pass

        if success and os.path.exists(job.output_path):
            job.status = JobStatus.COMPLETED
            job.progress = 100
            job.message = "PDF pages rearranged successfully!"
            job.output_size_bytes = os.path.getsize(job.output_path)
        else:
            job.status = JobStatus.FAILED
            job.progress = 0
            job.error = err or "Rearrange failed"

    background_tasks.add_task(async_worker)

    return {
        "job_id": job_id,
        "status": job.status,
        "message": "PDF rearrange job submitted."
    }

@router.post("/pdf/split")
async def split_pdf(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    split_mode: str = Form(...),  # 'range', 'selected', 'every_n', 'custom'
    ranges: Optional[str] = Form(None),  # JSON array of int arrays
    every_n: Optional[int] = Form(None)
):
    """Split PDF into multiple output PDFs."""
    parsed_ranges = None
    if ranges:
        try:
            parsed_ranges = json.loads(ranges)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "INVALID_RANGES", "message": "'ranges' must be a valid JSON array of page index arrays."}
            )

    job_id = str(uuid.uuid4())
    filename = ValidationService.sanitize_filename(file.filename or "document.pdf")
    input_path, bytes_len = await FileService.save_uploaded_file(file, job_id, "pdf")

    out_dir = os.path.dirname(input_path)

    job = conversion_service.create_job(
        job_id=job_id,
        original_filename=filename,
        source_ext="pdf",
        target_ext="pdf",
        input_path=input_path,
        file_size_bytes=bytes_len
    )

    async def async_worker():
        job.status = JobStatus.PROCESSING
        job.progress = 20
        job.message = "Splitting PDF document..."

        success, file_list, err = PdfToolsService.split_pdf(
            input_path,
            split_mode=split_mode,
            custom_ranges=parsed_ranges,
            every_n=every_n,
            output_dir=out_dir
        )

        try:
            os.remove(input_path)
        except Exception:
            pass

        if success and file_list:
            if len(file_list) == 1:
                job.output_path = file_list[0]
            else:
                zip_path = os.path.join(out_dir, f"split_files_{job_id[:8]}.zip")
                with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
                    for fpath in file_list:
                        zf.write(fpath, arcname=os.path.basename(fpath))
                        try:
                            os.remove(fpath)
                        except Exception:
                            pass
                job.output_path = zip_path
                job.target_format = "zip"

            job.status = JobStatus.COMPLETED
            job.progress = 100
            job.message = f"Split complete! Generated {len(file_list)} files."
            job.output_size_bytes = os.path.getsize(job.output_path)
        else:
            job.status = JobStatus.FAILED
            job.progress = 0
            job.error = err or "PDF Split failed"

    background_tasks.add_task(async_worker)

    return {
        "job_id": job_id,
        "status": job.status,
        "message": "Split PDF job submitted."
    }

@router.post("/pdf/extract")
async def extract_pdf_pages(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    page_indices: str = Form(...)  # JSON array of int
):
    """Extract specified pages into a new PDF."""
    try:
        indices = json.loads(page_indices)
        if not isinstance(indices, list):
            raise ValueError()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_PAGE_INDICES", "message": "'page_indices' must be a valid JSON array of numbers."}
        )

    job_id = str(uuid.uuid4())
    filename = ValidationService.sanitize_filename(file.filename or "document.pdf")
    input_path, bytes_len = await FileService.save_uploaded_file(file, job_id, "pdf")

    job = conversion_service.create_job(
        job_id=job_id,
        original_filename=f"extracted_{filename}",
        source_ext="pdf",
        target_ext="pdf",
        input_path=input_path,
        file_size_bytes=bytes_len
    )

    async def async_worker():
        job.status = JobStatus.PROCESSING
        job.progress = 30
        job.message = "Extracting requested PDF pages..."

        success, err = PdfToolsService.extract_pdf_pages(input_path, indices, job.output_path)

        try:
            os.remove(input_path)
        except Exception:
            pass

        if success and os.path.exists(job.output_path):
            job.status = JobStatus.COMPLETED
            job.progress = 100
            job.message = "PDF pages extracted successfully!"
            job.output_size_bytes = os.path.getsize(job.output_path)
        else:
            job.status = JobStatus.FAILED
            job.progress = 0
            job.error = err or "Page extraction failed."

    background_tasks.add_task(async_worker)

    return {
        "job_id": job_id,
        "status": job.status,
        "message": "Extract PDF pages job submitted."
    }

@router.post("/pdf/rotate")
async def rotate_pdf_pages(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    rotations: Optional[str] = Form(None),  # JSON dict e.g. {"0": 90, "2": 180}
    default_rotation: int = Form(0)
):
    """Rotate PDF pages."""
    rot_map = {}
    if rotations:
        try:
            raw_map = json.loads(rotations)
            rot_map = {int(k): int(v) for k, v in raw_map.items()}
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "INVALID_ROTATIONS", "message": "'rotations' must be a valid JSON dictionary."}
            )

    job_id = str(uuid.uuid4())
    filename = ValidationService.sanitize_filename(file.filename or "document.pdf")
    input_path, bytes_len = await FileService.save_uploaded_file(file, job_id, "pdf")

    job = conversion_service.create_job(
        job_id=job_id,
        original_filename=f"rotated_{filename}",
        source_ext="pdf",
        target_ext="pdf",
        input_path=input_path,
        file_size_bytes=bytes_len
    )

    async def async_worker():
        job.status = JobStatus.PROCESSING
        job.progress = 30
        job.message = "Rotating PDF pages..."

        success, err = PdfToolsService.rotate_pdf_pages(
            input_path,
            rotations=rot_map,
            default_rotation=default_rotation,
            output_path=job.output_path
        )

        try:
            os.remove(input_path)
        except Exception:
            pass

        if success and os.path.exists(job.output_path):
            job.status = JobStatus.COMPLETED
            job.progress = 100
            job.message = "PDF pages rotated successfully!"
            job.output_size_bytes = os.path.getsize(job.output_path)
        else:
            job.status = JobStatus.FAILED
            job.progress = 0
            job.error = err or "Page rotation failed."

    background_tasks.add_task(async_worker)

    return {
        "job_id": job_id,
        "status": job.status,
        "message": "Rotate PDF job submitted."
    }

@router.post("/pdf/add-page-numbers")
async def add_page_numbers(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    options: str = Form(...)  # JSON string options
):
    """Add customizable page numbers to a PDF document."""
    try:
        opts = json.loads(options)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_OPTIONS", "message": "'options' must be a valid JSON string."}
        )

    job_id = str(uuid.uuid4())
    filename = ValidationService.sanitize_filename(file.filename or "document.pdf")
    input_path, bytes_len = await FileService.save_uploaded_file(file, job_id, "pdf")

    job = conversion_service.create_job(
        job_id=job_id,
        original_filename=f"numbered_{filename}",
        source_ext="pdf",
        target_ext="pdf",
        input_path=input_path,
        file_size_bytes=bytes_len
    )

    async def async_worker():
        job.status = JobStatus.PROCESSING
        job.progress = 30
        job.message = "Adding page numbers to PDF..."

        success, err = PdfToolsService.add_page_numbers(input_path, opts, job.output_path)

        try:
            os.remove(input_path)
        except Exception:
            pass

        if success and os.path.exists(job.output_path):
            job.status = JobStatus.COMPLETED
            job.progress = 100
            job.message = "Page numbers added successfully!"
            job.output_size_bytes = os.path.getsize(job.output_path)
        else:
            job.status = JobStatus.FAILED
            job.progress = 0
            job.error = err or "Adding page numbers failed."

    background_tasks.add_task(async_worker)

    return {
        "job_id": job_id,
        "status": job.status,
        "message": "Add page numbers job submitted."
    }

@router.post("/pdf/protect")
async def protect_pdf(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    open_password: str = Form(...),
    owner_password: Optional[str] = Form(None),
    allow_printing: bool = Form(True),
    allow_copying: bool = Form(True),
    allow_modifying: bool = Form(False)
):
    """Secure PDF with AES-256 password protection and permissions."""
    if not open_password or not open_password.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "EMPTY_PASSWORD", "message": "Password cannot be empty."}
        )

    job_id = str(uuid.uuid4())
    filename = ValidationService.sanitize_filename(file.filename or "document.pdf")
    input_path, bytes_len = await FileService.save_uploaded_file(file, job_id, "pdf")

    job = conversion_service.create_job(
        job_id=job_id,
        original_filename=f"protected_{filename}",
        source_ext="pdf",
        target_ext="pdf",
        input_path=input_path,
        file_size_bytes=bytes_len
    )

    async def async_worker():
        job.status = JobStatus.PROCESSING
        job.progress = 30
        job.message = "Encrypting PDF document..."

        success, err = PdfToolsService.protect_pdf(
            input_path,
            open_password=open_password,
            owner_password=owner_password,
            allow_printing=allow_printing,
            allow_copying=allow_copying,
            allow_modifying=allow_modifying,
            output_path=job.output_path
        )

        try:
            os.remove(input_path)
        except Exception:
            pass

        if success and os.path.exists(job.output_path):
            job.status = JobStatus.COMPLETED
            job.progress = 100
            job.message = "PDF protected successfully!"
            job.output_size_bytes = os.path.getsize(job.output_path)
        else:
            job.status = JobStatus.FAILED
            job.progress = 0
            job.error = err or "PDF protection failed."

    background_tasks.add_task(async_worker)

    return {
        "job_id": job_id,
        "status": job.status,
        "message": "Protect PDF job submitted."
    }

@router.post("/pdf/compare")
async def compare_pdfs(
    file_a: UploadFile = File(...),
    file_b: UploadFile = File(...)
):
    """Compare PDF A and PDF B page by page."""
    job_id_a = str(uuid.uuid4())
    job_id_b = str(uuid.uuid4())

    saved_a, _ = await FileService.save_uploaded_file(file_a, job_id_a, "pdf")
    saved_b, _ = await FileService.save_uploaded_file(file_b, job_id_b, "pdf")

    try:
        results = PdfToolsService.compare_pdfs(saved_a, saved_b)
        return results
    except Exception as e:
        logger.error(f"Error comparing PDFs: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "PDF_COMPARE_ERROR", "message": f"Could not compare PDFs: {str(e)}"}
        )
    finally:
        for p in [saved_a, saved_b]:
            try:
                os.remove(p)
            except Exception:
                pass

@router.post("/pdf/transparent-signature")
async def remove_signature_background(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    tolerance: int = Form(30),
    target_color: str = Form("#FFFFFF")
):
    """Convert signature image background to transparent PNG."""
    job_id = str(uuid.uuid4())
    filename = ValidationService.sanitize_filename(file.filename or "signature.png")
    ext = ValidationService.extract_extension(filename) or "png"

    input_path, bytes_len = await FileService.save_uploaded_file(file, job_id, ext)

    job = conversion_service.create_job(
        job_id=job_id,
        original_filename=f"transparent_{filename.rsplit('.', 1)[0]}.png",
        source_ext=ext,
        target_ext="png",
        input_path=input_path,
        file_size_bytes=bytes_len
    )

    async def async_worker():
        job.status = JobStatus.PROCESSING
        job.progress = 40
        job.message = "Removing background from signature image..."

        success, err = PdfToolsService.remove_signature_bg(
            input_path,
            tolerance=tolerance,
            target_hex_color=target_color,
            output_image_path=job.output_path
        )

        try:
            os.remove(input_path)
        except Exception:
            pass

        if success and os.path.exists(job.output_path):
            job.status = JobStatus.COMPLETED
            job.progress = 100
            job.message = "Transparent signature generated successfully!"
            job.output_size_bytes = os.path.getsize(job.output_path)
        else:
            job.status = JobStatus.FAILED
            job.progress = 0
            job.error = err or "Background removal failed."

    background_tasks.add_task(async_worker)

    return {
        "job_id": job_id,
        "status": job.status,
        "message": "Transparent signature job submitted."
    }

@router.post("/pdf/stamp-signature")
async def stamp_signature(
    background_tasks: BackgroundTasks,
    pdf_file: UploadFile = File(...),
    signature_file: UploadFile = File(...),
    page_index: int = Form(0),
    x_pct: float = Form(10.0),
    y_pct: float = Form(80.0),
    width_pct: float = Form(20.0),
    height_pct: float = Form(10.0)
):
    """Stamp a transparent signature image onto a specified PDF page."""
    job_id = str(uuid.uuid4())
    pdf_name = ValidationService.sanitize_filename(pdf_file.filename or "document.pdf")
    sig_name = ValidationService.sanitize_filename(signature_file.filename or "sig.png")

    pdf_path, bytes_len = await FileService.save_uploaded_file(pdf_file, f"{job_id}_pdf", "pdf")
    sig_path, _ = await FileService.save_uploaded_file(signature_file, f"{job_id}_sig", "png")

    job = conversion_service.create_job(
        job_id=job_id,
        original_filename=f"signed_{pdf_name}",
        source_ext="pdf",
        target_ext="pdf",
        input_path=pdf_path,
        file_size_bytes=bytes_len
    )

    async def async_worker():
        job.status = JobStatus.PROCESSING
        job.progress = 40
        job.message = "Stamping signature onto PDF..."

        success, err = PdfToolsService.stamp_signature(
            pdf_path=pdf_path,
            signature_path=sig_path,
            page_index=page_index,
            x_pct=x_pct,
            y_pct=y_pct,
            width_pct=width_pct,
            height_pct=height_pct,
            output_path=job.output_path
        )

        for p in [pdf_path, sig_path]:
            try:
                os.remove(p)
            except Exception:
                pass

        if success and os.path.exists(job.output_path):
            job.status = JobStatus.COMPLETED
            job.progress = 100
            job.message = "PDF signed successfully!"
            job.output_size_bytes = os.path.getsize(job.output_path)
        else:
            job.status = JobStatus.FAILED
            job.progress = 0
            job.error = err or "Signature placement failed."

    background_tasks.add_task(async_worker)

    return {
        "job_id": job_id,
        "status": job.status,
        "message": "PDF signature stamping job submitted."
    }

@router.post("/pdf/rename")
async def rename_pdf(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    new_filename: str = Form(...)
):
    """
    Rename PDF document file without altering its contents or pages.
    """
    job_id = str(uuid.uuid4())
    original_name = file.filename or "document.pdf"
    
    # Save uploaded file
    input_path, bytes_len = await FileService.save_uploaded_file(file, job_id, "pdf")

    # Clean target filename
    clean_target = new_filename.replace("/", "_").replace("\\", "_").replace(":", "_").replace("*", "_").replace("?", "_").replace('"', "_").replace("<", "_").replace(">", "_").replace("|", "_").strip()
    if not clean_target.lower().endswith(".pdf"):
        clean_target = f"{clean_target.rsplit('.', 1)[0] if '.' in clean_target else clean_target}.pdf"

    job = conversion_service.create_job(
        job_id=job_id,
        original_filename=clean_target,
        source_ext="pdf",
        target_ext="pdf",
        input_path=input_path,
        file_size_bytes=bytes_len
    )

    async def async_worker():
        job.status = JobStatus.PROCESSING
        job.progress = 50
        job.message = "Renaming PDF document..."

        success, err = PdfToolsService.rename_pdf(input_path, clean_target, job.output_path)

        try:
            os.remove(input_path)
        except Exception:
            pass

        if success and os.path.exists(job.output_path):
            job.status = JobStatus.COMPLETED
            job.progress = 100
            job.message = "PDF renamed successfully!"
            job.output_size_bytes = os.path.getsize(job.output_path)
        else:
            job.status = JobStatus.FAILED
            job.progress = 0
            job.error = err or "PDF renaming failed."

    background_tasks.add_task(async_worker)

    return {
        "job_id": job_id,
        "status": job.status,
        "message": "PDF rename job submitted."
    }

@router.post("/pdf/remove-blank-pages")
async def remove_blank_pages(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    """
    Scans PDF and removes any empty/blank white pages automatically.
    """
    job_id = str(uuid.uuid4())
    original_name = ValidationService.sanitize_filename(file.filename or "document.pdf")

    input_path, bytes_len = await FileService.save_uploaded_file(file, job_id, "pdf")

    job = conversion_service.create_job(
        job_id=job_id,
        original_filename=f"clean_{original_name}",
        source_ext="pdf",
        target_ext="pdf",
        input_path=input_path,
        file_size_bytes=bytes_len
    )

    async def async_worker():
        job.status = JobStatus.PROCESSING
        job.progress = 30
        job.message = "Scanning PDF for empty white pages..."

        success, err = PdfToolsService.remove_blank_pages(input_path, job.output_path)

        try:
            os.remove(input_path)
        except Exception:
            pass

        if success and os.path.exists(job.output_path):
            job.status = JobStatus.COMPLETED
            job.progress = 100
            job.message = "Empty white pages removed successfully!"
            job.output_size_bytes = os.path.getsize(job.output_path)
        else:
            job.status = JobStatus.FAILED
            job.progress = 0
            job.error = err or "Removing blank pages failed."

    background_tasks.add_task(async_worker)

    return {
        "job_id": job_id,
        "status": job.status,
        "message": "Remove blank pages job submitted."
    }

@router.post("/pdf/export-images")
async def export_pdf_images(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    target_format: str = Form("jpg"),
    dpi: int = Form(150)
):
    """
    Renders every page of the PDF into sequential images (page_1, page_2...)
    and returns a downloadable ZIP file containing all page images.
    """
    job_id = str(uuid.uuid4())
    original_name = ValidationService.sanitize_filename(file.filename or "document.pdf")
    base_name = original_name.rsplit(".", 1)[0]

    input_path, bytes_len = await FileService.save_uploaded_file(file, job_id, "pdf")

    job = conversion_service.create_job(
        job_id=job_id,
        original_filename=f"{base_name}_all_pages_images.zip",
        source_ext="pdf",
        target_ext="zip",
        input_path=input_path,
        file_size_bytes=bytes_len
    )

    async def async_worker():
        job.status = JobStatus.PROCESSING
        job.progress = 20
        job.message = "Rendering PDF pages into high-res images..."

        success, err = PdfToolsService.export_pages_as_images(input_path, target_format, dpi, job.output_path)

        try:
            os.remove(input_path)
        except Exception:
            pass

        if success and os.path.exists(job.output_path):
            job.status = JobStatus.COMPLETED
            job.progress = 100
            job.message = "All PDF pages exported as images successfully!"
            job.output_size_bytes = os.path.getsize(job.output_path)
        else:
            job.status = JobStatus.FAILED
            job.progress = 0
            job.error = err or "Could not export PDF pages as images."

    background_tasks.add_task(async_worker)

    return {
        "job_id": job_id,
        "status": job.status,
        "message": "Export PDF pages job submitted."
    }


@router.post("/pdf/compress")
async def compress_pdf_endpoint(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    compression_level: str = Form("recommended"),  # 'light', 'recommended', 'extreme'
    custom_dpi: Optional[int] = Form(None),
    custom_quality: Optional[int] = Form(None)
):
    """Compresses PDF document using multi-level optimization."""
    job_id = str(uuid.uuid4())
    original_name = ValidationService.sanitize_filename(file.filename or "document.pdf")
    base_name = original_name.rsplit(".", 1)[0]

    input_path, bytes_len = await FileService.save_uploaded_file(file, job_id, "pdf")

    job = conversion_service.create_job(
        job_id=job_id,
        original_filename=f"{base_name}_compressed.pdf",
        source_ext="pdf",
        target_ext="pdf",
        input_path=input_path,
        file_size_bytes=bytes_len
    )

    async def async_worker():
        job.status = JobStatus.PROCESSING
        job.progress = 25
        job.message = "Compressing images and deflating PDF streams..."

        success, stats, err = PdfToolsService.compress_pdf(
            file_path=input_path,
            output_path=job.output_path,
            compression_level=compression_level,
            custom_dpi=custom_dpi,
            custom_quality=custom_quality
        )

        try:
            os.remove(input_path)
        except Exception:
            pass

        if success and os.path.exists(job.output_path):
            job.status = JobStatus.COMPLETED
            job.progress = 100
            job.message = f"PDF compressed successfully! Saved {stats.get('savings_percent', 0)}% of file size."
            job.output_size_bytes = os.path.getsize(job.output_path)
        else:
            job.status = JobStatus.FAILED
            job.progress = 0
            job.error = err or "Could not compress PDF document."

    background_tasks.add_task(async_worker)

    return {
        "job_id": job_id,
        "status": job.status,
        "message": "Compress PDF job submitted."
    }


@router.post("/pdf/alternate-mix")
async def alternate_mix_endpoint(
    background_tasks: BackgroundTasks,
    file_a: UploadFile = File(...),
    file_b: UploadFile = File(...),
    reverse_b: bool = Form(False),
    repeat_remaining: bool = Form(True)
):
    """Weaves two PDF documents page-by-page (odd and even duplex scanner pages)."""
    job_id = str(uuid.uuid4())
    name_a = ValidationService.sanitize_filename(file_a.filename or "doc_a.pdf").rsplit(".", 1)[0]

    input_path_a, len_a = await FileService.save_uploaded_file(file_a, f"{job_id}_a", "pdf")
    input_path_b, len_b = await FileService.save_uploaded_file(file_b, f"{job_id}_b", "pdf")

    job = conversion_service.create_job(
        job_id=job_id,
        original_filename=f"{name_a}_mixed.pdf",
        source_ext="pdf",
        target_ext="pdf",
        input_path=input_path_a,
        file_size_bytes=len_a + len_b
    )

    async def async_worker():
        job.status = JobStatus.PROCESSING
        job.progress = 30
        job.message = "Weaving odd and even pages sequentially..."

        success, stats, err = PdfToolsService.alternate_mix(
            file_path_a=input_path_a,
            file_path_b=input_path_b,
            output_path=job.output_path,
            reverse_b=reverse_b,
            repeat_remaining=repeat_remaining
        )

        for p in [input_path_a, input_path_b]:
            try:
                os.remove(p)
            except Exception:
                pass

        if success and os.path.exists(job.output_path):
            job.status = JobStatus.COMPLETED
            job.progress = 100
            job.message = f"Mixed {stats.get('total_mixed_pages', 0)} pages into combined document successfully."
            job.output_size_bytes = os.path.getsize(job.output_path)
        else:
            job.status = JobStatus.FAILED
            job.progress = 0
            job.error = err or "Could not alternate & mix PDF documents."

    background_tasks.add_task(async_worker)

    return {
        "job_id": job_id,
        "status": job.status,
        "message": "Alternate & Mix PDF job submitted."
    }


@router.post("/pdf/watermark")
async def watermark_pdf_endpoint(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    watermark_image: Optional[UploadFile] = File(None),
    text: Optional[str] = Form(None),
    opacity: float = Form(0.3),
    rotation: float = Form(45.0),
    tile: bool = Form(False),
    color_hex: str = Form("#888888"),
    font_size: float = Form(40.0)
):
    """Applies customizable text or image watermark across PDF document."""
    job_id = str(uuid.uuid4())
    original_name = ValidationService.sanitize_filename(file.filename or "document.pdf")
    base_name = original_name.rsplit(".", 1)[0]

    input_path, bytes_len = await FileService.save_uploaded_file(file, job_id, "pdf")

    watermark_img_path = None
    if watermark_image and watermark_image.filename:
        watermark_img_path, _ = await FileService.save_uploaded_file(watermark_image, f"{job_id}_wm", "png")

    job = conversion_service.create_job(
        job_id=job_id,
        original_filename=f"{base_name}_watermarked.pdf",
        source_ext="pdf",
        target_ext="pdf",
        input_path=input_path,
        file_size_bytes=bytes_len
    )

    async def async_worker():
        job.status = JobStatus.PROCESSING
        job.progress = 30
        job.message = "Applying watermark overlay..."

        success, err = PdfToolsService.watermark_pdf(
            file_path=input_path,
            output_path=job.output_path,
            text=text,
            image_path=watermark_img_path,
            opacity=opacity,
            rotation=rotation,
            tile=tile,
            color_hex=color_hex,
            font_size=font_size
        )

        for p in [input_path, watermark_img_path]:
            if p:
                try:
                    os.remove(p)
                except Exception:
                    pass

        if success and os.path.exists(job.output_path):
            job.status = JobStatus.COMPLETED
            job.progress = 100
            job.message = "Watermark applied successfully!"
            job.output_size_bytes = os.path.getsize(job.output_path)
        else:
            job.status = JobStatus.FAILED
            job.progress = 0
            job.error = err or "Could not apply watermark to PDF."

    background_tasks.add_task(async_worker)

    return {
        "job_id": job_id,
        "status": job.status,
        "message": "Watermark PDF job submitted."
    }


@router.post("/pdf/bates-numbering")
async def bates_numbering_endpoint(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    prefix: str = Form("CONF-"),
    suffix: str = Form(""),
    start_number: int = Form(1),
    digits: int = Form(6),
    position: str = Form("bottom-right"),
    font_size: float = Form(10.0),
    color_hex: str = Form("#000000")
):
    """Applies Bates numbering stamps for legal workflows."""
    job_id = str(uuid.uuid4())
    original_name = ValidationService.sanitize_filename(file.filename or "document.pdf")
    base_name = original_name.rsplit(".", 1)[0]

    input_path, bytes_len = await FileService.save_uploaded_file(file, job_id, "pdf")

    job = conversion_service.create_job(
        job_id=job_id,
        original_filename=f"{base_name}_bates_stamped.pdf",
        source_ext="pdf",
        target_ext="pdf",
        input_path=input_path,
        file_size_bytes=bytes_len
    )

    async def async_worker():
        job.status = JobStatus.PROCESSING
        job.progress = 30
        job.message = "Applying Bates numbering stamps..."

        success, err = PdfToolsService.bates_number_pdf(
            file_path=input_path,
            output_path=job.output_path,
            prefix=prefix,
            suffix=suffix,
            start_number=start_number,
            digits=digits,
            position=position,
            font_size=font_size,
            color_hex=color_hex
        )

        try:
            os.remove(input_path)
        except Exception:
            pass

        if success and os.path.exists(job.output_path):
            job.status = JobStatus.COMPLETED
            job.progress = 100
            job.message = "Bates numbering stamps applied successfully!"
            job.output_size_bytes = os.path.getsize(job.output_path)
        else:
            job.status = JobStatus.FAILED
            job.progress = 0
            job.error = err or "Could not apply Bates numbering."

    background_tasks.add_task(async_worker)

    return {
        "job_id": job_id,
        "status": job.status,
        "message": "Bates numbering job submitted."
    }


@router.post("/pdf/flatten-grayscale")
async def flatten_grayscale_endpoint(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    make_grayscale: bool = Form(True),
    flatten_forms: bool = Form(True)
):
    """Flattens annotations/forms and optionally converts PDF color to monochrome grayscale."""
    job_id = str(uuid.uuid4())
    original_name = ValidationService.sanitize_filename(file.filename or "document.pdf")
    base_name = original_name.rsplit(".", 1)[0]

    input_path, bytes_len = await FileService.save_uploaded_file(file, job_id, "pdf")

    suffix = "grayscale" if make_grayscale else "flattened"
    job = conversion_service.create_job(
        job_id=job_id,
        original_filename=f"{base_name}_{suffix}.pdf",
        source_ext="pdf",
        target_ext="pdf",
        input_path=input_path,
        file_size_bytes=bytes_len
    )

    async def async_worker():
        job.status = JobStatus.PROCESSING
        job.progress = 30
        job.message = "Processing color channels and flattening form elements..."

        success, stats, err = PdfToolsService.flatten_and_grayscale_pdf(
            file_path=input_path,
            output_path=job.output_path,
            make_grayscale=make_grayscale,
            flatten_forms=flatten_forms
        )

        try:
            os.remove(input_path)
        except Exception:
            pass

        if success and os.path.exists(job.output_path):
            job.status = JobStatus.COMPLETED
            job.progress = 100
            job.message = "Document flattened & optimized successfully!"
            job.output_size_bytes = os.path.getsize(job.output_path)
        else:
            job.status = JobStatus.FAILED
            job.progress = 0
            job.error = err or "Could not flatten/grayscale PDF."

    background_tasks.add_task(async_worker)

    return {
        "job_id": job_id,
        "status": job.status,
        "message": "Flatten/Grayscale PDF job submitted."
    }


@router.post("/pdf/crop")
async def crop_pdf_endpoint(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    margin_top: float = Form(0.0),
    margin_bottom: float = Form(0.0),
    margin_left: float = Form(0.0),
    margin_right: float = Form(0.0),
    unit: str = Form("pt")
):
    """Crops margins across PDF pages."""
    job_id = str(uuid.uuid4())
    original_name = ValidationService.sanitize_filename(file.filename or "document.pdf")
    base_name = original_name.rsplit(".", 1)[0]

    input_path, bytes_len = await FileService.save_uploaded_file(file, job_id, "pdf")

    job = conversion_service.create_job(
        job_id=job_id,
        original_filename=f"{base_name}_cropped.pdf",
        source_ext="pdf",
        target_ext="pdf",
        input_path=input_path,
        file_size_bytes=bytes_len
    )

    async def async_worker():
        job.status = JobStatus.PROCESSING
        job.progress = 30
        job.message = "Cropping document margins..."

        success, err = PdfToolsService.crop_pdf(
            file_path=input_path,
            output_path=job.output_path,
            margin_top=margin_top,
            margin_bottom=margin_bottom,
            margin_left=margin_left,
            margin_right=margin_right,
            unit=unit
        )

        try:
            os.remove(input_path)
        except Exception:
            pass

        if success and os.path.exists(job.output_path):
            job.status = JobStatus.COMPLETED
            job.progress = 100
            job.message = "PDF cropped successfully!"
            job.output_size_bytes = os.path.getsize(job.output_path)
        else:
            job.status = JobStatus.FAILED
            job.progress = 0
            job.error = err or "Could not crop PDF."

    background_tasks.add_task(async_worker)

    return {
        "job_id": job_id,
        "status": job.status,
        "message": "Crop PDF job submitted."
    }


@router.post("/pdf/metadata")
async def edit_metadata_endpoint(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    author: Optional[str] = Form(None),
    subject: Optional[str] = Form(None),
    keywords: Optional[str] = Form(None),
    creator: Optional[str] = Form(None)
):
    """Updates PDF document metadata."""
    job_id = str(uuid.uuid4())
    original_name = ValidationService.sanitize_filename(file.filename or "document.pdf")
    base_name = original_name.rsplit(".", 1)[0]

    input_path, bytes_len = await FileService.save_uploaded_file(file, job_id, "pdf")

    job = conversion_service.create_job(
        job_id=job_id,
        original_filename=f"{base_name}_metadata_updated.pdf",
        source_ext="pdf",
        target_ext="pdf",
        input_path=input_path,
        file_size_bytes=bytes_len
    )

    async def async_worker():
        job.status = JobStatus.PROCESSING
        job.progress = 30
        job.message = "Updating document metadata headers..."

        success, err = PdfToolsService.edit_metadata(
            file_path=input_path,
            output_path=job.output_path,
            title=title,
            author=author,
            subject=subject,
            keywords=keywords,
            creator=creator
        )

        try:
            os.remove(input_path)
        except Exception:
            pass

        if success and os.path.exists(job.output_path):
            job.status = JobStatus.COMPLETED
            job.progress = 100
            job.message = "PDF metadata updated successfully!"
            job.output_size_bytes = os.path.getsize(job.output_path)
        else:
            job.status = JobStatus.FAILED
            job.progress = 0
            job.error = err or "Could not update PDF metadata."

    background_tasks.add_task(async_worker)

    return {
        "job_id": job_id,
        "status": job.status,
        "message": "Update PDF metadata job submitted."
    }


@router.post("/pdf/bank-statement-to-excel")
async def bank_statement_to_excel_endpoint(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    """Extracts tables and financial statements from PDF into multi-sheet Excel spreadsheet."""
    job_id = str(uuid.uuid4())
    original_name = ValidationService.sanitize_filename(file.filename or "document.pdf")
    base_name = original_name.rsplit(".", 1)[0]

    input_path, bytes_len = await FileService.save_uploaded_file(file, job_id, "pdf")

    job = conversion_service.create_job(
        job_id=job_id,
        original_filename=f"{base_name}_extracted_tables.xlsx",
        source_ext="pdf",
        target_ext="xlsx",
        input_path=input_path,
        file_size_bytes=bytes_len
    )

    async def async_worker():
        job.status = JobStatus.PROCESSING
        job.progress = 30
        job.message = "Extracting structured financial tables to Excel..."

        success, stats, err = PdfToolsService.extract_financial_tables(
            file_path=input_path,
            output_excel_path=job.output_path
        )

        try:
            os.remove(input_path)
        except Exception:
            pass

        if success and os.path.exists(job.output_path):
            job.status = JobStatus.COMPLETED
            job.progress = 100
            job.message = f"Extracted {stats.get('tables_extracted', 0)} table(s) to formatted Excel workbook!"
            job.output_size_bytes = os.path.getsize(job.output_path)
        else:
            job.status = JobStatus.FAILED
            job.progress = 0
            job.error = err or "Could not extract tables from PDF."

    background_tasks.add_task(async_worker)

    return {
        "job_id": job_id,
        "status": job.status,
        "message": "Financial table extraction job submitted."
    }



