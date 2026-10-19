from fastapi import APIRouter, Depends
from app.schemas.user import UserResponse
from app.auth.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/profile", response_model=UserResponse)
def get_user_profile(current_user: User = Depends(get_current_user)):
    """
    User Profile Endpoint:
    Returns authenticated user's profile details.
    """
    return current_user
