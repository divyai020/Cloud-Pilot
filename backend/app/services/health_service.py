import logging
from uuid import UUID
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.user import User
from app.models.cloud_account import CloudAccount
from app.models.resource import Resource
from app.models.security_finding import SecurityFinding
from app.services.dashboard_service import get_user_cloud_account

logger = logging.getLogger("cloudpilot.services.health_service")

def calculate_cloud_health_score(db: Session, user: User, account_id: Optional[UUID] = None) -> Dict[str, Any]:
    """
    Cloud Health Score Analytical Engine:
    Calculates a score between 0 and 100 based on security findings and cloud waste ratio.
    
    Formula:
    Score = 100 - (Critical Findings * 10) - (High Findings * 5) - (Medium Findings * 2) - (Cloud Waste Ratio * 20)
    
    Score is strictly clamped to [0, 100] and updates CloudAccount.health_score in PostgreSQL.
    """
    account = get_user_cloud_account(db, user, account_id)

    # 1. Count Security Findings by Severity
    critical_count = db.query(func.count(SecurityFinding.id)).filter(
        SecurityFinding.cloud_account_id == account.id,
        SecurityFinding.severity.ilike("Critical")
    ).scalar() or 0

    high_count = db.query(func.count(SecurityFinding.id)).filter(
        SecurityFinding.cloud_account_id == account.id,
        SecurityFinding.severity.ilike("High")
    ).scalar() or 0

    medium_count = db.query(func.count(SecurityFinding.id)).filter(
        SecurityFinding.cloud_account_id == account.id,
        SecurityFinding.severity.ilike("Medium")
    ).scalar() or 0

    # 2. Resource Utilization & Cloud Waste Ratio Calculation
    total_resources = db.query(func.count(Resource.id)).filter(
        Resource.cloud_account_id == account.id
    ).scalar() or 0

    # Count underutilized / wasted resources
    # Rule A: EC2 instance with cpu_utilization < 20.0
    # Rule B: S3 bucket with public_access == True
    underutilized_ec2 = db.query(func.count(Resource.id)).filter(
        Resource.cloud_account_id == account.id,
        Resource.type == "EC2",
        Resource.cpu_utilization.isnot(None),
        Resource.cpu_utilization < 20.0
    ).scalar() or 0

    public_s3 = db.query(func.count(Resource.id)).filter(
        Resource.cloud_account_id == account.id,
        Resource.type == "S3",
        Resource.public_access == True
    ).scalar() or 0

    underutilized_count = underutilized_ec2 + public_s3

    waste_ratio_available = total_resources > 0
    if total_resources > 0:
        cloud_waste_ratio = round(underutilized_count / float(total_resources), 4)
    else:
        cloud_waste_ratio = 0.0

    # 3. Calculate Raw Health Score
    raw_score = 100.0 - (critical_count * 10) - (high_count * 5) - (medium_count * 2) - (cloud_waste_ratio * 20.0)

    # 4. Score Clamping [0, 100]
    clamped_score = max(0, min(100, int(round(raw_score))))

    # 5. Safely update persisted health_score in PostgreSQL
    try:
        account.health_score = clamped_score
        db.commit()
        db.refresh(account)
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to update CloudAccount.health_score in DB: {str(e)}")

    now = datetime.now(timezone.utc)

    return {
        "accountId": account.id,
        "healthScore": clamped_score,
        "factors": {
            "criticalFindings": critical_count,
            "highFindings": high_count,
            "mediumFindings": medium_count,
            "cloudWasteRatio": cloud_waste_ratio,
            "wasteRatioAvailable": waste_ratio_available,
            "underutilizedResources": underutilized_count,
            "totalResources": total_resources
        },
        "updatedAt": now
    }
