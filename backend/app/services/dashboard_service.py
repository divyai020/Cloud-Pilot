import logging
from uuid import UUID
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status

from app.models.user import User
from app.models.cloud_account import CloudAccount
from app.models.resource import Resource
from app.models.cost_record import CostRecord
from app.models.security_finding import SecurityFinding
from app.models.recommendation import Recommendation
from app.models.scan_job import ScanJob

logger = logging.getLogger("cloudpilot.services.dashboard_service")

def get_user_cloud_account(db: Session, user: User, account_id: Optional[UUID] = None) -> CloudAccount:
    """
    Helper function to locate and verify ownership of a CloudAccount.
    - If account_id is explicitly provided, verifies user ownership or throws 404.
    - If account_id is None, automatically selects the user's most recent cloud account.
    """
    if account_id:
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
    else:
        account = db.query(CloudAccount).filter(
            CloudAccount.user_id == user.id
        ).order_by(CloudAccount.created_at.desc()).first()
        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No cloud accounts found for user. Please connect an account or initialize demo environment."
            )
        return account

def get_dashboard_summary(db: Session, user: User, account_id: Optional[UUID] = None) -> dict:
    """
    Aggregates comprehensive dashboard metrics for the target cloud account.
    """
    account = get_user_cloud_account(db, user, account_id)

    # 1. Resource Aggregations
    total_resources = db.query(func.count(Resource.id)).filter(
        Resource.cloud_account_id == account.id
    ).scalar() or 0

    res_type_rows = db.query(
        Resource.type, func.count(Resource.id)
    ).filter(
        Resource.cloud_account_id == account.id
    ).group_by(Resource.type).all()
    resources_by_type = {r_type: count for r_type, count in res_type_rows}

    # 2. Cost Aggregations
    total_cost = db.query(func.sum(CostRecord.amount)).filter(
        CostRecord.cloud_account_id == account.id
    ).scalar() or 0.0

    # Latest month cost calculation
    latest_period = db.query(func.max(CostRecord.period_date)).filter(
        CostRecord.cloud_account_id == account.id
    ).scalar()

    if latest_period:
        monthly_cost = db.query(func.sum(CostRecord.amount)).filter(
            CostRecord.cloud_account_id == account.id,
            CostRecord.period_date == latest_period
        ).scalar() or 0.0
    else:
        # Fallback to sum of monthly_cost in Resource table if cost records are absent
        monthly_cost = db.query(func.sum(Resource.monthly_cost)).filter(
            Resource.cloud_account_id == account.id
        ).scalar() or 0.0

    # 3. Security Aggregations
    sec_rows = db.query(
        SecurityFinding.severity, func.count(SecurityFinding.id)
    ).filter(
        SecurityFinding.cloud_account_id == account.id
    ).group_by(SecurityFinding.severity).all()

    sev_counts = {sev.lower(): count for sev, count in sec_rows}
    total_findings = sum(sev_counts.values())
    security_findings_summary = {
        "critical": sev_counts.get("critical", 0),
        "high": sev_counts.get("high", 0),
        "medium": sev_counts.get("medium", 0),
        "low": sev_counts.get("low", 0),
        "total": total_findings
    }

    # 4. Recommendation Aggregations
    rec_count = db.query(func.count(Recommendation.id)).filter(
        Recommendation.cloud_account_id == account.id
    ).scalar() or 0

    total_savings = db.query(func.sum(Recommendation.estimated_savings)).filter(
        Recommendation.cloud_account_id == account.id
    ).scalar() or 0.0

    # 5. Latest Scan Summary
    latest_scan_job = db.query(ScanJob).filter(
        ScanJob.cloud_account_id == account.id
    ).order_by(ScanJob.created_at.desc()).first()

    latest_scan_data = None
    if latest_scan_job:
        latest_scan_data = {
            "id": latest_scan_job.id,
            "cloud_account_id": latest_scan_job.cloud_account_id,
            "status": latest_scan_job.status,
            "progress": latest_scan_job.progress,
            "current_step": latest_scan_job.current_step,
            "resources_discovered": total_resources,
            "error_message": latest_scan_job.error_message,
            "created_at": latest_scan_job.created_at,
            "completed_at": latest_scan_job.completed_at
        }

    return {
        "accountId": account.id,
        "accountName": account.account_name,
        "accountType": account.account_type,
        "healthScore": account.health_score,
        "totalResources": total_resources,
        "resourcesByType": resources_by_type,
        "totalCost": round(total_cost, 2),
        "monthlyCost": round(monthly_cost, 2),
        "securityFindings": security_findings_summary,
        "recommendationsCount": rec_count,
        "totalEstimatedSavings": round(total_savings, 2),
        "latestScan": latest_scan_data
    }

