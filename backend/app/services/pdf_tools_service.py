import os
import io
import fitz  # PyMuPDF
import logging
import base64
from typing import List, Dict, Any, Tuple, Optional
from PIL import Image, ImageChops, ImageEnhance

logger = logging.getLogger("pdf_tools_service")

class PdfToolsService:

    @staticmethod
    def get_pdf_info(file_path: str, password: Optional[str] = None) -> Dict[str, Any]:
        """Returns metadata, page count, and page dimensions for a PDF."""
        doc = fitz.open(file_path)
        is_encrypted = doc.is_encrypted

        if is_encrypted:
            if password:
                doc.authenticate(password)
            else:
                doc.authenticate("")

        if doc.is_encrypted:
            doc.close()
            return {
                "total_pages": 0,
                "is_encrypted": True,
                "pages": [],
                "error": "PDF document is password protected."
            }

        pages_info = []
        for idx, page in enumerate(doc):
            rect = page.rect
            pages_info.append({
                "index": idx,
                "page_number": idx + 1,
                "width": rect.width,
                "height": rect.height,
                "rotation": page.rotation
            })
        info = {
            "total_pages": len(doc),
            "is_encrypted": is_encrypted,
            "pages": pages_info
        }
        doc.close()
        return info

    @staticmethod
    def render_thumbnails(file_path: str, max_pages: int = 100, scale: float = 0.5, password: Optional[str] = None) -> List[Dict[str, Any]]:
        """Renders page thumbnails as base64 data URLs for fast previewing."""
        doc = fitz.open(file_path)
        if doc.is_encrypted:
            if password:
                doc.authenticate(password)
            else:
                doc.authenticate("")

        if doc.is_encrypted:
            doc.close()
            return []

        thumbnails = []
        limit = min(len(doc), max_pages)

        for idx in range(limit):
            page = doc[idx]
            pix = page.get_pixmap(matrix=fitz.Matrix(scale, scale))
            img_bytes = pix.tobytes("png")
            b64_str = base64.b64encode(img_bytes).decode("utf-8")
            data_url = f"data:image/png;base64,{b64_str}"
            thumbnails.append({
                "page_index": idx,
                "page_number": idx + 1,
                "width": pix.width,
                "height": pix.height,
                "rotation": page.rotation,
                "data_url": data_url
            })

        doc.close()
        return thumbnails

    @staticmethod
    def rearrange_pdf(file_path: str, page_order: List[int], output_path: str) -> Tuple[bool, Optional[str]]:
        """Rearranges pages in a PDF based on the requested page_order list (0-indexed)."""
        try:
            doc = fitz.open(file_path)
            total = len(doc)
            if not page_order:
                doc.close()
                return False, "Page order list cannot be empty."

            for idx in page_order:
                if idx < 0 or idx >= total:
                    doc.close()
                    return False, f"Invalid page index {idx}. Valid range is 0 to {total - 1}."

            out_doc = fitz.open()
            for idx in page_order:
                out_doc.insert_pdf(doc, from_page=idx, to_page=idx)

            out_doc.save(output_path)
            out_doc.close()
            doc.close()
            return True, None
        except Exception as e:
            logger.error(f"Error rearranging PDF: {e}")
            return False, str(e)

    @staticmethod
    def split_pdf(
        file_path: str,
        split_mode: str,  # 'range', 'selected', 'every_n', 'custom'
        custom_ranges: Optional[List[List[int]]] = None,  # List of 0-indexed page index arrays
        every_n: Optional[int] = None,
        output_dir: str = ""
    ) -> Tuple[bool, List[str], Optional[str]]:
        """Splits PDF into multiple files according to split_mode."""
        try:
            doc = fitz.open(file_path)
            total_pages = len(doc)
            if total_pages == 0:
                doc.close()
                return False, [], "Document has 0 pages."

            groups: List[List[int]] = []

            if split_mode == "every_n":
                n = every_n or 1
                if n <= 0:
                    n = 1
                for i in range(0, total_pages, n):
                    groups.append(list(range(i, min(i + n, total_pages))))

            elif split_mode in ["range", "selected", "custom"]:
                if not custom_ranges:
                    doc.close()
                    return False, [], "No page ranges specified for splitting."
                for r in custom_ranges:
                    valid_indices = [idx for idx in r if 0 <= idx < total_pages]
                    if valid_indices:
                        groups.append(valid_indices)

            if not groups:
                doc.close()
                return False, [], "No valid split groups generated."

            output_files = []
            base_name = os.path.splitext(os.path.basename(file_path))[0]

            for g_idx, group in enumerate(groups):
                out_doc = fitz.open()
                for p_idx in group:
                    out_doc.insert_pdf(doc, from_page=p_idx, to_page=p_idx)
                
                start_p = group[0] + 1
                end_p = group[-1] + 1
                part_name = f"{base_name}_part_{g_idx + 1}_pages_{start_p}-{end_p}.pdf" if start_p != end_p else f"{base_name}_part_{g_idx + 1}_page_{start_p}.pdf"
                out_path = os.path.join(output_dir, part_name)
                out_doc.save(out_path)
                out_doc.close()
                output_files.append(out_path)

            doc.close()
            return True, output_files, None
        except Exception as e:
            logger.error(f"Error splitting PDF: {e}")
            return False, [], str(e)

    @staticmethod
    def extract_pdf_pages(file_path: str, page_indices: List[int], output_path: str) -> Tuple[bool, Optional[str]]:
        """Extracts specified 0-indexed page indices into a new PDF."""
        try:
            doc = fitz.open(file_path)
            total = len(doc)
            valid_indices = [i for i in page_indices if 0 <= i < total]

            if not valid_indices:
                doc.close()
                return False, "No valid pages selected for extraction."

            out_doc = fitz.open()
            for idx in valid_indices:
                out_doc.insert_pdf(doc, from_page=idx, to_page=idx)

            out_doc.save(output_path)
            out_doc.close()
            doc.close()
            return True, None
        except Exception as e:
            logger.error(f"Error extracting PDF pages: {e}")
            return False, str(e)

    @staticmethod
    def rotate_pdf_pages(
        file_path: str,
        rotations: Dict[int, int],  # page_index -> angle (90, 180, 270)
        default_rotation: int = 0,
        output_path: str = ""
    ) -> Tuple[bool, Optional[str]]:
        """Rotates pages in a PDF document."""
        try:
            doc = fitz.open(file_path)
            for idx, page in enumerate(doc):
                angle = rotations.get(idx, default_rotation)
                if angle != 0:
                    new_rot = (page.rotation + angle) % 360
                    page.set_rotation(new_rot)

            doc.save(output_path)
            doc.close()
            return True, None
        except Exception as e:
            logger.error(f"Error rotating PDF pages: {e}")
            return False, str(e)

    @staticmethod
    def _int_to_roman(n: int) -> str:
        """Helper to convert integer to Roman numerals."""
        val = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1]
        syb = ["M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I"]
        roman_num = ''
        i = 0
        while n > 0:
            for _ in range(n // val[i]):
                roman_num += syb[i]
                n -= val[i]
            i += 1
        return roman_num

    @staticmethod
    def add_page_numbers(file_path: str, options: Dict[str, Any], output_path: str) -> Tuple[bool, Optional[str]]:
        """Adds page numbers to PDF pages according to customizable options."""
        try:
            doc = fitz.open(file_path)
            total_pages = len(doc)

            position = options.get("position", "bottom-center")
            num_format = options.get("num_format", "1")  # '1', 'Page 1', 'Page 1 of N', '- 1 -', 'roman'
            prefix = options.get("prefix", "")
            suffix = options.get("suffix", "")
            font_size = float(options.get("font_size", 10.0))
            hex_color = options.get("text_color", "#111111").lstrip("#")
            
            # Convert hex color to RGB floats 0-1
            r = int(hex_color[0:2], 16) / 255.0 if len(hex_color) >= 2 else 0.0
            g = int(hex_color[2:4], 16) / 255.0 if len(hex_color) >= 4 else 0.0
            b = int(hex_color[4:6], 16) / 255.0 if len(hex_color) >= 6 else 0.0
            color = (r, g, b)

            start_num = int(options.get("start_number", 1))
            skip_first = bool(options.get("skip_first_page", False))
            target_indices = options.get("target_page_indices", None)  # list of int or None for all

            margin_top = float(options.get("margin_top", 36))
            margin_bottom = float(options.get("margin_bottom", 36))
            margin_left = float(options.get("margin_left", 36))
            margin_right = float(options.get("margin_right", 36))

            current_number = start_num

            for idx, page in enumerate(doc):
                if skip_first and idx == 0:
                    continue
                if target_indices is not None and idx not in target_indices:
                    continue

                # Format text
                if num_format == "roman":
                    num_str = PdfToolsService._int_to_roman(current_number)
                else:
                    num_str = str(current_number)

                if num_format == "Page 1":
                    text_content = f"Page {num_str}"
                elif num_format == "Page 1 of N":
                    text_content = f"Page {num_str} of {total_pages}"
                elif num_format == "- 1 -":
                    text_content = f"- {num_str} -"
                else:
                    text_content = num_str

                if prefix:
                    text_content = f"{prefix} {text_content}"
                if suffix:
                    text_content = f"{text_content} {suffix}"

                rect = page.rect
                page_w = rect.width
                page_h = rect.height

                # Determine coordinates based on position
                text_w = fitz.get_text_length(text_content, fontsize=font_size)

                if "left" in position:
                    x = margin_left
                elif "right" in position:
                    x = page_w - margin_right - text_w
                else:  # center
                    x = (page_w - text_w) / 2.0

                if "top" in position:
                    y = margin_top + font_size
                else:  # bottom
                    y = page_h - margin_bottom

                point = fitz.Point(x, y)
                page.insert_text(point, text_content, fontsize=font_size, color=color)

                current_number += 1

            doc.save(output_path)
            doc.close()
            return True, None
        except Exception as e:
            logger.error(f"Error adding page numbers: {e}")
            return False, str(e)

    @staticmethod
    def protect_pdf(
        file_path: str,
        open_password: str,
        owner_password: Optional[str] = None,
        allow_printing: bool = True,
        allow_copying: bool = True,
        allow_modifying: bool = False,
        output_path: str = ""
    ) -> Tuple[bool, Optional[str]]:
        """Encrypts PDF with AES-256 password protection and granular permissions."""
        try:
            doc = fitz.open(file_path)
            if not open_password:
                doc.close()
                return False, "Open password cannot be empty."

            owner_pw = owner_password if owner_password else open_password

            # Build permission bitmask
            perm = 0
            if allow_printing:
                perm |= fitz.PDF_PERM_PRINT
            if allow_copying:
                perm |= fitz.PDF_PERM_COPY
            if allow_modifying:
                perm |= fitz.PDF_PERM_MODIFY

            # Save with AES-256 encryption
            doc.save(
                output_path,
                encryption=fitz.PDF_ENCRYPT_AES_256,
                user_pw=open_password,
                owner_pw=owner_pw,
                permissions=perm
            )
            doc.close()
            return True, None
        except Exception as e:
            logger.error(f"Error encrypting PDF: {e}")
            return False, str(e)

    @staticmethod
    def compare_pdfs(file_path_a: str, file_path_b: str) -> Dict[str, Any]:
        """Performs comprehensive page-by-page text & visual difference comparison."""
        doc_a = fitz.open(file_path_a)
        doc_b = fitz.open(file_path_b)

        total_a = len(doc_a)
        total_b = len(doc_b)
        max_pages = max(total_a, total_b)

        page_results = []
        changed_pages_count = 0
        total_changes_count = 0

        for idx in range(max_pages):
            has_a = idx < total_a
            has_b = idx < total_b

            page_num = idx + 1

            if not has_a:
                page_results.append({
                    "page_number": page_num,
                    "status": "added",  # Page present in B but not A
                    "diff_count": 1,
                    "text_a": "",
                    "text_b": doc_b[idx].get_text(),
                    "thumb_a": None,
                    "thumb_b": PdfToolsService._render_single_page_thumb(doc_b[idx]),
                    "diff_thumb": None,
                    "diff_summary": "Page added in PDF B."
                })
                changed_pages_count += 1
                total_changes_count += 1
                continue

            if not has_b:
                page_results.append({
                    "page_number": page_num,
                    "status": "removed",  # Page present in A but not B
                    "diff_count": 1,
                    "text_a": doc_a[idx].get_text(),
                    "text_b": "",
                    "thumb_a": PdfToolsService._render_single_page_thumb(doc_a[idx]),
                    "thumb_b": None,
                    "diff_thumb": None,
                    "diff_summary": "Page removed in PDF B."
                })
                changed_pages_count += 1
                total_changes_count += 1
                continue

            page_a = doc_a[idx]
            page_b = doc_b[idx]

            text_a = page_a.get_text()
            text_b = page_b.get_text()

            # Pixmap visual rendering for difference detection
            pix_a = page_a.get_pixmap(matrix=fitz.Matrix(0.4, 0.4))
            pix_b = page_b.get_pixmap(matrix=fitz.Matrix(0.4, 0.4))

            img_a = Image.open(io.BytesIO(pix_a.tobytes("png"))).convert("RGB")
            img_b = Image.open(io.BytesIO(pix_b.tobytes("png"))).convert("RGB")

            # Resize to match dimensions for difference calculation if needed
            if img_a.size != img_b.size:
                img_b = img_b.resize(img_a.size)

            diff_img = ImageChops.difference(img_a, img_b)
            # Create a red highlighted overlay for differences
            bbox = diff_img.getbbox()
            has_visual_diff = bbox is not None

            # Render diff heatmap image
            diff_b64 = None
            if has_visual_diff:
                # Enhance difference for display
                enhancer = ImageEnhance.Brightness(diff_img)
                diff_enhanced = enhancer.enhance(3.0)
                
                # Convert diff mask to red tint overlay on original image A
                mask = diff_img.convert("L").point(lambda p: 255 if p > 20 else 0)
                red_layer = Image.new("RGB", img_a.size, (255, 0, 0))
                overlay_img = Image.composite(red_layer, img_a, mask)
                
                buf = io.BytesIO()
                overlay_img.save(buf, format="PNG")
                diff_b64 = f"data:image/png;base64,{base64.b64encode(buf.getvalue()).decode('utf-8')}"

            # Text line diffs
            lines_a = [l.strip() for l in text_a.splitlines() if l.strip()]
            lines_b = [l.strip() for l in text_b.splitlines() if l.strip()]

            added_lines = [l for l in lines_b if l not in lines_a]
            removed_lines = [l for l in lines_a if l not in lines_b]
            line_diff_count = len(added_lines) + len(removed_lines)

            status = "identical"
            if line_diff_count > 0 or has_visual_diff:
                status = "changed"
                changed_pages_count += 1
                total_changes_count += max(line_diff_count, 1)

            diff_summary = "No differences detected."
            if status == "changed":
                diff_summary = f"Detected {len(added_lines)} added text lines, {len(removed_lines)} removed text lines." if line_diff_count > 0 else "Detected visual layout differences."

            page_results.append({
                "page_number": page_num,
                "status": status,
                "diff_count": max(line_diff_count, 1 if has_visual_diff else 0),
                "text_a": text_a,
                "text_b": text_b,
                "thumb_a": PdfToolsService._render_single_page_thumb(doc_a[idx]),
                "thumb_b": PdfToolsService._render_single_page_thumb(doc_b[idx]),
                "diff_thumb": diff_b64,
                "diff_summary": diff_summary,
                "added_lines": added_lines,
                "removed_lines": removed_lines
            })

        doc_a.close()
        doc_b.close()

        added_pages_count = max(0, total_b - total_a)
        removed_pages_count = max(0, total_a - total_b)

        return {
            "summary": {
                "total_pages_compared": max_pages,
                "changed_pages": changed_pages_count,
                "added_pages": added_pages_count,
                "removed_pages": removed_pages_count,
                "total_changes": total_changes_count
            },
            "pages": page_results
        }

    @staticmethod
    def _render_single_page_thumb(page: fitz.Page, scale: float = 0.4) -> str:
        pix = page.get_pixmap(matrix=fitz.Matrix(scale, scale))
        b64_str = base64.b64encode(pix.tobytes("png")).decode("utf-8")
        return f"data:image/png;base64,{b64_str}"

    @staticmethod
    def remove_signature_bg(
        input_image_path: str,
        tolerance: int = 30,
        target_hex_color: str = "#FFFFFF",
        output_image_path: str = ""
    ) -> Tuple[bool, Optional[str]]:
        """Removes solid/white background from signature image and outputs transparent PNG."""
        try:
            img = Image.open(input_image_path).convert("RGBA")
            target_hex = target_hex_color.lstrip("#")
            tr = int(target_hex[0:2], 16) if len(target_hex) >= 2 else 255
            tg = int(target_hex[2:4], 16) if len(target_hex) >= 4 else 255
            tb = int(target_hex[4:6], 16) if len(target_hex) >= 6 else 255

            datas = img.get_flattened_data() if hasattr(img, "get_flattened_data") else img.getdata()
            new_data = []

            for item in datas:
                r, g, b, a = item
                # Calculate color distance to target color
                dist = ((r - tr) ** 2 + (g - tg) ** 2 + (b - tb) ** 2) ** 0.5
                if dist <= tolerance:
                    new_data.append((255, 255, 255, 0))  # Fully transparent
                else:
                    new_data.append(item)

            img.putdata(new_data)
            img.save(output_image_path, "PNG")
            return True, None
        except Exception as e:
            logger.error(f"Error removing signature background: {e}")
            return False, str(e)

    @staticmethod
    def stamp_signature(
        pdf_path: str,
        signature_path: str,
        page_index: int,
        x_pct: float,
        y_pct: float,
        width_pct: float,
        height_pct: float,
        output_path: str
    ) -> Tuple[bool, Optional[str]]:
        """Stamps a transparent signature image onto a specified PDF page."""
        try:
            doc = fitz.open(pdf_path)
            if page_index < 0 or page_index >= len(doc):
                doc.close()
                return False, f"Invalid page index {page_index}."

            page = doc[page_index]
            rect = page.rect

            x0 = (x_pct / 100.0) * rect.width
            y0 = (y_pct / 100.0) * rect.height
            w = (width_pct / 100.0) * rect.width
            h = (height_pct / 100.0) * rect.height

            img_rect = fitz.Rect(x0, y0, x0 + w, y0 + h)
            page.insert_image(img_rect, filename=signature_path, overlay=True)

            doc.save(output_path)
            doc.close()
            return True, None
        except Exception as e:
            logger.error(f"Error stamping signature on PDF: {e}")
            return False, str(e)

    @staticmethod
    def rename_pdf(file_path: str, new_filename: str, output_path: str) -> Tuple[bool, Optional[str]]:
        """Copies original PDF content intact to output path with requested target filename."""
        try:
            import shutil
            if not os.path.exists(file_path):
                return False, f"File not found: {file_path}"
            
            # Open PDF with PyMuPDF to verify validity
            doc = fitz.open(file_path)
            doc.close()

            shutil.copy2(file_path, output_path)
            return True, None
        except Exception as e:
            logger.error(f"Error renaming PDF: {e}")
            return False, str(e)

