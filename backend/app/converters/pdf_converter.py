import os
import logging
from typing import Dict, Any, Callable, Optional, Tuple
from app.converters.base import BaseConverter

logger = logging.getLogger("pdf_converter")

class PDFConverter(BaseConverter):
    async def convert(
        self,
        input_path: str,
        output_path: str,
        source_ext: str,
        target_ext: str,
        options: Optional[Dict[str, Any]] = None,
        progress_callback: Optional[Callable[[int, str], None]] = None
    ) -> Tuple[bool, Optional[str]]:
        options = options or {}
        target_ext = target_ext.lower().lstrip(".")

        try:
            import fitz  # PyMuPDF
        except ImportError:
            return False, "PyMuPDF (fitz) is not installed in the Python environment."

        try:
            if progress_callback:
                progress_callback(10, "Opening PDF document...")

            doc = fitz.open(input_path)
            total_pages = len(doc)

            if total_pages == 0:
                doc.close()
                return False, "PDF document has 0 pages or is corrupted."

            # Check if PDF might be scanned (no extractable text)
            has_text = False
            for page in doc:
                if page.get_text().strip():
                    has_text = True
                    break

            if not has_text and target_ext in ["txt", "md", "docx"]:
                logger.warning("PDF appears to be scanned image with no embedded text.")

            # PDF -> TXT
            if target_ext == "txt":
                text_content = []
                for idx, page in enumerate(doc):
                    text_content.append(f"--- Page {idx + 1} ---\n" + page.get_text())
                    if progress_callback:
                        pct = int(10 + (idx + 1) / total_pages * 80)
                        progress_callback(pct, f"Extracting page {idx + 1}/{total_pages}")

                full_text = "\n\n".join(text_content)
                if not has_text:
                    full_text = "[NOTE: Document appears scanned. OCR may be required for full text extraction.]\n\n" + full_text

                with open(output_path, "w", encoding="utf-8") as f:
                    f.write(full_text)

                doc.close()
                if progress_callback:
                    progress_callback(100, "PDF to TXT conversion completed.")
                return True, None

            # PDF -> Markdown
            elif target_ext == "md":
                md_content = []
                for idx, page in enumerate(doc):
                    lines = page.get_text("text").splitlines()
                    md_lines = [f"## Page {idx + 1}\n"]
                    for line in lines:
                        if line.isupper() and len(line) < 60:
                            md_lines.append(f"### {line}")
                        else:
                            md_lines.append(line)
                    md_content.append("\n".join(md_lines))
                    if progress_callback:
                        pct = int(10 + (idx + 1) / total_pages * 80)
                        progress_callback(pct, f"Processing page {idx + 1}/{total_pages}")

                full_md = "\n\n---\n\n".join(md_content)
                with open(output_path, "w", encoding="utf-8") as f:
                    f.write(full_md)

                doc.close()
                if progress_callback:
                    progress_callback(100, "PDF to Markdown conversion completed.")
                return True, None

            # PDF -> PNG / JPG (Render Page 1 or all pages)
            elif target_ext in ["png", "jpg", "jpeg"]:
                dpi = int(options.get("dpi", 150))
                zoom = dpi / 72.0
                mat = fitz.Matrix(zoom, zoom)

                # Render page 0
                page = doc.load_page(0)
                pix = page.get_pixmap(matrix=mat)
                pix.save(output_path)
                doc.close()

                if progress_callback:
                    progress_callback(100, "PDF page rendered as image.")
                return True, None

            # PDF -> DOCX
            elif target_ext == "docx":
                doc.close()
                if progress_callback:
                    progress_callback(20, "Converting PDF layout to DOCX...")
                try:
                    from pdf2docx import Converter
                    cv = Converter(input_path)
                    cv.convert(output_path, start=0, end=None)
                    cv.close()
                    if progress_callback:
                        progress_callback(100, "PDF to DOCX conversion completed.")
                    return True, None
                except Exception as e:
                    logger.error(f"pdf2docx conversion failed: {e}")
                    # Fallback using python-docx
                    from docx import Document
                    doc_fitz = fitz.open(input_path)
                    word_doc = Document()
                    word_doc.add_heading("Converted PDF Document", 0)
                    for page in doc_fitz:
                        word_doc.add_paragraph(page.get_text())
                    word_doc.save(output_path)
                    doc_fitz.close()
                    return True, None

            else:
                doc.close()
                return False, f"Unsupported target format for PDF: {target_ext}"

        except Exception as e:
            return False, f"PDF conversion error: {str(e)}"
