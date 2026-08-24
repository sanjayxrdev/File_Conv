import os
import io
import re
import csv
import json
import logging
import asyncio
import tempfile
from typing import Dict, Any, List, Optional
from concurrent.futures import ThreadPoolExecutor

logger = logging.getLogger("ocr_service")

class DoclingStudioService:
    def __init__(self):
        self._converter = None
        self._executor = ThreadPoolExecutor(max_workers=2)

    def _get_converter(self):
        if self._converter is None:
            try:
                from docling.document_converter import DocumentConverter
                logger.info("Initializing Docling DocumentConverter for OCR Studio...")
                self._converter = DocumentConverter()
            except Exception as e:
                logger.error(f"Failed to initialize Docling: {e}")
                raise RuntimeError(f"Docling engine failed to initialize: {e}")
        return self._converter

    def _analyze_document_sync(self, file_path: str, filename: str) -> Dict[str, Any]:
        converter = self._get_converter()
        logger.info(f"Running Docling analysis on {filename}...")
        conv_res = converter.convert(file_path)
        doc = conv_res.document

        # 1. Full Document Markdown
        try:
            markdown_content = doc.export_to_markdown()
        except Exception as e:
            logger.warning(f"Failed export to markdown: {e}")
            markdown_content = ""

        # 2. Plain Text
        try:
            text_content = doc.export_to_text()
        except Exception as e:
            logger.warning(f"Failed export to text: {e}")
            text_content = markdown_content

        # 3. Semantic HTML
        try:
            html_content = doc.export_to_html()
        except Exception as e:
            logger.warning(f"Failed export to html: {e}")
            html_content = f"<pre>{text_content}</pre>"

        # 4. JSON AST Dict
        try:
            ast_dict = doc.export_to_dict()
        except Exception as e:
            logger.warning(f"Failed export to dict: {e}")
            ast_dict = {}

        # 5. Extract Tables
        tables_data = []
        if hasattr(doc, "tables") and doc.tables:
            for idx, tbl in enumerate(doc.tables):
                try:
                    df = tbl.export_to_dataframe()
                    headers = [str(c) for c in df.columns.tolist()]
                    raw_rows = df.values.tolist()
                    rows = [[str(cell) for cell in r] for r in raw_rows]
                    
                    # CSV string
                    csv_buffer = io.StringIO()
                    writer = csv.writer(csv_buffer)
                    writer.writerow(headers)
                    writer.writerows(rows)
                    csv_str = csv_buffer.getvalue()

                    # Table Markdown
                    try:
                        table_md = tbl.export_to_markdown()
                    except Exception:
                        table_md = df.to_markdown(index=False)

                    tables_data.append({
                        "index": idx + 1,
                        "headers": headers,
                        "rows": rows,
                        "num_rows": len(rows),
                        "num_cols": len(headers),
                        "csv": csv_str,
                        "markdown": table_md
                    })
                except Exception as ex:
                    logger.warning(f"Error parsing table {idx}: {ex}")

        # 6. Metadata and stats
        headings = re.findall(r"^#+\s+(.+)$", markdown_content, flags=re.MULTILINE)
        num_pages = len(getattr(doc, "pages", {})) or 1
        words = text_content.split()
        word_count = len(words)
        char_count = len(text_content)
        reading_time_mins = max(1, round(word_count / 200))

        return {
            "filename": filename,
            "markdown": markdown_content,
            "text": text_content,
            "html": html_content,
            "tables": tables_data,
            "ast": ast_dict,
            "metadata": {
                "num_pages": num_pages,
                "num_tables": len(tables_data),
                "num_headings": len(headings),
                "headings": headings[:20],
                "word_count": word_count,
                "char_count": char_count,
                "reading_time_mins": reading_time_mins,
            }
        }

    async def analyze(self, file_bytes: bytes, filename: str) -> Dict[str, Any]:
        ext = os.path.splitext(filename)[1].lower() or ".pdf"
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name

        loop = asyncio.get_running_loop()
        try:
            result = await loop.run_in_executor(
                self._executor,
                self._analyze_document_sync,
                tmp_path,
                filename
            )
            return result
        finally:
            if os.path.exists(tmp_path):
                try:
                    os.remove(tmp_path)
                except Exception:
                    pass

ocr_studio_service = DoclingStudioService()
