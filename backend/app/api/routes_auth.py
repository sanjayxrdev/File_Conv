import logging
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Header, Query, Depends
from app.models.user import UserCreate, UserLogin, UserResponse, TokenResponse, HistoryItem, AddHistoryRequest
from app.services.auth_service import auth_service, verify_access_token

logger = logging.getLogger("routes_auth")
router = APIRouter(prefix="/auth", tags=["Authentication & Session"])

def get_optional_current_user_id(authorization: Optional[str] = Header(None)) -> Optional[str]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization[7:].strip()
    payload = verify_access_token(token)
    if not payload:
        return None
    return payload.get("sub")

def get_current_user_id(authorization: Optional[str] = Header(None)) -> str:
    user_id = get_optional_current_user_id(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required or token expired.")
    return user_id

@router.post("/register", response_model=TokenResponse)
async def register_endpoint(req: UserCreate):
    """
    Registers a new user account and returns a JWT access token.
    """
    user_resp, token, err = auth_service.register(req)
    if err or not user_resp or not token:
        raise HTTPException(status_code=400, detail=err or "Registration failed.")
    return TokenResponse(access_token=token, user=user_resp)

@router.post("/login", response_model=TokenResponse)
async def login_endpoint(req: UserLogin):
    """
    Logs in an existing user and returns a JWT access token.
    """
    user_resp, token, err = auth_service.login(req)
    if err or not user_resp or not token:
        raise HTTPException(status_code=401, detail=err or "Login failed.")
    return TokenResponse(access_token=token, user=user_resp)

@router.get("/me", response_model=UserResponse)
async def get_me_endpoint(user_id: str = Depends(get_current_user_id)):
    """
    Returns profile information for the authenticated user.
    """
    user = auth_service.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return user

@router.get("/history", response_model=List[HistoryItem])
async def get_history_endpoint(
    session_id: Optional[str] = Query(None),
    user_id: Optional[str] = Depends(get_optional_current_user_id)
):
    """
    Returns conversion history associated with the authenticated user or guest session.
    """
    return auth_service.get_history(user_id=user_id, session_id=session_id)

@router.post("/history", response_model=HistoryItem)
async def add_history_endpoint(
    req: AddHistoryRequest,
    user_id: Optional[str] = Depends(get_optional_current_user_id)
):
    """
    Records a completed conversion in the user or guest session history.
    """
    return auth_service.record_conversion(req, user_id=user_id)

@router.delete("/history/{job_id}")
async def delete_history_item_endpoint(
    job_id: str,
    session_id: Optional[str] = Query(None),
    user_id: Optional[str] = Depends(get_optional_current_user_id)
):
    """
    Deletes a specific conversion history entry.
    """
    deleted = auth_service.delete_history_item(job_id, user_id=user_id, session_id=session_id)
    return {"success": deleted}

@router.delete("/history")
async def clear_history_endpoint(
    session_id: Optional[str] = Query(None),
    user_id: Optional[str] = Depends(get_optional_current_user_id)
):
    """
    Clears all conversion history for the current session or user.
    """
    auth_service.clear_history(user_id=user_id, session_id=session_id)
    return {"success": True}
