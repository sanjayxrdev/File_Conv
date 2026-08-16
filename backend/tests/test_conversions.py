import os
import time
import pytest
from pathlib import Path
from fastapi.testclient import TestClient
from app.main import app
from app.registry.conversion_registry import ConversionRegistry

client = TestClient(app)
FIXTURES_DIR = Path(__file__).parent / "fixtures"

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "service" in data

def test_formats_endpoint():
    response = client.get("/api/formats")
    assert response.status_code == 200
    data = response.json()
    assert "categories" in data
    assert "formats" in data
    assert "mp4" in data["formats"]
    assert "pdf" in data["formats"]

def _run_conversion_flow(fixture_name: str, target_format: str):
    file_path = FIXTURES_DIR / fixture_name
    assert file_path.exists(), f"Fixture {fixture_name} missing"

    with open(file_path, "rb") as f:
        response = client.post(
            "/api/convert",
            files={"file": (fixture_name, f, "application/octet-stream")},
            data={"target_format": target_format}
        )

    assert response.status_code == 200, f"Convert post failed: {response.text}"
    job_data = response.json()
    job_id = job_data["job_id"]

    # Poll status until complete or failed (max 15s)
    max_retries = 30
    for _ in range(max_retries):
        status_resp = client.get(f"/api/convert/{job_id}")
        assert status_resp.status_code == 200
        res = status_resp.json()
        if res["status"] in ["completed", "failed"]:
            break
        time.sleep(0.5)

    assert res["status"] == "completed", f"Job {job_id} failed: {res.get('error')}"
    assert res["progress"] == 100

    # Test download
    dl_resp = client.get(f"/api/download/{job_id}")
    assert dl_resp.status_code == 200
    assert len(dl_resp.content) > 0

    # Cleanup
    client.delete(f"/api/convert/{job_id}")

# ----------------- VIDEO CONVERSIONS -----------------
def test_convert_mp4_to_mp3():
    _run_conversion_flow("sample.mp4", "mp3")

def test_convert_mp4_to_wav():
    _run_conversion_flow("sample.mp4", "wav")

def test_convert_mp4_to_avi():
    _run_conversion_flow("sample.mp4", "avi")

def test_convert_mp4_to_webm():
    _run_conversion_flow("sample.mp4", "webm")

# ----------------- AUDIO CONVERSIONS -----------------
def test_convert_mp3_to_wav():
    _run_conversion_flow("sample.mp3", "wav")

def test_convert_mp3_to_flac():
    _run_conversion_flow("sample.mp3", "flac")

def test_convert_mp3_to_opus():
    _run_conversion_flow("sample.mp3", "opus")

# ----------------- PDF CONVERSIONS -----------------
def test_convert_pdf_to_txt():
    _run_conversion_flow("sample.pdf", "txt")

def test_convert_pdf_to_md():
    _run_conversion_flow("sample.pdf", "md")

def test_convert_pdf_to_png():
    _run_conversion_flow("sample.pdf", "png")

def test_convert_pdf_to_jpg():
    _run_conversion_flow("sample.pdf", "jpg")

def test_convert_pdf_to_docx():
    _run_conversion_flow("sample.pdf", "docx")

# ----------------- IMAGE CONVERSIONS -----------------
def test_convert_png_to_jpg():
    _run_conversion_flow("sample.png", "jpg")

def test_convert_png_to_webp():
    _run_conversion_flow("sample.png", "webp")

# ----------------- DOCUMENT CONVERSIONS -----------------
def test_convert_txt_to_md():
    _run_conversion_flow("sample.txt", "md")

def test_convert_md_to_txt():
    _run_conversion_flow("sample.md", "txt")

def test_convert_csv_to_xlsx():
    _run_conversion_flow("sample.csv", "xlsx")

def test_convert_json_to_csv():
    _run_conversion_flow("sample.json", "csv")

# ----------------- INVALID CONVERSIONS & ERROR HANDLING -----------------
def test_reject_invalid_conversion_route():
    file_path = FIXTURES_DIR / "sample.mp3"
    with open(file_path, "rb") as f:
        response = client.post(
            "/api/convert",
            files={"file": ("sample.mp3", f, "audio/mpeg")},
            data={"target_format": "docx"}
        )
    assert response.status_code == 400
    err = response.json()["detail"]
    assert err["code"] == "UNSUPPORTED_CONVERSION_ROUTE"

def test_reject_unsupported_file_extension():
    response = client.post(
        "/api/convert",
        files={"file": ("test.exe", b"binary content", "application/octet-stream")},
        data={"target_format": "mp3"}
    )
    assert response.status_code == 400
    err = response.json()["detail"]
    assert err["code"] == "UNSUPPORTED_SOURCE_FORMAT"
