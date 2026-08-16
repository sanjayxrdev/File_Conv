import os
import json
import logging
from typing import Dict, Any, Callable, Optional, Tuple
from app.converters.base import BaseConverter

logger = logging.getLogger("spreadsheet_converter")

class SpreadsheetConverter(BaseConverter):
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
            import pandas as pd
        except ImportError:
            return False, "pandas library is not installed."

        try:
            if progress_callback:
                progress_callback(10, f"Reading spreadsheet ({source_ext.upper()})...")

            # Read Excel file
            if source_ext == "xls":
                df = pd.read_excel(input_path, engine="xlrd")
            else:
                df = pd.read_excel(input_path, engine="openpyxl")

            if progress_callback:
                progress_callback(40, "Processing tabular dataset...")

            # XLSX / XLS -> CSV
            if target_ext == "csv":
                df.to_csv(output_path, index=False, encoding="utf-8")
                if progress_callback:
                    progress_callback(100, "Spreadsheet converted to CSV.")
                return True, None

            # XLSX / XLS -> JSON
            elif target_ext == "json":
                records = df.to_dict(orient="records")
                with open(output_path, "w", encoding="utf-8") as f:
                    json.dump(records, f, indent=2, default=str)
                if progress_callback:
                    progress_callback(100, "Spreadsheet converted to JSON.")
                return True, None

            # XLSX / XLS -> Plain Text (TXT)
            elif target_ext == "txt":
                text_repr = df.to_string(index=False)
                with open(output_path, "w", encoding="utf-8") as f:
                    f.write(text_repr)
                if progress_callback:
                    progress_callback(100, "Spreadsheet converted to text.")
                return True, None

            # XLSX / XLS -> PDF
            elif target_ext == "pdf":
                try:
                    import fitz
                    if progress_callback:
                        progress_callback(60, "Formatting spreadsheet pages into PDF...")
                    
                    pdf_doc = fitz.open()
                    page = pdf_doc.new_page(width=842, height=595)  # A4 Landscape
                    page.draw_rect(fitz.Rect(0, 0, 842, 50), color=(0.15, 0.25, 0.45), fill=(0.15, 0.25, 0.45))
                    page.insert_text((30, 32), f"Excel Spreadsheet Export - {os.path.basename(input_path)}", fontsize=16, color=(1, 1, 1))

                    y_pos = 80
                    headers = " | ".join([str(c) for c in df.columns[:8]])
                    page.insert_text((30, y_pos), headers, fontsize=10, color=(0.2, 0.2, 0.8))
                    y_pos += 20
                    page.draw_line(fitz.Point(30, y_pos), fitz.Point(812, y_pos), color=(0.7, 0.7, 0.7))
                    y_pos += 15

                    for _, row in df.iterrows():
                        if y_pos > 540:
                            page = pdf_doc.new_page(width=842, height=595)
                            y_pos = 50
                        row_str = " | ".join([str(v)[:20] for v in row.values[:8]])
                        page.insert_text((30, y_pos), row_str, fontsize=9, color=(0.1, 0.1, 0.1))
                        y_pos += 18

                    pdf_doc.save(output_path)
                    pdf_doc.close()
                    if progress_callback:
                        progress_callback(100, "Spreadsheet converted to PDF.")
                    return True, None
                except Exception as e:
                    return False, f"Spreadsheet to PDF rendering error: {str(e)}"

            else:
                return False, f"Unsupported target format for spreadsheet: {target_ext}"

        except Exception as e:
            return False, f"Spreadsheet conversion error: {str(e)}"
