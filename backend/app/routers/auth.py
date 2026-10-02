from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.schemas.user import UserCreate, UserLogin, UserResponse
from app.schemas.auth import Token
from app.services import auth_service
from app.auth.jwt_handler import create_access_token
from app.auth.dependencies import get_db, get_current_user
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/signup", response_model=Token, status_code=status.HTTP_201_CREATED)
def signup(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    User Registration Endpoint:
    Registers a new user, hashes password, saves to DB, and returns a JWT token with user profile.
    """
    new_user = auth_service.register_user(db, user_data)
    access_token = create_access_token(data={"sub": str(new_user.id), "email": new_user.email})
    return Token(token=access_token, user=new_user)

@router.post("/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    """
    User Login Endpoint:
    Authenticates user credentials, verifies password hash, and returns a JWT token with user profile.
    """
    user = auth_service.authenticate_user(db, email=login_data.email, password=login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": str(user.id), "email": user.email})
    return Token(token=access_token, user=user)

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """
    Current User Identity Endpoint:
    Returns profile information for the authenticated user sending a valid Bearer token.
    """
    return current_user

@router.get("/protected")
def protected_route_test(current_user: User = Depends(get_current_user)):
    """
    Test Protected Endpoint:
    Verifies that route protection and current user dependency injection work correctly.
    """
    return {
        "message": "Protected route working",
        "user": {
            "id": str(current_user.id),
            "fullName": current_user.full_name,
            "email": current_user.email
        }
    }
