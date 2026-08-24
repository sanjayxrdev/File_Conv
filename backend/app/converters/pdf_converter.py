import os
import io
import re
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

            # ----------------------------------------------------
            # 1. PDF -> TXT
            # ----------------------------------------------------
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

            # ----------------------------------------------------
            # 2. PDF -> Markdown
            # ----------------------------------------------------
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

            # ----------------------------------------------------
            # 3. PDF -> Image (PNG/JPG)
            # ----------------------------------------------------
            elif target_ext in ["png", "jpg", "jpeg"]:
                dpi = int(options.get("dpi", 150))
                zoom = dpi / 72.0
                mat = fitz.Matrix(zoom, zoom)

                page = doc.load_page(0)
                pix = page.get_pixmap(matrix=mat)
                pix.save(output_path)
                doc.close()

                if progress_callback:
                    progress_callback(100, "PDF page rendered as image.")
                return True, None

            # ----------------------------------------------------
            # 4. PDF -> DOCX (Universal High-Fidelity Conversion)
            # ----------------------------------------------------
            elif target_ext == "docx":
                if progress_callback:
                    progress_callback(20, "Analyzing PDF page geometry, headers, footers & layout...")

                # A. Execute pdf2docx Conversion Engine (High-Fidelity 1:1 Layout & Geometry Extraction)
                pdf2docx_success = False
                try:
                    from pdf2docx import Converter
                    if progress_callback:
                        progress_callback(40, "Extracting document structure, tables, fonts & images...")

                    cv = Converter(input_path)
                    cv.convert(output_path)
                    cv.close()
                    pdf2docx_success = True
                except Exception as p2d_err:
                    logger.warning(f"pdf2docx engine conversion failed: {p2d_err}, falling back to custom renderer.")

                # B. Post-Process DOCX with python-docx (Safe Cleanup & Table cantSplit)
                if pdf2docx_success and os.path.exists(output_path) and os.path.getsize(output_path) > 0:
                    try:
                        if progress_callback:
                            progress_callback(80, "Applying layout refinements & cleaning document...")

                        import docx
                        from docx.oxml import OxmlElement

                        word_doc = docx.Document(output_path)

                        # Clean bullet symbols if unreadable glyphs appear
                        for p in word_doc.paragraphs:
                            if "\ufffd" in p.text or "\uF0B7" in p.text or "\uF0A7" in p.text:
                                for r in p.runs:
                                    r.text = r.text.replace("\ufffd", "• ").replace("\uF0B7", "• ").replace("\uF0A7", "• ")

                        # Prevent row splitting mid-line across pages for tables
                        for tbl in word_doc.tables:
                            for row in tbl.rows:
                                trPr = row._element.get_or_add_trPr()
                                trPr.append(OxmlElement('w:cantSplit'))

                        # Clean leading empty paragraphs at start of document body
                        while len(word_doc.paragraphs) > 0:
                            first_p = word_doc.paragraphs[0]
                            first_txt = first_p.text.strip()
                            first_drawings = first_p._element.xpath('.//w:drawing | .//w:pict')
                            if not first_txt and not first_drawings:
                                try:
                                    first_p._element.getparent().remove(first_p._element)
                                except Exception:
                                    break
                            else:
                                break

                        # Clean trailing empty paragraphs at end of document body
                        while len(word_doc.paragraphs) > 0:
                            last_p = word_doc.paragraphs[-1]
                            last_txt = last_p.text.strip()
                            last_drawings = last_p._element.xpath('.//w:drawing | .//w:pict')
                            if not last_txt and not last_drawings:
                                try:
                                    last_p._element.getparent().remove(last_p._element)
                                except Exception:
                                    break
                            else:
                                break

                        word_doc.save(output_path)
                        if progress_callback:
                            progress_callback(100, "PDF to DOCX high-fidelity conversion completed successfully.")
                        return True, None
                    except Exception as post_err:
                        logger.warning(f"DOCX post-processing error: {post_err}")
                        if progress_callback:
                            progress_callback(100, "PDF to DOCX conversion completed.")
                        return True, None

                # Fallback rendering if pdf2docx failed
                return self._fallback_image_render_docx(input_path, output_path, progress_callback)

            else:
                doc.close()
                return False, f"Unsupported target format for PDF: {target_ext}"

        except Exception as e:
            logger.exception(f"PDF conversion error: {e}")
            return False, f"PDF conversion error: {str(e)}"

    def _fallback_image_render_docx(
        self,
        input_path: str,
        output_path: str,
        progress_callback: Optional[Callable[[int, str], None]] = None
    ) -> Tuple[bool, Optional[str]]:
        """Fallback renderer for scanned PDFs or when pdf2docx engine fails."""
        try:
            import fitz
            import docx
            from docx.shared import Inches

            doc = fitz.open(input_path)
            word_doc = docx.Document()

            for section in word_doc.sections:
                section.top_margin = Inches(0.5)
                section.bottom_margin = Inches(0.5)
                section.left_margin = Inches(0.5)
                section.right_margin = Inches(0.5)

            total_pages = len(doc)
            for idx, page in enumerate(doc):
                if idx > 0:
                    word_doc.add_page_break()

                pix = page.get_pixmap(dpi=180)
                img_bytes = pix.tobytes("png")
                img_stream = io.BytesIO(img_bytes)

                p = word_doc.add_paragraph()
                p.alignment = docx.enum.text.WD_ALIGN_PARAGRAPH.CENTER
                p.add_run().add_picture(img_stream, width=Inches(7.5))

                if progress_callback:
                    pct = int(50 + (idx + 1) / total_pages * 50)
                    progress_callback(pct, f"Rendering scanned page {idx + 1}/{total_pages}...")

            doc.close()
            word_doc.save(output_path)
            if progress_callback:
                progress_callback(100, "PDF to DOCX fallback rendering completed.")
            return True, None
        except Exception as e:
            return False, f"Fallback PDF rendering failed: {str(e)}"
