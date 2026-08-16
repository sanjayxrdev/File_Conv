import os
import logging
from typing import Dict, Any, Callable, Optional, Tuple
from app.converters.base import BaseConverter

logger = logging.getLogger("image_converter")

class ImageConverter(BaseConverter):
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
            from PIL import Image
        except ImportError:
            return False, "Pillow library is not installed."

        try:
            if progress_callback:
                progress_callback(10, "Loading source image...")

            with Image.open(input_path) as img:
                if progress_callback:
                    progress_callback(40, "Processing image channels & formatting...")

                # Handle transparency when converting RGBA/LA -> JPEG/BMP/PDF
                if target_ext in ["jpg", "jpeg", "bmp", "pdf"]:
                    if img.mode in ("RGBA", "LA", "P"):
                        # Create white background for transparent images
                        background = Image.new("RGB", img.size, (255, 255, 255))
                        if img.mode == "P":
                            img = img.convert("RGBA")
                        background.paste(img, mask=img.split()[-1] if img.mode == "RGBA" else None)
                        img = background
                    elif img.mode != "RGB":
                        img = img.convert("RGB")

                save_kwargs = {}
                if target_ext in ["jpg", "jpeg"]:
                    quality = int(options.get("quality", 90))
                    save_kwargs["quality"] = quality
                    save_kwargs["optimize"] = True
                    target_format = "JPEG"
                elif target_ext == "png":
                    target_format = "PNG"
                    save_kwargs["optimize"] = True
                elif target_ext == "webp":
                    quality = int(options.get("quality", 85))
                    save_kwargs["quality"] = quality
                    target_format = "WEBP"
                elif target_ext == "bmp":
                    target_format = "BMP"
                elif target_ext == "gif":
                    target_format = "GIF"
                elif target_ext == "pdf":
                    target_format = "PDF"
                else:
                    target_format = target_ext.upper()

                if progress_callback:
                    progress_callback(70, f"Saving image as {target_ext.upper()}...")

                img.save(output_path, format=target_format, **save_kwargs)

            if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
                if progress_callback:
                    progress_callback(100, "Image conversion completed.")
                return True, None
            else:
                return False, "Output image file is empty or missing."

        except Exception as e:
            return False, f"Image conversion error: {str(e)}"