def get_resource_summary(db: Session, user: User, account_id: Optional[UUID] = None) -> dict:
    """
    Returns breakdown of cloud resources by type, region, and running status.
    """
    account = get_user_cloud_account(db, user, account_id)

    total_resources = db.query(func.count(Resource.id)).filter(
        Resource.cloud_account_id == account.id
    ).scalar() or 0

    # Group by Type
    type_rows = db.query(Resource.type, func.count(Resource.id)).filter(
        Resource.cloud_account_id == account.id
    ).group_by(Resource.type).all()
    by_type = {r_type: count for r_type, count in type_rows}

    # Group by Region
    region_rows = db.query(Resource.region, func.count(Resource.id)).filter(
        Resource.cloud_account_id == account.id
    ).group_by(Resource.region).all()
    by_region = {region: count for region, count in region_rows}

    # Group by Status
    status_rows = db.query(Resource.status, func.count(Resource.id)).filter(
        Resource.cloud_account_id == account.id
    ).group_by(Resource.status).all()
    by_status = {r_status: count for r_status, count in status_rows}

    return {
        "totalResources": total_resources,
        "byType": by_type,
        "byRegion": by_region,
        "byStatus": by_status
    }

def get_cost_summary(db: Session, user: User, account_id: Optional[UUID] = None) -> dict:
    """
    Calculates cost summary analytics including latest vs. previous month comparison.
    """
    account = get_user_cloud_account(db, user, account_id)

    total_cost = db.query(func.sum(CostRecord.amount)).filter(
        CostRecord.cloud_account_id == account.id
    ).scalar() or 0.0

    # Get distinct period dates in descending order
    distinct_dates = db.query(CostRecord.period_date).filter(
        CostRecord.cloud_account_id == account.id
    ).distinct().order_by(CostRecord.period_date.desc()).all()

    dates = [d[0] for d in distinct_dates]

    latest_month_cost = 0.0
    previous_month_cost = None
    difference = None
    percentage_change = None

    if len(dates) >= 1:
        latest_date = dates[0]
        latest_month_cost = db.query(func.sum(CostRecord.amount)).filter(
            CostRecord.cloud_account_id == account.id,
            CostRecord.period_date == latest_date
        ).scalar() or 0.0

        if len(dates) >= 2:
            prev_date = dates[1]
            previous_month_cost = db.query(func.sum(CostRecord.amount)).filter(
                CostRecord.cloud_account_id == account.id,
                CostRecord.period_date == prev_date
            ).scalar() or 0.0

            difference = round(latest_month_cost - previous_month_cost, 2)
            if previous_month_cost > 0:
                percentage_change = round(((latest_month_cost - previous_month_cost) / previous_month_cost) * 100, 2)
    else:
        # Fallback to resources monthly cost if no cost records exist
        latest_month_cost = db.query(func.sum(Resource.monthly_cost)).filter(
            Resource.cloud_account_id == account.id
        ).scalar() or 0.0

    # Cost breakdown by service for latest period or overall
    if len(dates) >= 1:
        service_rows = db.query(
            CostRecord.service_name, func.sum(CostRecord.amount)
        ).filter(
            CostRecord.cloud_account_id == account.id,
            CostRecord.period_date == dates[0]
        ).group_by(CostRecord.service_name).order_by(func.sum(CostRecord.amount).desc()).all()
        cost_by_service = [{"service": s_name, "cost": round(amt, 2)} for s_name, amt in service_rows]
    else:
        res_service_rows = db.query(
            Resource.type, func.sum(Resource.monthly_cost)
        ).filter(
            Resource.cloud_account_id == account.id
        ).group_by(Resource.type).order_by(func.sum(Resource.monthly_cost).desc()).all()
        cost_by_service = [{"service": r_type, "cost": round(amt, 2)} for r_type, amt in res_service_rows]

    return {
        "totalCost": round(total_cost, 2),
        "latestMonthCost": round(latest_month_cost, 2),
        "previousMonthCost": round(previous_month_cost, 2) if previous_month_cost is not None else None,
        "difference": difference,
        "percentageChange": percentage_change,
        "costByService": cost_by_service
    }

def get_cost_trend(db: Session, user: User, account_id: Optional[UUID] = None) -> dict:
    """
    Aggregates historical monthly cost totals ordered chronologically for charting.
    """
    account = get_user_cloud_account(db, user, account_id)

    trend_rows = db.query(
        CostRecord.period_date, func.sum(CostRecord.amount)
    ).filter(
        CostRecord.cloud_account_id == account.id
    ).group_by(CostRecord.period_date).order_by(CostRecord.period_date.asc()).all()

    trend = [
        {
            "period": p_date.strftime("%Y-%m"),
            "cost": round(total_amt, 2)
        }
        for p_date, total_amt in trend_rows
    ]

    return {"trend": trend}

