"""
Code & Notebook Converter Engine
=================================
This module handles conversions between source code files (.py, .js, .c, .java, .rs, .cs, .css),
plain text (.txt, .md), and Jupyter Notebooks (.ipynb v4 JSON schema), as well as styled HTML outputs.
"""

import os
import json
import logging
from typing import Dict, Any, Callable, Optional, Tuple
from app.converters.base import BaseConverter

logger = logging.getLogger("code_converter")

class CodeConverter(BaseConverter):
    """
    Engine for converting code files and Jupyter Notebooks.
    
    Supported Source Formats:
      - .ipynb (Jupyter Notebook)
      - .py (Python Script)
      - .js (JavaScript)
      - .c (C Source Code)
      - .java (Java Source)
      - .rs (Rust Source)
      - .cs (C# Source)
      - .css (CSS Stylesheet)
      - .txt (Plain Text)
      - .md (Markdown File)

    Supported Target Formats:
      - .ipynb : Generates valid v4 Jupyter Notebook JSON schema.
      - .html  : Renders syntax-styled HTML document container.
      - .py, .c, .js, .css, .java, .rs, .cs, .txt, .md : Exports clean source text.
    """

    async def convert(
        self,
        input_path: str,
        output_path: str,
        source_ext: str,
        target_ext: str,
        options: Optional[Dict[str, Any]] = None,
        progress_callback: Optional[Callable[[int, str], None]] = None
    ) -> Tuple[bool, Optional[str]]:
        """
        Executes code conversion pipeline.
        
        Args:
            input_path: Absolute path to source file.
            output_path: Absolute path for output file.
            source_ext: Extension of source file (e.g. 'py', 'ipynb').
            target_ext: Extension of target file (e.g. 'ipynb', 'html').
            options: Optional conversion parameters.
            progress_callback: Async/sync callback for percentage progress.

        Returns:
            Tuple[bool, Optional[str]]: (success_status, error_message_if_any)
        """
        source_ext = source_ext.lower().lstrip(".")
        target_ext = target_ext.lower().lstrip(".")

        try:
            # Step 1: Read raw input file content
            if progress_callback:
                progress_callback(10, f"Reading file content ({source_ext.upper()})...")

            with open(input_path, "r", encoding="utf-8", errors="replace") as f:
                content = f.read()

            # Step 2: Extract code content (special handling for Jupyter Notebook .ipynb input)
            extracted_code = content
            if source_ext == "ipynb":
                try:
                    # Parse Jupyter Notebook JSON schema (v4 format)
                    nb_json = json.loads(content)
                    cells = nb_json.get("cells", [])
                    code_blocks = []

                    # Extract code lines from notebook cells
                    for cell in cells:
                        cell_source = cell.get("source", [])
                        cell_text = "".join(cell_source) if isinstance(cell_source, list) else str(cell_source)
                        
                        if cell.get("cell_type") == "code":
                            code_blocks.append(cell_text)
                        elif cell.get("cell_type") == "markdown" and target_ext in ["md", "txt"]:
                            code_blocks.append(f"# {cell_text}")

                    if code_blocks:
                        extracted_code = "\n\n".join(code_blocks)

                except Exception as e:
                    logger.warning(f"Could not parse IPYNB as JSON, falling back to raw text: {e}")

            # Step 3: Branch by target format

            # ----------------------------------------------------
            # TARGET A: Jupyter Notebook (.ipynb)
            # ----------------------------------------------------
            if target_ext == "ipynb":
                if progress_callback:
                    progress_callback(50, "Generating valid Jupyter Notebook v4 JSON schema...")

                # Format code lines into list strings required by Jupyter v4 schema
                lines = [line + "\n" for line in extracted_code.splitlines()]
                if not lines:
                    lines = [""]

                # Construct standard v4 Jupyter Notebook structure
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

                # Write notebook JSON file
                with open(output_path, "w", encoding="utf-8") as out:
                    json.dump(notebook_data, out, indent=2)

                if progress_callback:
                    progress_callback(100, "Jupyter Notebook (.ipynb) created successfully.")
                return True, None

            # ----------------------------------------------------
            # TARGET B: HTML Document (.html)
            # ----------------------------------------------------
            elif target_ext == "html":
                if progress_callback:
                    progress_callback(50, "Formatting code into HTML document...")

                # Escape HTML special characters for clean rendering
                escaped_content = (
                    extracted_code.replace("&", "&amp;")
                    .replace("<", "&lt;")
                    .replace(">", "&gt;")
                )

                # Render HTML container with modern dark mono theme
                html_doc = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Formatted Code - {os.path.basename(input_path)}</title>
  <style>
    body {{
      font-family: 'JetBrains Mono', Consolas, Monaco, monospace;
      background-color: #0f172a;
      color: #e2e8f0;
      padding: 2rem;
      margin: 0;
      line-height: 1.6;
    }}
    .container {{
      max-width: 960px;
      margin: 0 auto;
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 1.5rem 2rem;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5);
    }}
    .header {{
      font-size: 0.85rem;
      color: #94a3b8;
      border-bottom: 1px solid #334155;
      padding-bottom: 0.75rem;
      margin-bottom: 1rem;
      font-weight: 600;
    }}
    pre {{
      margin: 0;
      overflow-x: auto;
      font-size: 0.9rem;
      white-space: pre-wrap;
      word-break: break-word;
    }}
    code {{
      color: #38bdf8;
    }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">Source: {os.path.basename(input_path)} &bull; Converted to HTML</div>
    <pre><code>{escaped_content}</code></pre>
  </div>
</body>
</html>"""
                with open(output_path, "w", encoding="utf-8") as out:
                    out.write(html_doc)

                if progress_callback:
                    progress_callback(100, "HTML code document generated successfully.")
                return True, None

            # ----------------------------------------------------
            # TARGET C: Source Code & Text (.py, .c, .js, .css, .java, .rs, .cs, .txt, .md)
            # ----------------------------------------------------
            elif target_ext in ["py", "c", "js", "css", "java", "rs", "cs", "txt", "md"]:
                if progress_callback:
                    progress_callback(50, f"Writing source file (.{target_ext})...")

                with open(output_path, "w", encoding="utf-8") as out:
                    out.write(extracted_code)

                if progress_callback:
                    progress_callback(100, f"Converted to .{target_ext.upper()} file.")
                return True, None

            else:
                return False, f"Unsupported target code format: {target_ext}"

        except Exception as e:
            logger.exception(f"Error during code conversion: {e}")
            return False, f"Code conversion error: {str(e)}"
