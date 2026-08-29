# ⚡ FILE CONV — Local-First File Conversion & Merging Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.12](https://img.shields.io/badge/Python-3.12-3776AB.svg?logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5+-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev)
[![Three.js](https://img.shields.io/badge/Three.js-r160+-000000.svg?logo=three.js&logoColor=white)](https://threejs.org)

**FILE CONV** is a local-first multi-format file conversion, batch processing, OCR, and document merging application built with **FastAPI**, **React**, **TypeScript**, **Docling AI**, **Three.js**, **GSAP**, **Anime.js**, and **Tailwind CSS**.

It provides single-file and multi-file batch conversions across **video**, **audio**, **image**, **document**, **presentation**, **spreadsheet**, **web**, and **OCR & Document Intelligence** formats, with single-click **ZIP Archive Downloading**, document merging (`PDF`, `PPTX`, `DOCX`), and AI layout parsing.

---

## 🌟 Key Features

### 1. Multi-File Batch Conversion (1 to N Files)
- Upload multiple files or entire folders via drag & drop.
- Choose a universal target format (e.g. convert 20 mixed files to `PDF`, `MD`, or `DOCX` in one click).
- Real-time progress bars tracking overall batch percentage and per-file progress.
- Single-click **"Download All as ZIP"** archive containing all converted files with original filenames preserved.

### 2. OCR & Document Intelligence (Powered by Docling)
- State-of-the-art document parsing and OCR powered by [IBM Docling](https://github.com/docling-project/docling).
- Extracts text, tables, headers, and formulas from scanned PDFs, images (`PNG`, `JPG`, `WEBP`, `TIFF`, `BMP`), and office documents.
- Exports to:
  - **Structured Markdown** (`.md`) with clean table layouts
  - **Docling JSON AST** (`.json`) with full bounding boxes and reading order
  - **Plain Text** (`.txt`) and **Semantic HTML** (`.html`)
  - **Editable Word Documents** (`.docx`)

### 3. Multi-File Document & Presentation Combiner
- **Merge PDF**: Concatenates multiple PDF files into a single document.
- **Merge PPTX**: Combines slide decks while preserving shape frames, notes, and layouts.
- **Merge DOCX**: Merges Word documents sequentially while preserving paragraph formatting.

### 4. Comprehensive PDF Workspace & Pre-Press Suite
- **PDF Compressor**: Multi-tier optimization (Recommended 144 DPI, Extreme 96 DPI, Light Lossless) with image downsampling and stream deflation.
- **Alternate & Mix (Duplex Weaver)**: Automatically interleave odd and even page batches from duplex scanner runs with reverse-order handling.
- **Watermark Studio**: Customizable text and uploaded logo watermarks with opacity sliders, rotation angles (-90° to +90°), and 2D tile grid repeat.
- **Bates Numbering**: Standardized legal and corporate discovery stamping with custom prefixes, zero-padded digits, and 5-way positioning.
- **Flatten & Grayscale**: Transform colored artwork to ink-saving monochrome grayscale and permanently lock interactive form fields and annotations.
- **Margin & Bleed Crop**: 4-way precision margin trimmer supporting percentages, inches, millimeters, or points.
- **Visual Page Rearrange & Split**: Interactive drag-and-drop page reordering, chapter splitting, and multi-range extraction.
- **Side-by-Side PDF Compare**: Page-by-page visual heatmap diffs and text line diffing between revisions.
- **Transparent Signature Stamper**: Automatic background removal from photographed signatures with drag-and-drop placement on any page.
- **Protect & Password Encrypt**: AES-256 password protection with granular print, copy, and modify permission controls.
- **Export Pages as Images**: Render all PDF pages into high-resolution JPG, PNG, or WebP images packaged into a single-click ZIP archive.

### 5. Bank Statement & Financial Table to Excel
- Automatic detection of tabular transaction grids, debit/credit columns, balances, and multi-column accounting reports.
- Exports structured, multi-sheet formatted **Microsoft Excel (`.xlsx`)** workbooks and CSVs.

### 6. Verified Single-Source-of-Truth Conversion Matrix
- Enforces valid conversion routes before exposing options to the user, preventing invalid or corrupt conversions.

### 7. Awwwards-Level Modern UI Architecture
- **Three.js Interactive 3D Canvas**: Floating wireframe geometries responding to cursor motion with parallax lerping.
- **GSAP Fluid Animations**: Floating glass navbar, smooth page transitions, and staggered grid reveals.
- **Anime.js Micro-Interactions**: Dynamic dropzone scaling, elastic success badges, and ripple effects.
- **Glassmorphism Design System**: Tailored dark palette with ambient neon glows and typography hierarchy (Plus Jakarta Sans + JetBrains Mono).

---

## 📊 Supported Formats Matrix

| Category | Source Formats | Target Options | Engine |
| :--- | :--- | :--- | :--- |
| **OCR & AI** | `.pdf`, `.png`, `.jpg`, `.jpeg`, `.webp`, `.docx`, `.pptx`, `.xlsx` | `.md`, `.txt`, `.json` (Docling AST), `.html`, `.docx`, `.xlsx` (Tables) | Docling AI / PyMuPDF Tables |
| **PDF Tools** | `.pdf` | Compressed `.pdf`, Mixed `.pdf`, Watermarked `.pdf`, Bates `.pdf`, Grayscale `.pdf`, Cropped `.pdf`, Images `.zip` | PyMuPDF Suite / Pillow |
| **Video** | `.mp4`, `.webm`, `.avi`, `.mkv` | `.mp4`, `.avi`, `.mkv`, `.mov`, `.webm`, `.mp3` (extract), `.wav` (extract), `.flac`, `.gif` | FFmpeg |
| **Audio** | `.mp3`, `.wav`, `.flac`, `.ogg` | `.mp3`, `.wav`, `.flac`, `.ogg`, `.opus`, `.aac` | FFmpeg |
| **Image** | `.png`, `.jpg`, `.jpeg`, `.webp` | `.png`, `.jpg`, `.webp`, `.bmp`, `.pdf`, `.md` (OCR), `.txt` (OCR), `.json` (AST) | Pillow / Docling |
| **Presentation** | `.pptx`, `.ppt` | `.pdf`, `.png`, `.jpg`, `.md` | PowerPoint COM / python-pptx / PyMuPDF |
| **Document** | `.pdf`, `.docx`, `.doc` | `.pdf`, `.docx`, `.txt`, `.md`, `.png`, `.jpg`, `.json` (AST) | PyMuPDF / pdf2docx / python-docx / Docling |
| **Spreadsheet** | `.xlsx`, `.xls`, `.csv` | `.csv`, `.json`, `.pdf`, `.txt`, `.xlsx` | pandas / openpyxl / xlrd |
| **Web** | `.html`, `.htm` | `.pdf`, `.md`, `.txt`, `.docx` | html2text / BeautifulSoup / PyMuPDF |
| **Text** | `.txt`, `.md`, `.csv`, `.json` | `.pdf`, `.docx`, `.txt`, `.md`, `.html`, `.xlsx`, `.csv` | Custom Engine / PyMuPDF |

---

## 🛠️ System Architecture

```text
                                  FILE CONV
                                      │
              ┌───────────────────────┴───────────────────────┐
              │                                               │
     Frontend (React + Vite)                         Backend (FastAPI)
     ├── Three.js 3D Background                      ├── Single-Source Matrix
     ├── GSAP & Anime.js Animations                  ├── Asynchronous Task Workers
     ├── Multi-File Batch Dropzone                   ├── FFmpeg Media Transcoder
     ├── PDF Workspace (Compress/Mix/Watermark)      ├── PyMuPDF & Pre-Press Engine
     └── Docling OCR & Table Viewer                  ├── Docling AI & Table Parser
                                                     └── ZIP Archiving Service
```

---

## 🚀 Quickstart & Local Installation Guide

### Prerequisites
- **Python**: 3.11+ or 3.12+
- **Node.js**: v18+ (npm v9+)
- **FFmpeg**: Installed and available in PATH (optional, for video/audio transcoding)

---

### 1. Clone Repository
```bash
git clone https://github.com/sanjayxrdev/File_Conv.git
cd File_Conv
```

---

### 2. Backend Setup & Startup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment and install dependencies
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt

# Start FastAPI backend server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Backend API will be running at: `http://127.0.0.1:8000`  
Interactive Swagger API Documentation: `http://127.0.0.1:8000/api/docs`

---

### 3. Frontend Setup & Startup

Open a second terminal window:

```bash
# Navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Start Vite development server
npm run dev

# (Tip for Windows PowerShell if script execution is restricted):
# npm.cmd run dev
```

Frontend application will be running at: `http://localhost:5173`

---

## 📖 How to Use

### Single & Multi-File Batch Conversion
1. Open `http://localhost:5173`.
2. Drag and drop any supported file or multi-file batch (e.g. `document.pptx`, `video.mp4`, `sample.pdf`).
3. Select the target format and customize options.
4. Click **Convert File Now** (or **Convert All Files Now**) and download the output or complete ZIP archive.

### Dedicated PDF Tools Suite
1. Press <kbd>Ctrl</kbd>+<kbd>K</kbd> (or click **PDF Tools** in the top navigation) to launch any specialized tool:
   - **Compress PDF**: Select compression level (*Recommended*, *Extreme*, or *Light*) and compress in 1 click.
   - **Alternate & Mix (Duplex)**: Upload Doc 1 (Odd) and Doc 2 (Even) to weave pages together.
   - **Watermark PDF**: Add custom text or logo overlay with custom opacity, rotation, and tile grids.
   - **Bates Numbering**: Apply sequential legal discovery stamps (e.g. `CONF-000001-US`).
   - **Bank Statement to Excel**: Extract structured transaction tables directly into a multi-sheet `.xlsx` workbook.
   - **Flatten & Grayscale**: Convert to ink-saving monochrome gray and lock form fields.
   - **Crop Margins**: Trim borders and whitespace margins.

### Merging PDF, PPTX, or Word DOCX
1. Click the **Merge** tab in the top navigation header.
2. Select the merge type (`PDF`, `PPTX`, or `DOCX`).
3. Upload 2 or more files, reorder them using the Up/Down controls if needed.
4. Click **Merge Files Now** to download the combined document.

---

## 🧪 Automated Testing

The repository includes a comprehensive Pytest suite covering single conversions, PDF tools, duplex mixing, watermarking, Bates numbering, compression, multi-file merging, batch processing, spreadsheet extraction, and Docling OCR validation.

```bash
# Navigate to backend directory with active virtual environment
cd backend

# Run full automated test suite
pytest tests -v
```

---

## 📁 Repository Structure

```text
File_Conv/
├── backend/
│   ├── app/
│   │   ├── api/                # FastAPI routers (convert, pdf_tools, ocr, formats, health)
│   │   ├── converters/         # Converters (docling ocr, ffmpeg, pdf, image, document, pptx, html, spreadsheet)
│   │   ├── core/               # Settings & configuration
│   │   ├── models/             # Pydantic schemas & job data structures
│   │   ├── registry/           # Single source of truth conversion matrix
│   │   └── services/           # PDF tools, file, cleanup, and conversion services
│   ├── tests/                  # Pytest test suite (test_advanced_pdf_tools.py, test_conversions.py, etc.)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/         # Dropzones, Progress, Result cards, 3D Canvas, Quick Command Palette
│   │   ├── pages/              # Home, OcrStudio, Merge, Formats, and pages/pdf/* (Compress, Mix, Watermark, Bates, Crop, Financial)
│   │   ├── services/           # API fetch client (api.ts, pdfApi.ts)
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── LICENSE
└── README.md
```

---

## 📄 License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for details.
