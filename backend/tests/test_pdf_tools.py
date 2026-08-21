import os
import io
import fitz
import pytest
import json
from PIL import Image
from fastapi.testclient import TestClient
from app.main import app
from app.services.pdf_tools_service import PdfToolsService

client = TestClient(app)

@pytest.fixture
def sample_pdf_path(tmp_path):
    """Creates a sample 3-page PDF file for testing."""
    pdf_file = tmp_path / "test_doc.pdf"
    doc = fitz.open()
    for i in range(3):
        page = doc.new_page()
        page.insert_text(fitz.Point(50, 50), f"Test Page {i + 1}")
    doc.save(str(pdf_file))
    doc.close()
    return str(pdf_file)

@pytest.fixture
def sample_signature_image(tmp_path):
    """Creates a sample signature image with white background."""
    img_file = tmp_path / "sig.png"
    img = Image.new("RGB", (100, 50), color="white")
    # Draw simple black line for signature
    for x in range(10, 90):
        img.putpixel((x, 25), (0, 0, 0))
    img.save(str(img_file))
    return str(img_file)

def test_pdf_info_endpoint(sample_pdf_path):
    with open(sample_pdf_path, "rb") as f:
        response = client.post("/api/pdf/info", files={"file": ("test_doc.pdf", f, "application/pdf")})
    assert response.status_code == 200
    data = response.json()
    assert data["total_pages"] == 3
    assert len(data["thumbnails"]) == 3

def test_pdf_rearrange_endpoint(sample_pdf_path):
    with open(sample_pdf_path, "rb") as f:
        response = client.post(
            "/api/pdf/rearrange",
            files={"file": ("test_doc.pdf", f, "application/pdf")},
            data={"page_order": "[2, 0, 1]"}
        )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "queued"

def test_pdf_split_endpoint(sample_pdf_path):
    with open(sample_pdf_path, "rb") as f:
        response = client.post(
            "/api/pdf/split",
            files={"file": ("test_doc.pdf", f, "application/pdf")},
            data={"split_mode": "every_n", "every_n": "1"}
        )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "queued"

def test_pdf_extract_endpoint(sample_pdf_path):
    with open(sample_pdf_path, "rb") as f:
        response = client.post(
            "/api/pdf/extract",
            files={"file": ("test_doc.pdf", f, "application/pdf")},
            data={"page_indices": "[0, 2]"}
        )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "queued"

def test_pdf_rotate_endpoint(sample_pdf_path):
    with open(sample_pdf_path, "rb") as f:
        response = client.post(
            "/api/pdf/rotate",
            files={"file": ("test_doc.pdf", f, "application/pdf")},
            data={"rotations": '{"0": 90}', "default_rotation": "0"}
        )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "queued"

def test_pdf_add_page_numbers_endpoint(sample_pdf_path):
    options = {
        "position": "bottom-center",
        "num_format": "Page 1 of N",
        "font_size": 10,
        "text_color": "#111111"
    }
    with open(sample_pdf_path, "rb") as f:
        response = client.post(
            "/api/pdf/add-page-numbers",
            files={"file": ("test_doc.pdf", f, "application/pdf")},
            data={"options": json.dumps(options)}
        )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "queued"

def test_pdf_protect_endpoint(sample_pdf_path):
    with open(sample_pdf_path, "rb") as f:
        response = client.post(
            "/api/pdf/protect",
            files={"file": ("test_doc.pdf", f, "application/pdf")},
            data={
                "open_password": "secretpassword123",
                "allow_printing": "true",
                "allow_copying": "true"
            }
        )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "queued"

def test_pdf_compare_endpoint(sample_pdf_path):
    with open(sample_pdf_path, "rb") as f1, open(sample_pdf_path, "rb") as f2:
        response = client.post(
            "/api/pdf/compare",
            files={
                "file_a": ("doc_a.pdf", f1, "application/pdf"),
                "file_b": ("doc_b.pdf", f2, "application/pdf")
            }
        )
    assert response.status_code == 200
    data = response.json()
    assert data["summary"]["total_pages_compared"] == 3
    assert data["summary"]["changed_pages"] == 0

