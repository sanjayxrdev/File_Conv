import os
import time
import pytest
from pathlib import Path
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)
FIXTURES_DIR = Path(__file__).parent / "fixtures"

def _run_conversion(fixture_name: str, target_format: str):
    file_path = FIXTURES_DIR / fixture_name
    assert file_path.exists(), f"Fixture {fixture_name} missing"

    with open(file_path, "rb") as f:
        response = client.post(
            "/api/convert",
            files={"file": (fixture_name, f, "application/octet-stream")},
            data={"target_format": target_format}
        )

    assert response.status_code == 200, f"Convert post failed: {response.text}"
    job_id = response.json()["job_id"]

    for _ in range(30):
        status_resp = client.get(f"/api/convert/{job_id}")
        res = status_resp.json()
        if res["status"] in ["completed", "failed"]:
            break
        time.sleep(0.5)

    assert res["status"] == "completed", f"Job {job_id} failed: {res.get('error')}"
    assert res["progress"] == 100

    dl_resp = client.get(f"/api/download/{job_id}")
    assert dl_resp.status_code == 200
    assert len(dl_resp.content) > 0

    client.delete(f"/api/convert/{job_id}")

def _run_merge(fixture1: str, fixture2: str, merge_type: str):
    p1 = FIXTURES_DIR / fixture1
    p2 = FIXTURES_DIR / fixture2
    assert p1.exists() and p2.exists()

    with open(p1, "rb") as f1, open(p2, "rb") as f2:
        response = client.post(
            "/api/merge",
            files=[
                ("files", (fixture1, f1, "application/octet-stream")),
                ("files", (fixture2, f2, "application/octet-stream"))
            ],
            data={"merge_type": merge_type}
        )

    assert response.status_code == 200, f"Merge post failed: {response.text}"
    job_id = response.json()["job_id"]

    for _ in range(30):
        status_resp = client.get(f"/api/convert/{job_id}")
        res = status_resp.json()
        if res["status"] in ["completed", "failed"]:
            break
        time.sleep(0.5)

    assert res["status"] == "completed", f"Merge job {job_id} failed: {res.get('error')}"

    dl_resp = client.get(f"/api/download/{job_id}")
    assert dl_resp.status_code == 200
    assert len(dl_resp.content) > 0

    client.delete(f"/api/convert/{job_id}")

# ----------------- PPTX CONVERSIONS -----------------
def test_pptx_to_md():
    _run_conversion("sample.pptx", "md")

def test_pptx_to_pdf():
    _run_conversion("sample.pptx", "pdf")

def test_pptx_to_png():
    _run_conversion("sample.pptx", "png")

# ----------------- MULTI-FILE MERGING -----------------
def test_merge_pdf():
    _run_merge("sample.pdf", "sample2.pdf", "pdf")

def test_merge_pptx():
    _run_merge("sample.pptx", "sample2.pptx", "ppt")

def test_merge_docx():
    _run_merge("sample.docx", "sample2.docx", "docx")
