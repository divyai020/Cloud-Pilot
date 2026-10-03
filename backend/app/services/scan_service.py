import logging
from uuid import UUID
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.database import SessionLocal
from app.models.user import User
from app.models.cloud_account import CloudAccount
from app.models.resource import Resource
from app.models.scan_job import ScanJob

logger = logging.getLogger("cloudpilot.services.scan_service")

def create_scan_job(db: Session, user: User, account_id: UUID) -> ScanJob:
    """
    1. Validates that the target CloudAccount exists and belongs to the authenticated user.
    2. Creates a new ScanJob in PostgreSQL with status='pending' and progress=0.
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

    scan_job = ScanJob(
        cloud_account_id=account.id,
        progress=0,
        current_step="Scan queued",
        status="pending"
    )

    db.add(scan_job)
    db.commit()
    db.refresh(scan_job)
    return scan_job

def get_scan_job_status(db: Session, user: User, job_id: UUID) -> dict:
    """
    Retrieves the status of a ScanJob:
    1. Verifies that the ScanJob belongs to a CloudAccount owned by the authenticated user.
    2. Counts discovered resources belonging to the scanned account.
    3. Throws HTTP 404 if not found or if ownership check fails (No cross-user leakage).
    """
    scan_job = db.query(ScanJob).join(CloudAccount).filter(
        ScanJob.id == job_id,
        CloudAccount.user_id == user.id
    ).first()

    if not scan_job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan job not found or access denied."
        )

    # Count discovered resources for this cloud account
    resources_count = db.query(Resource).filter(
        Resource.cloud_account_id == scan_job.cloud_account_id
    ).count()

    return {
        "id": scan_job.id,
        "cloud_account_id": scan_job.cloud_account_id,
        "status": scan_job.status,
        "progress": scan_job.progress,
        "current_step": scan_job.current_step,
        "resources_discovered": resources_count,
        "error_message": scan_job.error_message,
        "completed_at": scan_job.completed_at
    }

def execute_background_scan(job_id: UUID, cloud_account_id: UUID):
    """
    FastAPI Background Worker Function:
    1. Creates its OWN fresh SQLAlchemy SessionLocal() to avoid using closed request sessions.
    2. Executes scan lifecycle (pending -> running -> completed / failed).
    3. Handles Demo environment scanning & Live AWS Boto3 resource discovery.
    4. Enforces deduplication on discovered resources.
    """
    db: Session = SessionLocal()
    try:
        scan_job = db.query(ScanJob).filter(ScanJob.id == job_id).first()
        cloud_account = db.query(CloudAccount).filter(CloudAccount.id == cloud_account_id).first()

        if not scan_job or not cloud_account:
            logger.error(f"Background scan aborted: Job {job_id} or Account {cloud_account_id} not found.")
            return

        # Mark job as running
        scan_job.status = "running"
        scan_job.progress = 10
        scan_job.current_step = "Discovering cloud resources"
        db.commit()

        if cloud_account.account_type == "demo":
            # DEMO SCANNING LIFECYCLE
            # Uses existing demo resources created in Phase 4 without creating duplicates
            scan_job.progress = 25
            scan_job.current_step = "Discovering cloud resources (EC2, S3, RDS, Lambda, IAM)"
            db.commit()

            scan_job.progress = 50
            scan_job.current_step = "Analyzing resource utilization"
            db.commit()

            scan_job.progress = 75
            scan_job.current_step = "Analyzing cloud costs & security configuration"
            db.commit()

            scan_job.progress = 100
            scan_job.current_step = "Analysis Complete"
            scan_job.status = "completed"
            scan_job.completed_at = datetime.now(timezone.utc)
            db.commit()
            logger.info(f"Demo background scan job {job_id} completed successfully.")

        elif cloud_account.account_type == "aws":
            # LIVE AWS DISCOVERY LIFECYCLE
            from app.aws.sts import get_aws_account_identity
            from app.aws.resource_scanner import (
                discover_ec2, discover_s3, discover_rds, discover_lambda, discover_iam
            )

            # Step 1: Acquire temporary STS AssumeRole credentials
            if not cloud_account.role_arn:
                raise ValueError("Live AWS account requires an IAM Role ARN.")

            identity = get_aws_account_identity(
                role_arn=cloud_account.role_arn,
                region=cloud_account.region or "ap-south-1"
            )
            credentials = identity.get("credentials", {})

            discovered_items = []

            # 1. EC2 Discovery
            scan_job.progress = 20
            scan_job.current_step = "Discovering EC2 instances"
            db.commit()
            discovered_items.extend(discover_ec2(credentials, cloud_account.region or "ap-south-1"))

            # 2. S3 Discovery
            scan_job.progress = 40
            scan_job.current_step = "Discovering S3 buckets"
            db.commit()
            discovered_items.extend(discover_s3(credentials, cloud_account.region or "ap-south-1"))

            # 3. RDS Discovery
            scan_job.progress = 60
            scan_job.current_step = "Discovering RDS databases"
            db.commit()
            discovered_items.extend(discover_rds(credentials, cloud_account.region or "ap-south-1"))

            # 4. Lambda Discovery
            scan_job.progress = 80
            scan_job.current_step = "Discovering Lambda functions"
            db.commit()
            discovered_items.extend(discover_lambda(credentials, cloud_account.region or "ap-south-1"))

            # 5. IAM Discovery & Normalization
            scan_job.progress = 95
            scan_job.current_step = "Discovering IAM users"
            db.commit()
            discovered_items.extend(discover_iam(credentials, cloud_account.region or "ap-south-1"))

            # Save / Update Discovered Resources (Deduplication)
            for item in discovered_items:
                res_id = item["id"]
                existing_res = db.query(Resource).filter(
                    Resource.id == res_id,
                    Resource.cloud_account_id == cloud_account.id
                ).first()

                if existing_res:
                    existing_res.name = item["name"]
                    existing_res.status = item["status"]
                    existing_res.monthly_cost = item["monthly_cost"]
                    existing_res.public_access = item["public_access"]
                    if "instance_type" in item:
                        existing_res.instance_type = item["instance_type"]
                    if "cpu_utilization" in item:
                        existing_res.cpu_utilization = item["cpu_utilization"]
                else:
                    new_res = Resource(cloud_account_id=cloud_account.id, **item)
                    db.add(new_res)

            scan_job.progress = 100
            scan_job.current_step = "Scan complete"
            scan_job.status = "completed"
            scan_job.completed_at = datetime.now(timezone.utc)
            db.commit()
            logger.info(f"Live AWS background scan job {job_id} completed successfully.")

    except Exception as e:
        logger.error(f"Background scan job {job_id} failed: {str(e)}")
        db.rollback()
        try:
            failed_job = db.query(ScanJob).filter(ScanJob.id == job_id).first()
            if failed_job:
                failed_job.status = "failed"
                failed_job.error_message = "Scan job failed during AWS resource discovery."
                db.commit()
        except Exception as inner_e:
            logger.error(f"Failed to record scan job failure state: {str(inner_e)}")
    finally:
        db.close()
