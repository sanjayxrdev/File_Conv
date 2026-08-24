import logging
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse, Response
from app.services.ocr_service import ocr_studio_service

logger = logging.getLogger("routes_ocr")
router = APIRouter(prefix="/ocr", tags=["OCR & Document Intelligence"])

SUPPORTED_EXTENSIONS = {
    "pdf", "png", "jpg", "jpeg", "webp", "bmp", "tiff", 
    "docx", "pptx", "xlsx", "html", "htm", "txt", "md"
}

@router.post("/analyze")
async def analyze_document_endpoint(file: UploadFile = File(...)):
    """
    Analyzes an uploaded document or image using Docling Document Intelligence.
    Extracts structured Markdown, Plain Text, Semantic HTML, Tables with CSV/JSON,
    Document Metadata, and Docling AST.
    """
    filename = file.filename or "document.pdf"
    ext = filename.split(".")[-1].lower() if "." in filename else ""

    if ext not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported format .{ext}. Supported formats: {', '.join(sorted(SUPPORTED_EXTENSIONS))}"
        )

    try:
        content = await file.read()
        if not content:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        result = await ocr_studio_service.analyze(content, filename)
        return {
            "success": True,
            "data": result
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"OCR analysis failed for {filename}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Document analysis failed: {str(e)}")
