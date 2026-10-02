from uuid import UUID
from fastapi import APIRouter, Depends, BackgroundTasks, status
from sqlalchemy.orm import Session

from app.schemas.scan import (
    ScanStartRequest,
    ScanStartResponse,
    ScanStatusResponse
)
from app.services import scan_service
from app.auth.dependencies import get_db, get_current_user
from app.models.user import User

router = APIRouter(prefix="/scan", tags=["Cloud Resource Scanning"])

@router.post("/start", response_model=ScanStartResponse, status_code=status.HTTP_202_ACCEPTED)
def start_cloud_scan(
    request: ScanStartRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Start Cloud Scan Endpoint:
    1. Validates that the cloud account belongs to the authenticated user.
    2. Creates a new ScanJob record in PostgreSQL (status='pending', progress=0).
    3. Queues an asynchronous FastAPI background task to execute resource discovery.
    4. Returns ScanJob ID and initial status immediately.
    """
    scan_job = scan_service.create_scan_job(db, user=current_user, account_id=request.accountId)
    
    # Pass scalar IDs to background task (Background task opens its own DB session)
    background_tasks.add_task(
        scan_service.execute_background_scan,
        job_id=scan_job.id,
        cloud_account_id=scan_job.cloud_account_id
    )
    
    return scan_job

@router.get("/status/{job_id}", response_model=ScanStatusResponse)
def get_scan_status(
    job_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Poll Scan Status Endpoint:
    1. Retrieves ScanJob status and progress percentage (0-100%).
    2. Enforces multi-user ownership check (404 if unauthorized or job belongs to another user).
    3. Returns count of discovered resources once available.
    """
    status_data = scan_service.get_scan_job_status(db, user=current_user, job_id=job_id)
    return status_data
