import os
import csv
import json
import logging
import subprocess
import shutil
from typing import Dict, Any, Callable, Optional, Tuple
from app.converters.base import BaseConverter

logger = logging.getLogger("document_converter")

class DocumentConverter(BaseConverter):
    async def convert(
        self,
        input_path: str,
        output_path: str,
        source_ext: str,
        target_ext: str,
        options: Optional[Dict[str, Any]] = None,
        progress_callback: Optional[Callable[[int, str], None]] = None
    ) -> Tuple[bool, Optional[str]]:
        source_ext = source_ext.lower().lstrip(".")
        target_ext = target_ext.lower().lstrip(".")

        try:
            if progress_callback:
                progress_callback(10, f"Starting document conversion {source_ext.upper()} -> {target_ext.upper()}...")

            # ----------------------------------------------------
            # PDF Target Conversion via Native LibreOffice CLI (Pixel-Perfect 1:1 Layout)
            # ----------------------------------------------------
            if target_ext == "pdf":
                if progress_callback:
                    progress_callback(30, "Converting document to PDF via native engine...")
                
                # Attempt native LibreOffice conversion first for 1:1 format preservation
                if self._convert_native_libreoffice(input_path, output_path):
                    if progress_callback:
                        progress_callback(100, f"{source_ext.upper()} converted to PDF successfully.")
                    return True, None

            # ----------------------------------------------------
            # 1. DOCX / DOC Conversions
            # ----------------------------------------------------
            if source_ext in ["docx", "doc"]:
                paragraphs = []
                try:
                    import docx
                    doc = docx.Document(input_path)
                    for p in doc.paragraphs:
                        if p.text.strip():
                            paragraphs.append(p.text.strip())
                    for table in doc.tables:
                        for row in table.rows:
                            row_txt = " | ".join(cell.text.strip() for cell in row.cells if cell.text.strip())
                            if row_txt:
                                paragraphs.append(row_txt)
                except Exception as e:
                    logger.warning(f"Could not parse DOCX with python-docx, trying text fallback: {e}")
                    with open(input_path, "r", encoding="utf-8", errors="ignore") as f:
                        paragraphs = [line.strip() for line in f if line.strip()]

                if target_ext == "pdf":
                    success = self._render_text_to_pdf(paragraphs, output_path)
                    if success:
                        if progress_callback:
                            progress_callback(100, "DOCX converted to PDF successfully.")
                        return True, None
                    return False, "Failed to render PDF from Word document."

                elif target_ext in ["txt", "md"]:
                    full_text = "\n\n".join(paragraphs)
                    with open(output_path, "w", encoding="utf-8") as f_out:
                        f_out.write(full_text)
                    if progress_callback:
                        progress_callback(100, f"DOCX converted to {target_ext.upper()}.")
                    return True, None

            # ----------------------------------------------------
            # 2. TXT / MD Conversions
            # ----------------------------------------------------
            elif source_ext in ["txt", "md"]:
                with open(input_path, "r", encoding="utf-8", errors="replace") as f_in:
                    content = f_in.read()

                if target_ext == "pdf":
                    paragraphs = [line for line in content.splitlines() if line.strip()]
                    success = self._render_text_to_pdf(paragraphs, output_path)
                    if success:
                        if progress_callback:
                            progress_callback(100, f"{source_ext.upper()} converted to PDF.")
                        return True, None
                    return False, "Failed to render PDF from text file."

                elif target_ext in ["txt", "md"]:
                    with open(output_path, "w", encoding="utf-8") as f_out:
                        f_out.write(content)
                    if progress_callback:
                        progress_callback(100, "Text file converted.")
                    return True, None

                elif target_ext == "html":
                    html_lines = ["<!DOCTYPE html>", "<html>", "<head><meta charset='utf-8'><title>Document</title></head>", "<body style='font-family: sans-serif; padding: 2rem; max-width: 800px; margin: 0 auto;'>"]
                    for line in content.splitlines():
                        line_str = line.strip()
                        if not line_str:
                            continue
                        if line_str.startswith("# "):
                            html_lines.append(f"<h1>{line_str[2:]}</h1>")
                        elif line_str.startswith("## "):
                            html_lines.append(f"<h2>{line_str[3:]}</h2>")
                        elif line_str.startswith("### "):
                            html_lines.append(f"### {line_str[4:]}</h3>")
                        elif line_str.startswith("- ") or line_str.startswith("* "):
                            html_lines.append(f"<li>{line_str[2:]}</li>")
                        else:
                            html_lines.append(f"<p>{line_str}</p>")
                    html_lines.append("</body></html>")
                    with open(output_path, "w", encoding="utf-8") as f_out:
                        f_out.write("\n".join(html_lines))
                    if progress_callback:
                        progress_callback(100, "MD converted to HTML.")
                    return True, None

            # ----------------------------------------------------
            # 3. CSV Conversions
            # ----------------------------------------------------
            elif source_ext == "csv":
                rows = []
                with open(input_path, "r", encoding="utf-8", errors="replace") as f_in:
                    reader = csv.reader(f_in)
                    for row in reader:
                        rows.append(row)

                if target_ext == "xlsx":
                    try:
                        import openpyxl
                        wb = openpyxl.Workbook()
                        ws = wb.active
                        for r in rows:
                            ws.append(r)
                        wb.save(output_path)
                        if progress_callback:
                            progress_callback(100, "CSV converted to Excel XLSX.")
                        return True, None
                    except ImportError:
                        return False, "openpyxl library is not installed."

                elif target_ext == "json":
                    data = []
                    if len(rows) > 1:
                        headers = rows[0]
                        for r in rows[1:]:
                            obj = {headers[i]: r[i] if i < len(r) else "" for i in range(len(headers))}
                            data.append(obj)
                    with open(output_path, "w", encoding="utf-8") as f_out:
                        json.dump(data, f_out, indent=2)
                    if progress_callback:
                        progress_callback(100, "CSV converted to JSON.")
                    return True, None

                elif target_ext == "pdf":
                    formatted_rows = [" | ".join(r) for r in rows if any(r)]
                    success = self._render_text_to_pdf(formatted_rows, output_path)
                    if success:
                        if progress_callback:
                            progress_callback(100, "CSV converted to PDF.")
                        return True, None
                    return False, "Failed rendering CSV table to PDF."

            # ----------------------------------------------------
            # 4. JSON Conversions
            # ----------------------------------------------------
            elif source_ext == "json":
                with open(input_path, "r", encoding="utf-8", errors="replace") as f_in:
                    data = json.load(f_in)

                if isinstance(data, dict):
                    data = [data]

                if not isinstance(data, list) or len(data) == 0:
                    return False, "JSON file must contain a list of objects or a single key-value object."

                if target_ext == "csv":
                    headers = list(data[0].keys())
                    with open(output_path, "w", encoding="utf-8", newline="") as f_out:
                        writer = csv.DictWriter(f_out, fieldnames=headers)
                        writer.writeheader()
                        for item in data:
                            if isinstance(item, dict):
                                writer.writerow({k: str(v) for k, v in item.items() if k in headers})
                    if progress_callback:
                        progress_callback(100, "JSON converted to CSV.")
                    return True, None

            return False, f"Unsupported document conversion: {source_ext} -> {target_ext}"

        except Exception as e:
            logger.exception(f"Document conversion error: {e}")
            return False, f"Document conversion error: {str(e)}"

    def _convert_native_libreoffice(self, input_path: str, output_path: str) -> bool:
        """Attempts 1:1 pixel-perfect native PDF conversion via LibreOffice CLI."""
        try:
            out_dir = os.path.dirname(os.path.abspath(output_path))
            abs_input = os.path.abspath(input_path)

            cmd = ["libreoffice", "--headless", "--convert-to", "pdf", abs_input, "--outdir", out_dir]
            result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=45)

            input_base = os.path.basename(abs_input).rsplit(".", 1)[0]
            generated_pdf = os.path.join(out_dir, f"{input_base}.pdf")

            if os.path.exists(generated_pdf):
                if os.path.abspath(generated_pdf) != os.path.abspath(output_path):
                    shutil.move(generated_pdf, output_path)
                return True
            return False
        except Exception as e:
            logger.warning(f"LibreOffice conversion attempt failed: {e}")
            return False

    def _render_text_to_pdf(self, paragraphs: list, output_path: str) -> bool:
        """Renders structured paragraphs cleanly onto A4 PDF pages with auto line-wrapping and no synthetic headers/footers."""
        try:
            import fitz
            pdf = fitz.open()
            width, height = 595, 842  # A4 standard points
            margin = 50
            content_width = width - (2 * margin)

            page = pdf.new_page(width=width, height=height)
            y = margin

            fontsize = 10
            line_height = 14
            chars_per_line = int(content_width / 5.5)  # approx 90 chars per line

            for para in paragraphs:
                if not para or not str(para).strip():
                    y += line_height
                    continue

                text_str = str(para).strip()
                words = text_str.split()
                current_line = []
                current_len = 0
                lines_to_print = []

                for word in words:
                    if current_len + len(word) + 1 > chars_per_line:
                        lines_to_print.append(" ".join(current_line))
                        current_line = [word]
                        current_len = len(word)
                    else:
                        current_line.append(word)
                        current_len += len(word) + 1

                if current_line:
                    lines_to_print.append(" ".join(current_line))

                for line in lines_to_print:
                    if y + line_height > height - margin:
                        page = pdf.new_page(width=width, height=height)
                        y = margin

                    page.insert_text((margin, y), line, fontsize=fontsize, color=(0.1, 0.1, 0.1))
                    y += line_height

                y += 6  # Paragraph gap

            if len(pdf) == 0:
                pdf.new_page(width=width, height=height)

            pdf.save(output_path)
            pdf.close()
            return True
        except Exception as e:
            logger.error(f"Error rendering PDF layout: {e}")
            return False
