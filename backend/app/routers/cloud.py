from uuid import UUID
from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.schemas.cloud import (
    CloudConnectRequest,
    CloudAccountResponse,
    CloudDemoResponse
)
from app.services import demo_service, cloud_service
from app.auth.dependencies import get_db, get_current_user
from app.models.user import User

router = APIRouter(prefix="/cloud", tags=["Cloud Connection & Accounts"])

@router.post("/connect", response_model=CloudAccountResponse, status_code=status.HTTP_201_CREATED)
def connect_live_aws_account(
    connect_data: CloudConnectRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Connect Live AWS Account Endpoint:
    Accepts AWS IAM Role ARN, validates identity using Boto3 STS AssumeRole,
    and stores/updates a live CloudAccount record owned by the authenticated user.
    """
    account = cloud_service.connect_aws_account(db, user=current_user, connect_data=connect_data)
    return account

@router.get("/accounts", response_model=List[CloudAccountResponse])
def list_user_cloud_accounts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List Cloud Accounts Endpoint:
    Returns all cloud environments (AWS, Demo, Upload) belonging to the authenticated user.
    """
    accounts = cloud_service.get_user_cloud_accounts(db, user=current_user)
    return accounts

@router.get("/accounts/{account_id}", response_model=CloudAccountResponse)
def get_cloud_account_details(
    account_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Single Cloud Account Endpoint:
    Retrieves details for a specific cloud account belonging to the authenticated user.
    """
    account = cloud_service.get_user_cloud_account_by_id(db, user=current_user, account_id=account_id)
    return account

@router.post("/demo", response_model=CloudDemoResponse, status_code=status.HTTP_201_CREATED)
def initialize_demo_cloud(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Demo Cloud Environment Initialization Endpoint:
    Populates the database with realistic sample AWS resources, cost trends,
    security findings, recommendations, and a completed scan job for the authenticated user.
    """
    result = demo_service.seed_demo_data(db, user=current_user)
    return result
