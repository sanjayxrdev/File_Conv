import os
import time
import json
import pytest
from pathlib import Path
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)
FIXTURES_DIR = Path(__file__).parent / "fixtures"

def _wait_for_job(job_id: str, max_retries: int = 40) -> dict:
    for _ in range(max_retries):
        resp = client.get(f"/api/convert/{job_id}").json()
        if resp["status"] in ["completed", "failed"]:
            return resp
        time.sleep(0.5)
    return resp

def test_ocr_png_to_txt():
    png_path = FIXTURES_DIR / "sample.png"
    with open(png_path, "rb") as f:
        resp = client.post(
            "/api/convert",
            files={"file": ("sample.png", f, "image/png")},
            data={"target_format": "txt"}
        )
    assert resp.status_code == 200
    job_id = resp.json()["job_id"]
    res = _wait_for_job(job_id)
    assert res["status"] == "completed"

    dl_resp = client.get(f"/api/download/{job_id}")
    assert dl_resp.status_code == 200
    assert len(dl_resp.text.strip()) > 0

def test_ocr_png_to_json():
    png_path = FIXTURES_DIR / "sample.png"
    with open(png_path, "rb") as f:
        resp = client.post(
            "/api/convert",
            files={"file": ("sample.png", f, "image/png")},
            data={"target_format": "json"}
        )
    assert resp.status_code == 200
    job_id = resp.json()["job_id"]
    res = _wait_for_job(job_id)
    assert res["status"] == "completed"

    dl_resp = client.get(f"/api/download/{job_id}")
    assert dl_resp.status_code == 200
    ast_json = json.loads(dl_resp.text)
    assert isinstance(ast_json, dict)

def test_ocr_pdf_to_md():
    pdf_path = FIXTURES_DIR / "sample.pdf"
    with open(pdf_path, "rb") as f:
        resp = client.post(
            "/api/convert",
            files={"file": ("sample.pdf", f, "application/pdf")},
            data={"target_format": "md"}
        )
    assert resp.status_code == 200
    job_id = resp.json()["job_id"]
    res = _wait_for_job(job_id)
    assert res["status"] == "completed"

    dl_resp = client.get(f"/api/download/{job_id}")
    assert dl_resp.status_code == 200
    assert len(dl_resp.text.strip()) > 0
