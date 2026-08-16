# ⚡ FILE CONV — Local-First File Conversion & Merging Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.12](https://img.shields.io/badge/Python-3.12-3776AB.svg?logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5+-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev)
[![Three.js](https://img.shields.io/badge/Three.js-r160+-000000.svg?logo=three.js&logoColor=white)](https://threejs.org)

**FILE CONV** is a local-first multi-format file conversion, batch processing, and document merging application built with **FastAPI**, **React**, **TypeScript**, **Three.js**, **GSAP**, **Anime.js**, and **Tailwind CSS**.

It provides single-file and multi-file batch conversions across **video**, **audio**, **image**, **document**, **presentation**, **spreadsheet**, **web**, and **text/code** formats, with single-click **ZIP Archive Downloading**, document merging (`PDF`, `PPTX`, `DOCX`), and Jupyter Notebook (`.ipynb`) generation.

---

## 🌟 Key Features

### 1. Multi-File Batch Conversion (1 to N Files)
- Upload multiple files or entire folders via drag & drop.
- Choose a universal target format (e.g. convert 20 mixed files to `PDF`, `MD`, or `DOCX` in one click).
- Real-time progress bars tracking overall batch percentage and per-file progress.
- Single-click **"Download All as ZIP"** archive containing all converted files with original filenames preserved.

### 2. Text & Code Conversion Category
- Convert `.txt` files into programming source code extensions:
  - `.txt` → `.py` (Python)
  - `.txt` → `.c` (C)
  - `.txt` → `.ipynb` (Jupyter Notebook v4 Schema)
  - `.txt` → `.js` (JavaScript)
  - `.txt` → `.css` (CSS)
  - `.txt` → `.html` (HTML)
  - `.txt` → `.java` (Java)
  - `.txt` → `.rs` (Rust)
  - `.txt` → `.cs` (C#)
- **Jupyter Notebook Generator**: Converts `.txt` into a genuine, fully valid v4 Jupyter Notebook JSON structure that opens natively in JupyterLab, VS Code, and Google Colab.

### 3. Multi-File Document & Presentation Combiner
- **Merge PDF**: Concatenates multiple PDF files into a single document.
- **Merge PPTX**: Combines slide decks while preserving shape frames, notes, and layouts.
- **Merge DOCX**: Merges Word documents sequentially while preserving paragraph formatting.

### 4. Verified Single-Source-of-Truth Conversion Matrix
- Enforces valid conversion routes before exposing options to the user, preventing invalid or corrupt conversions.

### 5. Awwwards-Level Modern UI Architecture
- **Three.js Interactive 3D Canvas**: Floating wireframe geometries responding to cursor motion with parallax lerping.
- **GSAP Fluid Animations**: Floating glass navbar, smooth page transitions, and staggered grid reveals.
- **Anime.js Micro-Interactions**: Dynamic dropzone scaling, elastic success badges, and ripple effects.
- **Glassmorphism Design System**: Tailored dark palette with ambient neon glows and typography hierarchy (Plus Jakarta Sans + JetBrains Mono).

---

## 📊 Supported Formats Matrix

| Category | Source Formats | Target Options | Engine |
| :--- | :--- | :--- | :--- |
| **Video** | `.mp4`, `.webm`, `.avi`, `.mkv` | `.mp4`, `.avi`, `.mkv`, `.mov`, `.webm`, `.mp3` (extract), `.wav` (extract), `.flac`, `.gif` | FFmpeg |
| **Audio** | `.mp3`, `.wav`, `.flac`, `.ogg` | `.mp3`, `.wav`, `.flac`, `.ogg`, `.opus`, `.aac` | FFmpeg |
| **Image** | `.png`, `.jpg`, `.jpeg`, `.webp` | `.png`, `.jpg`, `.webp`, `.bmp`, `.pdf` | Pillow |
| **Presentation** | `.pptx`, `.ppt` | `.pdf`, `.png`, `.jpg`, `.md` | PowerPoint COM / python-pptx / PyMuPDF |
| **Document** | `.pdf`, `.docx`, `.doc` | `.pdf`, `.docx`, `.txt`, `.md`, `.png`, `.jpg` | PyMuPDF / pdf2docx / python-docx |
| **Spreadsheet** | `.xlsx`, `.xls`, `.csv` | `.csv`, `.json`, `.pdf`, `.txt`, `.xlsx` | pandas / openpyxl / xlrd |
| **Web** | `.html`, `.htm` | `.pdf`, `.md`, `.txt`, `.docx` | html2text / BeautifulSoup / PyMuPDF |
| **Text & Code** | `.txt`, `.md`, `.json` | `.py`, `.c`, `.ipynb`, `.js`, `.css`, `.html`, `.java`, `.rs`, `.cs`, `.pdf`, `.md` | Custom Code Engine / Jupyter v4 Schema |

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
     └── Reorder & Merge UI                          ├── PyMuPDF & COM Engine
                                                     └── ZIP Archiving Service
```

---

## 🚀 Quickstart & Local Installation Guide

### Prerequisites
- **Python**: 3.12+
- **Node.js**: v18+ (npm v9+)
- **FFmpeg**: Installed and available in PATH (or WinGet standard location)

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

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
# source .venv/bin/activate

# Install backend dependencies
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
```

Frontend application will be running at: `http://localhost:5173`

---

## 📖 How to Use

### Single File Conversion
1. Open `http://localhost:5173`.
2. Drag and drop any supported file (e.g. `document.pptx`, `video.mp4`, `script.txt`).
3. Select the target format and customize options (resolution, bitrate, DPI).
4. Click **Convert File Now** and download the converted output.

### Multi-File Batch Conversion
1. Drag and drop **multiple files** (1 to N) or click **Select Folder**.
2. Select a universal target format (e.g. `PDF`, `Jupyter Notebook (.ipynb)`, `Python (.py)`).
3. Click **Convert All Files Now**.
4. Track per-file progress and click **Download All Converted Files (.ZIP)**.

### Merging PDF, PPTX, or Word DOCX
1. Click the **Merge Files** tab in the top navigation header.
2. Select the merge type (`PDF`, `PPTX`, or `DOCX`).
3. Upload 2 or more files, reorder them using the Up/Down controls if needed.
4. Click **Merge Files Now** to download the combined document.

---

## 🧪 Automated Testing

The repository includes a comprehensive 35-test Pytest suite covering single conversions, PPTX COM fallback, multi-file merging, batch processing, HTML parsing, spreadsheet extraction, code file preservation, and Jupyter notebook schema validation.

```bash
# Navigate to backend directory with active virtual environment
cd backend

# Generate test fixtures
python tests/generate_fixtures.py

# Run full automated test suite
pytest tests -v
```

Output:
```text
======================= 35 passed in 12.81s =======================
```

---

## 📁 Repository Structure

```text
File_Conv/
├── backend/
│   ├── app/
│   │   ├── api/                # FastAPI router endpoints (convert, batch, merge, formats, health)
│   │   ├── converters/         # Engine modules (ffmpeg, pdf, image, document, pptx, html, spreadsheet, code)
│   │   ├── core/               # Settings & configuration
│   │   ├── models/             # Pydantic schemas & job data structures
│   │   ├── registry/           # Single source of truth conversion matrix
│   │   └── services/           # File, batch, and merge services
│   ├── tests/                  # Pytest test suite & fixture generator
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/         # Dropzones, Progress, Result cards, Three.js canvas, Navbar
│   │   ├── pages/              # Home, Merge, Formats matrix, About
│   │   ├── services/           # API fetch client
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
#   F i l e _ C o n v  
 