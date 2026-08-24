import os
import pytest
from pathlib import Path
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)
FIXTURES_DIR = Path(__file__).parent / "fixtures"

def test_ocr_analyze_unsupported_format():
    response = client.post(
        "/api/ocr/analyze",
        files={"file": ("test.exe", b"invalid executable content", "application/octet-stream")}
    )
    assert response.status_code == 400
    assert "Unsupported format" in response.json()["detail"]

def test_ocr_analyze_empty_file():
    response = client.post(
        "/api/ocr/analyze",
        files={"file": ("sample.png", b"", "image/png")}
    )
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()

def test_ocr_analyze_pdf_endpoint():
    pdf_path = FIXTURES_DIR / "sample.pdf"
    assert pdf_path.exists(), "sample.pdf fixture missing"

    with open(pdf_path, "rb") as f:
        response = client.post(
            "/api/ocr/analyze",
            files={"file": ("sample.pdf", f, "application/pdf")}
        )

    assert response.status_code == 200, f"OCR analyze failed: {response.text}"
    data = response.json()
    assert data["success"] is True
    res = data["data"]
    assert "markdown" in res
    assert "text" in res
    assert "html" in res
    assert "tables" in res
    assert "metadata" in res
    assert "ast" in res
    assert res["metadata"]["num_pages"] >= 1