def get_cost_by_service(db: Session, user: User, account_id: Optional[UUID] = None) -> dict:
    """
    Aggregates overall historical cost by service across all cost records.
    """
    account = get_user_cloud_account(db, user, account_id)

    service_rows = db.query(
        CostRecord.service_name, func.sum(CostRecord.amount)
    ).filter(
        CostRecord.cloud_account_id == account.id
    ).group_by(CostRecord.service_name).order_by(func.sum(CostRecord.amount).desc()).all()

    services = [
        {
            "service": s_name,
            "cost": round(total_amt, 2)
        }
        for s_name, total_amt in service_rows
    ]

    return {"services": services}

def get_security_summary(db: Session, user: User, account_id: Optional[UUID] = None) -> dict:
    """
    Aggregates security findings by severity and status.
    """
    account = get_user_cloud_account(db, user, account_id)

    total_findings = db.query(func.count(SecurityFinding.id)).filter(
        SecurityFinding.cloud_account_id == account.id
    ).scalar() or 0

    # Severity counts
    sev_rows = db.query(
        SecurityFinding.severity, func.count(SecurityFinding.id)
    ).filter(
        SecurityFinding.cloud_account_id == account.id
    ).group_by(SecurityFinding.severity).all()

    by_severity = {"Critical": 0, "High": 0, "Medium": 0, "Low": 0}
    for sev, count in sev_rows:
        if sev in by_severity:
            by_severity[sev] = count
        else:
            by_severity[sev] = count

    # Status counts
    status_rows = db.query(
        SecurityFinding.status, func.count(SecurityFinding.id)
    ).filter(
        SecurityFinding.cloud_account_id == account.id
    ).group_by(SecurityFinding.status).all()

    by_status = {"Active": 0, "Resolved": 0, "Dismissed": 0}
    for stat, count in status_rows:
        by_status[stat] = count

    return {
        "totalFindings": total_findings,
        "bySeverity": by_severity,
        "byStatus": by_status
    }

def get_recommendation_summary(db: Session, user: User, account_id: Optional[UUID] = None) -> dict:
    """
    Aggregates cost optimization recommendations and estimated savings.
    """
    account = get_user_cloud_account(db, user, account_id)

    total_recommendations = db.query(func.count(Recommendation.id)).filter(
        Recommendation.cloud_account_id == account.id
    ).scalar() or 0

    total_savings = db.query(func.sum(Recommendation.estimated_savings)).filter(
        Recommendation.cloud_account_id == account.id
    ).scalar() or 0.0

    prio_rows = db.query(
        Recommendation.priority, func.count(Recommendation.id)
    ).filter(
        Recommendation.cloud_account_id == account.id
    ).group_by(Recommendation.priority).all()

    by_priority = {"High": 0, "Medium": 0, "Low": 0}
    for prio, count in prio_rows:
        by_priority[prio] = count

    recommendations_list = db.query(Recommendation).filter(
        Recommendation.cloud_account_id == account.id
    ).order_by(Recommendation.created_at.desc()).all()

    recs = [
        {
            "id": r.id,
            "title": r.title,
            "resource": r.resource,
            "priority": r.priority,
            "description": r.description,
            "estimatedSavings": round(r.estimated_savings, 2)
        }
        for r in recommendations_list
    ]

    return {
        "totalRecommendations": total_recommendations,
        "totalEstimatedSavings": round(total_savings, 2),
        "byPriority": by_priority,
        "recommendations": recs
    }

def get_latest_scan_summary(db: Session, user: User, account_id: Optional[UUID] = None) -> Optional[dict]:
    """
    Returns the most recent ScanJob details for the cloud account.
    """
    account = get_user_cloud_account(db, user, account_id)

    latest_scan_job = db.query(ScanJob).filter(
        ScanJob.cloud_account_id == account.id
    ).order_by(ScanJob.created_at.desc()).first()

    if not latest_scan_job:
        return None

    resources_count = db.query(func.count(Resource.id)).filter(
        Resource.cloud_account_id == account.id
    ).scalar() or 0

    return {
        "id": latest_scan_job.id,
        "cloud_account_id": latest_scan_job.cloud_account_id,
        "status": latest_scan_job.status,
        "progress": latest_scan_job.progress,
        "current_step": latest_scan_job.current_step,
        "resources_discovered": resources_count,
        "error_message": latest_scan_job.error_message,
        "created_at": latest_scan_job.created_at,
        "completed_at": latest_scan_job.completed_at
    }
