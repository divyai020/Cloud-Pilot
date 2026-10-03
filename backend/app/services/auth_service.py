from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user import User
from app.schemas.user import UserCreate
from app.auth.password import hash_password, verify_password

def get_user_by_email(db: Session, email: str) -> User | None:
    """
    Retrieves a user by email address from PostgreSQL database.
    """
    return db.query(User).filter(User.email == email).first()

def get_user_by_id(db: Session, user_id: str) -> User | None:
    """
    Retrieves a user by UUID primary key from PostgreSQL database.
    """
    return db.query(User).filter(User.id == user_id).first()

def register_user(db: Session, user_data: UserCreate) -> User:
    """
    Registers a new user:
    1. Checks if email is already registered.
    2. Hashes the plaintext password using bcrypt.
    3. Saves the User entity to PostgreSQL.
    """
    existing_user = get_user_by_email(db, user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    hashed_pwd = hash_password(user_data.password)
    new_user = User(
        full_name=user_data.fullName,
        email=user_data.email,
        password_hash=hashed_pwd
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

def authenticate_user(db: Session, email: str, password: str) -> User | None:
    """
    Authenticates user login:
    1. Queries user by email.
    2. Verifies bcrypt password hash against input password.
    Returns User object if valid, or None if invalid.
    """
    user = get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user
