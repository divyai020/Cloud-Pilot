from uuid import UUID
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.schemas.dashboard import (
    DashboardSummaryResponse,
    ResourceSummaryResponse,
    CostSummaryResponse,
    CostTrendResponse,
    CostByServiceResponse,
    SecuritySummaryResponse,
    RecommendationSummaryResponse,
    LatestScanResponse
)
from app.schemas.analytics import HealthScoreResponse, CostForecastResponse
from app.services import dashboard_service
from app.auth.dependencies import get_db, get_current_user
from app.models.user import User

router = APIRouter(prefix="/dashboard", tags=["Dashboard & Cost Analysis"])

@router.get("/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(
    account_id: Optional[UUID] = Query(None, alias="account_id", description="Target cloud account UUID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Dashboard Summary Endpoint:
    Returns overall cloud account summary including resource counts, monthly costs,
    security finding breakdown, recommendation savings, and scan status.
    """
    summary = dashboard_service.get_dashboard_summary(db, user=current_user, account_id=account_id)
    return summary

@router.get("/resources", response_model=ResourceSummaryResponse)
def get_resource_summary(
    account_id: Optional[UUID] = Query(None, alias="account_id", description="Target cloud account UUID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Resource Summary Endpoint:
    Returns breakdown of cloud resources grouped by type, region, and status.
    """
    summary = dashboard_service.get_resource_summary(db, user=current_user, account_id=account_id)
    return summary

@router.get("/cost-summary", response_model=CostSummaryResponse)
def get_cost_summary(
    account_id: Optional[UUID] = Query(None, alias="account_id", description="Target cloud account UUID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Cost Summary Endpoint:
    Calculates total cost, latest month cost vs. previous month cost, percentage change, and service breakdown.
    """
    summary = dashboard_service.get_cost_summary(db, user=current_user, account_id=account_id)
    return summary

@router.get("/cost-trend", response_model=CostTrendResponse)
def get_cost_trend(
    account_id: Optional[UUID] = Query(None, alias="account_id", description="Target cloud account UUID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Cost Trend Endpoint:
    Returns chronological monthly spending history suitable for frontend charts.
    """
    trend = dashboard_service.get_cost_trend(db, user=current_user, account_id=account_id)
    return trend

@router.get("/cost-by-service", response_model=CostByServiceResponse)
def get_cost_by_service(
    account_id: Optional[UUID] = Query(None, alias="account_id", description="Target cloud account UUID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Cost By Service Endpoint:
    Aggregates historical cloud spending grouped by AWS service.
    """
    services = dashboard_service.get_cost_by_service(db, user=current_user, account_id=account_id)
    return services

@router.get("/security-summary", response_model=SecuritySummaryResponse)
def get_security_summary(
    account_id: Optional[UUID] = Query(None, alias="account_id", description="Target cloud account UUID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Security Summary Endpoint:
    Returns security findings counts grouped by severity and active/resolved status.
    """
    summary = dashboard_service.get_security_summary(db, user=current_user, account_id=account_id)
    return summary

@router.get("/recommendations", response_model=RecommendationSummaryResponse)
def get_recommendation_summary(
    account_id: Optional[UUID] = Query(None, alias="account_id", description="Target cloud account UUID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Recommendations Summary Endpoint:
    Returns cost optimization suggestions, total potential savings, and priority counts.
    """
    summary = dashboard_service.get_recommendation_summary(db, user=current_user, account_id=account_id)
    return summary

@router.get("/latest-scan", response_model=Optional[LatestScanResponse])
def get_latest_scan(
    account_id: Optional[UUID] = Query(None, alias="account_id", description="Target cloud account UUID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Latest Scan Endpoint:
    Retrieves status and metadata for the most recent scan job executed for the cloud account.
    """
    latest_scan = dashboard_service.get_latest_scan_summary(db, user=current_user, account_id=account_id)
    return latest_scan

@router.get("/health", response_model=HealthScoreResponse)
def get_dashboard_health(
    account_id: Optional[UUID] = Query(None, alias="account_id", description="Target cloud account UUID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Dashboard Health Endpoint:
    Calculates cloud health score (0-100) and updates persisted health score in PostgreSQL.
    """
    from app.services import health_service
    return health_service.calculate_cloud_health_score(db, user=current_user, account_id=account_id)

@router.get("/cost-forecast", response_model=CostForecastResponse)
def get_dashboard_cost_forecast(
    account_id: Optional[UUID] = Query(None, alias="account_id", description="Target cloud account UUID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Dashboard Cost Forecast Endpoint:
    Uses Scikit-learn Machine Learning (LinearRegression) to predict future monthly spend trends.
    """
    from app.services import forecast_service
    return forecast_service.generate_cost_forecast(db, user=current_user, account_id=account_id)
