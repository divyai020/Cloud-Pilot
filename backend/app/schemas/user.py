from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field, ConfigDict

class UserCreate(BaseModel):
    """
    Schema for user signup request body.
    """
    fullName: str = Field(..., alias="fullName", description="Full name of user")
    email: EmailStr = Field(..., description="Valid email address")
    password: str = Field(..., min_length=6, description="Password (at least 6 characters)")

    model_config = ConfigDict(populate_by_name=True)

class UserLogin(BaseModel):
    """
    Schema for user login request body.
    """
    email: EmailStr = Field(..., description="Registered email address")
    password: str = Field(..., description="User password")

class UserResponse(BaseModel):
    """
    Schema for public user profile output (omits password hash).
    """
    id: UUID
    fullName: str = Field(..., serialization_alias="fullName")
    email: EmailStr
    createdAt: datetime = Field(..., serialization_alias="createdAt")

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
    )
