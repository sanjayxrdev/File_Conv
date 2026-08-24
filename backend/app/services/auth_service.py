import os
import hmac
import json
import uuid
import time
import base64
import hashlib
import logging
from datetime import datetime, timezone
from typing import Dict, Optional, List, Tuple, Any
from app.models.user import UserCreate, UserLogin, UserResponse, HistoryItem, AddHistoryRequest

logger = logging.getLogger("auth_service")

SECRET_KEY = os.environ.get("AUTH_SECRET_KEY", "fileconv-super-secret-key-2026")
SALT = b"fileconv_salt_fixed_2026"
TOKEN_EXPIRATION_SECONDS = 7 * 24 * 3600  # 7 days

def hash_password(password: str) -> str:
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), SALT, 100000)
    return key.hex()

def verify_password(password: str, password_hash: str) -> bool:
    return hmac.compare_digest(hash_password(password), password_hash)

def b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")

def b64url_decode(data: str) -> bytes:
    padding = "=" * ((4 - len(data) % 4) % 4)
    return base64.urlsafe_b64decode((data + padding).encode("utf-8"))

def create_access_token(user_id: str, email: str) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    payload = {
        "sub": user_id,
        "email": email,
        "exp": int(time.time()) + TOKEN_EXPIRATION_SECONDS,
        "iat": int(time.time())
    }
    encoded_header = b64url_encode(json.dumps(header).encode("utf-8"))
    encoded_payload = b64url_encode(json.dumps(payload).encode("utf-8"))
    signature = hmac.new(
        SECRET_KEY.encode("utf-8"),
        f"{encoded_header}.{encoded_payload}".encode("utf-8"),
        hashlib.sha256
    ).digest()
    encoded_sig = b64url_encode(signature)
    return f"{encoded_header}.{encoded_payload}.{encoded_sig}"

def verify_access_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        encoded_header, encoded_payload, encoded_sig = parts
        expected_sig = hmac.new(
            SECRET_KEY.encode("utf-8"),
            f"{encoded_header}.{encoded_payload}".encode("utf-8"),
            hashlib.sha256
        ).digest()
        if not hmac.compare_digest(b64url_encode(expected_sig), encoded_sig):
            return None
        payload = json.loads(b64url_decode(encoded_payload).decode("utf-8"))
        if payload.get("exp", 0) < time.time():
            return None
        return payload
    except Exception as e:
        logger.warning(f"Failed verifying token: {e}")
        return None

class AuthService:
    def __init__(self):
        # User store: user_id -> dict
        self._users: Dict[str, dict] = {}
        # Email lookup: email -> user_id
        self._email_to_id: Dict[str, str] = {}
        # Conversion history: list of HistoryItem dicts
        self._history: List[dict] = []

        # Create Default Demo User
        self._seed_demo_user()

    def _seed_demo_user(self):
        demo_id = "user_demo_default"
        demo_email = "demo@fileconv.app"
        if demo_email not in self._email_to_id:
            self._users[demo_id] = {
                "id": demo_id,
                "email": demo_email,
                "name": "Demo Pro User",
                "password_hash": hash_password("demo1234"),
                "created_at": datetime.now(timezone.utc).isoformat(),
                "total_conversions": 14,
                "plan": "Pro Developer"
            }
            self._email_to_id[demo_email] = demo_id

    def register(self, req: UserCreate) -> Tuple[Optional[UserResponse], Optional[str], Optional[str]]:
        email = req.email.lower().strip()
        if email in self._email_to_id:
            return None, None, "An account with this email already exists."

        user_id = f"user_{uuid.uuid4().hex[:12]}"
        now = datetime.now(timezone.utc).isoformat()
        user_record = {
            "id": user_id,
            "email": email,
            "name": req.name.strip(),
            "password_hash": hash_password(req.password),
            "created_at": now,
            "total_conversions": 0,
            "plan": "Free Community"
        }
        self._users[user_id] = user_record
        self._email_to_id[email] = user_id

        token = create_access_token(user_id, email)
        user_resp = UserResponse(
            id=user_id,
            email=email,
            name=user_record["name"],
            created_at=now,
            total_conversions=0,
            plan=user_record["plan"]
        )
        return user_resp, token, None

    def login(self, req: UserLogin) -> Tuple[Optional[UserResponse], Optional[str], Optional[str]]:
        email = req.email.lower().strip()
        user_id = self._email_to_id.get(email)
        if not user_id or user_id not in self._users:
            return None, None, "Invalid email or password."

        user_record = self._users[user_id]
        if not verify_password(req.password, user_record["password_hash"]):
            return None, None, "Invalid email or password."

        token = create_access_token(user_id, email)
        user_resp = UserResponse(
            id=user_id,
            email=email,
            name=user_record["name"],
            created_at=user_record["created_at"],
            total_conversions=user_record.get("total_conversions", 0),
            plan=user_record.get("plan", "Free Community")
        )
        return user_resp, token, None

    def get_user_by_id(self, user_id: str) -> Optional[UserResponse]:
        user_record = self._users.get(user_id)
        if not user_record:
            return None
        return UserResponse(
            id=user_record["id"],
            email=user_record["email"],
            name=user_record["name"],
            created_at=user_record["created_at"],
            total_conversions=user_record.get("total_conversions", 0),
            plan=user_record.get("plan", "Free Community")
        )

    def record_conversion(self, req: AddHistoryRequest, user_id: Optional[str] = None) -> HistoryItem:
        history_id = f"hist_{uuid.uuid4().hex[:12]}"
        now = datetime.now(timezone.utc).isoformat()
        item = {
            "id": history_id,
            "job_id": req.job_id,
            "original_filename": req.original_filename,
            "source_format": req.source_format,
            "target_format": req.target_format,
            "status": req.status,
            "download_url": req.download_url,
            "output_size_bytes": req.output_size_bytes,
            "created_at": now,
            "user_id": user_id,
            "session_id": req.session_id
        }
        self._history.insert(0, item)
        # Cap memory history to 200 items
        if len(self._history) > 200:
            self._history = self._history[:200]

        # Increment user conversion counter if logged in
        if user_id and user_id in self._users:
            self._users[user_id]["total_conversions"] = self._users[user_id].get("total_conversions", 0) + 1

        return HistoryItem(**item)

    def get_history(self, user_id: Optional[str] = None, session_id: Optional[str] = None) -> List[HistoryItem]:
        results = []
        for h in self._history:
            if user_id and h.get("user_id") == user_id:
                results.append(HistoryItem(**h))
            elif session_id and h.get("session_id") == session_id:
                results.append(HistoryItem(**h))
        return results

    def delete_history_item(self, job_id: str, user_id: Optional[str] = None, session_id: Optional[str] = None) -> bool:
        initial_len = len(self._history)
        self._history = [
            h for h in self._history 
            if not (h.get("job_id") == job_id and (
                (user_id and h.get("user_id") == user_id) or 
                (session_id and h.get("session_id") == session_id)
            ))
        ]
        return len(self._history) < initial_len

    def clear_history(self, user_id: Optional[str] = None, session_id: Optional[str] = None):
        self._history = [
            h for h in self._history
            if not (
                (user_id and h.get("user_id") == user_id) or
                (session_id and h.get("session_id") == session_id)
            )
        ]

auth_service = AuthService()
