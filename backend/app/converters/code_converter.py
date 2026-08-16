import os
import json
import logging
from typing import Dict, Any, Callable, Optional, Tuple
from app.converters.base import BaseConverter

logger = logging.getLogger("code_converter")

class CodeConverter(BaseConverter):
    async def convert(
        self,
        input_path: str,
        output_path: str,
        source_ext: str,
        target_ext: str,
        options: Optional[Dict[str, Any]] = None,
        progress_callback: Optional[Callable[[int, str], None]] = None
    ) -> Tuple[bool, Optional[str]]:
        target_ext = target_ext.lower().lstrip(".")

        try:
            if progress_callback:
                progress_callback(10, f"Reading text file content...")

            with open(input_path, "r", encoding="utf-8", errors="replace") as f:
                content = f.read()

            # TXT -> Jupyter Notebook (.ipynb)
            if target_ext == "ipynb":
                if progress_callback:
                    progress_callback(50, "Generating valid Jupyter Notebook v4 JSON schema...")

                # Format text lines for Jupyter Notebook source array
                lines = [line + "\n" for line in content.splitlines()]
                if not lines:
                    lines = [""]

                notebook_data = {
                    "cells": [
                        {
                            "cell_type": "code",
                            "execution_count": None,
                            "metadata": {},
                            "outputs": [],
                            "source": lines
                        }
                    ],
                    "metadata": {
                        "language_info": {
                            "name": "python"
                        }
                    },
                    "nbformat": 4,
                    "nbformat_minor": 2
                }

                with open(output_path, "w", encoding="utf-8") as out:
                    json.dump(notebook_data, out, indent=2)

                if progress_callback:
                    progress_callback(100, "Jupyter Notebook created successfully.")
                return True, None

            # TXT -> Source Code File (.py, .c, .js, .css, .html, .java, .rs, .cs)
            elif target_ext in ["py", "c", "js", "css", "html", "java", "rs", "cs"]:
                if progress_callback:
                    progress_callback(50, f"Writing source code file (.{target_ext})...")

                # Preserve exact text/code content
                with open(output_path, "w", encoding="utf-8") as out:
                    out.write(content)

                if progress_callback:
                    progress_callback(100, f"Converted to .{target_ext.upper()} code file.")
                return True, None

            else:
                return False, f"Unsupported target code format: {target_ext}"

        except Exception as e:
            return False, f"Code conversion error: {str(e)}"
