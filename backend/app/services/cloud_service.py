from uuid import UUID
from typing import List
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.user import User
from app.models.cloud_account import CloudAccount
from app.schemas.cloud import CloudConnectRequest
from app.aws.sts import get_aws_account_identity

def connect_aws_account(db: Session, user: User, connect_data: CloudConnectRequest) -> CloudAccount:
    """
    Validates AWS IAM Role ARN connection, retrieves identity via STS AssumeRole,
    and updates or creates a user-owned CloudAccount record.
    """
    # Validate connection via Boto3 STS connector
    identity = get_aws_account_identity(
        role_arn=connect_data.roleArn,
        region=connect_data.region
    )
    
    detected_aws_account_id = identity.get("aws_account_id")

    # Duplicate Handling Strategy:
    # Check if the current user has already connected this specific AWS account
    existing_account = None
    if detected_aws_account_id:
        existing_account = db.query(CloudAccount).filter(
            CloudAccount.user_id == user.id,
            CloudAccount.account_type == "aws",
            CloudAccount.aws_account_id == detected_aws_account_id
        ).first()

    if existing_account:
        # Update existing connection metadata
        existing_account.account_name = connect_data.accountName
        existing_account.role_arn = connect_data.roleArn.strip()
        existing_account.region = connect_data.region
        existing_account.status = "active"
        db.commit()
        db.refresh(existing_account)
        return existing_account

    # Create new AWS CloudAccount bound to authenticated user
    new_account = CloudAccount(
        user_id=user.id,
        account_name=connect_data.accountName,
        account_type="aws",
        aws_account_id=detected_aws_account_id,
        role_arn=connect_data.roleArn.strip(),
        region=connect_data.region,
        status="active",
        health_score=100
    )
    
    db.add(new_account)
    db.commit()
    db.refresh(new_account)
    return new_account

def get_user_cloud_accounts(db: Session, user: User) -> List[CloudAccount]:
    """
    Retrieves all cloud accounts (live AWS, demo, upload) belonging to the authenticated user.
    Enforces strict multi-user privacy isolation (user_id == current_user.id).
    """
    return db.query(CloudAccount).filter(
        CloudAccount.user_id == user.id
    ).order_by(CloudAccount.created_at.desc()).all()

def get_user_cloud_account_by_id(db: Session, user: User, account_id: UUID) -> CloudAccount:
    """
    Retrieves a single cloud account belonging to the authenticated user.
    Raises HTTP 404 if not found or if the account belongs to a different user.
    """
    account = db.query(CloudAccount).filter(
        CloudAccount.id == account_id,
        CloudAccount.user_id == user.id
    ).first()

    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cloud account not found or access denied."
        )

    return account
