import os
import csv
import json
import logging
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

            # TXT -> MD or MD -> TXT
            if (source_ext in ["txt", "md"]) and (target_ext in ["txt", "md"]):
                with open(input_path, "r", encoding="utf-8", errors="replace") as f_in:
                    content = f_in.read()
                with open(output_path, "w", encoding="utf-8") as f_out:
                    f_out.write(content)
                if progress_callback:
                    progress_callback(100, "Text file converted.")
                return True, None

            # DOCX -> TXT or DOCX -> MD
            elif source_ext == "docx":
                try:
                    import docx
                except ImportError:
                    return False, "python-docx library is not installed."
                doc = docx.Document(input_path)
                paragraphs = [p.text for p in doc.paragraphs]
                full_text = "\n\n".join(paragraphs)

                with open(output_path, "w", encoding="utf-8") as f_out:
                    f_out.write(full_text)

                if progress_callback:
                    progress_callback(100, "DOCX converted to text.")
                return True, None

            # CSV -> XLSX
            elif source_ext == "csv" and target_ext == "xlsx":
                try:
                    import openpyxl
                except ImportError:
                    return False, "openpyxl library is not installed."
                
                wb = openpyxl.Workbook()
                ws = wb.active

                with open(input_path, "r", encoding="utf-8", errors="replace") as f_in:
                    reader = csv.reader(f_in)
                    for row in reader:
                        ws.append(row)

                wb.save(output_path)
                if progress_callback:
                    progress_callback(100, "CSV converted to Excel XLSX.")
                return True, None

            # CSV -> JSON
            elif source_ext == "csv" and target_ext == "json":
                data = []
                with open(input_path, "r", encoding="utf-8", errors="replace") as f_in:
                    reader = csv.DictReader(f_in)
                    for row in reader:
                        data.append(dict(row))

                with open(output_path, "w", encoding="utf-8") as f_out:
                    json.dump(data, f_out, indent=2)

                if progress_callback:
                    progress_callback(100, "CSV converted to JSON.")
                return True, None

            # JSON -> CSV
            elif source_ext == "json" and target_ext == "csv":
                with open(input_path, "r", encoding="utf-8", errors="replace") as f_in:
                    data = json.load(f_in)

                if isinstance(data, dict):
                    data = [data]

                if not isinstance(data, list) or len(data) == 0:
                    return False, "JSON file must contain a list of objects or a single key-value object."

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

            else:
                return False, f"Unsupported document conversion: {source_ext} -> {target_ext}"

        except Exception as e:
            return False, f"Document conversion error: {str(e)}"
