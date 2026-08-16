import os
import time
import json
import zipfile
import pytest
from pathlib import Path
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)
FIXTURES_DIR = Path(__file__).parent / "fixtures"

def test_txt_to_py_preserves_content():
    txt_path = FIXTURES_DIR / "sample.txt"
    with open(txt_path, "rb") as f:
        resp = client.post(
            "/api/convert",
            files={"file": ("sample.txt", f, "text/plain")},
            data={"target_format": "py"}
        )
    assert resp.status_code == 200
    job_id = resp.json()["job_id"]

    for _ in range(20):
        res = client.get(f"/api/convert/{job_id}").json()
        if res["status"] in ["completed", "failed"]:
            break
        time.sleep(0.5)

    assert res["status"] == "completed"

    dl_resp = client.get(f"/api/download/{job_id}")
    assert dl_resp.status_code == 200
    with open(txt_path, "r", encoding="utf-8") as orig:
        assert dl_resp.text.replace("\r\n", "\n") == orig.read().replace("\r\n", "\n")

def test_txt_to_ipynb_generates_valid_notebook():
    txt_path = FIXTURES_DIR / "sample.txt"
    with open(txt_path, "rb") as f:
        resp = client.post(
            "/api/convert",
            files={"file": ("sample.txt", f, "text/plain")},
            data={"target_format": "ipynb"}
        )
    assert resp.status_code == 200
    job_id = resp.json()["job_id"]

    for _ in range(20):
        res = client.get(f"/api/convert/{job_id}").json()
        if res["status"] in ["completed", "failed"]:
            break
        time.sleep(0.5)

    assert res["status"] == "completed"

    dl_resp = client.get(f"/api/download/{job_id}")
    assert dl_resp.status_code == 200
    nb_data = json.loads(dl_resp.text)

    assert "cells" in nb_data
    assert nb_data["nbformat"] == 4
    assert len(nb_data["cells"]) > 0
    assert nb_data["cells"][0]["cell_type"] == "code"

def test_txt_to_code_extensions():
    for ext in ["c", "js", "css", "html", "java", "rs", "cs"]:
        txt_path = FIXTURES_DIR / "sample.txt"
        with open(txt_path, "rb") as f:
            resp = client.post(
                "/api/convert",
                files={"file": ("sample.txt", f, "text/plain")},
                data={"target_format": ext}
            )
        assert resp.status_code == 200
        job_id = resp.json()["job_id"]

        for _ in range(20):
            res = client.get(f"/api/convert/{job_id}").json()
            if res["status"] in ["completed", "failed"]:
                break
            time.sleep(0.5)

        assert res["status"] == "completed"

def test_batch_txt_to_ipynb_and_zip():
    f1 = open(FIXTURES_DIR / "sample.txt", "rb")
    f2 = open(FIXTURES_DIR / "sample.txt", "rb")

    response = client.post(
        "/api/convert-batch",
        files=[
            ("files", ("prog1.txt", f1, "text/plain")),
            ("files", ("prog2.txt", f2, "text/plain"))
        ],
        data={"target_format": "ipynb"}
    )
    f1.close()
    f2.close()

    assert response.status_code == 200
    batch_id = response.json()["batch_id"]

    for _ in range(30):
        res = client.get(f"/api/convert-batch/{batch_id}").json()
        if res["status"] in ["completed", "failed"]:
            break
        time.sleep(0.5)

    assert res["status"] == "completed"
    assert res["completed_files"] == 2

    zip_resp = client.get(f"/api/download-batch/{batch_id}")
    assert zip_resp.status_code == 200
    assert len(zip_resp.content) > 0
