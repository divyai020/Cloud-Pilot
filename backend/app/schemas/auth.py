from pydantic import BaseModel
from app.schemas.user import UserResponse

class Token(BaseModel):
    """
    Schema for JWT token response matching React frontend expectations.
    """
    token: str
    user: UserResponse

class TokenPayload(BaseModel):
    """
    Schema for decoded JWT token payload data.
    """
    sub: str  # User ID
    email: str
    exp: int
