import os
import time
import zipfile
import pytest
from pathlib import Path
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)
FIXTURES_DIR = Path(__file__).parent / "fixtures"

def test_batch_conversion_and_zip_download():
    # Batch convert 3 mixed files (pptx, docx, png) -> PDF
    f1 = open(FIXTURES_DIR / "sample.pptx", "rb")
    f2 = open(FIXTURES_DIR / "sample.docx", "rb")
    f3 = open(FIXTURES_DIR / "sample.png", "rb")

    response = client.post(
        "/api/convert-batch",
        files=[
            ("files", ("sample.pptx", f1, "application/octet-stream")),
            ("files", ("sample.docx", f2, "application/octet-stream")),
            ("files", ("sample.png", f3, "image/png"))
        ],
        data={"target_format": "pdf"}
    )

    f1.close()
    f2.close()
    f3.close()

    assert response.status_code == 200, f"Batch convert failed: {response.text}"
    batch_data = response.json()
    batch_id = batch_data["batch_id"]
    assert batch_data["total_files"] == 3

    # Poll batch status
    for _ in range(30):
        status_resp = client.get(f"/api/convert-batch/{batch_id}")
        assert status_resp.status_code == 200
        res = status_resp.json()
        if res["status"] in ["completed", "failed"]:
            break
        time.sleep(0.5)

    assert res["status"] == "completed", f"Batch {batch_id} failed: {res}"
    assert res["completed_files"] == 3
    assert res["zip_download_url"] is not None

    # Download batch ZIP
    zip_resp = client.get(f"/api/download-batch/{batch_id}")
    assert zip_resp.status_code == 200
    zip_bytes = zip_resp.content
    assert len(zip_bytes) > 0

    # Verify ZIP contents
    temp_zip_path = FIXTURES_DIR / "temp_test.zip"
    with open(temp_zip_path, "wb") as f:
        f.write(zip_bytes)

    with zipfile.ZipFile(temp_zip_path, "r") as zf:
        namelist = zf.namelist()
        assert "sample.pdf" in namelist
        assert "sample_1.pdf" in namelist or "sample.pdf" in namelist

    os.remove(temp_zip_path)

def test_html_conversions():
    f = open(FIXTURES_DIR / "sample.html", "rb")
    resp = client.post(
        "/api/convert",
        files={"file": ("sample.html", f, "text/html")},
        data={"target_format": "md"}
    )
    f.close()
    assert resp.status_code == 200
    job_id = resp.json()["job_id"]

    for _ in range(20):
        res = client.get(f"/api/convert/{job_id}").json()
        if res["status"] in ["completed", "failed"]:
            break
        time.sleep(0.5)

    assert res["status"] == "completed"

def test_xlsx_conversions():
    f = open(FIXTURES_DIR / "sample.xlsx", "rb")
    resp = client.post(
        "/api/convert",
        files={"file": ("sample.xlsx", f, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
        data={"target_format": "csv"}
    )
    f.close()
    assert resp.status_code == 200
    job_id = resp.json()["job_id"]

    for _ in range(20):
        res = client.get(f"/api/convert/{job_id}").json()
        if res["status"] in ["completed", "failed"]:
            break
        time.sleep(0.5)

    assert res["status"] == "completed"