def test_transparent_signature_endpoint(sample_signature_image):
    with open(sample_signature_image, "rb") as f:
        response = client.post(
            "/api/pdf/transparent-signature",
            files={"file": ("sig.png", f, "image/png")},
            data={"tolerance": "30", "target_color": "#FFFFFF"}
        )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "queued"

def test_stamp_signature_endpoint(sample_pdf_path, sample_signature_image):
    with open(sample_pdf_path, "rb") as f1, open(sample_signature_image, "rb") as f2:
        response = client.post(
            "/api/pdf/stamp-signature",
            files={
                "pdf_file": ("test_doc.pdf", f1, "application/pdf"),
                "signature_file": ("sig.png", f2, "image/png")
            },
            data={
                "page_index": "0",
                "x_pct": "10",
                "y_pct": "80",
                "width_pct": "20",
                "height_pct": "10"
            }
        )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "queued"

# Direct Service Execution Verification Tests

def test_service_rearrange_pdf(sample_pdf_path, tmp_path):
    out_pdf = tmp_path / "rearranged.pdf"
    success, err = PdfToolsService.rearrange_pdf(sample_pdf_path, [2, 0, 1], str(out_pdf))
    assert success is True
    assert err is None
    assert os.path.exists(out_pdf)

    doc = fitz.open(str(out_pdf))
    assert len(doc) == 3
    # Page 0 should contain 'Test Page 3'
    assert "Test Page 3" in doc[0].get_text()
    doc.close()

def test_service_extract_pdf_pages(sample_pdf_path, tmp_path):
    out_pdf = tmp_path / "extracted.pdf"
    success, err = PdfToolsService.extract_pdf_pages(sample_pdf_path, [0, 2], str(out_pdf))
    assert success is True
    assert err is None
    assert os.path.exists(out_pdf)

    doc = fitz.open(str(out_pdf))
    assert len(doc) == 2
    doc.close()

def test_service_rotate_pdf_pages(sample_pdf_path, tmp_path):
    out_pdf = tmp_path / "rotated.pdf"
    success, err = PdfToolsService.rotate_pdf_pages(sample_pdf_path, {0: 90}, 0, str(out_pdf))
    assert success is True
    assert err is None

    doc = fitz.open(str(out_pdf))
    assert doc[0].rotation == 90
    assert doc[1].rotation == 0
    doc.close()

def test_service_protect_pdf_and_authenticate(sample_pdf_path, tmp_path):
    out_pdf = tmp_path / "protected.pdf"
    pw = "SecretKey99!"
    success, err = PdfToolsService.protect_pdf(sample_pdf_path, open_password=pw, output_path=str(out_pdf))
    assert success is True
    assert err is None

    # Verify document is encrypted and opens with password
    doc = fitz.open(str(out_pdf))
    assert doc.is_encrypted is True
    authenticated = doc.authenticate(pw)
    assert authenticated > 0
    doc.close()

def test_service_transparent_signature(sample_signature_image, tmp_path):
    out_png = tmp_path / "transparent_sig.png"
    success, err = PdfToolsService.remove_signature_bg(sample_signature_image, tolerance=30, target_hex_color="#FFFFFF", output_image_path=str(out_png))
    assert success is True
    assert err is None
    assert os.path.exists(out_png)

    # Verify PNG has RGBA channel with alpha=0 for background pixels
    img = Image.open(str(out_png))
    assert img.mode == "RGBA"
    # Check top-left pixel (was white) is now transparent alpha 0
    pixel = img.getpixel((0, 0))
    assert pixel[3] == 0

def test_pdf_rename_endpoint(sample_pdf_path):
    with open(sample_pdf_path, "rb") as f:
        response = client.post(
            "/api/pdf/rename",
            files={"file": ("test_doc.pdf", f, "application/pdf")},
            data={"new_filename": "my-renamed-doc"}
        )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "queued"

def test_service_rename_pdf(sample_pdf_path, tmp_path):
    out_pdf = tmp_path / "renamed.pdf"
    success, err = PdfToolsService.rename_pdf(sample_pdf_path, "renamed.pdf", str(out_pdf))
    assert success is True
    assert err is None
    assert os.path.exists(out_pdf)

    # Verify PDF content is untouched
    doc = fitz.open(str(out_pdf))
    assert len(doc) == 3
    doc.close()
