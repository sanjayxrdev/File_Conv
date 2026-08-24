import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_auth_demo_login():
    response = client.post(
        "/api/auth/login",
        json={"email": "demo@fileconv.app", "password": "demo1234"}
    )
    assert response.status_code == 200, f"Demo login failed: {response.text}"
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "demo@fileconv.app"
    assert data["user"]["name"] == "Demo Pro User"

def test_auth_register_and_get_me():
    email = "testuser_unique_123@fileconv.app"
    register_resp = client.post(
        "/api/auth/register",
        json={"email": email, "password": "password123", "name": "Test User"}
    )
    assert register_resp.status_code == 200
    token_data = register_resp.json()
    token = token_data["access_token"]

    # Test /api/auth/me with Bearer token
    me_resp = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert me_resp.status_code == 200
    user = me_resp.json()
    assert user["email"] == email
    assert user["name"] == "Test User"

def test_auth_invalid_login():
    response = client.post(
        "/api/auth/login",
        json={"email": "nonexistent@fileconv.app", "password": "wrongpassword"}
    )
    assert response.status_code == 401

def test_session_conversion_history():
    session_id = "session_test_guest_999"
    # 1. Record conversion history for guest session
    add_resp = client.post(
        "/api/auth/history",
        json={
            "job_id": "job_sample_123",
            "original_filename": "document.pdf",
            "source_format": "pdf",
            "target_format": "docx",
            "status": "completed",
            "download_url": "/api/download/job_sample_123",
            "output_size_bytes": 102400,
            "session_id": session_id
        }
    )
    assert add_resp.status_code == 200
    item = add_resp.json()
    assert item["job_id"] == "job_sample_123"

    # 2. Retrieve history by session_id
    get_resp = client.get(f"/api/auth/history?session_id={session_id}")
    assert get_resp.status_code == 200
    history = get_resp.json()
    assert len(history) >= 1
    assert history[0]["job_id"] == "job_sample_123"

    # 3. Delete item
    del_resp = client.delete(f"/api/auth/history/job_sample_123?session_id={session_id}")
    assert del_resp.status_code == 200
    assert del_resp.json()["success"] is True
