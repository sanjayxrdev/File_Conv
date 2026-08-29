import os
import io
import time
import pytest
from pathlib import Path
from fastapi.testclient import TestClient
import fitz

from app.main import app

client = TestClient(app)
FIXTURES_DIR = Path(__file__).parent / "fixtures"

def _poll_job(job_id: str, max_retries: int = 30):
    for _ in range(max_retries):
        resp = client.get(f"/api/convert/{job_id}")
        assert resp.status_code == 200
        data = resp.json()
        if data["status"] in ["completed", "failed"]:
            return data
        time.sleep(0.3)
    return {}

def test_compress_pdf():
    pdf_path = FIXTURES_DIR / "sample.pdf"
    with open(pdf_path, "rb") as f:
        resp = client.post(
            "/api/pdf/compress",
            files={"file": ("sample.pdf", f, "application/pdf")},
            data={"compression_level": "recommended"}
        )
    assert resp.status_code == 200
    job_id = resp.json()["job_id"]
    result = _poll_job(job_id)
    assert result.get("status") == "completed", f"Job failed: {result.get('error')}"

def test_alternate_mix_pdf():
    pdf_a = FIXTURES_DIR / "sample.pdf"
    pdf_b = FIXTURES_DIR / "sample2.pdf"
    with open(pdf_a, "rb") as fa, open(pdf_b, "rb") as fb:
        resp = client.post(
            "/api/pdf/alternate-mix",
            files={
                "file_a": ("sample.pdf", fa, "application/pdf"),
                "file_b": ("sample2.pdf", fb, "application/pdf")
            },
            data={"reverse_b": "false", "repeat_remaining": "true"}
        )
    assert resp.status_code == 200
    job_id = resp.json()["job_id"]
    result = _poll_job(job_id)
    assert result.get("status") == "completed", f"Job failed: {result.get('error')}"

def test_watermark_pdf():
    pdf_path = FIXTURES_DIR / "sample.pdf"
    with open(pdf_path, "rb") as f:
        resp = client.post(
            "/api/pdf/watermark",
            files={"file": ("sample.pdf", f, "application/pdf")},
            data={
                "text": "CONFIDENTIAL",
                "opacity": "0.35",
                "rotation": "45.0",
                "tile": "false",
                "color_hex": "#FF0000",
                "font_size": "36.0"
            }
        )
    assert resp.status_code == 200
    job_id = resp.json()["job_id"]
    result = _poll_job(job_id)
    assert result.get("status") == "completed", f"Job failed: {result.get('error')}"

def test_bates_numbering_pdf():
    pdf_path = FIXTURES_DIR / "sample.pdf"
    with open(pdf_path, "rb") as f:
        resp = client.post(
            "/api/pdf/bates-numbering",
            files={"file": ("sample.pdf", f, "application/pdf")},
            data={
                "prefix": "LEGAL-",
                "suffix": "-US",
                "start_number": "1",
                "digits": "5",
                "position": "bottom-right",
                "font_size": "11.0",
                "color_hex": "#000000"
            }
        )
    assert resp.status_code == 200
    job_id = resp.json()["job_id"]
    result = _poll_job(job_id)
    assert result.get("status") == "completed", f"Job failed: {result.get('error')}"

def test_flatten_grayscale_pdf():
    pdf_path = FIXTURES_DIR / "sample.pdf"
    with open(pdf_path, "rb") as f:
        resp = client.post(
            "/api/pdf/flatten-grayscale",
            files={"file": ("sample.pdf", f, "application/pdf")},
            data={"make_grayscale": "true", "flatten_forms": "true"}
        )
    assert resp.status_code == 200
    job_id = resp.json()["job_id"]
    result = _poll_job(job_id)
    assert result.get("status") == "completed", f"Job failed: {result.get('error')}"

def test_crop_pdf():
    pdf_path = FIXTURES_DIR / "sample.pdf"
    with open(pdf_path, "rb") as f:
        resp = client.post(
            "/api/pdf/crop",
            files={"file": ("sample.pdf", f, "application/pdf")},
            data={
                "margin_top": "10.0",
                "margin_bottom": "10.0",
                "margin_left": "10.0",
                "margin_right": "10.0",
                "unit": "pt"
            }
        )
    assert resp.status_code == 200
    job_id = resp.json()["job_id"]
    result = _poll_job(job_id)
    assert result.get("status") == "completed", f"Job failed: {result.get('error')}"

def test_edit_metadata():
    pdf_path = FIXTURES_DIR / "sample.pdf"
    with open(pdf_path, "rb") as f:
        resp = client.post(
            "/api/pdf/metadata",
            files={"file": ("sample.pdf", f, "application/pdf")},
            data={
                "title": "New Title",
                "author": "Antigravity",
                "subject": "PDF Tools Suite",
                "keywords": "fast, local, privacy"
            }
        )
    assert resp.status_code == 200
    job_id = resp.json()["job_id"]
    result = _poll_job(job_id)
    assert result.get("status") == "completed", f"Job failed: {result.get('error')}"

def test_bank_statement_to_excel():
    pdf_path = FIXTURES_DIR / "sample.pdf"
    with open(pdf_path, "rb") as f:
        resp = client.post(
            "/api/pdf/bank-statement-to-excel",
            files={"file": ("sample.pdf", f, "application/pdf")}
        )
    assert resp.status_code == 200
    job_id = resp.json()["job_id"]
    result = _poll_job(job_id)
    assert result.get("status") == "completed", f"Job failed: {result.get('error')}"
